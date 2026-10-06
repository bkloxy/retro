(function () {
    'use strict';

    // ===================== НАСТРОЙКИ =====================
    var RADIUS = '0.25em';       // скругление углов постеров и актёров. Поставь '0' для строго острых углов
    var FOCUS_SCALE = 1.05;      // насколько увеличивается карточка при наведении (1 = не увеличивать)
    var TOP_ROW = 4;             // Топ 10 стоит на 4-м ряду главной
    var GENRE_ROW = 5;           // Жанры (квадратные плитки) стоят на 5-м ряду главной
    var RED = '#e50914';         // красный Netflix для полоски прогресса

    var T_CONTINUE = 'Продолжить просмотр';
    var T_TOP_ALL = 'Топ 10 за неделю';
    var T_TOP_MOVIE = 'Топ 10 фильмов за неделю';
    var T_TOP_TV = 'Топ 10 сериалов за неделю';
    var T_GENRES = 'Жанры';

    // type: movie / tv, id: номер жанра в TMDB
    var GENRES = [
        { n: 'Боевики', t: 'movie', id: 28 },
        { n: 'Комедии', t: 'movie', id: 35 },
        { n: 'Драмы', t: 'movie', id: 18 },
        { n: 'Ужасы', t: 'movie', id: 27 },
        { n: 'Фантастика', t: 'movie', id: 878 },
        { n: 'Триллеры', t: 'movie', id: 53 },
        { n: 'Мелодрамы', t: 'movie', id: 10749 },
        { n: 'Мультфильмы', t: 'movie', id: 16 },
        { n: 'Приключения', t: 'movie', id: 12 },
        { n: 'Криминал', t: 'movie', id: 80 },
        { n: 'Детективные сериалы', t: 'tv', id: 9648 },
        { n: 'Документальные', t: 'movie', id: 99 }
    ];
    var COLORS = ['#b3123b', '#1b5fa8', '#2e7d4f', '#7b3fa0', '#c2631a', '#0e7c86',
        '#a02c5a', '#3d4db7', '#6d7a1a', '#8a2be2', '#b8860b', '#2f6f6f'];

    // ===================== ХЕЛПЕРЫ =====================
    var continueMeta = []; // подписи и прогресс для ряда «Продолжить просмотр»

    function tmdb(path, cb) {
        try {
            var net = new Lampa.Reguest();
            var url = Lampa.TMDB.api(path + (path.indexOf('?') > -1 ? '&' : '?') +
                'api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru'));
            net.silent(url, function (json) { cb(json); }, function () { cb(null); });
        } catch (e) { cb(null); }
    }

    function row(title, results) {
        return { title: title, results: results, source: 'tmdb' };
    }

    function top10(path, title, cb) {
        tmdb(path, function (json) {
            if (!json || !json.results || !json.results.length) return cb(null);
            cb(row(title, json.results.slice(0, 10)));
        });
    }

    // ----- Продолжить просмотр: сколько минут посмотрено -----
    function minutes(sec) { return Math.round((sec || 0) / 60); }

    function getProgress(card) {
        try {
            var title = card.original_title || card.original_name;
            if (!title) return null;
            var tl = Lampa.Timeline;
            var isTv = !!(card.name || card.original_name || card.number_of_seasons || card.first_air_date);

            if (!isTv) {
                var v = tl.view(Lampa.Utils.hash(title));
                if (v && v.percent > 0 && v.percent < 95) {
                    return { percent: v.percent, label: 'Просмотрено ' + minutes(v.time) + ' из ' + minutes(v.duration) + ' мин' };
                }
                return null;
            }

            var seasons = card.number_of_seasons || 15, best = null;
            for (var s = 1; s <= seasons; s++) {
                for (var e = 1; e <= 60; e++) {
                    var h = Lampa.Utils.hash([s, s > 10 ? ':' : '', e, title].join(''));
                    var view = tl.view(h);
                    if (view && view.percent > 0) best = { s: s, e: e, v: view };
                }
            }
            if (!best) return null;
            var tag = 'С' + best.s + ' Э' + best.e;
            if (best.v.percent >= 95) return { percent: 100, label: tag + ' · просмотрена' };
            return { percent: best.v.percent, label: tag + ' · ' + minutes(best.v.time) + ' из ' + minutes(best.v.duration) + ' мин' };
        } catch (e) { return null; }
    }

    function continueRow() {
        try {
            var hist = (Lampa.Favorite.get({ type: 'history' }) || []).slice(0, 25);
            var results = [], meta = [];
            hist.forEach(function (card) {
                var p = getProgress(card);
                if (!p || results.length >= 15) return;
                results.push($.extend({}, card));
                meta.push({
                    percent: p.percent,
                    label: p.label,
                    backdrop: card.backdrop_path ? Lampa.TMDB.image('t/p/w500' + card.backdrop_path) : ''
                });
            });
            if (!results.length) return null;
            continueMeta = meta;
            return row(T_CONTINUE, results);
        } catch (e) { return null; }
    }

    // ----- Жанры: квадратные плитки -----
    function genreRow() {
        var results = GENRES.map(function (g, i) {
            return {
                id: 'nf_g_' + g.t + '_' + g.id,
                title: g.n,
                name: g.n,
                poster_path: '',
                backdrop_path: '',
                vote_average: 0,
                release_date: '',
                nf_genre: i
            };
        });
        return row(T_GENRES, results);
    }

    // клик по плитке жанра открывает каталог этого жанра
    function patchActivity() {
        var origPush = Lampa.Activity.push;
        Lampa.Activity.push = function (p) {
            var id = p && String(p.id || '');
            if (p && p.component === 'full' && id.indexOf('nf_g_') === 0) {
                var parts = id.split('_'); // nf, g, movie, 28
                var g = GENRES.filter(function (x) { return x.t === parts[2] && String(x.id) === parts[3]; })[0];
                return origPush.call(Lampa.Activity, {
                    url: 'discover/' + parts[2],
                    title: g ? g.n : 'Жанр',
                    component: 'category_full',
                    genres: parts[3],
                    source: 'tmdb',
                    page: 1
                });
            }
            return origPush.apply(Lampa.Activity, arguments);
        };
    }

    // ===================== ГЛАВНАЯ =====================
    function patchMain() {
        var src = Lampa.Api.sources.tmdb;
        var origMain = src.main;
        src.main = function (params, oncomplete, onerror) {
            var first = true;
            return origMain.call(src, params, function (data) {
                if (!first || !Array.isArray(data)) return oncomplete(data);
                first = false;
                top10('trending/all/week', T_TOP_ALL, function (top) {
                    var cont = continueRow();
                    if (cont) data.unshift(cont);
                    if (top) data.splice(Math.min(TOP_ROW - 1, data.length), 0, top);
                    data.splice(Math.min(GENRE_ROW - 1, data.length), 0, genreRow());
                    oncomplete(data);
                });
            }, onerror);
        };
    }

    // ===================== ФИЛЬМЫ / СЕРИАЛЫ =====================
    function patchCategory() {
        var src = Lampa.Api.sources.tmdb;
        var origCat = src.category;
        src.category = function (params, oncomplete, onerror) {
            var first = true;
            var isMovie = params && params.url === 'movie';
            var isTv = params && params.url === 'tv';
            return origCat.call(src, params, function (data) {
                if (!first || !Array.isArray(data) || !(isMovie || isTv)) return oncomplete(data);
                first = false;
                top10(isMovie ? 'trending/movie/week' : 'trending/tv/week',
                    isMovie ? T_TOP_MOVIE : T_TOP_TV,
                    function (top) {
                        if (top) data.unshift(top);
                        oncomplete(data);
                    });
            }, onerror);
        };
    }

    // ===================== ОФОРМЛЕНИЕ РЯДОВ (после отрисовки) =====================
    function decorate() {
        $('.items-line').each(function () {
            var line = $(this);
            var t = $.trim(line.find('.items-line__title').first().text());

            if (t === T_TOP_ALL || t === T_TOP_MOVIE || t === T_TOP_TV) {
                line.find('.card').each(function (i) {
                    var card = $(this);
                    if (card.find('.nf-rank').length) return;
                    card.find('.card__view').append('<div class="nf-rank">' + (i + 1) + '</div>');
                });
            }

            if (t === T_CONTINUE) {
                line.addClass('nf-continue');
                line.find('.card').each(function (i) {
                    var card = $(this), m = continueMeta[i];
                    if (!m || card.attr('data-nf')) return;
                    card.attr('data-nf', 1);
                    if (m.backdrop) card.find('.card__img').attr('src', m.backdrop);
                    card.find('.card__view').append('<div class="nf-progress"><i style="width:' + Math.min(100, m.percent) + '%"></i></div>');
                    card.append('<div class="nf-label">' + m.label + '</div>');
                });
            }

            if (t === T_GENRES) {
                line.addClass('nf-genres');
                line.find('.card').each(function (i) {
                    var card = $(this);
                    if (card.attr('data-nf')) return;
                    card.attr('data-nf', 1);
                    var name = card.find('.card__title').text() || GENRES[i].n;
                    card.find('.card__view').css('background',
                        'linear-gradient(135deg,' + COLORS[i % COLORS.length] + ',#111)')
                        .append('<div class="nf-genre-name">' + name + '</div>');
                });
            }
        });
    }

    var timer;
    function schedule() { clearTimeout(timer); timer = setTimeout(decorate, 120); }

    // ===================== СТИЛИ =====================
    function addStyles() {
        var css = '' +
            // прямоугольные постеры
            '.card__view,.card__img{border-radius:' + RADIUS + '!important}' +
            '.card .card__view::after{border-radius:' + RADIUS + '!important}' +
            '.full-start__poster,.full-start-new__poster,.full-start__img,.full-start-new__img{border-radius:' + RADIUS + '!important}' +
            // актёры — прямоугольные фото вместо круглых
            '.full-person__photo{border-radius:' + RADIUS + '!important;width:6em!important;height:9em!important;overflow:hidden}' +
            '.full-person__photo img{width:100%!important;height:100%!important;object-fit:cover}' +
            // плавное увеличение карточки при наведении
            '.items-line .card{transition:transform .2s ease}' +
            '.items-line .card.focus{transform:scale(' + FOCUS_SCALE + ');z-index:3}' +
            // заголовки рядов
            '.items-line__title{font-weight:700}' +
            // цифры Топ 10
            '.nf-rank{position:absolute;left:-.05em;bottom:-.15em;font-size:5em;font-weight:900;line-height:1;' +
            'color:#000;-webkit-text-stroke:.03em #fff;text-shadow:0 0 .3em rgba(0,0,0,.8);z-index:5;pointer-events:none}' +
            // продолжить просмотр: широкие карточки
            '.nf-continue .card{width:21em!important}' +
            '.nf-continue .card__view{padding-bottom:56%!important}' +
            '.nf-continue .card__img{object-fit:cover}' +
            '.nf-progress{position:absolute;left:0;right:0;bottom:0;height:.35em;background:rgba(255,255,255,.3);z-index:5}' +
            '.nf-progress i{display:block;height:100%;background:' + RED + '}' +
            '.nf-label{margin-top:.3em;font-size:1.05em;opacity:.75}' +
            // жанры: квадратные плитки
            '.nf-genres .card{width:13em!important}' +
            '.nf-genres .card__view{padding-bottom:100%!important}' +
            '.nf-genres .card__img,.nf-genres .card__title,.nf-genres .card__age,.nf-genres .card__vote{display:none!important}' +
            '.nf-genre-name{position:absolute;left:0;right:0;bottom:0;padding:.8em;font-size:1.5em;font-weight:800;' +
            'line-height:1.1;color:#fff;text-shadow:0 .1em .4em rgba(0,0,0,.6);z-index:4}' +
            // бюджет и сборы на карточке фильма
            '.nf-money{display:flex;flex-wrap:wrap;gap:.6em;margin:.8em 0}' +
            '.nf-money__item{display:inline-block;padding:.35em .8em;border-radius:' + RADIUS + ';' +
            'background:rgba(255,255,255,.12);font-weight:700;font-size:1.1em}' +
            '.nf-money__item i{font-style:normal;font-weight:400;opacity:.65;margin-right:.3em}' +
            '.nf-money__item--rev{background:rgba(229,9,20,.28)}';
        $('body').append('<style id="nf-style">' + css + '</style>');
    }

    // ===================== МЕНЮ: ПОИСК ПЕРВЫМ =====================
    function menuSearchFirst() {
        try {
            var list = $('.menu .menu__list').eq(0);
            var search = list.find('.menu__item').filter(function () {
                return $(this).data('action') === 'search' || /Поиск|Search/i.test($(this).text());
            }).first();
            if (search.length) list.prepend(search);
        } catch (e) { }
    }

    // ===================== БЮДЖЕТ И СБОРЫ НА КАРТОЧКЕ ФИЛЬМА =====================
    function formatMoney(num) {
        if (!num || num <= 0) return null;
        if (num >= 1e9) return '$' + (num / 1e9).toFixed(1).replace('.', ',') + ' млрд';
        if (num >= 1e6) return '$' + Math.round(num / 1e6) + ' млн';
        return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function addMoney() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            try {
                var movie = e.data.movie;
                if (!movie) return;
                var budget = formatMoney(movie.budget);
                var revenue = formatMoney(movie.revenue);
                if (!budget && !revenue) return; // у сериалов и новых фильмов данных обычно нет

                var render = e.object.activity.render();
                if (render.find('.nf-money').length) return;

                var details = render.find('.full-start-new__details, .full-start__details').first();
                if (!details.length) return;

                var html = '<div class="nf-money">';
                if (budget) html += '<span class="nf-money__item"><i>Бюджет</i> ' + budget + '</span>';
                if (revenue) html += '<span class="nf-money__item nf-money__item--rev"><i>Сборы</i> ' + revenue + '</span>';
                html += '</div>';
                details.after(html);
            } catch (err) { }
        });
    }

    // ===================== СТАРТ =====================
    function start() {
        if (window.netflix_style_ready) return;
        window.netflix_style_ready = true;

        addStyles();
        patchActivity();
        patchMain();
        patchCategory();
        addMoney();
        menuSearchFirst();
        setTimeout(menuSearchFirst, 1500);

        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

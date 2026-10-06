(function () {
    'use strict';

    // ====== НАСТРОЙКИ ======
    var TOP_POSITION = 3; // на каком по счёту ряду главной стоит Топ 10
    var HOME_GENRES = [
        { t: 'Боевики', url: 'discover/movie?with_genres=28&sort_by=popularity.desc' },
        { t: 'Комедии', url: 'discover/movie?with_genres=35&sort_by=popularity.desc' },
        { t: 'Драмы', url: 'discover/movie?with_genres=18&sort_by=popularity.desc' },
        { t: 'Ужасы', url: 'discover/movie?with_genres=27&sort_by=popularity.desc' },
        { t: 'Фантастика', url: 'discover/movie?with_genres=878&sort_by=popularity.desc' },
        { t: 'Триллеры', url: 'discover/movie?with_genres=53&sort_by=popularity.desc' },
        { t: 'Мультфильмы', url: 'discover/movie?with_genres=16&sort_by=popularity.desc' },
        { t: 'Детективные сериалы', url: 'discover/tv?with_genres=9648&sort_by=popularity.desc' },
        { t: 'Документальные', url: 'discover/movie?with_genres=99&sort_by=popularity.desc' }
    ];
    var TITLE_ALL = 'Топ 10 за неделю';
    var TITLE_MOVIE = 'Топ 10 фильмов за неделю';
    var TITLE_TV = 'Топ 10 сериалов за неделю';

    // ====== ХЕЛПЕРЫ ======
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

    function continueRow() {
        try {
            var list = [];
            if (typeof Lampa.Favorite.continues === 'function') {
                list = list.concat(Lampa.Favorite.continues('movie') || [], Lampa.Favorite.continues('tv') || []);
            } else {
                list = Lampa.Favorite.get({ type: 'history' }) || [];
            }
            if (!list.length) return null;
            return row('Продолжить просмотр', list.slice(0, 20));
        } catch (e) { return null; }
    }

    function loadMany(items, done) {
        var out = new Array(items.length), left = items.length;
        if (!left) return done([]);
        items.forEach(function (it, i) {
            tmdb(it.url, function (json) {
                if (json && json.results && json.results.length) out[i] = row(it.t, json.results);
                if (--left === 0) done(out.filter(Boolean));
            });
        });
    }

    // ====== ГЛАВНАЯ ======
    function patchMain() {
        var src = Lampa.Api.sources.tmdb;
        var origMain = src.main;
        src.main = function (params, oncomplete, onerror) {
            var first = true;
            return origMain.call(src, params, function (data) {
                if (!first || !Array.isArray(data)) return oncomplete(data);
                first = false;
                top10('trending/all/week', TITLE_ALL, function (top) {
                    loadMany(HOME_GENRES, function (genres) {
                        if (top) data.splice(Math.min(TOP_POSITION, data.length), 0, top);
                        var cont = continueRow();
                        if (cont) data.unshift(cont);
                        genres.forEach(function (g) { data.push(g); });
                        oncomplete(data);
                    });
                });
            }, onerror);
        };
    }

    // ====== ФИЛЬМЫ / СЕРИАЛЫ ======
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
                    isMovie ? TITLE_MOVIE : TITLE_TV,
                    function (top) {
                        if (top) data.unshift(top);
                        oncomplete(data);
                    });
            }, onerror);
        };
    }

    // ====== ЦИФРЫ НА ПОСТЕРАХ ТОП 10 ======
    function addRanks() {
        var titles = [TITLE_ALL, TITLE_MOVIE, TITLE_TV];
        $('.items-line').each(function () {
            var line = $(this);
            var t = $.trim(line.find('.items-line__title').first().text());
            if (titles.indexOf(t) === -1) return;
            line.find('.card').each(function (i) {
                var card = $(this);
                if (card.find('.top10-rank').length) return;
                card.find('.card__view').append('<div class="top10-rank">' + (i + 1) + '</div>');
            });
        });
    }

    function addStyles() {
        $('body').append('<style>' +
            '.top10-rank{position:absolute;left:-0.1em;bottom:-0.15em;font-size:5em;font-weight:900;line-height:1;' +
            'color:#000;-webkit-text-stroke:0.03em #fff;text-shadow:0 0 .3em rgba(0,0,0,.8);z-index:5;pointer-events:none}' +
            '</style>');
    }

    // ====== МЕНЮ: ПОИСК ПЕРВЫМ ======
    function menuSearchFirst() {
        try {
            var list = $('.menu .menu__list').eq(0);
            var search = list.find('.menu__item').filter(function () {
                return $(this).data('action') === 'search' || /Поиск|Search/i.test($(this).text());
            }).first();
            if (search.length) list.prepend(search);
        } catch (e) { }
    }

    // ====== СТАРТ ======
    function start() {
        if (window.netflix_style_ready) return;
        window.netflix_style_ready = true;

        addStyles();
        patchMain();
        patchCategory();
        menuSearchFirst();
        setTimeout(menuSearchFirst, 1500);

        new MutationObserver(function () { addRanks(); })
            .observe(document.body, { childList: true, subtree: true });
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

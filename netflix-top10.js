(function () {
    'use strict';

    // ===================== НАСТРОЙКИ =====================
    var RADIUS = '0.25em';
    var FOCUS_SCALE = 1.05;
    var TOP_ROW = 4;
    var GENRE_ROW = 5;
    var RED = '#e50914';

    var T_CONTINUE = 'Продолжить просмотр';
    var T_TOP_ALL = 'Топ 10 за неделю';
    var T_TOP_MOVIE = 'Топ 10 фильмов за неделю';
    var T_TOP_TV = 'Топ 10 сериалов за неделю';
    var T_GENRES = 'Жанры';

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

    var continueMeta = [];

    // ===================== ХЕЛПЕРЫ =====================
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

    function patchActivity() {
        var origPush = Lampa.Activity.push;
        Lampa.Activity.push = function (p) {
            var id = p && String(p.id || '');
            if (p && p.component === 'full' && id.indexOf('nf_g_') === 0) {
                var parts = id.split('_');
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

    // ===================== ГЛАВНАЯ И КАТЕГОРИИ =====================
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

    // ===================== ОФОРМЛЕНИЕ РЯДОВ =====================
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

    // ===================== СТИЛИ ИНТЕРФЕЙСА =====================
    function addStyles() {
        var css = '' +
            '.card__view, .card__img {border-radius:' + RADIUS + '!important}' +
            '.card .card__view::after {border-radius:' + RADIUS + '!important}' +
            '.full-start__poster, .full-start-new__poster, .full-start__img, .full-start-new__img {border-radius:' + RADIUS + '!important}' +
            '.items-line__icon, .items-line__icon .card__view, .items-line__head .card__view { border-radius: 50% !important; padding-bottom: 100% !important; }' +
            '.items-line__head .card, .items-line__icon { width: 2.5em !important; height: 2.5em !important; min-width: 2.5em !important; background: transparent !important; }' +
            '.full-person__photo {border-radius:50%!important}' +
            '.items-line .card {transition:transform .2s ease}' +
            '.items-line .card.focus {transform:scale(' + FOCUS_SCALE + ');z-index:3}' +
            '.items-line__title {font-weight:700}' +
            '.nf-rank {position:absolute;left:-.05em;bottom:-.15em;font-size:5em;font-weight:900;line-height:1;' +
            'color:#000;-webkit-text-stroke:.03em #fff;text-shadow:0 0 .3em rgba(0,0,0,.8);z-index:5;pointer-events:none}' +
            '.nf-continue .card {width:21em!important}' +
            '.nf-continue .card__view {padding-bottom:56%!important}' +
            '.nf-continue .card__img {object-fit:cover}' +
            '.nf-progress {position:absolute;left:0;right:0;bottom:0;height:.35em;background:rgba(255,255,255,.3);z-index:5}' +
            '.nf-progress i {display:block;height:100%;background:' + RED + '}' +
            '.nf-label {margin-top:.3em;font-size:1.05em;opacity:.75}' +
            '.nf-genres .card {width:13em!important}' +
            '.nf-genres .card__view {padding-bottom:100%!important}' +
            '.nf-genres .card__img, .nf-genres .card__title, .nf-genres .card__age, .nf-genres .card__vote {display:none!important}' +
            '.nf-genre-name {position:absolute;left:0;right:0;bottom:0;padding:.8em;font-size:1.5em;font-weight:800;' +
            'line-height:1.1;color:#fff;text-shadow:0 .1em .4em rgba(0,0,0,.6);z-index:4}' +
            '.nf-money {display:flex;flex-wrap:wrap;gap:.6em;margin:.8em 0}' +
            '.nf-money__item {display:inline-block;padding:.35em .8em;border-radius:' + RADIUS + ';background:rgba(255,255,255,.12);font-weight:700;font-size:1.1em}' +
            '.nf-money__item i {font-style:normal;font-weight:400;opacity:.65;margin-right:.3em}' +
            '.nf-money__item--rev {background:rgba(229,9,20,.28)}';
        $('body').append('<style id="nf-style">' + css + '</style>');
    }

    // ===================== БЮДЖЕТ И СБОРЫ =====================
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
                if (!budget && !revenue) return;

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

    // ===================== ПОЛНОЦЕННЫЙ КАСТОМНЫЙ ПЛЕЕР =====================
    var customPlayer = {
        root: null,
        hideTimer: null,
        isVisible: true,
        isDragging: false,
        title: '',
        duration: 0,
        current: 0
    };

    function formatTime(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;
        if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function createCustomPlayerUI() {
        if ($('#nf-custom-player').length) return;

        var html = `
        <div id="nf-custom-player" class="nf-player">
            <div class="nf-player__top">
                <div class="nf-player__title"></div>
                <div class="nf-player__close" tabindex="0">✕</div>
            </div>

            <div class="nf-player__center">
                <div class="nf-player__play-big" tabindex="0">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>

            <div class="nf-player__bottom">
                <div class="nf-player__progress-wrap">
                    <div class="nf-player__time-current">0:00</div>
                    <div class="nf-player__progress">
                        <div class="nf-player__progress-bg"></div>
                        <div class="nf-player__progress-loaded"></div>
                        <div class="nf-player__progress-played"></div>
                        <div class="nf-player__progress-thumb"></div>
                    </div>
                    <div class="nf-player__time-duration">0:00</div>
                </div>

                <div class="nf-player__controls">
                    <div class="nf-player__btn nf-player__skip-back" tabindex="0" title="-10 сек">
                        <svg viewBox="0 0 24 24"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                        <span>10</span>
                    </div>

                    <div class="nf-player__btn nf-player__play" tabindex="0">
                        <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <svg class="icon-pause" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </div>

                    <div class="nf-player__btn nf-player__skip-fwd" tabindex="0" title="+10 сек">
                        <svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>
                        <span>10</span>
                    </div>

                    <div class="nf-player__spacer"></div>

                    <div class="nf-player__btn nf-player__speed" tabindex="0">1x</div>
                </div>
            </div>

            <div class="nf-player__skip-indicator"></div>
        </div>`;

        $('body').append(html);
        customPlayer.root = $('#nf-custom-player');

        // Стили
        var css = `
        #nf-custom-player {
            position: fixed; inset: 0; z-index: 99999;
            background: transparent;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            opacity: 0;
            transition: opacity .25s ease;
            pointer-events: none;
        }
        #nf-custom-player.visible {
            opacity: 1;
            pointer-events: auto;
        }
        #nf-custom-player.hidden-ui .nf-player__top,
        #nf-custom-player.hidden-ui .nf-player__bottom,
        #nf-custom-player.hidden-ui .nf-player__center {
            opacity: 0;
            pointer-events: none;
        }

        .nf-player__top {
            position: absolute; top: 0; left: 0; right: 0;
            padding: 1.8em 2.5em;
            background: linear-gradient(to bottom, rgba(0,0,0,.75), transparent);
            display: flex; align-items: center; justify-content: space-between;
            transition: opacity .3s;
        }
        .nf-player__title {
            font-size: 1.6em; font-weight: 700;
            text-shadow: 0 2px 8px rgba(0,0,0,.8);
            max-width: 80%;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nf-player__close {
            width: 2.8em; height: 2.8em; border-radius: 50%;
            background: rgba(255,255,255,.15);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4em; cursor: pointer;
            transition: background .2s;
        }
        .nf-player__close:hover, .nf-player__close.focus {
            background: rgba(255,255,255,.3);
        }

        .nf-player__center {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity .3s;
        }
        .nf-player__play-big {
            width: 5.5em; height: 5.5em; border-radius: 50%;
            background: rgba(0,0,0,.55);
            border: 3px solid #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: transform .2s, background .2s;
        }
        .nf-player__play-big:hover, .nf-player__play-big.focus {
            transform: scale(1.1);
            background: rgba(229,9,20,.8);
        }
        .nf-player__play-big svg {
            width: 2.2em; height: 2.2em; fill: #fff;
            margin-left: 0.15em;
        }
        .nf-player__play-big.paused svg { margin-left: 0; }

        .nf-player__bottom {
            position: absolute; bottom: 0; left: 0; right: 0;
            padding: 0 2.5em 2em;
            background: linear-gradient(to top, rgba(0,0,0,.85), transparent);
            transition: opacity .3s;
        }

        .nf-player__progress-wrap {
            display: flex; align-items: center; gap: 1.2em;
            margin-bottom: 1.2em;
        }
        .nf-player__time-current, .nf-player__time-duration {
            font-size: 1.15em; font-weight: 600;
            min-width: 3.5em; text-align: center;
        }
        .nf-player__progress {
            flex: 1; height: 0.45em; position: relative;
            cursor: pointer; border-radius: 0.25em;
        }
        .nf-player__progress-bg {
            position: absolute; inset: 0;
            background: rgba(255,255,255,.25);
            border-radius: 0.25em;
        }
        .nf-player__progress-loaded {
            position: absolute; left: 0; top: 0; bottom: 0;
            background: rgba(255,255,255,.4);
            border-radius: 0.25em; width: 0%;
        }
        .nf-player__progress-played {
            position: absolute; left: 0; top: 0; bottom: 0;
            background: ${RED};
            border-radius: 0.25em; width: 0%;
        }
        .nf-player__progress-thumb {
            position: absolute; top: 50%;
            width: 1.1em; height: 1.1em;
            background: #fff; border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 6px rgba(0,0,0,.5);
            left: 0%;
            opacity: 0;
            transition: opacity .2s;
        }
        .nf-player__progress:hover .nf-player__progress-thumb,
        .nf-player__progress.dragging .nf-player__progress-thumb {
            opacity: 1;
        }

        .nf-player__controls {
            display: flex; align-items: center; gap: 1.5em;
        }
        .nf-player__btn {
            width: 2.8em; height: 2.8em;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
            background: rgba(255,255,255,.12);
            cursor: pointer;
            transition: background .2s, transform .15s;
            position: relative;
        }
        .nf-player__btn:hover, .nf-player__btn.focus {
            background: rgba(255,255,255,.28);
            transform: scale(1.08);
        }
        .nf-player__btn svg {
            width: 1.4em; height: 1.4em; fill: #fff;
        }
        .nf-player__skip-back span, .nf-player__skip-fwd span {
            position: absolute; font-size: 0.7em; font-weight: 700;
            bottom: 0.15em; right: 0.25em;
        }
        .nf-player__play {
            width: 3.4em; height: 3.4em;
            background: #fff;
        }
        .nf-player__play svg { fill: #000; width: 1.6em; height: 1.6em; }
        .nf-player__play .icon-play { margin-left: 0.12em; }
        .nf-player__spacer { flex: 1; }
        .nf-player__speed {
            width: auto; padding: 0 1em;
            border-radius: 1.5em; font-weight: 700; font-size: 1.1em;
        }

        .nf-player__skip-indicator {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            font-size: 3.2em; font-weight: 800;
            background: rgba(0,0,0,.65);
            width: 2.8em; height: 2.8em;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            opacity: 0;
            transition: opacity .2s, transform .2s;
            pointer-events: none;
        }
        .nf-player__skip-indicator.show {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        /* Скрываем родной плеер Lampa */
        .player-panel, .player-video__loader, .player__footer, .player-panel__info {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
        `;
        $('body').append('<style id="nf-custom-player-style">' + css + '</style>');
    }

    function showUI() {
        if (!customPlayer.root) return;
        customPlayer.root.removeClass('hidden-ui').addClass('visible');
        customPlayer.isVisible = true;
        clearTimeout(customPlayer.hideTimer);
        customPlayer.hideTimer = setTimeout(hideUI, 3500);
    }

    function hideUI() {
        if (customPlayer.isDragging) return;
        customPlayer.root.addClass('hidden-ui');
        customPlayer.isVisible = false;
    }

    function updateProgress() {
        if (!customPlayer.root || !customPlayer.duration) return;
        var percent = (customPlayer.current / customPlayer.duration) * 100;
        customPlayer.root.find('.nf-player__progress-played').css('width', percent + '%');
        customPlayer.root.find('.nf-player__progress-thumb').css('left', percent + '%');
        customPlayer.root.find('.nf-player__time-current').text(formatTime(customPlayer.current));
        customPlayer.root.find('.nf-player__time-duration').text(formatTime(customPlayer.duration));
    }

    function setPlaying(playing) {
        var playBtn = customPlayer.root.find('.nf-player__play');
        var bigBtn = customPlayer.root.find('.nf-player__play-big');
        if (playing) {
            playBtn.find('.icon-play').hide();
            playBtn.find('.icon-pause').show();
            bigBtn.hide();
        } else {
            playBtn.find('.icon-play').show();
            playBtn.find('.icon-pause').hide();
            bigBtn.show();
        }
    }

    function seekTo(percent) {
        var video = Lampa.PlayerVideo.video();
        if (!video || !customPlayer.duration) return;
        video.currentTime = (percent / 100) * customPlayer.duration;
    }

    function skip(seconds) {
        var video = Lampa.PlayerVideo.video();
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.duration || 999999, video.currentTime + seconds));

        var ind = customPlayer.root.find('.nf-player__skip-indicator');
        ind.html(seconds > 0 ? '10 ↻' : '↺ 10').addClass('show');
        clearTimeout(window.nfSkipTimer);
        window.nfSkipTimer = setTimeout(function () { ind.removeClass('show'); }, 700);
        showUI();
    }

    function togglePlay() {
        var video = Lampa.PlayerVideo.video();
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
        showUI();
    }

    function changeSpeed() {
        var video = Lampa.PlayerVideo.video();
        if (!video) return;
        var speeds = [0.75, 1, 1.25, 1.5, 2];
        var current = video.playbackRate || 1;
        var idx = speeds.indexOf(current);
        var next = speeds[(idx + 1) % speeds.length];
        video.playbackRate = next;
        customPlayer.root.find('.nf-player__speed').text(next + 'x');
        showUI();
    }

    function bindCustomPlayerEvents() {
        var root = customPlayer.root;

        // Кнопки
        root.on('click', '.nf-player__play, .nf-player__play-big', togglePlay);
        root.on('click', '.nf-player__skip-back', function () { skip(-10); });
        root.on('click', '.nf-player__skip-fwd', function () { skip(10); });
        root.on('click', '.nf-player__speed', changeSpeed);
        root.on('click', '.nf-player__close', function () {
            Lampa.Player.close();
        });

        // Прогресс-бар
        var progress = root.find('.nf-player__progress');
        progress.on('mousedown touchstart', function (e) {
            customPlayer.isDragging = true;
            progress.addClass('dragging');
            showUI();
        });

        $(document).on('mousemove.nfplayer touchmove.nfplayer', function (e) {
            if (!customPlayer.isDragging) return;
            var rect = progress[0].getBoundingClientRect();
            var x = (e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX) - rect.left;
            var percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            seekTo(percent);
            updateProgress();
        });

        $(document).on('mouseup.nfplayer touchend.nfplayer', function () {
            if (customPlayer.isDragging) {
                customPlayer.isDragging = false;
                progress.removeClass('dragging');
                showUI();
            }
        });

        progress.on('click', function (e) {
            var rect = this.getBoundingClientRect();
            var percent = ((e.clientX - rect.left) / rect.width) * 100;
            seekTo(percent);
            showUI();
        });

        // Показ UI при движении мыши / нажатии
        root.on('mousemove click touchstart', showUI);

        // Клавиатура
        $(window).on('keydown.nfplayer', function (e) {
            if (!Lampa.Player.opened) return;
            showUI();
            if (e.keyCode === 32 || e.keyCode === 13) { // Space / Enter
                e.preventDefault();
                togglePlay();
            }
            if (e.keyCode === 37) skip(-10); // Left
            if (e.keyCode === 39) skip(10);  // Right
            if (e.keyCode === 27) Lampa.Player.close(); // Esc
        });
    }

    function initCustomPlayer() {
        createCustomPlayerUI();
        bindCustomPlayerEvents();

        Lampa.Listener.follow('player', function (e) {
            if (e.type === 'start') {
                customPlayer.title = e.data?.title || e.object?.movie?.title || e.object?.movie?.name || 'Воспроизведение';
                customPlayer.root.find('.nf-player__title').text(customPlayer.title);
                customPlayer.root.addClass('visible').removeClass('hidden-ui');
                showUI();

                // Прячем родной плеер
                $('.player-panel, .player__footer').hide();
            }

            if (e.type === 'destroy' || e.type === 'close') {
                customPlayer.root.removeClass('visible');
                clearTimeout(customPlayer.hideTimer);
            }
        });

        Lampa.PlayerVideo.listener.follow('timeupdate', function (e) {
            customPlayer.current = e.current || 0;
            customPlayer.duration = e.duration || 0;
            updateProgress();
        });

        Lampa.PlayerVideo.listener.follow('play', function () {
            setPlaying(true);
        });

        Lampa.PlayerVideo.listener.follow('pause', function () {
            setPlaying(false);
            showUI();
        });

        Lampa.PlayerVideo.listener.follow('ended', function () {
            setPlaying(false);
            showUI();
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

        // Кастомный плеер
        initCustomPlayer();

        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

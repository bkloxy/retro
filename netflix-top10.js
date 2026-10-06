(function () {
    'use strict';

    if (window.netflix_top10_native) return;
    window.netflix_top10_native = true;

    var CACHE = 'nft10_cache_v2';
    var CACHE_MS = 12 * 60 * 60 * 1000;

    var FALLBACK = {
        movies: [
            'UNABOMBER', 'Best of the Best', 'A Minecraft Movie', 'Riot',
            'The Whisper Man', 'Black Adam', 'The Ministry of Ungentlemanly Warfare',
            'Why Did I Get Married Again?', 'Top Gun: Maverick', 'KPop Demon Hunters'
        ],
        series: [
            'Monster: The Lizzie Borden Story', 'Wonka\'s The Golden Ticket',
            'Stranger Things', 'Wednesday', 'The Witcher', 'Bridgerton',
            'Squid Game', 'The Crown', 'Outer Banks', 'You'
        ]
    };

    function lang() {
        Lampa.Lang.add({
            nft10_row_movies: { ru: 'Топ-10 Netflix — Фильмы', en: 'Netflix Top 10 — Movies', uk: 'Топ-10 Netflix — Фільми' },
            nft10_row_series: { ru: 'Топ-10 Netflix — Сериалы', en: 'Netflix Top 10 — Series', uk: 'Топ-10 Netflix — Серіали' },
            nft10_settings:   { ru: 'Netflix Top 10', en: 'Netflix Top 10', uk: 'Netflix Top 10' },
            nft10_enabled:    { ru: 'Включить ряды', en: 'Enable rows', uk: 'Увімкнути ряди' },
            nft10_fallback:   { ru: 'Запасной список', en: 'Fallback list', uk: 'Запасний список' },
            nft10_full:       { ru: 'Full Global (EN + non-EN)', en: 'Full Global (EN + non-EN)', uk: 'Full Global (EN + non-EN)' }
        });
    }

    function get(name, def) {
        return Lampa.Storage.get('nft10_' + name, def);
    }

    // ---------- Netflix TSV / fallback ----------
    function parseTSV(text) {
        var lines = String(text || '').trim().split(/\r?\n/);
        if (lines.length < 2) return null;

        var headers = lines[0].split('\t');
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            var cols = lines[i].split('\t');
            if (cols.length < headers.length) continue;
            var o = {};
            for (var h = 0; h < headers.length; h++) o[headers[h]] = cols[h];
            rows.push(o);
        }
        if (!rows.length) return null;

        var weeks = {};
        rows.forEach(function (r) { if (r.week) weeks[r.week] = 1; });
        var latest = Object.keys(weeks).sort().reverse()[0];
        return rows.filter(function (r) { return r.week === latest; });
    }

    function titlesFromRows(rows, kind, full) {
        var map = {};
        (rows || []).forEach(function (r) {
            var cat = String(r.category || '').toLowerCase();
            var rank = parseInt(r.weekly_rank, 10);
            var title = r.show_title || r.season_title || '';
            if (!rank || rank > 10 || !title) return;
            if (!full && cat.indexOf('english') === -1) return;

            var isFilm = cat.indexOf('film') !== -1;
            var isTV = cat.indexOf('tv') !== -1;
            if (kind === 'movie' && !isFilm) return;
            if (kind === 'tv' && !isTV) return;

            if (!map[rank] || String(r.category).indexOf('English') !== -1) {
                map[rank] = title;
            }
        });

        return Object.keys(map).map(Number).sort(function (a, b) { return a - b; })
            .map(function (k) { return map[k]; });
    }

    function loadTitles(kind, done) {
        var cached = Lampa.Storage.get(CACHE, null);
        var now = Date.now();
        var full = get('full', false);

        if (cached && cached.t && (now - cached.t) < CACHE_MS && cached.movies && cached.series) {
            done(kind === 'movie' ? cached.movies : cached.series);
            return;
        }

        var network = new Lampa.Reguest();
        var urls = [
            'https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv',
            'https://top10.netflix.com/data/all-weeks-global.tsv'
        ];
        var i = 0;

        function fail() {
            if (!get('fallback', true)) return done([]);
            var list = kind === 'movie' ? FALLBACK.movies : FALLBACK.series;
            done(list.slice());
        }

        function next() {
            if (i >= urls.length) return fail();
            var url = urls[i++];
            network.silent(url, function (text) {
                if (!text || text.length < 200) return next();
                var rows = parseTSV(text);
                if (!rows) return next();

                var movies = titlesFromRows(rows, 'movie', full);
                var series = titlesFromRows(rows, 'tv', full);
                if (!movies.length && !series.length) return next();

                Lampa.Storage.set(CACHE, { t: now, movies: movies, series: series });
                done(kind === 'movie' ? movies : series);
            }, function () { next(); }, false, { dataType: 'text' });
        }

        next();
    }

    // ---------- штатный TMDB через Lampa ----------
    function tmdbSearch(title, method, done) {
        if (!title || !Lampa.TMDB || !Lampa.TMDB.api) return done(null);

        var path = (method === 'tv' ? 'search/tv' : 'search/movie') +
            '?query=' + encodeURIComponent(title) + '&page=1';

        var network = new Lampa.Reguest();
        network.silent(Lampa.TMDB.api(path), function (json) {
            var list = (json && json.results) ? json.results : [];
            if (!list.length) return done(null);

            var card = list[0];
            // нормализация под Lampa
            card.source = 'tmdb';
            card.media_type = method;
            if (method === 'tv') {
                if (!card.name && card.title) card.name = card.title;
            } else {
                if (!card.title && card.name) card.title = card.name;
            }
            done(card);
        }, function () {
            done(null);
        });
    }

    function resolveList(titles, method, done) {
        if (!titles || !titles.length) return done([]);

        var out = [];
        var left = titles.length;

        titles.forEach(function (title, idx) {
            tmdbSearch(title, method, function (card) {
                if (card && card.id) {
                    // сохраняем rank мягко в объекте (на отрисовку не влияет)
                    card.nft10_rank = idx + 1;
                    out[idx] = card;
                }
                left--;
                if (left <= 0) {
                    done(out.filter(Boolean));
                }
            });
        });
    }

    function detectMethod(params) {
        var url = String((params && params.url) || '').toLowerCase();
        var type = String((params && (params.type || params.card_type || params.media)) || '').toLowerCase();
        var title = String((params && params.title) || '').toLowerCase();

        if (url.indexOf('movie') !== -1 || type.indexOf('movie') !== -1 || title.indexOf('фильм') !== -1) return 'movie';
        if (url.indexOf('tv') !== -1 || type.indexOf('tv') !== -1 || title.indexOf('сериал') !== -1) return 'tv';

        try {
            var a = Lampa.Activity.active() || {};
            var au = String(a.url || '').toLowerCase();
            var at = String(a.title || '').toLowerCase();
            if (au.indexOf('movie') !== -1 || at.indexOf('фильм') !== -1) return 'movie';
            if (au.indexOf('tv') !== -1 || at.indexOf('сериал') !== -1) return 'tv';
        } catch (e) {}

        return '';
    }

    // ---------- ContentRows: родные карточки Lampa ----------
    function addRows() {
        if (!Lampa.ContentRows || !Lampa.ContentRows.add) return;

        Lampa.ContentRows.add({
            index: 3,
            name: 'nft10_category',
            screen: ['category'],
            call: function (params) {
                return function (call) {
                    if (!get('enabled', true)) return call({ results: [] });

                    var method = detectMethod(params);
                    if (method !== 'movie' && method !== 'tv') return call({ results: [] });

                    loadTitles(method, function (titles) {
                        resolveList(titles, method, function (cards) {
                            call({
                                title: Lampa.Lang.translate(method === 'movie' ? 'nft10_row_movies' : 'nft10_row_series'),
                                results: cards,
                                total_pages: 1
                            });
                        });
                    });
                };
            }
        });
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'nft10',
            name: Lampa.Lang.translate('nft10_settings'),
            icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>'
        });

        [
            ['nft10_enabled', 'nft10_enabled', true],
            ['nft10_fallback', 'nft10_fallback', true],
            ['nft10_full', 'nft10_full', false]
        ].forEach(function (p) {
            Lampa.SettingsApi.addParam({
                component: 'nft10',
                param: { name: p[0], type: 'trigger', default: p[2] },
                field: { name: Lampa.Lang.translate(p[1]) }
            });
        });
    }

    function start() {
        lang();
        addSettings();
        addRows();
        console.log('[Netflix Top 10] native cards plugin ready');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });
})();

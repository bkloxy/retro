(function () {
    'use strict';

    if (window.netflix_top10_rows_plugin) return;
    window.netflix_top10_rows_plugin = true;

    var CACHE_KEY = 'netflix_top10_cache_v1';
    var CACHE_TIME = 1000 * 60 * 60 * 12; // 12 часов

    // =========================
    // ЯЗЫКИ
    // =========================
    function addLang() {
        Lampa.Lang.add({
            netflix_top10_row: {
                ru: 'Топ-10 Netflix',
                en: 'Netflix Top 10',
                uk: 'Топ-10 Netflix'
            },
            netflix_top10_settings: {
                ru: 'Netflix Top 10',
                en: 'Netflix Top 10',
                uk: 'Netflix Top 10'
            },
            netflix_top10_enabled: {
                ru: 'Включить ряды Top 10',
                en: 'Enable Top 10 rows',
                uk: 'Увімкнути ряди Top 10'
            },
            netflix_top10_on_main: {
                ru: 'Показывать на главной',
                en: 'Show on home',
                uk: 'Показувати на головній'
            },
            netflix_top10_full_global: {
                ru: 'Полный Global (English + Non-English)',
                en: 'Full Global (English + Non-English)',
                uk: 'Повний Global (English + Non-English)'
            },
            netflix_top10_fallback: {
                ru: 'Запасной список при блокировке',
                en: 'Fallback when blocked',
                uk: 'Запасний список при блокуванні'
            }
        });
    }

    function setting(name, def) {
        return Lampa.Storage.get('netflix_top10_' + name, def);
    }

    // =========================
    // ЗАПАСНЫЕ ДАННЫЕ
    // =========================
    var FALLBACK = {
        week: 'fallback',
        movies: [
            'The Beekeeper',
            'Red Notice',
            'Extraction 2',
            'The Gray Man',
            'Leave the World Behind',
            'Dont Look Up',
            'Bird Box',
            'The Adam Project',
            'Damsel',
            'Glass Onion'
        ],
        series: [
            'Stranger Things',
            'Wednesday',
            'The Witcher',
            'Bridgerton',
            'Squid Game',
            'Money Heist',
            'The Crown',
            'Outer Banks',
            'You',
            'The Night Agent'
        ]
    };

    // =========================
    // ПАРСИНГ TSV
    // =========================
    function parseTSV(text) {
        var lines = String(text || '').trim().split(/\r?\n/);
        if (lines.length < 2) return null;

        var headers = lines[0].split('\t');
        var rows = [];

        for (var i = 1; i < lines.length; i++) {
            var cols = lines[i].split('\t');
            if (cols.length < headers.length) continue;

            var obj = {};
            for (var h = 0; h < headers.length; h++) {
                obj[headers[h]] = cols[h];
            }
            rows.push(obj);
        }

        if (!rows.length) return null;

        var weeks = {};
        rows.forEach(function (r) {
            if (r.week) weeks[r.week] = true;
        });

        var sortedWeeks = Object.keys(weeks).sort().reverse();
        var latestWeek = sortedWeeks[0];

        return {
            week: latestWeek,
            rows: rows.filter(function (r) {
                return r.week === latestWeek;
            })
        };
    }

    function extractLists(parsed, fullGlobal) {
        var moviesMap = {};
        var seriesMap = {};

        (parsed.rows || []).forEach(function (r) {
            var cat = String(r.category || '').toLowerCase();
            var rank = parseInt(r.weekly_rank, 10);
            var title = r.show_title || r.season_title || '';

            if (!rank || rank < 1 || rank > 10 || !title) return;

            if (!fullGlobal && cat.indexOf('english') === -1) return;

            var item = {
                rank: rank,
                title: title,
                category: r.category || ''
            };

            if (cat.indexOf('film') !== -1) {
                if (!moviesMap[rank] || String(item.category).indexOf('English') !== -1) {
                    moviesMap[rank] = item;
                }
            }

            if (cat.indexOf('tv') !== -1) {
                if (!seriesMap[rank] || String(item.category).indexOf('English') !== -1) {
                    seriesMap[rank] = item;
                }
            }
        });

        function toList(map) {
            return Object.keys(map)
                .map(Number)
                .sort(function (a, b) { return a - b; })
                .map(function (k) { return map[k]; });
        }

        return {
            week: parsed.week,
            movies: toList(moviesMap),
            series: toList(seriesMap),
            isFallback: false
        };
    }

    // =========================
    // ЗАГРУЗКА NETFLIX TOP 10
    // =========================
    function loadNetflixData(callback) {
        var cached = Lampa.Storage.get(CACHE_KEY, null);
        var now = Date.now();

        if (cached && cached.time && (now - cached.time) < CACHE_TIME && cached.data) {
            callback(cached.data);
            return;
        }

        var fullGlobal = setting('full_global', false);
        var useFallback = setting('fallback', true);
        var network = new Lampa.Reguest();

        var urls = [
            'https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv',
            'https://top10.netflix.com/data/all-weeks-global.tsv'
        ];

        var index = 0;

        function fail() {
            if (useFallback) {
                var data = {
                    week: FALLBACK.week,
                    movies: FALLBACK.movies.map(function (t, i) {
                        return { rank: i + 1, title: t };
                    }),
                    series: FALLBACK.series.map(function (t, i) {
                        return { rank: i + 1, title: t };
                    }),
                    isFallback: true
                };
                callback(data);
            } else {
                callback(null);
            }
        }

        function next() {
            if (index >= urls.length) {
                fail();
                return;
            }

            var url = urls[index++];

            network.silent(url, function (text) {
                if (!text || typeof text !== 'string' || text.length < 200) {
                    next();
                    return;
                }

                var parsed = parseTSV(text);
                if (!parsed) {
                    next();
                    return;
                }

                var data = extractLists(parsed, fullGlobal);

                Lampa.Storage.set(CACHE_KEY, {
                    time: now,
                    data: data
                });

                callback(data);
            }, function () {
                next();
            }, false, {
                dataType: 'text'
            });
        }

        next();
    }

    // =========================
    // ПОИСК КАРТОЧКИ В TMDB ЧЕРЕЗ LAMPA
    // =========================
    function searchCard(title, mediaType, callback) {
        var done = false;

        function finish(card) {
            if (done) return;
            done = true;
            callback(card || null);
        }

        try {
            // Предпочтительный путь — Api.search
            if (Lampa.Api && typeof Lampa.Api.search === 'function') {
                Lampa.Api.search({
                    query: title,
                    page: 1
                }, function (result) {
                    var list = (result && result.results) ? result.results : [];
                    var found = null;

                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        var type = item.media_type || (item.name ? 'tv' : 'movie');

                        if (mediaType === 'movie' && type === 'movie') {
                            found = item;
                            break;
                        }
                        if (mediaType === 'tv' && type === 'tv') {
                            found = item;
                            break;
                        }
                    }

                    // если точный тип не нашли — берём первый
                    if (!found && list.length) found = list[0];

                    finish(found);
                }, function () {
                    finish(null);
                });
                return;
            }
        } catch (e) {}

        // Запасной путь — прямой запрос к TMDB через сеть Lampa (если Api.search нет)
        try {
            var network = new Lampa.Reguest();
            var url = Lampa.TMDB && Lampa.TMDB.api
                ? Lampa.TMDB.api('search/multi?query=' + encodeURIComponent(title) + '&page=1')
                : null;

            if (!url) {
                finish(null);
                return;
            }

            network.silent(url, function (json) {
                var list = (json && json.results) ? json.results : [];
                var found = null;

                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    if (mediaType === 'movie' && item.media_type === 'movie') {
                        found = item;
                        break;
                    }
                    if (mediaType === 'tv' && item.media_type === 'tv') {
                        found = item;
                        break;
                    }
                }

                if (!found && list.length) found = list[0];
                finish(found);
            }, function () {
                finish(null);
            });
        } catch (e2) {
            finish(null);
        }
    }

    function resolveCards(items, mediaType, callback) {
        if (!items || !items.length) {
            callback([]);
            return;
        }

        var results = new Array(items.length);
        var left = items.length;

        items.forEach(function (item, index) {
            searchCard(item.title, mediaType, function (card) {
                if (card) {
                    // нормализуем под Lampa
                    if (!card.media_type) {
                        card.media_type = mediaType;
                    }
                    // чтобы в интерфейсе было понятнее
                    card.ready = true;
                    results[index] = card;
                } else {
                    // минимальная заглушка, чтобы ряд не был пустым
                    results[index] = {
                        title: item.title,
                        name: item.title,
                        media_type: mediaType,
                        poster_path: '',
                        ready: false
                    };
                }

                left--;
                if (left <= 0) {
                    callback(results.filter(Boolean));
                }
            });
        });
    }

    // =========================
    // ОПРЕДЕЛЕНИЕ ТИПА ЭКРАНА (movie / tv)
    // =========================
    function detectMediaType(params, screen) {
        // category
        if (screen === 'category') {
            var url = String((params && params.url) || '').toLowerCase();
            var type = String((params && (params.type || params.card_type || params.media)) || '').toLowerCase();
            var title = String((params && params.title) || '').toLowerCase();

            if (
                url.indexOf('movie') !== -1 ||
                type.indexOf('movie') !== -1 ||
                title.indexOf('фильм') !== -1 ||
                title.indexOf('movie') !== -1
            ) {
                return 'movie';
            }

            if (
                url.indexOf('tv') !== -1 ||
                type.indexOf('tv') !== -1 ||
                title.indexOf('сериал') !== -1 ||
                title.indexOf('tv') !== -1
            ) {
                return 'tv';
            }

            // запасной разбор активного Activity
            try {
                var active = Lampa.Activity.active();
                if (active) {
                    var aurl = String(active.url || '').toLowerCase();
                    var atitle = String(active.title || '').toLowerCase();
                    if (aurl.indexOf('movie') !== -1 || atitle.indexOf('фильм') !== -1) return 'movie';
                    if (aurl.indexOf('tv') !== -1 || atitle.indexOf('сериал') !== -1) return 'tv';
                }
            } catch (e) {}
        }

        // на главной по умолчанию не решаем здесь
        return '';
    }

    // =========================
    // CONTENT ROWS
    // =========================
    function addRows() {
        if (!Lampa.ContentRows || !Lampa.ContentRows.add) {
            console.log('[Netflix Top 10] ContentRows API not found');
            return;
        }

        // Ряд в категории Фильмы / Сериалы
        Lampa.ContentRows.add({
            index: 3,
            name: 'netflix_top10_category',
            screen: ['category'],
            call: function (params, screen) {
                return function (call) {
                    if (!setting('enabled', true)) {
                        call({ results: [] });
                        return;
                    }

                    var mediaType = detectMediaType(params, screen);
                    if (mediaType !== 'movie' && mediaType !== 'tv') {
                        call({ results: [] });
                        return;
                    }

                    loadNetflixData(function (data) {
                        if (!data) {
                            call({ results: [] });
                            return;
                        }

                        var sourceItems = mediaType === 'movie' ? data.movies : data.series;

                        resolveCards(sourceItems, mediaType, function (cards) {
                            call({
                                title: Lampa.Lang.translate('netflix_top10_row'),
                                results: cards,
                                type: 'netflix_top10',
                                total_pages: 1
                            });
                        });
                    });
                };
            }
        });

        // Ряд на главной (опционально)
        Lampa.ContentRows.add({
            index: 4,
            name: 'netflix_top10_main',
            screen: ['main'],
            call: function (params, screen) {
                return function (call) {
                    if (!setting('enabled', true) || !setting('on_main', false)) {
                        call({ results: [] });
                        return;
                    }

                    loadNetflixData(function (data) {
                        if (!data) {
                            call({ results: [] });
                            return;
                        }

                        // На главной показываем фильмы (можно потом сделать 2 ряда)
                        resolveCards(data.movies, 'movie', function (cards) {
                            call({
                                title: Lampa.Lang.translate('netflix_top10_row') + ' — Фильмы',
                                results: cards,
                                type: 'netflix_top10',
                                total_pages: 1
                            });
                        });
                    });
                };
            }
        });
    }

    // =========================
    // НАСТРОЙКИ
    // =========================
    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'netflix_top10',
            name: Lampa.Lang.translate('netflix_top10_settings'),
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'netflix_top10',
            param: {
                name: 'netflix_top10_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: Lampa.Lang.translate('netflix_top10_enabled')
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'netflix_top10',
            param: {
                name: 'netflix_top10_on_main',
                type: 'trigger',
                default: false
            },
            field: {
                name: Lampa.Lang.translate('netflix_top10_on_main')
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'netflix_top10',
            param: {
                name: 'netflix_top10_full_global',
                type: 'trigger',
                default: false
            },
            field: {
                name: Lampa.Lang.translate('netflix_top10_full_global')
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'netflix_top10',
            param: {
                name: 'netflix_top10_fallback',
                type: 'trigger',
                default: true
            },
            field: {
                name: Lampa.Lang.translate('netflix_top10_fallback')
            }
        });
    }

    // =========================
    // СТАРТ
    // =========================
    function startPlugin() {
        addLang();
        addSettings();
        addRows();
        console.log('[Netflix Top 10] rows plugin started');
    }

    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();

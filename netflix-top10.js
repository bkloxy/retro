(function () {
    'use strict';

    if (window.netflix_top10_plugin) return;
    window.netflix_top10_plugin = true;

    var PLUGIN_NAME = 'Netflix Top 10';
    var COMPONENT = 'netflix_top10';
    var STYLE_ID = 'netflix-top10-style';

    // =========================
    // НАСТРОЙКИ ПО УМОЛЧАНИЮ
    // =========================
    var DEFAULTS = {
        enabled: true,
        full_global: false,   // false = только English, true = English + Non-English
        show_fallback: true
    };

    function getSetting(name) {
        return Lampa.Storage.get('netflix_top10_' + name, DEFAULTS[name]);
    }

    // =========================
    // ЯЗЫКИ
    // =========================
    function addLang() {
        Lampa.Lang.add({
            netflix_top10_title: {
                ru: 'Netflix Top 10',
                en: 'Netflix Top 10',
                uk: 'Netflix Top 10'
            },
            netflix_top10_settings: {
                ru: 'Netflix Top 10',
                en: 'Netflix Top 10',
                uk: 'Netflix Top 10'
            },
            netflix_top10_enabled: {
                ru: 'Включить плагин',
                en: 'Enable plugin',
                uk: 'Увімкнути плагін'
            },
            netflix_top10_full_global: {
                ru: 'Полный Global (English + Non-English)',
                en: 'Full Global (English + Non-English)',
                uk: 'Повний Global (English + Non-English)'
            },
            netflix_top10_fallback: {
                ru: 'Запасной вариант при блокировке',
                en: 'Fallback when blocked',
                uk: 'Запасний варіант при блокуванні'
            },
            netflix_top10_movies: {
                ru: 'Top 10 Netflix — Фильмы',
                en: 'Top 10 Netflix — Movies',
                uk: 'Top 10 Netflix — Фільми'
            },
            netflix_top10_series: {
                ru: 'Top 10 Netflix — Сериалы',
                en: 'Top 10 Netflix — Series',
                uk: 'Top 10 Netflix — Серіали'
            },
            netflix_top10_loading: {
                ru: 'Загрузка Top 10...',
                en: 'Loading Top 10...',
                uk: 'Завантаження Top 10...'
            },
            netflix_top10_error: {
                ru: 'Не удалось загрузить. Включи VPN или используй запасной вариант.',
                en: 'Failed to load. Enable VPN or use fallback.',
                uk: 'Не вдалося завантажити. Увімкни VPN або використай запасний варіант.'
            },
            netflix_top10_week: {
                ru: 'Неделя',
                en: 'Week',
                uk: 'Тиждень'
            }
        });
    }

    // =========================
    // СТИЛИ (Netflix-стиль)
    // =========================
    function addStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .nftv-wrap {
                background: #141414;
                min-height: 100%;
                padding-bottom: 60px;
                color: #fff;
                font-family: Arial, Helvetica, sans-serif;
            }

            .nftv-header {
                padding: 30px 40px 10px;
            }

            .nftv-header-title {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 6px;
            }

            .nftv-header-week {
                color: #aaa;
                font-size: 16px;
            }

            .nftv-section {
                margin-top: 35px;
                padding: 0 35px;
            }

            .nftv-section-title {
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 14px;
            }

            .nftv-row {
                display: flex;
                gap: 16px;
                overflow-x: auto;
                overflow-y: hidden;
                padding: 10px 5px 25px;
                scrollbar-width: none;
            }

            .nftv-row::-webkit-scrollbar {
                display: none;
            }

            /* Top 10 карточка */
            .nftv-top10 {
                position: relative;
                flex: 0 0 210px;
                height: 270px;
                background: transparent;
                border: 0;
                padding: 0;
                cursor: pointer;
                outline: none;
                transition: transform 0.15s ease;
            }

            .nftv-top10:hover,
            .nftv-top10:focus,
            .nftv-top10.focus {
                transform: scale(1.07);
                z-index: 10;
            }

            .nftv-top10:focus,
            .nftv-top10.focus {
                outline: 3px solid #fff;
                outline-offset: 4px;
            }

            .nftv-number {
                position: absolute;
                left: 0;
                bottom: -8px;
                z-index: 0;
                font-size: 200px;
                line-height: 0.75;
                font-weight: 900;
                color: #1a1a1a;
                -webkit-text-stroke: 2px #666;
                user-select: none;
                pointer-events: none;
            }

            .nftv-poster {
                position: absolute;
                left: 50px;
                top: 10px;
                z-index: 2;
                width: 150px;
                height: 225px;
                object-fit: cover;
                background: #252525;
                border-radius: 4px;
            }

            .nftv-info {
                position: absolute;
                left: 50px;
                right: 0;
                bottom: 0;
                z-index: 3;
                padding: 40px 8px 8px;
                background: linear-gradient(transparent, rgba(0,0,0,0.95));
                opacity: 0;
                transition: opacity 0.15s;
            }

            .nftv-top10:hover .nftv-info,
            .nftv-top10:focus .nftv-info,
            .nftv-top10.focus .nftv-info {
                opacity: 1;
            }

            .nftv-rank {
                font-size: 12px;
                color: #ccc;
            }

            .nftv-name {
                font-size: 14px;
                font-weight: 700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .nftv-empty {
                padding: 80px 40px;
                text-align: center;
                color: #aaa;
                font-size: 18px;
            }

            .nftv-loader {
                padding: 100px 40px;
                text-align: center;
                color: #fff;
                font-size: 20px;
            }

            @media (max-width: 700px) {
                .nftv-header { padding: 20px 20px 5px; }
                .nftv-section { padding: 0 15px; }
                .nftv-top10 { flex-basis: 170px; height: 230px; }
                .nftv-number { font-size: 160px; }
                .nftv-poster { left: 40px; width: 120px; height: 180px; }
                .nftv-info { left: 40px; }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================
    // ЗАПАСНЫЕ ДАННЫЕ (если Netflix недоступен)
    // =========================
    var FALLBACK_MOVIES = [
        { rank: 1, title: 'The Beekeeper' },
        { rank: 2, title: 'Red Notice' },
        { rank: 3, title: 'Extraction 2' },
        { rank: 4, title: 'The Gray Man' },
        { rank: 5, title: 'Leave the World Behind' },
        { rank: 6, title: 'Dont Look Up' },
        { rank: 7, title: 'Bird Box' },
        { rank: 8, title: 'The Adam Project' },
        { rank: 9, title: 'Damsel' },
        { rank: 10, title: 'Glass Onion' }
    ];

    var FALLBACK_SERIES = [
        { rank: 1, title: 'Stranger Things' },
        { rank: 2, title: 'Wednesday' },
        { rank: 3, title: 'The Witcher' },
        { rank: 4, title: 'Bridgerton' },
        { rank: 5, title: 'Squid Game' },
        { rank: 6, title: 'Money Heist' },
        { rank: 7, title: 'The Crown' },
        { rank: 8, title: 'Outer Banks' },
        { rank: 9, title: 'You' },
        { rank: 10, title: 'The Night Agent' }
    ];

    // =========================
    // ПАРСИНГ NETFLIX TSV
    // =========================
    function parseTSV(text) {
        var lines = text.trim().split(/\r?\n/);
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

        // Самая свежая неделя
        var weeks = {};
        rows.forEach(function (r) {
            weeks[r.week] = true;
        });
        var sortedWeeks = Object.keys(weeks).sort().reverse();
        var latestWeek = sortedWeeks[0];

        var latest = rows.filter(function (r) {
            return r.week === latestWeek;
        });

        return {
            week: latestWeek,
            rows: latest
        };
    }

    function extractTop10(data, fullGlobal) {
        if (!data || !data.rows) return { movies: [], series: [], week: '' };

        var movies = [];
        var series = [];

        data.rows.forEach(function (r) {
            var cat = (r.category || '').toLowerCase();
            var rank = parseInt(r.weekly_rank, 10);
            if (!rank || rank > 10) return;

            var title = r.show_title || r.season_title || '';
            if (!title) return;

            var item = {
                rank: rank,
                title: title,
                category: r.category,
                weeks: r.cumulative_weeks_in_top_10
            };

            var isFilm = cat.indexOf('film') !== -1;
            var isTV = cat.indexOf('tv') !== -1;

            if (!fullGlobal) {
                // Только English
                if (cat.indexOf('english') === -1) return;
            }

            if (isFilm) {
                movies.push(item);
            } else if (isTV) {
                series.push(item);
            }
        });

        // Сортируем по рангу и оставляем уникальные по rank
        function uniqueByRank(arr) {
            var map = {};
            arr.forEach(function (i) {
                if (!map[i.rank] || (i.category || '').indexOf('English') !== -1) {
                    map[i.rank] = i;
                }
            });
            return Object.keys(map).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return map[k]; });
        }

        return {
            week: data.week,
            movies: uniqueByRank(movies).slice(0, 10),
            series: uniqueByRank(series).slice(0, 10)
        };
    }

    // =========================
    // ПОИСК ПОСТЕРА ЧЕРЕЗ LAMPA / TMDB
    // =========================
    function findCard(title, callback) {
        // Используем встроенный поиск Lampa
        try {
            if (Lampa.Api && Lampa.Api.search) {
                Lampa.Api.search({
                    query: title,
                    page: 1
                }, function (result) {
                    if (result && result.results && result.results.length) {
                        callback(result.results[0]);
                    } else {
                        callback(null);
                    }
                }, function () {
                    callback(null);
                });
                return;
            }
        } catch (e) {}

        // Запасной вариант — просто отдаём null
        callback(null);
    }

    // =========================
    // ЗАГРУЗКА ДАННЫХ
    // =========================
    function loadTop10(callback) {
        var fullGlobal = getSetting('full_global');
        var useFallback = getSetting('show_fallback');

        var urls = [
            'https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv',
            'https://top10.netflix.com/data/all-weeks-global.tsv'
        ];

        var network = new Lampa.Reguest();
        var tried = 0;

        function tryNext() {
            if (tried >= urls.length) {
                // Всё упало — запасной вариант
                if (useFallback) {
                    callback({
                        week: 'fallback',
                        movies: FALLBACK_MOVIES,
                        series: FALLBACK_SERIES,
                        isFallback: true
                    });
                } else {
                    callback(null);
                }
                return;
            }

            var url = urls[tried++];
            network.silent(url, function (text) {
                if (!text || typeof text !== 'string' || text.length < 100) {
                    tryNext();
                    return;
                }

                var parsed = parseTSV(text);
                if (!parsed) {
                    tryNext();
                    return;
                }

                var result = extractTop10(parsed, fullGlobal);
                result.isFallback = false;
                callback(result);
            }, function () {
                tryNext();
            }, false, { dataType: 'text' });
        }

        tryNext();
    }

    // =========================
    // ОТКРЫТИЕ КАРТОЧКИ
    // =========================
    function openTitle(title) {
        // Сначала пробуем найти точную карточку
        findCard(title, function (card) {
            if (card && Lampa.Activity && Lampa.Activity.push) {
                Lampa.Activity.push({
                    component: 'full',
                    card_object: card,
                    page: 1
                });
            } else {
                // Если не нашли — открываем поиск
                try {
                    if (Lampa.Search && Lampa.Search.open) {
                        Lampa.Search.open(title);
                    } else {
                        Lampa.Activity.push({
                            component: 'search',
                            query: title,
                            page: 1
                        });
                    }
                } catch (e) {
                    Lampa.Noty.show('Не удалось открыть: ' + title);
                }
            }
        });
    }

    // =========================
    // СОЗДАНИЕ КАРТОЧКИ TOP 10
    // =========================
    function createTop10Card(item) {
        var el = document.createElement('div');
        el.className = 'nftv-top10 selector';
        el.tabIndex = 0;

        var posterUrl = '';
        // Постер подтянем асинхронно
        el.innerHTML =
            '<div class="nftv-number">' + item.rank + '</div>' +
            '<img class="nftv-poster" src="" alt="">' +
            '<div class="nftv-info">' +
                '<div class="nftv-rank">TOP ' + item.rank + '</div>' +
                '<div class="nftv-name">' + (item.title || '') + '</div>' +
            '</div>';

        // Подгружаем постер
        findCard(item.title, function (card) {
            if (card && card.poster_path) {
                var img = el.querySelector('.nftv-poster');
                if (img) {
                    img.src = 'https://image.tmdb.org/t/p/w342' + card.poster_path;
                }
                el._card = card;
            }
        });

        el.addEventListener('hover:enter', function () {
            if (el._card) {
                Lampa.Activity.push({
                    component: 'full',
                    card_object: el._card,
                    page: 1
                });
            } else {
                openTitle(item.title);
            }
        });

        // Для обычного клика (мышь)
        el.addEventListener('click', function () {
            if (el._card) {
                Lampa.Activity.push({
                    component: 'full',
                    card_object: el._card,
                    page: 1
                });
            } else {
                openTitle(item.title);
            }
        });

        return el;
    }

    // =========================
    // КОМПОНЕНТ
    // =========================
    function component(object) {
        var html = $('<div class="nftv-wrap"></div>');
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var body = $('<div></div>');

        this.create = function () {
            this.activity.loader(true);

            loadTop10(function (data) {
                this.activity.loader(false);

                if (!data) {
                    body.html('<div class="nftv-empty">' + Lampa.Lang.translate('netflix_top10_error') + '</div>');
                    scroll.append(body);
                    html.append(scroll.render());
                    this.activity.toggle();
                    return;
                }

                // Заголовок
                var weekText = data.isFallback
                    ? 'Запасной список'
                    : (Lampa.Lang.translate('netflix_top10_week') + ': ' + data.week);

                body.append(
                    '<div class="nftv-header">' +
                        '<div class="nftv-header-title">' + Lampa.Lang.translate('netflix_top10_title') + '</div>' +
                        '<div class="nftv-header-week">' + weekText + '</div>' +
                    '</div>'
                );

                // Фильмы
                if (data.movies && data.movies.length) {
                    var moviesSection = $('<div class="nftv-section"></div>');
                    moviesSection.append('<div class="nftv-section-title">' + Lampa.Lang.translate('netflix_top10_movies') + '</div>');
                    var moviesRow = $('<div class="nftv-row"></div>');

                    data.movies.forEach(function (item) {
                        moviesRow.append(createTop10Card(item));
                    });

                    moviesSection.append(moviesRow);
                    body.append(moviesSection);
                }

                // Сериалы
                if (data.series && data.series.length) {
                    var seriesSection = $('<div class="nftv-section"></div>');
                    seriesSection.append('<div class="nftv-section-title">' + Lampa.Lang.translate('netflix_top10_series') + '</div>');
                    var seriesRow = $('<div class="nftv-row"></div>');

                    data.series.forEach(function (item) {
                        seriesRow.append(createTop10Card(item));
                    });

                    seriesSection.append(seriesRow);
                    body.append(seriesSection);
                }

                scroll.append(body);
                html.append(scroll.render());
                this.activity.toggle();
            }.bind(this));
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return html;
        };
        this.destroy = function () {
            scroll.destroy();
            html.remove();
        };
    }

    // =========================
    // МЕНЮ + НАСТРОЙКИ
    // =========================
    function addMenuItem() {
        var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>';

        if (Lampa.Menu && Lampa.Menu.addButton) {
            Lampa.Menu.addButton(icon, Lampa.Lang.translate('netflix_top10_title'), function () {
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('netflix_top10_title'),
                    component: COMPONENT,
                    page: 1
                });
            });
        } else {
            // Старый способ
            var button = $('<li class="menu__item selector" data-action="netflix_top10">' +
                '<div class="menu__ico">' + icon + '</div>' +
                '<div class="menu__text">' + Lampa.Lang.translate('netflix_top10_title') + '</div>' +
                '</li>');

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('netflix_top10_title'),
                    component: COMPONENT,
                    page: 1
                });
            });

            var menu = $('.menu .menu__list').eq(0);
            if (menu.length && !menu.find('[data-action="netflix_top10"]').length) {
                menu.append(button);
            }
        }
    }

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
                name: 'netflix_top10_full_global',
                type: 'trigger',
                default: false
            },
            field: {
                name: Lampa.Lang.translate('netflix_top10_full_global'),
                description: 'English + Non-English'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'netflix_top10',
            param: {
                name: 'netflix_top10_show_fallback',
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
        addStyle();

        Lampa.Component.add(COMPONENT, component);

        addSettings();
        addMenuItem();

        console.log('[Netflix Top 10] Плагин запущен');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                startPlugin();
            }
        });
    }

})();

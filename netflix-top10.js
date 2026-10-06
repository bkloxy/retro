(function () {
    'use strict';

    var PLUGIN_NAME = 'yaroslav_netflix_ui';

    function startPlugin() {
        if (!window.Lampa || !Lampa.ContentRows) return;
        if (window[PLUGIN_NAME]) return;

        window[PLUGIN_NAME] = true;

        /*
         * ---------------------------------------------------------
         * CSS
         * ---------------------------------------------------------
         */

        var css = document.createElement('style');

        css.textContent = `
            /* =====================================================
               YAROSLAV NETFLIX UI
               ===================================================== */

            .yar-netflix-row {
                margin-bottom: 2.5em;
            }

            .yar-netflix-title {
                font-size: 1.45em;
                font-weight: 600;
                margin-bottom: .7em;
                padding-left: .2em;
            }

            .yar-netflix-track {
                display: flex;
                align-items: flex-end;
                gap: 1.15em;
                overflow: hidden;
                padding: .5em .3em 1em;
            }

            /*
             * ВЕРТИКАЛЬНЫЕ ПОСТЕРЫ 2:3
             */

            .yar-top-card {
                position: relative;
                flex: 0 0 10.5em;
                width: 10.5em;
                aspect-ratio: 2 / 3;
                border-radius: .35em;
                overflow: visible;
                transition:
                    transform .18s ease,
                    filter .18s ease;
            }

            .yar-top-card:hover {
                transform: scale(1.06);
                z-index: 5;
            }

            .yar-top-number {
                position: absolute;
                left: -.48em;
                bottom: -.15em;
                z-index: 1;

                font-size: 5.7em;
                line-height: .8;
                font-weight: 900;

                color: #111;
                -webkit-text-stroke: .045em #fff;

                text-shadow:
                    0 .04em .08em rgba(0,0,0,.8);
            }

            .yar-top-poster {
                width: 100%;
                height: 100%;
                object-fit: cover;

                display: block;

                border-radius: .3em;

                background:
                    linear-gradient(
                        145deg,
                        #292929,
                        #111
                    );

                box-shadow:
                    0 .35em 1.2em rgba(0,0,0,.45);
            }

            .yar-top-info {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;

                padding: 3em .65em .55em;

                border-radius: 0 0 .3em .3em;

                background:
                    linear-gradient(
                        transparent,
                        rgba(0,0,0,.9)
                    );

                color: #fff;
            }

            .yar-top-name {
                font-size: .82em;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /*
             * ЖАНРЫ
             */

            .yar-genre-card {
                flex: 0 0 12em;
                height: 6.2em;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: .45em;

                background:
                    linear-gradient(
                        135deg,
                        #292929,
                        #151515
                    );

                border: 1px solid rgba(255,255,255,.07);

                font-size: 1.05em;
                font-weight: 600;

                transition:
                    transform .18s ease,
                    background .18s ease;
            }

            .yar-genre-card:hover {
                transform: scale(1.05);
                background: #333;
            }

            /*
             * ПРОДОЛЖИТЬ ПРОСМОТР
             */

            .yar-resume-card {
                position: relative;

                flex: 0 0 16em;
                height: 9em;

                overflow: hidden;
                border-radius: .35em;

                background: #181818;
            }

            .yar-resume-poster {
                width: 100%;
                height: 100%;

                object-fit: cover;

                opacity: .78;
            }

            .yar-resume-overlay {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;

                padding: 2.8em .75em .7em;

                background:
                    linear-gradient(
                        transparent,
                        rgba(0,0,0,.95)
                    );
            }

            .yar-resume-name {
                font-size: .9em;
                font-weight: 600;
            }

            .yar-progress {
                height: .25em;
                margin-top: .55em;

                background: rgba(255,255,255,.3);
                border-radius: 1em;
                overflow: hidden;
            }

            .yar-progress > div {
                height: 100%;
                width: 0%;

                background: #e50914;
            }

            /*
             * TV / большой экран
             */

            @media (min-width: 1200px) {
                .yar-top-card {
                    flex-basis: 11.5em;
                    width: 11.5em;
                }

                .yar-top-number {
                    font-size: 6.3em;
                }

                .yar-netflix-title {
                    font-size: 1.55em;
                }
            }
        `;

        document.head.appendChild(css);


        /*
         * ---------------------------------------------------------
         * HELPERS
         * ---------------------------------------------------------
         */

        function createPoster(title, index) {
            /*
             * Пока используются постеры из TMDB, если Lampa
             * предоставляет их в объекте.
             *
             * Для теста без API создаём визуальную карточку.
             */

            var card = document.createElement('div');
            card.className = 'yar-top-card';

            var number = document.createElement('div');
            number.className = 'yar-top-number';
            number.textContent = index;

            var poster = document.createElement('div');
            poster.className = 'yar-top-poster';

            /*
             * Градиент вместо фейкового PNG.
             * Реальный poster_url подключим после проверки UI.
             */

            poster.style.background =
                'linear-gradient(' +
                (120 + index * 12) +
                'deg,' +
                'hsl(' + (index * 35) + ',35%,28%),' +
                'hsl(' + (index * 25 + 10) + ',25%,10%)' +
                ')';

            var info = document.createElement('div');
            info.className = 'yar-top-info';

            var name = document.createElement('div');
            name.className = 'yar-top-name';
            name.textContent = title;

            info.appendChild(name);

            card.appendChild(number);
            card.appendChild(poster);
            card.appendChild(info);

            return card;
        }


        function createGenre(title) {
            var card = document.createElement('div');

            card.className = 'yar-genre-card';
            card.textContent = title;

            return card;
        }


        /*
         * ---------------------------------------------------------
         * TOP 10 TEST DATA
         * ---------------------------------------------------------
         *
         * Это только тест интерфейса.
         * Реальный Global Top 10 Netflix подключим отдельным
         * источником после проверки отображения.
         */

        var topMovies = [
            'Фильм №1',
            'Фильм №2',
            'Фильм №3',
            'Фильм №4',
            'Фильм №5',
            'Фильм №6',
            'Фильм №7',
            'Фильм №8',
            'Фильм №9',
            'Фильм №10'
        ];

        var topSeries = [
            'Сериал №1',
            'Сериал №2',
            'Сериал №3',
            'Сериал №4',
            'Сериал №5',
            'Сериал №6',
            'Сериал №7',
            'Сериал №8',
            'Сериал №9',
            'Сериал №10'
        ];


        /*
         * ---------------------------------------------------------
         * TOP 10 FILMS
         * ---------------------------------------------------------
         */

        Lampa.ContentRows.add({
            index: 50,
            screen: ['main'],

            call: function (params, screen) {

                return function (call) {

                    var results = [];

                    for (var i = 0; i < topMovies.length; i++) {
                        results.push({
                            title: topMovies[i],
                            rank: i + 1
                        });
                    }

                    call({
                        title: 'TOP 10 ФИЛЬМОВ — МИР',
                        results: results
                    });
                };
            }
        });


        /*
         * ---------------------------------------------------------
         * TOP 10 SERIES
         * ---------------------------------------------------------
         */

        Lampa.ContentRows.add({
            index: 51,
            screen: ['main'],

            call: function (params, screen) {

                return function (call) {

                    var results = [];

                    for (var i = 0; i < topSeries.length; i++) {
                        results.push({
                            title: topSeries[i],
                            rank: i + 1
                        });
                    }

                    call({
                        title: 'TOP 10 СЕРИАЛОВ — МИР',
                        results: results
                    });
                };
            }
        });


        /*
         * ---------------------------------------------------------
         * ЖАНРЫ
         * ---------------------------------------------------------
         */

        Lampa.ContentRows.add({
            index: 40,
            screen: ['main'],

            call: function (params, screen) {

                return function (call) {

                    call({
                        title: 'ЖАНРЫ',

                        results: [
                            {
                                title: 'Ужасы',
                                genre: 'horror'
                            },
                            {
                                title: 'Драма',
                                genre: 'drama'
                            },
                            {
                                title: 'Комедия',
                                genre: 'comedy'
                            },
                            {
                                title: 'Фантастика',
                                genre: 'science_fiction'
                            },
                            {
                                title: 'Фэнтези',
                                genre: 'fantasy'
                            },
                            {
                                title: 'Приключения',
                                genre: 'adventure'
                            },
                            {
                                title: 'Криминал',
                                genre: 'crime'
                            },
                            {
                                title: 'Детектив',
                                genre: 'mystery'
                            }
                        ]
                    });
                };
            }
        });


        /*
         * ---------------------------------------------------------
         * СОБЫТИЕ ЗАГРУЗКИ
         * ---------------------------------------------------------
         */

        console.log(
            '[Yaroslav Netflix UI]',
            'plugin loaded'
        );
    }


    /*
     * ---------------------------------------------------------
     * BOOTSTRAP
     * ---------------------------------------------------------
     */

    if (window.appready) {
        startPlugin();
    }
    else {
        Lampa.Listener.follow('app', function (event) {

            if (event.type === 'ready') {
                startPlugin();
            }

        });
    }

})();

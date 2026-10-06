(function () {
    'use strict';

    var PLUGIN_NAME = 'Netflix TV';
    var ROOT_ID = 'netflix-tv-plugin-root';
    var STYLE_ID = 'netflix-tv-plugin-style';

    function startPlugin() {
        if (window.netflix_tv_plugin_started) return;
        window.netflix_tv_plugin_started = true;

        try {
            addStyle();
            createInterface();

            console.log('[Netflix TV] Плагин запущен');
        } catch (e) {
            console.log('[Netflix TV] Ошибка:', e);
        }
    }

    function bootstrap() {
        if (typeof window.Lampa === 'undefined') {
            setTimeout(bootstrap, 300);
            return;
        }

        if (window.appready) {
            startPlugin();
            return;
        }

        if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('app', function (event) {
                if (event.type === 'ready') {
                    startPlugin();
                }
            });
        }

        setTimeout(function () {
            if (window.appready) {
                startPlugin();
            }
        }, 1500);
    }

    function addStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            #${ROOT_ID} {
                position: fixed;
                left: 0;
                top: 0;
                right: 0;
                bottom: 0;
                z-index: 999999;
                overflow-y: auto;
                overflow-x: hidden;
                background: #141414;
                color: #fff;
                font-family: Arial, Helvetica, sans-serif;
            }

            #${ROOT_ID} * {
                box-sizing: border-box;
            }

            /* =========================
               ЛЕВОЕ МЕНЮ
               ========================= */

            .nftv-menu {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 70px;
                z-index: 20;

                padding: 25px 9px;

                background:
                    linear-gradient(
                        90deg,
                        #050505 0%,
                        rgba(5,5,5,.96) 70%,
                        transparent 100%
                    );

                transition: width .2s ease;
            }

            .nftv-menu:hover,
            .nftv-menu:focus-within {
                width: 230px;
            }

            .nftv-logo {
                margin: 0 0 35px 7px;
                font-size: 20px;
                font-weight: 800;
                white-space: nowrap;
                overflow: hidden;
            }

            .nftv-menu-button {
                width: 100%;
                height: 52px;

                display: flex;
                align-items: center;

                gap: 18px;

                margin: 4px 0;
                padding: 0 8px;

                border: 0;
                border-radius: 5px;

                background: transparent;
                color: #ccc;

                cursor: pointer;
                text-align: left;
            }

            .nftv-menu-button:hover,
            .nftv-menu-button:focus {
                background: rgba(255,255,255,.13);
                color: #fff;
                outline: 2px solid rgba(255,255,255,.5);
            }

            .nftv-menu-icon {
                width: 28px;
                min-width: 28px;

                text-align: center;
                font-size: 22px;
            }

            .nftv-menu-text {
                opacity: 0;
                white-space: nowrap;
                transition: opacity .15s;
            }

            .nftv-menu:hover .nftv-menu-text,
            .nftv-menu:focus-within .nftv-menu-text {
                opacity: 1;
            }

            /* =========================
               ОСНОВНАЯ ОБЛАСТЬ
               ========================= */

            .nftv-content {
                min-height: 100%;
                padding-left: 70px;
                padding-bottom: 80px;
            }

            /* =========================
               HERO
               ========================= */

            .nftv-hero {
                min-height: 550px;

                display: flex;
                align-items: flex-end;

                padding:
                    80px
                    7vw
                    55px;

                background:
                    linear-gradient(
                        90deg,
                        #141414 0%,
                        rgba(20,20,20,.82) 35%,
                        rgba(20,20,20,.20) 75%,
                        #141414 100%
                    ),
                    linear-gradient(
                        0deg,
                        #141414 0%,
                        transparent 60%
                    ),
                    #292929;
            }

            .nftv-hero-content {
                max-width: 650px;
            }

            .nftv-hero-title {
                font-size: clamp(40px, 5vw, 72px);
                font-weight: 800;
                line-height: 1;
                margin-bottom: 18px;
            }

            .nftv-hero-info {
                color: #ccc;
                font-size: 16px;
                margin-bottom: 15px;
            }

            .nftv-hero-description {
                color: #ddd;
                font-size: 18px;
                line-height: 1.5;
            }

            .nftv-hero-buttons {
                display: flex;
                gap: 12px;
                margin-top: 25px;
            }

            .nftv-button {
                padding: 13px 25px;

                border: 0;
                border-radius: 4px;

                font-weight: 700;
                font-size: 16px;

                cursor: pointer;
            }

            .nftv-play {
                background: #fff;
                color: #000;
            }

            .nftv-details {
                background: rgba(100,100,100,.8);
                color: #fff;
            }

            /* =========================
               РЯДЫ
               ========================= */

            .nftv-section {
                margin-top: 30px;
                padding: 0 35px;
            }

            .nftv-section-title {
                margin-bottom: 12px;

                font-size: 22px;
                font-weight: 700;
            }

            .nftv-row {
                display: flex;
                gap: 14px;

                overflow-x: auto;
                overflow-y: hidden;

                padding:
                    8px
                    5px
                    20px;

                scrollbar-width: none;
                scroll-behavior: smooth;
            }

            .nftv-row::-webkit-scrollbar {
                display: none;
            }

            /* =========================
               ОБЫЧНАЯ КАРТОЧКА
               ========================= */

            .nftv-card {
                position: relative;

                flex: 0 0 170px;
                height: 255px;

                padding: 0;
                border: 0;

                background: #252525;

                cursor: pointer;
                outline: none;

                transition: transform .15s ease;
            }

            .nftv-card img {
                display: block;

                width: 100%;
                height: 100%;

                object-fit: cover;

                border-radius: 0;
            }

            .nftv-card:hover,
            .nftv-card:focus,
            .nftv-card.touch {
                transform: scale(1.06);
                z-index: 5;
            }

            .nftv-card:focus {
                outline: 3px solid #fff;
                outline-offset: 3px;
            }

            .nftv-card-title {
                position: absolute;

                left: 0;
                right: 0;
                bottom: 0;

                padding:
                    35px
                    8px
                    8px;

                background:
                    linear-gradient(
                        transparent,
                        rgba(0,0,0,.95)
                    );

                text-align: left;

                opacity: 0;
            }

            .nftv-card:hover .nftv-card-title,
            .nftv-card:focus .nftv-card-title,
            .nftv-card.touch .nftv-card-title {
                opacity: 1;
            }

            /* =========================
               TOP 10
               ========================= */

            .nftv-top10 {
                position: relative;

                flex: 0 0 220px;
                height: 275px;

                padding: 0;
                border: 0;

                background: transparent;

                cursor: pointer;
                outline: none;

                transition: transform .15s ease;
            }

            .nftv-top10:hover,
            .nftv-top10:focus,
            .nftv-top10.touch {
                transform: scale(1.06);
                z-index: 10;
            }

            .nftv-top10:focus {
                outline: 3px solid #fff;
                outline-offset: 3px;
            }

            /*
             * Большая цифра находится ПОД постером.
             */

            .nftv-number {
                position: absolute;

                left: 0;
                bottom: -10px;

                z-index: 0;

                font-size: 220px;
                line-height: .75;

                font-weight: 900;

                color: #242424;

                -webkit-text-stroke:
                    2px
                    #777;

                user-select: none;
            }

            .nftv-top10-poster {
                position: absolute;

                left: 55px;
                top: 12px;

                z-index: 2;

                width: 160px;
                height: 240px;

                object-fit: cover;

                border-radius: 0;

                background: #252525;
            }

            .nftv-top10-info {
                position: absolute;

                left: 55px;
                right: 5px;
                bottom: 3px;

                z-index: 3;

                padding:
                    40px
                    8px
                    8px;

                text-align: left;

                background:
                    linear-gradient(
                        transparent,
                        rgba(0,0,0,.95)
                    );

                opacity: 0;
            }

            .nftv-top10:hover .nftv-top10-info,
            .nftv-top10:focus .nftv-top10-info,
            .nftv-top10.touch .nftv-top10-info {
                opacity: 1;
            }

            .nftv-top10-rank {
                font-size: 13px;
                color: #ccc;
            }

            .nftv-top10-name {
                font-size: 14px;
                font-weight: 700;

                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* =========================
               ЗАКРЫТЬ
               ========================= */

            .nftv-close {
                position: fixed;

                right: 20px;
                top: 18px;

                z-index: 50;

                width: 44px;
                height: 44px;

                border: 0;
                border-radius: 50%;

                background: rgba(0,0,0,.75);
                color: #fff;

                font-size: 28px;

                cursor: pointer;
            }

            .nftv-close:hover,
            .nftv-close:focus {
                background: #fff;
                color: #000;
                outline: 2px solid #fff;
            }

            /* =========================
               ТЕЛЕФОН
               ========================= */

            @media (max-width:700px) {

                .nftv-menu {
                    width: 58px;
                    padding-left: 5px;
                    padding-right: 5px;
                }

                .nftv-menu:hover,
                .nftv-menu:focus-within {
                    width: 58px;
                }

                .nftv-menu-text {
                    display: none;
                }

                .nftv-content {
                    padding-left: 58px;
                }

                .nftv-hero {
                    min-height: 420px;
                    padding: 45px 24px 35px;
                }

                .nftv-hero-description {
                    font-size: 14px;
                }

                .nftv-section {
                    padding: 0 15px;
                }

                .nftv-card {
                    flex-basis: 130px;
                    height: 195px;
                }

                .nftv-top10 {
                    flex-basis: 175px;
                    height: 215px;
                }

                .nftv-number {
                    font-size: 170px;
                }

                .nftv-top10-poster {
                    left: 45px;
                    width: 125px;
                    height: 188px;
                }

                .nftv-top10-info {
                    left: 45px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function openCard(card) {
        try {
            if (
                window.Lampa &&
                Lampa.Activity &&
                Lampa.Activity.push
            ) {
                Lampa.Activity.push({
                    component: 'full',
                    card_object: card,
                    page: 1
                });
            }
        } catch (error) {
            console.log(
                '[Netflix TV] Не удалось открыть карточку',
                error
            );
        }
    }

    function moveFocus(element, direction) {
        var row = element.parentElement;

        if (!row) return;

        var cards = Array.prototype.slice.call(
            row.querySelectorAll(
                '.nftv-card, .nftv-top10'
            )
        );

        var index = cards.indexOf(element);

        if (index < 0) return;

        var next = cards[index + direction];

        if (!next) return;

        next.focus();

        next.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }

    function addTouch(element, callback) {
        var startX = 0;
        var startY = 0;

        element.addEventListener(
            'touchstart',
            function (event) {

                if (!event.touches[0]) return;

                startX =
                    event.touches[0].clientX;

                startY =
                    event.touches[0].clientY;

                element.classList.add('touch');
            },
            { passive: true }
        );

        element.addEventListener(
            'touchend',
            function (event) {

                element.classList.remove('touch');

                if (!event.changedTouches[0]) return;

                var dx = Math.abs(
                    event.changedTouches[0].clientX -
                    startX
                );

                var dy = Math.abs(
                    event.changedTouches[0].clientY -
                    startY
                );

                /*
                 * Если палец практически не двигался —
                 * это обычное нажатие.
                 */

                if (dx < 12 && dy < 12) {
                    callback();
                }
            },
            { passive: true }
        );
    }

    function createCard(card) {
        var element =
            document.createElement('button');

        element.className = 'nftv-card';
        element.type = 'button';
        element.tabIndex = 0;

        var title =
            card.title ||
            card.name ||
            '';

        var image = '';

        if (card.poster_path) {
            image =
                'https://image.tmdb.org/t/p/w500' +
                card.poster_path;
        }

        element.innerHTML =
            '<img src="' +
            escapeHTML(image) +
            '" loading="lazy">' +

            '<div class="nftv-card-title">' +
            escapeHTML(title) +
            '</div>';

        element.onclick = function () {
            openCard(card);
        };

        element.onmouseenter = function () {
            element.focus();
        };

        element.onkeydown = function (event) {

            if (
                event.key === 'Enter' ||
                event.key === ' '
            ) {
                event.preventDefault();
                openCard(card);
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveFocus(element, 1);
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveFocus(element, -1);
            }
        };

        addTouch(element, function () {
            openCard(card);
        });

        return element;
    }

    function createTop10Card(card, number) {

        var element =
            document.createElement('button');

        element.className = 'nftv-top10';
        element.type = 'button';
        element.tabIndex = 0;

        var title =
            card.title ||
            card.name ||
            '';

        var image = '';

        if (card.poster_path) {
            image =
                'https://image.tmdb.org/t/p/w500' +
                card.poster_path;
        }

        element.innerHTML =
            '<div class="nftv-number">' +
            number +
            '</div>' +

            '<img class="nftv-top10-poster" ' +
            'src="' +
            escapeHTML(image) +
            '" loading="lazy">' +

            '<div class="nftv-top10-info">' +
                '<div class="nftv-top10-rank">' +
                'TOP ' +
                number +
                '</div>' +

                '<div class="nftv-top10-name">' +
                escapeHTML(title) +
                '</div>' +
            '</div>';

        element.onclick = function () {
            openCard(card);
        };

        element.onmouseenter = function () {
            element.focus();
        };

        element.onkeydown = function (event) {

            if (
                event.key === 'Enter' ||
                event.key === ' '
            ) {
                event.preventDefault();
                openCard(card);
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveFocus(element, 1);
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveFocus(element, -1);
            }
        };

        addTouch(element, function () {
            openCard(card);
        });

        return element;
    }

    function createRow(title, cards, top10) {

        var section =
            document.createElement('section');

        section.className =
            'nftv-section';

        var heading =
            document.createElement('div');

        heading.className =
            'nftv-section-title';

        heading.textContent = title;

        var row =
            document.createElement('div');

        row.className =
            'nftv-row';

        cards.forEach(function (card, index) {

            if (top10) {
                row.appendChild(
                    createTop10Card(
                        card,
                        index + 1
                    )
                );
            } else {
                row.appendChild(
                    createCard(card)
                );
            }
        });

        section.appendChild(heading);
        section.appendChild(row);

        /*
         * Горизонтальный свайп на телефоне.
         */

        var startX = 0;

        row.addEventListener(
            'touchstart',
            function (event) {

                if (event.touches[0]) {
                    startX =
                        event.touches[0].clientX;
                }
            },
            { passive: true }
        );

        row.addEventListener(
            'touchmove',
            function (event) {

                if (!event.touches[0]) return;

                var currentX =
                    event.touches[0].clientX;

                row.scrollLeft +=
                    startX - currentX;

                startX = currentX;
            },
            { passive: true }
        );

        return section;
    }

    function createMenuButton(
        icon,
        title,
        callback
    ) {

        var button =
            document.createElement('button');

        button.className =
            'nftv-menu-button';

        button.type = 'button';

        button.innerHTML =
            '<span class="nftv-menu-icon">' +
            icon +
            '</span>' +

            '<span class="nftv-menu-text">' +
            title +
            '</span>';

        button.onclick = callback;

        return button;
    }

    function createInterface() {

        /*
         * Если интерфейс уже существует —
         * второй раз его не создаём.
         */

        var old =
            document.getElementById(ROOT_ID);

        if (old) {
            old.remove();
        }

        var root =
            document.createElement('div');

        root.id = ROOT_ID;

        /* =========================
           ЗАКРЫТИЕ
           ========================= */

        var close =
            document.createElement('button');

        close.className =
            'nftv-close';

        close.type = 'button';

        close.textContent = '×';

        close.onclick = function () {
            root.remove();
        };

        root.appendChild(close);

        /* =========================
           МЕНЮ
           ========================= */

        var menu =
            document.createElement('aside');

        menu.className =
            'nftv-menu';

        var logo =
            document.createElement('div');

        logo.className =
            'nftv-logo';

        logo.textContent =
            'NETFLIX TV';

        menu.appendChild(logo);

        menu.appendChild(
            createMenuButton(
                '⌕',
                'Поиск',
                function () {
                    try {
                        if (
                            Lampa.Search &&
                            Lampa.Search.open
                        ) {
                            Lampa.Search.open();
                        }
                    } catch (e) {}
                }
            )
        );

        menu.appendChild(
            createMenuButton(
                '⌂',
                'Главная',
                function () {
                    root.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            )
        );

        menu.appendChild(
            createMenuButton(
                '▣',
                'Дата выхода',
                function () {
                    var element =
                        document.getElementById(
                            'nftv-release'
                        );

                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            )
        );

        menu.appendChild(
            createMenuButton(
                '▤',
                'Фильмы',
                function () {
                    var element =
                        document.getElementById(
                            'nftv-movies'
                        );

                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            )
        );

        menu.appendChild(
            createMenuButton(
                '▥',
                'Сериалы',
                function () {
                    var element =
                        document.getElementById(
                            'nftv-series'
                        );

                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            )
        );

        menu.appendChild(
            createMenuButton(
                '♥',
                'Избранное',
                function () {
                    try {
                        if (
                            Lampa.Activity &&
                            Lampa.Activity.push
                        ) {
                            Lampa.Activity.push({
                                component: 'favorite'
                            });
                        }
                    } catch (e) {}
                }
            )
        );

        root.appendChild(menu);

        /* =========================
           КОНТЕНТ
           ========================= */

        var content =
            document.createElement('main');

        content.className =
            'nftv-content';

        /* HERO */

        var hero =
            document.createElement('section');

        hero.className =
            'nftv-hero';

        hero.innerHTML =
            '<div class="nftv-hero-content">' +

                '<div class="nftv-hero-title">' +
                'Netflix TV' +
                '</div>' +

                '<div class="nftv-hero-info">' +
                'Фильмы • Сериалы • Top 10' +
                '</div>' +

                '<div class="nftv-hero-description">' +
                'Телевизионный интерфейс Lampa ' +
                'с управлением пультом, мышью и ' +
                'касанием.' +
                '</div>' +

                '<div class="nftv-hero-buttons">' +

                    '<button class="nftv-button nftv-play">' +
                    '▶ Смотреть' +
                    '</button>' +

                    '<button class="nftv-button nftv-details">' +
                    'ⓘ Подробнее' +
                    '</button>' +

                '</div>' +

            '</div>';

        content.appendChild(hero);

        /*
         * ПОКА ТЕСТОВЫЕ КАРТОЧКИ.
         *
         * Когда интерфейс заработает,
         * здесь подключим настоящие данные Lampa
         * и настоящий Netflix Top 10.
         */

        var movies = [];
        var series = [];

        for (var i = 1; i <= 10; i++) {

            movies.push({
                id: i,
                title: 'Фильм №' + i,
                media_type: 'movie'
            });

            series.push({
                id: i + 100,
                name: 'Сериал №' + i,
                media_type: 'tv'
            });
        }

        /* Рекомендации */

        var recommendations =
            createRow(
                'Рекомендации для вас',
                movies.slice(0, 6),
                false
            );

        content.appendChild(
            recommendations
        );

        /* Top 10 фильмов */

        var movieTop =
            createRow(
                'Top 10 Netflix — фильмы',
                movies,
                true
            );

        movieTop.id =
            'nftv-movies';

        content.appendChild(
            movieTop
        );

        /* Top 10 сериалов */

        var seriesTop =
            createRow(
                'Top 10 Netflix — сериалы',
                series,
                true
            );

        seriesTop.id =
            'nftv-series';

        content.appendChild(
            seriesTop
        );

        /* Дата выхода */

        var release =
            createRow(
                'Дата выхода',
                movies.slice(0, 6),
                false
            );

        release.id =
            'nftv-release';

        content.appendChild(
            release
        );

        root.appendChild(content);

        document.body.appendChild(root);

        /*
         * ESC закрывает интерфейс на компьютере.
         */

        document.addEventListener(
            'keydown',
            function escapeHandler(event) {

                if (event.key === 'Escape') {

                    var current =
                        document.getElementById(
                            ROOT_ID
                        );

                    if (current) {
                        current.remove();
                    }

                    document.removeEventListener(
                        'keydown',
                        escapeHandler
                    );
                }
            }
        );
    }

    /*
     * Даём возможность запустить интерфейс
     * вручную из консоли:
     *
     * NetflixTV.start()
     */

    window.NetflixTV = {
        start: startPlugin
    };

    bootstrap();

})();

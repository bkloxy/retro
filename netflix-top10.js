(function () {
    'use strict';

    /*
     * =========================================================
     * YAROSLAV NETFLIX UI
     * Lampa streaming interface
     * =========================================================
     */

    var PLUGIN_NAME = 'yaroslav_netflix_streaming_v2';

    if (window[PLUGIN_NAME]) return;
    window[PLUGIN_NAME] = true;

    function init() {

        if (!window.Lampa) {
            console.error('[Yaroslav Netflix] Lampa not found');
            return;
        }

        /*
         * =====================================================
         * CONFIG
         * =====================================================
         */

        var GENRES = [
            { id: 28, title: 'Боевики', icon: '⚡' },
            { id: 12, title: 'Приключения', icon: '◆' },
            { id: 16, title: 'Мультфильмы', icon: '●' },
            { id: 35, title: 'Комедии', icon: '☻' },
            { id: 80, title: 'Криминал', icon: '▣' },
            { id: 99, title: 'Документальные', icon: '▤' },
            { id: 18, title: 'Драмы', icon: '◆' },
            { id: 10751, title: 'Семейные', icon: '⌂' },
            { id: 14, title: 'Фэнтези', icon: '✦' },
            { id: 36, title: 'Исторические', icon: '◈' },
            { id: 27, title: 'Ужасы', icon: '☠' },
            { id: 10402, title: 'Музыкальные', icon: '♫' },
            { id: 9648, title: 'Детективы', icon: '⌕' },
            { id: 10749, title: 'Мелодрамы', icon: '♥' },
            { id: 878, title: 'Фантастика', icon: '✧' },
            { id: 10770, title: 'Телефильмы', icon: '▣' },
            { id: 53, title: 'Триллеры', icon: '!' },
            { id: 10752, title: 'Военные', icon: '★' },
            { id: 37, title: 'Вестерны', icon: 'W' }
        ];

        /*
         * =====================================================
         * CSS
         * =====================================================
         */

        var style = document.createElement('style');

        style.id = 'yaroslav-netflix-style';

        style.textContent = [

            /*
             * ROOT
             */

            'body.yar-netflix-enabled {',
            'background:#050505 !important;',
            '}',

            /*
             * MAIN LAMPA CONTENT
             */

            '.yar-netflix-main {',
            'position:relative;',
            'min-height:100vh;',
            'background:#050505;',
            'color:#fff;',
            'font-family:Arial,Helvetica,sans-serif;',
            'overflow:hidden;',
            '}',

            /*
             * LEFT NAVIGATION
             */

            '.yar-netflix-sidebar {',
            'position:fixed;',
            'left:0;',
            'top:0;',
            'bottom:0;',
            'width:82px;',
            'z-index:9999;',
            'background:linear-gradient(90deg,#050505 0%,rgba(5,5,5,.96) 72%,rgba(5,5,5,0) 100%);',
            'display:flex;',
            'flex-direction:column;',
            'align-items:center;',
            'padding-top:32px;',
            'transition:width .25s ease;',
            '}',

            '.yar-netflix-sidebar:hover {',
            'width:220px;',
            '}',

            '.yar-netflix-logo {',
            'font-size:25px;',
            'font-weight:900;',
            'color:#e50914;',
            'margin-bottom:35px;',
            '}',

            '.yar-netflix-nav {',
            'width:100%;',
            'display:flex;',
            'flex-direction:column;',
            'gap:8px;',
            '}',

            '.yar-netflix-nav-item {',
            'height:52px;',
            'width:calc(100% - 20px);',
            'margin-left:10px;',
            'border-radius:7px;',
            'display:flex;',
            'align-items:center;',
            'cursor:pointer;',
            'color:#aaa;',
            'transition:background .18s ease,color .18s ease;',
            '}',

            '.yar-netflix-nav-item:hover,',
            '.yar-netflix-nav-item.focused {',
            'background:rgba(255,255,255,.1);',
            'color:#fff;',
            '}',

            '.yar-netflix-nav-icon {',
            'width:62px;',
            'min-width:62px;',
            'text-align:center;',
            'font-size:21px;',
            '}',

            '.yar-netflix-nav-text {',
            'font-size:15px;',
            'font-weight:600;',
            'white-space:nowrap;',
            'opacity:0;',
            'transition:opacity .15s ease;',
            '}',

            '.yar-netflix-sidebar:hover .yar-netflix-nav-text {',
            'opacity:1;',
            '}',

            /*
             * PAGE
             */

            '.yar-netflix-page {',
            'margin-left:70px;',
            'padding-bottom:80px;',
            '}',

            /*
             * HERO
             */

            '.yar-netflix-hero {',
            'position:relative;',
            'height:520px;',
            'display:flex;',
            'align-items:flex-end;',
            'padding:0 6% 65px 6%;',
            'overflow:hidden;',
            'background:',
            'linear-gradient(90deg,#050505 0%,rgba(5,5,5,.82) 27%,rgba(5,5,5,.15) 72%,#050505 100%),',
            'linear-gradient(0deg,#050505 0%,transparent 45%),',
            'linear-gradient(135deg,#262626,#080808);',
            '}',

            '.yar-netflix-hero-content {',
            'max-width:650px;',
            'position:relative;',
            'z-index:2;',
            '}',

            '.yar-netflix-hero-kicker {',
            'font-size:13px;',
            'letter-spacing:3px;',
            'font-weight:700;',
            'text-transform:uppercase;',
            'color:#bbb;',
            'margin-bottom:15px;',
            '}',

            '.yar-netflix-hero-title {',
            'font-size:clamp(34px,5vw,70px);',
            'line-height:.98;',
            'font-weight:900;',
            'margin-bottom:20px;',
            '}',

            '.yar-netflix-hero-description {',
            'font-size:18px;',
            'line-height:1.45;',
            'color:#ddd;',
            'max-width:620px;',
            'margin-bottom:25px;',
            '}',

            '.yar-netflix-buttons {',
            'display:flex;',
            'gap:12px;',
            '}',

            '.yar-netflix-button {',
            'border:0;',
            'border-radius:5px;',
            'padding:13px 25px;',
            'font-size:16px;',
            'font-weight:700;',
            'cursor:pointer;',
            '}',

            '.yar-netflix-button-primary {',
            'background:#fff;',
            'color:#000;',
            '}',

            '.yar-netflix-button-secondary {',
            'background:rgba(90,90,90,.75);',
            'color:#fff;',
            '}',

            '.yar-netflix-button.focused {',
            'outline:3px solid #fff;',
            'outline-offset:3px;',
            '}',

            /*
             * ROWS
             */

            '.yar-netflix-content {',
            'padding:0 4% 40px 4%;',
            'position:relative;',
            'z-index:3;',
            '}',

            '.yar-netflix-section {',
            'margin-top:35px;',
            '}',

            '.yar-netflix-section-title {',
            'font-size:22px;',
            'font-weight:800;',
            'margin-bottom:15px;',
            '}',

            '.yar-netflix-track {',
            'display:flex;',
            'gap:13px;',
            'overflow-x:auto;',
            'overflow-y:hidden;',
            'padding:8px 4px 18px 4px;',
            'scrollbar-width:none;',
            '}',

            '.yar-netflix-track::-webkit-scrollbar {',
            'display:none;',
            '}',

            /*
             * POSTER
             */

            '.yar-netflix-card {',
            'position:relative;',
            'flex:0 0 170px;',
            'width:170px;',
            'aspect-ratio:2 / 3;',
            'border-radius:5px;',
            'overflow:hidden;',
            'background:#171717;',
            'cursor:pointer;',
            'transition:transform .18s ease,box-shadow .18s ease;',
            '}',

            '.yar-netflix-card:hover,',
            '.yar-netflix-card.focused {',
            'transform:scale(1.07);',
            'z-index:10;',
            'box-shadow:0 8px 30px rgba(0,0,0,.7);',
            'outline:3px solid #fff;',
            'outline-offset:-3px;',
            '}',

            '.yar-netflix-card img {',
            'width:100%;',
            'height:100%;',
            'object-fit:cover;',
            'display:block;',
            '}',

            '.yar-netflix-card-gradient {',
            'position:absolute;',
            'left:0;',
            'right:0;',
            'bottom:0;',
            'height:45%;',
            'background:linear-gradient(transparent,rgba(0,0,0,.95));',
            '}',

            '.yar-netflix-card-title {',
            'position:absolute;',
            'left:10px;',
            'right:10px;',
            'bottom:9px;',
            'font-size:14px;',
            'font-weight:700;',
            'white-space:nowrap;',
            'overflow:hidden;',
            'text-overflow:ellipsis;',
            '}',

            /*
             * TOP 10
             */

            '.yar-netflix-top-card {',
            'position:relative;',
            'flex:0 0 190px;',
            'width:190px;',
            'aspect-ratio:2 / 3;',
            '}',

            '.yar-netflix-top-number {',
            'position:absolute;',
            'bottom:-7px;',
            'left:-17px;',
            'font-size:105px;',
            'font-weight:900;',
            'line-height:.8;',
            'color:#050505;',
            '-webkit-text-stroke:3px #aaa;',
            'z-index:2;',
            'pointer-events:none;',
            '}',

            '.yar-netflix-top-poster {',
            'position:absolute;',
            'left:23px;',
            'right:0;',
            'top:0;',
            'bottom:0;',
            'border-radius:5px;',
            'overflow:hidden;',
            'background:#151515;',
            '}',

            '.yar-netflix-top-poster img {',
            'width:100%;',
            'height:100%;',
            'object-fit:cover;',
            '}',

            /*
             * GENRES
             */

            '.yar-netflix-genres {',
            'display:grid;',
            'grid-template-columns:repeat(auto-fill,minmax(180px,1fr));',
            'gap:12px;',
            '}',

            '.yar-netflix-genre {',
            'height:90px;',
            'border-radius:7px;',
            'display:flex;',
            'align-items:center;',
            'padding:0 22px;',
            'background:linear-gradient(135deg,#252525,#101010);',
            'border:1px solid rgba(255,255,255,.08);',
            'cursor:pointer;',
            'transition:transform .18s ease,background .18s ease;',
            '}',

            '.yar-netflix-genre:hover,',
            '.yar-netflix-genre.focused {',
            'transform:scale(1.04);',
            'background:linear-gradient(135deg,#333,#171717);',
            'outline:3px solid #fff;',
            'outline-offset:-3px;',
            '}',

            '.yar-netflix-genre-icon {',
            'font-size:27px;',
            'width:45px;',
            '}',

            '.yar-netflix-genre-title {',
            'font-size:16px;',
            'font-weight:700;',
            '}',

            /*
             * SEARCH
             */

            '.yar-netflix-search {',
            'display:none;',
            'position:fixed;',
            'left:50%;',
            'top:50%;',
            'transform:translate(-50%,-50%);',
            'width:min(650px,85vw);',
            'z-index:10000;',
            'background:#111;',
            'border-radius:8px;',
            'padding:25px;',
            'box-shadow:0 20px 80px rgba(0,0,0,.8);',
            '}',

            '.yar-netflix-search.active {',
            'display:block;',
            '}',

            '.yar-netflix-search input {',
            'width:100%;',
            'box-sizing:border-box;',
            'padding:17px;',
            'border:0;',
            'border-radius:5px;',
            'background:#252525;',
            'color:#fff;',
            'font-size:19px;',
            'outline:none;',
            '}',

            /*
             * MOBILE
             */

            '@media (max-width:700px) {',

            '.yar-netflix-sidebar {',
            'top:auto;',
            'right:0;',
            'width:100%;',
            'height:65px;',
            'bottom:0;',
            'padding:0;',
            'background:rgba(5,5,5,.97);',
            'flex-direction:row;',
            '}',

            '.yar-netflix-sidebar:hover {',
            'width:100%;',
            '}',

            '.yar-netflix-logo {',
            'display:none;',
            '}',

            '.yar-netflix-nav {',
            'height:100%;',
            'flex-direction:row;',
            'justify-content:space-around;',
            'gap:0;',
            '}',

            '.yar-netflix-nav-item {',
            'width:auto;',
            'margin:0;',
            'height:100%;',
            'border-radius:0;',
            'justify-content:center;',
            '}',

            '.yar-netflix-nav-icon {',
            'width:50px;',
            'font-size:20px;',
            '}',

            '.yar-netflix-nav-text {',
            'display:none;',
            '}',

            '.yar-netflix-page {',
            'margin-left:0;',
            'padding-bottom:70px;',
            '}',

            '.yar-netflix-hero {',
            'height:470px;',
            'padding:0 20px 35px 20px;',
            '}',

            '.yar-netflix-hero-description {',
            'font-size:15px;',
            '}',

            '.yar-netflix-content {',
            'padding:0 15px 30px 15px;',
            '}',

            '.yar-netflix-card {',
            'flex-basis:130px;',
            'width:130px;',
            '}',

            '.yar-netflix-top-card {',
            'flex-basis:150px;',
            'width:150px;',
            '}',

            '.yar-netflix-top-number {',
            'font-size:82px;',
            '}',

            '.yar-netflix-genres {',
            'grid-template-columns:repeat(2,1fr);',
            '}',

            '.yar-netflix-genre {',
            'height:72px;',
            'padding:0 12px;',
            '}',

            '}',

            /*
             * LARGE TV
             */

            '@media (min-width:1600px) {',

            '.yar-netflix-sidebar {',
            'width:100px;',
            '}',

            '.yar-netflix-page {',
            'margin-left:90px;',
            '}',

            '.yar-netflix-card {',
            'flex-basis:210px;',
            'width:210px;',
            '}',

            '.yar-netflix-top-card {',
            'flex-basis:230px;',
            'width:230px;',
            '}',

            '.yar-netflix-section-title {',
            'font-size:27px;',
            '}',

            '}',

        ].join('\n');

        document.head.appendChild(style);

        document.body.classList.add('yar-netflix-enabled');

        /*
         * =====================================================
         * HELPERS
         * =====================================================
         */

        function protocol() {
            if (Lampa.Utils && Lampa.Utils.protocol) {
                return Lampa.Utils.protocol();
            }

            return location.protocol === 'https:' ? 'https:' : 'http:';
        }

        function tmdbImage(path, size) {

            if (!path) return '';

            size = size || 'w500';

            return protocol() +
                'image.tmdb.org/t/p/' +
                size +
                path;
        }

        function escapeHtml(text) {

            return String(text || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        /*
         * =====================================================
         * OPEN GENRE
         * =====================================================
         */

        function openGenre(genre) {

            var activity = {
                url: 'discover/movie?with_genres=' + genre.id,
                title: genre.title,
                component: 'list',
                page: 1,
                filter: true,
                source: 'tmdb'
            };

            if (Lampa.Activity && Lampa.Activity.push) {
                Lampa.Activity.push(activity);
            }
        }

        /*
         * =====================================================
         * OPEN SEARCH
         * =====================================================
         */

        function openSearch() {

            if (Lampa.Activity && Lampa.Activity.push) {

                Lampa.Activity.push({
                    search: '',
                    title: 'Поиск'
                });

            }
        }

        /*
         * =====================================================
         * OPEN TOP ITEM
         * =====================================================
         */

        function openItem(item) {

            if (!item) return;

            if (Lampa.Activity && Lampa.Activity.push) {

                Lampa.Activity.push({
                    component: 'full',
                    card: item
                });

            }
        }

        /*
         * =====================================================
         * SIDE NAVIGATION
         * =====================================================
         */

        function createSidebar() {

            if (document.querySelector('.yar-netflix-sidebar')) {
                return;
            }

            var sidebar = document.createElement('aside');

            sidebar.className = 'yar-netflix-sidebar';

            sidebar.innerHTML =
                '<div class="yar-netflix-logo">N</div>' +

                '<div class="yar-netflix-nav">' +

                '<div class="yar-netflix-nav-item focused" data-action="home">' +
                '<div class="yar-netflix-nav-icon">⌂</div>' +
                '<div class="yar-netflix-nav-text">Главная</div>' +
                '</div>' +

                '<div class="yar-netflix-nav-item" data-action="movies">' +
                '<div class="yar-netflix-nav-icon">▣</div>' +
                '<div class="yar-netflix-nav-text">Фильмы</div>' +
                '</div>' +

                '<div class="yar-netflix-nav-item" data-action="series">' +
                '<div class="yar-netflix-nav-icon">▤</div>' +
                '<div class="yar-netflix-nav-text">Сериалы</div>' +
                '</div>' +

                '<div class="yar-netflix-nav-item" data-action="genres">' +
                '<div class="yar-netflix-nav-icon">◆</div>' +
                '<div class="yar-netflix-nav-text">Жанры</div>' +
                '</div>' +

                '<div class="yar-netflix-nav-item" data-action="top">' +
                '<div class="yar-netflix-nav-icon">10</div>' +
                '<div class="yar-netflix-nav-text">TOP 10</div>' +
                '</div>' +

                '<div class="yar-netflix-nav-item" data-action="search">' +
                '<div class="yar-netflix-nav-icon">⌕</div>' +
                '<div class="yar-netflix-nav-text">Поиск</div>' +
                '</div>' +

                '</div>';

            document.body.appendChild(sidebar);

            var items = sidebar.querySelectorAll('.yar-netflix-nav-item');

            for (var i = 0; i < items.length; i++) {

                items[i].addEventListener('click', function () {

                    var action = this.getAttribute('data-action');

                    if (action === 'search') {
                        openSearch();
                    }

                    if (action === 'genres') {
                        var genreElement = document.querySelector('.yar-netflix-genres');

                        if (genreElement) {
                            genreElement.scrollIntoView({
                                behavior: 'smooth'
                            });
                        }
                    }

                    if (action === 'top') {
                        var topElement = document.querySelector('[data-yar-section="top"]');

                        if (topElement) {
                            topElement.scrollIntoView({
                                behavior: 'smooth'
                            });
                        }
                    }

                    if (action === 'movies') {

                        if (Lampa.Activity && Lampa.Activity.push) {

                            Lampa.Activity.push({
                                url: 'discover/movie?sort_by=popularity.desc',
                                title: 'Фильмы',
                                component: 'list',
                                page: 1,
                                filter: true,
                                source: 'tmdb'
                            });

                        }

                    }

                    if (action === 'series') {

                        if (Lampa.Activity && Lampa.Activity.push) {

                            Lampa.Activity.push({
                                url: 'discover/tv?sort_by=popularity.desc',
                                title: 'Сериалы',
                                component: 'list',
                                page: 1,
                                filter: true,
                                source: 'tmdb'
                            });

                        }

                    }

                });

            }

        }

        /*
         * =====================================================
         * HERO
         * =====================================================
         */

        function createHero() {

            if (document.querySelector('.yar-netflix-hero')) {
                return;
            }

            var hero = document.createElement('section');

            hero.className = 'yar-netflix-hero';

            hero.innerHTML =
                '<div class="yar-netflix-hero-content">' +

                '<div class="yar-netflix-hero-kicker">' +
                'СТРИМИНГ' +
                '</div>' +

                '<div class="yar-netflix-hero-title">' +
                'Смотрите то,<br>что хотите' +
                '</div>' +

                '<div class="yar-netflix-hero-description">' +
                'Фильмы, сериалы, подборки и мировые рейтинги в одном интерфейсе.' +
                '</div>' +

                '<div class="yar-netflix-buttons">' +

                '<button class="yar-netflix-button yar-netflix-button-primary" data-hero-action="movies">' +
                '▶ Смотреть' +
                '</button>' +

                '<button class="yar-netflix-button yar-netflix-button-secondary" data-hero-action="genres">' +
                'Жанры' +
                '</button>' +

                '</div>' +

                '</div>';

            var page = document.querySelector('.yar-netflix-page');

            if (page) {
                page.insertBefore(hero, page.firstChild);
            }

            var buttons = hero.querySelectorAll('.yar-netflix-button');

            for (var i = 0; i < buttons.length; i++) {

                buttons[i].addEventListener('click', function () {

                    var action = this.getAttribute('data-hero-action');

                    if (action === 'movies') {

                        if (Lampa.Activity && Lampa.Activity.push) {

                            Lampa.Activity.push({
                                url: 'discover/movie?sort_by=popularity.desc',
                                title: 'Фильмы',
                                component: 'list',
                                page: 1,
                                filter: true,
                                source: 'tmdb'
                            });

                        }

                    }

                    if (action === 'genres') {

                        var genres = document.querySelector('.yar-netflix-genres');

                        if (genres) {
                            genres.scrollIntoView({
                                behavior: 'smooth'
                            });
                        }

                    }

                });

            }

        }

        /*
         * =====================================================
         * GENRE BLOCK
         * =====================================================
         */

        function createGenres() {

            var old = document.querySelector('.yar-netflix-genres-section');

            if (old) old.remove();

            var section = document.createElement('section');

            section.className =
                'yar-netflix-section yar-netflix-genres-section';

            section.setAttribute('data-yar-section', 'genres');

            var title = document.createElement('div');

            title.className = 'yar-netflix-section-title';

            title.textContent = 'ЖАНРЫ';

            section.appendChild(title);

            var grid = document.createElement('div');

            grid.className = 'yar-netflix-genres';

            for (var i = 0; i < GENRES.length; i++) {

                var genre = GENRES[i];

                var element = document.createElement('div');

                element.className = 'yar-netflix-genre';

                element.setAttribute('tabindex', '0');

                element.setAttribute('data-genre-id', genre.id);

                element.innerHTML =
                    '<div class="yar-netflix-genre-icon">' +
                    escapeHtml(genre.icon) +
                    '</div>' +

                    '<div class="yar-netflix-genre-title">' +
                    escapeHtml(genre.title) +
                    '</div>';

                (function (currentGenre, currentElement) {

                    currentElement.addEventListener('click', function () {
                        openGenre(currentGenre);
                    });

                    currentElement.addEventListener('keydown', function (event) {

                        if (event.key === 'Enter') {
                            openGenre(currentGenre);
                        }

                    });

                })(genre, element);

                grid.appendChild(element);

            }

            section.appendChild(grid);

            var content = document.querySelector('.yar-netflix-content');

            if (content) {
                content.appendChild(section);
            }

        }

        /*
         * =====================================================
         * CUSTOM TOP 10
         * =====================================================
         *
         * Здесь пока используются реальные Lampa/TMDB
         * данные, а не фальшивые "Фильм №1".
         *
         * Позже сюда можно подключить Netflix Top 10 API/CSV.
         */

        function loadTop10() {

            if (!Lampa.Reguest) {
                return;
            }

            var request = new Lampa.Reguest();

            var url =
                protocol() +
                'api.themoviedb.org/3/trending/movie/week' +
                '?api_key=' +
                (Lampa.Storage.field('tmdb_api_key') ||
                    '4ddbc101915f8a272157b31867927c16') +
                '&language=' +
                (Lampa.Storage.get('language', 'ru') || 'ru');

            request.silent(url, function (data) {

                if (!data || !data.results) return;

                createTopRow(
                    'TOP 10 ФИЛЬМОВ — МИР',
                    data.results.slice(0, 10),
                    'movies'
                );

            }, function () {

                console.log('[Yaroslav Netflix] movie top error');

            });

            var tvUrl =
                protocol() +
                'api.themoviedb.org/3/trending/tv/week' +
                '?api_key=' +
                (Lampa.Storage.field('tmdb_api_key') ||
                    '4ddbc101915f8a272157b31867927c16') +
                '&language=' +
                (Lampa.Storage.get('language', 'ru') || 'ru');

            request.silent(tvUrl, function (data) {

                if (!data || !data.results) return;

                createTopRow(
                    'TOP 10 СЕРИАЛОВ — МИР',
                    data.results.slice(0, 10),
                    'tv'
                );

            }, function () {

                console.log('[Yaroslav Netflix] tv top error');

            });

        }

        /*
         * =====================================================
         * TOP ROW
         * =====================================================
         */

        function createTopRow(title, items, type) {

            var content = document.querySelector('.yar-netflix-content');

            if (!content) return;

            var section = document.createElement('section');

            section.className =
                'yar-netflix-section yar-netflix-top-section';

            section.setAttribute('data-yar-section', 'top');

            var heading = document.createElement('div');

            heading.className =
                'yar-netflix-section-title';

            heading.textContent = title;

            section.appendChild(heading);

            var track = document.createElement('div');

            track.className =
                'yar-netflix-track';

            for (var i = 0; i < items.length; i++) {

                var item = items[i];

                var card = document.createElement('div');

                card.className =
                    'yar-netflix-top-card';

                card.setAttribute('tabindex', '0');

                var poster = item.poster_path
                    ? tmdbImage(item.poster_path, 'w500')
                    : '';

                card.innerHTML =

                    '<div class="yar-netflix-top-number">' +
                    (i + 1) +
                    '</div>' +

                    '<div class="yar-netflix-top-poster">' +

                    (poster
                        ? '<img src="' + escapeHtml(poster) + '">' 
                        : '') +

                    '</div>';

                (function (currentItem, currentCard) {

                    currentCard.addEventListener('click', function () {

                        currentItem.source = 'tmdb';

                        if (type === 'tv') {

                            currentItem.name =
                                currentItem.name ||
                                currentItem.title;

                            currentItem.original_name =
                                currentItem.original_name ||
                                currentItem.original_title;

                            currentItem.first_air_date =
                                currentItem.first_air_date ||
                                currentItem.release_date;

                        }

                        openItem(currentItem);

                    });

                    currentCard.addEventListener('keydown', function (event) {

                        if (event.key === 'Enter') {

                            currentItem.source = 'tmdb';

                            openItem(currentItem);

                        }

                    });

                })(item, card);

                track.appendChild(card);

            }

            section.appendChild(track);

            /*
             * TOP 10 помещаем после hero,
             * перед жанрами.
             */

            var genres = document.querySelector(
                '.yar-netflix-genres-section'
            );

            if (genres) {

                content.insertBefore(section, genres);

            } else {

                content.appendChild(section);

            }

        }

        /*
         * =====================================================
         * PAGE CONTAINER
         * =====================================================
         */

        function createPage() {

            if (document.querySelector('.yar-netflix-main')) {
                return;
            }

            var main = document.createElement('div');

            main.className = 'yar-netflix-main';

            var page = document.createElement('div');

            page.className = 'yar-netflix-page';

            var content = document.createElement('div');

            content.className = 'yar-netflix-content';

            page.appendChild(content);

            main.appendChild(page);

            document.body.appendChild(main);

            /*
             * Не скрываем оригинальную Lampa сразу.
             * Сначала создаём собственную оболочку.
             */

            createSidebar();

            createHero();

            createGenres();

            loadTop10();

        }

        /*
         * =====================================================
         * CONTROLLER
         * =====================================================
         *
         * TV / remote navigation.
         */

        function setupController() {

            if (!Lampa.Controller) {
                return;
            }

            var focusIndex = 0;

            function getFocusable() {

                var result = [];

                var elements =
                    document.querySelectorAll(
                        '.yar-netflix-nav-item,' +
                        '.yar-netflix-card,' +
                        '.yar-netflix-top-card,' +
                        '.yar-netflix-genre,' +
                        '.yar-netflix-button'
                    );

                for (var i = 0; i < elements.length; i++) {
                    result.push(elements[i]);
                }

                return result;

            }

            function setFocus(index) {

                var elements = getFocusable();

                if (!elements.length) {
                    return;
                }

                if (index < 0) {
                    index = 0;
                }

                if (index >= elements.length) {
                    index = elements.length - 1;
                }

                focusIndex = index;

                for (var i = 0; i < elements.length; i++) {
                    elements[i].classList.remove('focused');
                }

                var current = elements[focusIndex];

                if (current) {

                    current.classList.add('focused');

                    try {
                        current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                            inline: 'center'
                        });
                    } catch (e) {}

                }

            }

            Lampa.Controller.add('yaroslav_netflix', {

                toggle: function () {

                    var elements = getFocusable();

                    if (!elements.length) {
                        return;
                    }

                    setFocus(focusIndex);

                },

                left: function () {

                    setFocus(focusIndex - 1);

                },

                right: function () {

                    setFocus(focusIndex + 1);

                },

                up: function () {

                    setFocus(focusIndex - 1);

                },

                down: function () {

                    setFocus(focusIndex + 1);

                },

                ok: function () {

                    var elements = getFocusable();

                    var current = elements[focusIndex];

                    if (current) {
                        current.click();
                    }

                },

                back: function () {

                    return false;

                }

            });

        }

        /*
         * =====================================================
         * APP READY
         * =====================================================
         */

        createPage();

        setupController();

        console.log(
            '[Yaroslav Netflix] Streaming interface loaded'
        );

    }

    /*
     * Lampa 3.x / appready
     */

    if (window.appready) {

        init();

    } else {

        if (Lampa.Listener) {

            Lampa.Listener.follow('app', function (event) {

                if (event.type === 'ready') {
                    init();
                }

            });

        } else {

            window.addEventListener('appready', init);

        }

    }

})();

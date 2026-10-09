(function () {
    'use strict';
    if (!window.Lampa || !window.$) return;
    if (window.retroMenuVersion >= 21) return;
    window.retroMenuVersion = 21;
    var STYLE_ID = 'retro-menu-v21-style';
    var SEARCH_ACTION = 'retro_search';
    var CATEGORIES = {
        main: true,
        feed: true,
        movie: true,
        cartoon: true,
        tv: true,
        myperson: true,
        relise: true,
        anime: true,
        favorite: true,
        history: true,
        subscribes: true,
        timetable: true,
        mytorrents: true
    };
    var searchIcon =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="11" cy="11" r="7"/>' +
        '<path d="m20 20-4-4"/>' +
        '</svg>';
    var focusTimer = null;
    var lastAction = '';
    var switching = false;
    var rightPressed = false;
    var started = false;
    function addStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            body.retro-menu-v21 .wrap__left {
                background: #101010 !important;
                border: none !important;
            }
            body.retro-menu-v21 .menu__item {
                box-sizing: border-box !important;
                border-radius: 9px !important;
                background: transparent !important;
                color: #aaa !important;
                transition: background .12s ease, color .12s ease;
            }
            body.retro-menu-v21 .menu__item.focus {
                background: #292929 !important;
                color: #fff !important;
                outline: none !important;
            }
            body.retro-menu-v21 .menu__item.focus .menu__text {
                color: #fff !important;
                font-weight: 700 !important;
            }
            body.retro-menu-v21 .menu__ico {
                color: inherit !important;
            }
            body.retro-menu-v21 .retro-search-item {
                margin-bottom: .6em !important;
                padding-bottom: .6em !important;
                border-bottom: 1px solid #353535 !important;
            }
            body.retro-menu-v21 .retro-search-item svg {
                display: block;
                width: 1.5em;
                height: 1.5em;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('retro-menu-v21');
    }
    function keepMenuVisible() {
        try {
            if (Lampa.Storage && Lampa.Storage.set) {
                Lampa.Storage.set('menu_always', true);
            }
            document.body.classList.add('menu--open');
            $('.wrap__left')
                .removeClass('wrap__left--hidden');
        } catch (e) {
            console.warn('[Retro Menu] Visibility:', e);
        }
    }
    function addSearch() {
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;
        var item = list.find('.retro-search-item').first();
        if (!item.length) {
            item = $(
                '<li class="menu__item selector retro-search-item" ' +
                'data-action="' + SEARCH_ACTION + '">' +
                '<div class="menu__ico">' + searchIcon + '</div>' +
                '<div class="menu__text">Поиск</div>' +
                '</li>'
            );
            item.on('hover:enter', function () {
                openSearch();
            });
        }
        if (item.parent()[0] !== list[0] ||
            item[0] !== list.children().first()[0]) {
            item.prependTo(list);
        }
    }
    function openSearch() {
        try {
            var nativeSearch = $('.open--search').first();
            if (nativeSearch.length) {
                nativeSearch.trigger('hover:enter');
            } else if (Lampa.Search && Lampa.Search.open) {
                Lampa.Search.open();
            } else {
                console.warn('[Retro Menu] Search action unavailable');
            }
        } catch (e) {
            console.error('[Retro Menu] Search:', e);
        }
    }
    function menuIsOpen() {
        var left = $('.wrap__left').first();
        return left.length &&
            !left.hasClass('wrap__left--hidden') &&
            document.body.classList.contains('menu--open');
    }
    function selectCategory(item, action) {
        if (switching || rightPressed || !menuIsOpen()) return;
        if (!item || !item.isConnected) return;
        if (!$(item).hasClass('focus')) return;
        if (!CATEGORIES[action]) return;
        if (action === lastAction) return;
        lastAction = action;
        switching = true;
        try {
            /*
             * Запускаем штатное действие категории только после
             * того, как фокус остановился на нужном пункте.
             * Повторно меню не переключаем и фокус насильно
             * не возвращаем: этим занимается Lampa.
             */
            $(item).trigger('hover:enter');
        } catch (e) {
            console.error('[Retro Menu] Category:', action, e);
        }
        setTimeout(function () {
            switching = false;
            keepMenuVisible();
            addSearch();
        }, 250);
    }
    function onMenuFocus() {
        if (rightPressed || switching) return;
        var item = this;
        var action = String($(item).attr('data-action') || '');
        if (!action || action === SEARCH_ACTION) return;
        if (!CATEGORIES[action]) return;
        clearTimeout(focusTimer);
        focusTimer = setTimeout(function () {
            selectCategory(item, action);
        }, 220);
    }
    function bindNavigation() {
        /*
         * Не перехватываем стрелки и не блокируем стандартный
         * Controller Lampa. Это позволяет штатно переходить
         * вправо к карточкам и влево обратно в меню.
         */
        document.addEventListener('keydown', function (event) {
            var key = event.key;
            var code = event.keyCode;
            if (key === 'ArrowRight' || code === 39) {
                rightPressed = true;
                clearTimeout(focusTimer);
            }
            if (key === 'ArrowLeft' || code === 37) {
                rightPressed = false;
            }
        }, false);
        $(document).on(
            'hover:focus.retroMenuV21',
            '.wrap__left .menu__item',
            function () {
                rightPressed = false;
                onMenuFocus.call(this);
            }
        );
    }
    function start() {
        if (started) return;
        started = true;
        addStyle();
        addSearch();
        bindNavigation();
        var observer = new MutationObserver(function () {
            addSearch();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('[Retro Menu] v21 initialized');
    }
    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    }
})();

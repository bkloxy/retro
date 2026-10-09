
(function () {
    'use strict';

    if (!window.Lampa || !window.$) return;
    if (window.retroMenuVersion >= 20) return;
    window.retroMenuVersion = 20;

    var STYLE_ID = 'retro-menu-v20-style';
    var SEARCH_ACTION = 'retro_search';

    // Категории Lampa, которые переключаются автоматически.
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
        'stroke-width="2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"/>' +
        '<path d="m20 20-4-4"/></svg>';

    var focusTimer = null;
    var restoreTimer = null;
    var currentAction = '';
    var generation = 0;
    var movingRight = false;
    var restoring = false;
    var started = false;

    // --------------------------------------------------
    // ОФОРМЛЕНИЕ
    // --------------------------------------------------

    function addStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            body.retro-menu-v20 .wrap__left {
                background: rgba(12,12,12,.98) !important;
                border: 0 !important;
            }

            body.retro-menu-v20 .menu__item {
                background: transparent !important;
                color: #999 !important;
                border-radius: 8px !important;
                transition: color .15s ease;
            }

            body.retro-menu-v20 .menu__item.focus {
                color: #fff !important;
                background: rgba(255,255,255,.09) !important;
            }

            body.retro-menu-v20 .menu__item.focus .menu__text {
                color: #fff !important;
                font-weight: 700 !important;
            }

            body.retro-menu-v20 .menu__item .menu__ico {
                color: inherit !important;
            }

            body.retro-menu-v20 .retro-search-item {
                margin-bottom: .6em !important;
                padding-bottom: .55em !important;
                border-bottom: 1px solid rgba(255,255,255,.15) !important;
            }

            body.retro-menu-v20 .retro-search-item svg {
                width: 1.5em;
                height: 1.5em;
            }
        `;

        document.head.appendChild(style);
        document.body.classList.add('retro-menu-v20');
    }

    // --------------------------------------------------
    // ПОИСК — ПЕРВЫЙ ПУНКТ
    // --------------------------------------------------

    function addSearch() {
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;

        var item = list.find('.retro-search-item');

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

        // Всегда ставим поиск первым, не создавая копий.
        if (!item.is(list.children().first())) {
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
            }
        } catch (error) {
            console.error('[Retro Menu] Search:', error);
        }
    }

    // --------------------------------------------------
    // ПОИСК ПУНКТА ПО ЕГО ACTION
    // --------------------------------------------------

    function findItem(action) {
        var found = null;

        $('.wrap__left .menu__item').each(function () {
            if (String($(this).attr('data-action') || '') === String(action)) {
                found = this;
                return false;
            }
        });

        return found;
    }

    function menuIsOpen() {
        var bodyOpen = document.body.classList.contains('menu--open');
        var left = $('.wrap__left').first();

        if (!left.length) return false;

        var hidden = left.hasClass('wrap__left--hidden');

        return bodyOpen && !hidden;
    }

    // --------------------------------------------------
    // ВОЗВРАЩЕНИЕ ФОКУСА В МЕНЮ
    // --------------------------------------------------

    function restoreFocus(action, token) {
        if (token !== generation || movingRight) return;

        if (restoreTimer) clearTimeout(restoreTimer);

        restoreTimer = setTimeout(function () {
            if (token !== generation || movingRight) return;

            restoring = true;

            try {
                /*
                 * Если Lampa закрыла меню при переходе
                 * в категорию, открываем его ОДИН раз.
                 */
                if (!menuIsOpen()) {
                    Lampa.Controller.toggle('menu');
                }

                setTimeout(function () {
                    if (token !== generation || movingRight) {
                        restoring = false;
                        return;
                    }

                    addSearch();

                    var item = findItem(action);

                    if (item) {
                        Lampa.Controller.focus(item);
                    }

                    currentAction = action;
                    restoring = false;
                }, 180);

            } catch (error) {
                restoring = false;
                console.error('[Retro Menu] Restore:', error);
            }

        }, 220);
    }

    // --------------------------------------------------
    // ВВЕРХ / ВНИЗ: АВТОВЫБОР КАТЕГОРИИ
    // --------------------------------------------------

    function onMenuFocus() {
        if (restoring) return;
        if (movingRight) return;
        if (!menuIsOpen()) return;

        var item = this;
        var action = String($(item).attr('data-action') || '');

        // Поиск открывается отдельно, не при простом фокусе.
        if (action === SEARCH_ACTION) {
            currentAction = action;
            return;
        }

        // Не запускаем действия поиска, профиля и настроек.
        if (!CATEGORIES[action]) {
            currentAction = action;
            return;
        }

        if (action === currentAction) return;

        currentAction = action;
        generation++;

        var token = generation;

        clearTimeout(focusTimer);
        clearTimeout(restoreTimer);

        /*
         * Небольшая задержка нужна, чтобы при быстром
         * пролистывании не загружать каждую промежуточную
         * категорию.
         */
        focusTimer = setTimeout(function () {
            if (token !== generation || movingRight) return;
            if (!menuIsOpen()) return;
            if (!item.isConnected) return;
            if (!$(item).hasClass('focus')) return;

            try {
                /*
                 * Используем штатное действие категории Lampa.
                 * Оно загружает раздел без нажатия OK.
                 */
                $(item).trigger('hover:enter');

                /*
                 * Lampa может закрыть меню после открытия
                 * раздела. Возвращаемся к тому же пункту.
                 */
                restoreFocus(action, token);

            } catch (error) {
                console.error('[Retro Menu] Category:', error);
            }

        }, 160);
    }

    // --------------------------------------------------
    // ПЕРЕХОД ВПРАВО И НАЗАД ВЛЕВО
    // --------------------------------------------------

    function bindNavigation() {
        /*
         * Не блокируем клавиши и не вызываем preventDefault.
         * Даём штатному контроллеру Lampa переводить фокус.
         *
         * Вправо отменяет восстановление меню, чтобы оно
         * не открывалось снова после перехода к карточкам.
         */
        document.addEventListener('keydown', function (event) {
            var key = event.key;
            var code = event.keyCode;

            if (key === 'ArrowRight' || code === 39) {
                movingRight = true;

                clearTimeout(focusTimer);
                clearTimeout(restoreTimer);

                generation++;
            }

            if (key === 'ArrowLeft' || code === 37) {
                movingRight = false;
            }
        }, false);

        /*
         * Когда фокус возвращается в боковое меню,
         * снова разрешаем автоматическое переключение.
         */
        $(document).on(
            'hover:focus.retroMenuV20',
            '.wrap__left .menu__item',
            function () {
                movingRight = false;
                onMenuFocus.call(this);
            }
        );
    }

    // --------------------------------------------------
    // ЗАПУСК
    // --------------------------------------------------

    function start() {
        if (started) return;
        started = true;

        addStyle();
        addSearch();
        bindNavigation();

        /*
         * Lampa может перерисовать меню при смене экрана.
         * Следим только за наличием первого пункта поиска.
         * Не переключаем контроллер через MutationObserver.
         */
        var observer = new MutationObserver(function () {
            addSearch();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Retro Menu] v20 initialized');
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    }
})();

      


(function () {
    'use strict';

    if (!window.Lampa || !window.$) return;
    if (window.retroFocusMenuLoaded) return;
    window.retroFocusMenuLoaded = true;

    var VERSION = 12;
    var STYLE_ID = 'retro-focus-menu-style';

    var SAFE = {
        main: 1,
        feed: 1,
        movie: 1,
        cartoon: 1,
        tv: 1,
        myperson: 1,
        relise: 1,
        anime: 1,
        favorite: 1,
        history: 1,
        subscribes: 1,
        timetable: 1,
        mytorrents: 1
    };

    var ICON_SEARCH =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';

    var ICON_PROFILE =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

    var timer = null;
    var lastAction = '';
    var lastFocusedElement = null;
    var restoring = false;
    var started = false;

    function storage(key, fallback) {
        try {
            return Lampa.Storage.get(key, fallback);
        } catch (e) {
            return fallback;
        }
    }

    function enabled(key, fallback) {
        var value = storage(key, fallback);
        return value === true || value === 'true';
    }

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();

        var css = `
            body.retro-focus-menu .wrap__left {
                background: linear-gradient(
                    90deg,
                    rgba(0,0,0,.99) 0%,
                    rgba(0,0,0,.96) 76%,
                    rgba(0,0,0,.82) 100%
                ) !important;
                border: 0 !important;
            }

            body.retro-focus-menu.menu--open .wrap__content {
                filter: brightness(.48);
            }

            body.retro-focus-menu .wrap__content {
                transition: filter .2s ease;
            }

            body.retro-focus-menu .menu__item {
                background: transparent !important;
                color: #999 !important;
                border-radius: 0 !important;
                transition: color .15s ease;
            }

            body.retro-focus-menu .menu__item .menu__text {
                color: inherit !important;
                font-weight: 500;
                font-size: 1.18em;
            }

            body.retro-focus-menu .menu__item .menu__ico {
                color: inherit !important;
                position: relative;
            }

            body.retro-focus-menu .menu__item.focus,
            body.retro-focus-menu .menu__item.hover {
                color: #fff !important;
                background: transparent !important;
            }

            body.retro-focus-menu .menu__item.focus .menu__text {
                font-weight: 800;
            }

            body.retro-focus-menu .menu__item.focus .menu__ico:after,
            body.retro-focus-menu .menu__item.retro-current .menu__ico:after {
                content: "";
                position: absolute;
                left: 10%;
                right: 10%;
                bottom: -.3em;
                height: .15em;
                border-radius: 1em;
                background: #e50914;
            }

            body.retro-focus-menu .menu__item.retro-current {
                color: #ddd !important;
            }

            body.retro-focus-menu .wrap__left {
                overflow: visible !important;
            }
        `;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    function getItem(action) {
        var found = null;

        $('.wrap__left .menu__item').each(function () {
            if (String($(this).data('action') || '') === String(action)) {
                found = this;
                return false;
            }
        });

        return found;
    }

    function markCurrent() {
        var active = '';

        try {
            var activity = Lampa.Activity.active();

            if (activity) {
                var component = String(activity.component || '');
                var url = String(activity.url || '');

                if (component === 'main') active = 'main';
                else if (url === 'movie') active = 'movie';
                else if (url === 'tv') active = 'tv';
                else if (/favorite|bookmark/.test(component)) active = 'favorite';
                else active = component || url;
            }
        } catch (e) {}

        $('.wrap__left .menu__item').each(function () {
            var action = String($(this).data('action') || '');
            $(this).toggleClass('retro-current', !!active && action === active);
        });
    }

    function addExtraItems() {
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;

        if (!$('.retro-search-item').length) {
            var search = $(
                '<li class="menu__item selector retro-search-item" data-action="retro_search">' +
                '<div class="menu__ico">' + ICON_SEARCH + '</div>' +
                '<div class="menu__text">Поиск</div></li>'
            );

            search.on('hover:enter', function () {
                try {
                    var button = $('.open--search').first();

                    if (button.length) button.trigger('hover:enter');
                    else Lampa.Search.open();
                } catch (e) {}

                return false;
            });

            list.prepend(search);
        }

        if (!$('.retro-profile-item').length) {
            var profile = $(
                '<li class="menu__item selector retro-profile-item" data-action="retro_profile">' +
                '<div class="menu__ico">' + ICON_PROFILE + '</div>' +
                '<div class="menu__text">Профиль</div></li>'
            );

            profile.on('hover:enter', function () {
                try {
                    $('.open--profile').first().trigger('hover:enter');
                } catch (e) {}

                return false;
            });

            list.append(profile);
        }
    }

    /*
     * После выбора категории восстанавливаем боковое меню
     * ровно один раз. Никаких повторных toggle через цепочку таймеров.
     */
    function restoreMenu(action) {
        if (restoring) return;

        restoring = true;

        setTimeout(function () {
            try {
                var body = document.body;

                if (!body.classList.contains('menu--open')) {
                    Lampa.Controller.toggle('menu');
                }

                body.classList.add('retro-focus-menu');

                setTimeout(function () {
                    var item = getItem(action);

                    if (item) {
                        Lampa.Controller.focus(item);
                        lastFocusedElement = item;
                    }

                    restoring = false;
                    markCurrent();
                }, 100);
            } catch (e) {
                restoring = false;
            }
        }, 180);
    }

    /*
     * ОСНОВНАЯ ЛОГИКА
     *
     * Фокус на категории:
     *   1. Запоминаем пункт.
     *   2. Автоматически открываем категорию.
     *   3. Возвращаем фокус в боковое меню.
     *
     * Вправо:
     *   Остаётся родное поведение Lampa —
     *   переход из меню в контент.
     *
     * OK:
     *   Не перехватываем.
     */
    function onMenuFocus() {
        if (!enabled('retro_menu_auto', true)) return;
        if (!document.body.classList.contains('menu--open')) return;

        var element = this;
        var action = String($(element).data('action') || '');

        if (!SAFE[action]) {
            lastAction = action;
            clearTimeout(timer);
            return;
        }

        if (lastAction === action) return;

        lastAction = action;
        clearTimeout(timer);

        var delay = parseInt(storage('retro_menu_delay', '200'), 10);
        if (!isFinite(delay)) delay = 200;
        delay = Math.max(0, Math.min(delay, 700));

        timer = setTimeout(function () {
            if (!element.isConnected) return;
            if (!$(element).hasClass('focus')) return;
            if (!document.body.classList.contains('menu--open')) return;

            /*
             * Переходим в категорию только при смене фокуса.
             * Повторный hover:enter для того же пункта не вызываем.
             */
            try {
                $(element).trigger('hover:enter');
                restoreMenu(action);
            } catch (e) {}
        }, delay);
    }

    function bindEvents() {
        /*
         * Слушаем только фокус пунктов меню.
         * Клавиши пульта и мыши не перехватываем.
         */
        $(document).on(
            'hover:focus.retroFocusMenu',
            '.wrap__left .menu__item',
            onMenuFocus
        );

        /*
         * При смене пункта разрешаем автоматический выбор
         * другой категории.
         */
        $(document).on(
            'hover:focus.retroFocusReset',
            '.wrap__left .menu__item',
            function () {
                var action = String($(this).data('action') || '');

                if (lastAction !== action) {
                    clearTimeout(timer);
                }
            }
        );

        /*
         * Отслеживаем изменения текущего раздела,
         * но не переключаем контроллер и не открываем меню.
         */
        Lampa.Listener.follow('activity', function () {
            setTimeout(markCurrent, 100);
        });
    }

    function registerSettings() {
        try {
            Lampa.SettingsApi.addComponent({
                component: 'retro_menu',
                name: 'Retro — меню',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
            });

            Lampa.SettingsApi.addParam({
                component: 'retro_menu',
                param: {
                    name: 'retro_menu_auto',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Переключать категорию по фокусу',
                    description: 'Вверх/вниз выбирают раздел без OK'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'retro_menu',
                param: {
                    name: 'retro_menu_delay',
                    type: 'select',
                    values: {
                        '0': 'Мгновенно',
                        '100': 'Очень быстро',
                        '200': 'Быстро',
                        '350': 'Обычно',
                        '500': 'Медленно'
                    },
                    default: '200'
                },
                field: {
                    name: 'Задержка переключения'
                }
            });
        } catch (e) {}
    }

    function start() {
        if (started) return;
        started = true;

        injectStyle();
        registerSettings();
        bindEvents();

        document.body.classList.add('retro-focus-menu');

        addExtraItems();
        markCurrent();

        /*
         * Lampa может заново создавать DOM меню.
         * Проверяем только дополнительные пункты и метку.
         * Не трогаем состояние контроллера.
         */
        var observer = new MutationObserver(function () {
            addExtraItems();
            markCurrent();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Retro Menu] v' + VERSION + ' initialized');
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    }
})();


(function () {
    'use strict';

    if (window.retroMenuExperimentLoaded) return;
    window.retroMenuExperimentLoaded = true;

    var PREFIX = 'retro_menu_exp_';
    var MODE_KEY = PREFIX + 'mode';
    var STYLE_ID = 'retro-menu-experiment-style';

    var state = {
        mode: '1',
        busy: false,
        lastIndex: 0
    };

    function storageGet(key, fallback) {
        try {
            return Lampa.Storage.get(key, fallback);
        } catch (e) {
            return fallback;
        }
    }

    function storageSet(key, value) {
        try {
            Lampa.Storage.set(key, value);
        } catch (e) {}
    }

    function getItems() {
        return Array.prototype.slice.call(
            document.querySelectorAll('.menu__item')
        ).filter(function (item) {
            return item.offsetParent !== null;
        });
    }

    function isMenuVisible() {
        var menu = document.querySelector('.wrap__left');
        if (!menu) return false;

        return menu.offsetWidth > 0 &&
            getComputedStyle(menu).display !== 'none';
    }

    function currentIndex(items) {
        var index = items.findIndex(function (item) {
            return item.classList.contains('focus') ||
                item.classList.contains('hover');
        });

        return index >= 0 ? index : state.lastIndex;
    }

    function focusItem(item, index) {
        if (!item) return;

        state.lastIndex = index;

        if (window.Lampa && Lampa.Controller) {
            try {
                Lampa.Controller.focus(item);
            } catch (e) {}
        }

        if (window.$) {
            try {
                $(item).trigger('hover:focus');
            } catch (e) {}
        }

        item.scrollIntoView({
            block: 'nearest',
            behavior: 'auto'
        });
    }

    function moveMenu(direction) {
        var items = getItems();
        if (!items.length) return;

        var index = currentIndex(items);

        if (direction === 'up') index--;
        if (direction === 'down') index++;

        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;

        focusItem(items[index], index);
    }

    function goToContent() {
        if (window.Lampa && Lampa.Controller) {
            try {
                Lampa.Controller.toggle('content');
                return;
            } catch (e) {}
        }

        var item = document.querySelector(
            '.items .selector, .card.selector, .card.focus'
        );

        if (item && window.Lampa && Lampa.Controller) {
            try {
                Lampa.Controller.focus(item);
            } catch (e) {}
        }
    }

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            'body.retro-menu-exp .wrap__left {',
            '  visibility: visible;',
            '}',
            'body.retro-menu-exp .menu__item.focus,',
            'body.retro-menu-exp .menu__item.hover {',
            '  opacity: 1;',
            '}'
        ].join('\n');

        document.head.appendChild(style);
    }

    function applyMode(mode) {
        state.mode = String(mode || '1');
        storageSet(MODE_KEY, state.mode);

        document.body.classList.toggle(
            'retro-menu-exp',
            state.mode !== '1'
        );

        console.log('[Retro Menu] Режим:', state.mode);
    }

    function handleKeydown(event) {
        if (state.busy || !isMenuVisible()) return;

        var key = event.key;
        var code = event.keyCode;

        var up = key === 'ArrowUp' || code === 38;
        var down = key === 'ArrowDown' || code === 40;
        var left = key === 'ArrowLeft' || code === 37;
        var right = key === 'ArrowRight' || code === 39;

        if (!up && !down && !left && !right) return;

        /*
         * Режим 1: перехват навигации при открытом родном меню.
         * Режим 2: собственная обработка перемещения по пунктам.
         * Режим 3: своя навигация в меню, родной контроллер для контента.
         *
         * Пока режимы используют общий безопасный обработчик перемещения.
         * Различия расширим после проверки поведения на устройстве.
         */

        if (up || down) {
            event.preventDefault();
            event.stopPropagation();

            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }

            moveMenu(up ? 'up' : 'down');
        } else if (right) {
            event.preventDefault();
            event.stopPropagation();

            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }

            goToContent();
        }
    }

    function addSettings() {
        if (!Lampa.SettingsApi ||
            typeof Lampa.SettingsApi.addParam !== 'function') return;

        try {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: MODE_KEY,
                    type: 'select',
                    values: {
                        '1': 'Режим 1 — родной контроллер',
                        '2': 'Режим 2 — собственная навигация',
                        '3': 'Режим 3 — гибридный'
                    },
                    default: '1'
                },
                field: {
                    name: 'Экспериментальное меню',
                    description: 'Выберите способ управления меню'
                },
                onChange: function (value) {
                    applyMode(value);
                }
            });
        } catch (e) {
            console.error('[Retro Menu] Не удалось добавить настройку', e);
        }
    }

    function start() {
        if (!window.Lampa || !window.$) return;

        installStyles();
        addSettings();

        applyMode(storageGet(MODE_KEY, '1'));

        document.addEventListener('keydown', handleKeydown, true);

        console.log('[Retro Menu] Эксперимент загружен');
    }

    if (window.Lampa && window.Lampa.SettingsApi) {
        start();
    } else {
        var attempts = 0;
        var timer = setInterval(function () {
            attempts++;

            if (window.Lampa && window.Lampa.SettingsApi) {
                clearInterval(timer);
                start();
            } else if (attempts >= 40) {
                clearInterval(timer);
                console.error('[Retro Menu] Lampa не обнаружена');
            }
        }, 500);
    }
})();

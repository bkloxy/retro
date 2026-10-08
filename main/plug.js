(function () {
    'use strict';

    if (window.nf_simple_loaded) return;
    window.nf_simple_loaded = true;

    var SETTINGS = 'nf_simple';

    function get(key, def) {
        return Lampa.Storage.get(key, def);
    }

    function enabled(key) {
        return get(key, 'true') === 'true';
    }

    function applySettings() {
        var active = enabled('nf_simple_enable');

        document.body.classList.toggle(
            'nf-simple',
            active
        );

        document.body.classList.toggle(
            'nf-simple-rect',
            active && enabled('nf_simple_rect')
        );

        document.body.classList.toggle(
            'nf-simple-frame',
            active && enabled('nf_simple_frame')
        );
    }

    function addStyles() {
        if (document.getElementById('nf-simple-style')) return;

        var style = document.createElement('style');

        style.id = 'nf-simple-style';

        style.textContent =
            /*
             * Прямоугольные постеры
             */
            'body.nf-simple-rect .card__view,' +
            'body.nf-simple-rect .card__img,' +
            'body.nf-simple-rect .full-start__poster,' +
            'body.nf-simple-rect .full-start-new__poster {' +
                'border-radius:0!important;' +
            '}' +

            /*
             * Убираем стандартное выделение Lampa.
             * Сам focus при этом НЕ меняем.
             */
            'body.nf-simple-frame .card.focus,' +
            'body.nf-simple-frame .card.focus .card__view,' +
            'body.nf-simple-frame .card.focus .card__img {' +
                'outline:none!important;' +
                'box-shadow:none!important;' +
            '}' +

            /*
             * Наша рамка
             */
            '#nf-simple-frame {' +
                'position:fixed;' +
                'z-index:99999;' +
                'pointer-events:none;' +
                'box-sizing:border-box;' +
                'border:3px solid #fff;' +
                'opacity:0;' +
                'transform:translate3d(0,0,0);' +
                'transition:' +
                    'transform .28s cubic-bezier(.25,.8,.25,1),' +
                    'width .28s cubic-bezier(.25,.8,.25,1),' +
                    'height .28s cubic-bezier(.25,.8,.25,1),' +
                    'opacity .12s ease;' +
                'will-change:transform,width,height;' +
            '}';

        document.head.appendChild(style);
    }

    var frame = null;
    var lastTarget = null;

    function createFrame() {
        if (frame) return;

        frame = document.createElement('div');
        frame.id = 'nf-simple-frame';

        document.body.appendChild(frame);
    }

    function hideFrame() {
        if (!frame) return;

        frame.style.opacity = '0';
        lastTarget = null;
    }

    function getTarget() {
        if (!document.body.classList.contains('nf-simple-frame')) {
            return null;
        }

        /*
         * Во время плеера рамка не нужна.
         */
        if (document.querySelector('.player')) {
            return null;
        }

        /*
         * Сначала ищем именно карточку.
         */
        var card = document.querySelector('.card.focus');

        if (card) {
            return (
                card.querySelector('.card__view') ||
                card.querySelector('.card__img') ||
                card
            );
        }

        /*
         * Потом обычные элементы Lampa.
         */
        return (
            document.querySelector('.full-start__button.focus') ||
            document.querySelector('.menu__item.focus') ||
            document.querySelector('.selector.focus')
        );
    }

    function updateFrame() {
        if (!frame) return;

        var target = getTarget();

        if (!target) {
            hideFrame();
            return;
        }

        var rect = target.getBoundingClientRect();

        if (
            rect.width < 5 ||
            rect.height < 5 ||
            rect.bottom < 0 ||
            rect.top > window.innerHeight
        ) {
            hideFrame();
            return;
        }

        var gap = 3;

        frame.style.width =
            Math.round(rect.width + gap * 2) + 'px';

        frame.style.height =
            Math.round(rect.height + gap * 2) + 'px';

        frame.style.transform =
            'translate3d(' +
            Math.round(rect.left - gap) +
            'px,' +
            Math.round(rect.top - gap) +
            'px,0)';

        frame.style.opacity = '1';

        lastTarget = target;
    }

    function registerSettings() {
        if (!Lampa.SettingsApi) {
            console.log('NF Simple: SettingsApi отсутствует');
            return;
        }

        try {
            Lampa.SettingsApi.addComponent({
                component: SETTINGS,
                name: 'Интерфейс Netflix',
                icon:
                    '<svg viewBox="0 0 24 24" fill="none" ' +
                    'stroke="white" stroke-width="2">' +
                    '<rect x="3" y="4" width="18" height="14" rx="2"/>' +
                    '<path d="M8 21h8M12 18v3"/>' +
                    '</svg>'
            });

            Lampa.SettingsApi.addParam({
                component: SETTINGS,
                param: {
                    name: 'nf_simple_enable',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Включить интерфейс Netflix'
                },
                onChange: applySettings
            });

            Lampa.SettingsApi.addParam({
                component: SETTINGS,
                param: {
                    name: 'nf_simple_rect',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Прямоугольные постеры'
                },
                onChange: applySettings
            });

            Lampa.SettingsApi.addParam({
                component: SETTINGS,
                param: {
                    name: 'nf_simple_frame',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Плавная белая рамка'
                },
                onChange: applySettings
            });

            console.log('NF Simple: настройки зарегистрированы');

        } catch (e) {
            console.log(
                'NF Simple: ошибка SettingsApi',
                e
            );
        }
    }

    function start() {
        addStyles();
        createFrame();
        registerSettings();
        applySettings();

        /*
         * Проверяем focus не 60 раз в секунду,
         * а примерно 10 раз в секунду.
         */
        setInterval(function () {
            try {
                updateFrame();
            } catch (e) {
                console.log('NF Simple frame error', e);
            }
        }, 100);

        console.log(
            'NF Simple успешно запущен'
        );

        try {
            Lampa.Noty.show(
                'Интерфейс Netflix загружен'
            );
        } catch (e) {}
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow(
            'app',
            function (event) {
                if (event.type === 'ready') {
                    start();
                }
            }
        );
    }

})();

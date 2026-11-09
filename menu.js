
(function () {
    'use strict';

    if (window.__lampa_focus_glide_v4) return;

    // Удаляем предыдущие версии
    if (window.LampaFocusGlide &&
        typeof window.LampaFocusGlide.destroy === 'function') {
        try { window.LampaFocusGlide.destroy(); } catch (e) {}
    }

    delete window.__lampa_focus_glide_v2;
    delete window.__lampa_focus_glide_v3;

    window.__lampa_focus_glide_v4 = true;

    var FRAME_ID = 'lampa-focus-glide-frame';
    var STYLE_ID = 'lampa-focus-glide-style';

    var STORAGE_KEY = 'lampa_focus_glide_duration';
    var SETTINGS_COMPONENT = 'focus_glide_settings';

    var frame = null;
    var styleEl = null;
    var observer = null;

    var raf = 0;
    var visible = false;
    var followUntil = 0;
    var lastTime = 0;

    // Текущее положение рамки
    var current = null;

    // Получение скорости из настроек
    function getDuration() {
        var value = 200;

        try {
            value = parseInt(Lampa.Storage.get(STORAGE_KEY), 10) || 200;
        } catch (e) {}

        return Math.max(50, Math.min(1000, value));
    }

    // Настройки Lampa
    function addSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) return;

        try {
            Lampa.SettingsApi.addComponent({
                component: SETTINGS_COMPONENT,
                name: 'Анимация рамки'
            });

            Lampa.SettingsApi.addParam({
                component: SETTINGS_COMPONENT,

                param: {
                    name: STORAGE_KEY,
                    type: 'select',

                    values: {
                        '100': 'Очень быстро (100 мс)',
                        '150': 'Быстро (150 мс)',
                        '200': 'Стандартная (200 мс)',
                        '280': 'Плавная (280 мс)',
                        '380': 'Очень плавная (380 мс)',
                        '500': 'Медленная (500 мс)',
                        '700': 'Очень медленная (700 мс)'
                    },

                    default: '200'
                },

                field: {
                    name: 'Скорость перемещения рамки',
                    description: 'Настройка плавности перемещения выделения между постерами'
                },

                onChange: function () {
                    wake(500);
                }
            });

        } catch (e) {
            console.warn('[Focus Glide] Settings:', e);
        }
    }

    var css = `
        .card.focus .card__view::after {
            opacity: 0 !important;
        }

        #${FRAME_ID} {
            position: fixed;
            left: 0;
            top: 0;

            width: 1px;
            height: 1px;

            box-sizing: border-box;
            pointer-events: none !important;
            z-index: 99999;

            opacity: 0;

            border: 3px solid #fff;
            border-radius: 20px;

            background: rgba(255,255,255,0.025);

            box-shadow:
                0 0 0 1px rgba(255,255,255,0.12),
                0 6px 24px rgba(0,0,0,0.25);

            transform: translate3d(-200vw,-200vh,0);

            transform-origin: center center;

            /* Анимацией управляет JavaScript */
            transition: none !important;

            will-change: transform, width, height;

            contain: layout style paint;
        }
    `;

    // Поиск активного постера
    function findFocusedCard() {
        var cards = document.querySelectorAll('.card.focus');

        for (var i = cards.length - 1; i >= 0; i--) {
            var card = cards[i];
            var view = card.querySelector('.card__view');

            if (!view) continue;

            var rect = view.getBoundingClientRect();

            if (
                rect.width < 12 ||
                rect.height < 12 ||
                rect.bottom <= 0 ||
                rect.right <= 0 ||
                rect.top >= window.innerHeight ||
                rect.left >= window.innerWidth
            ) continue;

            return {
                view: view,
                rect: rect
            };
        }

        return null;
    }

    // Получение целевых координат
    function getTarget() {
        var target = findFocusedCard();

        if (!target) return null;

        var view = target.view;
        var rect = target.rect;

        // Берём исходный размер постера без scale-анимации.
        // Центр берём из экранных координат.
        var baseWidth = view.offsetWidth || rect.width;
        var baseHeight = view.offsetHeight || rect.height;

        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;

        var pseudo = null;

        try {
            pseudo = window.getComputedStyle(view, '::after');
        } catch (e) {}

        var left = -8;
        var right = -8;
        var top = -8;
        var bottom = -8;

        var borderWidth = 3;
        var borderColor = '#fff';
        var borderRadius = 20;

        if (pseudo && pseudo.content !== 'none') {
            var scaleX = rect.width / baseWidth || 1;
            var scaleY = rect.height / baseHeight || 1;

            function readOffset(value, fallback, scale) {
                var number = parseFloat(value);

                return isNaN(number) ? fallback : number / scale;
            }

            left = readOffset(pseudo.left, -8, scaleX);
            right = readOffset(pseudo.right, -8, scaleX);
            top = readOffset(pseudo.top, -8, scaleY);
            bottom = readOffset(pseudo.bottom, -8, scaleY);

            if (parseFloat(pseudo.borderTopWidth) > 0) {
                borderWidth = parseFloat(pseudo.borderTopWidth);
                borderColor = pseudo.borderTopColor || '#fff';

                if (pseudo.borderRadius &&
                    pseudo.borderRadius !== '0px') {
                    borderRadius = parseFloat(pseudo.borderRadius);
                }
            }
        }

        var width = baseWidth - left - right;
        var height = baseHeight - top - bottom;

        return {
            x: centerX - baseWidth / 2 + left,
            y: centerY - baseHeight / 2 + top,

            width: width,
            height: height,

            borderWidth: borderWidth,
            borderColor: borderColor,
            borderRadius: borderRadius
        };
    }

    // Плавная интерполяция
    function interpolate(from, to, factor) {
        return from + (to - from) * factor;
    }

    function applyPosition(state) {
        frame.style.width = state.width + 'px';
        frame.style.height = state.height + 'px';

        frame.style.transform =
            'translate3d(' +
            state.x + 'px,' +
            state.y + 'px,0)';

        frame.style.borderRadius = state.borderRadius + 'px';
        frame.style.borderWidth = state.borderWidth + 'px';
        frame.style.borderColor = state.borderColor;

        frame.style.opacity = '1';
    }

    // Основной цикл
    function tick(now) {
        raf = 0;

        var target = getTarget();

        if (!target) {
            frame.style.opacity = '0';
            visible = false;
            current = null;
            return;
        }

        if (!visible || !current) {
            current = {
                x: target.x,
                y: target.y,
                width: target.width,
                height: target.height,
                borderWidth: target.borderWidth,
                borderRadius: target.borderRadius,
                borderColor: target.borderColor
            };

            visible = true;
            applyPosition(current);

            lastTime = now;
        } else {
            var delta = lastTime ? now - lastTime : 16;
            lastTime = now;

            delta = Math.min(delta, 50);

            // Скорость движения задаётся пользователем
            var duration = getDuration();

            // Плавная экспоненциальная интерполяция
            var factor = 1 - Math.exp(-delta * 4.6 / duration);

            current.x = interpolate(current.x, target.x, factor);
            current.y = interpolate(current.y, target.y, factor);

            current.width = interpolate(current.width, target.width, factor);
            current.height = interpolate(current.height, target.height, factor);

            current.borderWidth = interpolate(
                current.borderWidth,
                target.borderWidth,
                factor
            );

            current.borderRadius = interpolate(
                current.borderRadius,
                target.borderRadius,
                factor
            );

            current.borderColor = target.borderColor;

            applyPosition(current);
        }

        // Продолжаем следить за постером во время движения
        var dx = Math.abs(current.x - target.x);
        var dy = Math.abs(current.y - target.y);
        var dw = Math.abs(current.width - target.width);
        var dh = Math.abs(current.height - target.height);

        if (
            now < followUntil ||
            dx > 0.4 ||
            dy > 0.4 ||
            dw > 0.4 ||
            dh > 0.4
        ) {
            raf = requestAnimationFrame(tick);
        }
    }

    function wake(ms) {
        followUntil = Math.max(
            followUntil,
            performance.now() + ms
        );

        if (!raf) {
            lastTime = 0;
            raf = requestAnimationFrame(tick);
        }
    }

    // События Lampa
    function onFocusChange() {
        wake(900);
    }

    function onClick() {
        wake(500);
    }

    function onResize() {
        wake(500);
    }

    function onScroll() {
        wake(900);
    }

    // Наблюдение за изменениями карточек
    function onMutations(records) {
        for (var i = 0; i < records.length; i++) {
            var target = records[i].target;

            if (
                target === frame ||
                target === styleEl ||
                (frame && frame.contains(target))
            ) continue;

            wake(700);
            break;
        }
    }

    function init() {
        if (!document.body || !document.head) return;

        if (document.getElementById(FRAME_ID)) return;

        addSettings();

        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = css;

        document.head.appendChild(styleEl);

        frame = document.createElement('div');
        frame.id = FRAME_ID;

        document.body.appendChild(frame);

        if (typeof MutationObserver !== 'undefined') {
            observer = new MutationObserver(onMutations);

            observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }

        document.addEventListener(
            'hover:focus',
            onFocusChange,
            true
        );

        document.addEventListener(
            'focusin',
            onFocusChange,
            true
        );

        document.addEventListener(
            'click',
            onClick,
            true
        );

        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);

        wake(500);

        window.LampaFocusGlide = {
            refresh: function () {
                wake(500);
            },

            destroy: function () {
                if (observer) observer.disconnect();

                document.removeEventListener(
                    'hover:focus',
                    onFocusChange,
                    true
                );

                document.removeEventListener(
                    'focusin',
                    onFocusChange,
                    true
                );

                document.removeEventListener(
                    'click',
                    onClick,
                    true
                );

                window.removeEventListener('resize', onResize);
                window.removeEventListener('scroll', onScroll, true);

                if (raf) cancelAnimationFrame(raf);

                if (frame && frame.parentNode) {
                    frame.parentNode.removeChild(frame);
                }

                if (styleEl && styleEl.parentNode) {
                    styleEl.parentNode.removeChild(styleEl);
                }

                delete window.LampaFocusGlide;
                delete window.__lampa_focus_glide_v4;
            }
        };
    }

    // Запуск после готовности приложения
    function start() {
        if (document.body) init();
        else document.addEventListener('DOMContentLoaded', init);
    }

    if (window.appready) {
        start();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    } else {
        start();
    }

})();

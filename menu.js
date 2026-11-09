(function () {
    'use strict';

    // Версия 4: плавное движение без прыжков + настройка скорости
    if (window.__lampa_focus_glide_v4) return;

    if (window.LampaFocusGlide &&
        typeof window.LampaFocusGlide.destroy === 'function') {
        try { window.LampaFocusGlide.destroy(); } catch (e) {}
    }
    delete window.__lampa_focus_glide_v2;
    delete window.__lampa_focus_glide_v3;

    window.__lampa_focus_glide_v4 = true;

    var STYLE_ID = 'lampa-focus-glide-style';
    var FRAME_ID = 'lampa-focus-glide-frame';
    var SETTING_KEY = 'focus_glide_speed';

    var SPEEDS = {
        '450': 'Очень медленно',
        '300': 'Медленно',
        '200': 'Средне',
        '120': 'Быстро',
        '60': 'Очень быстро'
    };

    var css = `
        /* Прячем штатную мгновенную рамку */
        .card.focus .card__view::after {
            opacity: 0 !important;
        }

        /* Плавающая рамка.
           ВАЖНО: никаких переходов transform/width/height —
           движение считает JS, иначе рамка «подпрыгивает»
           при включённой анимации Lampa. */
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

            background: rgba(255,255,255,0.03);

            box-shadow:
                0 0 0 1px rgba(255,255,255,0.12),
                0 6px 24px rgba(0,0,0,0.25);

            transform: translate3d(-200vw,-200vh,0);

            transition: opacity 120ms ease;

            will-change: transform, width, height;
        }
    `;

    var frame = null;
    var styleEl = null;

    // Текущее положение рамки (сглаживается к цели каждый кадр)
    var cur = { x: 0, y: 0, w: 0, h: 0 };
    var hasCur = false;
    var shown = false;

    var raf = 0;
    var lastT = 0;
    var tau = 200; // мс, меньше = быстрее

    function currentSpeed() {
        try {
            var v = window.Lampa && Lampa.Storage &&
                    Lampa.Storage.get(SETTING_KEY);
            v = parseInt(v, 10);
            if (!isNaN(v) && v > 0) return v;
        } catch (e) {}
        return 200;
    }

    function measure() {
        var cards = document.querySelectorAll('.card.focus');

        for (var i = cards.length - 1; i >= 0; i--) {
            var view = cards[i].querySelector('.card__view');
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

            var pseudo = null;
            try {
                pseudo = window.getComputedStyle(view, '::after');
            } catch (e) {}

            var top = -8, left = -8, right = -8, bottom = -8;

            if (pseudo && pseudo.content && pseudo.content !== 'none') {
                // Компенсация scale, если постер масштабирован
                var scale = rect.width / (view.offsetWidth || rect.width) || 1;
                var num = function (v, fb) {
                    var n = parseFloat(v);
                    return isNaN(n) ? fb : n * scale;
                };

                top = num(pseudo.top, -8);
                left = num(pseudo.left, -8);
                right = num(pseudo.right, -8);
                bottom = num(pseudo.bottom, -8);
            }

            var w = rect.width - left - right;
            var h = rect.height - top - bottom;

            if (w < 20 || h < 20) return null;

            return {
                x: rect.left + left,
                y: rect.top + top,
                w: w,
                h: h
            };
        }

        return null;
    }

    function apply() {
        frame.style.width = cur.w + 'px';
        frame.style.height = cur.h + 'px';
        frame.style.transform =
            'translate3d(' + cur.x + 'px,' + cur.y + 'px,0)';
    }

    // Главный цикл: каждый кадр тянем рамку к постеру.
    // Экспоненциальное сглаживание = никаких рывков и прыжков.
    function loop(now) {
        raf = requestAnimationFrame(loop);

        var dt = lastT ? Math.min(now - lastT, 100) : 16;
        lastT = now;

        var t = measure();

        if (!t) {
            if (shown) {
                frame.style.opacity = '0';
                shown = false;
            }
            hasCur = false;
            return;
        }

        if (!hasCur) {
            // Первый показ — сразу на месте, без перелёта через экран
            cur.x = t.x; cur.y = t.y;
            cur.w = t.w; cur.h = t.h;
            hasCur = true;
            apply();
            if (!shown) { frame.style.opacity = '1'; shown = true; }
            return;
        }

        var k = 1 - Math.exp(-dt / tau);

        cur.x += (t.x - cur.x) * k;
        cur.y += (t.y - cur.y) * k;
        cur.w += (t.w - cur.w) * k;
        cur.h += (t.h - cur.h) * k;

        apply();
        if (!shown) { frame.style.opacity = '1'; shown = true; }
    }

    function addSetting() {
        if (!(window.Lampa && Lampa.SettingsApi &&
              Lampa.SettingsApi.addParam)) return false;

        try {
            if (Lampa.Storage.get(SETTING_KEY) === undefined &&
                Lampa.Storage.field) {
                // значение по умолчанию подтянется из addParam
            }

            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: SETTING_KEY,
                    type: 'select',
                    values: SPEEDS,
                    default: '200'
                },
                field: {
                    name: 'Скорость рамки выделения',
                    description: 'Плавность перелёта рамки между постерами'
                },
                onChange: function (value) {
                    var v = (value && value.value !== undefined)
                        ? value.value : value;
                    v = parseInt(v, 10);
                    if (!isNaN(v) && v > 0) tau = v;
                }
            });

            return true;
        } catch (e) {
            return false;
        }
    }

    function init() {
        if (!document.body) return;
        if (document.getElementById(FRAME_ID)) return;

        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = css;
        document.head.appendChild(styleEl);

        frame = document.createElement('div');
        frame.id = FRAME_ID;
        document.body.appendChild(frame);

        tau = currentSpeed();

        // Настройка появится в Интерфейсе,
        // даже если SettingsApi ещё не готов
        addSetting();
        var tries = 0;
        var timer = setInterval(function () {
            if (addSetting() || ++tries > 20) clearInterval(timer);
        }, 1000);

        raf = requestAnimationFrame(loop);

        window.LampaFocusGlide = {
            refresh: function () {},

            destroy: function () {
                cancelAnimationFrame(raf);
                clearInterval(timer);

                if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
                if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);

                delete window.LampaFocusGlide;
                delete window.__lampa_focus_glide_v4;
            }
        };
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();

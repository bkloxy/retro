
(function () {
    'use strict';

    if (window.__lampa_focus_glide_v2) return;

    // Убираем предыдущую версию плагина
    if (window.LampaFocusGlide &&
        typeof window.LampaFocusGlide.destroy === 'function') {
        try {
            window.LampaFocusGlide.destroy();
        } catch (e) {}
    }

    window.__lampa_focus_glide_v2 = true;

    var STYLE_ID = 'lampa-focus-glide-v2-style';
    var FRAME_ID = 'lampa-focus-glide-v2-frame';

    var css = `
        /* Убираем мгновенно перескакивающую штатную рамку */
        .card.focus .card__view::after {
            opacity: 0 !important;
        }

        /* Единая плавающая рамка */
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
            border-radius: 22px;

            background: rgba(255,255,255,0.025);

            box-shadow:
                0 0 0 1px rgba(255,255,255,0.12),
                0 5px 22px rgba(0,0,0,0.22);

            transform: translate3d(-200vw,-200vh,0);

            transform-origin: center center;

            transition:
                transform 230ms cubic-bezier(.22,.61,.36,1),
                width 190ms cubic-bezier(.22,.61,.36,1),
                height 190ms cubic-bezier(.22,.61,.36,1),
                border-radius 190ms ease,
                opacity 100ms ease;

            will-change: transform, width, height;
        }
    `;

    function init() {
        if (!document.body) return;
        if (document.getElementById(FRAME_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;

        document.head.appendChild(style);

        var frame = document.createElement('div');
        frame.id = FRAME_ID;

        document.body.appendChild(frame);

        var raf = 0;
        var visible = false;
        var observer;

        function number(value, fallback) {
            var result = parseFloat(value);
            return isNaN(result) ? fallback : result;
        }

        // Ищем именно выбранный постер
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

        function update() {
            raf = 0;

            var target = findFocusedCard();

            if (!target) {
                frame.style.opacity = '0';
                visible = false;
                return;
            }

            var rect = target.rect;
            var pseudo;

            try {
                pseudo = window.getComputedStyle(
                    target.view,
                    '::after'
                );
            } catch (e) {
                pseudo = null;
            }

            // Берём геометрию штатной рамки Lampa
            var top = pseudo ? number(pseudo.top, -8) : -8;
            var left = pseudo ? number(pseudo.left, -8) : -8;
            var right = pseudo ? number(pseudo.right, -8) : -8;
            var bottom = pseudo ? number(pseudo.bottom, -8) : -8;

            var x = rect.left + left;
            var y = rect.top + top;

            var width = rect.width - left - right;
            var height = rect.height - top - bottom;

            if (pseudo) {
                frame.style.borderWidth =
                    pseudo.borderTopWidth || '3px';

                frame.style.borderColor =
                    pseudo.borderTopColor || '#fff';

                frame.style.borderStyle =
                    pseudo.borderTopStyle || 'solid';

                frame.style.borderRadius =
                    pseudo.borderRadius || '22px';
            }

            // Первый показ без движения из-за границ экрана
            if (!visible) {
                frame.style.transition = 'none';
            }

            frame.style.width = width + 'px';
            frame.style.height = height + 'px';

            frame.style.transform =
                'translate3d(' + x + 'px,' + y + 'px,0)';

            frame.style.opacity = '1';

            if (!visible) {
                frame.getBoundingClientRect();
                frame.style.transition = '';
                visible = true;
            }
        }

        function schedule() {
            if (raf) return;

            raf = requestAnimationFrame(update);
        }

        // Следим за изменением фокуса Lampa
        if (typeof MutationObserver !== 'undefined') {
            observer = new MutationObserver(schedule);

            observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }

        document.addEventListener(
            'hover:focus',
            schedule,
            true
        );

        document.addEventListener(
            'focusin',
            schedule,
            true
        );

        document.addEventListener(
            'click',
            schedule,
            true
        );

        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, true);

        schedule();

        window.LampaFocusGlide = {
            refresh: schedule,

            destroy: function () {
                if (observer) observer.disconnect();

                document.removeEventListener(
                    'hover:focus', schedule, true
                );

                document.removeEventListener(
                    'focusin', schedule, true
                );

                document.removeEventListener(
                    'click', schedule, true
                );

                window.removeEventListener('resize', schedule);
                window.removeEventListener('scroll', schedule, true);

                if (raf) cancelAnimationFrame(raf);

                frame.remove();
                style.remove();

                delete window.LampaFocusGlide;
                delete window.__lampa_focus_glide_v2;
            }
        };
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();

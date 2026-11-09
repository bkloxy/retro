(function () {
    'use strict';

    // Версия 3: рамка всегда догоняет постер, не зависает посередине ряда
    if (window.__lampa_focus_glide_v3) return;

    // Убираем предыдущие версии
    if (window.LampaFocusGlide &&
        typeof window.LampaFocusGlide.destroy === 'function') {
        try { window.LampaFocusGlide.destroy(); } catch (e) {}
    }
    delete window.__lampa_focus_glide_v2;

    window.__lampa_focus_glide_v3 = true;

    var STYLE_ID = 'lampa-focus-glide-style';
    var FRAME_ID = 'lampa-focus-glide-frame';

    var css = `
        /* Прячем штатную мгновенную рамку */
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
            border-radius: 20px;

            background: rgba(255,255,255,0.03);

            box-shadow:
                0 0 0 1px rgba(255,255,255,0.12),
                0 6px 24px rgba(0,0,0,0.25);

            transform: translate3d(-200vw,-200vh,0);
            transform-origin: center center;

            transition:
                transform 200ms cubic-bezier(.22,.61,.36,1),
                width 170ms cubic-bezier(.22,.61,.36,1),
                height 170ms cubic-bezier(.22,.61,.36,1),
                border-radius 170ms ease,
                opacity 100ms ease;

            will-change: transform, width, height;
        }
    `;

    var frame = null;
    var styleEl = null;
    var observer = null;

    var raf = 0;
    var visible = false;
    var followUntil = 0; // до какого момента синхронизируем каждый кадр

    function wake(ms) {
        followUntil = Math.max(followUntil, performance.now() + ms);
        if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick(now) {
        raf = 0;
        update();
        // Пока идёт анимация прокрутки Lampa — следим за постером каждый кадр.
        // Именно этого не хватало: раньше рамка обновлялась один раз
        // и замирала посередине, пока ряд доезжал до места.
        if (now < followUntil) {
            raf = requestAnimationFrame(tick);
        }
    }

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

            return { view: view, rect: rect };
        }

        return null;
    }

    function update() {
        var target = findFocusedCard();

        if (!target) {
            frame.style.opacity = '0';
            visible = false;
            return;
        }

        var view = target.view;
        var rect = target.rect;

        var pseudo = null;
        try {
            pseudo = window.getComputedStyle(view, '::after');
        } catch (e) {}

        var top = -8, left = -8, right = -8, bottom = -8;
        var borderWidth = '3px';
        var borderColor = '#fff';
        var borderRadius = '20px';

        if (pseudo && pseudo.content && pseudo.content !== 'none') {
            // Если постер сейчас масштабирован (transform: scale),
            // смещения ::after нужно масштабировать так же.
            var scale = rect.width / (view.offsetWidth || rect.width) || 1;
            var num = function (v, fb) {
                var n = parseFloat(v);
                return isNaN(n) ? fb : n * scale;
            };

            top = num(pseudo.top, -8);
            left = num(pseudo.left, -8);
            right = num(pseudo.right, -8);
            bottom = num(pseudo.bottom, -8);

            if (parseFloat(pseudo.borderTopWidth) > 0) {
                borderWidth = pseudo.borderTopWidth;
                borderColor = pseudo.borderTopColor || '#fff';
                if (pseudo.borderRadius && pseudo.borderRadius !== '0px') {
                    borderRadius = pseudo.borderRadius;
                }
            }
        }

        var x = rect.left + left;
        var y = rect.top + top;
        var w = rect.width - left - right;
        var h = rect.height - top - bottom;

        if (w < 20 || h < 20) {
            frame.style.opacity = '0';
            visible = false;
            return;
        }

        frame.style.borderWidth = borderWidth;
        frame.style.borderColor = borderColor;
        frame.style.borderRadius = borderRadius;

        // Первый показ — без анимации из-за границ экрана
        if (!visible) frame.style.transition = 'none';

        frame.style.width = w + 'px';
        frame.style.height = h + 'px';
        frame.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        frame.style.opacity = '1';

        if (!visible) {
            frame.getBoundingClientRect(); // форсируем reflow
            frame.style.transition = '';
            visible = true;
        }
    }

    function onFocusChange() { wake(600); }
    function onClick() { wake(400); }
    function onResize() { wake(300); }
    function onScroll() { wake(500); }

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

        // Класс И стиль: Lampa двигает ряды через style/transform,
        // это тоже надо отслеживать, иначе рамка отстаёт.
        if (typeof MutationObserver !== 'undefined') {
            observer = new MutationObserver(function () { wake(500); });
            observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }

        document.addEventListener('hover:focus', onFocusChange, true);
        document.addEventListener('focusin', onFocusChange, true);
        document.addEventListener('click', onClick, true);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);

        wake(300);

        window.LampaFocusGlide = {
            refresh: function () { wake(300); },

            destroy: function () {
                if (observer) observer.disconnect();

                document.removeEventListener('hover:focus', onFocusChange, true);
                document.removeEventListener('focusin', onFocusChange, true);
                document.removeEventListener('click', onClick, true);
                window.removeEventListener('resize', onResize);
                window.removeEventListener('scroll', onScroll, true);

                if (raf) cancelAnimationFrame(raf);

                if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
                if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);

                delete window.LampaFocusGlide;
                delete window.__lampa_focus_glide_v3;
            }
        };
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();

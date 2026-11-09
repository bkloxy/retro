

(function () {
    'use strict';

    if (window.__lampa_focus_glide_v5) return;

    if (window.LampaFocusGlide &&
        typeof window.LampaFocusGlide.destroy === 'function') {
        try { window.LampaFocusGlide.destroy(); } catch (e) {}
    }

    delete window.__lampa_focus_glide_v2;
    delete window.__lampa_focus_glide_v3;
    delete window.__lampa_focus_glide_v4;
    window.__lampa_focus_glide_v5 = true;

    var FRAME_ID = 'lampa-focus-glide-frame';
    var STYLE_ID = 'lampa-focus-glide-style';
    var SETTINGS_COMPONENT = 'focus_glide_settings';
    var STORAGE_KEY = 'lampa_focus_glide_duration';

    var frame = null;
    var styleEl = null;
    var observer = null;
    var raf = 0;
    var visible = false;
    var followUntil = 0;
    var lastTime = 0;
    var current = null;
    var focusedCard = null;

    function storageDuration() {
        var value = 200;
        try {
            value = parseInt(Lampa.Storage.field(STORAGE_KEY), 10);
        } catch (e) {}

        if (!isFinite(value)) value = 200;
        return Math.max(60, Math.min(1000, value));
    }

    function addSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) return;

        try {
            if (Lampa.SettingsApi.removeParams)
                Lampa.SettingsApi.removeParams(SETTINGS_COMPONENT);

            if (Lampa.SettingsApi.removeComponent)
                Lampa.SettingsApi.removeComponent(SETTINGS_COMPONENT);

            Lampa.SettingsApi.addComponent({
                component: SETTINGS_COMPONENT,
                name: 'Анимация рамки',
                before: 'interface'
            });

            Lampa.SettingsApi.addParam({
                component: SETTINGS_COMPONENT,
                param: {
                    name: STORAGE_KEY,
                    type: 'select',
                    values: {
                        '100': 'Очень быстро · 100 мс',
                        '150': 'Быстро · 150 мс',
                        '200': 'Стандартная · 200 мс',
                        '280': 'Плавная · 280 мс',
                        '380': 'Очень плавная · 380 мс',
                        '500': 'Медленная · 500 мс',
                        '700': 'Очень медленная · 700 мс'
                    },
                    default: '200'
                },
                field: {
                    name: 'Скорость перемещения',
                    description: 'Скорость перехода рамки между постерами'
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
            border: 3px solid #ffffff;
            border-radius: 20px;
            background: rgba(255,255,255,0.025);
            box-shadow:
                0 0 0 1px rgba(255,255,255,0.12),
                0 6px 24px rgba(0,0,0,0.22);
            transform: translate3d(-200vw,-200vh,0);
            transform-origin: center center;
            transition: none !important;
            will-change: transform, width, height;
        }

        /* НОВОЕ ГЛАВНОЕ МЕНЮ */

        .wrap__left .menu {
            box-sizing: border-box;
            padding: 0.85em 0.65em;
            border: 1px solid rgba(255,255,255,0.075);
            border-radius: 1.25em;
            background: linear-gradient(
                160deg,
                rgba(19,25,34,0.99),
                rgba(10,14,21,0.99)
            );
            box-shadow: 0 12px 35px rgba(0,0,0,0.30);
        }

        .wrap__left .menu::before {
            content: 'LAMPA';
            display: block;
            padding: 0.55em 0.8em 1.05em;
            color: rgba(255,255,255,0.88);
            font-size: 1.05em;
            font-weight: 800;
            letter-spacing: 0.23em;
            line-height: 1;
        }

        .wrap__left .menu__list {
            margin: 0;
            padding: 0 0.25em;
        }

        .wrap__left .menu__item {
            min-height: 2.85em;
            box-sizing: border-box;
            margin: 0.12em 0;
            padding: 0.78em 0.85em;
            border: 1px solid transparent;
            border-radius: 0.85em;
            color: rgba(239,245,252,0.82);
            background: transparent;
            transition:
                background-color 160ms ease,
                border-color 160ms ease,
                color 160ms ease,
                box-shadow 160ms ease;
        }

        .wrap__left .menu__item.focus,
        .wrap__left .menu__item.hover,
        .wrap__left .menu__item.traverse {
            color: #ffffff !important;
            border-color: rgba(62,205,244,0.38);
            background: linear-gradient(
                100deg,
                rgba(27,161,202,0.30),
                rgba(27,161,202,0.10)
            ) !important;
            box-shadow:
                inset 3px 0 0 #42d5f5,
                0 3px 14px rgba(0,0,0,0.16);
        }

        .wrap__left .menu__ico {
            width: 1.5em;
            height: 1.5em;
            margin-right: 1.05em;
            color: currentColor;
        }

        .wrap__left .menu__ico svg {
            width: 1.35em;
            height: 1.35em;
        }

        .wrap__left .menu__item.focus .menu__ico [stroke],
        .wrap__left .menu__item.hover .menu__ico [stroke],
        .wrap__left .menu__item.traverse .menu__ico [stroke] {
            stroke: #ffffff !important;
        }

        .wrap__left .menu__item.focus .menu__ico path[fill],
        .wrap__left .menu__item.focus .menu__ico rect[fill],
        .wrap__left .menu__item.focus .menu__ico circle[fill],
        .wrap__left .menu__item.hover .menu__ico path[fill],
        .wrap__left .menu__item.hover .menu__ico rect[fill],
        .wrap__left .menu__item.hover .menu__ico circle[fill],
        .wrap__left .menu__item.traverse .menu__ico path[fill],
        .wrap__left .menu__item.traverse .menu__ico rect[fill],
        .wrap__left .menu__item.traverse .menu__ico circle[fill] {
            fill: #ffffff !important;
        }

        .wrap__left .menu__item.focus .menu__ico > img,
        .wrap__left .menu__item.hover .menu__ico > img,
        .wrap__left .menu__item.traverse .menu__ico > img {
            filter: none !important;
        }

        .wrap__left .menu__text {
            color: inherit;
            font-size: 1.22em;
            font-weight: 500;
            line-height: 1.05;
            letter-spacing: 0.01em;
        }

        .wrap__left .menu__split {
            width: 76%;
            margin: 0.75em auto;
            border-top: 1px solid rgba(255,255,255,0.11);
        }
    `;

    function closestCard(node) {
        while (node && node !== document) {
            if (node.classList &&
                node.classList.contains('card')) return node;

            node = node.parentNode;
        }

        return null;
    }

    function cardFromEvent(event) {
        var card = closestCard(event && event.target);
        if (card) return card;

        if (event && event.composedPath) {
            var path = event.composedPath();

            for (var i = 0; i < path.length; i++) {
                if (
                    path[i] &&
                    path[i].classList &&
                    path[i].classList.contains('card')
                ) {
                    return path[i];
                }
            }
        }

        return null;
    }

    function findFocusedCard() {
        if (
            focusedCard &&
            document.documentElement.contains(focusedCard) &&
            focusedCard.classList.contains('focus')
        ) {
            return focusedCard;
        }

        var cards = document.querySelectorAll('.card.focus');

        for (var i = 0; i < cards.length; i++) {
            var view = cards[i].querySelector('.card__view');
            if (!view) continue;

            var rect = view.getBoundingClientRect();

            if (
                rect.width >= 12 &&
                rect.height >= 12 &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth
            ) {
                focusedCard = cards[i];
                return cards[i];
            }
        }

        return null;
    }

    function numberOr(value, fallback) {
        var number = parseFloat(value);
        return isFinite(number) ? number : fallback;
    }

    function getTarget() {
        var card = findFocusedCard();
        if (!card) return null;

        var view = card.querySelector('.card__view');
        if (!view) return null;

        var rect = view.getBoundingClientRect();

        if (
            rect.width < 12 ||
            rect.height < 12 ||
            rect.bottom <= 0 ||
            rect.right <= 0 ||
            rect.top >= window.innerHeight ||
            rect.left >= window.innerWidth
        ) return null;

        // Исходный размер карточки без эффекта масштабирования.
        var width = view.offsetWidth || rect.width;
        var height = view.offsetHeight || rect.height;

        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;

        var top = -8;
        var left = -8;
        var right = -8;
        var bottom = -8;

        var borderWidth = 3;
        var borderColor = '#ffffff';
        var borderRadius = 20;

        try {
            var pseudo = window.getComputedStyle(view, '::after');

            if (pseudo && pseudo.content && pseudo.content !== 'none') {
                top = numberOr(pseudo.top, top);
                left = numberOr(pseudo.left, left);
                right = numberOr(pseudo.right, right);
                bottom = numberOr(pseudo.bottom, bottom);

                if (parseFloat(pseudo.borderTopWidth) > 0) {
                    borderWidth = parseFloat(pseudo.borderTopWidth);
                    borderColor = pseudo.borderTopColor || borderColor;
                    borderRadius = numberOr(
                        pseudo.borderTopLeftRadius,
                        borderRadius
                    );
                }
            }
        } catch (e) {}

        var targetWidth = width - left - right;
        var targetHeight = height - top - bottom;

        if (targetWidth < 20 || targetHeight < 20) return null;

        return {
            x: centerX - width / 2 + left,
            y: centerY - height / 2 + top,
            width: targetWidth,
            height: targetHeight,
            borderWidth: borderWidth,
            borderRadius: borderRadius,
            borderColor: borderColor
        };
    }

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

        frame.style.borderWidth = state.borderWidth + 'px';
        frame.style.borderRadius = state.borderRadius + 'px';
        frame.style.borderColor = state.borderColor;
        frame.style.opacity = '1';
    }

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
            lastTime = now;
            applyPosition(current);
        } else {
            var delta = lastTime
                ? Math.max(1, Math.min(40, now - lastTime))
                : 16;

            lastTime = now;

            var duration = storageDuration();

            // Плавное следование без повторного CSS-перезапуска анимации.
            var factor = 1 - Math.exp(-4.6 * delta / duration);

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

            // Убираем микродвижения на долях пикселя.
            if (Math.abs(current.x - target.x) < 0.12) current.x = target.x;
            if (Math.abs(current.y - target.y) < 0.12) current.y = target.y;
            if (Math.abs(current.width - target.width) < 0.12) current.width = target.width;
            if (Math.abs(current.height - target.height) < 0.12) current.height = target.height;

            applyPosition(current);
        }

        var distance = Math.max(
            Math.abs(current.x - target.x),
            Math.abs(current.y - target.y),
            Math.abs(current.width - target.width),
            Math.abs(current.height - target.height)
        );

        if (now < followUntil || distance > 0.18) {
            raf = requestAnimationFrame(tick);
        }
    }

    function wake(ms) {
        followUntil = Math.max(
            followUntil,
            performance.now() + ms
        );

        if (!raf) {
            raf = requestAnimationFrame(tick);
        }
    }

    function onFocusChange(event) {
        var card = cardFromEvent(event);

        if (card) focusedCard = card;

        wake(850);
    }

    function onClick() { wake(500); }
    function onResize() { wake(500); }
    function onScroll() { wake(850); }

    function onMutations(records) {
        for (var i = 0; i < records.length; i++) {
            var node = records[i].target;

            if (node === frame || node === styleEl) continue;
            if (node.closest && node.closest('.menu')) continue;

            if (frame && (node === frame || frame.contains(node))) continue;

            wake(650);
            return;
        }
    }

    function init() {
        if (!document.body || !document.head) return;

        var oldFrame = document.getElementById(FRAME_ID);
        if (oldFrame && oldFrame.parentNode) {
            oldFrame.parentNode.removeChild(oldFrame);
        }

        var oldStyle = document.getElementById(STYLE_ID);
        if (oldStyle && oldStyle.parentNode) {
            oldStyle.parentNode.removeChild(oldStyle);
        }

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

        document.addEventListener('hover:focus', onFocusChange, true);
        document.addEventListener('focusin', onFocusChange, true);
        document.addEventListener('click', onClick, true);

        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);

        wake(500);

        window.LampaFocusGlide = {
            refresh: function () {
                wake(500);
            },

            destroy: function () {
                if (observer) observer.disconnect();

                document.removeEventListener('hover:focus', onFocusChange, true);
                document.removeEventListener('focusin', onFocusChange, true);
                document.removeEventListener('click', onClick, true);

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
                delete window.__lampa_focus_glide_v5;
            }
        };
    }

    function start() {
        if (document.body) {
            init();
        } else {
            document.addEventListener('DOMContentLoaded', init);
        }
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

(function () {
    'use strict';

    // Lampa Focus Glide — spring-like shared focus frame for poster cards.
    // Install as a regular Lampa JavaScript plugin.
    if (window.__lampa_focus_glide_loaded) return;
    window.__lampa_focus_glide_loaded = true;

    var STYLE_ID = 'lampa-focus-glide-style';
    var FRAME_ID = 'lampa-focus-glide-frame';

    var style = `
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
            border: 2px solid rgba(255,255,255,.96);
            border-radius: 9px;
            background: rgba(255,255,255,.035);
            box-shadow:
                0 0 0 1px rgba(255,255,255,.12),
                0 5px 22px rgba(0,0,0,.22),
                inset 0 0 0 1px rgba(255,255,255,.12);
            transform: translate3d(-200vw,-200vh,0) scale(1);
            transform-origin: center center;
            transition:
                transform 360ms cubic-bezier(.18, 1.32, .32, 1),
                width 220ms cubic-bezier(.2,.8,.2,1),
                height 220ms cubic-bezier(.2,.8,.2,1),
                border-radius 220ms ease,
                opacity 130ms ease;
            will-change: transform, width, height;
        }

        #${FRAME_ID}.is-visible {
            opacity: 1;
        }

        #${FRAME_ID}.is-moving {
            box-shadow:
                0 0 0 1px rgba(255,255,255,.16),
                0 7px 25px rgba(0,0,0,.25),
                inset 0 0 0 1px rgba(255,255,255,.15);
        }

        .lampa-focus-glide-card {
            transition: transform 220ms cubic-bezier(.2,.8,.2,1) !important;
            transform: scale(1.045);
            transform-origin: center center;
            z-index: 2;
        }

        @media (prefers-reduced-motion: reduce) {
            #${FRAME_ID}, .lampa-focus-glide-card {
                transition-duration: 1ms !important;
            }
        }
    `;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var node = document.createElement('style');
        node.id = STYLE_ID;
        node.textContent = style;

        (document.head || document.documentElement).appendChild(node);
    }

    function findFocusedCard() {
        var candidates = document.querySelectorAll(
            '.card.focus, .card--small.focus, .card--wide.focus, .card--collection.focus, .selector.focus'
        );

        for (var i = candidates.length - 1; i >= 0; i--) {
            var el = candidates[i];
            var rect = el.getBoundingClientRect();

            if (
                rect.width > 12 &&
                rect.height > 12 &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth
            ) {
                return el;
            }
        }

        return null;
    }

    function getRadius(card) {
        var value = window.getComputedStyle(card).borderRadius;
        return value && value !== '0px' ? value : '9px';
    }

    function init() {
        if (!document.body || document.getElementById(FRAME_ID)) return;

        injectStyle();

        var frame = document.createElement('div');
        frame.id = FRAME_ID;
        document.body.appendChild(frame);

        var currentCard = null;
        var raf = 0;
        var hideTimer = 0;

        function update() {
            raf = 0;

            var card = findFocusedCard();

            if (!card) {
                if (currentCard) {
                    currentCard.classList.remove('lampa-focus-glide-card');
                }

                currentCard = null;
                frame.classList.remove('is-visible', 'is-moving');
                return;
            }

            var rect = card.getBoundingClientRect();

            if (rect.width < 12 || rect.height < 12) return;

            if (currentCard && currentCard !== card) {
                currentCard.classList.remove('lampa-focus-glide-card');
            }

            currentCard = card;
            card.classList.add('lampa-focus-glide-card');

            var pad = 4;
            var width = rect.width + pad * 2;
            var height = rect.height + pad * 2;
            var x = rect.left - pad;
            var y = rect.top - pad;

            frame.style.width = width + 'px';
            frame.style.height = height + 'px';
            frame.style.borderRadius = getRadius(card);

            frame.style.transform =
                'translate3d(' + x + 'px,' + y + 'px,0) scale(1.015)';

            frame.classList.add('is-visible', 'is-moving');

            clearTimeout(hideTimer);

            hideTimer = setTimeout(function () {
                frame.classList.remove('is-moving');
            }, 390);
        }

        function schedule() {
            if (raf) return;
            raf = requestAnimationFrame(update);
        }

        var observer = new MutationObserver(function (records) {
            for (var i = 0; i < records.length; i++) {
                if (records[i].attributeName === 'class') {
                    schedule();
                    return;
                }
            }
        });

        observer.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        document.addEventListener('focusin', schedule, true);
        document.addEventListener('hover:focus', schedule, true);
        document.addEventListener('click', schedule, true);

        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('scroll', schedule, true);

        schedule();

        window.LampaFocusGlide = {
            refresh: schedule,

            destroy: function () {
                observer.disconnect();

                document.removeEventListener('focusin', schedule, true);
                document.removeEventListener('hover:focus', schedule, true);
                document.removeEventListener('click', schedule, true);

                window.removeEventListener('resize', schedule);
                window.removeEventListener('scroll', schedule, true);

                clearTimeout(hideTimer);

                if (currentCard) {
                    currentCard.classList.remove('lampa-focus-glide-card');
                }

                frame.remove();

                var css = document.getElementById(STYLE_ID);
                if (css) css.remove();

                delete window.LampaFocusGlide;
                delete window.__lampa_focus_glide_loaded;
            }
        };
    }

    function waitForLampa() {
        if (document.body) {
            init();
        } else {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        }
    }

    if (window.appready) {
        waitForLampa();
    } else if (window.Lampa && window.Lampa.Listener) {
        window.Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                waitForLampa();
            }
        });
    } else {
        var attempts = 0;

        var poll = setInterval(function () {
            attempts++;

            if (document.body && (window.appready || window.Lampa)) {
                clearInterval(poll);
                init();
            } else if (attempts > 80) {
                clearInterval(poll);
            }
        }, 250);
    }
})();



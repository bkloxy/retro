(function () {
    'use strict';

    if (window.__RETRO_NETFLIX_UI__) return;
    window.__RETRO_NETFLIX_UI__ = true;

    /*
     * RETRO — NETFLIX UI FOR LAMPA
     * Designed for Lampa 3.x
     *
     * Important:
     * This plugin DOES NOT create another player.
     * It DOES NOT replace Lampa navigation.
     * It styles Lampa's native interface and native cards.
     */

    var VERSION = '1.0.0';

    if (!window.Lampa) return;

    if (
        Lampa.Manifest &&
        Lampa.Manifest.app_digital &&
        Lampa.Manifest.app_digital < 300
    ) {
        return;
    }

    var STYLE_ID = 'retro-netflix-style';
    var FRAME_ID = 'retro-netflix-focus';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
/* =========================================================
   RETRO / NETFLIX
   ========================================================= */

html,
body {
    background: #050505 !important;
}

body {
    --retro-red: #e50914;
    --retro-white: #ffffff;
    --retro-muted: #8f8f8f;
    --retro-panel: #111111;
}

/* ---------------------------------------------------------
   MAIN BACKGROUND
   --------------------------------------------------------- */

body.retro-netflix-active,
body.retro-netflix-active .app,
body.retro-netflix-active .main,
body.retro-netflix-active .activity,
body.retro-netflix-active .layer {
    background: #050505 !important;
}

/* ---------------------------------------------------------
   LEFT MENU
   --------------------------------------------------------- */

.retro-netflix-active .wrap__left {
    background:
        linear-gradient(
            90deg,
            rgba(0,0,0,.98) 0%,
            rgba(0,0,0,.92) 72%,
            rgba(0,0,0,0) 100%
        ) !important;

    border: 0 !important;
}

.retro-netflix-active .menu__item {
    border-radius: 6px !important;
    transition:
        transform .18s ease,
        background .18s ease,
        color .18s ease;
}

.retro-netflix-active .menu__item:hover {
    background: rgba(255,255,255,.08) !important;
}

.retro-netflix-active .menu__item.focus {
    background: rgba(255,255,255,.12) !important;
    color: #fff !important;
    transform: translateX(4px);
}

.retro-netflix-active .menu__item .menu__ico {
    opacity: .75;
}

.retro-netflix-active .menu__item.focus .menu__ico {
    opacity: 1;
}

/* ---------------------------------------------------------
   HEAD / TOP AREA
   --------------------------------------------------------- */

.retro-netflix-active .head {
    background:
        linear-gradient(
            180deg,
            rgba(0,0,0,.96) 0%,
            rgba(0,0,0,.72) 65%,
            rgba(0,0,0,0) 100%
        ) !important;

    border: 0 !important;
    box-shadow: none !important;
}

.retro-netflix-active .head__action,
.retro-netflix-active .head__button {
    border-radius: 50% !important;
}

/* ---------------------------------------------------------
   CONTENT
   --------------------------------------------------------- */

.retro-netflix-active .content,
.retro-netflix-active .main__content {
    background: transparent !important;
}

/* ---------------------------------------------------------
   ROW TITLES
   --------------------------------------------------------- */

.retro-netflix-active .items-line__title,
.retro-netflix-active .items-line__title-text {
    color: #fff !important;
    font-weight: 700 !important;
    letter-spacing: -.2px;
}

.retro-netflix-active .items-line__title {
    margin-bottom: .65em !important;
}

/* ---------------------------------------------------------
   CARD GRID
   --------------------------------------------------------- */

.retro-netflix-active .card {
    border-radius: 4px !important;
    overflow: visible !important;
    background: transparent !important;
}

.retro-netflix-active .card__view {
    border-radius: 4px !important;
    overflow: hidden !important;
    background: #111 !important;

    box-shadow:
        0 2px 8px rgba(0,0,0,.30);

    transition:
        transform .20s cubic-bezier(.2,.8,.2,1),
        box-shadow .20s ease,
        filter .20s ease;
}

.retro-netflix-active .card__img {
    border-radius: 4px !important;
}

/* ---------------------------------------------------------
   RECTANGULAR NETFLIX POSTERS
   --------------------------------------------------------- */

.retro-netflix-active .card--wide .card__view,
.retro-netflix-active .card--movie .card__view {
    aspect-ratio: 16 / 9 !important;
}

.retro-netflix-active .card--wide .card__img,
.retro-netflix-active .card--movie .card__img {
    aspect-ratio: 16 / 9 !important;
    object-fit: cover !important;
}

/*
 * Lampa has several card variants.
 * These rules make the normal catalog cards wider without
 * touching the actual data/model.
 */

.retro-netflix-active .items-line .card {
    width: 18vw !important;
    min-width: 18vw !important;
    max-width: 18vw !important;
}

.retro-netflix-active .items-line .card__view {
    aspect-ratio: 16 / 9;
}

/* ---------------------------------------------------------
   CARD INFORMATION
   --------------------------------------------------------- */

.retro-netflix-active .card__title {
    color: #fff !important;
    font-weight: 600 !important;
}

.retro-netflix-active .card__subtitle {
    color: #8e8e8e !important;
}

.retro-netflix-active .card__vote {
    border-radius: 4px !important;
}

/* ---------------------------------------------------------
   NATIVE LAMPA FOCUS
   --------------------------------------------------------- */

.retro-netflix-active .card.focus .card__view {
    transform: scale(1.045);

    box-shadow:
        0 0 0 3px #fff,
        0 10px 30px rgba(0,0,0,.65);

    z-index: 20;
}

/*
 * The old Lampa focus decorations are visually hidden.
 * The actual Lampa focus state remains untouched.
 */

.retro-netflix-active .card.focus::before,
.retro-netflix-active .card.focus::after {
    box-shadow: none !important;
}

/* ---------------------------------------------------------
   SMOOTH FOCUS FRAME
   --------------------------------------------------------- */

#retro-netflix-focus {
    position: fixed;

    pointer-events: none;

    z-index: 9998;

    border: 3px solid #fff;

    border-radius: 5px;

    opacity: 0;

    box-sizing: border-box;

    transition:
        left .16s cubic-bezier(.2,.8,.2,1),
        top .16s cubic-bezier(.2,.8,.2,1),
        width .16s cubic-bezier(.2,.8,.2,1),
        height .16s cubic-bezier(.2,.8,.2,1),
        opacity .12s ease;

    box-shadow:
        0 8px 28px rgba(0,0,0,.60);
}

/*
 * We don't show the external frame on touch devices.
 * Native focus still works.
 */

@media (pointer: coarse) {
    #retro-netflix-focus {
        display: none;
    }
}

/* ---------------------------------------------------------
   ROW SPACING
   --------------------------------------------------------- */

.retro-netflix-active .items-line {
    margin-bottom: 2.3em !important;
}

/* ---------------------------------------------------------
   SCROLLBAR
   --------------------------------------------------------- */

.retro-netflix-active ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.retro-netflix-active ::-webkit-scrollbar-track {
    background: transparent;
}

.retro-netflix-active ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.25);
    border-radius: 20px;
}

/* ---------------------------------------------------------
   BUTTONS
   --------------------------------------------------------- */

.retro-netflix-active .button,
.retro-netflix-active .selector {
    border-radius: 4px !important;
}

.retro-netflix-active .button.focus {
    box-shadow:
        0 0 0 2px #fff !important;
}

/* ---------------------------------------------------------
   FULL START / DETAILS
   --------------------------------------------------------- */

.retro-netflix-active .full-start {
    background: #050505 !important;
}

.retro-netflix-active .full-start__background {
    opacity: .48 !important;
}

.retro-netflix-active .full-start__body {
    background:
        linear-gradient(
            90deg,
            rgba(5,5,5,.98) 0%,
            rgba(5,5,5,.82) 42%,
            rgba(5,5,5,.30) 75%,
            rgba(5,5,5,0) 100%
        ) !important;
}

.retro-netflix-active .full-start__poster {
    border-radius: 5px !important;
    overflow: hidden !important;
    box-shadow:
        0 15px 45px rgba(0,0,0,.60);
}

/* ---------------------------------------------------------
   DETAIL BUTTONS
   --------------------------------------------------------- */

.retro-netflix-active .full-start__buttons .button {
    background: #fff !important;
    color: #000 !important;
}

.retro-netflix-active .full-start__buttons .button.focus {
    background: #e50914 !important;
    color: #fff !important;
}

/* ---------------------------------------------------------
   PLAYER SAFETY
   ---------------------------------------------------------

   IMPORTANT:
   Don't touch the video element itself.
   Lampa's native player remains the playback engine.
 */

.retro-netflix-active .player video {
    visibility: visible !important;
    opacity: 1 !important;
}

/* ---------------------------------------------------------
   MOBILE
   --------------------------------------------------------- */

@media (max-width: 900px) {

    .retro-netflix-active .items-line .card {
        width: 42vw !important;
        min-width: 42vw !important;
        max-width: 42vw !important;
    }

    .retro-netflix-active .items-line {
        margin-bottom: 1.8em !important;
    }
}

@media (min-width: 1400px) {

    .retro-netflix-active .items-line .card {
        width: 16vw !important;
        min-width: 16vw !important;
        max-width: 16vw !important;
    }
}

/* ---------------------------------------------------------
   ANIMATION
   --------------------------------------------------------- */

@media (prefers-reduced-motion: no-preference) {

    .retro-netflix-active .card__view {
        will-change: transform;
    }
}

        `;

        document.head.appendChild(style);
    }

    function createFocusFrame() {
        if (document.getElementById(FRAME_ID)) return;

        var frame = document.createElement('div');

        frame.id = FRAME_ID;

        document.body.appendChild(frame);
    }

    function moveFocusFrame() {

        var frame = document.getElementById(FRAME_ID);

        if (!frame) return;

        var focused = document.querySelector(
            '.card.focus .card__view'
        );

        if (!focused) {
            frame.style.opacity = '0';
            return;
        }

        var rect = focused.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            frame.style.opacity = '0';
            return;
        }

        frame.style.left = (rect.left - 3) + 'px';
        frame.style.top = (rect.top - 3) + 'px';
        frame.style.width = (rect.width + 6) + 'px';
        frame.style.height = (rect.height + 6) + 'px';
        frame.style.opacity = '1';
    }

    var focusTimer = null;

    function scheduleFocusUpdate() {

        if (focusTimer) return;

        focusTimer = setTimeout(function () {

            focusTimer = null;

            moveFocusFrame();

        }, 40);
    }

    function activate() {

        injectStyle();
        createFocusFrame();

        document.body.classList.add(
            'retro-netflix-active'
        );

        scheduleFocusUpdate();
    }

    function watchDOM() {

        if (!window.MutationObserver) return;

        var observer = new MutationObserver(function () {

            scheduleFocusUpdate();

        });

        observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class']
        });

        window.__RETRO_NETFLIX_OBSERVER__ = observer;
    }

    function bindLampaEvents() {

        /*
         * Lampa Listener is the preferred event system in 3.x.
         * We don't replace Controller or keyboard processing.
         */

        if (Lampa.Listener && Lampa.Listener.follow) {

            Lampa.Listener.follow(
                'activity',
                function () {
                    scheduleFocusUpdate();
                }
            );

            Lampa.Listener.follow(
                'state:changed',
                function () {
                    scheduleFocusUpdate();
                }
            );
        }
    }

    function start() {

        activate();
        watchDOM();
        bindLampaEvents();

        /*
         * Low-frequency safety refresh.
         *
         * This is deliberately NOT requestAnimationFrame.
         * We don't run JavaScript 60 times per second.
         */

        setInterval(function () {

            if (
                document.body.classList.contains(
                    'retro-netflix-active'
                )
            ) {
                scheduleFocusUpdate();
            }

        }, 250);
    }

    /*
     * Wait until Lampa has finished creating its DOM.
     */

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            start,
            { once: true }
        );

    } else {

        start();

    }

})();

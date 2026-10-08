(function () {
    'use strict';

    if (window.__RETRO_NETFLIX_UI_V2__) return;
    window.__RETRO_NETFLIX_UI_V2__ = true;

    if (!window.Lampa) return;

    if (
        Lampa.Manifest &&
        Lampa.Manifest.app_digital &&
        Lampa.Manifest.app_digital < 300
    ) {
        return;
    }

    var STYLE_ID = 'retro-netflix-v2-style';
    var FRAME_ID = 'retro-netflix-focus';

    function addStyle() {

        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `

/* =========================================================
   RETRO — NETFLIX INTERFACE
   ========================================================= */

html,
body {
    background: #050505 !important;
}

body.retro-netflix {
    background: #050505 !important;

    --retro-red: #e50914;
    --retro-white: #ffffff;
    --retro-gray: #b3b3b3;
    --retro-dark: #050505;
}

/* =========================================================
   GLOBAL
   ========================================================= */

.retro-netflix .activity,
.retro-netflix .main,
.retro-netflix .content,
.retro-netflix .layer {
    background: transparent !important;
}

/* =========================================================
   LEFT NETFLIX MENU
   ========================================================= */

.retro-netflix .wrap__left {

    width: 250px !important;

    background:
        linear-gradient(
            90deg,
            #050505 0%,
            #050505 62%,
            rgba(5,5,5,.96) 78%,
            rgba(5,5,5,0) 100%
        ) !important;

    border: none !important;

    box-shadow: none !important;

    padding-top: 70px !important;

    z-index: 1000 !important;
}

/* Netflix-style menu items */

.retro-netflix .menu__item {

    position: relative;

    height: 54px !important;

    margin: 5px 18px !important;

    padding-left: 18px !important;

    border-radius: 7px !important;

    color: #a9a9a9 !important;

    transition:
        background .18s ease,
        color .18s ease,
        transform .18s ease;

}

/* icon */

.retro-netflix .menu__item .menu__ico {

    opacity: .72;

    transition:
        opacity .18s ease,
        transform .18s ease;

}

/* hover */

.retro-netflix .menu__item:hover {

    background:
        rgba(255,255,255,.07) !important;

    color: #fff !important;

}

/* focused menu */

.retro-netflix .menu__item.focus {

    background:
        rgba(255,255,255,.13) !important;

    color: #fff !important;

    transform: translateX(5px);

}

/* white Netflix-like indicator */

.retro-netflix .menu__item.focus::before {

    content: '';

    position: absolute;

    left: 0;

    top: 10px;

    bottom: 10px;

    width: 3px;

    border-radius: 3px;

    background: #fff;

}

/* focused icon */

.retro-netflix .menu__item.focus .menu__ico {

    opacity: 1;

    transform: scale(1.08);

}

/* =========================================================
   TOP HEADER
   ========================================================= */

.retro-netflix .head {

    background:
        linear-gradient(
            180deg,
            rgba(0,0,0,.98) 0%,
            rgba(0,0,0,.90) 42%,
            rgba(0,0,0,0) 100%
        ) !important;

    border: none !important;

    box-shadow: none !important;

}

/* =========================================================
   CONTENT OFFSET
   ========================================================= */

.retro-netflix .content {

    padding-left: 40px !important;

}

/* =========================================================
   ROWS
   ========================================================= */

.retro-netflix .items-line {

    margin-bottom: 42px !important;

}

/* row title */

.retro-netflix .items-line__title {

    margin-bottom: 17px !important;

    color: #fff !important;

    font-size: 1.42em !important;

    font-weight: 700 !important;

    letter-spacing: -.02em;

}

/* =========================================================
   POSTERS
   ========================================================= */

/*
   IMPORTANT:
   Normal Netflix/TMDB vertical poster.
   2:3 aspect ratio.
*/

.retro-netflix .items-line .card {

    width: 190px !important;

    min-width: 190px !important;

    max-width: 190px !important;

    height: auto !important;

    margin-right: 14px !important;

}

/* poster container */

.retro-netflix .items-line .card__view {

    position: relative;

    width: 100% !important;

    aspect-ratio: 2 / 3 !important;

    height: auto !important;

    overflow: hidden !important;

    border-radius: 5px !important;

    background: #111 !important;

    transform-origin: center center;

    transition:
        transform .22s cubic-bezier(.2,.8,.2,1),
        box-shadow .22s ease;

}

/* image */

.retro-netflix .items-line .card__img {

    width: 100% !important;

    height: 100% !important;

    aspect-ratio: 2 / 3 !important;

    object-fit: cover !important;

    border-radius: 5px !important;

    transition:
        transform .35s cubic-bezier(.2,.8,.2,1),
        filter .25s ease;

}

/* =========================================================
   POSTER FOCUS ANIMATION
   ========================================================= */

.retro-netflix .card.focus {

    z-index: 50 !important;

}

.retro-netflix .card.focus .card__view {

    transform: scale(1.075);

    box-shadow:
        0 0 0 3px #fff,
        0 12px 35px rgba(0,0,0,.72);

}

/* slight image zoom */

.retro-netflix .card.focus .card__img {

    transform: scale(1.025);

}

/* =========================================================
   SINGLE SMOOTH WHITE FOCUS FRAME
   ========================================================= */

#retro-netflix-focus {

    position: fixed;

    pointer-events: none;

    z-index: 999999;

    box-sizing: border-box;

    border: 3px solid #fff;

    border-radius: 6px;

    opacity: 0;

    transition:
        left .18s cubic-bezier(.2,.8,.2,1),
        top .18s cubic-bezier(.2,.8,.2,1),
        width .18s cubic-bezier(.2,.8,.2,1),
        height .18s cubic-bezier(.2,.8,.2,1),
        opacity .12s ease;

    box-shadow:
        0 12px 35px rgba(0,0,0,.65);

}

/* =========================================================
   CARD TITLES
   ========================================================= */

.retro-netflix .card__title {

    color: #fff !important;

    font-size: .92em !important;

    font-weight: 600 !important;

    margin-top: 9px !important;

}

.retro-netflix .card__subtitle {

    color: #8d8d8d !important;

}

/* =========================================================
   RATING
   ========================================================= */

.retro-netflix .card__vote {

    border-radius: 4px !important;

}

/* =========================================================
   DETAILS / FILM PAGE
   ========================================================= */

.retro-netflix .full-start {

    background: #050505 !important;

}

.retro-netflix .full-start__background {

    opacity: .46 !important;

}

.retro-netflix .full-start__body {

    background:
        linear-gradient(
            90deg,
            rgba(5,5,5,.99) 0%,
            rgba(5,5,5,.90) 34%,
            rgba(5,5,5,.48) 67%,
            rgba(5,5,5,0) 100%
        ) !important;

}

/* detail poster */

.retro-netflix .full-start__poster {

    border-radius: 6px !important;

    overflow: hidden !important;

    box-shadow:
        0 18px 55px rgba(0,0,0,.65);

}

/* detail buttons */

.retro-netflix .full-start__buttons .button {

    border-radius: 5px !important;

}

.retro-netflix .full-start__buttons .button.focus {

    box-shadow:
        0 0 0 2px #fff !important;

}

/* =========================================================
   SCROLLBAR
   ========================================================= */

.retro-netflix ::-webkit-scrollbar {

    width: 5px;
    height: 5px;

}

.retro-netflix ::-webkit-scrollbar-track {

    background: transparent;

}

.retro-netflix ::-webkit-scrollbar-thumb {

    background: rgba(255,255,255,.25);

    border-radius: 20px;

}

/* =========================================================
   BUTTONS
   ========================================================= */

.retro-netflix .button {

    border-radius: 5px !important;

}

.retro-netflix .button.focus {

    box-shadow:
        0 0 0 2px #fff !important;

}

/* =========================================================
   DESKTOP
   ========================================================= */

@media (min-width: 1400px) {

    .retro-netflix .items-line .card {

        width: 205px !important;

        min-width: 205px !important;

        max-width: 205px !important;

    }

}

/* =========================================================
   SMALL SCREENS
   ========================================================= */

@media (max-width: 900px) {

    .retro-netflix .wrap__left {

        width: 205px !important;

    }

    .retro-netflix .content {

        padding-left: 15px !important;

    }

    .retro-netflix .items-line .card {

        width: 135px !important;

        min-width: 135px !important;

        max-width: 135px !important;

    }

}

/* =========================================================
   TOUCH DEVICES
   ========================================================= */

@media (pointer: coarse) {

    #retro-netflix-focus {

        display: none;

    }

}

`;

        document.head.appendChild(style);
    }

    function createFocus() {

        if (document.getElementById(FRAME_ID)) return;

        var frame = document.createElement('div');

        frame.id = FRAME_ID;

        document.body.appendChild(frame);
    }

    function updateFocus() {

        var frame =
            document.getElementById(FRAME_ID);

        if (!frame) return;

        var card =
            document.querySelector(
                '.card.focus .card__view'
            );

        if (!card) {

            frame.style.opacity = '0';

            return;
        }

        var rect =
            card.getBoundingClientRect();

        if (!rect.width || !rect.height) {

            frame.style.opacity = '0';

            return;
        }

        frame.style.left =
            (rect.left - 3) + 'px';

        frame.style.top =
            (rect.top - 3) + 'px';

        frame.style.width =
            (rect.width + 6) + 'px';

        frame.style.height =
            (rect.height + 6) + 'px';

        frame.style.opacity = '1';
    }

    var timer = null;

    function requestFocusUpdate() {

        if (timer) return;

        timer = setTimeout(function () {

            timer = null;

            updateFocus();

        }, 35);
    }

    function activate() {

        document.body.classList.add(
            'retro-netflix'
        );

        addStyle();

        createFocus();

        requestFocusUpdate();
    }

    function observe() {

        if (!window.MutationObserver) return;

        var observer =
            new MutationObserver(function () {

                requestFocusUpdate();

            });

        observer.observe(
            document.body,
            {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['class']
            }
        );

        window.__RETRO_NETFLIX_OBSERVER_V2__ =
            observer;
    }

    function bindLampa() {

        if (
            Lampa.Listener &&
            Lampa.Listener.follow
        ) {

            Lampa.Listener.follow(
                'activity',
                function () {

                    requestFocusUpdate();

                }
            );

            Lampa.Listener.follow(
                'state:changed',
                function () {

                    requestFocusUpdate();

                }
            );

        }
    }

    function start() {

        activate();

        observe();

        bindLampa();

        setInterval(
            requestFocusUpdate,
            300
        );
    }

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            start,
            { once: true }
        );

    } else {

        start();

    }

})();

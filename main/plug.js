(function () {
    'use strict';

    if (window.retroNetflixPlayerV2) return;
    window.retroNetflixPlayerV2 = true;

    var STYLE_ID = 'retro-netflix-player-v2';

    function css() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `

/* =========================================================
   RETRO NETFLIX PLAYER V2
   Native Lampa player skin
   No second video
   No second player
   ========================================================= */


/* ---------------------------------------------------------
   FULL SCREEN PLAYER PANEL
   --------------------------------------------------------- */

.player-panel.retro-netflix {

    position: fixed !important;

    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;

    width: 100vw !important;
    height: 100vh !important;

    padding: 0 !important;
    margin: 0 !important;

    z-index: 10000 !important;

    background: transparent !important;

    pointer-events: none !important;
}


/* Native Lampa visibility mechanism */

.player-panel.retro-netflix:not(.panel--visible) {
    transform: translateY(100%) !important;
    opacity: 0 !important;
}

.player-panel.retro-netflix.panel--visible {
    transform: translateY(0) !important;
    opacity: 1 !important;
}


/* ---------------------------------------------------------
   BODY
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__body {

    position: absolute !important;

    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;

    width: 100% !important;
    height: 100% !important;

    padding: 0 !important;

    pointer-events: none !important;
}


/* ---------------------------------------------------------
   TOP CINEMATIC GRADIENT
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__body::before {

    content: "";

    position: absolute;

    left: 0;
    right: 0;
    top: 0;

    height: 30vh;

    background:
        linear-gradient(
            to bottom,
            rgba(0,0,0,.82) 0%,
            rgba(0,0,0,.48) 35%,
            rgba(0,0,0,0) 100%
        );

    pointer-events: none;

    z-index: 1;
}


/* ---------------------------------------------------------
   BOTTOM CINEMATIC GRADIENT
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__body::after {

    content: "";

    position: absolute;

    left: 0;
    right: 0;
    bottom: 0;

    height: 43vh;

    background:
        linear-gradient(
            to top,
            rgba(0,0,0,.94) 0%,
            rgba(0,0,0,.82) 23%,
            rgba(0,0,0,.42) 60%,
            rgba(0,0,0,0) 100%
        );

    pointer-events: none;

    z-index: 1;
}


/* ---------------------------------------------------------
   APEX
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__apex {

    position: absolute !important;

    left: 0 !important;
    right: 0 !important;
    top: 0 !important;

    width: 100% !important;

    height: 100% !important;

    margin: 0 !important;

    transform: none !important;

    z-index: 20 !important;

    pointer-events: none !important;
}

.player-panel.retro-netflix .player-panel__apex > div {
    position: static !important;
}


/* ---------------------------------------------------------
   NETFLIX BACK ICON
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__apex::before {

    content: "‹";

    position: absolute;

    left: 3.2vw;
    top: 3.3vh;

    width: 46px;
    height: 46px;

    font-family: Arial, sans-serif;

    font-size: 58px;
    line-height: 38px;

    font-weight: 300;

    color: white;

    text-shadow:
        0 2px 12px rgba(0,0,0,.8);

    z-index: 30;

    pointer-events: none;
}


/* ---------------------------------------------------------
   TITLE TOP RIGHT
   --------------------------------------------------------- */

.retro-netflix-title {

    position: absolute !important;

    right: 3.5vw;
    top: 3.7vh;

    max-width: 48vw;

    color: #fff;

    font-size: 27px;

    font-weight: 700;

    line-height: 1.2;

    text-align: right;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

    text-shadow:
        0 2px 12px rgba(0,0,0,.9);

    z-index: 40;

    pointer-events: none;
}

.retro-netflix-meta {

    position: absolute !important;

    right: 3.5vw;
    top: calc(3.7vh + 34px);

    color: rgba(255,255,255,.85);

    font-size: 15px;

    font-weight: 500;

    text-align: right;

    text-shadow:
        0 2px 10px rgba(0,0,0,.9);

    z-index: 40;

    pointer-events: none;
}


/* ---------------------------------------------------------
   HIDE OLD TOP TITLE IF LAMPA ADDS ONE
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__filename {
    display: none !important;
}


/* ---------------------------------------------------------
   TIMELINE
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__timeline {

    position: absolute !important;

    left: 8vw !important;
    right: 8vw !important;

    bottom: 15.2vh !important;

    width: auto !important;

    height: 4px !important;

    margin: 0 !important;

    padding: 0 !important;

    border-radius: 20px !important;

    background: rgba(255,255,255,.42) !important;

    z-index: 30 !important;

    pointer-events: auto !important;

    box-shadow: none !important;
}


/* remove giant native hit-area */

.player-panel.retro-netflix .player-panel__timeline::after {

    top: -18px !important;
    bottom: -18px !important;

    left: 0 !important;
    right: 0 !important;
}


/* buffered */

.player-panel.retro-netflix .player-panel__peding {

    height: 100% !important;

    background:
        rgba(255,255,255,.32) !important;

    border-radius: 20px !important;
}


/* Netflix RED progress */

.player-panel.retro-netflix .player-panel__position {

    height: 100% !important;

    background:
        #e50914 !important;

    border-radius: 20px !important;

    display: flex !important;

    justify-content: flex-end !important;
}


/* red progress knob */

.player-panel.retro-netflix
.player-panel__position > div::after {

    display: block !important;

    content: "";

    position: absolute;

    width: 13px !important;
    height: 13px !important;

    right: 0 !important;
    top: 50% !important;

    transform:
        translate(50%,-50%) !important;

    border-radius: 50% !important;

    background: #fff !important;

    box-shadow:
        0 2px 8px rgba(0,0,0,.7) !important;
}


/* ---------------------------------------------------------
   TIME
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__line-one {

    position: absolute !important;

    left: 8vw !important;
    right: 8vw !important;

    bottom: 10.8vh !important;

    margin: 0 !important;

    height: auto !important;

    z-index: 30 !important;

    pointer-events: none !important;
}


.player-panel.retro-netflix .player-panel__timenow {

    position: absolute !important;

    left: 0 !important;

    bottom: 0 !important;

    margin: 0 !important;

    color: #fff !important;

    font-size: 16px !important;

    font-weight: 500 !important;

    text-shadow:
        0 2px 8px rgba(0,0,0,.8);
}


.player-panel.retro-netflix .player-panel__timeend {

    position: absolute !important;

    right: 0 !important;

    bottom: 0 !important;

    margin: 0 !important;

    color: rgba(255,255,255,.9) !important;

    font-size: 16px !important;

    font-weight: 500 !important;

    text-shadow:
        0 2px 8px rgba(0,0,0,.8);
}


/* ---------------------------------------------------------
   BOTTOM CONTROL ROW
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__line-two {

    position: absolute !important;

    left: 3vw !important;
    right: 3vw !important;
    bottom: 3.5vh !important;

    height: 72px !important;

    margin: 0 !important;

    display: block !important;

    z-index: 50 !important;

    pointer-events: none !important;
}


/* ---------------------------------------------------------
   LEFT AREA
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__left {

    display: none !important;
}


/* ---------------------------------------------------------
   PLAY BUTTON
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__center {

    position: absolute !important;

    left: 0 !important;
    top: 50% !important;

    width: auto !important;

    transform: translateY(-50%) !important;

    display: block !important;

    z-index: 60 !important;
}


/* play */

.player-panel.retro-netflix
.player-panel__playpause {

    width: 62px !important;
    height: 62px !important;

    min-width: 62px !important;
    min-height: 62px !important;

    margin: 0 !important;
    padding: 0 !important;

    border-radius: 50% !important;

    display: flex !important;

    align-items: center !important;
    justify-content: center !important;

    background: #fff !important;

    color: #000 !important;

    pointer-events: auto !important;

    box-shadow:
        0 3px 18px rgba(0,0,0,.55) !important;

    transition:
        transform .16s ease,
        background .16s ease !important;
}


/* icon */

.player-panel.retro-netflix
.player-panel__playpause svg {

    width: 27px !important;
    height: 27px !important;

    fill: #000 !important;

    color: #000 !important;
}


/* focus */

.player-panel.retro-netflix
.player-panel__playpause.focus {

    transform: scale(1.12) !important;

    background: #fff !important;

    box-shadow:
        0 0 0 3px rgba(255,255,255,.35),
        0 5px 25px rgba(0,0,0,.65) !important;
}


/* ---------------------------------------------------------
   RIGHT AREA
   --------------------------------------------------------- */

.player-panel.retro-netflix .player-panel__right {

    position: absolute !important;

    left: 78px !important;
    right: 0 !important;
    top: 50% !important;

    width: auto !important;

    height: 62px !important;

    transform: translateY(-50%) !important;

    display: flex !important;

    align-items: center !important;

    justify-content: flex-start !important;

    pointer-events: none !important;
}


/* button groups become transparent */

.player-panel.retro-netflix
.player-panel__box-buttons {

    background: transparent !important;

    border-radius: 0 !important;

    display: flex !important;

    align-items: center !important;

    pointer-events: none !important;

    margin: 0 10px 0 0 !important;
}


/* ---------------------------------------------------------
   REWIND BUTTONS
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__rprev,
.player-panel.retro-netflix
.player-panel__rnext {

    width: 50px !important;
    height: 50px !important;

    min-width: 50px !important;
    min-height: 50px !important;

    margin: 0 4px !important;

    padding: 0 !important;

    border-radius: 50% !important;

    background: rgba(20,20,20,.78) !important;

    border:
        1px solid rgba(255,255,255,.18) !important;

    pointer-events: auto !important;

    display: flex !important;

    align-items: center !important;
    justify-content: center !important;

    transition:
        transform .15s ease,
        background .15s ease !important;
}


/* rewind focus */

.player-panel.retro-netflix
.player-panel__rprev.focus,
.player-panel.retro-netflix
.player-panel__rnext.focus {

    transform: scale(1.1) !important;

    background: #fff !important;

    color: #000 !important;
}


/* ---------------------------------------------------------
   AUDIO / SUBTITLE / TRANSLATION
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__tracks,
.player-panel.retro-netflix
.player-panel__subs,
.player-panel.retro-netflix
.player-panel__flow {

    height: 38px !important;

    min-width: 100px !important;

    padding:
        0 15px !important;

    margin:
        0 5px !important;

    border-radius: 22px !important;

    background:
        rgba(38,38,38,.88) !important;

    border:
        1px solid rgba(255,255,255,.2) !important;

    display: flex !important;

    align-items: center !important;
    justify-content: center !important;

    pointer-events: auto !important;

    color: #fff !important;

    font-size: 13px !important;

    font-weight: 600 !important;

    white-space: nowrap !important;
}


/* icons */

.player-panel.retro-netflix
.player-panel__tracks svg,
.player-panel.retro-netflix
.player-panel__subs svg,
.player-panel.retro-netflix
.player-panel__flow svg {

    width: 17px !important;
    height: 17px !important;

    margin-right: 7px !important;
}


/* text labels */

.player-panel.retro-netflix
.player-panel__tracks::after {

    content: "Аудио";
}

.player-panel.retro-netflix
.player-panel__subs::after {

    content: "Субтитры";
}

.player-panel.retro-netflix
.player-panel__flow::after {

    content: "Перевод";
}


/* focus */

.player-panel.retro-netflix
.player-panel__tracks.focus,
.player-panel.retro-netflix
.player-panel__subs.focus,
.player-panel.retro-netflix
.player-panel__flow.focus {

    background: #fff !important;

    color: #000 !important;

    transform: scale(1.06) !important;
}


/* ---------------------------------------------------------
   QUALITY
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__quality {

    display: none !important;
}


/* ---------------------------------------------------------
   SETTINGS
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__settings {

    width: 50px !important;
    height: 50px !important;

    min-width: 50px !important;
    min-height: 50px !important;

    margin-left: auto !important;

    border-radius: 50% !important;

    background:
        rgba(25,25,25,.82) !important;

    border:
        1px solid rgba(255,255,255,.18) !important;

    display: flex !important;

    align-items: center !important;
    justify-content: center !important;

    pointer-events: auto !important;
}


/* ---------------------------------------------------------
   FULLSCREEN
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__fullscreen {

    width: 50px !important;
    height: 50px !important;

    min-width: 50px !important;
    min-height: 50px !important;

    margin-left: 7px !important;

    border-radius: 50% !important;

    background:
        rgba(25,25,25,.82) !important;

    border:
        1px solid rgba(255,255,255,.18) !important;

    display: flex !important;

    align-items: center !important;
    justify-content: center !important;

    pointer-events: auto !important;
}


/* ---------------------------------------------------------
   FOCUS FOR ALL BUTTONS
   --------------------------------------------------------- */

.player-panel.retro-netflix
.selector.focus {

    box-shadow:
        0 0 0 3px rgba(255,255,255,.3),
        0 5px 20px rgba(0,0,0,.55) !important;
}


/* ---------------------------------------------------------
   HIDE OLD ELEMENTS
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__playlist,
.player-panel.retro-netflix
.player-panel__next,
.player-panel.retro-netflix
.player-panel__prev,
.player-panel.retro-netflix
.player-panel__pip,
.player-panel.retro-netflix
.player-panel__volume,
.player-panel.retro-netflix
.player-panel__mobile-visible,
.player-panel.retro-netflix
.player-panel__mobile-more {

    display: none !important;
}


/* ---------------------------------------------------------
   HIDE OLD APEX CONTENT
   --------------------------------------------------------- */

.player-panel.retro-netflix
.player-panel__apex-left-side,
.player-panel.retro-netflix
.player-panel__apex-right-side,
.player-panel.retro-netflix
.player-panel__apex-top-side,
.player-panel.retro-netflix
.player-panel__apex-bottom-side {

    display: none !important;
}


/* ---------------------------------------------------------
   TV / 10 FOOT SCALING
   --------------------------------------------------------- */

@media screen and (min-width: 1400px) {

    .player-panel.retro-netflix
    .player-panel__playpause {

        width: 68px !important;
        height: 68px !important;

        min-width: 68px !important;
        min-height: 68px !important;
    }

    .player-panel.retro-netflix
    .player-panel__rprev,
    .player-panel.retro-netflix
    .player-panel__rnext {

        width: 54px !important;
        height: 54px !important;

        min-width: 54px !important;
        min-height: 54px !important;
    }

    .retro-netflix-title {
        font-size: 30px;
    }

    .retro-netflix-meta {
        font-size: 17px;
    }

    .player-panel.retro-netflix
    .player-panel__timenow,
    .player-panel.retro-netflix
    .player-panel__timeend {

        font-size: 18px !important;
    }
}


/* ---------------------------------------------------------
   SMALL SCREENS
   --------------------------------------------------------- */

@media screen and (max-width: 800px) {

    .retro-netflix-title {
        right: 5vw;
        max-width: 55vw;
        font-size: 19px;
    }

    .retro-netflix-meta {
        right: 5vw;
        font-size: 12px;
    }

    .player-panel.retro-netflix
    .player-panel__timeline {

        left: 6vw !important;
        right: 6vw !important;
    }

    .player-panel.retro-netflix
    .player-panel__right {

        left: 75px !important;
    }

    .player-panel.retro-netflix
    .player-panel__tracks,
    .player-panel.retro-netflix
    .player-panel__subs,
    .player-panel.retro-netflix
    .player-panel__flow {

        min-width: 70px !important;

        padding: 0 9px !important;

        font-size: 11px !important;
    }
}

`;

        document.head.appendChild(style);
    }


    function getTitle(data) {

        if (!data) return '';

        return (
            data.title ||
            data.name ||
            data.original_title ||
            ''
        );
    }


    function getMeta(data) {

        if (!data) return '';

        var result = [];

        if (data.season) {
            result.push('Сезон ' + data.season);
        }

        if (data.episode) {
            result.push('Серия ' + data.episode);
        }

        if (data.year) {
            result.push(String(data.year));
        }

        return result.join(' • ');
    }


    function mount(data) {

        var panel = $('.player-panel');

        if (!panel.length) {
            setTimeout(function () {
                mount(data);
            }, 100);

            return;
        }

        panel.addClass('retro-netflix');

        var body = panel.find('.player-panel__body');

        if (!body.length) return;


        /* title */

        var title = body.find('.retro-netflix-title');

        if (!title.length) {

            title = $(
                '<div class="retro-netflix-title"></div>'
            );

            body.append(title);
        }


        title.text(getTitle(data));


        /* metadata */

        var meta = body.find('.retro-netflix-meta');

        if (!meta.length) {

            meta = $(
                '<div class="retro-netflix-meta"></div>'
            );

            body.append(meta);
        }

        var metadata = getMeta(data);

        meta.text(metadata);

        if (!metadata) {
            meta.hide();
        }
        else {
            meta.show();
        }
    }


    function destroy() {

        $('.player-panel')
            .removeClass('retro-netflix');

        $('.retro-netflix-title').remove();
        $('.retro-netflix-meta').remove();
    }


    function start() {

        css();

        if (
            typeof Lampa === 'undefined' ||
            !Lampa.Player ||
            !Lampa.Player.listener
        ) {
            setTimeout(start, 500);
            return;
        }


        Lampa.Player.listener.follow(
            'start',
            function (data) {

                setTimeout(function () {
                    mount(data);
                }, 50);

            }
        );


        Lampa.Player.listener.follow(
            'destroy',
            function () {
                destroy();
            }
        );


        /*
         * If a player is already open when the plugin loads.
         */

        if (Lampa.Player.opened()) {

            setTimeout(function () {

                mount(
                    Lampa.Player.playdata ?
                    Lampa.Player.playdata() :
                    {}
                );

            }, 200);
        }
    }


    if (typeof Lampa === 'undefined') {

        var timer = setInterval(function () {

            if (typeof Lampa !== 'undefined') {

                clearInterval(timer);

                start();
            }

        }, 300);

    }
    else {

        start();

    }

})();

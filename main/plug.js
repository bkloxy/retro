(function () {
    'use strict';

    if (window.retroNetflixPlayer) return;
    window.retroNetflixPlayer = true;

    var STYLE_ID = 'retro-netflix-player-style';

    function installStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
/* =========================================================
   RETRO — NETFLIX PLAYER
   Native Lampa player UI skin
   ========================================================= */

.player-panel {
    background: transparent !important;
    pointer-events: none !important;
}

/* ---------------------------------------------------------
   Bottom cinematic gradient
   --------------------------------------------------------- */

.player-panel:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 38vh;
    pointer-events: none;

    background:
        linear-gradient(
            to top,
            rgba(0,0,0,.94) 0%,
            rgba(0,0,0,.72) 24%,
            rgba(0,0,0,.32) 58%,
            rgba(0,0,0,0) 100%
        );

    z-index: 0;
}

/* ---------------------------------------------------------
   Top gradient
   --------------------------------------------------------- */

.player-panel:before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 22vh;
    pointer-events: none;

    background:
        linear-gradient(
            to bottom,
            rgba(0,0,0,.72),
            rgba(0,0,0,0)
        );

    z-index: 0;
}

/* ---------------------------------------------------------
   Timeline
   --------------------------------------------------------- */

.player-panel__timeline {
    position: absolute !important;

    left: 4vw !important;
    right: 4vw !important;
    bottom: 10.5vh !important;

    width: auto !important;
    height: 5px !important;

    background: rgba(255,255,255,.30) !important;

    border-radius: 10px !important;

    z-index: 10 !important;

    pointer-events: auto !important;
}

.player-panel__peding {
    height: 100% !important;
    background: rgba(255,255,255,.45) !important;
    border-radius: 10px !important;
}

.player-panel__position {
    height: 100% !important;

    background: #e50914 !important;

    border-radius: 10px !important;
}

/* Netflix-style progress knob */

.player-panel__position:after {
    content: "";

    position: absolute;

    right: -7px;
    top: 50%;

    width: 14px;
    height: 14px;

    transform: translateY(-50%);

    background: #fff;

    border-radius: 50%;

    box-shadow:
        0 1px 5px rgba(0,0,0,.5);

    opacity: 0;

    transition: opacity .15s ease;
}

.player-panel.panel--visible
.player-panel__position:after {
    opacity: 1;
}

/* ---------------------------------------------------------
   Time
   --------------------------------------------------------- */

.player-panel__timenow {
    position: absolute !important;

    left: 4vw !important;
    bottom: 7.3vh !important;

    font-size: 18px !important;
    font-weight: 500 !important;

    color: #fff !important;

    z-index: 10 !important;
}

.player-panel__timeend {
    position: absolute !important;

    right: 4vw !important;
    bottom: 7.3vh !important;

    font-size: 18px !important;
    font-weight: 500 !important;

    color: rgba(255,255,255,.9) !important;

    z-index: 10 !important;
}

/* ---------------------------------------------------------
   Buttons container
   --------------------------------------------------------- */

.player-panel__center,
.player-panel__left,
.player-panel__right {
    z-index: 20 !important;
}

/* ---------------------------------------------------------
   Main buttons
   --------------------------------------------------------- */

.player-panel .selector {
    pointer-events: auto !important;

    transition:
        transform .16s ease,
        background .16s ease,
        opacity .16s ease;
}

/* Round Netflix controls */

.player-panel__playpause,
.player-panel__rprev,
.player-panel__rnext,
.player-panel__settings,
.player-panel__fullscreen {
    width: 58px !important;
    height: 58px !important;

    min-width: 58px !important;
    min-height: 58px !important;

    margin: 0 7px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    border-radius: 50% !important;

    background: rgba(30,30,30,.82) !important;

    border: 1px solid rgba(255,255,255,.18) !important;

    box-shadow:
        0 5px 20px rgba(0,0,0,.4) !important;
}

/* ---------------------------------------------------------
   Focus
   --------------------------------------------------------- */

.player-panel .selector.focus {
    background: #fff !important;

    color: #000 !important;

    border-color: #fff !important;

    transform: scale(1.14) !important;

    box-shadow:
        0 0 0 3px rgba(255,255,255,.28),
        0 8px 30px rgba(0,0,0,.55) !important;
}

/* SVG follows focus */

.player-panel .selector.focus svg {
    fill: #000 !important;
    color: #000 !important;
}

/* ---------------------------------------------------------
   Play button — larger
   --------------------------------------------------------- */

.player-panel__playpause {
    width: 72px !important;
    height: 72px !important;

    min-width: 72px !important;
    min-height: 72px !important;

    background: #fff !important;

    color: #000 !important;

    border-color: #fff !important;

    transform: scale(1.03);
}

.player-panel__playpause svg {
    fill: #000 !important;
    color: #000 !important;
}

.player-panel__playpause.focus {
    transform: scale(1.15) !important;
}

/* ---------------------------------------------------------
   Filename / title
   --------------------------------------------------------- */

.player-panel__filename {
    position: absolute !important;

    left: 4vw !important;
    top: 6vh !important;

    max-width: 65vw !important;

    color: #fff !important;

    font-size: 28px !important;
    font-weight: 600 !important;

    text-shadow:
        0 2px 10px rgba(0,0,0,.7) !important;

    z-index: 10 !important;
}

/* ---------------------------------------------------------
   Hide old controls we don't need in first version
   --------------------------------------------------------- */

.player-panel__volume,
.player-panel__pip,
.player-panel__playlist,
.player-panel__playlist-buttons,
.player-panel__next,
.player-panel__prev,
.player-panel__tstart,
.player-panel__tend {
    display: none !important;
}

/* ---------------------------------------------------------
   Settings / fullscreen
   --------------------------------------------------------- */

.player-panel__settings,
.player-panel__fullscreen {
    opacity: .92;
}

/* ---------------------------------------------------------
   Hide old decorative pieces
   --------------------------------------------------------- */

.player-panel__time,
.player-panel__episode,
.player-panel__quality,
.player-panel__tracks,
.player-panel__subs,
.player-panel__flow {
    display: none !important;
}

/* ---------------------------------------------------------
   Touch rewind area
   --------------------------------------------------------- */

.player-panel__time-touch-zone {
    pointer-events: auto !important;
}

/* ---------------------------------------------------------
   When player is hidden
   --------------------------------------------------------- */

.player-panel:not(.panel--visible) {
    opacity: 0 !important;
    pointer-events: none !important;
}

.player-panel.panel--visible {
    opacity: 1 !important;
}

/* ---------------------------------------------------------
   Smooth appearance
   --------------------------------------------------------- */

.player-panel {
    transition: opacity .18s ease !important;
}

/* ---------------------------------------------------------
   TV scaling
   --------------------------------------------------------- */

@media screen and (min-width: 1600px) {

    .player-panel__playpause,
    .player-panel__rprev,
    .player-panel__rnext,
    .player-panel__settings,
    .player-panel__fullscreen {
        width: 64px !important;
        height: 64px !important;
        min-width: 64px !important;
        min-height: 64px !important;
    }

    .player-panel__playpause {
        width: 78px !important;
        height: 78px !important;
        min-width: 78px !important;
        min-height: 78px !important;
    }

    .player-panel__filename {
        font-size: 32px !important;
    }

    .player-panel__timenow,
    .player-panel__timeend {
        font-size: 20px !important;
    }
}
`;

        document.head.appendChild(style);
    }

    function start() {
        installStyle();

        console.log(
            '[RETRO] Netflix native player skin enabled'
        );
    }

    function bootstrap() {
        if (typeof Lampa === 'undefined') {
            setTimeout(bootstrap, 200);
            return;
        }

        if (window.appready) {
            start();
        }
        else if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') start();
            });

            setTimeout(function () {
                if (window.appready) start();
            }, 1000);
        }
        else {
            start();
        }
    }

    bootstrap();

})();

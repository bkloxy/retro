(function () {
    'use strict';

    if (window.lampa_retro_player_ready) return;
    window.lampa_retro_player_ready = true;

    var player = {
        root: null,
        timer: null,
        dragging: false,
        duration: 0,
        current: 0
    };

    function time(sec) {
        sec = Math.max(0, Math.floor(sec || 0));

        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;

        if (h) {
            return h + ':' +
                (m < 10 ? '0' : '') + m + ':' +
                (s < 10 ? '0' : '') + s;
        }

        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function video() {
        try {
            return Lampa.PlayerVideo.video();
        } catch (e) {
            return null;
        }
    }

    function create() {

        if ($('#lampa-retro-player').length) {
            player.root = $('#lampa-retro-player');
            return;
        }

        var html = `
        <div id="lampa-retro-player">

            <div class="retro-top">

                <div class="retro-title">
                    Воспроизведение
                </div>

                <div class="retro-close selector" tabindex="0">
                    <svg viewBox="0 0 24 24">
                        <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/>
                    </svg>
                </div>

            </div>

            <div class="retro-center">

                <div class="retro-big-play selector" tabindex="0">
                    <svg class="retro-big-play-icon" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>

                    <svg class="retro-big-pause-icon" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </div>

            </div>

            <div class="retro-bottom">

                <div class="retro-progress-line">

                    <div class="retro-current">
                        0:00
                    </div>

                    <div class="retro-progress selector">

                        <div class="retro-progress-bg"></div>
                        <div class="retro-progress-played"></div>
                        <div class="retro-progress-thumb"></div>

                    </div>

                    <div class="retro-left">
                        -0:00
                    </div>

                </div>

                <div class="retro-controls">

                    <div class="retro-button retro-back selector" tabindex="0">

                        <svg viewBox="0 0 24 24">
                            <path d="M11 7v4l-5-5 5-5v4c4.42 0 8 3.58 8 8s-3.58 8-8 8c-3.53 0-6.53-2.29-7.59-5.5l1.9-.63C6.05 17.62 8.31 19 11 19c3.31 0 6-2.69 6-6s-2.69-6-6-6z"/>
                        </svg>

                        <span>10</span>

                    </div>

                    <div class="retro-play selector" tabindex="0">

                        <svg class="retro-play-icon" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>

                        <svg class="retro-pause-icon" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>

                    </div>

                    <div class="retro-button retro-forward selector" tabindex="0">

                        <svg viewBox="0 0 24 24">
                            <path d="M13 7v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.53 0 6.53-2.29 7.59-5.5l-1.9-.63C17.95 17.62 15.69 19 13 19c-3.31 0-6-2.69-6-6s2.69-6 6-6z"/>
                        </svg>

                        <span>10</span>

                    </div>

                    <div class="retro-space"></div>

                    <div class="retro-option retro-source selector" tabindex="0">
                        Источник
                    </div>

                    <div class="retro-option retro-size selector" tabindex="0">
                        Размер
                    </div>

                </div>

            </div>

            <div class="retro-skip"></div>

        </div>
        `;

        $('body').append(html);

        player.root = $('#lampa-retro-player');

        var css = `
        #lampa-retro-player {
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;

            z-index: 999999;

            color: #fff;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Roboto,
                sans-serif;

            pointer-events: none;

            opacity: 0;

            transition: opacity .25s ease;
        }

        #lampa-retro-player.visible {
            opacity: 1;
        }

        #lampa-retro-player .retro-top,
        #lampa-retro-player .retro-center,
        #lampa-retro-player .retro-bottom,
        #lampa-retro-player .retro-skip {
            pointer-events: none;
        }

        #lampa-retro-player .selector {
            pointer-events: auto;
        }

        .retro-top {
            position: absolute;

            left: 0;
            right: 0;
            top: 0;

            padding: 28px 40px 80px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            background:
                linear-gradient(
                    to bottom,
                    rgba(0,0,0,.75),
                    rgba(0,0,0,.35),
                    transparent
                );
        }

        .retro-title {
            font-size: 25px;
            font-weight: 600;

            max-width: 75%;

            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;

            text-shadow:
                0 2px 10px rgba(0,0,0,.9);
        }

        .retro-close {
            width: 48px;
            height: 48px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: rgba(0,0,0,.45);

            cursor: pointer;
        }

        .retro-close svg {
            width: 26px;
            height: 26px;

            fill: #fff;
        }

        .retro-center {
            position: absolute;

            left: 50%;
            top: 50%;

            transform: translate(-50%, -50%);
        }

        .retro-big-play {
            width: 82px;
            height: 82px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: rgba(0,0,0,.45);

            border: 2px solid rgba(255,255,255,.9);

            cursor: pointer;
        }

        .retro-big-play svg {
            width: 35px;
            height: 35px;

            fill: #fff;
        }

        .retro-big-play-icon {
            display: block;
        }

        .retro-big-pause-icon {
            display: none;
        }

        .retro-bottom {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 0;

            padding:
                0 40px 32px;

            background:
                linear-gradient(
                    to top,
                    rgba(0,0,0,.9),
                    rgba(0,0,0,.55),
                    transparent
                );
        }

        .retro-progress-line {
            display: flex;

            align-items: center;

            gap: 15px;

            margin-bottom: 20px;
        }

        .retro-current,
        .retro-left {
            min-width: 55px;

            text-align: center;

            font-size: 16px;

            font-weight: 500;
        }

        .retro-progress {
            position: relative;

            flex: 1;

            height: 7px;

            cursor: pointer;
        }

        .retro-progress-bg {
            position: absolute;

            left: 0;
            right: 0;
            top: 0;
            bottom: 0;

            border-radius: 10px;

            background: rgba(255,255,255,.3);
        }

        .retro-progress-played {
            position: absolute;

            left: 0;
            top: 0;
            bottom: 0;

            width: 0%;

            border-radius: 10px;

            background: #e50914;
        }

        .retro-progress-thumb {
            position: absolute;

            left: 0%;

            top: 50%;

            width: 15px;
            height: 15px;

            border-radius: 50%;

            background: #fff;

            transform:
                translate(-50%, -50%);

            box-shadow:
                0 1px 8px rgba(0,0,0,.8);
        }

        .retro-controls {
            display: flex;

            align-items: center;

            gap: 15px;
        }

        .retro-button {
            position: relative;

            width: 52px;
            height: 52px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background:
                rgba(255,255,255,.13);

            cursor: pointer;
        }

        .retro-button svg {
            width: 28px;
            height: 28px;

            fill: #fff;
        }

        .retro-button span {
            position: absolute;

            bottom: 7px;
            right: 7px;

            font-size: 9px;

            font-weight: 700;
        }

        .retro-play {
            width: 60px;
            height: 60px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #fff;

            cursor: pointer;
        }

        .retro-play svg {
            width: 28px;
            height: 28px;

            fill: #000;
        }

        .retro-pause-icon {
            display: none;
        }

        .retro-space {
            flex: 1;
        }

        .retro-option {
            height: 42px;

            padding: 0 17px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 22px;

            background:
                rgba(255,255,255,.13);

            font-size: 15px;

            cursor: pointer;
        }

        .retro-skip {
            position: absolute;

            left: 50%;
            top: 50%;

            transform:
                translate(-50%, -50%);

            width: 130px;
            height: 130px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background:
                rgba(0,0,0,.65);

            font-size: 25px;
            font-weight: 600;

            opacity: 0;

            transition:
                opacity .2s,
                transform .2s;
        }

        .retro-skip.show {
            opacity: 1;

            transform:
                translate(-50%, -50%)
                scale(1);
        }

        #lampa-retro-player.hidden-ui .retro-top,
        #lampa-retro-player.hidden-ui .retro-center,
        #lampa-retro-player.hidden-ui .retro-bottom {
            opacity: 0;

            transition: opacity .25s;
        }

        #lampa-retro-player .retro-close:hover,
        #lampa-retro-player .retro-button:hover,
        #lampa-retro-player .retro-option:hover {
            background:
                rgba(255,255,255,.25);
        }

        `;

        $('head').append(
            '<style id="lampa-retro-player-style">' +
            css +
            '</style>'
        );
    }

    function show() {

        if (!player.root) return;

        player.root
            .addClass('visible')
            .removeClass('hidden-ui');

        clearTimeout(player.timer);

        player.timer = setTimeout(function () {
            hide();
        }, 3500);
    }

    function hide() {

        if (player.dragging) return;

        if (!player.root) return;

        player.root.addClass('hidden-ui');
    }

    function update() {

        var v = video();

        if (!v || !player.root) return;

        player.current = v.currentTime || 0;
        player.duration = v.duration || 0;

        if (!player.duration || !isFinite(player.duration)) return;

        var percent =
            (player.current / player.duration) * 100;

        percent = Math.max(
            0,
            Math.min(100, percent)
        );

        player.root
            .find('.retro-progress-played')
            .css('width', percent + '%');

        player.root
            .find('.retro-progress-thumb')
            .css('left', percent + '%');

        player.root
            .find('.retro-current')
            .text(time(player.current));

        player.root
            .find('.retro-left')
            .text(
                '-' + time(
                    Math.max(
                        0,
                        player.duration - player.current
                    )
                )
            );
    }

    function setPlaying(state) {

        if (!player.root) return;

        if (state) {

            player.root
                .find('.retro-play-icon')
                .hide();

            player.root
                .find('.retro-pause-icon')
                .show();

            player.root
                .find('.retro-big-play-icon')
                .hide();

            player.root
                .find('.retro-big-pause-icon')
                .show();

        } else {

            player.root
                .find('.retro-play-icon')
                .show();

            player.root
                .find('.retro-pause-icon')
                .hide();

            player.root
                .find('.retro-big-play-icon')
                .show();

            player.root
                .find('.retro-big-pause-icon')
                .hide();
        }
    }

    function togglePlay() {

        var v = video();

        if (!v) return;

        if (v.paused) {
            v.play();
        } else {
            v.pause();
        }

        show();
    }

    function skip(seconds) {

        var v = video();

        if (!v) return;

        var duration = v.duration || 999999;

        v.currentTime =
            Math.max(
                0,
                Math.min(
                    duration,
                    v.currentTime + seconds
                )
            );

        var indicator =
            player.root.find('.retro-skip');

        indicator
            .text(
                seconds > 0
                    ? '+10 секунд'
                    : '-10 секунд'
            )
            .addClass('show');

        clearTimeout(window.retroSkipTimer);

        window.retroSkipTimer =
            setTimeout(function () {

                indicator.removeClass('show');

            }, 700);

        show();
    }

    function seek(percent) {

        var v = video();

        if (!v || !v.duration) return;

        v.currentTime =
            (percent / 100) * v.duration;

        update();
    }

    function bind() {

        var root = player.root;

        root.on(
            'click',
            '.retro-play, .retro-big-play',
            togglePlay
        );

        root.on(
            'click',
            '.retro-back',
            function () {
                skip(-10);
            }
        );

        root.on(
            'click',
            '.retro-forward',
            function () {
                skip(10);
            }
        );

        root.on(
            'click',
            '.retro-close',
            function () {

                try {
                    Lampa.Player.close();
                } catch (e) {}

            }
        );

        root.on(
            'click',
            '.retro-source',
            function () {

                try {

                    $('.player-panel__source')
                        .trigger('click');

                } catch (e) {}

                show();
            }
        );

        root.on(
            'click',
            '.retro-size',
            function () {

                try {

                    $('.player-panel__size')
                        .trigger('click');

                } catch (e) {}

                show();
            }
        );

        var progress =
            root.find('.retro-progress');

        progress.on(
            'mousedown touchstart',
            function () {

                player.dragging = true;

                show();
            }
        );

        $(document).on(
            'mousemove.retroplayer touchmove.retroplayer',
            function (e) {

                if (!player.dragging) return;

                var rect =
                    progress[0]
                        .getBoundingClientRect();

                var original =
                    e.originalEvent;

                var x;

                if (
                    original &&
                    original.touches &&
                    original.touches.length
                ) {
                    x =
                        original.touches[0].clientX;
                } else {
                    x = e.clientX;
                }

                var percent =
                    ((x - rect.left) / rect.width) * 100;

                percent =
                    Math.max(
                        0,
                        Math.min(100, percent)
                    );

                seek(percent);
            }
        );

        $(document).on(
            'mouseup.retroplayer touchend.retroplayer',
            function () {

                if (!player.dragging) return;

                player.dragging = false;

                show();
            }
        );

        progress.on(
            'click',
            function (e) {

                var rect =
                    this.getBoundingClientRect();

                var percent =
                    ((e.clientX - rect.left) /
                    rect.width) * 100;

                seek(percent);

                show();
            }
        );

        root.on(
            'mousemove touchstart click',
            function () {
                show();
            }
        );

        $(window).on(
            'keydown.retroplayer',
            function (e) {

                if (!Lampa.Player.opened) return;

                if (e.keyCode === 37) {
                    e.preventDefault();
                    skip(-10);
                    return;
                }

                if (e.keyCode === 39) {
                    e.preventDefault();
                    skip(10);
                    return;
                }

                if (
                    e.keyCode === 32 ||
                    e.keyCode === 13
                ) {
                    e.preventDefault();
                    togglePlay();
                    return;
                }

                if (e.keyCode === 27) {

                    e.preventDefault();

                    try {
                        Lampa.Player.close();
                    } catch (err) {}

                }

                show();
            }
        );
    }

    function start() {

        create();
        bind();

        Lampa.Listener.follow(
            'player',
            function (e) {

                if (e.type === 'start') {

                    var title =
                        (e.data && e.data.title) ||
                        (
                            e.object &&
                            e.object.movie &&
                            (
                                e.object.movie.title ||
                                e.object.movie.name
                            )
                        ) ||
                        'Воспроизведение';

                    player.root
                        .find('.retro-title')
                        .text(title);

                    player.root
                        .addClass('visible')
                        .removeClass('hidden-ui');

                    show();

                    setTimeout(function () {

                        var v = video();

                        if (v) {
                            setPlaying(!v.paused);
                            update();
                        }

                    }, 100);
                }

                if (
                    e.type === 'destroy' ||
                    e.type === 'close'
                ) {

                    player.root
                        .removeClass('visible');

                    clearTimeout(player.timer);
                }
            }
        );

        Lampa.PlayerVideo.listener.follow(
            'timeupdate',
            function () {
                update();
            }
        );

        Lampa.PlayerVideo.listener.follow(
            'play',
            function () {
                setPlaying(true);
            }
        );

        Lampa.PlayerVideo.listener.follow(
            'pause',
            function () {
                setPlaying(false);
                show();
            }
        );

        Lampa.PlayerVideo.listener.follow(
            'ended',
            function () {
                setPlaying(false);
                show();
            }
        );
    }

    Lampa.Listener.follow(
        'app',
        function (e) {

            if (e.type === 'ready') {

                setTimeout(
                    start,
                    500
                );

            }

        }
    );

})();
    

(function () {
    'use strict';

    if (window.retro_player_plugin_ready) return;
    window.retro_player_plugin_ready = true;

    var STORAGE_KEY = 'retro_player_mode';
    var COMPONENT = 'retro_player_settings';
    var originalPlay = null;
    var root = null;
    var video = null;
    var hideTimer = null;
    var hls = null;

    function getMode() {
        try {
            return Lampa.Storage.get(STORAGE_KEY, 'standard') || 'standard';
        } catch (e) {
            return 'standard';
        }
    }

    function addSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: COMPONENT,
            name: 'Новый плеер',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: {
                name: STORAGE_KEY,
                type: 'select',
                values: {
                    standard: 'Стандартный',
                    retro: 'Lampa Retro'
                },
                default: 'standard'
            },
            field: {
                name: 'Плеер',
                description: 'Выберите плеер. После изменения перезапустите Lampa.'
            },
            onChange: function () {
                try {
                    if (Lampa.Noty) {
                        Lampa.Noty.show('Настройка сохранена. Перезапустите Lampa.');
                    }
                } catch (e) {}
            }
        });
    }

    function ensureStyle() {
        if ($('#retro-player-style').length) return;

        var css = `
#retro-player-root {
    position: fixed;
    inset: 0;
    z-index: 9999999;
    background: #000;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    display: none;
    overflow: hidden;
}

#retro-player-root.retro-open {
    display: block;
}

#retro-player-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
}

.retro-gradient-top,
.retro-gradient-bottom {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
    transition: opacity .25s;
}

.retro-gradient-top {
    top: 0;
    height: 30%;
    background: linear-gradient(to bottom, rgba(0,0,0,.78), transparent);
}

.retro-gradient-bottom {
    bottom: 0;
    height: 42%;
    background: linear-gradient(to top, rgba(0,0,0,.9), transparent);
}

.retro-ui {
    position: absolute;
    inset: 0;
    transition: opacity .25s;
}

.retro-ui.retro-hidden {
    opacity: 0;
    pointer-events: none;
}

.retro-top {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    padding: 28px 42px;
    display: flex;
    align-items: center;
    gap: 22px;
}

.retro-back {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,.13);
    font-size: 29px;
}

.retro-title {
    font-size: 25px;
    font-weight: 600;
    max-width: 75%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 8px #000;
}

.retro-center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.retro-main-play {
    width: 78px;
    height: 78px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,.9);
    background: rgba(0,0,0,.48);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34px;
    padding-left: 4px;
}

.retro-bottom {
    position: absolute;
    left: 42px;
    right: 42px;
    bottom: 30px;
}

.retro-times {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    margin-bottom: 9px;
    text-shadow: 0 1px 4px #000;
}

.retro-progress {
    position: relative;
    height: 5px;
    border-radius: 8px;
    background: rgba(255,255,255,.35);
    margin-bottom: 20px;
}

.retro-played {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: #e50914;
    border-radius: 8px;
}

.retro-thumb {
    position: absolute;
    top: 50%;
    left: 0;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #fff;
    transform: translate(-50%, -50%);
    box-shadow: 0 1px 5px #000;
}

.retro-controls {
    display: flex;
    align-items: center;
    gap: 14px;
}

.retro-btn {
    min-width: 48px;
    height: 46px;
    padding: 0 17px;
    border-radius: 24px;
    border: 0;
    background: rgba(255,255,255,.13);
    color: #fff;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.retro-play-small {
    width: 52px;
    min-width: 52px;
    height: 52px;
    border-radius: 50%;
    padding: 0;
    background: #fff;
    color: #111;
    font-size: 23px;
}

.retro-spacer {
    flex: 1;
}

.retro-info {
    position: absolute;
    left: 50%;
    bottom: 128px;
    transform: translateX(-50%);
    padding: 10px 18px;
    border-radius: 8px;
    background: rgba(0,0,0,.7);
    font-size: 18px;
    opacity: 0;
    transition: opacity .2s;
}

.retro-info.show {
    opacity: 1;
}

@media(max-width:700px) {
    .retro-top {
        padding: 18px 20px;
    }

    .retro-bottom {
        left: 20px;
        right: 20px;
        bottom: 18px;
    }

    .retro-title {
        font-size: 18px;
    }
}
`;

        $('head').append(
            '<style id="retro-player-style">' + css + '</style>'
        );
    }

    function createUI() {
        if ($('#retro-player-root').length) return;

        var html = `
<div id="retro-player-root">

    <video id="retro-player-video" playsinline></video>

    <div class="retro-gradient-top"></div>
    <div class="retro-gradient-bottom"></div>

    <div class="retro-ui">

        <div class="retro-top">
            <div class="retro-back selector" tabindex="0">‹</div>
            <div class="retro-title">Lampa Retro</div>
        </div>

        <div class="retro-center">
            <div class="retro-main-play selector" tabindex="0">▶</div>
        </div>

        <div class="retro-info"></div>

        <div class="retro-bottom">

            <div class="retro-times">
                <span class="retro-current">0:00</span>
                <span class="retro-left">-0:00</span>
            </div>

            <div class="retro-progress selector" tabindex="0">
                <div class="retro-played"></div>
                <div class="retro-thumb"></div>
            </div>

            <div class="retro-controls">

                <div class="retro-btn retro-skip-back selector" tabindex="0">
                    ↶ 10
                </div>

                <div class="retro-btn retro-play-small selector" tabindex="0">
                    ▶
                </div>

                <div class="retro-btn retro-skip-forward selector" tabindex="0">
                    10 ↷
                </div>

                <div class="retro-spacer"></div>

                <div class="retro-btn retro-source selector" tabindex="0">
                    Источник
                </div>

                <div class="retro-btn retro-quality selector" tabindex="0">
                    Размер
                </div>

            </div>

        </div>

    </div>

</div>`;

        $('body').append(html);

        root = $('#retro-player-root');
        video = document.getElementById('retro-player-video');

        root.on('click', '.retro-main-play,.retro-play-small', togglePlay);

        root.on('click', '.retro-skip-back', function () {
            seek(-10);
        });

        root.on('click', '.retro-skip-forward', function () {
            seek(10);
        });

        root.on('click', '.retro-back', close);

        root.on('click', '.retro-source', function () {
            notify('Выбор источника будет добавлен следующим этапом');
        });

        root.on('click', '.retro-quality', function () {
            notify('Выбор качества будет добавлен следующим этапом');
        });

        root.on('click', '.retro-progress', function (e) {

            var rect = this.getBoundingClientRect();

            var p = Math.max(
                0,
                Math.min(
                    1,
                    (e.clientX - rect.left) / rect.width
                )
            );

            if (video && isFinite(video.duration)) {
                video.currentTime = p * video.duration;
            }

            showUI();
        });

        video.addEventListener('timeupdate', update);
        video.addEventListener('durationchange', update);
        video.addEventListener('play', updateButtons);
        video.addEventListener('pause', updateButtons);

        video.addEventListener('ended', function () {
            updateButtons();
            showUI();
        });

        $(window).on('keydown.retroplayer', keydown);

        root.on(
            'mousemove touchstart click',
            showUI
        );
    }

    function format(sec) {

        sec = Math.max(
            0,
            Math.floor(sec || 0)
        );

        var h = Math.floor(sec / 3600);

        var m = Math.floor(
            (sec % 3600) / 60
        );

        var s = sec % 60;

        if (h) {
            return h + ':' +
                String(m).padStart(2, '0') +
                ':' +
                String(s).padStart(2, '0');
        }

        return m + ':' +
            String(s).padStart(2, '0');
    }

    function update() {

        if (!video || !root) return;

        var duration =
            isFinite(video.duration)
                ? video.duration
                : 0;

        var current =
            video.currentTime || 0;

        var p =
            duration
                ? current / duration
                : 0;

        root.find('.retro-played')
            .css('width', (p * 100) + '%');

        root.find('.retro-thumb')
            .css('left', (p * 100) + '%');

        root.find('.retro-current')
            .text(format(current));

        root.find('.retro-left')
            .text(
                '-' +
                format(
                    Math.max(
                        0,
                        duration - current
                    )
                )
            );
    }

    function updateButtons() {

        if (!root || !video) return;

        root.find('.retro-play-small')
            .text(
                video.paused
                    ? '▶'
                    : '❚❚'
            );

        root.find('.retro-main-play')
            .text(
                video.paused
                    ? '▶'
                    : '❚❚'
            );

        if (!video.paused) {
            root.find('.retro-main-play').hide();
        } else {
            root.find('.retro-main-play').show();
        }
    }

    function showUI() {

        if (!root) return;

        root.find('.retro-ui')
            .removeClass('retro-hidden');

        clearTimeout(hideTimer);

        if (video && !video.paused) {

            hideTimer = setTimeout(
                function () {

                    root.find('.retro-ui')
                        .addClass('retro-hidden');

                },
                3500
            );
        }
    }

    function notify(text) {

        root.find('.retro-info')
            .text(text)
            .addClass('show');

        setTimeout(
            function () {
                root.find('.retro-info')
                    .removeClass('show');
            },
            1800
        );

        showUI();
    }

    function seek(sec) {

        if (!video) return;

        video.currentTime =
            Math.max(
                0,
                Math.min(
                    video.duration || Infinity,
                    video.currentTime + sec
                )
            );

        notify(
            sec > 0
                ? '10 секунд вперёд'
                : '10 секунд назад'
        );
    }

    function togglePlay() {

        if (!video) return;

        if (video.paused) {

            video.play().catch(
                function () {}
            );

        } else {

            video.pause();

        }

        showUI();
    }

    function keydown(e) {

        if (
            !root ||
            !root.hasClass('retro-open')
        ) return;

        if (e.keyCode === 37) {

            e.preventDefault();
            seek(-10);

        } else if (e.keyCode === 39) {

            e.preventDefault();
            seek(10);

        } else if (
            e.keyCode === 32 ||
            e.keyCode === 13
        ) {

            e.preventDefault();
            togglePlay();

        } else if (
            e.keyCode === 27 ||
            e.keyCode === 461 ||
            e.keyCode === 10009
        ) {

            e.preventDefault();
            close();

        } else {

            showUI();
        }
    }

    function close() {

        if (!root) return;

        try {
            video.pause();
        } catch (e) {}

        root.removeClass('retro-open');

        clearTimeout(hideTimer);

        if (video) {

            video.removeAttribute('src');

            try {
                video.load();
            } catch (e) {}
        }

        try {
            Lampa.Controller.toggle('content');
        } catch (e) {}
    }

    function getUrl(params) {

        if (!params) return '';

        if (typeof params === 'string') {
            return params;
        }

        return params.url ||
            params.src ||
            '';
    }

    function getTitle(params) {

        if (
            !params ||
            typeof params === 'string'
        ) {
            return 'Воспроизведение';
        }

        return params.title ||
            params.name ||
            (
                params.movie &&
                (
                    params.movie.title ||
                    params.movie.name
                )
            ) ||
            'Воспроизведение';
    }

    function loadStream(params) {

        var url = getUrl(params);

        if (!url) {

            notify(
                'Не получен URL видео'
            );

            return;
        }

        root.find('.retro-title')
            .text(
                getTitle(params)
            );

        video.pause();

        video.removeAttribute('src');

        try {
            video.load();
        } catch (e) {}

        video.src = url;

        video.load();

        video.play().catch(
            function () {}
        );

        root.addClass('retro-open');

        updateButtons();
        showUI();
    }

    function installPlayerHook() {

        if (
            !Lampa.Player ||
            !Lampa.Player.play ||
            Lampa.Player.play.__retroWrapped
        ) {
            return;
        }

        originalPlay = Lampa.Player.play;

        function retroPlay() {

            if (
                getMode() !== 'retro'
            ) {
                return originalPlay.apply(
                    Lampa.Player,
                    arguments
                );
            }

            var params = arguments[0];

            if (!getUrl(params)) {

                return originalPlay.apply(
                    Lampa.Player,
                    arguments
                );
            }

            createUI();

            loadStream(params);

            return true;
        }

        retroPlay.__retroWrapped = true;
        retroPlay.__retroOriginal = originalPlay;

        Lampa.Player.play = retroPlay;
    }

    function bootstrap() {

        if (
            typeof Lampa === 'undefined'
        ) {
            setTimeout(
                bootstrap,
                200
            );

            return;
        }

        ensureStyle();
        addSettings();
        createUI();
        installPlayerHook();

        Lampa.Listener.follow(
            'app',
            function (e) {

                if (e.type === 'ready') {

                    ensureStyle();
                    createUI();
                    installPlayerHook();
                }
            }
        );

        setInterval(
            function () {

                if (
                    !originalPlay &&
                    Lampa.Player
                ) {
                    installPlayerHook();
                }

            },
            1000
        );

        console.log(
            '[Lampa Retro Player] loaded'
        );
    }

    bootstrap();

})();

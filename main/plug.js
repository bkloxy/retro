// ===================== ПОЛНОЦЕННЫЙ ЧИСТЫЙ ПЛЕЕР =====================
var customPlayer = {
    root: null,
    hideTimer: null,
    isVisible: true,
    isDragging: false,
    title: '',
    duration: 0,
    current: 0
};

function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function createCustomPlayerUI() {
    if ($('#nf-custom-player').length) return;

    var html = `
    <div id="nf-custom-player" class="nf-player">
        <!-- Верхняя панель -->
        <div class="nf-top">
            <div class="nf-title"></div>
            <div class="nf-close" tabindex="0">✕</div>
        </div>

        <!-- Центральная кнопка Play -->
        <div class="nf-center">
            <div class="nf-play-big" tabindex="0">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
        </div>

        <!-- Нижняя панель -->
        <div class="nf-bottom">
            <div class="nf-progress-wrap">
                <div class="nf-time-current">0:00</div>
                <div class="nf-progress">
                    <div class="nf-progress-bg"></div>
                    <div class="nf-progress-played"></div>
                    <div class="nf-progress-thumb"></div>
                </div>
                <div class="nf-time-left">-0:00</div>
            </div>

            <div class="nf-controls">
                <div class="nf-btn nf-skip-back" tabindex="0">
                    <svg viewBox="0 0 24 24"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                    <span>10</span>
                </div>

                <div class="nf-btn nf-play" tabindex="0">
                    <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg class="icon-pause" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </div>

                <div class="nf-btn nf-skip-fwd" tabindex="0">
                    <svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>
                    <span>10</span>
                </div>

                <div class="nf-spacer"></div>

                <div class="nf-btn nf-source" tabindex="0">Источник</div>
                <div class="nf-btn nf-size" tabindex="0">Размер</div>
            </div>
        </div>

        <div class="nf-skip-indicator"></div>
    </div>`;

    $('body').append(html);
    customPlayer.root = $('#nf-custom-player');

    // Стили — чистый минималистичный дизайн
    var css = `
    #nf-custom-player {
        position: fixed; inset: 0; z-index: 99999;
        background: transparent;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        transition: opacity .25s ease;
        pointer-events: none;
    }
    #nf-custom-player.visible {
        opacity: 1;
        pointer-events: auto;
    }
    #nf-custom-player.hidden-ui .nf-top,
    #nf-custom-player.hidden-ui .nf-bottom,
    #nf-custom-player.hidden-ui .nf-center {
        opacity: 0;
        pointer-events: none;
        transition: opacity .3s;
    }

    /* Верх */
    .nf-top {
        position: absolute; top: 0; left: 0; right: 0;
        padding: 2em 2.5em;
        background: linear-gradient(to bottom, rgba(0,0,0,.7), transparent);
        display: flex; align-items: center; justify-content: space-between;
    }
    .nf-title {
        font-size: 1.7em; font-weight: 600;
        text-shadow: 0 2px 10px rgba(0,0,0,.8);
        max-width: 80%;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nf-close {
        width: 2.6em; height: 2.6em; border-radius: 50%;
        background: rgba(255,255,255,.12);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.3em; cursor: pointer;
        transition: all .2s;
    }
    .nf-close:hover, .nf-close.focus {
        background: rgba(255,255,255,.25);
        transform: scale(1.1);
    }

    /* Центр */
    .nf-center {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
    }
    .nf-play-big {
        width: 5.2em; height: 5.2em; border-radius: 50%;
        background: rgba(0,0,0,.5);
        border: 2.5px solid rgba(255,255,255,.85);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: all .2s;
    }
    .nf-play-big:hover, .nf-play-big.focus {
        transform: scale(1.12);
        background: rgba(229,9,20,.75);
        border-color: #fff;
    }
    .nf-play-big svg {
        width: 2.1em; height: 2.1em; fill: #fff;
        margin-left: 0.18em;
    }

    /* Низ */
    .nf-bottom {
        position: absolute; bottom: 0; left: 0; right: 0;
        padding: 0 2.5em 2.2em;
        background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 60%, transparent);
    }

    .nf-progress-wrap {
        display: flex; align-items: center; gap: 1.1em;
        margin-bottom: 1.4em;
    }
    .nf-time-current, .nf-time-left {
        font-size: 1.15em; font-weight: 500;
        min-width: 3.8em; text-align: center;
        opacity: 0.9;
    }
    .nf-progress {
        flex: 1; height: 0.38em; position: relative;
        cursor: pointer; border-radius: 4px;
    }
    .nf-progress-bg {
        position: absolute; inset: 0;
        background: rgba(255,255,255,.22);
        border-radius: 4px;
    }
    .nf-progress-played {
        position: absolute; left: 0; top: 0; bottom: 0;
        background: #e50914;
        border-radius: 4px; width: 0%;
        transition: width .1s linear;
    }
    .nf-progress-thumb {
        position: absolute; top: 50%;
        width: 1em; height: 1em;
        background: #fff; border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 8px rgba(0,0,0,.5);
        left: 0%;
        opacity: 0;
        transition: opacity .2s;
    }
    .nf-progress:hover .nf-progress-thumb,
    .nf-progress.dragging .nf-progress-thumb {
        opacity: 1;
    }

    .nf-controls {
        display: flex; align-items: center; gap: 1.3em;
    }
    .nf-btn {
        height: 2.7em;
        min-width: 2.7em;
        padding: 0 1.1em;
        display: flex; align-items: center; justify-content: center;
        border-radius: 2em;
        background: rgba(255,255,255,.12);
        cursor: pointer;
        transition: all .2s;
        font-size: 1.05em;
        font-weight: 500;
        position: relative;
        gap: 0.4em;
    }
    .nf-btn:hover, .nf-btn.focus {
        background: rgba(255,255,255,.25);
        transform: scale(1.06);
    }
    .nf-btn svg {
        width: 1.35em; height: 1.35em; fill: #fff;
    }
    .nf-skip-back span, .nf-skip-fwd span {
        position: absolute;
        font-size: 0.68em;
        font-weight: 700;
        bottom: 0.2em;
        right: 0.35em;
    }
    .nf-play {
        width: 3.3em; height: 3.3em;
        min-width: 3.3em;
        background: #fff;
        border-radius: 50%;
        padding: 0;
    }
    .nf-play svg { fill: #000; width: 1.55em; height: 1.55em; }
    .nf-play .icon-play { margin-left: 0.12em; }
    .nf-spacer { flex: 1; }

    .nf-skip-indicator {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(0.85);
        font-size: 3em; font-weight: 700;
        background: rgba(0,0,0,.6);
        width: 2.6em; height: 2.6em;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        opacity: 0;
        transition: all .2s;
        pointer-events: none;
    }
    .nf-skip-indicator.show {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    /* Полностью убиваем родной плеер */
    .player-panel,
    .player__footer,
    .player-panel__info,
    .player-video__loader,
    .player-panel__timeline,
    .player-panel__play,
    .player-panel__line {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
    }
    `;
    $('body').append('<style id="nf-custom-player-style">' + css + '</style>');
}

function showUI() {
    if (!customPlayer.root) return;
    customPlayer.root.removeClass('hidden-ui').addClass('visible');
    customPlayer.isVisible = true;
    clearTimeout(customPlayer.hideTimer);
    customPlayer.hideTimer = setTimeout(hideUI, 3500);
}

function hideUI() {
    if (customPlayer.isDragging) return;
    customPlayer.root.addClass('hidden-ui');
    customPlayer.isVisible = false;
}

function updateProgress() {
    if (!customPlayer.root || !customPlayer.duration) return;
    var percent = (customPlayer.current / customPlayer.duration) * 100;
    customPlayer.root.find('.nf-progress-played').css('width', percent + '%');
    customPlayer.root.find('.nf-progress-thumb').css('left', percent + '%');
    customPlayer.root.find('.nf-time-current').text(formatTime(customPlayer.current));
    
    var left = customPlayer.duration - customPlayer.current;
    customPlayer.root.find('.nf-time-left').text('-' + formatTime(left));
}

function setPlaying(playing) {
    var playBtn = customPlayer.root.find('.nf-play');
    var bigBtn = customPlayer.root.find('.nf-play-big');
    if (playing) {
        playBtn.find('.icon-play').hide();
        playBtn.find('.icon-pause').show();
        bigBtn.hide();
    } else {
        playBtn.find('.icon-play').show();
        playBtn.find('.icon-pause').hide();
        bigBtn.show();
    }
}

function seekTo(percent) {
    var video = Lampa.PlayerVideo.video();
    if (!video || !customPlayer.duration) return;
    video.currentTime = (percent / 100) * customPlayer.duration;
}

function skip(seconds) {
    var video = Lampa.PlayerVideo.video();
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 999999, video.currentTime + seconds));

    var ind = customPlayer.root.find('.nf-skip-indicator');
    ind.html(seconds > 0 ? '10 ↻' : '↺ 10').addClass('show');
    clearTimeout(window.nfSkipTimer);
    window.nfSkipTimer = setTimeout(function () { ind.removeClass('show'); }, 700);
    showUI();
}

function togglePlay() {
    var video = Lampa.PlayerVideo.video();
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    showUI();
}

function bindCustomPlayerEvents() {
    var root = customPlayer.root;

    root.on('click', '.nf-play, .nf-play-big', togglePlay);
    root.on('click', '.nf-skip-back', function () { skip(-10); });
    root.on('click', '.nf-skip-fwd', function () { skip(10); });
    root.on('click', '.nf-close', function () {
        Lampa.Player.close();
    });

    // Источник и размер — открываем родные меню Lampa
    root.on('click', '.nf-source', function () {
        // Пытаемся открыть выбор источника
        try {
            $('.player-panel__source, .player-panel [data-action="source"]').trigger('click');
        } catch(e) {}
        showUI();
    });
    root.on('click', '.nf-size', function () {
        try {
            $('.player-panel [data-action="size"], .player-panel__size').trigger('click');
        } catch(e) {}
        showUI();
    });

    // Прогресс
    var progress = root.find('.nf-progress');
    progress.on('mousedown touchstart', function () {
        customPlayer.isDragging = true;
        progress.addClass('dragging');
        showUI();
    });

    $(document).on('mousemove.nfplayer touchmove.nfplayer', function (e) {
        if (!customPlayer.isDragging) return;
        var rect = progress[0].getBoundingClientRect();
        var clientX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
        var percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        seekTo(percent);
        updateProgress();
    });

    $(document).on('mouseup.nfplayer touchend.nfplayer', function () {
        if (customPlayer.isDragging) {
            customPlayer.isDragging = false;
            progress.removeClass('dragging');
            showUI();
        }
    });

    progress.on('click', function (e) {
        var rect = this.getBoundingClientRect();
        var percent = ((e.clientX - rect.left) / rect.width) * 100;
        seekTo(percent);
        showUI();
    });

    root.on('mousemove click touchstart', showUI);

    // Пульт / клавиатура
    $(window).on('keydown.nfplayer', function (e) {
        if (!Lampa.Player.opened) return;
        showUI();
        if (e.keyCode === 32 || e.keyCode === 13) { // Space / Enter
            e.preventDefault();
            togglePlay();
        }
        if (e.keyCode === 37) skip(-10);
        if (e.keyCode === 39) skip(10);
        if (e.keyCode === 27) Lampa.Player.close();
    });
}

function initCustomPlayer() {
    createCustomPlayerUI();
    bindCustomPlayerEvents();

    Lampa.Listener.follow('player', function (e) {
        if (e.type === 'start') {
            customPlayer.title = (e.data && e.data.title) || 
                                 (e.object && e.object.movie && (e.object.movie.title || e.object.movie.name)) || 
                                 'Воспроизведение';
            customPlayer.root.find('.nf-title').text(customPlayer.title);
            customPlayer.root.addClass('visible').removeClass('hidden-ui');
            showUI();
        }
        if (e.type === 'destroy' || e.type === 'close') {
            customPlayer.root.removeClass('visible');
            clearTimeout(customPlayer.hideTimer);
        }
    });

    Lampa.PlayerVideo.listener.follow('timeupdate', function (e) {
        customPlayer.current = e.current || 0;
        customPlayer.duration = e.duration || 0;
        updateProgress();
    });

    Lampa.PlayerVideo.listener.follow('play', function () { setPlaying(true); });
    Lampa.PlayerVideo.listener.follow('pause', function () {
        setPlaying(false);
        showUI();
    });
    Lampa.PlayerVideo.listener.follow('ended', function () {
        setPlaying(false);
        showUI();
    });
}

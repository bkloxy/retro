(function () {
    'use strict';

    if (window.nf_player_ready) return;
    window.nf_player_ready = true;

    // ===================== НАСТРОЙКИ =====================
    var RED = '#e50914';          // цвет полосы и ползунка
    var RADIUS = '0.5em';         // скругление кнопок
    var SHOW_REMAINING = true;    // справа «осталось» со знаком минус
    var AUTO_EXTERNAL = true;     // если встроенный плеер не справился, открыть во внешнем (VLC / MX)
    var AUDIO_CHECK = true;       // «нет звука» тоже считать поломкой (например, звук AC3/DTS)

    // ===================== СТИЛИ ПАНЕЛИ =====================
    function addStyles() {
        var P = '.player-panel.nf-ready ';
        var css = '' +
            '.player-panel{background:linear-gradient(to top,rgba(0,0,0,.88),rgba(0,0,0,0))!important}' +

            // --- полоса времени ---
            '.player-panel__timeline{height:.45em!important;border-radius:1em!important;' +
            'background:rgba(255,255,255,.3)!important;overflow:visible!important}' +
            '.player-panel__peding{background:rgba(255,255,255,.35)!important;border-radius:1em!important}' +
            '.player-panel__position{position:relative!important;background:' + RED + '!important;' +
            'border-radius:1em!important;overflow:visible!important}' +
            '.player-panel__position>div{display:none!important}' +
            '.nf-thumb{position:absolute;right:-.8em;top:50%;width:1.6em;height:1.6em;margin-top:-.8em;' +
            'border-radius:50%;background:' + RED + ';box-shadow:0 0 .6em rgba(0,0,0,.6)}' +
            '.player-panel__timeline.focus .nf-thumb{transform:scale(1.25)}' +
            '.player-panel__timenow,.player-panel__timeend{font-weight:700;font-size:1.3em;margin:0 .8em}' +

            // --- раскладка как в CloudStream: ряд 1 = play, время, полоса, осталось; ряд 2 = кнопки по центру ---
            P + '.player-panel__body{display:grid!important;grid-template-columns:auto auto 1fr auto;' +
            'grid-template-rows:auto auto auto;align-items:center;row-gap:.9em}' +
            P + '.player-panel__line{display:contents!important}' +
            P + '.player-panel__apex{position:absolute!important}' +
            P + '.player-panel__center{grid-column:1;grid-row:1}' +
            P + '.player-panel__timenow{grid-column:2;grid-row:1}' +
            P + '.player-panel__timeline{grid-column:3;grid-row:1;width:auto!important;margin:0!important}' +
            P + '.player-panel__timeend{grid-column:4;grid-row:1}' +
            P + '.player-panel__iptv{grid-column:1/-1;grid-row:3}' +
            P + '.player-panel__left,' + P + '.player-panel__right{display:none!important}' +
            '.nf-pills{grid-column:1/-1;grid-row:2;display:flex;justify-content:center;align-items:center;' +
            'flex-wrap:wrap;gap:.6em}' +
            '.nf-pills .player-panel__box-buttons{display:flex;align-items:center;gap:.6em;margin:0!important}' +

            // --- кнопка play/pause: круг ---
            '.player-panel__playpause{width:3.6em!important;height:3.6em!important;border-radius:50%!important;' +
            'background:rgba(255,255,255,.18)!important;margin:0!important}' +

            // --- кнопки-таблетки с подписями ---
            '.nf-pills .button{width:auto!important;height:auto!important;min-width:0!important;' +
            'display:inline-flex!important;align-items:center;justify-content:center;' +
            'border-radius:' + RADIUS + '!important;background:rgba(255,255,255,.16)!important;' +
            'padding:.55em 1.1em!important;margin:0!important}' +
            '.nf-pills .button.focus{background:rgba(255,255,255,.4)!important}' +
            '.nf-pills .button .tooltip{display:none!important}' +
            '.nf-pills .button svg{width:1.5em;height:1.5em;flex-shrink:0}' +
            '.nf-pills .button::after{margin-left:.6em;font-weight:700;font-size:1.05em;white-space:nowrap}' +
            '.nf-pills .player-panel__playlist::after{content:"Источник"}' +
            '.nf-pills .player-panel__next::after{content:"Следующая серия"}' +
            '.nf-pills .player-panel__flow::after{content:"Поток"}' +
            '.nf-pills .player-panel__subs::after{content:"Субтитры"}' +
            '.nf-pills .player-panel__tracks::after{content:"Озвучка"}' +
            '.nf-pills .player-panel__settings::after{content:"Настройки"}' +
            '.nf-pills .player-panel__fullscreen::after{content:"Изменить размер"}';
        $('body').append('<style id="nf-player-style">' + css + '</style>');
    }

    // переносим кнопки из левого и правого блоков в одну центральную строку
    function arrange() {
        var panel = $('.player-panel');
        if (!panel.length || panel.hasClass('nf-ready')) return;
        var body = panel.find('.player-panel__body').first();
        if (!body.length) return;

        var pills = $('<div class="nf-pills"></div>');
        body.find('.player-panel__left .player-panel__box-buttons, ' +
            '.player-panel__right.player-panel__tv-visible .player-panel__box-buttons').each(function () {
            pills.append(this);
        });
        if (!pills.children().length) return;

        body.append(pills);
        panel.addClass('nf-ready');
    }

    function fmt(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        var mm = (h > 0 && m < 10 ? '0' : '') + m;
        return (h > 0 ? h + ':' : '') + mm + ':' + (s < 10 ? '0' : '') + s;
    }

    // красный ползунок, «осталось», раскладка
    function tick() {
        try {
            arrange();

            var pos = $('.player-panel__position');
            if (pos.length && !pos.find('.nf-thumb').length) pos.append('<span class="nf-thumb"></span>');

            if (SHOW_REMAINING) {
                var v = document.querySelector('.player-video__display video');
                if (v && isFinite(v.duration) && v.duration > 0) {
                    $('.player-panel__timeend').text('-' + fmt(v.duration - v.currentTime));
                }
            }
        } catch (e) { }
    }

    // ===================== АВТО-ПЕРЕКЛЮЧЕНИЕ НА ВНЕШНИЙ ПЛЕЕР =====================
    var fellBack = {};

    function externalPlay(v) {
        var url = v.currentSrc || v.src;
        if (!AUTO_EXTERNAL || !url || fellBack[url]) return;
        if (!(window.Android && typeof window.Android.openPlayer === 'function')) return;
        fellBack[url] = true;
        var title = $.trim($('.player-panel__filename').text()) || 'Видео';
        try { Lampa.Player.close(); } catch (e) { }
        try { Lampa.Noty.show('Встроенный плеер не справился, открываю во внешнем'); } catch (e) { }
        try { window.Android.openPlayer(url, JSON.stringify({ url: url, title: title })); } catch (e) { }
    }

    function initFallback() {
        document.addEventListener('error', function (e) {
            var v = e.target;
            if (v && v.tagName === 'VIDEO' && v.error && (v.error.code === 3 || v.error.code === 4)) externalPlay(v);
        }, true);

        setInterval(function () {
            try {
                var v = document.querySelector('.player-video__display video');
                if (!v || v.paused || v.currentTime < 8) return;
                var vid = v.webkitVideoDecodedByteCount, aud = v.webkitAudioDecodedByteCount;
                if (typeof vid === 'number' && vid === 0) return externalPlay(v);
                if (AUDIO_CHECK && typeof aud === 'number' && aud === 0 && vid > 0) externalPlay(v);
            } catch (e) { }
        }, 1000);
    }

    // ===================== ЗНАЧОК ПЕРЕМОТКИ «-10 / +10» =====================
    var ARROW = '<svg viewBox="0 0 100 100"><path d="M50 15 A35 35 0 1 0 85 50" fill="none" ' +
        'stroke="#fff" stroke-width="6" stroke-linecap="round"/><polygon points="36,15 54,5 54,25" fill="#fff"/></svg>';

    function addSeekStyles() {
        var css = '' +
            '.nf-seek{position:fixed;top:50%;width:8em;height:8em;margin-top:-4em;z-index:2147483000;' +
            'display:flex;align-items:center;justify-content:center;border-radius:50%;' +
            'background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s}' +
            '.nf-seek.show{opacity:1}' +
            '.nf-seek--back{left:14%}' +
            '.nf-seek--fwd{right:14%}' +
            '.nf-seek svg{position:absolute;left:12%;top:12%;width:76%;height:76%}' +
            '.nf-seek--fwd svg{transform:scaleX(-1)}' +
            '.nf-seek span{position:relative;font-size:1.7em;font-weight:800;color:#fff;margin-top:.1em}';
        $('body').append('<style id="nf-seek-style">' + css + '</style>' +
            '<div class="nf-seek nf-seek--back">' + ARROW + '<span></span></div>' +
            '<div class="nf-seek nf-seek--fwd">' + ARROW + '<span></span></div>');
    }

    var lastT = 0, acc = 0, lastShow = 0, hideTimer;

    function showSeek(delta) {
        var now = Date.now();
        if (now - lastShow < 900 && (acc > 0) === (delta > 0)) acc += delta; else acc = delta;
        lastShow = now;

        var back = acc < 0;
        var on = $(back ? '.nf-seek--back' : '.nf-seek--fwd');
        var off = $(back ? '.nf-seek--fwd' : '.nf-seek--back');
        off.removeClass('show');
        on.find('span').text((back ? '-' : '+') + Math.abs(Math.round(acc)));
        on.addClass('show');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { on.removeClass('show'); }, 900);
    }

    function initSeek() {
        document.addEventListener('timeupdate', function (e) {
            var v = e.target;
            if (v && v.tagName === 'VIDEO' && !v.seeking) lastT = v.currentTime;
        }, true);

        document.addEventListener('seeking', function (e) {
            var v = e.target;
            if (!v || v.tagName !== 'VIDEO') return;
            var d = v.currentTime - lastT;
            lastT = v.currentTime;
            if (Math.abs(d) >= 1.5) showSeek(d);
        }, true);
    }

    // ===================== ВВЕРХ / ВНИЗ ОТКРЫВАЮТ МЕНЮ =====================
    function initMenuKeys() {
        document.addEventListener('keydown', function (e) {
            if (e.keyCode !== 38 && e.keyCode !== 40) return;
            try {
                if (!$('.player').length) return;
                if ($('body').hasClass('selectbox--open')) return;
                if ($('.player-panel.panel--visible').length) return;
                $('.player-panel').addClass('panel--visible');
                Lampa.Controller.toggle('player_panel');
            } catch (err) { }
        }, true);
    }

    // ===================== СТАРТ =====================
    function start() {
        addStyles();
        addSeekStyles();
        initSeek();
        initMenuKeys();
        initFallback();
        setInterval(tick, 500);
        console.log('[NF Player] loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

  

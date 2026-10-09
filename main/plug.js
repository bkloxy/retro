(function () {
    'use strict';

    if (!window.Lampa) return;

    var VERSION = 2;
    if (window.retro_nf_version && window.retro_nf_version >= VERSION) return;
    window.retro_nf_version = VERSION;

    /*
     * RETRO / NETFLIX для Лампы, версия 2
     *
     * Что исправлено относительно первой версии:
     *  - постеры снова вертикальные: размеры карточек Лампа считает сама, мы их не трогаем
     *  - карточки больше не наезжают друг на друга (раньше им задавалась ширина в vw)
     *  - убрана тяжёлая слежка за всей страницей: рамка обновляется только при выборе и прокрутке
     *  - рамка двигается через transform (быстро), а не через left/top
     *  - убрана проверка версии Лампы, из-за которой плагин мог молча не запускаться
     */

    // ---------- убираем следы первой версии ----------
    try {
        ['retro-netflix-style', 'retro-netflix-focus'].forEach(function (id) {
            var e = document.getElementById(id);
            if (e) e.remove();
        });
        if (window.__RETRO_NETFLIX_OBSERVER__) window.__RETRO_NETFLIX_OBSERVER__.disconnect();
        document.body.classList.remove('retro-netflix-active');
    } catch (e) { }

    var STYLE_ID = 'retro-nf2-style';
    var FRAME_ID = 'retro-nf2-frame';

    // ---------- стили ----------
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = '' +
            'body.retro-nf2{background:#050505!important}' +

            // левое меню
            'body.retro-nf2 .wrap__left{background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.92) 72%,rgba(0,0,0,0) 100%)!important;border:0!important}' +
            'body.retro-nf2 .menu__item{transition:background .18s ease,color .18s ease}' +
            'body.retro-nf2 .menu__item .menu__ico{opacity:.75}' +
            'body.retro-nf2 .menu__item.focus .menu__ico{opacity:1}' +

            // верхняя панель
            'body.retro-nf2 .head{background:linear-gradient(180deg,rgba(0,0,0,.96) 0%,rgba(0,0,0,.72) 65%,rgba(0,0,0,0) 100%)!important;border:0!important;box-shadow:none!important}' +

            // заголовки рядов
            'body.retro-nf2 .items-line__title{color:#fff!important;font-weight:700!important;letter-spacing:-.2px}' +

            // карточки: только оформление, размеры не трогаем, поэтому постеры вертикальные и не наезжают друг на друга
            'body.retro-nf2 .card__view,body.retro-nf2 .card__img{border-radius:0!important}' +
            'body.retro-nf2 .card__view{background:#111!important;overflow:hidden}' +
            'body.retro-nf2 .card.focus{z-index:2}' +
            'body.retro-nf2 .card__title{color:#fff!important;font-weight:600!important}' +
            'body.retro-nf2 .card__vote{border-radius:0!important}' +

            // родную рамку Лампы прячем: вместо неё одна общая рамка, которая плавно переезжает
            'body.retro-nf2 .card.focus .card__view::after{border:0!important;box-shadow:none!important}' +

            // кнопки
            'body.retro-nf2 .button,body.retro-nf2 .selector{border-radius:4px}' +

            // страница фильма
            'body.retro-nf2 .full-start__background{opacity:.48!important}' +
            'body.retro-nf2 .full-start__poster{border-radius:0!important;overflow:hidden;box-shadow:0 15px 45px rgba(0,0,0,.6)}' +
            'body.retro-nf2 .full-start__buttons .button{background:#fff!important;color:#000!important}' +
            'body.retro-nf2 .full-start__buttons .button.focus{background:#e50914!important;color:#fff!important}' +

            // общая рамка выбора
            '#' + FRAME_ID + '{position:fixed;left:0;top:0;z-index:50;pointer-events:none;opacity:0;box-sizing:border-box;' +
            'border:3px solid #fff;border-radius:0;box-shadow:0 8px 28px rgba(0,0,0,.6);will-change:transform,width,height;' +
            'transition:opacity .12s ease}' +
            '#' + FRAME_ID + '.glide{transition:transform .24s cubic-bezier(.2,.8,.2,1),width .24s cubic-bezier(.2,.8,.2,1),' +
            'height .24s cubic-bezier(.2,.8,.2,1),opacity .12s ease}' +
            '@media (pointer:coarse){#' + FRAME_ID + '{display:none}}';

        document.head.appendChild(style);
    }

    // ---------- плавная рамка ----------
    var frame, lastEl = null, shown = false, glideTimer = null;
    var rafId = 0, trackUntil = 0;

    function anyVisible(sel) {
        var n = document.querySelectorAll(sel);
        for (var i = 0; i < n.length; i++) {
            if (n[i].getClientRects().length && getComputedStyle(n[i]).visibility !== 'hidden') return true;
        }
        return false;
    }

    function hideFrame() {
        frame.style.opacity = '0';
        shown = false;
        lastEl = null;
    }

    function updateFrame() {
        if (anyVisible('.player, .selectbox, .modal')) return hideFrame();

        var card = document.querySelector('.wrap .card.focus');
        var target = card && card.querySelector('.card__view');
        if (!target) return hideFrame();

        var r = target.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > window.innerHeight) return hideFrame();

        if (card !== lastEl) {
            lastEl = card;
            if (shown) {
                frame.classList.add('glide');
                clearTimeout(glideTimer);
                glideTimer = setTimeout(function () { frame.classList.remove('glide'); }, 380);
            } else {
                frame.classList.remove('glide');
            }
        }

        frame.style.width = r.width + 'px';
        frame.style.height = r.height + 'px';
        frame.style.transform = 'translate3d(' + r.left + 'px,' + r.top + 'px,0)';
        frame.style.opacity = '1';
        shown = true;
    }

    // рамка обновляется каждый кадр только короткое время после выбора или прокрутки
    function track(ms) {
        trackUntil = Math.max(trackUntil, performance.now() + ms);
        if (!rafId) rafId = requestAnimationFrame(loop);
    }

    function loop() {
        rafId = 0;
        try { updateFrame(); } catch (e) { }
        if (performance.now() < trackUntil) rafId = requestAnimationFrame(loop);
    }

    function createFrame() {
        if (document.getElementById(FRAME_ID)) return;
        frame = document.createElement('div');
        frame.id = FRAME_ID;
        document.body.appendChild(frame);
    }

    // ---------- запуск ----------
    function start() {
        injectStyle();
        createFrame();
        document.body.classList.add('retro-nf2');

        // Лампа сообщает о выборе элемента событием hover:focus
        if (window.$) $(document).on('hover:focus', function () { track(550); });

        // прокрутка (в том числе колесом мыши) и смена экрана
        document.addEventListener('scroll', function () { track(300); }, { capture: true, passive: true });
        document.addEventListener('wheel', function () { track(400); }, { passive: true });
        window.addEventListener('resize', function () { track(300); });
        Lampa.Listener.follow('activity', function () { track(800); });

        // редкая страховка, если какое-то событие не пришло
        setInterval(function () { track(60); }, 700);

        track(600);
        console.log('[Retro Netflix] v' + VERSION + ' loaded');
        try { Lampa.Noty.show('Retro Netflix: версия ' + VERSION + ' загружена'); } catch (e) { }
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

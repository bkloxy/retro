(function () {
    'use strict';

    if (window.nf_interface_ready) return;
    window.nf_interface_ready = true;

    // ===================== НАСТРОЙКИ В ЛАМПЕ =====================
    // Раздел «Интерфейс Netflix» появится в Настройки.
    var PARAMS = [
        { name: 'nf_ui_enable', title: 'Включить интерфейс Netflix', desc: 'Главный выключатель. Если выключить, Лампа выглядит как обычно' },
        { name: 'nf_ui_menu', title: 'Свёрнутое меню слева', desc: 'Только значки, названия появляются при выборе меню' },
        { name: 'nf_ui_full', title: 'Кнопки столбиком на странице фильма', desc: 'Смотреть, Трейлеры и другие кнопки одна под другой, с белой рамкой' },
        { name: 'nf_ui_frame', title: 'Плавная белая рамка выбора', desc: 'Одна рамка плавно переезжает с постера на постер, как у Netflix' }
    ];

    function on(key) {
        var v = Lampa.Storage.get(key, 'true');
        return v === true || v === 'true';
    }

    function apply() {
        var master = on('nf_ui_enable');
        $('body')
            .toggleClass('nf-menu', master && on('nf_ui_menu'))
            .toggleClass('nf-full', master && on('nf_ui_full'))
            .toggleClass('nf-frame', master && on('nf_ui_frame'));
    }

    function registerSettings() {
        try {
            Lampa.SettingsApi.addComponent({
                component: 'nf_ui',
                name: 'Интерфейс Netflix',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">' +
                    '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>'
            });
            PARAMS.forEach(function (p) {
                Lampa.SettingsApi.addParam({
                    component: 'nf_ui',
                    param: { name: p.name, type: 'trigger', 'default': true },
                    field: { name: p.title, description: p.desc },
                    onChange: function () { apply(); }
                });
            });
        } catch (e) { console.log('[NF Interface] settings failed', e); }
    }

    // ===================== СТИЛИ =====================
    function addStyles() {
        var css = '' +
            // --- левое меню: свёрнутая полоса со значками ---
            'body.nf-menu .wrap__left{transform:translate3d(0,0,0)!important;width:4.8em!important;overflow:hidden;' +
            'transition:width .3s ease;z-index:30;background:linear-gradient(to right,rgba(0,0,0,.9),rgba(0,0,0,.55))}' +
            'body.nf-menu.menu--open .wrap__left{width:17em!important}' +
            'body.nf-menu .menu__text{opacity:0;white-space:nowrap;transition:opacity .2s}' +
            'body.nf-menu.menu--open .menu__text{opacity:1}' +
            'body.nf-menu .menu__item{border-radius:.3em}' +
            'body.nf-menu .menu__item.focus,body.nf-menu .menu__item.traverse{background:transparent!important;' +
            'outline:.15em solid #fff;outline-offset:-.15em}' +
            'body.nf-menu .wrap__content{padding-left:4.8em}' +

            // --- страница фильма: кнопки столбиком ---
            'body.nf-full .full-start-new__buttons,body.nf-full .full-start__buttons{display:flex!important;' +
            'flex-direction:column!important;flex-wrap:nowrap!important;align-items:flex-start!important;gap:.4em}' +
            'body.nf-full .full-start__button{width:22em;max-width:100%;justify-content:flex-start;' +
            'background:rgba(255,255,255,.06)!important;border-radius:.3em;padding:.7em 1em!important;' +
            'margin:0!important;font-size:1.05em}' +
            'body.nf-full .full-start__button.focus{background:rgba(255,255,255,.14)!important;' +
            'outline:.15em solid #fff;outline-offset:-.15em;box-shadow:none!important}' +

            // --- одна общая белая рамка выбора ---
            '#nf-focus{position:fixed;left:0;top:0;z-index:31;pointer-events:none;opacity:0;' +
            'border:.2em solid #fff;border-radius:.35em;box-shadow:0 0 1.2em rgba(0,0,0,.55);' +
            'transition:opacity .15s ease;will-change:transform,width,height}' +
            '#nf-focus.fly{transition:transform .28s cubic-bezier(.2,.8,.2,1),width .28s cubic-bezier(.2,.8,.2,1),' +
            'height .28s cubic-bezier(.2,.8,.2,1),opacity .15s ease}' +
            // родные рамки Лампы прячем, чтобы не было двух рамок
            'body.nf-frame .card.focus .card__view::after{border-color:transparent!important}' +
            'body.nf-frame .menu__item.focus,body.nf-frame .menu__item.traverse,' +
            'body.nf-frame .full-start__button.focus{outline:none!important}';
        $('body').append('<style id="nf-interface-style">' + css + '</style>');
    }

    // ===================== ПЛАВНАЯ БЕЛАЯ РАМКА ВЫБОРА =====================
    var frame, lastEl = null, shown = false, flyTimer;

    function hideFrame() {
        frame.style.opacity = 0;
        shown = false;
        lastEl = null;
    }

    function updateFrame() {
        var b = document.body;
        if (!b.classList.contains('nf-frame') || document.querySelector('.player, .selectbox, .modal')) return hideFrame();

        var list = document.querySelectorAll('.wrap .selector.focus');
        if (!list.length) return hideFrame();

        var el = list[list.length - 1];
        var target = el.classList.contains('card') ? (el.querySelector('.card__view') || el) : el;
        var r = target.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > window.innerHeight) return hideFrame();

        // летит с одного элемента на другой; если рамка только появилась, показываем сразу на месте
        if (el !== lastEl) {
            lastEl = el;
            if (shown) {
                frame.classList.add('fly');
                clearTimeout(flyTimer);
                flyTimer = setTimeout(function () { frame.classList.remove('fly'); }, 380);
            } else {
                frame.classList.remove('fly');
            }
        }

        var pad = 4;
        frame.style.opacity = 1;
        frame.style.width = (r.width + pad * 2) + 'px';
        frame.style.height = (r.height + pad * 2) + 'px';
        frame.style.transform = 'translate3d(' + (r.left - pad) + 'px,' + (r.top - pad) + 'px,0)';
        shown = true;
    }

    function initFrame() {
        frame = document.createElement('div');
        frame.id = 'nf-focus';
        document.body.appendChild(frame);
        (function loop() {
            try { updateFrame(); } catch (e) { }
            requestAnimationFrame(loop);
        })();
    }

    // ===================== СТАРТ =====================
    function start() {
        registerSettings();
        addStyles();
        initFrame();
        apply();
        console.log('[NF Interface] loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

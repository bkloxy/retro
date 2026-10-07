(function () {
    'use strict';

    if (window.nf_interface_ready) return;
    window.nf_interface_ready = true;

    // ===================== НАСТРОЙКИ В ЛАМПЕ =====================
    // Раздел «Интерфейс Netflix» появится в Настройки.
    var PARAMS = [
        { name: 'nf_ui_enable', title: 'Включить интерфейс Netflix', desc: 'Главный выключатель. Если выключить, Лампа выглядит как обычно' },
        { name: 'nf_ui_menu', title: 'Свёрнутое меню слева', desc: 'Только значки, названия появляются при выборе меню' },
        { name: 'nf_ui_full', title: 'Кнопки столбиком на странице фильма', desc: 'Смотреть, Трейлеры и другие кнопки одна под другой, с белой рамкой' }
    ];

    function on(key) {
        var v = Lampa.Storage.get(key, 'true');
        return v === true || v === 'true';
    }

    function apply() {
        var master = on('nf_ui_enable');
        $('body')
            .toggleClass('nf-menu', master && on('nf_ui_menu'))
            .toggleClass('nf-full', master && on('nf_ui_full'));
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
            'outline:.15em solid #fff;outline-offset:-.15em;box-shadow:none!important}';
        $('body').append('<style id="nf-interface-style">' + css + '</style>');
    }

    // ===================== СТАРТ =====================
    function start() {
        registerSettings();
        addStyles();
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

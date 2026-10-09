(function () {
    'use strict';

    if (!window.Lampa) return;

    var VERSION = 1;
    if (window.nf_menu_version && window.nf_menu_version >= VERSION) return;
    window.nf_menu_version = VERSION;

    /*
     * Меню слева в стиле Netflix. Работает отдельно от остальных плагинов.
     * Размеры и положение меню Лампы не меняются, меняется только оформление.
     */

    var STYLE_ID = 'nf-menu-style';

    var ICON_PROFILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();

        var css = '' +
            // тёмная панель и затемнение всего остального при открытом меню
            'body.nf-menu2 .wrap__left{background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.94) 62%,rgba(0,0,0,0) 100%)!important;border:0!important}' +
            'body.nf-menu2.menu--open .wrap__content{filter:brightness(.4);transition:filter .3s ease}' +
            'body.nf-menu2 .wrap__content{transition:filter .3s ease}' +

            // пункты: серые, крупные, без заливки
            'body.nf-menu2 .menu__item{background:transparent!important;color:#8c8c8c!important;border-radius:0!important;' +
            'margin:.25em 0;transition:color .2s ease}' +
            'body.nf-menu2 .menu__item .menu__text{font-size:1.25em;font-weight:500;color:inherit!important}' +

            // значки берут цвет текста: серый, а у выбранного пункта белый
            'body.nf-menu2 .menu__item .menu__ico{color:inherit;position:relative}' +
            'body.nf-menu2 .menu__item .menu__ico [stroke]{stroke:currentColor!important}' +
            'body.nf-menu2 .menu__item .menu__ico path[fill]:not([fill=none]),' +
            'body.nf-menu2 .menu__item .menu__ico rect[fill]:not([fill=none]),' +
            'body.nf-menu2 .menu__item .menu__ico circle[fill]:not([fill=none]){fill:currentColor!important}' +

            // выбранный пункт: белый, жирный, красная черта под значком
            'body.nf-menu2 .menu__item.focus,body.nf-menu2 .menu__item.hover{color:#fff!important;background:transparent!important}' +
            'body.nf-menu2 .menu__item.focus .menu__text{font-weight:800}' +
            'body.nf-menu2 .menu__item.focus .menu__ico::after,body.nf-menu2 .menu__item.nf-current .menu__ico::after{' +
            'content:"";position:absolute;left:12%;right:12%;bottom:-.3em;height:.16em;border-radius:1em;background:#e50914}' +
            'body.nf-menu2 .menu__item.nf-current{color:#d6d6d6!important}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ----- какой раздел сейчас открыт -----
    function currentAction() {
        try {
            var a = Lampa.Activity.active();
            if (!a) return '';
            var c = String(a.component || ''), u = String(a.url || '');
            if (c === 'main') return 'main';
            if (u === 'movie') return 'movie';
            if (u === 'tv') return 'tv';
            if (c.indexOf('favorite') > -1 || c.indexOf('bookmark') > -1) return 'favorite';
            if (c === 'catalog') return 'catalog';
        } catch (e) { }
        return '';
    }

    function markCurrent() {
        var id = currentAction();
        $('.wrap__left .menu__item').each(function () {
            var el = $(this);
            el.toggleClass('nf-current', !!id && el.data('action') === id);
        });
    }

    // ----- строка «Профиль» сверху, как в Netflix -----
    function addProfile() {
        if ($('.nf-profile-item').length) return;
        var list = $('.wrap__left .menu__list').first();
        var headBtn = $('.open--profile').first();
        if (!list.length || !headBtn.length) return;

        var li = $('<li class="menu__item selector nf-profile-item" data-action="nf_profile">' +
            '<div class="menu__ico">' + ICON_PROFILE + '</div>' +
            '<div class="menu__text">Профиль</div></li>');
        li.on('hover:enter', function () {
            try { $('.open--profile').first().trigger('hover:enter'); } catch (e) { }
        });
        list.prepend(li);
    }

    function start() {
        injectStyle();
        document.body.classList.add('nf-menu2');

        // при открытии и закрытии меню обновляем отметку текущего раздела
        if (window.MutationObserver) {
            new MutationObserver(function () { markCurrent(); })
                .observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        // меню Лампа строит не сразу, поэтому пробуем несколько раз
        var tries = 0;
        var timer = setInterval(function () {
            addProfile();
            markCurrent();
            if (++tries > 20) clearInterval(timer);
        }, 500);

        console.log('[NF Menu] v' + VERSION + ' loaded');
        try { Lampa.Noty.show('Меню Netflix: версия ' + VERSION + ' загружена'); } catch (e) { }
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

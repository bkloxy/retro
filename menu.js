(function () {
    'use strict';

    if (!window.Lampa) return;

    var VERSION = 10;
    if (window.nf_menu_version && window.nf_menu_version >= VERSION) return;
    window.nf_menu_version = VERSION;

    /*
     * Netflix-style меню для Lampa
     * v10 — меню НЕ закрывается при выборе раздела.
     * Закрывается ТОЛЬКО по нажатию ВПРАВО.
     * ↑↓ листают разделы сразу без ОК.
     */

    var STYLE_ID = 'nf-menu-style';

    var ICON_PROFILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

    var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';

    // Пункты, которые можно переключать без закрытия меню
    var SAFE_ACTIONS = {
        main: true, feed: true, movie: true, cartoon: true, tv: true,
        myperson: true, relise: true, anime: true, favorite: true,
        history: true, subscribes: true, timetable: true, mytorrents: true
    };

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();

        var css =
            'body.nf-menu2 .wrap__left{background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.94) 62%,rgba(0,0,0,0) 100%)!important;border:0!important}' +
            'body.nf-menu2.menu--open .wrap__content{filter:brightness(.4);transition:filter .3s ease}' +
            'body.nf-menu2 .wrap__content{transition:filter .3s ease}' +
            'body.nf-menu2 .menu__item{background:transparent!important;color:#8c8c8c!important;border-radius:0!important;margin:.25em 0;transition:color .2s ease}' +
            'body.nf-menu2 .menu__item .menu__text{font-size:1.25em;font-weight:500;color:inherit!important}' +
            'body.nf-menu2 .menu__item .menu__ico{color:inherit;position:relative}' +
            'body.nf-menu2 .menu__item .menu__ico [stroke]{stroke:currentColor!important}' +
            'body.nf-menu2 .menu__item .menu__ico path[fill]:not([fill=none]),' +
            'body.nf-menu2 .menu__item .menu__ico rect[fill]:not([fill=none]),' +
            'body.nf-menu2 .menu__item .menu__ico circle[fill]:not([fill=none]){fill:currentColor!important}' +
            'body.nf-menu2 .menu__item.focus,body.nf-menu2 .menu__item.hover{color:#fff!important;background:transparent!important}' +
            'body.nf-menu2 .menu__item.focus .menu__text{font-weight:800}' +
            'body.nf-menu2 .menu__item.focus .menu__ico::after,body.nf-menu2 .menu__item.nf-current .menu__ico::after{' +
            'content:"";position:absolute;left:12%;right:12%;bottom:-.3em;height:.16em;border-radius:1em;background:#e50914}' +
            'body.nf-menu2 .menu__item.nf-current{color:#d6d6d6!important}' +
            'body.nf-menu-w1 .wrap__left,body.nf-menu-w2 .wrap__left{overflow:visible!important}' +
            'body.nf-menu-w1 .wrap__left::before,body.nf-menu-w2 .wrap__left::before{content:"";position:absolute;top:0;bottom:0;left:0;z-index:-1;pointer-events:none;' +
            'background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.94) 70%,rgba(0,0,0,0) 100%)}' +
            'body.nf-menu-w1 .wrap__left::before{width:21em}' +
            'body.nf-menu-w2 .wrap__left::before{width:26em}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

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
            return c || u || '';
        } catch (e) { return ''; }
    }

    function markCurrent() {
        var id = currentAction();
        $('.wrap__left .menu__item').each(function () {
            var el = $(this);
            el.toggleClass('nf-current', !!id && el.data('action') === id);
        });
    }

    // ----- Поиск и Профиль -----
    function addSearch() {
        if ($('.nf-search-item').length) return;
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;

        var li = $('<li class="menu__item selector nf-search-item" data-action="nf_search">' +
            '<div class="menu__ico">' + ICON_SEARCH + '</div><div class="menu__text">Поиск</div></li>');
        li.on('hover:enter', function () {
            try {
                var btn = $('.open--search').first();
                if (btn.length) btn.trigger('hover:enter');
                else Lampa.Search.open();
            } catch (e) { }
        });
        list.prepend(li);
    }

    function addProfile() {
        if ($('.nf-profile-item').length) return;
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;

        var li = $('<li class="menu__item selector nf-profile-item" data-action="nf_profile">' +
            '<div class="menu__ico">' + ICON_PROFILE + '</div><div class="menu__text">Профиль</div></li>');
        li.on('hover:enter', function () {
            try { $('.open--profile').first().trigger('hover:enter'); } catch (e) { }
        });
        list.append(li);
    }

    // ----- Настройки -----
    function registerSettings() {
        try {
            Lampa.SettingsApi.addComponent({
                component: 'nf_menu',
                name: 'Меню Netflix',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_auto', type: 'trigger', 'default': true },
                field: { name: 'Открывать раздел сразу при выборе', description: '↑↓ сразу меняют раздел без нажатия ОК' }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_keep', type: 'trigger', 'default': true },
                field: { name: 'Оставаться в меню при переключении', description: 'Меню не закрывается. Закрыть можно только кнопкой ВПРАВО' }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_delay', type: 'select', values: { '200': 'Очень быстро', '400': 'Быстро', '700': 'Не спеша' }, 'default': '300' },
                field: { name: 'Скорость переключения', description: 'Задержка перед открытием раздела' }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_width', type: 'select', values: { '0': 'Обычная', '1': 'Чуть шире', '2': 'Широкая' }, 'default': '1' },
                field: { name: 'Ширина меню' },
                onChange: applyWidth
            });
        } catch (e) { }
    }

    function applyWidth() {
        var v = String(Lampa.Storage.get('nf_menu_width', '1'));
        document.body.classList.toggle('nf-menu-w1', v === '1');
        document.body.classList.toggle('nf-menu-w2', v === '2');
    }

    function autoOn() { var v = Lampa.Storage.get('nf_menu_auto', 'true'); return v === true || v === 'true'; }
    function keepOn() { var v = Lampa.Storage.get('nf_menu_keep', 'true'); return v === true || v === 'true'; }
    function delayMs() { var d = parseInt(Lampa.Storage.get('nf_menu_delay', '300'), 10); return isFinite(d) ? d : 300; }

    // ========== ГЛАВНАЯ ЛОГИКА ==========
    var autoTimer = null;
    var lastFocused = null;
    var ignoreUntil = 0;
    var keepActive = false;

    function forceMenuOpen(el) {
        if (!keepOn()) return;

        keepActive = true;

        // Несколько попыток подряд — Лампа очень упорно переключает контроллер
        var attempts = [30, 80, 160, 300, 500, 800];
        attempts.forEach(function (ms) {
            setTimeout(function () {
                if (!keepActive) return;
                try {
                    document.body.classList.add('menu--open');
                    $('.wrap__left').removeClass('wrap__left--hidden');
                    Lampa.Controller.toggle('menu');
                    if (el && el[0]) Lampa.Controller.focus(el[0]);
                } catch (e) { }
            }, ms);
        });
    }

    function stopKeep() {
        keepActive = false;
    }

    function bindLogic() {
        // Вправо / ОК / Назад — разрешаем закрыть меню
        document.addEventListener('keydown', function (e) {
            if ([39, 13, 8, 27, 4, 461, 10009].indexOf(e.keyCode) > -1) {
                stopKeep();
            }
        }, true);

        // При фокусе на пункте — через задержку открываем раздел и держим меню
        $(document).on('hover:focus', '.menu__item', function () {
            if (!autoOn()) return;
            if (!document.body.classList.contains('menu--open')) return;

            var el = $(this);
            var action = el.data('action');

            if (!SAFE_ACTIONS[action]) return;
            if (el[0] === lastFocused && Date.now() < ignoreUntil) return;

            clearTimeout(autoTimer);

            autoTimer = setTimeout(function () {
                if (!el.hasClass('focus')) return;
                if (!document.body.classList.contains('menu--open')) return;

                lastFocused = el[0];
                ignoreUntil = Date.now() + 800;

                // Открываем раздел (как будто нажали ОК)
                el.trigger('hover:enter');

                // И сразу возвращаем меню
                forceMenuOpen(el);
            }, delayMs());
        });

        // На всякий случай — если Лампа всё-таки сняла menu--open, возвращаем
        if (window.MutationObserver) {
            new MutationObserver(function () {
                if (keepActive && !document.body.classList.contains('menu--open')) {
                    try {
                        document.body.classList.add('menu--open');
                        $('.wrap__left').removeClass('wrap__left--hidden');
                        Lampa.Controller.toggle('menu');
                    } catch (e) { }
                }
                markCurrent();
            }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }

    function start() {
        injectStyle();
        registerSettings();
        applyWidth();
        bindLogic();
        document.body.classList.add('nf-menu2');

        var tries = 0;
        var t = setInterval(function () {
            addSearch();
            addProfile();
            markCurrent();
            if (++tries > 25) {
                clearInterval(t);
                setInterval(function () { addSearch(); addProfile(); }, 2500);
            }
        }, 400);

        console.log('[NF Menu] v' + VERSION + ' — меню не закрывается при ↑↓');
        try { Lampa.Noty.show('Меню Netflix v' + VERSION + ' загружено'); } catch (e) { }
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();

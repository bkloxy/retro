(function () {
    'use strict';

    if (!window.Lampa) return;

    var VERSION = 11;
    if (window.nf_menu_version && window.nf_menu_version >= VERSION) return;
    window.nf_menu_version = VERSION;

    /*
     * Netflix / YouTube-style меню
     * ↑↓ — сразу меняет категорию, меню остаётся открытым
     * →  — закрывает меню и уходит в контент
     */

    var STYLE_ID = 'nf-menu-style';

    var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
    var ICON_PROFILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

    // Какие пункты можно переключать без закрытия меню
    var SAFE = {
        main: 1, feed: 1, movie: 1, cartoon: 1, tv: 1,
        myperson: 1, relise: 1, anime: 1, favorite: 1,
        history: 1, subscribes: 1, timetable: 1, mytorrents: 1
    };

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();

        var css =
            'body.nf-menu2 .wrap__left{background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.94) 62%,rgba(0,0,0,0) 100%)!important;border:0!important}' +
            'body.nf-menu2.menu--open .wrap__content{filter:brightness(.45);transition:filter .25s ease}' +
            'body.nf-menu2 .wrap__content{transition:filter .25s ease}' +
            'body.nf-menu2 .menu__item{background:transparent!important;color:#8c8c8c!important;border-radius:0!important;margin:.22em 0;transition:color .15s ease}' +
            'body.nf-menu2 .menu__item .menu__text{font-size:1.22em;font-weight:500;color:inherit!important}' +
            'body.nf-menu2 .menu__item .menu__ico{color:inherit;position:relative}' +
            'body.nf-menu2 .menu__item .menu__ico [stroke]{stroke:currentColor!important}' +
            'body.nf-menu2 .menu__item .menu__ico path[fill]:not([fill=none]),body.nf-menu2 .menu__item .menu__ico rect[fill]:not([fill=none]),body.nf-menu2 .menu__item .menu__ico circle[fill]:not([fill=none]){fill:currentColor!important}' +
            'body.nf-menu2 .menu__item.focus,body.nf-menu2 .menu__item.hover{color:#fff!important;background:transparent!important}' +
            'body.nf-menu2 .menu__item.focus .menu__text{font-weight:800}' +
            'body.nf-menu2 .menu__item.focus .menu__ico::after,body.nf-menu2 .menu__item.nf-current .menu__ico::after{content:"";position:absolute;left:12%;right:12%;bottom:-.28em;height:.15em;border-radius:1em;background:#e50914}' +
            'body.nf-menu2 .menu__item.nf-current{color:#d0d0d0!important}' +
            'body.nf-menu-w1 .wrap__left,body.nf-menu-w2 .wrap__left{overflow:visible!important}' +
            'body.nf-menu-w1 .wrap__left::before,body.nf-menu-w2 .wrap__left::before{content:"";position:absolute;top:0;bottom:0;left:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.94) 70%,rgba(0,0,0,0) 100%)}' +
            'body.nf-menu-w1 .wrap__left::before{width:21em}' +
            'body.nf-menu-w2 .wrap__left::before{width:26em}';

        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = css;
        document.head.appendChild(s);
    }

    function markCurrent() {
        var id = '';
        try {
            var a = Lampa.Activity.active();
            if (a) {
                var c = String(a.component || ''), u = String(a.url || '');
                if (c === 'main') id = 'main';
                else if (u === 'movie') id = 'movie';
                else if (u === 'tv') id = 'tv';
                else if (c.indexOf('favorite') > -1 || c.indexOf('bookmark') > -1) id = 'favorite';
                else id = c || u;
            }
        } catch (e) {}

        $('.wrap__left .menu__item').each(function () {
            $(this).toggleClass('nf-current', !!id && $(this).data('action') === id);
        });
    }

    function addSearch() {
        if ($('.nf-search-item').length) return;
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;

        var li = $('<li class="menu__item selector nf-search-item" data-action="nf_search"><div class="menu__ico">' + ICON_SEARCH + '</div><div class="menu__text">Поиск</div></li>');
        li.on('hover:enter', function () {
            try {
                var b = $('.open--search').first();
                if (b.length) b.trigger('hover:enter');
                else Lampa.Search.open();
            } catch (e) {}
        });
        list.prepend(li);
    }

    function addProfile() {
        if ($('.nf-profile-item').length) return;
        var list = $('.wrap__left .menu__list').first();
        if (!list.length) return;

        var li = $('<li class="menu__item selector nf-profile-item" data-action="nf_profile"><div class="menu__ico">' + ICON_PROFILE + '</div><div class="menu__text">Профиль</div></li>');
        li.on('hover:enter', function () {
            try { $('.open--profile').first().trigger('hover:enter'); } catch (e) {}
        });
        list.append(li);
    }

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
                field: { name: 'Открывать раздел сразу (как YouTube)', description: '↑↓ сразу меняют категорию, ОК нажимать не нужно' }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_keep', type: 'trigger', 'default': true },
                field: { name: 'Меню не закрывается', description: 'Закрыть меню можно только кнопкой ВПРАВО' }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_delay', type: 'select', values: { '150': 'Мгновенно', '300': 'Быстро', '500': 'Нормально', '700': 'Медленно' }, 'default': '250' },
                field: { name: 'Скорость реакции' }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_width', type: 'select', values: { '0': 'Обычная', '1': 'Чуть шире', '2': 'Широкая' }, 'default': '1' },
                field: { name: 'Ширина меню' },
                onChange: applyWidth
            });
        } catch (e) {}
    }

    function applyWidth() {
        var v = String(Lampa.Storage.get('nf_menu_width', '1'));
        document.body.classList.toggle('nf-menu-w1', v === '1');
        document.body.classList.toggle('nf-menu-w2', v === '2');
    }

    function autoOn()  { var v = Lampa.Storage.get('nf_menu_auto', 'true');  return v === true || v === 'true'; }
    function keepOn()  { var v = Lampa.Storage.get('nf_menu_keep', 'true');  return v === true || v === 'true'; }
    function delayMs() { var d = parseInt(Lampa.Storage.get('nf_menu_delay', '250'), 10); return isFinite(d) ? d : 250; }

    // ========== ГЛАВНАЯ ЛОГИКА (YouTube-style) ==========

    var timer = null;
    var lastEl = null;
    var ignore = 0;
    var holding = false;

    function holdMenu(el) {
        if (!keepOn()) return;
        holding = true;

        // Несколько быстрых попыток вернуть меню (Лампа очень упрямая)
        [40, 100, 200, 350, 550].forEach(function (ms) {
            setTimeout(function () {
                if (!holding) return;
                try {
                    document.body.classList.add('menu--open');
                    $('.wrap__left').removeClass('wrap__left--hidden');
                    Lampa.Controller.toggle('menu');
                    if (el && el[0]) Lampa.Controller.focus(el[0]);
                } catch (e) {}
            }, ms);
        });
    }

    function release() {
        holding = false;
    }

    function bind() {
        // Вправо / ОК / Назад — разрешаем закрыть меню
        document.addEventListener('keydown', function (e) {
            if ([39, 13, 8, 27, 4, 461, 10009].indexOf(e.keyCode) > -1) {
                release();
            }
        }, true);

        // При наведении на пункт меню
        $(document).on('hover:focus', '.menu__item', function () {
            if (!autoOn()) return;
            if (!document.body.classList.contains('menu--open')) return;

            var el = $(this);
            var action = el.data('action');

            // Только безопасные категории
            if (!SAFE[action]) return;

            // Не повторяем один и тот же пункт слишком часто
            if (el[0] === lastEl && Date.now() < ignore) return;

            clearTimeout(timer);

            timer = setTimeout(function () {
                if (!el.hasClass('focus')) return;
                if (!document.body.classList.contains('menu--open')) return;

                lastEl = el[0];
                ignore = Date.now() + 600;

                // Открываем категорию
                el.trigger('hover:enter');

                // И сразу держим меню открытым
                holdMenu(el);
            }, delayMs());
        });

        // Если Лампа всё-таки сняла класс — возвращаем
        if (window.MutationObserver) {
            new MutationObserver(function () {
                if (holding && !document.body.classList.contains('menu--open')) {
                    try {
                        document.body.classList.add('menu--open');
                        $('.wrap__left').removeClass('wrap__left--hidden');
                        Lampa.Controller.toggle('menu');
                    } catch (e) {}
                }
                markCurrent();
            }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }

    function start() {
        injectStyle();
        registerSettings();
        applyWidth();
        bind();
        document.body.classList.add('nf-menu2');

        var n = 0;
        var t = setInterval(function () {
            addSearch();
            addProfile();
            markCurrent();
            if (++n > 30) {
                clearInterval(t);
                setInterval(function () { addSearch(); addProfile(); }, 3000);
            }
        }, 400);

        console.log('[NF Menu] v' + VERSION + ' YouTube-style');
        try { Lampa.Noty.show('Меню Netflix v' + VERSION + ' (как YouTube)'); } catch (e) {}
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });
})();

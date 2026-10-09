(function () {
    'use strict';

    if (!window.Lampa) return;

    var VERSION = 8; // поднял версию
    if (window.nf_menu_version && window.nf_menu_version >= VERSION) return;
    window.nf_menu_version = VERSION;

    /*
     * Меню слева в стиле Netflix.
     * Теперь при листании пунктов меню раздел открывается сразу,
     * а само меню остаётся открытым, пока ты сам не нажмёшь вправо/ОК.
     */

    var STYLE_ID = 'nf-menu-style';

    var ICON_PROFILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();

        var css = '' +
            'body.nf-menu2 .wrap__left{background:linear-gradient(90deg,rgba(0,0,0,.98) 0%,rgba(0,0,0,.94) 62%,rgba(0,0,0,0) 100%)!important;border:0!important}' +
            'body.nf-menu2.menu--open .wrap__content{filter:brightness(.4);transition:filter .3s ease}' +
            'body.nf-menu2 .wrap__content{transition:filter .3s ease}' +

            'body.nf-menu2 .menu__item{background:transparent!important;color:#8c8c8c!important;border-radius:0!important;' +
            'margin:.25em 0;transition:color .2s ease}' +
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
            'body.nf-menu-w1 .wrap__left::before,body.nf-menu-w2 .wrap__left::before{content:"";position:absolute;' +
            'top:0;bottom:0;left:0;z-index:-1;pointer-events:none;' +
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

    var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';

    var MINE = ['nf_search', 'Поиск'];

    function sortArr() {
        try {
            var v = Lampa.Storage.get('menu_sort', '[]');
            if (typeof v === 'string') v = JSON.parse(v);
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    }

    function mineIndex(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (typeof arr[i] === 'string' && MINE.indexOf(arr[i]) > -1) return i;
        }
        return -1;
    }

    function migrateOnce() {
        var done = Lampa.Storage.get('nf_search_first_done', 'false');
        if (done === true || done === 'true') return false;
        try {
            var arr = sortArr();
            var i = mineIndex(arr);
            if (i > 0) {
                var entry = arr.splice(i, 1)[0];
                arr.unshift(entry);
                Lampa.Storage.set('menu_sort', arr);
            }
        } catch (e) { }
        Lampa.Storage.set('nf_search_first_done', 'true');
        return true;
    }

    function addSearch() {
        if ($('.nf-search-item').length) return;
        var list = $('.wrap__left .menu__list').first();
        if (!list.length || !list.children().length) return;

        var li = $('<li class="menu__item selector nf-search-item" data-action="nf_search">' +
            '<div class="menu__ico">' + ICON_SEARCH + '</div>' +
            '<div class="menu__text">Поиск</div></li>');
        li.on('hover:enter', function () {
            try {
                var headBtn = $('.open--search').first();
                if (headBtn.length) headBtn.trigger('hover:enter');
                else Lampa.Search.open();
            } catch (e) { }
        });
        list.prepend(li);

        setTimeout(function () {
            var moved = migrateOnce();
            var inSort = mineIndex(sortArr()) > -1;
            if (moved || !inSort) {
                li.parent().prepend(li);
            }
        }, 500);
    }

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
        list.append(li);
    }

    // ========== УСИЛЕННОЕ УДЕРЖАНИЕ МЕНЮ ==========
    var SAFE_ACTIONS = ['main', 'feed', 'movie', 'cartoon', 'tv', 'myperson', 'relise', 'anime', 'favorite', 'history', 'subscribes', 'timetable', 'mytorrents'];
    var SAFE_TEXTS = ['Главная', 'Лента', 'Фильмы', 'Мультфильмы', 'Сериалы', 'Персоны', 'Релизы', 'Аниме', 'Избранное', 'История', 'Подписки', 'Расписание', 'Торренты'];
    
    var autoTimer = null;
    var initialSeen = false;
    var wasOpen = false;
    var keepTimer = null;
    var ignoreUntil = 0;
    var lastAutoEl = null;
    var userForcedClose = false; // пользователь сам нажал вправо/ОК

    function autoOn() {
        var v = Lampa.Storage.get('nf_menu_auto', 'true');
        return v === true || v === 'true';
    }

    function keepOn() {
        var v = Lampa.Storage.get('nf_menu_keep', 'true');
        return v === true || v === 'true';
    }

    function delayMs() {
        var d = parseInt(Lampa.Storage.get('nf_menu_delay', '400'), 10);
        return isFinite(d) ? d : 400;
    }

    function isSafeItem(el) {
        var a = el.data('action');
        var t = $.trim(el.find('.menu__text').text());
        return SAFE_ACTIONS.indexOf(a) > -1 || SAFE_TEXTS.indexOf(t) > -1;
    }

    function stopKeep() {
        if (keepTimer) {
            clearInterval(keepTimer);
            keepTimer = null;
        }
    }

    // Сильно держим меню открытым + возвращаем фокус на пункт
    function startKeep(el) {
        stopKeep();
        userForcedClose = false;

        var tries = 0;
        keepTimer = setInterval(function () {
            if (userForcedClose) return stopKeep();

            tries++;
            if (tries > 40) return stopKeep(); // ~6 секунд максимум

            try {
                // Если меню закрылось — открываем обратно
                if (!document.body.classList.contains('menu--open')) {
                    Lampa.Controller.toggle('menu');
                }

                // Возвращаем фокус на наш пункт меню
                if (el && el.length && !el.hasClass('focus')) {
                    Lampa.Controller.focus(el[0]);
                }
            } catch (e) { }
        }, 150);
    }

    function registerSettings() {
        try {
            Lampa.SettingsApi.addComponent({
                component: 'nf_menu',
                name: 'Меню Netflix',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_auto', type: 'trigger', 'default': true },
                field: {
                    name: 'Открывать раздел сразу при выборе',
                    description: 'Задержался на пункте меню — раздел открывается без нажатия «ОК»'
                }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_keep', type: 'trigger', 'default': true },
                field: {
                    name: 'Оставаться в меню при переключении',
                    description: 'Листай меню вверх и вниз, разделы меняются сами. Нажимать «ОК» или «вправо» не нужно'
                }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_delay', type: 'select', values: { '250': 'Очень быстро', '400': 'Быстро', '700': 'Не спеша' }, 'default': '400' },
                field: {
                    name: 'Скорость переключения',
                    description: 'Сколько нужно задержаться на пункте меню, чтобы раздел открылся'
                }
            });
            Lampa.SettingsApi.addParam({
                component: 'nf_menu',
                param: { name: 'nf_menu_width', type: 'select', values: { '0': 'Обычная', '1': 'Чуть шире', '2': 'Широкая' }, 'default': '1' },
                field: { name: 'Ширина меню', description: 'Тёмная панель меню растягивается вправо, постеры на экране не двигаются' },
                onChange: function () { applyWidth(); }
            });
        } catch (e) { }
    }

    function applyWidth() {
        var v = String(Lampa.Storage.get('nf_menu_width', '1'));
        document.body.classList.toggle('nf-menu-w1', v === '1');
        document.body.classList.toggle('nf-menu-w2', v === '2');
    }

    function bindAutoOpen() {
        // Пользователь сам нажал вправо / ОК / назад → больше не держим меню
        document.addEventListener('keydown', function (e) {
            if ([39, 13, 8, 27, 4, 461, 10009].indexOf(e.keyCode) > -1) {
                userForcedClose = true;
                stopKeep();
            }
        }, true);

        $(document).on('hover:focus', '.menu__item', function () {
            if (!autoOn() || !document.body.classList.contains('menu--open')) return;
            var el = $(this);

            if (el[0] === lastAutoEl && Date.now() < ignoreUntil) return;
            if (!initialSeen) { initialSeen = true; return; }

            clearTimeout(autoTimer);
            if (!isSafeItem(el)) return;
            if (el.data('action') === currentAction()) return;

            autoTimer = setTimeout(function () {
                if (!(el.hasClass('focus') && document.body.classList.contains('menu--open'))) return;

                lastAutoEl = el[0];
                ignoreUntil = Date.now() + 1200;

                // Открываем раздел
                el.trigger('hover:enter');

                // И сразу жёстко возвращаем меню + фокус
                if (keepOn()) {
                    setTimeout(function () {
                        try {
                            if (!document.body.classList.contains('menu--open')) {
                                Lampa.Controller.toggle('menu');
                            }
                            Lampa.Controller.focus(el[0]);
                        } catch (e) { }
                        startKeep(el);
                    }, 80);
                }
            }, delayMs());
        });
    }

    function start() {
        injectStyle();
        registerSettings();
        applyWidth();
        bindAutoOpen();
        document.body.classList.add('nf-menu2');

        if (window.MutationObserver) {
            new MutationObserver(function () {
                var open = document.body.classList.contains('menu--open');
                if (open && !wasOpen) {
                    initialSeen = false;
                    userForcedClose = false;
                }
                if (!open) clearTimeout(autoTimer);
                wasOpen = open;
                markCurrent();
            }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        var tries = 0;
        var timer = setInterval(function () {
            addSearch();
            addProfile();
            markCurrent();
            if (++tries > 20) {
                clearInterval(timer);
                setInterval(function () { addSearch(); addProfile(); }, 2000);
            }
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

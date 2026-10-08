(function () {
    'use strict';

    var VERSION = 7;
    if (window.nf_ui_version && window.nf_ui_version >= VERSION) return;
    window.nf_ui_version = VERSION;

    // убираем следы старых версий
    try { $('#nf-interface-style, #nf-focus, #nf-rail').remove(); } catch (e) { }

    // ===================== НАСТРОЙКИ В ЛАМПЕ =====================
    var PARAMS = [
        { name: 'nf_ui_enable', title: 'Включить интерфейс Netflix', desc: 'Главный выключатель. Если выключить, Лампа выглядит как обычно' },
        { name: 'nf_ui_rect', title: 'Прямоугольные постеры и актёры', desc: 'Острые углы у постеров и прямоугольные фото актёров' },
        { name: 'nf_ui_menu', title: 'Красивое меню слева', desc: 'Тёмная панель и плавное выделение пунктов. Размеры меню не меняются' },
        { name: 'nf_ui_rail', title: 'Узкая полоса значков слева', desc: 'Значки меню всегда на экране, как у Netflix. Название пунктов видно при открытии меню' },
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
            .toggleClass('nf-rect', master && on('nf_ui_rect'))
            .toggleClass('nf-menu', master && on('nf_ui_menu'))
            .toggleClass('nf-rail-on', master && on('nf_ui_rail'))
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
            // --- прямоугольные постеры и актёры ---
            'body.nf-rect .card__view,body.nf-rect .card__img{border-radius:0!important}' +
            'body.nf-rect .card .card__view::after{border-radius:0!important}' +
            'body.nf-rect .full-start__poster,body.nf-rect .full-start-new__poster,' +
            'body.nf-rect .full-start__img,body.nf-rect .full-start-new__img{border-radius:0!important}' +
            'body.nf-rect .full-person__photo{border-radius:0!important;width:6em!important;height:9em!important;overflow:hidden}' +
            'body.nf-rect .full-person__photo img{width:100%!important;height:100%!important;object-fit:cover}' +

            // --- страница фильма: кнопки столбиком ---
            'body.nf-full .full-start-new__buttons,body.nf-full .full-start__buttons{display:flex!important;' +
            'flex-direction:column!important;flex-wrap:nowrap!important;align-items:flex-start!important;gap:.4em}' +
            'body.nf-full .full-start__button{width:22em;max-width:100%;justify-content:flex-start;' +
            'background:rgba(255,255,255,.06)!important;border-radius:.3em;padding:.7em 1em!important;' +
            'margin:0!important;font-size:1.05em}' +
            'body.nf-full .full-start__button.focus{background:rgba(255,255,255,.14)!important;' +
            'outline:.15em solid #fff;outline-offset:-.15em;box-shadow:none!important}' +

            // --- одна общая белая рамка выбора (улучшенная) ---
            '#nf-focus{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;opacity:0;' +
            'border:.18em solid #fff;border-radius:0;box-shadow:0 0 1.4em rgba(0,0,0,.6),0 0 0 .05em rgba(255,255,255,.3);' +
            'transition:opacity .12s ease;will-change:transform,width,height;box-sizing:border-box}' +
            '#nf-focus.fly{transition:transform .32s cubic-bezier(.25,.8,.25,1),width .32s cubic-bezier(.25,.8,.25,1),' +
            'height .32s cubic-bezier(.25,.8,.25,1),opacity .12s ease}' +
            // прячем родные рамки Лампы
            'body.nf-frame .card.focus .card__view::after,' +
            'body.nf-frame .card.focus .card__img::after{border:0!important;box-shadow:none!important;outline:none!important}' +
            'body.nf-frame .selector.focus:not(.full-start__button),' +
            'body.nf-frame .menu__item.focus,body.nf-frame .menu__item.traverse,' +
            'body.nf-frame .full-start__button.focus{outline:none!important;box-shadow:none!important}' +
            'body.nf-frame .card.focus{outline:none!important}' +

            // --- красивое меню слева (ближе к Netflix) ---
            'body.nf-menu .wrap__left{background:linear-gradient(to right,rgba(0,0,0,.96),rgba(0,0,0,.75) 80%,rgba(0,0,0,0))!important}' +
            'body.nf-menu .menu__item{transition:background-color .2s ease,color .2s ease,transform .15s ease;border-radius:.25em;margin:.15em .4em}' +
            'body.nf-menu .menu__text{font-weight:400;letter-spacing:.01em}' +
            'body.nf-menu .menu__item.focus,body.nf-menu .menu__item.hover{background:rgba(255,255,255,.12)!important;color:#fff!important}' +
            // когда рамка включена — фон пункта прозрачный
            'body.nf-menu.nf-frame .menu__item.focus,body.nf-menu.nf-frame .menu__item.hover{background:transparent!important;color:#fff!important}' +
            'body.nf-menu.nf-frame .menu__item.focus .menu__ico [stroke]{stroke:#fff!important}' +
            'body.nf-menu.nf-frame .menu__item.focus .menu__ico path[fill],' +
            'body.nf-menu.nf-frame .menu__item.focus .menu__ico rect[fill],' +
            'body.nf-menu.nf-frame .menu__item.focus .menu__ico circle[fill]{fill:#fff!important}' +
            'body.nf-menu .head__profile,body.nf-menu .profile{transition:opacity .2s}' +
            'body.nf-menu .menu__list{padding-top:.5em}' +

            // --- узкая полоса значков слева ---
            '#nf-rail{position:fixed;left:0;bottom:0;z-index:20;display:none;flex-direction:column;' +
            'justify-content:center;align-items:center;background:linear-gradient(to right,rgba(0,0,0,.85),rgba(0,0,0,0))}' +
            '#nf-rail.show{display:flex}' +
            'body.menu--open #nf-rail{opacity:0;pointer-events:none}' +
            '.nf-rail__list{display:flex;flex-direction:column;align-items:center;gap:1.5em}' +
            '.nf-rail__item{position:relative;width:1.75em;height:1.75em;opacity:.65;cursor:pointer;transition:opacity .2s,transform .15s}' +
            '.nf-rail__item:hover,.nf-rail__item.active{opacity:1;transform:scale(1.08)}' +
            '.nf-rail__item svg{width:100%;height:100%;display:block}' +
            '.nf-rail__item [stroke]{stroke:#fff}' +
            '.nf-rail__item path[fill]:not([fill=none]),.nf-rail__item rect[fill]:not([fill=none]),' +
            '.nf-rail__item circle[fill]:not([fill=none]){fill:#fff}' +
            '.nf-rail__item.active::after{content:"";position:absolute;left:18%;right:18%;bottom:-.45em;height:.16em;' +
            'border-radius:1em;background:#e50914}';
        $('body').append('<style id="nf-interface-style">' + css + '</style>');
    }

    // ===================== ПЛАВНАЯ БЕЛАЯ РАМКА ВЫБОРА (ИСПРАВЛЕННАЯ) =====================
    var frame, lastEl = null, shown = false, flyTimer, lastRect = null;

    function hideFrame() {
        if (!frame) return;
        frame.style.opacity = '0';
        shown = false;
        lastEl = null;
        lastRect = null;
    }

    function isVisible(el) {
        if (!el || !el.getClientRects) return false;
        var rects = el.getClientRects();
        if (!rects.length) return false;
        var style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    }

    function anyOverlay() {
        return !!document.querySelector('.player, .selectbox, .modal, .search, .settings, .about');
    }

    function findFocusTarget() {
        var candidates = document.querySelectorAll('.focus, .selector.focus, .card.focus, .menu__item.focus, .full-start__button.focus');
        var best = null;
        var bestArea = 0;

        for (var i = 0; i < candidates.length; i++) {
            var el = candidates[i];
            if (!isVisible(el)) continue;

            // Пропускаем элементы внутри левого меню, если меню закрыто
            if (el.closest && el.closest('.wrap__left') && !document.body.classList.contains('menu--open')) continue;

            var target = el;
            if (el.classList.contains('card') || el.querySelector('.card__view')) {
                var view = el.querySelector('.card__view') || el.querySelector('.card__img');
                if (view && isVisible(view)) target = view;
            }

            var r = target.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) continue;
            if (r.bottom < -20 || r.top > window.innerHeight + 20) continue;
            if (r.right < -20 || r.left > window.innerWidth + 20) continue;

            var area = r.width * r.height;
            if (area > bestArea) {
                bestArea = area;
                best = target;
            }
        }
        return best;
    }

    function updateFrame() {
        if (!document.body.classList.contains('nf-frame') || anyOverlay()) {
            return hideFrame();
        }

        var target = findFocusTarget();
        if (!target) return hideFrame();

        var r = target.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return hideFrame();

        var pad = 3;
        var newLeft = Math.round(r.left - pad);
        var newTop = Math.round(r.top - pad);
        var newW = Math.round(r.width + pad * 2);
        var newH = Math.round(r.height + pad * 2);

        var sameEl = (target === lastEl);
        var moved = !lastRect ||
            Math.abs(lastRect.left - newLeft) > 1 ||
            Math.abs(lastRect.top - newTop) > 1 ||
            Math.abs(lastRect.width - newW) > 1 ||
            Math.abs(lastRect.height - newH) > 1;

        if (!sameEl || moved) {
            if (shown && sameEl === false) {
                frame.classList.add('fly');
                clearTimeout(flyTimer);
                flyTimer = setTimeout(function () {
                    if (frame) frame.classList.remove('fly');
                }, 360);
            } else if (!shown) {
                frame.classList.remove('fly');
            }
            lastEl = target;
        }

        frame.style.opacity = '1';
        frame.style.width = newW + 'px';
        frame.style.height = newH + 'px';
        frame.style.transform = 'translate3d(' + newLeft + 'px,' + newTop + 'px,0)';

        lastRect = { left: newLeft, top: newTop, width: newW, height: newH };
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

    // ===================== УЗКАЯ ПОЛОСА ЗНАЧКОВ СЛЕВА =====================
    var RAIL_ITEMS = [
        { id: 'search', text: 'Поиск' },
        { id: 'main', text: 'Главная' },
        { id: 'movie', text: 'Фильмы' },
        { id: 'tv', text: 'Сериалы' },
        { id: 'favorite', text: 'Избранное' },
        { id: 'catalog', text: 'Каталог' }
    ];
    var SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
    var railBuilt = false, railLogged = false;

    function nativeItem(it) {
        return $('.wrap__left .menu__item').filter(function () {
            var el = $(this);
            return el.data('action') === it.id || $.trim(el.find('.menu__text').text()) === it.text;
        }).first();
    }

    function buildRail() {
        if (railBuilt || !$('.wrap__left .menu__item').length) return;
        var list = $('<div class="nf-rail__list"></div>');

        RAIL_ITEMS.forEach(function (it) {
            var icon = '', native = null;
            if (it.id === 'search') {
                icon = SEARCH_SVG;
            } else {
                native = nativeItem(it);
                if (!native.length) return;
                icon = native.find('.menu__ico').html();
            }
            var btn = $('<div class="nf-rail__item" data-id="' + it.id + '" title="' + it.text + '">' + icon + '</div>');
            btn.on('click', function () {
                try {
                    if (it.id === 'search') {
                        var head = $('.open--search').first();
                        if (head.length) head.trigger('hover:enter'); else Lampa.Search.open();
                    } else {
                        native.trigger('hover:enter');
                    }
                } catch (e) { }
            });
            list.append(btn);
        });

        if (!list.children().length) return;
        $('body').append($('<div id="nf-rail"></div>').append(list));
        railBuilt = true;
    }

    function activeId() {
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

    var lastGutter = 0;

    function updateRail() {
        var rail = document.getElementById('nf-rail');
        var b = document.body;
        if (!rail) return buildRail();

        if (!b.classList.contains('nf-rail-on') || anyOverlay()) {
            rail.classList.remove('show');
            return;
        }

        if (!b.classList.contains('menu--open')) {
            var left = 99999;
            ['.wrap__content .items-line__title', '.wrap__content .card', '.wrap__content .full-start__poster',
                '.wrap__content .full-start-new__poster'].forEach(function (sel) {
                var n = document.querySelector(sel);
                if (n) {
                    var r = n.getBoundingClientRect();
                    if (r.width > 0 && r.left >= 0 && r.left < left) left = r.left;
                }
            });
            lastGutter = left === 99999 ? 0 : left;
        }

        var width = Math.min(lastGutter - 8, 80);
        if (width < 44) {
            rail.classList.remove('show');
            if (!railLogged) { railLogged = true; console.log('[NF Interface] rail hidden: not enough free space on the left (' + Math.round(lastGutter) + 'px)'); }
            return;
        }

        var head = document.querySelector('.head');
        rail.style.top = (head ? head.getBoundingClientRect().bottom : 0) + 'px';
        rail.style.width = width + 'px';
        rail.classList.add('show');

        var act = activeId();
        $(rail).find('.nf-rail__item').each(function () {
            $(this).toggleClass('active', $(this).data('id') === act);
        });
    }

    function initRail() {
        setInterval(function () {
            try { updateRail(); } catch (e) { }
        }, 400);
    }

    // ===================== СТАРТ =====================
    function start() {
        registerSettings();
        addStyles();
        initFrame();
        initRail();
        apply();
        console.log('[NF Interface] v' + VERSION + ' loaded (frame fixed)');
        try { Lampa.Noty.show('Интерфейс Netflix: версия ' + VERSION + ' (рамка исправлена)'); } catch (e) { }
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

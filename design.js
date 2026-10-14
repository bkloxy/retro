/*
 * Lampa plugin: "Old design" + "Netflix" (v1.4)
 *
 * Settings has TWO separate sections:
 *   "\u0421\u0442\u0430\u0440\u044b\u0439 \u0434\u0438\u0437\u0430\u0439\u043d"  - square posters (on by default) and the experimental top title/rating block.
 *   "Netflix"        - separate interface mode (off by default): dark style, square posters,
 *                      big top area for the first row, left icon navigation panel.
 *
 * v1.4: fixed the white/black screen of the top block (the body class and the block element shared
 * one class name, so the block styles hid the whole page). Added the Netflix mode.
 *
 * Safety: if the plugin fails to start twice in a row it disables itself; if a start fails once,
 * the experimental parts are switched off automatically.
 * Manual kill switch (browser console):  localStorage.setItem('oldui_off', '1')
 */
(function () {
  'use strict';
  if (window.oldui_plugin_ready) return;
  window.oldui_plugin_ready = true;

  var VER = '1.4', GK = 'oldui_guard';
  function log() { try { console.log.apply(console, ['[oldui]'].concat([].slice.call(arguments))); } catch (e) {} }

  try { if (localStorage.getItem('oldui_off') === '1') { log('disabled by oldui_off'); return; } } catch (e) {}

  function gget() { try { return JSON.parse(localStorage.getItem(GK) || '{}'); } catch (e) { return {}; } }
  function gset(o) { try { localStorage.setItem(GK, JSON.stringify(o)); } catch (e) {} }
  var g = gget();
  if (g.v !== VER) g = { v: VER, boot: 0 };
  var prevBoot = g.boot || 0;
  if (prevBoot >= 2) { log('safe mode: previous starts did not finish, plugin disabled'); return; }
  g.boot = prevBoot + 1; gset(g);
  setTimeout(function () { var x = gget(); x.v = VER; x.boot = 0; gset(x); }, 8000);   // a start counts as good after 8 s

  function setCls(node, cls, state) {
    if (node && node.classList.contains(cls) !== !!state) node.classList.toggle(cls, !!state);
  }
  function on(name, def) {
    try {
      var v = Lampa.Storage.field(name);
      if (v === undefined || v === null || v === '') return def;
      return v === true || v === 'true';
    } catch (e) { return def; }
  }

  /* ---------- styles ---------- */
  // selectors that get sharp corners (used by both "square posters" and the Netflix mode)
  var SQUARE = [
    '.card .card__view', '.card .card__img', '.card .card__view::after', '.card .card__view::before',
    '.card-watched', '.card__quality', '.card__type',
    '.full-start__poster', '.full-start-new__poster', '.full-start__img', '.full-start-new__img', '.full--poster',
    '[class*="full-start"] [class*="poster"]', '[class*="full-start"] [class*="poster"] img',
    '[class*="full-start"] [class*="poster"]::before', '[class*="full-start"] [class*="poster"]::after'
  ];
  function squareCss() {
    var sel = [];
    SQUARE.forEach(function (s) { sel.push('body.oldui-square ' + s); sel.push('body.nf-on ' + s); });
    return sel.join(',') + '{border-radius:0 !important}';
  }

  var CSS = [
    squareCss(),

    /* ===== Old design: top info block (body class: oldui-info / oldui-main; element class: oldui-infobox) ===== */
    'body.oldui-info.oldui-main .items-line .card__title,',
    'body.oldui-info.oldui-main .items-line .card__age,',
    'body.oldui-info.oldui-main .items-line .card__vote{display:none !important}',
    'body.oldui-info.oldui-main .items-line:first-child{margin-top:6em}',

    '.oldui-infobox{position:fixed;left:0;right:0;z-index:5;display:none;align-items:center;gap:1.2em;',
    'padding:0 1.5em;box-sizing:border-box;pointer-events:none}',
    'body.oldui-info-show .oldui-infobox{display:flex}',
    '.oldui-infobox__rate{font-size:2.4em;font-weight:700;line-height:1;padding:.25em .45em;border-radius:.2em;background:rgba(0,0,0,.35)}',
    '.oldui-infobox__rate.hide{display:none}',
    '.oldui-infobox__body{min-width:0}',
    '.oldui-infobox__title{font-size:2.2em;font-weight:700;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.oldui-infobox__sub{font-size:1.3em;opacity:.7;margin-top:.25em}',

    /* ===== Netflix mode (body classes: nf-on, nf-rail-on, nf-hero-on, nf-main, nf-hero-ok, nf-hero-show;
       element classes: nf-rail*, nf-hero*) ===== */
    'body.nf-on{background:#141414;color:#fff}',
    'body.nf-on .items-line__title{font-weight:700;font-size:1.5em}',
    'body.nf-on .card.focus .card__view{transform:scale(1.06) !important;transition:transform .15s}',

    /* left navigation panel */
    '.nf-rail{position:fixed;left:0;bottom:0;width:4.2em;z-index:6;display:none;flex-direction:column;align-items:center;',
    'gap:1.2em;padding-top:1.5em;box-sizing:border-box;background:linear-gradient(90deg,rgba(20,20,20,.96),rgba(20,20,20,.7))}',
    'body.nf-rail-on .nf-rail{display:flex}',
    'body.nf-rail-on .activity__body{padding-left:4.2em;box-sizing:border-box}',
    '.nf-rail__btn{width:100%;height:2.6em;display:flex;align-items:center;justify-content:center;cursor:pointer;',
    'opacity:.65;border-left:.2em solid transparent;box-sizing:border-box}',
    '.nf-rail__btn:hover,.nf-rail__btn.active{opacity:1}',
    '.nf-rail__btn.active{border-left-color:#e50914}',
    '.nf-rail__btn svg{width:1.7em;height:1.7em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',

    /* big top area above the first row */
    'body.nf-hero-on.nf-main .items-line:first-child{margin-top:34vh}',
    'body.nf-hero-ok.nf-main .items-line:first-child .card__title,',
    'body.nf-hero-ok.nf-main .items-line:first-child .card__age,',
    'body.nf-hero-ok.nf-main .items-line:first-child .card__vote{display:none !important}',
    'body.nf-hero-on .oldui-infobox{display:none !important}',
    '.nf-hero{position:fixed;left:0;right:0;height:30vh;z-index:5;display:none;flex-direction:column;justify-content:flex-end;',
    'padding:0 2em 1.2em 2em;box-sizing:border-box;pointer-events:none;',
    'background:linear-gradient(90deg,rgba(20,20,20,.88) 0%,rgba(20,20,20,.35) 55%,rgba(20,20,20,0) 100%)}',
    'body.nf-rail-on .nf-hero{left:4.2em}',
    'body.nf-hero-show .nf-hero{display:flex}',
    '.nf-hero__title{font-size:3.2em;font-weight:800;line-height:1.1;text-shadow:0 .05em .3em rgba(0,0,0,.6);',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.nf-hero__meta{display:flex;align-items:center;gap:.8em;margin-top:.5em;font-size:1.4em;opacity:.9}',
    '.nf-hero__rate{font-weight:700;padding:.15em .5em;border-radius:.2em;background:rgba(0,0,0,.45)}',
    '.nf-hero__rate.hide{display:none}'
  ].join('\n');

  function injectCss() {
    var st = document.createElement('style');
    st.id = 'oldui-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- settings (two separate sections) ---------- */
  function applyBodyClasses() {
    var b = document.body, nf = on('nf_on', false);
    setCls(b, 'oldui-square', on('oldui_square', true));
    setCls(b, 'oldui-info', on('oldui_info', false));
    setCls(b, 'nf-on', nf);
    setCls(b, 'nf-rail-on', nf && on('nf_rail', true));
    setCls(b, 'nf-hero-on', nf && on('nf_hero', true));
    last = null; lastNf = null;
    positionRail();
    syncObserver();
    schedule();
  }
  function addSection(id, name, params) {
    Lampa.SettingsApi.addComponent({
      component: id,
      name: name,
      icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="3" width="16" height="18" stroke="currentColor" stroke-width="2"/></svg>'
    });
    params.forEach(function (p) {
      Lampa.SettingsApi.addParam({
        component: id,
        param: { name: p[0], type: 'trigger', default: p[3] },
        field: { name: p[1], description: p[2] },
        onChange: applyBodyClasses
      });
    });
  }
  function addSettings() {
    try {
      addSection('oldui', '\u0421\u0442\u0430\u0440\u044b\u0439 \u0434\u0438\u0437\u0430\u0439\u043d', [
        ['oldui_square', '\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0435 \u043f\u043e\u0441\u0442\u0435\u0440\u044b', '\u041f\u0440\u044f\u043c\u044b\u0435 \u0443\u0433\u043b\u044b \u0443 \u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a \u0438 \u0443 \u043f\u043e\u0441\u0442\u0435\u0440\u0430 \u043d\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435 \u0444\u0438\u043b\u044c\u043c\u0430', true],
        ['oldui_info', '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u0440\u0435\u0439\u0442\u0438\u043d\u0433 \u0441\u0432\u0435\u0440\u0445\u0443', '\u042d\u043a\u0441\u043f\u0435\u0440\u0438\u043c\u0435\u043d\u0442\u0430\u043b\u044c\u043d\u043e. \u041d\u0430\u0434 \u043f\u0435\u0440\u0432\u044b\u043c \u0440\u044f\u0434\u043e\u043c \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439; \u0435\u0441\u043b\u0438 \u043c\u0435\u0441\u0442\u0430 \u043d\u0435\u0442, \u0431\u043b\u043e\u043a \u043d\u0435 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442\u0441\u044f', false]
      ]);
    } catch (e) { log('settings (old design) unavailable', e); }
    try {
      addSection('oldui_nf', 'Netflix', [
        ['nf_on', '\u0420\u0435\u0436\u0438\u043c Netflix', '\u0422\u0451\u043c\u043d\u044b\u0439 \u0441\u0442\u0438\u043b\u044c, \u043a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0435 \u043f\u043e\u0441\u0442\u0435\u0440\u044b. \u0412\u043a\u043b\u044e\u0447\u0430\u0435\u0442 \u043f\u0443\u043d\u043a\u0442\u044b \u043d\u0438\u0436\u0435', false],
        ['nf_rail', '\u041b\u0435\u0432\u0430\u044f \u043f\u0430\u043d\u0435\u043b\u044c', '\u0423\u0437\u043a\u0430\u044f \u043f\u0430\u043d\u0435\u043b\u044c \u0441 \u0438\u043a\u043e\u043d\u043a\u0430\u043c\u0438: \u043f\u043e\u0438\u0441\u043a, \u0433\u043b\u0430\u0432\u043d\u0430\u044f, \u0440\u0435\u043b\u0438\u0437\u044b, \u0444\u0438\u043b\u044c\u043c\u044b, \u0441\u0435\u0440\u0438\u0430\u043b\u044b, \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435', true],
        ['nf_hero', '\u0411\u043e\u043b\u044c\u0448\u0430\u044f \u0432\u0435\u0440\u0445\u043d\u044f\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c', '\u041a\u0440\u0443\u043f\u043d\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u0440\u0435\u0439\u0442\u0438\u043d\u0433 \u043d\u0430\u0434 \u043f\u0435\u0440\u0432\u044b\u043c \u0440\u044f\u0434\u043e\u043c \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439', true]
      ]);
    } catch (e) { log('settings (netflix) unavailable', e); }
  }

  /* ---------- shared helpers ---------- */
  var info = null, last = null, scheduled = false, errors = 0, nfErrors = 0, mo = null;
  var hero = null, rail = null, lastNf = null;

  function txt(el, sel) { var n = el.querySelector(sel); return n ? (n.textContent || '').trim() : ''; }
  function isMain() {
    try {
      var a = Lampa.Activity.active();
      if (a && a.component) return a.component === 'main';
    } catch (e) {}
    return !document.querySelector('.full-start, .full-start-new');
  }
  function headBottom() {
    var head = document.querySelector('.head');
    var b = head ? Math.round(head.getBoundingClientRect().bottom) : 0;
    return b > 0 ? b : 80;
  }

  /* ---------- old design: top info block (separate overlay, never inside Lampa containers) ---------- */
  function buildInfo() {
    info = document.createElement('div');
    info.className = 'oldui-infobox';
    info.innerHTML =
      '<div class="oldui-infobox__rate hide"></div>' +
      '<div class="oldui-infobox__body"><div class="oldui-infobox__title"></div><div class="oldui-infobox__sub"></div></div>';
    document.body.appendChild(info);
  }
  function hideInfo() { setCls(document.body, 'oldui-info-show', false); }

  function updateOld() {
    var body = document.body;
    if (!on('oldui_info', false)) { hideInfo(); setCls(body, 'oldui-main', false); return; }
    var main = isMain();
    setCls(body, 'oldui-main', main);
    var el = main ? document.querySelector('.card.focus') : null;
    if (!el) { hideInfo(); return; }
    var line = el.closest('.items-line');
    if (!line || !line.parentNode || line.parentNode.querySelector('.items-line') !== line) { hideInfo(); return; }   // first row only

    // place the overlay right under the header; show it only if there is real free space above the row
    var top = headBottom();
    if (line.getBoundingClientRect().top - top < 70) { hideInfo(); return; }
    if (info.style.top !== top + 'px') info.style.top = top + 'px';

    if (el !== last) {
      last = el;
      var vote = txt(el, '.card__vote');
      var rate = info.querySelector('.oldui-infobox__rate');
      rate.textContent = vote;
      setCls(rate, 'hide', !vote || vote === '0.0' || vote === '0');
      info.querySelector('.oldui-infobox__title').textContent = txt(el, '.card__title');
      info.querySelector('.oldui-infobox__sub').textContent = txt(el, '.card__age');
    }
    setCls(body, 'oldui-info-show', true);
  }

  /* ---------- Netflix mode ---------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    main: '<path d="M3 11l9-8 9 8v10H3z"/>',
    relise: '<rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    movie: '<rect x="3" y="4" width="18" height="16"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/>',
    tv: '<rect x="3" y="5" width="18" height="12"/><path d="M8 21h8M12 17v4"/>',
    favorite: '<path d="M6 3h12v18l-6-4-6 4z"/>'
  };
  var RAIL = [
    ['search', '\u041f\u043e\u0438\u0441\u043a'], ['main', '\u0413\u043b\u0430\u0432\u043d\u0430\u044f'], ['relise', '\u0420\u0435\u043b\u0438\u0437\u044b'],
    ['movie', '\u0424\u0438\u043b\u044c\u043c\u044b'], ['tv', '\u0421\u0435\u0440\u0438\u0430\u043b\u044b'], ['favorite', '\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435']
  ];
  // which native menu item (data-action) to press for each button; the first one that exists is used
  var ACTIONS = { main: ['main'], relise: ['relise', 'upcoming'], movie: ['movie'], tv: ['tv'], favorite: ['favorite', 'bookmarks', 'book'] };

  function noty(t) { try { Lampa.Noty.show(t); } catch (e) {} }
  function go(key) {
    try {
      if (key === 'search') {
        if (Lampa.Search && Lampa.Search.open) { Lampa.Search.open(); return; }
        var s = document.querySelector('.open--search');
        if (s && window.$) { window.$(s).trigger('hover:enter'); return; }
        noty('\u041f\u043e\u0438\u0441\u043a \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d'); return;
      }
      var $ = window.$ || window.jQuery;
      var list = ACTIONS[key] || [];
      for (var i = 0; i < list.length; i++) {
        var item = $ ? $('.menu__item[data-action="' + list[i] + '"]') : [];
        if (item.length) { item.first().trigger('hover:enter'); return; }
      }
      noty('\u0420\u0430\u0437\u0434\u0435\u043b \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0432 \u044d\u0442\u043e\u0439 \u0432\u0435\u0440\u0441\u0438\u0438 Lampa');
    } catch (e) { log('rail action failed', key, e); }
  }
  function buildRail() {
    rail = document.createElement('div');
    rail.className = 'nf-rail';
    rail.innerHTML = RAIL.map(function (r) {
      return '<div class="nf-rail__btn" data-nf="' + r[0] + '" title="' + r[1] + '"><svg viewBox="0 0 24 24">' + ICONS[r[0]] + '</svg></div>';
    }).join('');
    rail.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-nf]') : null;
      if (!t) return;
      var all = rail.querySelectorAll('.nf-rail__btn');
      for (var i = 0; i < all.length; i++) setCls(all[i], 'active', all[i] === t);
      go(t.getAttribute('data-nf'));
    });
    document.body.appendChild(rail);
  }
  function positionRail() {
    if (!rail) return;
    var top = headBottom() + 'px';
    if (rail.style.top !== top) rail.style.top = top;
  }

  function buildHero() {
    hero = document.createElement('div');
    hero.className = 'nf-hero';
    hero.innerHTML =
      '<div class="nf-hero__title"></div>' +
      '<div class="nf-hero__meta"><span class="nf-hero__rate hide"></span><span class="nf-hero__year"></span></div>';
    document.body.appendChild(hero);
  }

  function updateNf() {
    var body = document.body;
    if (!(on('nf_on', false) && on('nf_hero', true))) {
      setCls(body, 'nf-hero-show', false); setCls(body, 'nf-hero-ok', false); setCls(body, 'nf-main', false);
      return;
    }
    var main = isMain();
    setCls(body, 'nf-main', main);
    var el = main ? document.querySelector('.card.focus') : null;
    if (!el) { setCls(body, 'nf-hero-show', false); return; }
    var line = el.closest('.items-line');
    var first = line && line.parentNode ? line.parentNode.querySelector('.items-line') : null;   // first row of this screen
    var top = headBottom();
    // enough free space above the first row? (otherwise the big area stays hidden and captions are kept)
    var ok = !!first && (first.getBoundingClientRect().top - top >= Math.round(window.innerHeight * 0.26));
    setCls(body, 'nf-hero-ok', ok);
    if (!ok || first !== line) { setCls(body, 'nf-hero-show', false); return; }

    if (hero.style.top !== top + 'px') hero.style.top = top + 'px';
    if (el !== lastNf) {
      lastNf = el;
      var vote = txt(el, '.card__vote');
      var rate = hero.querySelector('.nf-hero__rate');
      rate.textContent = vote;
      setCls(rate, 'hide', !vote || vote === '0.0' || vote === '0');
      hero.querySelector('.nf-hero__title').textContent = txt(el, '.card__title');
      hero.querySelector('.nf-hero__year').textContent = txt(el, '.card__age');
    }
    setCls(body, 'nf-hero-show', true);
  }

  /* ---------- scheduling ---------- */
  function update() {
    try { updateOld(); } catch (e) {
      log('update error (old design)', e);
      if (++errors >= 5) { log('too many errors, top block disabled'); hideInfo(); try { Lampa.Storage.set('oldui_info', false); } catch (x) {} }
    }
    try { updateNf(); } catch (e) {
      log('update error (netflix)', e);
      if (++nfErrors >= 5) {
        log('too many errors, big top area disabled');
        var b = document.body; setCls(b, 'nf-hero-show', false); setCls(b, 'nf-hero-ok', false); setCls(b, 'nf-hero-on', false);
        try { Lampa.Storage.set('nf_hero', false); } catch (x) {}
      }
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      update();
    });
  }
  // observe focus changes only while a part that needs it is enabled
  function syncObserver() {
    var need = on('oldui_info', false) || (on('nf_on', false) && on('nf_hero', true));
    if (need && !mo) {
      mo = new MutationObserver(schedule);
      mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    } else if (!need && mo) {
      mo.disconnect(); mo = null; hideInfo();
      setCls(document.body, 'nf-hero-show', false);
    }
  }

  /* ---------- start ---------- */
  function start() {
    try {
      // the previous start never finished: switch the experimental parts off
      if (prevBoot >= 1) {
        try { Lampa.Storage.set('oldui_info', false); Lampa.Storage.set('nf_on', false); } catch (e) {}
      }
      injectCss();
      buildInfo();
      buildHero();
      buildRail();
      addSettings();
      applyBodyClasses();
      window.addEventListener('resize', function () { positionRail(); schedule(); });
      log('ready v' + VER);
    } catch (e) { log('start failed', e); }
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
/*
 * Lampa: мировые сборы фильмов из TMDB
 * Добавляет поле «Сборы» сразу после поля «Бюджет».
 * Если данных нет или значение равно нулю — поле не добавляется.
 */
(function () {
    'use strict';

    if (window.lampaBoxOfficePluginReady) return;
    window.lampaBoxOfficePluginReady = true;

    var MARK = 'data-lampa-box-office';

    var LABELS = {
        release: ['дата релиза', 'дата выхода', 'release date', 'date of release'],
        budget: ['бюджет', 'budget'],
        countries: ['страны', 'страна', 'countries', 'country']
    };

    function normalize(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .replace(/:$/, '');
    }

    function isLabel(value, variants) {
        return variants.indexOf(normalize(value)) !== -1;
    }

    function rootFromEvent(event) {
        var body = event && event.body;

        if (body && body[0] && body[0].nodeType === 1) {
            return body[0];
        }

        if (body && body.nodeType === 1) {
            return body;
        }

        return document.querySelector('.full-start, .full-start-new') || document;
    }

    function findLabel(root, variants) {
        var nodes = root.querySelectorAll('*');
        var found = null;

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            if (!isLabel(node.textContent, variants)) continue;

            var hasExactChild = false;

            for (var j = 0; j < node.children.length; j++) {
                if (isLabel(node.children[j].textContent, variants)) {
                    hasExactChild = true;
                    break;
                }
            }

            if (!hasExactChild) found = node;
        }

        return found;
    }

    function directBranch(ancestor, node) {
        var current = node;

        while (
            current &&
            current.parentElement &&
            current.parentElement !== ancestor
        ) {
            current = current.parentElement;
        }

        return current && current.parentElement === ancestor
            ? current
            : null;
    }

    function findMetadataRow(root, releaseLabel, budgetLabel, countriesLabel) {
        var current = budgetLabel;

        while (current && current !== root && current.parentElement) {
            var parent = current.parentElement;

            var releaseBranch = directBranch(parent, releaseLabel);
            var budgetBranch = directBranch(parent, budgetLabel);
            var countriesBranch = directBranch(parent, countriesLabel);

            if (
                releaseBranch &&
                budgetBranch &&
                countriesBranch &&
                releaseBranch !== budgetBranch &&
                countriesBranch !== budgetBranch &&
                releaseBranch !== countriesBranch &&
                parent.children.length >= 3
            ) {
                return parent;
            }

            current = parent;
        }

        return null;
    }

    function formatMoney(amount) {
        var rounded = Math.round(Number(amount));

        if (!isFinite(rounded) || rounded <= 0) return '';

        var digits = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

        return '$ ' + digits;
    }

    function deepestMatchingLabel(root, variants) {
        var nodes = root.querySelectorAll('*');
        var found = null;

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            if (!isLabel(node.textContent, variants)) continue;

            var exactChild = false;

            for (var j = 0; j < node.children.length; j++) {
                if (isLabel(node.children[j].textContent, variants)) {
                    exactChild = true;
                    break;
                }
            }

            if (!exactChild) found = node;
        }

        return found;
    }

    function clearIds(root) {
        if (root.removeAttribute) root.removeAttribute('id');

        var nodes = root.querySelectorAll('[id]');

        for (var i = 0; i < nodes.length; i++) {
            nodes[i].removeAttribute('id');
        }
    }

    function updateClonedField(field, value) {
        var label = deepestMatchingLabel(field, LABELS.budget);

        if (!label) return false;

        label.textContent = 'Сборы';

        var labelBranch = directBranch(field, label);
        var children = Array.prototype.slice.call(field.children);
        var valueBranch = null;

        for (var i = 0; i < children.length; i++) {
            if (
                children[i] !== labelBranch &&
                normalize(children[i].textContent)
            ) {
                valueBranch = children[i];
                break;
            }
        }

        if (!valueBranch) {
            var all = field.querySelectorAll('*');

            for (var k = 0; k < all.length; k++) {
                if (
                    all[k] !== label &&
                    !all[k].contains(label) &&
                    normalize(all[k].textContent)
                ) {
                    valueBranch = all[k];
                    break;
                }
            }
        }

        if (!valueBranch) return false;

        valueBranch.textContent = value;
        field.setAttribute(MARK, 'true');

        clearIds(field);

        return true;
    }

    function addBoxOffice(event) {
        try {
            var data = event && event.data;
            var movie = data && data.movie;

            // Не добавляем сборы сериалам.
            if (!movie || movie.name || movie.first_air_date) return;

            // Используем настоящие данные TMDB.
            var revenue = Number(movie.revenue || 0);
            var money = formatMoney(revenue);

            // Ноль означает, что достоверных сборов нет.
            if (!money) return;

            var root = rootFromEvent(event);

            if (!root || !root.querySelectorAll) return;

            var old = root.querySelector('[' + MARK + ']');

            if (old && old.parentElement) {
                old.parentElement.removeChild(old);
            }

            var releaseLabel = findLabel(root, LABELS.release);
            var budgetLabel = findLabel(root, LABELS.budget);
            var countriesLabel = findLabel(root, LABELS.countries);

            if (!releaseLabel || !budgetLabel || !countriesLabel) return;

            var row = findMetadataRow(
                root,
                releaseLabel,
                budgetLabel,
                countriesLabel
            );

            if (!row) return;

            var budgetBranch = directBranch(row, budgetLabel);

            if (!budgetBranch || !budgetBranch.parentNode) return;

            // Копируем оформление поля бюджета для нового поля сборов.
            var clone = budgetBranch.cloneNode(true);

            if (!updateClonedField(clone, money)) return;

            // Вставляем сразу после бюджета, перед странами.
            budgetBranch.parentNode.insertBefore(
                clone,
                budgetBranch.nextSibling
            );

        } catch (error) {
            try {
                console.warn(
                    '[lampa-box-office] Ошибка добавления сборов:',
                    error
                );
            } catch (ignore) {}
        }
    }

    function start() {
        if (
            !window.Lampa ||
            !Lampa.Listener ||
            !Lampa.Listener.follow
        ) {
            return;
        }

        Lampa.Listener.follow('full', function (event) {
            if (event && event.type === 'complite') {
                addBoxOffice(event);
            }
        });
    }

    if (window.appready) {
        start();
    } else if (
        window.Lampa &&
        Lampa.Listener &&
        Lampa.Listener.follow
    ) {
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') {
                start();
            }
        });
    } else {
        var tries = 0;

        var waiter = setInterval(function () {
            tries++;

            if (
                window.appready &&
                window.Lampa &&
                Lampa.Listener &&
                Lampa.Listener.follow
            ) {
                clearInterval(waiter);
                start();
            } else if (tries > 100) {
                clearInterval(waiter);
            }
        }, 250);
    }
})();

/*
 * Lampa: личные настройки интерфейса (oldx)
 *  - убрать «Комментарии» в карточке фильма
 *  - блок «Дата релиза / Бюджет / Сборы / Страны» вертикально, справа
 *  - пункт «Поиск» первым в боковом меню
 *  - экран выбора озвучки (Онлайн Мод): прямые углы у постера, постер крупнее, без описания
 *  - скругление постеров: прямые / слегка / как в Lampa (по умолчанию прямые)
 * Настройки: Настройки -> «Старый дизайн»
 */
(function () {
  'use strict';
  if (window.oldx_plugin_ready) return;
  window.oldx_plugin_ready = true;

  function log() { try { console.log.apply(console, ['[oldx]'].concat([].slice.call(arguments))); } catch (e) {} }
  function setCls(n, c, s) { if (n && n.classList.contains(c) !== !!s) n.classList.toggle(c, !!s); }
  function field(name, def) {
    try {
      var v = Lampa.Storage.field(name);
      return (v === undefined || v === null || v === '') ? def : v;
    } catch (e) { return def; }
  }
  function flag(name, def) { var v = field(name, def); return v === true || v === 'true'; }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/:$/, ''); }

  /* ---------- CSS ---------- */
  var POSTERS = [
    '.card .card__view', '.card .card__img', '.card-watched', '.card__quality', '.card__type',
    '.full-start__poster', '.full-start-new__poster', '.full-start__img', '.full-start-new__img', '.full--poster',
    '[class*="full-start"] [class*="poster"]', '[class*="full-start"] [class*="poster"] img',
    '.explorer-card__head-img', '.explorer-card__head-img img', '.explorer-card__head-img::after', '.explorer-card__head-img::before'
  ];
  function radiusCss(cls, val) {
    return POSTERS.map(function (s) { return 'body.' + cls + ' ' + s; }).join(',') + '{border-radius:' + val + ' !important}';
  }
  var CSS = [
    radiusCss('oldx-r-sharp', '0'),
    radiusCss('oldx-r-slight', '.35em'),

    /* без комментариев */
    'body.oldx-nocomm .full-review,body.oldx-nocomm .full-review-add,body.oldx-nocomm .full-reviews{display:none !important}',
    'body.oldx-nocomm .items-line:has(.full-review),body.oldx-nocomm .items-line:has(.full-review-add){display:none !important}',

    /* вертикальный блок данных справа */
    '.oldx-meta{display:flex !important;flex-direction:column !important;align-items:flex-start !important;gap:.9em !important;',
    'flex-wrap:nowrap !important;width:auto !important;max-width:35% !important;box-sizing:border-box}',
    '.oldx-wrap{display:flex !important;flex-direction:row !important;align-items:flex-start;gap:2em;width:100%;box-sizing:border-box}',
    '.oldx-wrap > :first-child{flex:1 1 auto;min-width:0}',
    '.oldx-wrap > .oldx-meta{flex:0 0 auto}',
    '.oldx-meta > *{margin:0 !important}',

    /* экран выбора озвучки (Онлайн Мод) */
    'body.oldx-nodescr .explorer-card__descr{display:none !important}',
    'body.oldx-poster-xl .explorer-card__head,body.oldx-poster-xl [class*="explorer-card__head"]:not([class*="__head-"]){display:flex !important;flex-direction:column !important;align-items:flex-start !important}',
    'body.oldx-poster-xl .explorer-card__head-body{margin:.8em 0 0 0 !important;padding:0 !important}',
    'body.oldx-poster-xl .explorer-card__head-img{width:100% !important;max-width:100% !important;margin:0 !important}',
    'body.oldx-poster-xl [class*="explorer-card"] [class*="head-img"]::before,body.oldx-poster-xl [class*="explorer-card"] [class*="head-img"]::after{display:none !important}'
  ].join('\n');

  function injectCss() {
    var st = document.createElement('style');
    st.id = 'oldx-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- body classes ---------- */
  function applyClasses() {
    var b = document.body, slight = flag('oldx_slight', false), sq = flag('oldui_square', true);
    setCls(b, 'oldx-r-slight', slight);
    setCls(b, 'oldx-r-sharp', sq && !slight);
    setCls(b, 'oldx-nocomm', flag('oldx_nocomm', true));
    setCls(b, 'oldx-nodescr', flag('oldx_nodescr', true));
    var big = flag('oldx_bigposter', true);
    setCls(b, 'oldx-poster-xl', big);
    bigPoster();
    killComments(document);
    menuSearch();
    metaRows(document);
  }

  function bigPoster() {
    try {
      var big = flag('oldx_bigposter', true);
      var img = document.querySelector('[class*="explorer-card"] img');
      if (!img) return;
      var box = img.parentElement;
      if (!box) return;
      var head = box.parentElement;
      var P = function (el, props) {
        for (var k in props) {
          if (big) el.style.setProperty(k, props[k], 'important'); else el.style.removeProperty(k);
        }
      };
      P(box, { width: '85%', 'max-width': '85%', height: 'auto', 'aspect-ratio': '2 / 3', position: 'relative', margin: '0' });
      P(img, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', 'object-fit': 'cover' });
      if (head && head !== document.body) P(head, { display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-start' });
    } catch (e) { log('poster', e); }
  }

  /* ---------- 1. комментарии ---------- */
  function killComments(root) {
    if (!flag('oldx_nocomm', true)) return;
    try {
      var n = root.querySelectorAll('.full-review, .full-review-add, .full-reviews');
      for (var i = 0; i < n.length; i++) {
        var line = n[i].closest('.items-line') || n[i].closest('.full-reviews');
        var el = line || n[i];
        if (el.parentNode) el.parentNode.removeChild(el);
      }
      var titles = root.querySelectorAll('.items-line__title');
      for (var j = 0; j < titles.length; j++) {
        var t = norm(titles[j].textContent);
        if (t === 'комментарии' || t === 'comments') {
          var ln = titles[j].closest('.items-line');
          if (ln && ln.parentNode) ln.parentNode.removeChild(ln);
        }
      }
    } catch (e) { log('comments', e); }
  }

  /* ---------- 2. вертикальный блок данных ---------- */
  var KEY = /^(дата (релиза|выхода)|бюджет|сборы|страны?|release|budget|countr|box office|сезон|эпизод|серий|статус|status)/;
  function metaLabels(scope) {
    var res = [], all = scope.querySelectorAll('div,span');
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      if (n.children.length === 0) {
        var t = norm(n.textContent);
        if (t && t.length < 30 && KEY.test(t)) res.push(n);
      }
    }
    return res;
  }
  function metaRows(root) {
    if (!flag('oldx_meta', true)) return;
    try {
      var scope = document.querySelector('.full-start, .full-start-new, .full-descr') ? document : null;
      if (!scope) return;
      var row = document.querySelector('.full-descr__details');
      if (!row) {
        var ls = metaLabels(document);
        if (ls.length < 2) return;
        var cur = ls[0];
        while (cur.parentElement && cur.parentElement !== document.body) {
          var p = cur.parentElement, cnt = 0;
          for (var k = 0; k < ls.length; k++) if (p.contains(ls[k])) cnt++;
          if (cnt === ls.length && p.children.length >= 2) { row = p; break; }
          cur = p;
        }
      }
      if (!row || row.classList.contains('oldx-wrapped')) return;
      row.classList.add('oldx-meta');
      var desc = document.querySelector('.full-descr__text, .full-start-new__descr, .full-start__descr');
      if (desc && desc.parentNode && !row.contains(desc) && !desc.contains(row)) {
        var wrap = document.createElement('div');
        wrap.className = 'oldx-wrap';
        desc.parentNode.insertBefore(wrap, desc);
        wrap.appendChild(desc);   // описание слева, сверху
        wrap.appendChild(row);    // плашка с данными справа от него
        row.classList.add('oldx-wrapped');
      }
    } catch (e) { log('meta', e); }
  }

  /* ---------- 3. «Поиск» первым в меню ---------- */
  var SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var lastOpen = 0;
  function openSearch() {
    var now = Date.now();
    if (now - lastOpen < 800) return;   // защита от двойного срабатывания
    lastOpen = now;
    try {
      var act = Lampa.Activity.active();
      if (act && act.component === 'search') return;
      // то же самое, что нажатие на лупу вверху — так поиск открывается ровно один раз
      var hb = document.querySelector('.open--search');
      if (hb && window.$) { window.$(hb).trigger('hover:enter'); return; }
      if (Lampa.Search && Lampa.Search.open) { Lampa.Search.open(); return; }
      Lampa.Activity.push({ url: '', title: 'Поиск', component: 'search', page: 1 });
    } catch (e) { log('search', e); }
  }
  function menuSearch() {
    try {
      var list = document.querySelector('.menu .menu__list');
      var mine = document.querySelector('.menu [data-oldx="search"]');
      if (!flag('oldx_search', true)) { if (mine && mine.parentNode) mine.parentNode.removeChild(mine); return; }
      if (!list) return;
      if (mine) { if (list.firstElementChild !== mine) list.insertBefore(mine, list.firstChild); return; }
      var li = document.createElement('li');
      li.className = 'menu__item selector';
      li.setAttribute('data-action', 'oldx_search');
      li.setAttribute('data-oldx', 'search');
      li.innerHTML = '<div class="menu__ico">' + SEARCH_SVG + '</div><div class="menu__text">Поиск</div>';
      if (window.$) window.$(li).on('hover:enter', openSearch);
      list.insertBefore(li, list.firstChild);
    } catch (e) { log('menu', e); }
  }

  /* ---------- настройки ---------- */
  function addSettings() {
    try {
      var T = function (name, title, descr, def) {
        Lampa.SettingsApi.addParam({
          component: 'oldui',
          param: { name: name, type: 'trigger', default: def },
          field: { name: title, description: descr },
          onChange: applyClasses
        });
      };
      T('oldx_nocomm', 'Скрыть комментарии', 'Убирает раздел «Комментарии» в карточке фильма/сериала', true);
      T('oldx_meta', 'Данные вертикально справа', 'Дата релиза, бюджет, сборы, страны — столбиком справа от описания', true);
      T('oldx_search', 'Поиск первым в меню', 'Добавляет пункт «Поиск» в начало бокового меню', true);
      T('oldx_nodescr', 'Без описания при выборе озвучки', 'Убирает текст описания на экране выбора озвучки/балансера', true);
      T('oldx_slight', 'Слегка скруглённые постеры', 'Небольшое скругление углов вместо прямых (если включено вместе с квадратными, побеждает скругление)', false);
      T('oldx_bigposter', 'Большой постер при выборе озвучки', 'Постер на всю ширину левой колонки, название под ним', true);
    } catch (e) { log('settings', e); }
  }

  /* ---------- запуск ---------- */
  var pending = false;
  function tick() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      killComments(document);
      menuSearch();
      metaRows(document);
      bigPoster();
    });
  }
  function start() {
    try {
      injectCss();
      addSettings();
      applyClasses();
      try {
        Lampa.Listener.follow('full', function (e) {
          if (e && (e.type === 'complite' || e.type === 'complete')) {
            [0, 300, 900].forEach(function (d) { setTimeout(tick, d); });
          }
        });
      } catch (e) {}
      try { Lampa.Storage.listener.follow('change', function () { setTimeout(applyClasses, 50); }); } catch (e) {}
      new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
      log('ready');
    } catch (e) { log('start failed', e); }
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();


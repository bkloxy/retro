/*
 * Lampa plugin: "Old design" + "Netflix" (v1.5)
 *
 * Settings has TWO separate sections:
 *   "Старый дизайн" - square posters (on by default) and the experimental top title/rating block.
 *   "Netflix"       - separate interface mode (off by default): dark style, square posters,
 *                     big top area for the first row, left icon navigation panel.
 *
 * v1.5: removed the boot counter that silently disabled the whole plugin after two short sessions
 *       (that was the reason the settings items disappeared on one TV box). The plugin now always starts.
 *       Errors are handled locally: each part switches itself off only if it keeps failing.
 *
 * Manual kill switch (browser console):  localStorage.setItem('oldui_off', '1')
 */
(function () {
  'use strict';
  if (window.oldui_plugin_ready) return;
  window.oldui_plugin_ready = true;

  var VER = '1.5';
  function log() { try { console.log.apply(console, ['[oldui]'].concat([].slice.call(arguments))); } catch (e) {} }

  try { if (localStorage.getItem('oldui_off') === '1') { log('disabled by oldui_off'); return; } } catch (e) {}

  // clean up the leftover counter of older versions (it could block the plugin)
  try { localStorage.removeItem('oldui_guard'); } catch (e) {}

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
    if (document.getElementById('oldui-style')) return;
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
  // Each step is isolated: a failure in one part must not stop the settings from appearing.
  function step(name, fn) {
    try { fn(); } catch (e) { log('step failed: ' + name, e); }
  }
  function start() {
    step('css', injectCss);
    step('settings', addSettings);          // settings first: they must appear no matter what
    step('info', buildInfo);
    step('hero', buildHero);
    step('rail', buildRail);
    step('classes', applyBodyClasses);
    step('resize', function () {
      window.addEventListener('resize', function () { positionRail(); schedule(); });
    });
    log('ready v' + VER);
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();

/*
 * Lampa plugin: "Old design" (v1.1)
 *  1. Square posters (sharp corners) instead of rounded ones.
 *  2. Title, original title, year and rating shown ABOVE the rows (like the 2021 version)
 *     instead of under/on the poster. Updates as the focus moves between cards.
 *  3. A movie logo instead of the title (if TMDB has one). No logo - plain text.
 *
 * In v1.1 only square posters are enabled by default (safe mode).
 * Items 2 and 3 are experimental: enable them manually in Settings -> "Old design".
 * Crash guard: if the plugin fails to start twice in a row, it disables itself.
 * The plugin does not replace Lampa core: only styles and one block above the rows on the home screen.
 */
(function () {
  'use strict';
  if (window.oldui_plugin_ready) return;
  window.oldui_plugin_ready = true;

  var VER = '1.1', GK = 'oldui_guard';
  function gget() { try { return JSON.parse(localStorage.getItem(GK) || '{}'); } catch (e) { return {}; } }
  function gset(o) { try { localStorage.setItem(GK, JSON.stringify(o)); } catch (e) {} }
  var g = gget();
  if (g.v !== VER) g = { v: VER, boot: 0 };
  if (g.boot >= 2) { try { console.log('[oldui] safe mode: \u043f\u043b\u0430\u0433\u0438\u043d \u043e\u0442\u043a\u043b\u044e\u0447\u0451\u043d, \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u0435 \u0437\u0430\u043f\u0443\u0441\u043a\u0438 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0438\u0441\u044c'); } catch (e) {} return; }
  g.boot = (g.boot || 0) + 1; gset(g);
  setTimeout(function () { var x = gget(); x.v = VER; x.boot = 0; gset(x); }, 8000);   // a start counts as successful after 8 seconds

  var LOG = '[oldui]';
  function log() { try { console.log.apply(console, [LOG].concat([].slice.call(arguments))); } catch (e) {} }

  function setCls(node, cls, state) {
    if (node.classList.contains(cls) !== !!state) node.classList.toggle(cls, !!state);
  }

  /* ---------- settings ---------- */
  function on(name, def) {
    try {
      var v = Lampa.Storage.field(name);
      if (v === undefined || v === null || v === '') return def;
      return v === true || v === 'true';
    } catch (e) { return def; }
  }
  function applyBodyClasses() {
    var b = document.body;
    setCls(b, 'oldui-square', on('oldui_square', true));
    setCls(b, 'oldui-info', on('oldui_info', false));
    setCls(b, 'oldui-logo', on('oldui_logo', false));
    if (info) setCls(info, 'oldui-info--logo', on('oldui_logo', false));
    last = null; syncObserver(); schedule();
  }
  function addSettings() {
    try {
      Lampa.SettingsApi.addComponent({
        component: 'oldui',
        name: '\u0421\u0442\u0430\u0440\u044b\u0439 \u0434\u0438\u0437\u0430\u0439\u043d',
        icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="3" width="16" height="18" stroke="currentColor" stroke-width="2"/></svg>'
      });
      [
        ['oldui_square', '\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0435 \u043f\u043e\u0441\u0442\u0435\u0440\u044b', '\u041f\u0440\u044f\u043c\u044b\u0435 \u0443\u0433\u043b\u044b \u0443 \u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a, \u043a\u0430\u043a \u0432 \u0441\u0442\u0430\u0440\u043e\u0439 \u0432\u0435\u0440\u0441\u0438\u0438'],
        ['oldui_info', '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u0440\u0435\u0439\u0442\u0438\u043d\u0433 \u0441\u0432\u0435\u0440\u0445\u0443', '\u042d\u043a\u0441\u043f\u0435\u0440\u0438\u043c\u0435\u043d\u0442\u0430\u043b\u044c\u043d\u043e. \u041d\u0430\u0434 \u0440\u044f\u0434\u0430\u043c\u0438 \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439, \u0432\u043c\u0435\u0441\u0442\u043e \u043f\u043e\u0434\u043f\u0438\u0441\u0438 \u043f\u043e\u0434 \u043f\u043e\u0441\u0442\u0435\u0440\u043e\u043c'],
        ['oldui_logo', '\u041b\u043e\u0433\u043e\u0442\u0438\u043f \u0432\u043c\u0435\u0441\u0442\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f', '\u042d\u043a\u0441\u043f\u0435\u0440\u0438\u043c\u0435\u043d\u0442\u0430\u043b\u044c\u043d\u043e. \u0415\u0441\u043b\u0438 \u0443 \u0444\u0438\u043b\u044c\u043c\u0430 \u0435\u0441\u0442\u044c \u043b\u043e\u0433\u043e\u0442\u0438\u043f \u043d\u0430 TMDB']
      ].forEach(function (p) {
        Lampa.SettingsApi.addParam({
          component: 'oldui',
          param: { name: p[0], type: 'trigger', default: p[0] === 'oldui_square' },
          field: { name: p[1], description: p[2] },
          onChange: applyBodyClasses
        });
      });
    } catch (e) { log('settings unavailable', e); }
  }

  /* ---------- styles ---------- */
  var CSS = [
    /* 1. square posters */
    'body.oldui-square .card .card__view,',
    'body.oldui-square .card .card__img,',
    'body.oldui-square .card .card__view::after,',
    'body.oldui-square .card .card__view::before,',
    'body.oldui-square .card-watched,',
    'body.oldui-square .card__quality,',
    'body.oldui-square .card__type{border-radius:0 !important}',

    /* 2. hide captions under posters (home rows only, when the top block is on) */
    'body.oldui-info.oldui-main .items-line .card__title,',
    'body.oldui-info.oldui-main .items-line .card__age,',
    'body.oldui-info.oldui-main .items-line .card__vote{display:none !important}',

    /* top info block */
    '.oldui-info{display:none;align-items:center;gap:1.2em;margin:0 1.5em 1.2em 1.5em;padding-top:.5em;min-height:5em}',
    'body.oldui-info.oldui-main .oldui-info.oldui-info--on{display:flex}',
    '.oldui-info__rate{font-size:2.4em;font-weight:700;line-height:1;padding:.25em .45em;border-radius:.2em;background:rgba(0,0,0,.35)}',
    '.oldui-info__rate.hide{display:none}',
    '.oldui-info__body{min-width:0}',
    '.oldui-info__title{font-size:2.2em;font-weight:700;line-height:1.15}',
    '.oldui-info__logo{display:none;max-height:3.2em;max-width:14em;object-fit:contain;object-position:left center}',
    '.oldui-info--logo.oldui-info--hasl .oldui-info__logo{display:block}',
    '.oldui-info--logo.oldui-info--hasl .oldui-info__title{display:none}',
    '.oldui-info__sub{font-size:1.3em;opacity:.7;margin-top:.25em}'
  ].join('\n');

  function injectCss() {
    var st = document.createElement('style');
    st.id = 'oldui-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- card data ---------- */
  var cur = null;          // last card data captured from Lampa.Maker (if hooked)
  var logoCache = {};      // 'movie123' -> url | ''

  function hookMaker() {
    try {
      if (!Lampa.Maker || Lampa.Maker.__oldui) return;
      var make = Lampa.Maker.make;
      Lampa.Maker.make = function (name, data) {
        var inst = make.apply(this, arguments);
        try {
          if (name === 'Card' && inst && typeof inst.use === 'function') {
            inst.use({ onFocus: function () { cur = (this && this.data) || data; } });
          }
        } catch (e) {}
        return inst;
      };
      Lampa.Maker.__oldui = true;
    } catch (e) { log('Maker hook failed (\u0440\u0430\u0431\u043e\u0442\u0430\u0435\u043c \u0442\u043e\u043b\u044c\u043a\u043e \u043f\u043e DOM)', e); }
  }

  function txt(el, sel) {
    var n = el.querySelector(sel);
    return n ? (n.textContent || '').trim() : '';
  }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

  function pickLogo(list) {
    if (!list || !list.length) return '';
    var lang = 'ru';
    try { lang = Lampa.Storage.field('language') || 'ru'; } catch (e) {}
    var rank = function (l) { return l.iso_639_1 === lang ? 0 : l.iso_639_1 === 'ru' ? 1 : l.iso_639_1 === 'en' ? 2 : 3; };
    var ok = list.filter(function (l) { return l && l.file_path && !/\.svg$/i.test(l.file_path); });
    if (!ok.length) return '';
    ok.sort(function (a, b) { return rank(a) - rank(b) || (b.vote_average || 0) - (a.vote_average || 0); });
    return ok[0].file_path;
  }

  function fetchLogo(d, done) {
    var type = (d.first_air_date || d.name) ? 'tv' : 'movie';
    var key = type + d.id;
    if (logoCache[key] !== undefined) return done(logoCache[key], key);
    try {
      var lang = 'ru';
      try { lang = Lampa.Storage.field('language') || 'ru'; } catch (e) {}
      var url = Lampa.TMDB.api(type + '/' + d.id + '/images?api_key=' + Lampa.TMDB.key() +
                               '&include_image_language=' + lang + ',ru,en,null');
      var R = Lampa.Request || Lampa.Reguest;
      var net = new R();
      net.silent(url, function (j) {
        var p = pickLogo(j && j.logos);
        logoCache[key] = p ? Lampa.TMDB.image('t/p/w300' + p) : '';
        done(logoCache[key], key);
      }, function () { logoCache[key] = ''; done('', key); });
    } catch (e) { logoCache[key] = ''; done('', key); }
  }

  /* ---------- top info block ---------- */
  var info = null, last = null, lastKey = null;

  function build() {
    info = document.createElement('div');
    info.className = 'oldui-info oldui-info--logo';
    info.innerHTML =
      '<div class="oldui-info__rate hide"></div>' +
      '<div class="oldui-info__body">' +
      '<img class="oldui-info__logo" alt="">' +
      '<div class="oldui-info__title"></div>' +
      '<div class="oldui-info__sub"></div>' +
      '</div>';
  }

  function isMain() {
    try {
      var a = Lampa.Activity.active();
      if (a && a.component) return a.component === 'main';
    } catch (e) {}
    return !document.querySelector('.full-start, .full-start-new');
  }

  function update() {
    var body = document.body;
    if (!on('oldui_info', false)) { removeInfo(); setCls(body, 'oldui-main', false); return; }
    var main = isMain();
    setCls(body, 'oldui-main', main);
    if (!info) return;
    var el = main ? document.querySelector('.card.focus') : null;
    if (!el) { if (!main) setCls(info, 'oldui-info--on', false); return; }
    var line = el.closest('.items-line');
    if (!line || !line.parentNode) { setCls(info, 'oldui-info--on', false); return; }

    // the info block goes first in the list of rows
    var parent = line.parentNode;
    if (info.parentNode !== parent || parent.firstChild !== info) parent.insertBefore(info, parent.firstChild);
    setCls(info, 'oldui-info--on', true);

    if (el === last) return;
    last = el;

    var domTitle = txt(el, '.card__title');
    var d = cur && norm(cur.title || cur.name) === norm(domTitle) ? cur : null;   // use data only if it belongs to this card

    var title = (d && (d.title || d.name)) || domTitle;
    var orig = d && (d.original_title || d.original_name);
    if (orig && norm(orig) === norm(title)) orig = '';
    var year = d ? String(d.release_date || d.first_air_date || '').slice(0, 4) : txt(el, '.card__age');
    var vote = d && d.vote_average ? Number(d.vote_average).toFixed(1) : txt(el, '.card__vote');

    var rate = info.querySelector('.oldui-info__rate');
    rate.textContent = vote;
    setCls(rate, 'hide', !vote || vote === '0.0' || vote === '0');
    info.querySelector('.oldui-info__title').textContent = title;
    info.querySelector('.oldui-info__sub').textContent = [orig, year].filter(Boolean).join('  \u2022  ');

    // logo
    setCls(info, 'oldui-info--hasl', false);
    var img = info.querySelector('.oldui-info__logo');
    img.removeAttribute('src');
    lastKey = null;
    if (on('oldui_logo', false) && d && d.id) {
      fetchLogo(d, function (url, key) {
        if (last !== el || !url) return;        // focus moved away or no logo
        img.onload = function () { if (last === el) setCls(info, 'oldui-info--hasl', true); };
        img.src = url;
      });
    }
  }

  var scheduled = false, errors = 0, mo = null;
  function removeInfo() {
    last = null;
    if (info) { setCls(info, 'oldui-info--on', false); if (info.parentNode) info.parentNode.removeChild(info); }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      try { update(); } catch (e) {
        log('update error', e);
        if (++errors >= 5) { log('\u0441\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u043e\u0448\u0438\u0431\u043e\u043a, \u0432\u0435\u0440\u0445\u043d\u0438\u0439 \u0431\u043b\u043e\u043a \u043e\u0442\u043a\u043b\u044e\u0447\u0451\u043d'); if (mo) { mo.disconnect(); mo = null; } removeInfo(); }
      }
    });
  }
  // observe focus only when the top block is enabled
  function syncObserver() {
    var need = on('oldui_info', false) || on('oldui_logo', false);
    if (need && !mo) {
      hookMaker();
      mo = new MutationObserver(schedule);
      mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    } else if (!need && mo) {
      mo.disconnect(); mo = null; removeInfo();
    }
  }

  /* ---------- start ---------- */
  function start() {
    try {
      injectCss();
      build();
      addSettings();
      applyBodyClasses();      // also starts the focus observer if needed
      log('ready v1.1');
    } catch (e) { log('start failed', e); }
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();


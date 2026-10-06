/*
 * Lampa plugin: "Old design" (v1.3)
 *  1. Square posters (sharp corners), including the poster on the movie page.   [on by default]
 *  2. Title, year and rating shown ABOVE the first row on the home screen.      [experimental, off]
 *
 * v1.3 changes: the experimental top block no longer hooks Lampa internals (no Lampa.Maker patch)
 * and no longer moves elements inside Lampa's own containers. It is a separate overlay that is
 * only shown when there is free space above the first row. Logos were removed for now.
 *
 * Safety: if the plugin fails to start twice in a row it disables itself; if a start fails once
 * with the top block on, the top block is switched off automatically.
 * Manual kill switch (browser console):  localStorage.setItem('oldui_off', '1')
 */
(function () {
  'use strict';
  if (window.oldui_plugin_ready) return;
  window.oldui_plugin_ready = true;

  var VER = '1.3', GK = 'oldui_guard';
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
  var CSS = [
    /* 1. square posters */
    'body.oldui-square .card .card__view,',
    'body.oldui-square .card .card__img,',
    'body.oldui-square .card .card__view::after,',
    'body.oldui-square .card .card__view::before,',
    'body.oldui-square .card-watched,',
    'body.oldui-square .card__quality,',
    'body.oldui-square .card__type{border-radius:0 !important}',

    /* 1b. poster on the movie page */
    'body.oldui-square .full-start__poster,',
    'body.oldui-square .full-start-new__poster,',
    'body.oldui-square .full-start__img,',
    'body.oldui-square .full-start-new__img,',
    'body.oldui-square .full--poster,',
    'body.oldui-square [class*="full-start"] [class*="poster"],',
    'body.oldui-square [class*="full-start"] [class*="poster"] img,',
    'body.oldui-square [class*="full-start"] [class*="poster"]::before,',
    'body.oldui-square [class*="full-start"] [class*="poster"]::after{border-radius:0 !important}',

    /* 2. top info block: captions under posters are hidden in home rows only while it is on */
    'body.oldui-info.oldui-main .items-line .card__title,',
    'body.oldui-info.oldui-main .items-line .card__age,',
    'body.oldui-info.oldui-main .items-line .card__vote{display:none !important}',
    /* free space above the first row for the overlay */
    'body.oldui-info.oldui-main .items-line:first-child{margin-top:6em}',

    '.oldui-info{position:fixed;left:0;right:0;z-index:5;display:none;align-items:center;gap:1.2em;',
    'padding:0 1.5em;box-sizing:border-box;pointer-events:none}',
    'body.oldui-info-show .oldui-info{display:flex}',
    '.oldui-info__rate{font-size:2.4em;font-weight:700;line-height:1;padding:.25em .45em;border-radius:.2em;background:rgba(0,0,0,.35)}',
    '.oldui-info__rate.hide{display:none}',
    '.oldui-info__body{min-width:0}',
    '.oldui-info__title{font-size:2.2em;font-weight:700;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.oldui-info__sub{font-size:1.3em;opacity:.7;margin-top:.25em}'
  ].join('\n');

  function injectCss() {
    var st = document.createElement('style');
    st.id = 'oldui-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- settings ---------- */
  function applyBodyClasses() {
    var b = document.body;
    setCls(b, 'oldui-square', on('oldui_square', true));
    setCls(b, 'oldui-info', on('oldui_info', false));
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
        ['oldui_square', '\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0435 \u043f\u043e\u0441\u0442\u0435\u0440\u044b', '\u041f\u0440\u044f\u043c\u044b\u0435 \u0443\u0433\u043b\u044b \u0443 \u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a \u0438 \u0443 \u043f\u043e\u0441\u0442\u0435\u0440\u0430 \u043d\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435 \u0444\u0438\u043b\u044c\u043c\u0430'],
        ['oldui_info', '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u0440\u0435\u0439\u0442\u0438\u043d\u0433 \u0441\u0432\u0435\u0440\u0445\u0443', '\u042d\u043a\u0441\u043f\u0435\u0440\u0438\u043c\u0435\u043d\u0442\u0430\u043b\u044c\u043d\u043e. \u041d\u0430\u0434 \u043f\u0435\u0440\u0432\u044b\u043c \u0440\u044f\u0434\u043e\u043c \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439; \u0435\u0441\u043b\u0438 \u043c\u0435\u0441\u0442\u0430 \u043d\u0435\u0442, \u0431\u043b\u043e\u043a \u043d\u0435 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442\u0441\u044f']
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

  /* ---------- top info block (separate overlay, never inside Lampa containers) ---------- */
  var info = null, last = null, scheduled = false, errors = 0, mo = null;

  function build() {
    info = document.createElement('div');
    info.className = 'oldui-info';
    info.innerHTML =
      '<div class="oldui-info__rate hide"></div>' +
      '<div class="oldui-info__body"><div class="oldui-info__title"></div><div class="oldui-info__sub"></div></div>';
    document.body.appendChild(info);
  }
  function txt(el, sel) { var n = el.querySelector(sel); return n ? (n.textContent || '').trim() : ''; }
  function isMain() {
    try {
      var a = Lampa.Activity.active();
      if (a && a.component) return a.component === 'main';
    } catch (e) {}
    return !document.querySelector('.full-start, .full-start-new');
  }
  function hide() { setCls(document.body, 'oldui-info-show', false); }

  function update() {
    var body = document.body;
    if (!on('oldui_info', false)) { hide(); setCls(body, 'oldui-main', false); return; }
    var main = isMain();
    setCls(body, 'oldui-main', main);
    var el = main ? document.querySelector('.card.focus') : null;
    if (!el) { hide(); return; }
    var line = el.closest('.items-line');
    if (!line || !line.parentNode || line.parentNode.querySelector('.items-line') !== line) { hide(); return; }   // first row only

    // place the overlay right under the header; show it only if there is real free space above the row
    var head = document.querySelector('.head');
    var top = head ? Math.round(head.getBoundingClientRect().bottom) : 80;
    if (line.getBoundingClientRect().top - top < 70) { hide(); return; }
    if (info.style.top !== top + 'px') info.style.top = top + 'px';

    if (el !== last) {
      last = el;
      var title = txt(el, '.card__title');
      var year = txt(el, '.card__age');
      var vote = txt(el, '.card__vote');
      var rate = info.querySelector('.oldui-info__rate');
      rate.textContent = vote;
      setCls(rate, 'hide', !vote || vote === '0.0' || vote === '0');
      info.querySelector('.oldui-info__title').textContent = title;
      info.querySelector('.oldui-info__sub').textContent = year;
    }
    setCls(body, 'oldui-info-show', true);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      try { update(); } catch (e) {
        log('update error', e);
        if (++errors >= 5) { log('too many errors, top block disabled'); if (mo) { mo.disconnect(); mo = null; } hide(); }
      }
    });
  }
  // observe focus changes only while the top block is enabled
  function syncObserver() {
    var need = on('oldui_info', false);
    if (need && !mo) {
      mo = new MutationObserver(schedule);
      mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    } else if (!need && mo) {
      mo.disconnect(); mo = null; hide();
    }
  }

  /* ---------- start ---------- */
  function start() {
    try {
      // the previous start never finished: do not let the experimental block cause a second failure
      if (prevBoot >= 1) { try { Lampa.Storage.set('oldui_info', false); } catch (e) {} }
      injectCss();
      build();
      addSettings();
      applyBodyClasses();
      log('ready v' + VER);
    } catch (e) { log('start failed', e); }
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();

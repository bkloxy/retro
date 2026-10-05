/*
 * Lampa plugin: «Старый дизайн» (v1.0)
 *  1. Квадратные постеры (прямые углы) вместо скруглённых.
 *  2. Название, оригинальное название, год и рейтинг — НАВЕРХУ над рядами (как в версии 2021 года),
 *     а не внизу под постером / на постере. Обновляется при перемещении фокуса по карточкам.
 *  3. Вместо названия — логотип фильма (если он есть на TMDB). Если логотипа нет — обычный текст.
 *
 * Все три пункта включаются и выключаются в Настройки → «Старый дизайн».
 * Плагин не заменяет ядро Lampa: только стили и один блок над рядами на главной.
 */
(function () {
  'use strict';
  if (window.oldui_plugin_ready) return;
  window.oldui_plugin_ready = true;

  var LOG = '[oldui]';
  function log() { try { console.log.apply(console, [LOG].concat([].slice.call(arguments))); } catch (e) {} }

  function setCls(node, cls, state) {
    if (node.classList.contains(cls) !== !!state) node.classList.toggle(cls, !!state);
  }

  /* ---------- настройки ---------- */
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
    setCls(b, 'oldui-info', on('oldui_info', true));
    setCls(b, 'oldui-logo', on('oldui_logo', true));
    if (info) setCls(info, 'oldui-info--logo', on('oldui_logo', true));
    last = null; schedule();
  }
  function addSettings() {
    try {
      Lampa.SettingsApi.addComponent({
        component: 'oldui',
        name: 'Старый дизайн',
        icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="3" width="16" height="18" stroke="currentColor" stroke-width="2"/></svg>'
      });
      [
        ['oldui_square', 'Квадратные постеры', 'Прямые углы у карточек, как в старой версии'],
        ['oldui_info', 'Название и рейтинг сверху', 'Над рядами на главной, вместо подписи под постером'],
        ['oldui_logo', 'Логотип вместо названия', 'Если у фильма есть логотип на TMDB']
      ].forEach(function (p) {
        Lampa.SettingsApi.addParam({
          component: 'oldui',
          param: { name: p[0], type: 'trigger', default: true },
          field: { name: p[1], description: p[2] },
          onChange: applyBodyClasses
        });
      });
    } catch (e) { log('settings unavailable', e); }
  }

  /* ---------- стили ---------- */
  var CSS = [
    /* 1. квадратные постеры */
    'body.oldui-square .card .card__view,',
    'body.oldui-square .card .card__img,',
    'body.oldui-square .card .card__view::after,',
    'body.oldui-square .card .card__view::before,',
    'body.oldui-square .card-watched,',
    'body.oldui-square .card__quality,',
    'body.oldui-square .card__type{border-radius:0 !important}',

    /* 2. подписи под постерами прячем только в рядах на главной, когда включён верхний блок */
    'body.oldui-info.oldui-main .items-line .card__title,',
    'body.oldui-info.oldui-main .items-line .card__age,',
    'body.oldui-info.oldui-main .items-line .card__vote{display:none !important}',

    /* верхний блок */
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

  /* ---------- данные карточки ---------- */
  var cur = null;          // последние данные карточки из Lampa.Maker (если удалось перехватить)
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
    } catch (e) { log('Maker hook failed (работаем только по DOM)', e); }
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

  /* ---------- верхний блок ---------- */
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
    var main = isMain();
    setCls(body, 'oldui-main', main);
    if (!info) return;
    var el = main ? document.querySelector('.card.focus') : null;
    if (!el) { if (!main) setCls(info, 'oldui-info--on', false); return; }
    var line = el.closest('.items-line');
    if (!line || !line.parentNode) { setCls(info, 'oldui-info--on', false); return; }

    // блок стоит первым в списке рядов
    var parent = line.parentNode;
    if (info.parentNode !== parent || parent.firstChild !== info) parent.insertBefore(info, parent.firstChild);
    setCls(info, 'oldui-info--on', true);

    if (el === last) return;
    last = el;

    var domTitle = txt(el, '.card__title');
    var d = cur && norm(cur.title || cur.name) === norm(domTitle) ? cur : null;   // данные только если они от этой карточки

    var title = (d && (d.title || d.name)) || domTitle;
    var orig = d && (d.original_title || d.original_name);
    if (orig && norm(orig) === norm(title)) orig = '';
    var year = d ? String(d.release_date || d.first_air_date || '').slice(0, 4) : txt(el, '.card__age');
    var vote = d && d.vote_average ? Number(d.vote_average).toFixed(1) : txt(el, '.card__vote');

    var rate = info.querySelector('.oldui-info__rate');
    rate.textContent = vote;
    setCls(rate, 'hide', !vote || vote === '0.0' || vote === '0');
    info.querySelector('.oldui-info__title').textContent = title;
    info.querySelector('.oldui-info__sub').textContent = [orig, year].filter(Boolean).join('  •  ');

    // логотип
    setCls(info, 'oldui-info--hasl', false);
    var img = info.querySelector('.oldui-info__logo');
    img.removeAttribute('src');
    lastKey = null;
    if (on('oldui_logo', true) && d && d.id) {
      fetchLogo(d, function (url, key) {
        if (last !== el || !url) return;        // фокус уже ушёл или логотипа нет
        img.onload = function () { if (last === el) setCls(info, 'oldui-info--hasl', true); };
        img.src = url;
      });
    }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; try { update(); } catch (e) { log('update error', e); } });
  }

  /* ---------- запуск ---------- */
  function start() {
    injectCss();
    build();
    hookMaker();
    addSettings();
    applyBodyClasses();
    // фокус в Lampa — это смена класса "focus"; следим за ним, не завися от внутренних событий
    new MutationObserver(schedule).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    log('ready v1.0');
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();

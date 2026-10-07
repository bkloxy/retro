(function () {
    'use strict';

    if (window.nf_resume_ready) return;
    window.nf_resume_ready = true;

    var KEY = 'nf_resume_v1';
    var replaying = false;
    var lastPlaylist = null;

    function load() { return Lampa.Storage.get(KEY, {}) || {}; }
    function save(d) { Lampa.Storage.set(KEY, d); }

    function cardKey(movie) {
        return movie && movie.id ? (movie.source || 'tmdb') + '_' + movie.id : null;
    }

    // оставляем только то, что можно сохранить (ссылки-строки, без функций)
    function clean(obj) {
        try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return null; }
    }

    function isPlayable(data) {
        return data && typeof data.url === 'string' && /^https?:/i.test(data.url);
    }

    function cleanPlaylist(list) {
        if (!Array.isArray(list)) return null;
        var out = list.filter(isPlayable).slice(0, 60).map(clean).filter(Boolean);
        return out.length ? out : null;
    }

    // ===== Запоминаем, ЧТО именно запустили (источник, озвучка, серия) =====
    function hookPlayer() {
        var origPlay = Lampa.Player.play;
        var origPlaylist = Lampa.Player.playlist;

        Lampa.Player.playlist = function (list) {
            lastPlaylist = list;
            return origPlaylist.apply(this, arguments);
        };

        Lampa.Player.play = function (data) {
            try {
                if (!replaying && isPlayable(data)) {
                    var act = Lampa.Activity.active();
                    var movie = act && (act.movie || act.card);
                    var key = cardKey(movie);
                    var play = clean(data);
                    if (key && play) {
                        var all = load();
                        all[key] = {
                            saved: Date.now(),
                            play: play,
                            playlist: cleanPlaylist(lastPlaylist)
                        };
                        save(all);
                    }
                }
            } catch (e) { }
            return origPlay.apply(this, arguments);
        };
    }

    // ===== Запуск сохранённого =====
    function replay(entry) {
        try {
            replaying = true;
            var play = entry.play;
            // подтягиваем свежий таймкод вместо сохранённого
            try {
                if (play.timeline && play.timeline.hash) {
                    var fresh = Lampa.Timeline.view(play.timeline.hash);
                    if (fresh) play.timeline = fresh;
                }
            } catch (e) { }
            if (entry.playlist && entry.playlist.length) Lampa.Player.playlist(entry.playlist);
            Lampa.Player.play(play);
        } catch (e) {
            Lampa.Noty.show('Не удалось продолжить, откройте просмотр обычным способом');
        } finally {
            replaying = false;
        }
    }

    function label(entry) {
        var p = entry.play || {};
        var parts = [];
        if (p.season && p.episode) parts.push('С' + p.season + ' Э' + p.episode);
        else if (p.episode) parts.push('Серия ' + p.episode);
        try {
            var t = p.timeline;
            if (t && t.hash) t = Lampa.Timeline.view(t.hash);
            if (t && t.time > 0) parts.push(Math.round(t.time / 60) + ' мин');
        } catch (e) { }
        return parts.join(' · ');
    }

    // ===== Кнопка «Продолжить» на карточке фильма =====
    function addButton() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            try {
                var movie = e.data && e.data.movie;
                var key = cardKey(movie);
                var entry = key && load()[key];
                if (!entry || !entry.play) return;

                var render = e.object.activity.render();
                if (render.find('.nf-resume-btn').length) return;

                var box = render.find('.full-start-new__buttons, .full-start__buttons').first();
                if (!box.length) return;

                var extra = label(entry);
                var btn = $('<div class="full-start__button selector nf-resume-btn">' +
                    '<span>▶ Продолжить' + (extra ? ' · ' + extra : '') + '</span></div>');
                btn.on('hover:enter', function () { replay(entry); });
                box.prepend(btn);
            } catch (err) { }
        });
    }

    // ===== Нажатие на карточку в ряду «Продолжить просмотр» сразу запускает просмотр =====
    var DIRECT_PLAY = true; // false = карточка просто открывается, а запуск только кнопкой
    var ROW_TITLE = 'Продолжить просмотр';

    function focusedInContinueRow() {
        try {
            var line = $('.items-line .card.focus').first().closest('.items-line');
            return line.length && $.trim(line.find('.items-line__title').first().text()) === ROW_TITLE;
        } catch (e) { return false; }
    }

    function hookOpenCard() {
        var origPush = Lampa.Activity.push;
        Lampa.Activity.push = function (p) {
            try {
                if (DIRECT_PLAY && p && p.component === 'full' && focusedInContinueRow()) {
                    var movie = p.card || { id: p.id, source: p.source };
                    var entry = load()[cardKey(movie)];
                    if (entry && entry.play) {
                        replay(entry);
                        return;
                    }
                }
            } catch (e) { }
            return origPush.apply(Lampa.Activity, arguments);
        };
    }

    function start() {
        try { hookOpenCard(); } catch (e) { }
        try { hookPlayer(); } catch (e) { console.log('[NF Resume] player hook failed', e); }
        addButton();
        console.log('[NF Resume] loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

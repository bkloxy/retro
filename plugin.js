(function () {
    'use strict';

    if (window.nf_continue_ready) return;
    window.nf_continue_ready = true;

    var STORAGE_KEY = 'nf_continue_data';
    var MIN_SECONDS = 8; // после скольких секунд считаем, что человек начал смотреть

    function getContinueData() {
        return Lampa.Storage.get(STORAGE_KEY, {}) || {};
    }

    function saveContinueData(data) {
        Lampa.Storage.set(STORAGE_KEY, data);
    }

    function getCardId(card) {
        if (!card) return null;
        return card.id || card.kinopoisk_id || card.imdb_id || 
               (card.original_title || card.original_name || card.title || card.name);
    }

    function formatTime(sec) {
        sec = Math.floor(sec || 0);
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;
        if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ===== Сохраняем данные во время просмотра =====
    function onPlayerStart(e) {
        try {
            var movie = e.data && e.data.movie ? e.data.movie : (e.object && e.object.movie);
            if (!movie) return;

            var id = getCardId(movie);
            if (!id) return;

            var data = getContinueData();
            data[id] = {
                id: id,
                title: movie.title || movie.name || movie.original_title || movie.original_name,
                poster: movie.poster_path || movie.img || '',
                type: movie.name || movie.original_name ? 'tv' : 'movie',
                last_time: Date.now(),
                position: 0,
                duration: 0,
                source: e.data && e.data.source ? e.data.source : '',
                url: e.data && e.data.url ? e.data.url : ''
            };
            saveContinueData(data);
        } catch (err) {}
    }

    function onTimeUpdate(e) {
        try {
            if (!e || !e.current || e.current < MIN_SECONDS) return;

            // Обновляем последнюю запись
            var data = getContinueData();
            var keys = Object.keys(data);
            if (!keys.length) return;

            // Берём самую свежую запись
            var lastKey = keys.sort(function (a, b) {
                return (data[b].last_time || 0) - (data[a].last_time || 0);
            })[0];

            if (lastKey && data[lastKey]) {
                data[lastKey].position = e.current;
                data[lastKey].duration = e.duration || data[lastKey].duration;
                data[lastKey].last_time = Date.now();
                saveContinueData(data);
            }
        } catch (err) {}
    }

    // ===== При открытии карточки предлагаем продолжить =====
    function onFull(e) {
        if (e.type !== 'complite') return;

        try {
            var movie = e.data && e.data.movie;
            if (!movie) return;

            var id = getCardId(movie);
            if (!id) return;

            var data = getContinueData();
            var item = data[id];

            // Также проверяем стандартный Timeline Lampa
            var title = movie.original_title || movie.original_name || movie.title || movie.name;
            var timeline = null;
            try {
                timeline = Lampa.Timeline.view(Lampa.Utils.hash(title));
            } catch (err) {}

            var hasProgress = (item && item.position > MIN_SECONDS) || 
                              (timeline && timeline.percent > 1 && timeline.percent < 95);

            if (!hasProgress) return;

            var position = (item && item.position) || (timeline && timeline.time) || 0;
            var percent = timeline ? timeline.percent : Math.round((position / (item.duration || 1)) * 100);

            // Показываем красивое уведомление
            setTimeout(function () {
                Lampa.Noty.show('Продолжить с ' + formatTime(position) + ' (' + percent + '%)', {
                    time: 4000
                });
            }, 800);

        } catch (err) {}
    }

    // ===== Делаем resume более агрессивным =====
    function forceBetterResume() {
        // Меняем поведение таймкода на более удобное
        var current = Lampa.Storage.get('player_timecode', 'ask');
        // Можно раскомментировать, если хочешь всегда автоматически продолжать:
        // if (current === 'ask') Lampa.Storage.set('player_timecode', '');
    }

    // ===== Старт =====
    function start() {
        Lampa.Listener.follow('player', function (e) {
            if (e.type === 'start') onPlayerStart(e);
        });

        Lampa.PlayerVideo.listener.follow('timeupdate', onTimeUpdate);

        Lampa.Listener.follow('full', onFull);

        forceBetterResume();

        console.log('[NF Continue] Плагин загружен');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

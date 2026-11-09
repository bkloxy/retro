
(function () {
    'use strict';

    if (window.lordfilmCardButtonLoaded) return;
    window.lordfilmCardButtonLoaded = true;

    var SITE = 'https://hd6.lordfilm0.lol';

    function getSearchUrl(movie) {
        var title =
            movie.title ||
            movie.name ||
            movie.original_title ||
            movie.original_name ||
            '';

        var date = movie.release_date || movie.first_air_date || '';
        var year = date.substring(0, 4);

        var query = title + (year ? ' ' + year : '');

        return SITE +
            '/?do=search&subaction=search&story=' +
            encodeURIComponent(query);
    }

    function openLordfilm(movie) {
        var url = getSearchUrl(movie);

        try {
            var popup = window.open(url, '_blank');

            // Если новое окно не поддерживается,
            // открываем сайт в текущем окне.
            if (!popup) {
                window.location.href = url;
            }
        } catch (error) {
            window.location.href = url;
        }
    }

    function addCardButton(e) {
        if (e.type !== 'complite') return;

        var activity = e.object.activity;
        if (!activity) return;

        var root = activity.render();

        // Поддержка нового и старого дизайна карточки.
        var container = root.find('.full-start-new__buttons');

        if (!container.length) {
            container = root.find('.full-start__buttons');
        }

        if (!container.length) return;

        // Защита от повторного добавления.
        if (root.find('.view--lordfilm').length) return;

        var movie = e.data.movie || e.object.card || {};

        var button = $(
            '<div class="full-start__button selector view--online view--lordfilm">' +
                '<svg class="button__icon" width="24" height="24" viewBox="0 0 24 24">' +
                    '<path fill="currentColor" d="M9 6v12l10-6z"/>' +
                '</svg>' +
                '<span>Смотреть на Lordfilm</span>' +
            '</div>'
        );

        button.on('hover:enter', function () {
            openLordfilm(movie);
        });

        // Добавляем кнопку в начало списка.
        container.prepend(button);

        console.log('[Lordfilm] Кнопка добавлена');
    }

    Lampa.Listener.follow('full', addCardButton);

    console.log('[Lordfilm] Plugin loaded successfully');

})();

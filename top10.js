
(function () {
    'use strict';

    if (window.lordfilm_jump_ready) return;
    window.lordfilm_jump_ready = true;

    var SITE = 'https://hd6.lordfilm0.lol';

    function startPlugin() {

        Lampa.Lang.add({
            lordfilm_watch: {
                ru: 'Смотреть на Lordfilm',
                en: 'Watch on Lordfilm'
            }
        });

        Lampa.Manifest.plugins = {
            type: 'video',
            version: '1.1.0',
            name: 'Lordfilm',
            description: 'Открытие фильма на сайте Lordfilm',

            onContextMenu: function (card) {
                return {
                    name: Lampa.Lang.translate('lordfilm_watch'),
                    description: 'Открыть сайт с поиском фильма'
                };
            },

            onContextLauch: function (card) {

                var title =
                    card.title ||
                    card.name ||
                    card.original_title ||
                    card.original_name ||
                    '';

                var year = '';

                var date = card.release_date || card.first_air_date;

                if (date) {
                    year = date.substring(0, 4);
                }

                var query = title;

                if (year) {
                    query += ' ' + year;
                }

                var url = SITE +
                    '/?do=search&subaction=search&story=' +
                    encodeURIComponent(query);

                Lampa.Platform.open(url);
            }
        };

        console.log('[Lordfilm] Plugin loaded');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();

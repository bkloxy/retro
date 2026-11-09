(function () {
    'use strict';

    var SITE = 'https://hd6.lordfilm0.lol/';

    function openSearch(card) {
        var title = card.original_title || card.title || card.name || '';
        var year = '';

        if (card.release_date) {
            year = card.release_date.substring(0, 4);
        } else if (card.first_air_date) {
            year = card.first_air_date.substring(0, 4);
        }

        var query = title + (year ? ' ' + year : '');

        Lampa.Platform.open(
            SITE + '/?do=search&subaction=search&story=' +
            encodeURIComponent(query)
        );
    }

    function addAction() {
        Lampa.Listener.follow('full', function (event) {
            if (event.type !== 'complite') return;

            var card = event.data.movie;
            if (!card) return;

            Lampa.Listener.follow('menu', function (menuEvent) {
                if (menuEvent.type !== 'open') return;
            });
        });
    }

    function init() {
        if (!window.Lampa) return;

        Lampa.Component.add('lordfilm_jump', function () {
            return {
                create: function () {
                    this.activity = Lampa.Activity.active();
                }
            };
        });

        addAction();
    }

    if (window.Lampa) init();
    else {
        document.addEventListener('lampa:ready', init);
    }
})();

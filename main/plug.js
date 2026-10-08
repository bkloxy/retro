(function () {
    'use strict';

    function start() {

        if (!window.Lampa) return;

        if (
            Lampa.Manifest &&
            Lampa.Manifest.app_digital &&
            Lampa.Manifest.app_digital < 300
        ) {
            return;
        }

        var style = document.createElement('style');

        style.id = 'retro-netflix';

        style.textContent = `
            body {
                background: #050505 !important;
            }

            .main {
                background: #050505 !important;
            }

            .activity {
                background: transparent !important;
            }

            .card__view {
                border-radius: 5px !important;
            }
        `;

        document.head.appendChild(style);
    }

    if (window.Lampa) {
        start();
        return;
    }

    var timer = setInterval(function () {

        if (window.Lampa) {

            clearInterval(timer);

            start();
        }

    }, 100);

})();

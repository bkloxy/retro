(function () {
    'use strict';

    var manifest = {
        type: 'other',
        version: '1.0.0',
        name: 'Retro Netflix',
        description: 'Netflix interface for Lampa',
        component: 'retro_netflix'
    };

    if (!window.Lampa) {
        return;
    }

    function registerManifest() {

        if (!Lampa.Manifest) {
            Lampa.Manifest = {};
        }

        if (!Lampa.Manifest.plugins) {
            Lampa.Manifest.plugins = {};
        }

        if (Array.isArray(Lampa.Manifest.plugins)) {

            var exists = Lampa.Manifest.plugins.some(function (plugin) {
                return plugin &&
                    plugin.component === manifest.component;
            });

            if (!exists) {
                Lampa.Manifest.plugins.push(manifest);
            }

        } else {

            Lampa.Manifest.plugins[manifest.component] =
                manifest;

        }
    }

    function start() {

        if (window.__RETRO_NETFLIX_STARTED__) {
            return;
        }

        window.__RETRO_NETFLIX_STARTED__ = true;

        registerManifest();

        /*
         * ЗДЕСЬ БУДЕТ НАШ NETFLIX UI
         */
    }

    if (window.appready) {

        start();

    } else if (
        Lampa.Listener &&
        Lampa.Listener.follow
    ) {

        Lampa.Listener.follow(
            'app',
            function (event) {

                if (event.type === 'ready') {
                    start();
                }

            }
        );

    }

})();

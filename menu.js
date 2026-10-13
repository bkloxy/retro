(function () {
    'use strict';

    if (window.person_info_plugin) return;
    window.person_info_plugin = true;

    var cache = {};

    function initSettings() {
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: { name: 'hide_comments', type: 'trigger', default: false },
            field: {
                name: 'Скрыть комментарии',
                description: 'Убирает блок комментариев в карточке фильма и сериала'
            },
            onChange: function () { process(); }
        });
    }

    function hideComments() {
        var hide = Lampa.Storage.field('hide_comments') === true;
        $('.items-line').each(function () {
            var title = $(this).find('.items-line__title').text().trim();
            if (title === 'Комментарии' || title === 'Comments') $(this).toggle(!hide);
        });
    }

    function getInfo(tmdbId, callback) {
        if (cache[tmdbId]) return callback(cache[tmdbId]);

        var query =
            'SELECT ?birth ?death ?h ?placeLabel ?countryLabel WHERE {' +
            ' ?p wdt:P4985 "' + tmdbId + '".' +
            ' OPTIONAL{?p wdt:P569 ?birth}' +
            ' OPTIONAL{?p wdt:P570 ?death}' +
            ' OPTIONAL{?p p:P2048/psn:P2048/wikibase:quantityAmount ?h}' +
            ' OPTIONAL{?p wdt:P19 ?place. OPTIONAL{?place wdt:P17 ?country}}' +
            ' SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }' +
            '} LIMIT 1';

        fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query))
            .then(function (r) { return r.json(); })
            .then(function (j) {
                var b = j.results.bindings[0];
                if (!b) return callback({});
                var info = {
                    birth: b.birth ? b.birth.value : null,
                    death: b.death ? b.death.value : null,
                    height: b.h ? Math.round(parseFloat(b.h.value) * 100) : null,
                    place: b.placeLabel ? b.placeLabel.value : null,
                    country: b.countryLabel ? b.countryLabel.value : null
                };
                cache[tmdbId] = info;
                callback(info);
            })
            .catch(function () { callback(null); });
    }

    function calcAge(birth, death) {
        var b = new Date(birth);
        var end = death ? new Date(death) : new Date();
        var age = end.getFullYear() - b.getFullYear();
        var m = end.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < b.getDate())) age--;
        return age;
    }

    function plural(n) {
        var a = n % 10, b = n % 100;
        if (a === 1 && b !== 11) return 'год';
        if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'года';
        return 'лет';
    }

    function personPage() {
        var act = Lampa.Activity.active();
        if (!act || act.component !== 'actor') return;

        var $page = (act.activity && act.activity.render) ? act.activity.render() : $(document.body);
        var $name = $page.find('.full-person__name').first();
        if (!$name.length || $name.data('pi-done')) return;
        $name.data('pi-done', true);

        var id = act.id || (act.params && act.params.id) || (act.object && act.object.id) ||
                 (act.card && act.card.id);
        if (!id) return Lampa.Noty.show('Плагин: не найден ID человека');

        // запасной вариант: соседние элементы вокруг имени (дата сверху, место снизу)
        var $b = $page.find('.full-person__birthday').first();
        if (!$b.length) $b = $name.prev();
        var $place = $page.find('.full-person__place').first();
        if (!$place.length) $place = $name.next();

        getInfo(id, function (info) {
            if (info === null) return Lampa.Noty.show('Плагин: Wikidata недоступна');
            if (!info.birth && !info.place && !info.height) return Lampa.Noty.show('Плагин: в Wikidata нет данных');

            if (info.birth) {
                var age = calcAge(info.birth, info.death);
                if (!isNaN(age)) {
                    $b.text($b.text() + ' (' + age + ' ' + plural(age) + (info.death ? ', умер(ла)' : '') + ')');
                }
            }

            var parts = [];
            if (info.place) parts.push(info.place);
            if (info.country && info.country !== info.place) parts.push(info.country);
            if (parts.length) $place.text(parts.join(', '));

            if (info.height) {
                $place.after('<div class="full-person__height" style="font-size:1.1em;margin-top:.3em">Рост: ' + info.height + ' см</div>');
            }
        });
    }

    function process() {
        hideComments();
        personPage();
    }

    function start() {
        initSettings();
        var timer;
        new MutationObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(process, 150);
        }).observe(document.body, { childList: true, subtree: true });
        process();
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();

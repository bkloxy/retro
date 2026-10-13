
(function () {
    'use strict';

    if (window.person_info_plugin) return;
    window.person_info_plugin = true;

    var cache = {};
    var requests = {};

    function initSettings() {
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'hide_comments',
                type: 'trigger',
                default: false
            },
            field: {
                name: 'Скрыть комментарии',
                description: 'Убирает блок комментариев в карточке фильма и сериала'
            },
            onChange: function () {
                process();
            }
        });
    }

    function hideComments() {
        var hide = Lampa.Storage.field('hide_comments') === true;

        $('.items-line').each(function () {
            var title = $(this).find('.items-line__title').text().trim();

            if (title === 'Комментарии' || title === 'Comments') {
                $(this).toggle(!hide);
            }
        });
    }

    function getInfo(tmdbId, callback) {
        if (cache[tmdbId]) {
            callback(cache[tmdbId]);
            return;
        }

        if (requests[tmdbId]) {
            requests[tmdbId].push(callback);
            return;
        }

        requests[tmdbId] = [callback];

        var query =
            'SELECT ?birth ?death ?height ?heightUnit ' +
            '?placeLabel ?countryLabel WHERE {' +

            ' ?p wdt:P4985 "' + String(tmdbId).replace(/[^0-9]/g, '') + '".' +

            ' OPTIONAL { ?p wdt:P569 ?birth. }' +
            ' OPTIONAL { ?p wdt:P570 ?death. }' +

            ' OPTIONAL {' +
            '   ?p p:P2048 ?heightStatement.' +
            '   ?heightStatement ps:P2048 ?height.' +
            '   OPTIONAL {' +
            '     ?heightStatement psv:P2048/wikibase:quantityUnit ?heightUnit.' +
            '   }' +
            ' }' +

            ' OPTIONAL {' +
            '   ?p wdt:P19 ?place.' +
            '   OPTIONAL {' +
            '     ?place rdfs:label ?placeLabel.' +
            '     FILTER(LANG(?placeLabel) = "ru" || LANG(?placeLabel) = "en")' +
            '   }' +
            '   OPTIONAL {' +
            '     ?place wdt:P17 ?country.' +
            '     ?country rdfs:label ?countryLabel.' +
            '     FILTER(LANG(?countryLabel) = "ru" || LANG(?countryLabel) = "en")' +
            '   }' +
            ' }' +

            ' SERVICE wikibase:label {' +
            '   bd:serviceParam wikibase:language "ru,en".' +
            ' }' +

            '} LIMIT 1';

        var url = 'https://query.wikidata.org/sparql?format=json&query=' +
            encodeURIComponent(query);

        fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        })
        .then(function (response) {
            if (!response.ok) throw new Error('Wikidata HTTP ' + response.status);
            return response.json();
        })
        .then(function (json) {
            var bindings = json.results && json.results.bindings;
            var b = bindings && bindings[0];
            var info = {};

            if (b) {
                info.birth = b.birth ? b.birth.value : null;
                info.death = b.death ? b.death.value : null;

                info.place = b.placeLabel ? b.placeLabel.value : null;
                info.country = b.countryLabel ? b.countryLabel.value : null;

                if (b.height) {
                    var h = parseFloat(b.height.value);
                    var unit = b.heightUnit ? b.heightUnit.value : '';

                    if (/Q174728$/.test(unit)) {
                        // Сантиметры
                        info.height = Math.round(h);
                    }
                    else if (/Q11573$/.test(unit)) {
                        // Метры
                        info.height = Math.round(h * 100);
                    }
                    else if (/Q218593$/.test(unit)) {
                        // Дюймы
                        info.height = Math.round(h * 2.54);
                    }
                    else {
                        // Запасной вариант для единиц без указания
                        info.height = Math.round(h <= 3 ? h * 100 : h);
                    }
                }
            }

            cache[tmdbId] = info;
            finish(info);
        })
        .catch(function () {
            finish(null);
        });

        function finish(info) {
            var callbacks = requests[tmdbId] || [];
            delete requests[tmdbId];

            callbacks.forEach(function (fn) {
                fn(info);
            });
        }
    }

    function calcAge(birth, death) {
        var b = new Date(birth);
        var end = death ? new Date(death) : new Date();

        if (isNaN(b.getTime()) || isNaN(end.getTime())) return null;

        var age = end.getFullYear() - b.getFullYear();

        if (
            end.getMonth() < b.getMonth() ||
            (
                end.getMonth() === b.getMonth() &&
                end.getDate() < b.getDate()
            )
        ) {
            age--;
        }

        return age;
    }

    function plural(n) {
        var a = n % 10;
        var b = n % 100;

        if (a === 1 && b !== 11) return 'год';
        if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'года';

        return 'лет';
    }

    function personPage() {
        var act = Lampa.Activity.active();

        if (!act || act.component !== 'actor') return;

        var $page = act.activity && act.activity.render
            ? act.activity.render()
            : $(document.body);

        var $name = $page.find('.full-person__name').first();

        if (!$name.length) return;

        var id = act.id ||
            (act.params && act.params.id) ||
            (act.object && act.object.id) ||
            (act.card && act.card.id);

        if (!id) return;

        // Не запускаем повторные запросы для той же карточки.
        if ($name.data('pi-done') || $name.data('pi-loading')) return;

        $name.data('pi-loading', true);

        var $birthday = $page.find('.full-person__birthday').first();
        var $place = $page.find('.full-person__place').first();

        // Не изменяем стандартную дату рождения.
        getInfo(id, function (info) {
            if (!$.contains(document, $name[0]) && !$page.is('body')) {
                return;
            }

            $name.removeData('pi-loading');

            if (!info) return;

            $name.data('pi-done', true);

            var $details = $page.find('.person-info-plugin').first();

            if (!$details.length) {
                $details = $('<div class="person-info-plugin"></div>').css({
                    'font-size': '1.1em',
                    'line-height': '1.6',
                    'margin-top': '0.5em'
                });

                if ($place.length) {
                    $place.after($details);
                }
                else if ($birthday.length) {
                    $birthday.after($details);
                }
                else {
                    $name.after($details);
                }
            }

            $details.empty();

            function addLine(label, value) {
                if (!value) return;

                $('<div></div>')
                    .text(label + ': ' + value)
                    .appendTo($details);
            }

            var birthplace = [];

            if (info.place) birthplace.push(info.place);

            if (
                info.country &&
                info.country.toLowerCase() !==
                    (info.place || '').toLowerCase()
            ) {
                birthplace.push(info.country);
            }

            // Обновляем место рождения в стандартной карточке.
            if ($place.length && birthplace.length) {
                $place.text(birthplace.join(', '));
            }
            else if (birthplace.length) {
                addLine('Место рождения', birthplace.join(', '));
            }

            if (info.birth) {
                var age = calcAge(info.birth, info.death);

                if (age !== null && age >= 0) {
                    if (info.death) {
                        addLine('Возраст на момент смерти',
                            age + ' ' + plural(age));
                    }
                    else {
                        addLine('Возраст', age + ' ' + plural(age));
                    }
                }
            }

            if (info.height > 0 && info.height < 300) {
                addLine('Рост', info.height + ' см');
            }

            if (!$details.children().length) {
                $details.remove();
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
        }).observe(document.body, {
            childList: true,
            subtree: true
        });

        process();
    }

    if (window.appready) {
        start();
    }
    else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    }
})();

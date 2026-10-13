

(function () {
    'use strict';

    if (window.person_info_plugin) return;
    window.person_info_plugin = true;

    var cache = {};
    var requests = {};

    // ================= НАСТРОЙКИ =================

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
            onChange: process
        });
    }

    // ================= КОММЕНТАРИИ =================

    function hideComments() {
        var hide = Lampa.Storage.field('hide_comments') === true;

        $('.items-line').each(function () {
            var title = $(this).find('.items-line__title').text().trim();

            if (title === 'Комментарии' || title === 'Comments') {
                $(this).toggle(!hide);
            }
        });
    }

    // ================= ВОЗРАСТ =================

    function calcAge(birth, death) {
        if (!birth) return null;

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

        return age >= 0 ? age : null;
    }

    function plural(n) {
        var last = n % 10;
        var lastTwo = n % 100;

        if (last === 1 && lastTwo !== 11) return 'год';

        if (
            last >= 2 && last <= 4 &&
            (lastTwo < 12 || lastTwo > 14)
        ) {
            return 'года';
        }

        return 'лет';
    }

    // ================= WIKIDATA =================

    function getInfo(tmdbId, callback) {
        tmdbId = String(tmdbId || '').replace(/\D/g, '');

        if (!tmdbId) {
            callback(null);
            return;
        }

        if (Object.prototype.hasOwnProperty.call(cache, tmdbId)) {
            callback(cache[tmdbId]);
            return;
        }

        if (requests[tmdbId]) {
            requests[tmdbId].push(callback);
            return;
        }

        requests[tmdbId] = [callback];

        var query = `
SELECT ?birth ?death ?height ?heightUnit
       ?placeLabel ?adminLabel ?countryLabel
WHERE {
    ?person wdt:P4985 "${tmdbId}".

    OPTIONAL { ?person wdt:P569 ?birth. }
    OPTIONAL { ?person wdt:P570 ?death. }

    OPTIONAL {
        ?person p:P2048 ?heightStatement.
        ?heightStatement ps:P2048 ?height.
        OPTIONAL {
            ?heightStatement psv:P2048/wikibase:quantityUnit ?heightUnit.
        }
    }

    OPTIONAL {
        ?person wdt:P19 ?place.
        OPTIONAL { ?place wdt:P131 ?admin. }
        OPTIONAL { ?place wdt:P17 ?country. }
    }

    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "ru,en".
    }
}
LIMIT 1`;

        var url =
            'https://query.wikidata.org/sparql?format=json&query=' +
            encodeURIComponent(query);

        fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Wikidata HTTP ' + response.status);
            }

            return response.json();
        })
        .then(function (json) {
            var bindings =
                json.results && json.results.bindings || [];

            var b = bindings[0];
            var info = {};

            if (b) {
                info.birth = b.birth ? b.birth.value : null;
                info.death = b.death ? b.death.value : null;

                info.place = b.placeLabel ? b.placeLabel.value : null;
                info.admin = b.adminLabel ? b.adminLabel.value : null;
                info.country = b.countryLabel ? b.countryLabel.value : null;

                if (b.height) {
                    var h = parseFloat(b.height.value);
                    var unit = b.heightUnit ? b.heightUnit.value : '';

                    if (/Q174728$/.test(unit)) {
                        info.height = Math.round(h);
                    }
                    else if (/Q11573$/.test(unit)) {
                        info.height = Math.round(h * 100);
                    }
                    else if (/Q218593$/.test(unit)) {
                        info.height = Math.round(h * 2.54);
                    }
                    else if (!unit) {
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

    // ================= КАРТОЧКА АКТЁРА =================

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

        if ($name.data('pi-loading') || $name.data('pi-done')) return;

        $name.data('pi-loading', true);

        getInfo(id, function (info) {
            $name.removeData('pi-loading');

            if (!info) {
                $name.data('pi-done', true);
                return;
            }

            $name.data('pi-done', true);

            var $birthday = $page.find('.full-person__birthday').first();
            var $place = $page.find('.full-person__place').first();

            // Возраст добавляется в скобках к существующей дате.
            if (info.birth && $birthday.length) {
                var age = calcAge(info.birth, info.death);

                if (age !== null) {
                    var original = $birthday.data('pi-original');

                    if (original === undefined) {
                        original = $birthday.text().trim();
                        $birthday.data('pi-original', original);
                    }

                    var suffix = info.death
                        ? ' (умер в возрасте ' + age + ' ' + plural(age) + ')'
                        : ' (' + age + ' ' + plural(age) + ')';

                    $birthday.text(original + suffix);
                }
            }

            // Собираем место рождения, не переводя остальную страницу.
            var location = [];

            if (info.place) location.push(info.place);

            if (
                info.admin &&
                info.admin.toLowerCase() !==
                    (info.place || '').toLowerCase()
            ) {
                location.push(info.admin);
            }

            if (
                info.country &&
                info.country.toLowerCase() !==
                    (info.place || '').toLowerCase() &&
                info.country.toLowerCase() !==
                    (info.admin || '').toLowerCase()
            ) {
                location.push(info.country);
            }

            if (location.length && $place.length) {
                $place.text(location.join(', '));
            }

            // Отдельный блок дополнительных сведений.
            var $details = $page.find('.person-info-plugin').first();

            if (!$details.length) {
                $details = $('<div class="person-info-plugin"></div>').css({
                    'font-size': '1.1em',
                    'line-height': '1.6',
                    'margin-top': '0.3em'
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

            if (location.length && !$place.length) {
                $('<div></div>')
                    .text('Место рождения: ' + location.join(', '))
                    .appendTo($details);
            }

            if (
                info.height &&
                info.height > 0 &&
                info.height < 300
            ) {
                $('<div></div>')
                    .text('Рост: ' + info.height + ' см')
                    .appendTo($details);
            }

            if (!$details.children().length) {
                $details.remove();
            }
        });
    }

    // ================= ЗАПУСК =================

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

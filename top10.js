/*
 * Netflix Global Top 10 add-on for Lampa 3.x.
 * Does not replace or modify an existing netflix-top10.js plugin.
 * The companion GitHub Actions workflow publishes the JSON mirror.
 */
(function () {
    'use strict';

    if (window.__lampaNetflixGlobalTop10Loaded) return;
    window.__lampaNetflixGlobalTop10Loaded = true;

    var PLUGIN = 'Netflix Global Top 10';
    var DATA_URL = 'https://bkloxy.github.io/netflix-top10/netflix-top10.json';
    var CACHE_KEY = 'netflix_top10_tmdb_map_v1';
    var CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
    var dataPromise = null;

    function log(message, error) {
        if (window.console && console.log) console.log('[Netflix Top 10] ' + message, error || '');
    }

    function normalizeTitle(value) {
        var text = String(value || '').toLowerCase();
        if (text.normalize) text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        return text.replace(/&/g, ' and ')
            .replace(/[^a-z0-9\u0400-\u04ff\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
    }

    function getStorage(key, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
                var value = Lampa.Storage.get(key, fallback);
                return value == null ? fallback : value;
            }
        } catch (e) {}
        return fallback;
    }

    function setStorage(key, value) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.set === 'function') {
                Lampa.Storage.set(key, value);
            }
        } catch (e) {}
    }

    function loadJson() {
        if (dataPromise) return dataPromise;
        dataPromise = fetch(DATA_URL + '?_=' + Date.now(), { cache: 'no-store' })
            .then(function (response) {
                if (!response.ok) throw new Error('Mirror returned HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                if (!data || data.schema_version !== 1 || !Array.isArray(data.movies) || !Array.isArray(data.tv)) {
                    throw new Error('Unknown or incomplete JSON schema');
                }
                return data;
            })
            .catch(function (error) {
                log('could not load mirror; no unverified fallback will be shown', error);
                return { status: 'unavailable', movies: [], tv: [] };
            });
        return dataPromise;
    }

    function tmdbGet(path, params) {
        return new Promise(function (resolve) {
            try {
                if (!window.Lampa || !Lampa.Api || !Lampa.Api.sources || !Lampa.Api.sources.tmdb ||
                    typeof Lampa.Api.sources.tmdb.get !== 'function') {
                    resolve(null);
                    return;
                }
                var settled = false;
                function done(value) {
                    if (settled) return;
                    settled = true;
                    resolve(value || null);
                }
                Lampa.Api.sources.tmdb.get(path, params, done, function () { done(null); });
            } catch (e) {
                resolve(null);
            }
        });
    }

    function candidateNames(item) {
        return [item && item.title, item && item.name, item && item.original_title, item && item.original_name]
            .filter(Boolean).map(normalizeTitle);
    }

    function exactTitleMatch(results, title, type, weekEnding) {
        var expected = normalizeTitle(title);
        if (!expected) return null;
        var matches = results.filter(function (r) {
            return r && r.id && r.poster_path && candidateNames(r).indexOf(expected) !== -1;
        });
        if (!matches.length) return null;
        if (matches.length === 1) return matches[0];
        // Several titles share the name (remakes, same-name shows). The Netflix TSV has no year,
        // so: ignore titles released after the chart week, then take the most popular one.
        // TMDB popularity follows what is trending now, which is what a Top 10 chart reflects.
        var limit = weekEnding || '9999-12-31';
        var released = matches.filter(function (r) {
            var d = (type === 'movie' ? r.release_date : r.first_air_date) || '';
            return d && d <= limit;
        });
        var pool = released.length ? released : matches;
        pool.sort(function (x, y) { return (y.popularity || 0) - (x.popularity || 0); });
        return pool[0];
    }

    function mapCacheKey(type, title) {
        return type + '|' + normalizeTitle(title);
    }

    function pruneCache(cache) {
        Object.keys(cache).forEach(function (key) {
            if (!cache[key] || !cache[key].saved_at || Date.now() - cache[key].saved_at >= CACHE_TTL) delete cache[key];
        });
    }

    function cloneItem(source) {
        var copy = {};
        Object.keys(source).forEach(function (k) { copy[k] = source[k]; });
        return copy;
    }

    function resolveMetadata(entry, type, weekEnding) {
        var cache = getStorage(CACHE_KEY, {});
        var key = mapCacheKey(type, entry.title);
        var saved = cache[key];
        if (saved && saved.saved_at && Date.now() - saved.saved_at < CACHE_TTL && saved.item) {
            return Promise.resolve(cloneItem(saved.item));
        }

        return tmdbGet('search/' + type, { query: entry.title, language: 'en-US', page: 1 }).then(function (data) {
            var results = data && Array.isArray(data.results) ? data.results : [];
            var match = exactTitleMatch(results, entry.title, type, weekEnding);
            if (!match) return null;
            var date = type === 'movie' ? (match.release_date || '') : (match.first_air_date || '');
            var item = cloneItem(match);
            item.id = String(match.id);
            item.media_type = type;
            item.type = 'tmdb';
            item.source = 'tmdb';
            item.release_date = date;
            item.year = date ? date.slice(0, 4) : '';
            item.overview = match.overview || '';

            pruneCache(cache);
            cache[key] = { saved_at: Date.now(), item: item };
            setStorage(CACHE_KEY, cache);
            return cloneItem(item);
        }).catch(function () { return null; });
    }

    function decorate(item, entry, data) {
        item.netflix_top10_rank = entry.rank;
        item.netflix_top10_category_rank = entry.category_rank;
        item.netflix_top10_views = entry.weekly_views;
        item.netflix_top10_season_title = entry.season_title || null;
        item.netflix_top10_category = entry.source_category || '';
        item.netflix_top10_week_ending = data.week_ending || null;
        item.subTitle = 'NETFLIX TOP 10 \u00b7 \u2116 ' + entry.rank;
        item.description = 'Netflix Global Top 10 \u00b7 \u043c\u0435\u0441\u0442\u043e \u2116 ' + entry.rank +
            (data.week_ending ? '\n\u041d\u0435\u0434\u0435\u043b\u044f \u0434\u043e ' + data.week_ending : '') +
            (entry.weekly_views ? '\n\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u044b \u0437\u0430 \u043d\u0435\u0434\u0435\u043b\u044e: ' + Number(entry.weekly_views).toLocaleString('ru-RU') : '') +
            (entry.season_title ? '\n' + entry.season_title : '') +
            (item.overview ? '\n\n' + item.overview : '');
        return item;
    }

    function getRowItems(type) {
        return loadJson().then(function (data) {
            var entries = data && Array.isArray(data[type === 'movie' ? 'movies' : 'tv']) ?
                data[type === 'movie' ? 'movies' : 'tv'] : [];
            var stale = data && data.freshness_status === 'stale';
            if (!entries.length) return { items: [], stale: stale };
            return Promise.all(entries.slice(0, 10).map(function (entry) {
                return resolveMetadata(entry, type, data.week_ending).then(function (item) {
                    return item ? decorate(item, entry, data) : null;
                });
            })).then(function (items) {
                items = items.filter(Boolean).sort(function (a, b) {
                    return Number(a.netflix_top10_rank) - Number(b.netflix_top10_rank);
                });
                if (window.Lampa && Lampa.Utils && typeof Lampa.Utils.addSource === 'function') {
                    var wrapped = Lampa.Utils.addSource({ results: items }, 'tmdb');
                    if (wrapped && Array.isArray(wrapped.results)) items = wrapped.results;
                }
                return { items: items, stale: stale };
            });
        });
    }

    function categoryText(params, screen) {
        var parts = [];
        var keys = ['title', 'name', 'type', 'media_type', 'mediaType', 'url', 'source', 'component', 'section', 'category', 'method', 'id'];
        function walk(obj, depth) {
            if (!obj || depth > 3) return;
            if (typeof obj === 'string' || typeof obj === 'number') return;
            if (Array.isArray(obj)) {
                obj.slice(0, 20).forEach(function (v) { if (typeof v === 'object') walk(v, depth + 1); });
                return;
            }
            keys.forEach(function (key) {
                var value = obj[key];
                if (typeof value === 'string' || typeof value === 'number') parts.push(String(value));
                else if (value && typeof value === 'object') walk(value, depth + 1);
            });
        }
        walk(params, 0);
        if (typeof screen === 'string') parts.push(screen);
        else walk(screen, 0);
        try {
            if (Lampa.Activity && typeof Lampa.Activity.active === 'function') walk(Lampa.Activity.active(), 0);
        } catch (e) {}
        return parts.join(' ').toLowerCase();
    }

    function inferCategory(params, screen) {
        var text = categoryText(params, screen);
        var isTv = /\b(tv|series|serial|shows?)\b|сериал|телесериал|телепередач/.test(text);
        var isMovie = /\b(movie|movies|film|films|cinema)\b|фильм|кино/.test(text);
        if (isTv && !isMovie) return 'tv';
        if (isMovie && !isTv) return 'movie';
        return '';
    }

    function addContentRow(type, screenName, index) {
        Lampa.ContentRows.add({
            index: index,
            screen: [screenName],
            call: function (params, screen) {
                return function (callback) {
                    if (screenName === 'category' && inferCategory(params, screen) !== type) {
                        callback({ title: '', results: [], total_results: 0, total_pages: 1, page: 1 });
                        return;
                    }
                    getRowItems(type).then(function (result) {
                        var items = result.items;
                        var title = type === 'movie' ? '\u0424\u0438\u043b\u044c\u043c\u044b Netflix Top 10' : '\u0421\u0435\u0440\u0438\u0430\u043b\u044b Netflix Top 10';
                        if (result.stale) title += ' (\u0434\u0430\u043d\u043d\u044b\u0435 \u0443\u0441\u0442\u0430\u0440\u0435\u043b\u0438)';
                        callback({
                            title: items.length ? title : '',
                            results: items,
                            total_results: items.length,
                            total_pages: 1,
                            page: 1,
                            params: { source: 'tmdb' }
                        });
                    }).catch(function (error) {
                        log('failed to build ' + type + ' row', error);
                        callback({ title: '', results: [], total_results: 0, total_pages: 1, page: 1 });
                    });
                };
            }
        });
    }

    function unwrapDom(value) {
        if (!value) return null;
        if (value.nodeType === 1) return value;
        if (value[0] && value[0].nodeType === 1) return value[0];
        if (value.el && value.el.nodeType === 1) return value.el;
        if (value.html && value.html.nodeType === 1) return value.html;
        return null;
    }

    function findRank(data, depth) {
        if (!data || depth > 3) return 0;
        var direct = Number(data.netflix_top10_rank || data.netflixTop10Rank || 0);
        if (direct >= 1 && direct <= 10) return direct;
        return findRank(data.data, depth + 1) || findRank(data.movie, depth + 1) || findRank(data.object, depth + 1);
    }

    function attachRank(cardObject, eventObject, retry) {
        var data = (cardObject && (cardObject.data || cardObject.movie)) ||
            (eventObject && (eventObject.data || eventObject.movie || eventObject.object));
        var rank = findRank(data, 0);
        if (!rank) return;
        var node = unwrapDom(cardObject && (cardObject.render ? cardObject.render() : (cardObject.html || cardObject.element))) ||
            unwrapDom(eventObject && (eventObject.element || eventObject.html || eventObject.target));
        if (!node && retry < 3) {
            setTimeout(function () { attachRank(cardObject, eventObject, retry + 1); }, 60);
            return;
        }
        if (!node) return;
        var host = node.closest ? (node.closest('.card') || node) : node;
        if (host.querySelector && host.querySelector('.nf10-rank-number[data-nf10-rank="' + rank + '"]')) return;
        host.classList.add('nf10-rank-host');
        var badge = document.createElement('span');
        badge.className = 'nf10-rank-number';
        badge.setAttribute('data-nf10-rank', String(rank));
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = String(rank);
        host.insertBefore(badge, host.firstChild);
    }

    function installRankStyle() {
        if (document.getElementById('nf10-rank-style')) return;
        var style = document.createElement('style');
        style.id = 'nf10-rank-style';
        style.textContent = [
            '.nf10-rank-host{position:relative!important;overflow:visible!important;isolation:isolate}',
            '.nf10-rank-host .card__view{position:relative;z-index:1}',
            '.nf10-rank-number{position:absolute;left:-.27em;bottom:-.12em;z-index:0;pointer-events:none;user-select:none;',
            'font-family:Arial,Helvetica,sans-serif;font-size:clamp(5.5rem,13vw,11rem);font-weight:900;line-height:.78;letter-spacing:-.09em;',
            'color:rgba(0,0,0,0);-webkit-text-fill-color:transparent;-webkit-text-stroke:2.7px rgba(220,224,230,.78);',
            'text-shadow:0 3px 20px rgba(0,0,0,.55);opacity:.98}',
            '@supports not (-webkit-text-stroke:1px white){.nf10-rank-number{color:rgba(220,224,230,.18);text-shadow:2px 0 #aaa,-2px 0 #aaa,0 2px #aaa,0 -2px #aaa}}'
        ].join('');
        document.head.appendChild(style);
    }

    function init() {
        if (!window.Lampa || !Lampa.ContentRows || typeof Lampa.ContentRows.add !== 'function') {
            log('Lampa.ContentRows is not available; this add-on requires Lampa 3.x');
            return;
        }
        installRankStyle();
        if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
            Lampa.Listener.follow('card', function (e) {
                attachRank(e && (e.object || e.card || e.item), e || {}, 0);
            });
        }

        // Main page: two consecutive rows roughly four/five rows below the top.
        addContentRow('movie', 'main', 4);
        addContentRow('tv', 'main', 5);
        // Movie and TV category rows are filtered by the active category parameters.
        addContentRow('movie', 'category', 4);
        addContentRow('tv', 'category', 4);
        log('ready; source mirror: ' + DATA_URL);
    }

    if (window.appready) init();
    else if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') init();
        });
    }
})();

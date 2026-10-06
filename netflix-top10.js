(function () {
    'use strict';

    // ===================== НАСТРОЙКИ =====================
    var RADIUS = '0.25em';       // Скругление углов постеров
    var FOCUS_SCALE = 1.05;      // Масштаб карточки при наведении
    var TOP_ROW = 4;             // Номер ряда для Топ 10 на главной
    var GENRE_ROW = 5;           // Номер ряда для Жанров
    var RED = '#e50914';         // Красный цвет Netflix

    var T_CONTINUE = 'Продолжить просмотр';
    var T_TOP_ALL = 'Топ 10 за неделю';
    var T_TOP_MOVIE = 'Топ 10 фильмов за неделю';
    var T_TOP_TV = 'Топ 10 сериалов за неделю';
    var T_GENRES = 'Жанры';

    var GENRES = [
        { n: 'Боевики', t: 'movie', id: 28 },
        { n: 'Комедии', t: 'movie', id: 35 },
        { n: 'Драмы', t: 'movie', id: 18 },
        { n: 'Ужасы', t: 'movie', id: 27 },
        { n: 'Фантастика', t: 'movie', id: 878 },
        { n: 'Триллеры', t: 'movie', id: 53 },
        { n: 'Мелодрамы', t: 'movie', id: 10749 },
        { n: 'Мультфильмы', t: 'movie', id: 16 },
        { n: 'Приключения', t: 'movie', id: 12 },
        { n: 'Криминал', t: 'movie', id: 80 },
        { n: 'Детективные сериалы', t: 'tv', id: 9648 },
        { n: 'Документальные', t: 'movie', id: 99 }
    ];

    var COLORS = ['#b3123b', '#1b5fa8', '#2e7d4f', '#7b3fa0', '#c2631a', '#0e7c86',
        '#a02c5a', '#3d4db7', '#6d7a1a', '#8a2be2', '#b8860b', '#2f6f6f'];

    var continueMeta = [];

    // ===================== ХЕЛПЕРЫ =====================
    function tmdb(path, cb) {
        try {
            var net = new Lampa.Reguest();
Ошибка на первой фотографии `image_2.png`[span_2](start_span)[span_2](end_span) возникла из-за того, что предыдущий CSS-код глобально применял скругления (`border-radius: 0.25em`) ко всем элементам с классом `.card__view`. В мобильном интерфейсе Лампы маленькие круглые иконки разделов (например, огонёк возле текста «Популярные фильмы») технически тоже используют этот класс, поэтому код ошибочно растянул их и превратил в огромные белые прямоугольные постеры[span_3](start_span)[span_3](end_span). На второй фотографии `image_3.png`[span_4](start_span)[span_4](end_span) показан правильный вид: аккуратная маленькая круглая иконка, стоящая строго слева от заголовка[span_5](start_span)[span_5](end_span).

Чтобы исправить этот баг и вернуть иконкам заголовков их исходную круглую форму, необходимо принудительно исключить их из "постерных" стилей Netflix и задать им жесткие рамки круга.

Замени в своем файле `netflix-top10.js` функцию `addStyles` на обновленный вариант ниже:

```javascript
    // ===================== СТИЛИ ИНТЕРФЕЙСА =====================
    function addStyles() {
        var css = '' +
            /* Скругление только постеров и карточек */
            '.card__view, .card__img {border-radius:' + RADIUS + '!important}' +
            '.card .card__view::after {border-radius:' + RADIUS + '!important}' +
            '.full-start__poster, .full-start-new__poster, .full-start__img, .full-start-new__img {border-radius:' + RADIUS + '!important}' +
            
            /* ЖЁСТКИЙ ФИКС ДЛЯ ИКОНОК КАТЕГОРИЙ (ОГОНЁК И Т.Д.) */
            '.items-line__icon, .items-line__icon .card__view, .items-line__head .card__view { ' +
            '    border-radius: 50% !important; ' +
            '    padding-bottom: 100% !important; ' +
            '}' +
            '.items-line__head .card, .items-line__icon { ' +
            '    width: 2.5em !important; ' +
            '    height: 2.5em !important; ' +
            '    min-width: 2.5em !important; ' +
            '    background: transparent !important; ' +
            '}' +
            
            /* Актёры остаются стандартными круглыми иконками Лампы */
            '.full-person__photo {border-radius:50%!important}' +
            /* Эффекты карточек */
            '.items-line .card {transition:transform .2s ease}' +
            '.items-line .card.focus {transform:scale(' + FOCUS_SCALE + ');z-index:3}' +
            '.items-line__title {font-weight:700}' +
            /* Цифры Топ 10 */
            '.nf-rank {position:absolute;left:-.05em;bottom:-.15em;font-size:5em;font-weight:900;line-height:1;' +
            'color:#000;-webkit-text-stroke:.03em #fff;text-shadow:0 0 .3em rgba(0,0,0,.8);z-index:5;pointer-events:none}' +
            /* Продолжить просмотр */
            '.nf-continue .card {width:21em!important}' +
            '.nf-continue .card__view {padding-bottom:56%!important}' +
            '.nf-continue .card__img {object-fit:cover}' +
            '.nf-progress {position:absolute;left:0;right:0;bottom:0;height:.35em;background:rgba(255,255,255,.3);z-index:5}' +
            '.nf-progress i {display:block;height:100%;background:' + RED + '}' +
            '.nf-label {margin-top:.3em;font-size:1.05em;opacity:.75}' +
            /* Плитки жанров */
            '.nf-genres .card {width:13em!important}' +
            '.nf-genres .card__view {padding-bottom:100%!important}' +
            '.nf-genres .card__img, .nf-genres .card__title, .nf-genres .card__age, .nf-genres .card__vote {display:none!important}' +
            '.nf-genre-name {position:absolute;left:0;right:0;bottom:0;padding:.8em;font-size:1.5em;font-weight:800;' +
            'line-height:1.1;color:#fff;text-shadow:0 .1em .4em rgba(0,0,0,.6);z-index:4}';
        $('body').append('<style id="nf-style">' + css + '</style>');
    }

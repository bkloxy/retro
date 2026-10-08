/* =========================================================
   RETRO NETFLIX — SQUARE CARDS / SMOOTH ANIMATION
   ========================================================= */

.retro-netflix .content {
    padding-left: 0 !important;
}

/* Ряды */
.retro-netflix .items-line {
    margin-bottom: 42px !important;
}

/* Заголовок ряда */
.retro-netflix .items-line__title {
    margin-bottom: 17px !important;
    color: #fff !important;
    font-size: 1.42em !important;
    font-weight: 700 !important;
}

/* =========================================================
   КАРТОЧКИ
   ========================================================= */

.retro-netflix .items-line .card {

    width: 180px !important;
    min-width: 180px !important;
    max-width: 180px !important;

    height: auto !important;

    margin-right: 14px !important;

    position: relative !important;

    overflow: visible !important;

    transform: translateZ(0);

}

/* Сам контейнер постера */

.retro-netflix .items-line .card__view {

    width: 180px !important;
    height: 180px !important;

    aspect-ratio: 1 / 1 !important;

    border-radius: 6px !important;

    overflow: hidden !important;

    background: #111 !important;

    transform:
        translate3d(0,0,0)
        scale(1);

    transform-origin: center center;

    transition:
        transform 420ms cubic-bezier(.16,1,.3,1),
        box-shadow 420ms cubic-bezier(.16,1,.3,1);

    will-change: transform;

}

/* Картинка */

.retro-netflix .items-line .card__img {

    width: 100% !important;
    height: 100% !important;

    aspect-ratio: 1 / 1 !important;

    object-fit: cover !important;

    border-radius: 6px !important;

    transform:
        translate3d(0,0,0)
        scale(1);

    transition:
        transform 500ms cubic-bezier(.16,1,.3,1);

    will-change: transform;

}

/* =========================================================
   ФОКУС
   ========================================================= */

.retro-netflix .items-line .card.focus {

    z-index: 100 !important;

}

/*
 * Очень мягкое увеличение.
 * Не 1.075 — это было слишком резко.
 */

.retro-netflix .items-line .card.focus .card__view {

    transform:
        translate3d(0,0,0)
        scale(1.045);

    box-shadow:
        0 0 0 3px #fff,
        0 12px 35px rgba(0,0,0,.55);

}

/* Лёгкое увеличение изображения */

.retro-netflix .items-line .card.focus .card__img {

    transform:
        translate3d(0,0,0)
        scale(1.015);

}

/* =========================================================
   НАЗВАНИЕ
   ========================================================= */

.retro-netflix .card__title {

    margin-top: 9px !important;

    color: #fff !important;

    font-size: .92em !important;

    font-weight: 600 !important;

}

/* =========================================================
   БОЛЬШОЙ ЭКРАН
   ========================================================= */

@media (min-width: 1400px) {

    .retro-netflix .items-line .card {

        width: 200px !important;
        min-width: 200px !important;
        max-width: 200px !important;

    }

    .retro-netflix .items-line .card__view {

        width: 200px !important;
        height: 200px !important;

    }

}

/* =========================================================
   МАЛЕНЬКИЙ ЭКРАН
   ========================================================= */

@media (max-width: 900px) {

    .retro-netflix .items-line .card {

        width: 135px !important;
        min-width: 135px !important;
        max-width: 135px !important;

    }

    .retro-netflix .items-line .card__view {

        width: 135px !important;
        height: 135px !important;

    }

}

(function () {
    'use strict';

    /*
     * RETRO — NATIVE LAMPA PLAYER SKIN
     *
     * ВАЖНО:
     * Не создаём второй плеер.
     * Не создаём второй <video>.
     * Не перехватываем клавиатуру.
     * Работаем только с родным интерфейсом Lampa.
     */

    if (window.retro_native_player_ready) return;
    window.retro_native_player_ready = true;

    // =========================================================
    // Удаляем старую версию нашего экспериментального плеера,
    // если она каким-то образом осталась в текущей странице.
    // =========================================================

    function removeOldPlayer() {
        try {
            $('#nf-custom-player').remove();
            $('#nf-custom-player-style').remove();

            // Старые обработчики нашей предыдущей версии
            $(window).off('.nfplayer');
            $(document).off('.nfplayer');
        } catch (e) {}
    }

    removeOldPlayer();

    // =========================================================
    // CSS
    // =========================================================

    function installStyle() {
        if ($('#retro-native-player-style').length) return;

        var css = `

        /* =====================================================
           ОСНОВА
           ===================================================== */

        .player.retro-native-player {
            background: #000 !important;
        }

        /* =====================================================
           ВЕРХНЯЯ ЧАСТЬ
           ===================================================== */

        .retro-native-player .player-info {
            pointer-events: none;
        }

        /*
         * Оставляем ОДНУ родную кнопку назад.
         * Никакой второй кнопки нашего плеера здесь нет.
         */

        .retro-native-player .player-info .head-backward {
            pointer-events: auto !important;
            z-index: 20;
        }

        .retro-native-player .player-info .head-backward__button,
        .retro-native-player .player-info .head-backward {
            transition:
                transform .18s ease,
                opacity .18s ease;
        }

        .retro-native-player .player-info .head-backward:hover {
            transform: scale(1.06);
        }

        /*
         * Родное название Lampa переносим вправо.
         * Благодаря этому второго названия больше нет.
         */

        .retro-native-player .player-info__title {
            position: absolute !important;

            top: 0.65em !important;
            right: 2.0em !important;
            left: auto !important;

            width: auto !important;
            max-width: 58% !important;

            text-align: right !important;

            font-size: 1.65em !important;
            font-weight: 650 !important;
            line-height: 1.25 !important;

            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;

            text-shadow:
                0 2px 10px rgba(0,0,0,.85),
                0 1px 3px rgba(0,0,0,.9) !important;
        }

        /*
         * Техническое имя файла/источника не дублируем.
         */

        .retro-native-player .player-info__name {
            display: none !important;
        }

        /*
         * Время оставляем справа ниже названия.
         */

        .retro-native-player .player-info__time {
            top: 2.65em !important;
            right: 2.0em !important;
        }

        .retro-native-player .player-info__time-end {
            top: 4.35em !important;
            right: 2.0em !important;
        }

        /* =====================================================
           НИЖНЯЯ ПАНЕЛЬ
           ===================================================== */

        .retro-native-player .player-panel {
            z-index: 30 !important;
        }

        .retro-native-player .player-panel__body {
            padding-left: 3.0em !important;
            padding-right: 3.0em !important;
            padding-bottom: 1.65em !important;
        }

        /*
         * Шкала — тонкая, Netflix-подобная.
         */

        .retro-native-player .player-panel__timeline {
            height: .28em !important;
            border-radius: 10px !important;

            background: rgba(255,255,255,.35) !important;

            margin-bottom: .85em !important;

            transition:
                height .15s ease,
                box-shadow .15s ease !important;
        }

        .retro-native-player .player-panel__timeline:hover,
        .retro-native-player .player-panel__timeline.focus {
            height: .42em !important;
        }

        .retro-native-player .player-panel__position {
            background: #e50914 !important;
            border-radius: 10px !important;
        }

        .retro-native-player .player-panel__peding {
            background: rgba(255,255,255,.28) !important;
            border-radius: 10px !important;
        }

        /* =====================================================
           ВРЕМЯ
           ===================================================== */

        .retro-native-player .player-panel__line-one {
            margin-bottom: .35em !important;
        }

        .retro-native-player .player-panel__timenow,
        .retro-native-player .player-panel__timeend {
            font-size: 1em !important;
            font-weight: 500 !important;
            text-shadow: 0 2px 6px rgba(0,0,0,.8) !important;
        }

        /* =====================================================
           ОСНОВНЫЕ КНОПКИ
           ===================================================== */

        .retro-native-player .player-panel__line-two {
            align-items: center !important;
        }

        .retro-native-player .player-panel .button {
            transition:
                transform .16s ease,
                background-color .16s ease,
                color .16s ease !important;
        }

        .retro-native-player .player-panel .button.focus,
        .retro-native-player .player-panel .button:hover {
            transform: scale(1.08);
        }

        /*
         * Родная Play/Pause.
         */

        .retro-native-player .player-panel__playpause {
            width: 3.25em !important;
            height: 3.25em !important;

            border-radius: 50% !important;

            background: #fff !important;
            color: #000 !important;

            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            box-shadow: 0 2px 14px rgba(0,0,0,.35);
        }

        .retro-native-player .player-panel__playpause.focus,
        .retro-native-player .player-panel__playpause:hover {
            background: #fff !important;
            color: #000 !important;
            transform: scale(1.09) !important;
        }

        /* =====================================================
           ПЕРЕВОД / СУБТИТРЫ / АУДИО
           ===================================================== */

        /*
         * Вот именно эти три элемента опускаем.
         */

        .retro-native-player .player-panel__flow,
        .retro-native-player .player-panel__subs,
        .retro-native-player .player-panel__tracks {
            transform: translateY(.55em) !important;
        }

        .retro-native-player .player-panel__flow:hover,
        .retro-native-player .player-panel__subs:hover,
        .retro-native-player .player-panel__tracks:hover,

        .retro-native-player .player-panel__flow.focus,
        .retro-native-player .player-panel__subs.focus,
        .retro-native-player .player-panel__tracks.focus {
            transform: translateY(.55em) scale(1.06) !important;
        }

        /*
         * Делаем их похожими на Netflix-пилюли.
         */

        .retro-native-player .player-panel__flow,
        .retro-native-player .player-panel__subs,
        .retro-native-player .player-panel__tracks {
            min-height: 2.45em !important;

            padding-left: .9em !important;
            padding-right: .9em !important;

            border-radius: 1.5em !important;

            background: rgba(35,35,35,.88) !important;
            border: 1px solid rgba(255,255,255,.15) !important;

            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }

        /* =====================================================
           НАСТРОЙКИ / FULLSCREEN / QUALITY
           ===================================================== */

        .retro-native-player .player-panel__settings,
        .retro-native-player .player-panel__fullscreen,
        .retro-native-player .player-panel__quality {
            border-radius: 50% !important;
        }

        /* =====================================================
           ВОЗВРАТ В НАЧАЛО
           ===================================================== */

        /*
         * Это родной Lampa tstart.
         * Не создаём отдельную кнопку.
         */

        .retro-native-player .player-panel__tstart {
            opacity: .9 !important;
        }

        .retro-native-player .player-panel__tstart:hover,
        .retro-native-player .player-panel__tstart.focus {
            opacity: 1 !important;
            transform: scale(1.08) !important;
        }

        /* =====================================================
           РОДНОЙ ЦЕНТРАЛЬНЫЙ PLAY/PAUSE
           ===================================================== */

        .retro-native-player .player-video__paused {
            background: rgba(0,0,0,.45) !important;
            border-radius: 50% !important;

            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }

        /* =====================================================
           СКРЫВАЕМ НЕНУЖНЫЕ ДУБЛИ, НО НЕ ТРОГАЕМ VIDEO
           ===================================================== */

        /*
         * Никаких display:none для .player-panel,
         * .player-video или самого video.
         *
         * Нативный Lampa Player должен продолжать работать.
         */

        `;

        $('head').append(
            '<style id="retro-native-player-style">' +
            css +
            '</style>'
        );
    }

    // =========================================================
    // Применение класса к НАТИВНОМУ player
    // =========================================================

    function decorate() {
        installStyle();

        var player = $('.player');

        if (!player.length) return;

        player.addClass('retro-native-player');

        /*
         * Если старая версия интерфейса каким-то образом
         * ещё существует — уничтожаем её.
         */

        $('#nf-custom-player').remove();
    }

    // =========================================================
    // PLAYER START
    // =========================================================

    function init() {
        installStyle();

        Lampa.Listener.follow('player', function (e) {

            if (e.type === 'start') {
                setTimeout(decorate, 0);
                setTimeout(decorate, 250);
                setTimeout(decorate, 700);
            }

            if (e.type === 'destroy' || e.type === 'close') {
                $('.player').removeClass('retro-native-player');
            }
        });

        /*
         * На случай динамического создания DOM.
         */

        setInterval(function () {
            if (Lampa.Player && Lampa.Player.opened) {
                decorate();
            }
        }, 1000);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();

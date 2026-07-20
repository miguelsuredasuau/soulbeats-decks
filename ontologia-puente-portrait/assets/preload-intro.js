/* SOULBEATS · preload-intro.js — mientras reveal.js + fuentes CDN cargan, el
 * deck muestra la intro de marca en vez de una pantalla en blanco.
 *
 * AUTOCONTENIDO y opt-in (meta.brand_intro: true). NO está cableado en
 * build/build.ts — integración exacta (mismo patrón que confetti.js):
 *
 *   if (meta.brand_intro) {
 *     for (const fn of ['preload-intro.js', 'preload-intro.css'])
 *       fs.copyFileSync(path.join(SKILL, 'generator', fn), path.join(outDir, 'assets', fn));
 *     fs.copyFileSync(path.join(SKILL, 'lab', 'remotion', 'out', 'brand-intro-169-short.mp4'),
 *       path.join(outDir, 'assets', 'brand-intro.mp4'));
 *     fs.copyFileSync(path.join(SKILL, 'lab', 'remotion', 'out', 'brand-intro-poster.png'),
 *       path.join(outDir, 'assets', 'brand-intro-poster.png'));
 *     html = html.replace('</head><body>',
 *       '<link rel="stylesheet" href="assets/preload-intro.css"></head><body>'
 *       + '<script src="assets/preload-intro.js"></scr' + 'ipt>');
 *   }
 *
 * El <script> debe quedar JUSTO tras abrir <body>: el overlay pinta antes de
 * que el parser llegue a las slides. Contrato de comportamiento:
 *   · <video muted autoplay playsinline> con la intro corta (~2.7s); si acaba
 *     antes de que el deck esté listo, sostiene su último frame (limpio).
 *   · se desvanece cuando Reveal dispara 'ready' — con mínimo garantizado
 *     (~1.2s) para que nunca haga blink.
 *   · tap/click o Esc/Enter/espacio = saltar al instante.
 *   · vídeo ausente/roto o prefers-reduced-motion → póster estático del
 *     wordmark. Sin póster → navy limpio. JAMÁS rompe el deck.
 * Config opcional vía data-attrs del <script>: data-video, data-poster,
 * data-min-ms, data-max-ms. */

(function () {
  'use strict';
  try {
    var script = document.currentScript;
    var attr = function (name, fallback) {
      var v = script && script.getAttribute(name);
      return v === null || v === undefined || v === '' ? fallback : v;
    };
    var cfg = {
      video: attr('data-video', 'assets/brand-intro.mp4'),
      poster: attr('data-poster', 'assets/brand-intro-poster.png'),
      minMs: parseInt(attr('data-min-ms', '1200'), 10) || 1200,
      maxMs: parseInt(attr('data-max-ms', '10000'), 10) || 10000,
    };

    var t0 = Date.now();
    var root = document.createElement('div');
    root.id = 'sb-preload';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-label', 'Cargando la historia…');

    var reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (eMedia) { /* matchMedia ausente → asumimos motion ok */ }

    var showPoster = function () {
      if (root.querySelector('.sb-poster')) return;
      var v = root.querySelector('video');
      if (v) {
        try { v.pause(); } catch (ePause) { /* sin reproducción que parar */ }
        root.removeChild(v);
      }
      var img = document.createElement('img');
      img.className = 'sb-poster';
      img.alt = 'soulbeats · story decks con alma';
      img.addEventListener('error', function () {
        img.style.display = 'none'; // ni póster: queda el navy de la casa, limpio
      });
      img.src = cfg.poster;
      root.appendChild(img);
    };

    if (reduced) {
      showPoster();
    } else {
      var video = document.createElement('video');
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.preload = 'auto';
      // atributos espejo: iOS/Safari los exige EN el markup para autoplay inline
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.poster = cfg.poster;
      video.addEventListener('error', showPoster);
      video.src = cfg.video;
      root.appendChild(video);
      var playing = video.play();
      if (playing && typeof playing.catch === 'function') {
        // autoplay bloqueado: el poster del <video> sostiene el frame de marca
        playing.catch(function () {});
      }
    }

    var dismissed = false;
    var dismiss = function (immediate) {
      if (dismissed) return;
      dismissed = true;
      var go = function () {
        root.classList.add('sb-out');
        var v = root.querySelector('video');
        if (v) {
          try { v.pause(); } catch (ePause2) { /* ya parado */ }
        }
        window.setTimeout(function () {
          if (root.parentNode) root.parentNode.removeChild(root);
        }, 600);
      };
      if (immediate) {
        go();
        return;
      }
      // mínimo garantizado: nunca un blink de <1.2s
      window.setTimeout(go, Math.max(0, cfg.minMs - (Date.now() - t0)));
    };

    // saltar: tap/click en el overlay, o Esc/Enter/espacio
    root.addEventListener('click', function () { dismiss(true); });
    window.addEventListener('keydown', function onKey(ev) {
      if (dismissed) {
        window.removeEventListener('keydown', onKey);
        return;
      }
      if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') dismiss(true);
    });

    // señal principal: Reveal 'ready'. Este script corre ANTES de que exista
    // window.Reveal (se inicializa al final del <body>) → sondeo corto.
    var tries = 0;
    var poll = window.setInterval(function () {
      tries += 1;
      var R = window.Reveal;
      if (R && typeof R.on === 'function') {
        window.clearInterval(poll);
        if (typeof R.isReady === 'function' && R.isReady()) {
          dismiss(false);
          return;
        }
        R.on('ready', function () { dismiss(false); });
        return;
      }
      if (tries > 120) window.clearInterval(poll); // sin Reveal: lo cubre el tope duro
    }, 100);

    // tope duro: el overlay NUNCA se queda pegado (CDN caído, deck roto…)
    window.setTimeout(function () { dismiss(false); }, cfg.maxMs);

    if (document.body) {
      document.body.appendChild(root);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(root);
      });
    }
  } catch (err) {
    // el preloader jamás debe romper el deck
    try { console.error('preload-intro:', err); } catch (eLog) { /* consola ausente */ }
  }
})();

// video-runtime — integración reveal para <video> en decks (mismo patrón que
// confetti.js: se inyecta SOLO si el deck usa vídeo). Contrato:
//   · play al ENTRAR la slide (section.present) — un vídeo en una slide no visible
//     no consume decode ni distrae al volver.
//   · pause + reset a t=0 al SALIR: re-entrar re-dispara el loop desde el principio
//     (el payoff «cobra vida» cada pasada, no a mitad de frase).
//   · un vídeo que es fragment no arranca hasta que su beat se muestra
//     (fragmentshown/fragmenthidden re-sincronizan).
//   · prefers-reduced-motion / print-pdf: nunca reproduce — queda el poster/primer
//     frame (los <video> llevan poster por convención <stem>.poster.jpg).
//   · LOOP vs ONE-SHOT (doctrina 2026-07-15/16): el loop es AMBIENTE; el one-shot
//     es BEAT (micro-historia con giro: reproduce UNA vez y CONGELA en el frame
//     final — el frame final ES el punto del beat).
//       - PING-PONG ES EL DEFAULT de todo loop (atributo loop sin marca contraria):
//         ida-vuelta continua (forward → reverse por rAF → forward) = empalme
//         matemáticamente perfecto por construcción, sin depender de que el modelo
//         clave el retorno (medido: los loops por prompt SALTAN — SSIM 0,83–0,96).
//         Reverse por rAF con currentTime decreciente: Safari no soporta
//         playbackRate negativo. También activable explícito con data-pingpong.
//       - data-loop-native → conserva el loop nativo del browser (clips que SÍ
//         cierran ciclo: generados con keyframe end = start, solo 1080p en kling).
//       - data-once → sin loop; al terminar se queda en el último frame (salir y
//         volver a la slide re-dispara el beat).
//     Matiz de elección (doctrina): el ping-pong favorece movimiento SIMÉTRICO/
//     ambiental (respiración, deriva, flotación); lo direccional (humo subiendo,
//     flujo, alguien andando) se ve raro en reversa → keyframes inicio=fin o
//     duración larga. La estrategia elegida se anota en el prompt del asset.
// ponytail: cero estado propio — la verdad es el DOM de reveal en cada sync().
(function () {
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PRINT = /print-pdf/gi.test(location.search);

  function stop(v) {
    if (v._ppRaf) { cancelAnimationFrame(v._ppRaf); v._ppRaf = 0; }
    try { v.pause(); v.currentTime = 0; } catch (e) { /* aún sin metadata: pause basta */ }
  }

  // data-pingpong: al llegar al final, rebobina en tiempo real (rAF) y vuelve a
  // reproducir — el clip nunca salta de último a primer frame. Se arma una vez.
  function armPingpong(v) {
    if (v._pp) return; v._pp = true;
    v.removeAttribute('loop');                       // 'ended' no dispara con loop
    v.addEventListener('ended', function () {
      var last = performance.now();
      function back(now) {
        var t = v.currentTime - (now - last) / 1000; last = now;
        if (t <= 0.04) { v._ppRaf = 0; v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); return; }
        v.currentTime = t;
        v._ppRaf = requestAnimationFrame(back);
      }
      v._ppRaf = requestAnimationFrame(back);
    });
  }

  // un vídeo dentro de un fragment aún no revelado no debe sonar… ni moverse
  function revealed(v) {
    for (var n = v; n && n.classList; n = n.parentElement) {
      if (n.classList.contains('fragment') && !n.classList.contains('visible')) return false;
    }
    return true;
  }

  // trigger=hover (contrato de vídeo, carril componentes 2026-07-16): el clip solo
  // corre mientras el puntero está encima — pausa (sin reset) al salir. Se arma una vez.
  function armHover(v) {
    if (v._hv) return; v._hv = true;
    v.addEventListener('mouseenter', function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    v.addEventListener('mouseleave', function () { v.pause(); });
  }

  // data-autopass (gate M · payoff): el clip ES el beat — cuando TERMINA (evento
  // 'ended', que solo dispara con data-once), AVANZA a la slide siguiente. Nunca en
  // print/reduced-motion (ahí no se reproduce). Guarda: solo si su slide sigue siendo
  // la presente (no auto-saltar una slide que el usuario ya abandonó) y una sola vez.
  function armAutopass(v) {
    if (v._ap) return; v._ap = true;
    v.addEventListener('ended', function () {
      if (REDUCED || PRINT || !window.Reveal) return;
      var sec = v.closest ? v.closest('section') : null;
      if (!sec || !sec.classList.contains('present')) return;   // ya no es su slide
      // a la SIGUIENTE slide (no a un fragment): el payoff cierra la slide entera
      try {
        var h = Reveal.getIndices().h;
        Reveal.slide(h + 1);
      } catch (e) { try { Reveal.next(); } catch (e2) {} }
    });
  }

  function sync() {
    var secs = document.querySelectorAll('.slides section');
    for (var i = 0; i < secs.length; i++) {
      var on = secs[i].classList.contains('present');
      var vids = secs[i].querySelectorAll('video');
      for (var j = 0; j < vids.length; j++) {
        var v = vids[j];
        if (v.hasAttribute('data-once')) v.removeAttribute('loop'); // one-shot: congela en el frame final
        else if (v.hasAttribute('data-pingpong') ||
                 (v.hasAttribute('loop') && !v.hasAttribute('data-loop-native'))) {
          armPingpong(v); // DEFAULT de loops: ida-vuelta = empalme perfecto por construcción
        }
        // rate opcional del contrato (data-rate="1.5"); 1 = natural
        if (v.hasAttribute('data-rate')) v.playbackRate = parseFloat(v.getAttribute('data-rate')) || 1;
        if (v.hasAttribute('data-autopass')) armAutopass(v); // payoff: al terminar, siguiente slide
        if (on && !REDUCED && !PRINT && v.hasAttribute('data-hover')) {
          armHover(v);                                  // hover manda: ni autoplay ni stop
          if (!v.matches(':hover')) v.pause();
          continue;
        }
        if (on && !REDUCED && !PRINT && revealed(v)) {
          if (v.ended && v.hasAttribute('data-once')) continue; // beat ya contado: congelado hasta salir de la slide
          var p = v.play();
          if (p && p.catch) p.catch(function () {});   // autoplay policy: muted debería pasar
        } else if (on && revealed(v)) {
          // reduced-motion/print: parado en el primer frame == el poster
          stop(v);
        } else if (!on) {
          stop(v);
        } else {
          v.pause();                                    // fragment oculto en la slide actual
        }
      }
    }
  }

  if (window.Reveal && Reveal.on) {
    Reveal.on('ready', function () { setTimeout(sync, 60); });
    Reveal.on('slidechanged', function () { setTimeout(sync, 60); });
    Reveal.on('fragmentshown', sync);
    Reveal.on('fragmenthidden', sync);
  } else {
    document.addEventListener('DOMContentLoaded', sync);
  }
})();

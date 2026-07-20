/* storyform2.js — capa de experiencia SOBRE el deck gateado `que-fase-eres`.
 *
 * Doctrina (workboard · carril STORYFORM): el deck REAL es la única superficie —
 * este widget NUNCA construye HTML paralelo. Solo hace tres cosas:
 *   1. registra votos deterministas (matriz pre-autorada en fases-data.js),
 *   2. navega Reveal por el camino que dicta la resolución (fase → forma → póster),
 *   3. personaliza el póster por data-id (swap de texto + estado de peldaño).
 * Nada se redacta en runtime. Texto libre = vía secundaria (sf2-classify.js);
 * inseguro → chips, jamás genérico en silencio.
 *
 * El tray vive FUERA de las <section> (chrome de plataforma, banda inferior del
 * marco portrait — la zona segura de botonera): los gates del deck no lo ven y el
 * deck sigue siendo PASS con el widget inyectado.
 *
 * Test surface: window.SF2 { state, answer, freeText, next, restart }.
 */
(function () {
  'use strict';
  var D = null;                 // SF2_DATA
  var TRAY = null, TOAST = null;
  var answers = {};             // { Q1: 'Q1C', … }
  var phase = 'test';           // 'test' | 'result'
  var result = null;            // { fase, formaKey, totals }
  var path = [];                // slides del resultado: [fase, forma?, poster, completion]
  var busy = false;             // bloquea doble-tap durante la reaction beat

  /* La guardia de navegación solo se ARMA con el primer input REAL (isTrusted).
   * Los harnesses del deck (validate_deck / validate_collisions / deck_lab)
   * navegan con Reveal.slide() programático y CERO eventos de usuario: para
   * ellos el widget es inerte y la medición del deck sigue siendo la verdad.
   * Un usuario (o un e2e que dispara input real) arma la guardia al primer tap. */
  var armed = false;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  // ---------- estado derivado --------------------------------------------------
  function answeredCount() {
    return D.QUESTIONS.filter(function (q) { return answers[q.id]; }).length;
  }
  function questionAt(h) {
    return D.QUESTIONS.find(function (q) { return q.slide === h; }) || null;
  }
  function allowedMax() {   // fase test: cover + preguntas contestadas + la siguiente
    return Math.min(D.SLIDES.firstQ + answeredCount(), D.SLIDES.lastQ);
  }

  // ---------- navegación -------------------------------------------------------
  function slide(h) { window.Reveal.slide(h, 0); }
  function revealAllFragments() {
    for (var i = 0; i < 8; i++) {
      var af = window.Reveal.availableFragments();
      if (!af || !af.next) break;
      window.Reveal.nextFragment();
    }
  }
  function clamp() {
    var h = window.Reveal.getIndices().h;
    if (!armed) { renderTray(h); return; }   // harness sin gestos → sin guardia
    if (phase === 'test') {
      var max = allowedMax();
      if (h > max) { slide(max); return; }
    } else if (path.indexOf(h) === -1) {
      // fuera del camino del diagnóstico → al último punto válido del camino
      var back = path[0];
      for (var i = 0; i < path.length; i++) if (visited.indexOf(path[i]) !== -1) back = path[i];
      slide(back);
      return;
    }
    renderTray(h);
  }
  var visited = [];

  function pathNext(h) {
    var i = path.indexOf(h);
    return (i !== -1 && i + 1 < path.length) ? path[i + 1] : null;
  }

  // ---------- resolución + póster ----------------------------------------------
  function resolveNow() {
    result = D.resolve(answers);
    var fase = D.FASES[result.fase];
    path = [fase.slide];
    if (result.formaKey) path.push(D.FORMAS[result.formaKey].slide);
    path.push(D.SLIDES.poster, D.SLIDES.completion);
    phase = 'result';
    personalizePoster();
    visited = [fase.slide];
    slide(fase.slide);
  }

  /* Personalización = SOLO swap de texto en slots data-id + estado de peldaño
   * (estilos pre-autorados en fases-data.js — ningún texto nace aquí). */
  function personalizePoster() {
    var fase = D.FASES[result.fase];
    var forma = result.formaKey ? D.FORMAS[result.formaKey] : null;
    var set = function (id, txt) {
      var n = $('[data-id="' + id + '"]');
      if (n) n.textContent = txt;
    };
    set('sf-fase-num', 'FASE ' + fase.n);
    set('sf-fase-name', fase.name);
    set('sf-motto', fase.motto);
    set('sf-salto', forma ? forma.salto : fase.salto);
    set('sf-receipt', D.receipt(result));
    var pill = $('[data-id="sf-forma"]');
    if (pill) {
      if (forma) { pill.textContent = 'forma: ' + forma.label; pill.style.display = ''; }
      else pill.style.display = 'none';          // forma pura → sin chip (contrato §4.4)
    }
    D.RUNGS.forEach(function (r) {
      var state = r.id === fase.n ? 'lit' : (r.id < fase.n ? 'done' : 'pending');
      var st = D.RUNG_STYLES[state];
      var box = $('[data-id="sf-rung-' + r.id + '"]');
      if (!box) return;
      // el layout (position/left/top/width/flex) NO se toca: solo la piel del estado
      box.style.background = ''; box.style.border = ''; box.style.boxShadow = '';
      box.style.cssText += ';' + st.box;
      var kids = box.querySelectorAll('.gd-fb-body');
      if (kids[0]) { kids[0].textContent = r.name + (state === 'done' ? ' ✓' : ''); kids[0].style.cssText += ';' + st.name; }
      if (kids[1]) { kids[1].textContent = r.motto; kids[1].style.cssText += ';' + st.motto; }
    });
  }

  // ---------- respuestas -------------------------------------------------------
  function answer(chipId) {
    if (busy || phase !== 'test') return false;
    var h = window.Reveal.getIndices().h;
    var q = questionAt(h);
    if (!q) return false;
    var chip = q.chips.find(function (c) { return c.id === chipId; });
    if (!chip) return false;
    busy = true;
    answers[q.id] = chip.id;                       // voto determinista — cero IA

    // feedback en el tray: chip marcado, resto atenuado, beat del narrador
    TRAY.querySelectorAll('.sf2-chip').forEach(function (b) {
      if (b.dataset.chip === chip.id) b.classList.add('is-picked');
      else b.classList.add('is-dim');
      b.disabled = true;
    });
    revealAllFragments();                          // el post-it/beat de la slide asoma
    toast(chip.react);

    setTimeout(function () {
      busy = false;
      if (answeredCount() >= D.QUESTIONS.length) resolveNow();
      else slide(h + 1);
    }, 1600);
    return true;
  }

  async function freeText(text) {
    if (busy || phase !== 'test') return null;
    var q = questionAt(window.Reveal.getIndices().h);
    if (!q) return null;
    var input = $('.sf2-input', TRAY);
    TRAY.classList.add('is-thinking');
    var res = await window.SF2Classify.classify(text, q.chips, {});
    TRAY.classList.remove('is-thinking');
    if (res.confident && res.chipId) { answer(res.chipId); return res; }
    // inseguro → la pregunta VUELVE a los chips; nunca un bucket genérico en silencio
    if (input) { input.classList.add('is-shake'); setTimeout(function () { input.classList.remove('is-shake'); }, 500); }
    toast('No lo tengo claro con esas palabras — elige el chip que más se acerque.', true);
    return res;
  }

  // ---------- toast (reaction beat) ---------------------------------------------
  var toastTimer = null;
  function toast(text, warn) {
    TOAST.innerHTML = esc(text);
    TOAST.className = 'sf2-toast is-on' + (warn ? ' is-warn' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { TOAST.classList.remove('is-on'); }, warn ? 2600 : 1500);
  }

  // ---------- compartir ----------------------------------------------------------
  function shareUrl() { return location.origin + location.pathname; }
  function openIntent(kind) {
    var cap = D.captions(result), u = encodeURIComponent(shareUrl());
    var map = {
      x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(cap.x) + '&url=' + u,
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
      whatsapp: 'https://wa.me/?text=' + encodeURIComponent(cap.whatsapp + ' ' + shareUrl()),
    };
    window.open(map[kind], '_blank', 'noopener');
  }
  async function shareNative() {
    var cap = D.captions(result);
    try { await navigator.share({ text: cap.whatsapp, url: shareUrl() }); }
    catch (e) { /* usuario canceló — nada que hacer */ }
  }

  // ---------- tray ----------------------------------------------------------------
  function renderTray(h) {
    TRAY.innerHTML = '';
    TRAY.appendChild(TOAST);

    if (phase === 'test') {
      if (h === D.SLIDES.cover) {
        var go = el('button', 'sf2-cta', 'Empezar el test&nbsp;→');
        go.onclick = function () { slide(D.SLIDES.firstQ); };
        TRAY.appendChild(go);
        return;
      }
      var q = questionAt(h);
      if (!q) return;

      var head = el('div', 'sf2-head',
        '<span class="n">' + q.id.slice(1) + '/7</span> lo que HACES, no lo que querrías');
      TRAY.appendChild(head);

      var wrap = el('div', 'sf2-chips');
      q.chips.forEach(function (chip) {
        var b = el('button', 'sf2-chip', esc(chip.label));
        b.dataset.chip = chip.id;
        b.onclick = function () { answer(chip.id); };
        wrap.appendChild(b);
      });
      TRAY.appendChild(wrap);

      // vía secundaria: texto libre tras un toggle discreto
      var alt = el('button', 'sf2-alt', 'o escríbelo con tus palabras…');
      var freeRow = el('div', 'sf2-free');
      var input = el('input', 'sf2-input');
      input.type = 'text'; input.placeholder = 'Cuéntalo como quieras y pulsa Enter';
      input.addEventListener('keydown', function (e) {
        e.stopPropagation();                        // que Reveal no navegue con el teclado
        if (e.key === 'Enter' && input.value.trim()) freeText(input.value.trim());
      });
      freeRow.appendChild(input);
      alt.onclick = function () {
        freeRow.classList.toggle('is-open');
        if (freeRow.classList.contains('is-open')) input.focus();
      };
      TRAY.appendChild(alt);
      TRAY.appendChild(freeRow);
      return;
    }

    // ---- fase resultado -------------------------------------------------------
    if (visited.indexOf(h) === -1) visited.push(h);

    if (h === D.SLIDES.poster) {
      var fase = D.FASES[result.fase];
      var head2 = el('div', 'sf2-head',
        '<span class="n">FASE ' + fase.n + '</span> Tu póster — compártelo tal cual.');
      TRAY.appendChild(head2);
      var row = el('div', 'sf2-share');
      if (navigator.share) {
        var s = el('button', 'sf2-cta', '📤 Compartir');
        s.onclick = shareNative; row.appendChild(s);
      }
      [['x', '𝕏'], ['linkedin', 'in'], ['whatsapp', 'WhatsApp']].forEach(function (p) {
        var b = el('button', 'sf2-btn', p[1]);
        b.onclick = function () { openIntent(p[0]); };
        row.appendChild(b);
      });
      TRAY.appendChild(row);
      // honestidad sobre "descargar": no generamos PNG en cliente — lo decimos
      var note = el('div', 'sf2-note',
        '💾 ¿Guardarlo? El póster ES esta pantalla: captura (móvil) o ⌘⇧4 (Mac). Aquí no se genera ningún PNG.');
      TRAY.appendChild(note);
      var nx = el('button', 'sf2-alt', 'seguir →');
      nx.onclick = function () { slide(D.SLIDES.completion); };
      TRAY.appendChild(nx);
      return;
    }

    if (h === D.SLIDES.completion) {
      var re = el('button', 'sf2-cta', '↺ Repetir el test');
      re.onclick = restart;
      TRAY.appendChild(re);
      return;
    }

    // slide de diagnóstico (fase o forma): avanzar revela los beats y luego sigue
    var btn = el('button', 'sf2-cta', 'Siguiente&nbsp;→');
    btn.onclick = function () {
      var af = window.Reveal.availableFragments();
      if (af && af.next) window.Reveal.nextFragment();
      else { var n = pathNext(h); if (n != null) slide(n); }
    };
    TRAY.appendChild(btn);
  }

  function restart() {
    answers = {}; result = null; path = []; visited = []; phase = 'test'; busy = false;
    slide(D.SLIDES.cover);
  }

  // ---------- boot -----------------------------------------------------------------
  function mount() {
    D = window.SF2_DATA;
    TRAY = el('div', 'sf2-tray');
    TOAST = el('div', 'sf2-toast');
    document.body.appendChild(TRAY);

    // el tray ES la navegación del test: fuera flechas de Reveal
    window.Reveal.configure({ controls: false, progress: false });
    // MÓVIL: cero margen de Reveal — el lienzo llena el ancho de la mano (el marco
    // editorial del deck ya trae su propio aire). Los gates corren a 1080px: no entran.
    // La piel móvil clava el lienzo arriba (inset 0) y necesita la escala viva en
    // una var CSS: Reveal la recalcula en cada layout, aquí solo la espejamos.
    var syncScale = function () {
      document.documentElement.style.setProperty('--sf2-scale', String(window.Reveal.getScale()));
    };
    if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches) {
      window.Reveal.configure({ margin: 0 });
    }
    syncScale();
    window.addEventListener('resize', function () { setTimeout(syncScale, 60); });
    window.Reveal.on('slidechanged', function () { setTimeout(clamp, 0); });
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function (e) { if (e.isTrusted) armed = true; }, { capture: true, passive: true });
    });
    clamp();

    window.SF2 = {
      state: function () {
        return { phase: phase, answers: JSON.parse(JSON.stringify(answers)),
                 result: result, path: path.slice(), h: window.Reveal.getIndices().h };
      },
      answer: answer,
      freeText: freeText,
      next: function () { var b = $('.sf2-cta', TRAY); if (b) b.click(); },
      restart: restart,
      _resolve: D.resolve,        // superficie de test unitario (determinismo)
    };
    window.dispatchEvent(new CustomEvent('sf2:ready'));
  }

  function boot() {
    if (window.Reveal && window.Reveal.isReady && window.Reveal.isReady()) mount();
    else if (window.Reveal && window.Reveal.on) window.Reveal.on('ready', mount);
    else document.addEventListener('DOMContentLoaded', boot);
  }
  boot();
})();

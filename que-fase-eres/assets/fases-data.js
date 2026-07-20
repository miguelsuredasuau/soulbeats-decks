/* fases-data.js — TODO el contenido del test, pre-autorado.
 *
 * Derivación 1:1 de platform/storyform-fases-content.md (FINAL — no se reescribe).
 * El runtime SOLO selecciona de aquí: nunca redacta, nunca improvisa.
 * Determinismo total: mismas 7 respuestas → misma fase, misma forma, mismo póster.
 */
(function () {
  'use strict';

  var FASES = {
    ask:           { n: 1, name: 'ASK',           motto: '«Respóndeme.»',                          slide: 8,
                     salto: '«Ahora aplícalo a este caso concreto.»' },
    assist:        { n: 2, name: 'ASSIST',        motto: '«Ayúdame con una pieza.»',               slide: 10,
                     salto: '«Deja de pedir la pieza: encarga la tarea cerrada.»' },
    execute:       { n: 3, name: 'EXECUTE',       motto: '«Haz este trabajo acotado end to end.»', slide: 12,
                     salto: '«Ningún done sin validación y receipt.»' },
    operate:       { n: 4, name: 'OPERATE',       motto: '«Mueve un workstream completo.»',        slide: 14,
                     salto: '«Lo que repites tres veces merece ser sistema.»' },
    systematize:   { n: 5, name: 'SYSTEMATIZE',   motto: '«Haz que el workflow sea reutilizable.»', slide: 16,
                     salto: '«Convierte una checklist en un check que falla.»' },
    industrialize: { n: 6, name: 'INDUSTRIALIZE', motto: '«Haz que el sistema se valide solo.»',   slide: 18,
                     salto: '«Elige qué merece check: ese juicio sigue siendo tuyo.»' },
  };
  // orden de escalera — el empate lo gana la INFERIOR (el diagnóstico no se regala)
  var FASE_ORDER = ['ask', 'assist', 'execute', 'operate', 'systematize', 'industrialize'];

  var FORMAS = {
    F1: { key: 'F1', label: 'el done falso',        slide: 15,
          salto: '«Si la validación no corrió, no hay done.»' },
    F2: { key: 'F2', label: 'mapa sin barreras',    slide: 19,
          salto: '«Tu mejor checklist, convertida en un check que falla.»' },
    F3: { key: 'F3', label: 'validación artesanal', slide: 17,
          salto: '«Tres contracts baratos: json_only · template_fill · repo_change.»' },
    F4: { key: 'F4', label: 'operate con rails',    slide: 20,
          salto: '«Formaliza los rails: contract + harness + receipt.»' },
    F5: { key: 'F5', label: 'rigor sin delegación', slide: 9,
          salto: '«Ese rigor, puesto a trabajar en un encargo de verdad.»' },
    F6: { key: 'F6', label: 'ambición sin contrato', slide: 11,
          salto: '«A la ambición, ponle contrato.»' },
    F7: { key: 'F7', label: 'copiloto encadenado',  slide: 13,
          salto: '«La cadena entera es un solo encargo.»' },
  };

  // Las 7 preguntas: slide del deck, chips con votos (matriz §2.1) y reaction (§5).
  // kw = regex del clasificador mock (texto libre SECUNDARIO); si nada matchea con
  // confianza, el runtime NUNCA elige en silencio: devuelve la pregunta a los chips.
  var QUESTIONS = [
    { id: 'Q1', slide: 1, chips: [
      { id: 'Q1A', label: 'Una pregunta (explícame, resume)',
        votes: { ask: 3 },
        react: 'Preguntar está bien. Quedarse a vivir en la pregunta es lo caro.',
        kw: /\b(?:pregunt|expl[ií]ca|resume|resumen|dame ideas|qu[eé] es|c[oó]mo funciona|duda)/i },
      { id: 'Q1B', label: 'Una pieza (arregla esta función)',
        votes: { assist: 3 },
        react: 'Una pieza concreta. Ya no le pides opinión: le pides trabajo.',
        kw: /\b(?:funci[oó]n|arregla|mejora|corrige|revisa este|este texto|este c[oó]digo|refactor|traduce)/i },
      { id: 'Q1C', label: 'Un encargo (inputs, formato, límites)',
        votes: { execute: 3 },
        react: 'Inputs, formato, límites. Eso ya no es un prompt — es un encargo.',
        kw: /\b(?:encargo|inputs?|formato de salida|l[ií]mites|spec|entregable|acotad)/i },
      { id: 'Q1D', label: 'Un frente (investiga, construye, entrega)',
        votes: { operate: 3 },
        react: 'Un frente entero. Aquí ya no usas la IA: la diriges.',
        kw: /\b(?:frente|investiga y|varios pasos|end to end|de principio a fin|workstream|proyecto entero)/i },
      { id: 'Q1E', label: 'Una mejora del sistema (template)',
        votes: { systematize: 3 },
        react: '¿Que deje el camino hecho? Eso es pensar en la próxima vez. Sigue.',
        kw: /\b(?:template|plantilla|skill|para la pr[oó]xima|reutilizable|sistema|dejarlo hecho)/i },
    ]},
    { id: 'Q2', slide: 2, chips: [
      { id: 'Q2A', label: 'No aparecen: leo y decido',
        votes: { ask: 3 },
        react: 'Leer y decidir: el criterio existe, pero solo en tu cabeza.',
        kw: /\b(?:no aparecen|leo y decido|a ojo|sobre la marcha no|en mi cabeza|no tengo criterios)/i },
      { id: 'Q2B', label: 'Después: corrijo sobre la marcha',
        votes: { assist: 2, operate: 1 },
        react: 'Corregir después funciona… hasta que el error no avisa.',
        kw: /\b(?:despu[eé]s|corrijo|sobre la marcha|cuando no me cuadra|voy ajustando)/i },
      { id: 'Q2C', label: 'Antes: scope y reglas por delante',
        votes: { execute: 3 },
        react: 'Reglas por delante. El agente trabaja mejor con el campo marcado.',
        kw: /\b(?:antes|scope|reglas por delante|primero defino|por adelantado)/i },
      { id: 'Q2D', label: 'Antes y por escrito (doc/schema)',
        votes: { systematize: 3 },
        react: 'Criterios que viven en archivos: eso ya no se olvida entre sesiones.',
        kw: /\b(?:por escrito|doc|schema|documentad|escrito que se reutiliza|archivo)/i },
      { id: 'Q2E', label: 'Antes y ejecutables: un check falla',
        votes: { industrialize: 3 },
        react: '¿Perdón en vez de permiso? Contigo no. Un check que falla lo dice todo.',
        kw: /\b(?:ejecutabl|check que falla|test que|valida solo|autom[aá]tic|ci\b|pipeline)/i },
    ]},
    { id: 'Q3', slide: 3, chips: [
      { id: 'Q3A', label: 'Si suena bien, vale',
        votes: { ask: 3 },
        react: '«Si suena bien, vale» — la frase favorita de los silent errors.',
        kw: /\b(?:suena bien|me f[ií]o|si parece|convincente|me lo creo)/i },
      { id: 'Q3B', label: 'Lo leo yo, a ojo',
        votes: { assist: 2, ask: 1 },
        react: 'Tu ojo es buen juez, pero no escala: hoy lee con calma, mañana no.',
        kw: /\b(?:lo leo|con calma|a ojo|reviso yo|lo miro yo)/i },
      { id: 'Q3C', label: 'Lo contrasto: fuentes y pruebas',
        votes: { operate: 3 },
        react: 'Contrastar contra fuente: criterio de operador, no de espectador.',
        kw: /\b(?:contrasto|fuentes|compruebo|verifico contra|pruebas|cotejo)/i },
      { id: 'Q3D', label: 'Corro la validación que definí',
        votes: { execute: 2, systematize: 1 },
        react: 'Validación definida por tarea. El done empieza a tener pruebas.',
        kw: /\b(?:validaci[oó]n que defin|corro la validaci[oó]n|test de la tarea|criterio definido)/i },
      { id: 'Q3E', label: 'Pasa checks solos o no se entrega',
        votes: { industrialize: 3 },
        react: 'Si falla el check, no hay entrega. Eso ya es otro deporte.',
        kw: /\b(?:checks? solos|si fallan? no|no hay entrega|gate|autom[aá]ticamente)/i },
    ]},
    { id: 'Q4', slide: 4, chips: [
      { id: 'Q4A', label: 'Cada conversación empieza de cero',
        votes: { ask: 2, assist: 1 },
        react: 'Cada vez de cero: el conocimiento se queda en la conversación anterior.',
        kw: /\b(?:de cero|empiezo de nuevo|cada vez|no reutilizo|nunca|qu[eé] workflow)/i },
      { id: 'Q4B', label: 'Prompts guardados que copio y adapto',
        votes: { operate: 2, assist: 1 },
        react: 'El doc de prompts guardados: la primera maquinaria que todos construimos.',
        kw: /\b(?:prompts? guardad|copio y adapto|notas con prompts|los tengo apuntad)/i },
      { id: 'Q4C', label: 'Templates y skills que el agente sigue',
        votes: { systematize: 3 },
        react: 'Templates que el agente sigue: el sistema empieza a recordar por ti.',
        kw: /\b(?:templates?|plantillas?|schemas?|skills?|el agente sigue)/i },
      { id: 'Q4D', label: 'Sí, con validadores dentro',
        votes: { industrialize: 3 },
        react: 'Repetir sin riesgo. Eso ya no es un workflow — es maquinaria.',
        kw: /\b(?:validador|con checks dentro|rutina|sin riesgo|harness)/i },
    ]},
    { id: 'Q5', slide: 5, chips: [
      { id: 'Q5A', label: 'Nadie, probablemente',
        votes: { ask: 3 },
        react: 'Nadie. Apunta esta pregunta: va a volver.',
        kw: /\b(?:nadie|probablemente nadie|no lo pilla|ni idea|no s[eé] qui[eé]n)/i },
      { id: 'Q5B', label: 'Yo, si me da por releer',
        votes: { assist: 2, ask: 1 },
        react: '«Si me da por releer» — el plan de calidad menos fiable del mundo.',
        kw: /\b(?:si me da por|si releo|a veces yo|cuando reviso|con suerte yo)/i },
      { id: 'Q5C', label: 'El siguiente paso, cuando peta',
        votes: { operate: 3 },
        react: 'Que lo pille el siguiente paso sale caro: el error viaja con intereses.',
        kw: /\b(?:siguiente paso|cuando peta|aguas abajo|el flujo|explota despu[eé]s)/i },
      { id: 'Q5D', label: 'Yo: reviso todo antes',
        votes: { execute: 2, operate: 1 },
        react: 'Revisarlo todo tú funciona… mientras tengas ojos para todo.',
        kw: /\b(?:reviso todo|antes de que pase|yo siempre|lo miro todo)/i },
      { id: 'Q5E', label: 'Un check, antes que yo',
        votes: { industrialize: 3 },
        react: 'El check lo pilla antes que tú. Eso es dormir tranquilo.',
        kw: /\b(?:un check|el test lo pilla|antes que yo|salta la validaci[oó]n|alarma)/i },
    ]},
    { id: 'Q6', slide: 6, chips: [
      { id: 'Q6A', label: 'Texto: respuestas, ideas, resúmenes',
        votes: { ask: 3 },
        react: 'Texto. Útil — pero la cosa se queda en la charla.',
        kw: /\b(?:texto|respuestas|ideas|res[uú]menes|explicaciones)/i },
      { id: 'Q6B', label: 'Piezas: funciones, copys sueltos',
        votes: { assist: 3 },
        react: 'Piezas. El copiloto ya toca trabajo de verdad.',
        kw: /\b(?:piezas|funciones|copys?|sueltos|fragmentos|snippets?)/i },
      { id: 'Q6C', label: 'Artifacts terminados, forma exacta',
        votes: { execute: 3 },
        react: 'Artifacts con forma exacta: eso es saber delegar.',
        kw: /\b(?:artifacts?|archivos terminad|forma exacta|entregables|ficheros)/i },
      { id: 'Q6D', label: 'Workstreams de varios pasos',
        votes: { operate: 3 },
        react: 'Workstreams que acaban en algo que se usa. Capa de producción.',
        kw: /\b(?:workstreams?|varios pasos|que se usa|flujos enteros|proyectos)/i },
      { id: 'Q6E', label: 'Sistema: deja el camino hecho',
        votes: { systematize: 2, industrialize: 1 },
        react: 'Que cada encargo mejore el siguiente. Tomamos nota.',
        kw: /\b(?:sistema|camino hecho|para la pr[oó]xima|mejore el siguiente|infraestructura)/i },
    ]},
    { id: 'Q7', slide: 7, chips: [
      { id: 'Q7A', label: 'Me lo creo',
        votes: { ask: 2, assist: 1 },
        react: '¿Te lo crees? El done falso te manda recuerdos.',
        kw: /\b(?:me lo creo|conf[ií]o|lo doy por bueno|acepto sin)/i },
      { id: 'Q7B', label: 'Vistazo rápido y adelante',
        votes: { assist: 2, operate: 1 },
        react: 'Vistazo rápido: la fe, con una capa fina de diligencia.',
        kw: /\b(?:vistazo|r[aá]pido|por encima|ojeada|diagonal)/i },
      { id: 'Q7C', label: 'Reviso a fondo antes de aceptar',
        votes: { operate: 2, execute: 1 },
        react: 'Revisión a fondo: el done se gana, no se declara.',
        kw: /\b(?:a fondo|reviso el artifact|antes de aceptar|con detalle|l[ií]nea a l[ií]nea)/i },
      { id: 'Q7D', label: 'Pido la validación que corrió',
        votes: { execute: 2, systematize: 1 },
        react: '«¿Qué validación corriste?» — la pregunta que cambia agentes.',
        kw: /\b(?:qu[eé] validaci[oó]n|que corri[oó]|el resultado de|pido pruebas|evidencia)/i },
      { id: 'Q7E', label: '«Done» sin receipt no existe',
        votes: { industrialize: 3 },
        react: 'Done sin receipt no existe. No hace falta que te expliquemos este test.',
        kw: /\b(?:receipt|sin receipt|no existe|comprobante|justificante|con prueba o nada)/i },
    ]},
  ];

  /* Resolución determinista (§2.2 + §2.3, first-match-wins).
   * answers = { Q1:'Q1C', … } → { fase, formaKey|null, totals } */
  function resolve(answers) {
    var totals = { ask: 0, assist: 0, execute: 0, operate: 0, systematize: 0, industrialize: 0 };
    QUESTIONS.forEach(function (q) {
      var chip = (q.chips || []).find(function (c) { return c.id === answers[q.id]; });
      if (!chip) return;
      Object.keys(chip.votes).forEach(function (f) { totals[f] += chip.votes[f]; });
    });
    // dominante: mayor total; empate → la INFERIOR (se recorre en orden y solo '>' releva)
    var fase = FASE_ORDER[0];
    FASE_ORDER.forEach(function (f) { if (totals[f] > totals[fase]) fase = f; });

    var last = function (qid) { return String(answers[qid] || '').slice(-1); }; // 'Q7A' → 'A'
    var forma = null;
    if (fase === 'execute' && (last('Q7') === 'A' || last('Q7') === 'B')) forma = 'F1';
    else if (fase === 'systematize' && totals.industrialize <= 1) forma = 'F2';
    else if (fase === 'operate' && totals.industrialize <= 1) forma = 'F3';
    else if (fase === 'operate' && totals.industrialize >= 4) forma = 'F4';
    else if ((fase === 'ask' || fase === 'assist') &&
             (last('Q2') === 'E' || last('Q3') === 'E' || last('Q5') === 'E')) forma = 'F5';
    else if ((fase === 'ask' || fase === 'assist') && last('Q6') === 'D') forma = 'F6';
    else if (fase === 'assist' && totals.operate >= totals.assist - 2) forma = 'F7';

    return { fase: fase, formaKey: forma, totals: totals };
  }

  /* Captions de compartir (§4, ≤200 chars; forma pura → el segmento desaparece). */
  function captions(res) {
    var f = FASES[res.fase];
    var forma = res.formaKey ? FORMAS[res.formaKey].label : null;
    return {
      x: 'Salí Fase ' + f.n + ' · ' + f.name + ' en el test de las 6 fases de uso de IA' +
         (forma ? ' — forma: ' + forma : '') + '. El test se valida solo: cada respuesta es un check, no una opinión. ¿y tú qué fase eres?',
      linkedin: 'Las 6 fases de uso de IA: de pedir respuestas a que el sistema valide solo. Yo: Fase ' +
         f.n + ' · ' + f.name + (forma ? ' (' + forma + ')' : '') +
         '. Diagnóstico por conducta, no por autoimagen. ¿y tú qué fase eres?',
      whatsapp: 'Me ha calado: test de 6 fases de IA — 7 preguntas de lo que HACES, no de lo que crees. Fase ' +
         f.n + ' · ' + f.name + (forma ? ', forma ' + forma : '') + ' 😅 ¿y tú qué fase eres?',
    };
  }

  /* Receipt del póster (§4.6) — el guiño literal: la prueba de aceptación viaja con él. */
  function receipt(res) {
    var f = FASES[res.fase];
    var forma = res.formaKey ? FORMAS[res.formaKey].label : 'pura';
    return '{"contract":"fase_test_v1","ok":true,"fase":' + f.n + ',"forma":"' + forma + '","checks":"7/7"}';
  }

  /* Estados de peldaño del póster (swap determinista de estilo + texto pre-autorado).
   * name/motto = los textos canónicos; el ✓ solo en los peldaños recorridos. */
  var RUNGS = [
    { id: 1, name: '1 · ASK',           motto: '«Respóndeme.»' },
    { id: 2, name: '2 · ASSIST',        motto: '«Ayúdame con una pieza.»' },
    { id: 3, name: '3 · EXECUTE',       motto: '«Haz este trabajo acotado end to end.»' },
    { id: 4, name: '4 · OPERATE',       motto: '«Mueve un workstream completo.»' },
    { id: 5, name: '5 · SYSTEMATIZE',   motto: '«Haz que el workflow sea reutilizable.»' },
    { id: 6, name: '6 · INDUSTRIALIZE', motto: '«Haz que el sistema se valide solo.»' },
  ];
  var RUNG_STYLES = {
    lit:     { box: 'background:rgba(46,196,182,.16);border:2px solid #2EC4B6;border-radius:12px;padding:8px 16px;box-shadow:0 0 26px rgba(46,196,182,.35)',
               name: 'color:#eafffb;letter-spacing:.02em', motto: 'color:rgba(234,255,251,.85)' },
    done:    { box: 'background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.14);border-radius:12px;padding:8px 16px',
               name: 'color:rgba(233,242,248,.72);letter-spacing:.02em', motto: 'color:rgba(233,242,248,.5)' },
    pending: { box: 'background:rgba(255,255,255,.03);border:1.5px dashed rgba(255,255,255,.22);border-radius:12px;padding:8px 16px',
               name: 'color:rgba(233,242,248,.55);letter-spacing:.02em', motto: 'color:rgba(233,242,248,.42)' },
  };

  window.SF2_DATA = {
    FASES: FASES, FASE_ORDER: FASE_ORDER, FORMAS: FORMAS, QUESTIONS: QUESTIONS,
    RUNGS: RUNGS, RUNG_STYLES: RUNG_STYLES,
    SLIDES: { cover: 0, firstQ: 1, lastQ: 7, poster: 21, completion: 22 },
    resolve: resolve, captions: captions, receipt: receipt,
  };
})();

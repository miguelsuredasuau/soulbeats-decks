/* sf2-classify.js — clasificador del texto libre (vía SECUNDARIA del storyform).
 *
 * Misma doctrina que lab/storyform/sf-classify.js (cascada nano → webllm → mock),
 * con el trabajo reducido a UN gesto: mapear lo tecleado a UNO de los chips de la
 * pregunta actual. Nunca redacta. Y la regla de oro del test diagnóstico:
 * INSEGURO → NULL → el widget devuelve la pregunta a los chips. Jamás un bucket
 * genérico en silencio: aquí el fallback silencioso sería MENTIR en el diagnóstico.
 *
 * API: SF2Classify.classify(text, chips, opts) -> Promise<{chipId|null, confident, tier}>
 *   chips = [{id, label, kw}]  (kw = regex del tier mock, pre-autorada en fases-data)
 *   opts  = { forceBackend?: 'mock'|'nano'|'webllm' }  (?sf2_backend=… en la URL)
 */
(function () {
  'use strict';

  function override() {
    try { return new URLSearchParams(location.search).get('sf2_backend'); }
    catch (e) { return null; }
  }

  // ---- prompt (tiers con modelo): elegir UNA etiqueta de un enum cerrado -------
  function buildPrompt(chips) {
    var lines = [];
    lines.push('Tu ÚNICA tarea es CLASIFICAR la respuesta del usuario en una de estas opciones.');
    lines.push('Opciones (id → significado):');
    chips.forEach(function (c) { lines.push('  ' + c.id + ' → ' + c.label); });
    lines.push('Si NINGUNA encaja con claridad, responde {"chip":null}.');
    lines.push('Devuelve SOLO este JSON: {"chip":"<id o null>"}');
    return lines.join('\n');
  }

  function coerce(raw, chips) {
    var s = String(raw == null ? '' : raw);
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    var chip = null;
    if (a !== -1 && b > a) {
      try {
        var o = JSON.parse(s.slice(a, b + 1));
        if (o && typeof o.chip === 'string') chip = o.chip.trim().toUpperCase();
      } catch (e) { /* cae a null */ }
    }
    var ok = chip && chips.some(function (c) { return c.id === chip; });
    return { chipId: ok ? chip : null, confident: !!ok };
  }

  // ---- tier mock — regex por chip, determinista, offline ----------------------
  // Confianza = exactamente UN chip matchea. Cero o varios → inseguro → chips.
  function mockClassify(text, chips) {
    var hits = chips.filter(function (c) { return c.kw && c.kw.test(text); });
    if (hits.length === 1) return { chipId: hits[0].id, confident: true, tier: 'mock' };
    return { chipId: null, confident: false, tier: 'mock' };
  }

  // ---- tier nano — Chrome Prompt API (si existe) -------------------------------
  function nanoGlobal() {
    return (typeof window !== 'undefined' && window.LanguageModel) || null;
  }
  async function nanoClassify(text, chips) {
    var LM = nanoGlobal();
    var session = await LM.create({
      initialPrompts: [{ role: 'system', content: buildPrompt(chips) }],
      temperature: 0.1, topK: 1,
    });
    var raw = await session.prompt('Usuario: "' + text + '"');
    var r = coerce(raw, chips); r.tier = 'nano'; return r;
  }

  // ---- tier webllm — WebGPU, lazy ----------------------------------------------
  var _webllm = null;
  async function webllmClassify(text, chips, model) {
    if (!_webllm) {
      var mod = await import('https://esm.run/@mlc-ai/web-llm');
      _webllm = await mod.CreateMLCEngine(model || 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', {});
    }
    var res = await _webllm.chat.completions.create({
      messages: [
        { role: 'system', content: buildPrompt(chips) },
        { role: 'user', content: 'Usuario: "' + text + '"' },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });
    var raw = (res.choices && res.choices[0] && res.choices[0].message.content) || '';
    var r = coerce(raw, chips); r.tier = 'webllm'; return r;
  }

  async function tier(opts) {
    var forced = (opts && opts.forceBackend) || override();
    if (forced) return forced;
    var LM = nanoGlobal();
    if (LM) {
      try {
        var av = await LM.availability();
        if (av === 'available') return 'nano';
      } catch (e) { /* sigue */ }
    }
    // webllm solo bajo demanda explícita: descargar un modelo para un test de 3 min
    // no es un default honesto — mock (determinista) es el camino por defecto.
    return 'mock';
  }

  async function classify(text, chips, opts) {
    var clean = String(text || '').trim();
    if (!clean) return { chipId: null, confident: false, tier: 'empty' };
    try {
      var t = await tier(opts);
      if (t === 'nano') return await nanoClassify(clean, chips);
      if (t === 'webllm') return await webllmClassify(clean, chips, opts && opts.webllmModel);
      return mockClassify(clean, chips);
    } catch (e) {
      // fallo de tier ≠ respuesta inventada: inseguro → chips
      return { chipId: null, confident: false, tier: 'error:' + ((e && e.message) || e) };
    }
  }

  window.SF2Classify = { classify: classify, _mock: mockClassify, _coerce: coerce };
})();

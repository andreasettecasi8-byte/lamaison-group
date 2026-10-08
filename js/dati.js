/* LA MAISON GROUP — da dove arrivano i contenuti del sito
   ============================================================
   Con Supabase collegato (indirizzo e chiave pubblica qui sotto) testi,
   immobili, progetti e recensioni si leggono dalla tabella "contenuti".
   Se Supabase non risponde, o un contenuto non c'è ancora, si usano i
   file della cartella data/ come copia di riserva: il sito resta sempre su.

   INSERISCI QUI i dati del progetto (Supabase → Project Settings → API):
   - SUPABASE_URL: "Project URL", es. https://abcdefghijkl.supabase.co
   - SUPABASE_KEY: la chiave pubblica ("publishable" oppure "anon public").
     È fatta per stare nel sito: da sola permette solo di leggere.
     Non mettere MAI qui la chiave "secret" / "service_role".
   ============================================================ */
var SUPABASE_URL = 'https://rpulygtgmckbsgqtfkqf.supabase.co';
var SUPABASE_KEY = 'sb_publishable_sD1mGEblZI7JrRkHD6lxpg_ilw0aZK4';

(function () {
  'use strict';

  var BASE = String(SUPABASE_URL || '').trim().replace(/\/+$/, '');
  var KEY = String(SUPABASE_KEY || '').trim();
  var ACTIVE = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(BASE) && KEY.length > 20 && !/service_role|sb_secret_/.test(KEY);
  var cache = {};

  function file(path) {
    return fetch(path, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // undefined = il contenuto non è su Supabase (si usa il file)
  function remote(path) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : 0;
    return fetch(BASE + '/rest/v1/contenuti?select=dati&percorso=eq.' + encodeURIComponent(path), {
      headers: { apikey: KEY, Accept: 'application/json' },
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('Supabase ' + r.status);
      return r.json();
    }).then(function (rows) {
      return rows && rows.length ? rows[0].dati : undefined;
    });
  }

  function json(path) {
    if (!cache[path]) {
      cache[path] = ACTIVE
        ? remote(path).then(function (d) { return d === undefined ? file(path) : d; }, function () { return file(path); })
        : file(path);
    }
    return cache[path];
  }

  window.LaMaisonDati = { json: json, file: file, active: ACTIVE, url: BASE, key: KEY };
})();

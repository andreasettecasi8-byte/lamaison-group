/* LA MAISON GROUP — area riservata: modifica del sito direttamente dalle pagine.
   Si carica solo quando si clicca "Area riservata" (vedi js/main.js), quindi
   non pesa sul sito per i visitatori.

   Accesso: password scelta al primo accesso. La password cifra (AES) il token
   GitHub, salvato in data/admin.json: senza password il token non è leggibile.
   Salvataggio: sul Mac (server.py) scrive nei file della cartella;
   online scrive su GitHub con un unico commit, e il sito si aggiorna in 1-2 minuti. */
(function () {
  'use strict';

  var C, R; // window.LaMaisonContent, window.LaMaisonRender (pronti dopo il caricamento)
  var PAGE = document.body.dataset.page;
  var PAGES = [['index', 'Home'], ['chi-siamo', 'Chi siamo'], ['affitti-brevi', 'Affitti brevi'], ['affitti-tradizionali', 'Affitti a lungo termine'],
    ['vendita', 'Vendita'], ['valutazione', 'Valutazione immobile'], ['progetti', 'Progetti'], ['recensioni', 'Recensioni'], ['contatti', 'Contatti'],
    ['privacy', 'Privacy Policy'], ['cookie', 'Cookie Policy']];
  var SESSION_KEY = 'lm-admin-session';
  var IS_LOCAL = ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1;
  var ITERATIONS = 600000;

  // Con il sito in inglese si modificano i testi inglesi (data/pagine/en/…);
  // foto, immobili e impostazioni restano in comune tra le due lingue.
  var LANG = (window.LaMaisonContent && window.LaMaisonContent.lang && window.LaMaisonContent.lang()) === 'en' ? 'en' : 'it';
  var EN = LANG === 'en';
  var FILES = {
    page: 'data/pagine/' + PAGE + '.json',
    comune: 'data/pagine/comune.json',
    vendita: 'data/vendita.json',
    'affitti-brevi': 'data/affitti-brevi.json',
    'affitti-lungo': 'data/affitti-lungo.json',
    progetti: 'data/progetti.json',
    recensioni: 'data/recensioni.json'
  };
  if (EN) {
    FILES.page_en = 'data/pagine/en/' + PAGE + '.json';
    FILES.comune_en = 'data/pagine/en/comune.json';
  }

  // ----- Scheda "Carica nuovo immobile": campi comuni e campi per categoria -----
  var TIPOLOGIE = ['Appartamento', 'Monolocale', 'Bilocale', 'Trilocale', 'Quadrilocale', 'Attico', 'Loft', 'Villa', 'Villetta a schiera', 'Casa indipendente', 'Ufficio', 'Negozio', 'Box / Posto auto', 'Terreno'];
  var CLASSI = ['', 'A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G', 'In attesa di certificazione'];
  var FEATURES = ['Balcone', 'Terrazzo', 'Giardino', 'Ascensore', 'Box auto', 'Posto auto', 'Cantina', 'Aria condizionata',
    'Riscaldamento autonomo', 'Portineria', 'Arredato', 'Wi-Fi', 'Lavatrice', 'Lavastoviglie', 'Animali ammessi', 'Accessibile ai disabili'];
  function num(name, label, extra) { var f = { name: name, label: label, type: 'number', half: true }; Object.keys(extra || {}).forEach(function (k) { f[k] = extra[k]; }); return f; }
  function propertySchema(o) {
    return {
      singular: 'immobile', plural: 'immobili', title: 'titolo', newLabel: 'Nuovo immobile', addLabel: '+ Carica nuovo immobile',
      fields: [].concat(
        [{ type: 'heading', label: 'Annuncio' },
         { name: 'titolo', label: 'Titolo dell\'annuncio', type: 'text', required: true, hint: 'Es. "Trilocale luminoso con balcone"' },
         { name: 'etichetta', label: 'Etichetta sulla foto', type: 'text', options: o.badges, hint: 'Facoltativa: scegli dall\'elenco o scrivila tu.' },
         { type: 'heading', label: 'Posizione' },
         { name: 'citta', label: 'Città', type: 'text', value: 'Torino', half: true },
         { name: 'zona', label: 'Zona / quartiere', type: 'text', half: true },
         { name: 'indirizzo', label: 'Indirizzo', type: 'text', hint: 'Resta privato, a meno che tu non spunti la casella qui sotto.' },
         { name: 'indirizzo_visibile', label: 'Mostra l\'indirizzo sulla scheda', type: 'checkbox' },
         { type: 'heading', label: o.priceTitle }],
        o.price,
        [{ type: 'heading', label: 'Caratteristiche' },
         { name: 'tipologia', label: 'Tipologia', type: 'text', options: TIPOLOGIE }],
        o.details,
        [{ name: 'caratteristiche', label: 'Dotazioni', type: 'tags', options: FEATURES },
         { type: 'heading', label: 'Foto' },
         { name: 'foto', label: 'Foto', type: 'images', hint: 'La prima foto è la copertina. Meglio foto orizzontali.' },
         { type: 'heading', label: 'Descrizione' },
         { name: 'descrizione', label: 'Descrizione', type: 'textarea', rows: 8, hint: 'Lascia una riga vuota per andare a capo con un nuovo paragrafo.' },
         { type: 'heading', label: 'In inglese (facoltativo)' },
         { name: 'titolo_en', label: 'Titolo in inglese', type: 'text', hint: 'Per chi guarda il sito in inglese. Se lo lasci vuoto si vede il titolo italiano.' },
         { name: 'descrizione_en', label: 'Descrizione in inglese', type: 'textarea', rows: 6 }],
        o.extra || [],
        [{ type: 'heading', label: 'Pubblicazione' },
         { name: 'pubblicata', label: 'Visibile sul sito', type: 'checkbox', value: true },
         { name: 'esempio', label: 'Mostra l\'etichetta "Esempio"', type: 'checkbox' }]
      )
    };
  }

  var SCHEMAS = {
    vendita: propertySchema({
      badges: ['Nuovo', 'Esclusiva', 'Prezzo ribassato', 'In trattativa', 'Venduto'],
      priceTitle: 'Prezzo',
      price: [num('prezzo', 'Prezzo di vendita (€)', { hint: 'Solo il numero, senza punti (es. 280000)', half: false }),
              num('spese', 'Spese cond. (€/mese)')],
      details: [num('mq', 'Superficie (m²)'), num('locali', 'Locali'), num('camere', 'Camere'), num('bagni', 'Bagni'),
                { name: 'piano', label: 'Piano', type: 'text', half: true, placeholder: 'Es. 3° su 5' },
                { name: 'stato', label: 'Stato', type: 'select', options: ['', 'Nuovo', 'Ristrutturato', 'Buono stato', 'Da ristrutturare'], half: true },
                { name: 'classe_energetica', label: 'Classe energetica', type: 'select', options: CLASSI, half: true }]
    }),
    'affitti-lungo': propertySchema({
      badges: ['Nuovo', 'Disponibile subito', 'Affittato'],
      priceTitle: 'Canone',
      price: [num('canone', 'Canone mensile (€)'), num('spese', 'Spese cond. (€/mese)'),
              { name: 'contratto', label: 'Contratto', type: 'select', options: ['', '4+4', '3+2 canone concordato', 'Transitorio', 'Per studenti'], half: true },
              { name: 'disponibile_dal', label: 'Disponibile dal', type: 'date', half: true }],
      details: [num('mq', 'Superficie (m²)'), num('locali', 'Locali'), num('camere', 'Camere'), num('bagni', 'Bagni'),
                { name: 'piano', label: 'Piano', type: 'text', half: true, placeholder: 'Es. 3° su 5' },
                { name: 'arredamento', label: 'Arredamento', type: 'select', options: ['', 'Arredato', 'Parzialmente arredato', 'Non arredato'], half: true },
                { name: 'classe_energetica', label: 'Classe energetica', type: 'select', options: CLASSI, half: true }]
    }),
    'affitti-brevi': propertySchema({
      badges: ['Nuovo', 'Più richiesto', 'Vista panoramica'],
      priceTitle: 'Soggiorno',
      price: [num('minimo_notti', 'Notti minime', { hint: 'Sul sito non compare il prezzo: gli ospiti scelgono le date e chiedono un preventivo.', half: false })],
      details: [num('ospiti', 'Ospiti max'), num('camere', 'Camere'), num('letti', 'Letti'), num('bagni', 'Bagni'), num('mq', 'Superficie (m²)')],
      extra: [{ type: 'heading', label: 'Prenotazioni' },
              { name: 'link_airbnb', label: 'Link all\'annuncio Airbnb', type: 'url', hint: 'Facoltativo: compare il pulsante "Prenota su Airbnb".' },
              { name: 'link_booking', label: 'Link all\'annuncio Booking.com', type: 'url' },
              { name: 'cin', label: 'Codice CIN', type: 'text', hint: 'Codice Identificativo Nazionale, obbligatorio negli annunci di affitto breve.' }]
    }),
    progetti: {
      singular: 'progetto', plural: 'progetti', title: 'titolo', newLabel: 'Nuovo progetto', addLabel: '+ Carica nuovo progetto',
      fields: [
        { name: 'titolo', label: 'Titolo', type: 'text', required: true },
        { name: 'zona', label: 'Zona', type: 'text' },
        { name: 'stato', label: 'Stato', type: 'select', options: ['', 'In arrivo', 'In corso', 'Completato'] },
        { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
        { name: 'titolo_en', label: 'Titolo in inglese (facoltativo)', type: 'text' },
        { name: 'descrizione_en', label: 'Descrizione in inglese (facoltativa)', type: 'textarea' },
        { name: 'foto', label: 'Foto', type: 'image', hint: 'Oppure carica le foto "prima" e "dopo" per il cursore di confronto.' },
        { name: 'foto_prima', label: 'Foto PRIMA dei lavori', type: 'image', half: true },
        { name: 'foto_dopo', label: 'Foto DOPO i lavori', type: 'image', half: true },
        { name: 'esempio', label: 'Mostra l\'etichetta "Esempio"', type: 'checkbox' }
      ]
    },
    recensioni: {
      singular: 'recensione', plural: 'recensioni', title: 'nome', newLabel: 'Nuova recensione', addLabel: '+ Aggiungi recensione',
      fields: [
        { name: 'nome', label: 'Nome', type: 'text', required: true },
        { name: 'tipo', label: 'Tipo di cliente', type: 'select', options: ['Proprietario', 'Ospite', 'Acquirente'] },
        { name: 'stelle', label: 'Stelle', type: 'select', options: ['5', '4', '3', '2', '1'], number: true, value: 5 },
        { name: 'testo', label: 'Testo', type: 'textarea', required: true },
        { name: 'data', label: 'Data', type: 'date' },
        { name: 'pubblicata', label: 'Pubblicata sul sito', type: 'checkbox', value: true },
        { name: 'esempio', label: 'Recensione di esempio', type: 'checkbox' }
      ]
    }
  };

  var state = {
    session: null,   // { token, repo, branch }
    backend: null,
    data: {},        // page, comune, vendita, progetti, recensioni
    dirty: {},       // percorso file -> true
    uploads: {},     // percorso foto -> Blob da caricare
    previews: {},    // percorso foto -> URL temporaneo per l'anteprima
    active: null     // testo in modifica
  };

  // =====================================================================
  // Utilità
  // =====================================================================
  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    [].concat(children || []).forEach(function (c) {
      if (c != null) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }
  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'foto';
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function setPath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    keys.forEach(function (k) { obj = obj[k] = obj[k] && typeof obj[k] === 'object' ? obj[k] : {}; });
    obj[last] = value;
  }
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function textToB64(text) { return bytesToB64(new TextEncoder().encode(text)); }
  function blobToB64(blob) {
    return blob.arrayBuffer().then(function (buf) { return bytesToB64(new Uint8Array(buf)); });
  }
  function json(obj) { return JSON.stringify(obj, null, 2) + '\n'; }
  function sessionGet() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function sessionSet(v) { try { v ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(v)) : sessionStorage.removeItem(SESSION_KEY); } catch (e) {} }

  var toastTimer;
  function toast(msg, kind) {
    var box = document.querySelector('.lm-toast') || document.body.appendChild(h('div', { class: 'lm-toast lm-ui', role: 'status', 'aria-live': 'polite' }));
    box.textContent = msg;
    box.className = 'lm-toast lm-ui is-visible' + (kind ? ' is-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('is-visible'); }, kind === 'error' ? 7000 : 3500);
  }

  // =====================================================================
  // Cifratura del token (la password non viene mai salvata)
  // =====================================================================
  function deriveKey(password, salt, iterations) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }
  function encrypt(password, obj) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(password, salt, ITERATIONS).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
    }).then(function (buf) {
      return { salt: bytesToB64(salt), iv: bytesToB64(iv), iterations: ITERATIONS, data: bytesToB64(new Uint8Array(buf)) };
    });
  }
  function decrypt(password, box) {
    return deriveKey(password, b64ToBytes(box.salt), box.iterations).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(box.iv) }, key, b64ToBytes(box.data));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }

  // =====================================================================
  // Dove si salva: sul Mac (server.py) oppure su GitHub
  // =====================================================================
  var Local = {
    name: 'local',
    available: function () {
      return fetch('/__admin/ping', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (d) { return !!d.local; })
        .catch(function () { return false; });
    },
    read: function (path) {
      return fetch(path + '?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; });
    },
    save: function (files) {
      return fetch('/__admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LaMaison-Admin': '1' },
        body: JSON.stringify({ files: files })
      }).then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(d.error || 'Errore ' + r.status);
          return d;
        });
      });
    }
  };

  function GitHub(repo, branch, token) {
    var base = 'https://api.github.com/repos/' + repo;
    function api(path, opts) {
      opts = opts || {};
      var headers = { Authorization: 'Bearer ' + token, Accept: opts.accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      if (opts.body) headers['Content-Type'] = 'application/json';
      return fetch(base + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: 'no-store' })
        .then(function (r) {
          if (opts.allow404 && r.status === 404) return null;
          if (!r.ok) {
            return r.text().then(function (t) {
              var msg = r.status === 401 ? 'Token GitHub non valido o scaduto' :
                r.status === 403 || r.status === 404 ? 'Il token non ha accesso al repository ' + repo :
                r.status === 409 || r.status === 422 ? 'Qualcun altro ha appena salvato: ricarica la pagina e riprova' :
                'GitHub ha risposto ' + r.status;
              var err = new Error(msg); err.detail = t; throw err;
            });
          }
          return opts.raw ? r.text() : r.json();
        });
    }
    return {
      name: 'github',
      check: function () { return api(''); },
      read: function (path) {
        return api('/contents/' + path + '?ref=' + encodeURIComponent(branch), { accept: 'application/vnd.github.raw+json', raw: true, allow404: true })
          .then(function (t) { return t == null ? null : JSON.parse(t); });
      },
      // Tutti i file in un unico commit
      save: function (files, message) {
        var headSha;
        return api('/git/ref/heads/' + branch)
          .then(function (ref) { headSha = ref.object.sha; return api('/git/commits/' + headSha); })
          .then(function (commit) {
            return Promise.all(files.map(function (f) {
              return api('/git/blobs', { method: 'POST', body: { content: f.content, encoding: 'base64' } })
                .then(function (b) { return { path: f.path, mode: '100644', type: 'blob', sha: b.sha }; });
            })).then(function (tree) {
              return api('/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: tree } });
            });
          })
          .then(function (tree) {
            return api('/git/commits', { method: 'POST', body: { message: message, tree: tree.sha, parents: [headSha] } });
          })
          .then(function (commit) {
            return api('/git/refs/heads/' + branch, { method: 'PATCH', body: { sha: commit.sha } });
          });
      }
    };
  }

  function chooseBackend(session) {
    return (IS_LOCAL ? Local.available() : Promise.resolve(false)).then(function (local) {
      if (local) return Local;
      if (session.token && session.repo) return GitHub(session.repo, session.branch || 'main', session.token);
      throw new Error(IS_LOCAL
        ? 'Per salvare sul Mac avvia il sito con "Avvia sito.command" (o python3 server.py).'
        : 'Il sito non è ancora collegato a GitHub: dal Mac apri Area riservata → Impostazioni e inserisci il token.');
    });
  }

  function readAdminConfig() {
    return fetch('data/admin.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  }
  function saveAdminConfig(cfg, backend) {
    return backend.save([{ path: 'data/admin.json', content: textToB64(json(cfg)) }], 'Area riservata: aggiornato l\'accesso');
  }

  // =====================================================================
  // Finestre (accesso, schede, impostazioni) — a tutto schermo su telefono
  // =====================================================================
  function modal(title, body, opts) {
    closeModal();
    opts = opts || {};
    var panel = h('div', { class: 'lm-modal__panel' + (opts.wide ? ' is-wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
      h('div', { class: 'lm-modal__head' }, [
        h('h2', { text: title }),
        h('button', { type: 'button', class: 'lm-icon-btn', 'aria-label': 'Chiudi', html: '&times;', onclick: function () { closeModal(); if (opts.onclose) opts.onclose(); } })
      ]),
      h('div', { class: 'lm-modal__body' }, body)
    ]);
    var wrap = h('div', { class: 'lm-modal lm-ui' + (opts.drawer ? ' is-drawer' : '') }, [panel]);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) { closeModal(); if (opts.onclose) opts.onclose(); } });
    document.body.appendChild(wrap);
    document.documentElement.classList.add('lm-modal-open');
    var first = panel.querySelector('input, textarea, select');
    if (first && !opts.noAutofocus) setTimeout(function () { first.focus(); }, 50);
    return panel;
  }
  function closeModal() {
    var m = document.querySelector('.lm-modal');
    if (m) m.remove();
    document.documentElement.classList.remove('lm-modal-open');
  }
  function field(label, input, hint) {
    return h('label', { class: 'lm-field' }, [h('span', { class: 'lm-field__label', text: label }), input, hint ? h('span', { class: 'lm-field__hint', text: hint }) : null]);
  }
  function errorBox() { return h('p', { class: 'lm-error', role: 'alert' }); }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.innerHTML; btn.textContent = label || 'Attendi…'; }
    else if (btn.dataset.label != null) btn.innerHTML = btn.dataset.label;
  }

  // =====================================================================
  // Accesso
  // =====================================================================
  function open() {
    var session = sessionGet();
    if (session) return resume();
    readAdminConfig().then(function (cfg) {
      if (cfg.key) showLogin(cfg); else showSetup(cfg);
    });
  }

  function showLogin(cfg) {
    var pw = h('input', { type: 'password', autocomplete: 'current-password', required: true });
    var err = errorBox();
    var btn = h('button', { type: 'submit', class: 'lm-btn lm-btn--primary', text: 'Entra' });
    var form = h('form', { class: 'lm-form' }, [
      h('p', { class: 'lm-muted', text: 'Inserisci la password per modificare il sito.' }),
      field('Password', pw), err, btn
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      busy(btn, true, 'Verifica…');
      decrypt(pw.value, cfg.key)
        .then(function (secret) {
          var session = { token: secret.token || '', repo: cfg.repo || '', branch: cfg.branch || 'main' };
          sessionSet(session);
          closeModal();
          start(session);
        })
        .catch(function () {
          busy(btn, false);
          err.textContent = 'Password non corretta.';
          pw.select();
        });
    });
    modal('Area riservata', form);
  }

  function showSetup(cfg) {
    var pw = h('input', { type: 'password', autocomplete: 'new-password', minlength: 10, required: true });
    var pw2 = h('input', { type: 'password', autocomplete: 'new-password', required: true });
    var repo = h('input', { type: 'text', placeholder: 'utente/repository', value: cfg.repo || '', autocapitalize: 'off', spellcheck: 'false' });
    var token = h('input', { type: 'password', placeholder: 'github_pat_…', autocomplete: 'off' });
    var err = errorBox();
    var btn = h('button', { type: 'submit', class: 'lm-btn lm-btn--primary', text: 'Crea l\'accesso' });
    var form = h('form', { class: 'lm-form' }, [
      h('p', { class: 'lm-muted', text: 'Primo accesso: scegli la password con cui entrerai per modificare il sito.' }),
      field('Nuova password (almeno 10 caratteri)', pw), field('Ripeti la password', pw2),
      h('details', { class: 'lm-details', open: !IS_LOCAL }, [
        h('summary', { text: 'Pubblicazione online (GitHub) — puoi farlo anche dopo' }),
        field('Repository GitHub', repo, 'Es. andreasettecasi/lamaisongroup'),
        field('Token GitHub', token, 'Fine-grained token con permesso "Contents: Read and write" solo su questo repository.')
      ]),
      err, btn
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      if (pw.value.length < 10) { err.textContent = 'La password deve avere almeno 10 caratteri.'; return; }
      if (pw.value !== pw2.value) { err.textContent = 'Le due password non coincidono.'; return; }
      var session = { token: token.value.trim(), repo: repo.value.trim(), branch: 'main' };
      busy(btn, true, 'Creo l\'accesso…');
      var backend;
      chooseBackend(session)
        .then(function (b) { backend = b; return b.name === 'github' ? b.check() : null; })
        .then(function () { return encrypt(pw.value, { token: session.token }); })
        .then(function (key) { return saveAdminConfig({ repo: session.repo, branch: session.branch, key: key }, backend); })
        .then(function () {
          sessionSet(session);
          closeModal();
          toast('Accesso creato. Ricorda la password: non si può recuperare.', 'ok');
          start(session);
        })
        .catch(function (ex) { busy(btn, false); err.textContent = ex.message; });
    });
    modal('Crea il tuo accesso', form);
  }

  function resume() {
    var session = sessionGet();
    if (session) start(session);
  }

  // =====================================================================
  // Modalità modifica
  // =====================================================================
  function start(session) {
    state.session = session;
    chooseBackend(session)
      .then(function (backend) {
        state.backend = backend;
        return Promise.all(Object.keys(FILES).map(function (k) {
          return backend.read(FILES[k]).then(function (d) { state.data[k] = d || {}; });
        }));
      })
      .then(function () { return C.ready; }) // aspetta che la pagina abbia applicato i suoi testi
      .then(function () {
        document.documentElement.classList.add('lm-editing');
        document.documentElement.classList.remove('content-loading');
        applyAll();
        setupTexts();
        setupImages();
        setupLists();
        setupMap();
        setupToolbar();
        setupGuards();
        updateSaveButton();
      })
      .catch(function (ex) {
        toast(ex.message, 'error');
        sessionSet(null);
      });
  }

  function markDirty(fileKey) {
    state.dirty[FILES[fileKey]] = true;
    updateSaveButton();
  }
  function dirtyCount() { return Object.keys(state.dirty).length + Object.keys(state.uploads).length; }

  // ----- Testi -----
  function fileOf(key) { return (key.charAt(0) === '@' ? 'comune' : 'page') + (EN ? '_en' : ''); }
  function imageFileOf(key) { return key.charAt(0) === '@' ? 'comune' : 'page'; } // le foto sono uguali nelle due lingue
  // testi da mostrare: in inglese quelli tradotti, il resto in italiano
  function view() {
    var it = { page: state.data.page, comune: state.data.comune };
    return EN ? C.compose(it, { page: state.data.page_en, comune: state.data.comune_en }) : it;
  }
  function applyAll() { C.apply(view()); }
  function pathOf(key) { return key.charAt(0) === '@' ? key.slice(1) : key; }

  function serialize(node) {
    var out = '';
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeName === 'BR') out += '\n';
      else if (n.classList && n.classList.contains('accent')) out += '*' + n.textContent + '*';
      else if (n.nodeName === 'STRONG' || n.nodeName === 'B') out += '**' + n.textContent + '**';
      else if (n.nodeName === 'DIV' || n.nodeName === 'P') out += (out && out.slice(-1) !== '\n' ? '\n' : '') + serialize(n);
      else if (n.nodeType === 1) out += serialize(n);
    });
    return out;
  }
  function clean(text) {
    return text.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function onTextInput(e) {
    var el = e.currentTarget;
    var key = el.dataset.edit;
    var value = clean(serialize(el));
    setPath(state.data[fileOf(key)], pathOf(key), value);
    markDirty(fileOf(key));
    var href = el.dataset.editHref && C.hrefFor(el.dataset.editHref, value);
    if (href) el.setAttribute('href', href);
    // stesso testo in più punti (es. voci del menu in header, menu mobile e footer)
    document.querySelectorAll('[data-edit="' + key + '"]').forEach(function (other) {
      if (other !== el) other.innerHTML = C.format(value);
    });
  }

  function setupTexts() {
    document.querySelectorAll('[data-edit]').forEach(function (el) {
      // il testo dentro un pulsante (es. "Servizi" del menù) si modifica dalla sua copia nel menù del telefono
      if (el.closest('button')) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');
      el.classList.add('lm-editable');
      el.addEventListener('input', onTextInput);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
        if (e.key === 'Escape') el.blur();
      });
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
      el.addEventListener('focus', function () { state.active = el; document.documentElement.classList.add('lm-text-focus'); });
      el.addEventListener('blur', function () {
        setTimeout(function () {
          if (document.activeElement !== el) {
            if (state.active === el) state.active = null;
            if (!state.active) document.documentElement.classList.remove('lm-text-focus');
          }
        }, 150);
      });
    });
  }

  function formatSelection(kind) {
    var el = state.active;
    var sel = window.getSelection();
    if (!el || !sel.rangeCount || !el.contains(sel.anchorNode)) { toast('Clicca prima dentro un testo.'); return; }
    if (kind === 'plain') {
      el.querySelectorAll('.accent, strong, b').forEach(function (n) { n.replaceWith(document.createTextNode(n.textContent)); });
      el.normalize();
    } else {
      var range = sel.getRangeAt(0);
      var parent = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
      var existing = parent.closest(kind === 'gold' ? '.accent' : 'strong, b');
      if (existing && el.contains(existing) && existing !== el) {
        existing.replaceWith(document.createTextNode(existing.textContent));
        el.normalize();
      } else {
        if (range.collapsed) { toast('Seleziona prima le parole da evidenziare.'); return; }
        var text = range.toString();
        range.deleteContents();
        var node = kind === 'gold' ? h('span', { class: 'accent', text: text }) : h('strong', { text: text });
        range.insertNode(node);
        sel.removeAllRanges();
      }
    }
    el.dispatchEvent(new Event('input'));
  }

  // ----- Foto -----
  function processImage(file) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.src = url;
    return img.decode().then(function () {
      var scale = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      return new Promise(function (res) { canvas.toBlob(res, 'image/webp', 0.82); }).then(function (blob) {
        if (blob && blob.type === 'image/webp') return { blob: blob, ext: 'webp' };
        // Safari non sa creare WebP: usa JPEG
        return new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', 0.85); })
          .then(function (b) { return { blob: b, ext: 'jpg' }; });
      });
    }).catch(function () {
      URL.revokeObjectURL(url);
      throw new Error('Questa foto non si può leggere. Prova con un file JPG o PNG.');
    });
  }

  function pickImage(nameHint) {
    return new Promise(function (resolve) {
      var input = h('input', { type: 'file', accept: 'image/*', class: 'lm-hidden' });
      input.addEventListener('change', function () { resolve(input.files[0] || null); input.remove(); });
      document.body.appendChild(input);
      input.click();
    }).then(function (file) {
      if (!file) return null;
      toast('Preparo la foto…');
      return processImage(file).then(function (out) {
        var path = 'img/' + slug(nameHint) + '-' + Date.now().toString(36) + '.' + out.ext;
        state.uploads[path] = out.blob;
        state.previews[path] = URL.createObjectURL(out.blob);
        updateSaveButton();
        toast('Foto pronta. Ricordati di salvare.', 'ok');
        return path;
      });
    }).catch(function (ex) { toast(ex.message, 'error'); return null; });
  }
  function previewSrc(path) { return state.previews[path] || path; }

  function changeImage(key) {
    pickImage(key.replace(/^@/, '').replace(/\./g, '-')).then(function (path) {
      if (!path) return;
      setPath(state.data[imageFileOf(key)], pathOf(key), path);
      markDirty(imageFileOf(key));
      document.querySelectorAll('[data-edit-img="' + key + '"]').forEach(function (img) { img.src = previewSrc(path); });
    });
  }
  function changeAlt(key) {
    var current = C.lookup(view(), key + '_alt') || '';
    var value = window.prompt('Descrivi la foto in poche parole (serve a Google e a chi non vede):', current);
    if (value == null) return;
    setPath(state.data[fileOf(key)], pathOf(key) + '_alt', value.trim());
    markDirty(fileOf(key));
    document.querySelectorAll('[data-edit-img="' + key + '"]').forEach(function (img) { img.alt = value.trim(); });
  }

  function setupImages() {
    document.querySelectorAll('img[data-edit-img]').forEach(function (img) {
      var key = img.dataset.editImg;
      img.classList.add('lm-editable-img');
      // Loghi e foto piccole: si cambiano cliccandoci sopra
      if (img.closest('.header__logo')) {
        img.addEventListener('click', function () { changeImage(key); });
        img.title = 'Clicca per cambiare il logo';
        return;
      }
      // Foto iniziale della Home (più foto a rotazione): una barra con "Cambia foto 1, 2, 3"
      if (img.hasAttribute('data-hero-slide')) {
        var slides = [].slice.call(document.querySelectorAll('[data-hero-slide]'));
        var n = slides.indexOf(img);
        var bar = img.parentElement.querySelector(':scope > .lm-imgtools');
        if (!bar) {
          img.parentElement.classList.add('lm-imghost');
          bar = h('div', { class: 'lm-imgtools lm-ui' }, []);
          img.parentElement.appendChild(bar);
        }
        bar.appendChild(h('button', { type: 'button', class: 'lm-btn lm-btn--small', text: 'Cambia foto ' + (n + 1), onclick: function () {
          if (window.LaMaisonHero) window.LaMaisonHero.go(n);
          changeImage(key);
        } }));
        if (n === slides.length - 1) {
          // descrizione della foto che si vede in questo momento
          bar.appendChild(h('button', { type: 'button', class: 'lm-btn lm-btn--small lm-btn--ghost', text: 'Descrizione', onclick: function () {
            var i = window.LaMaisonHero ? window.LaMaisonHero.current() : 0;
            changeAlt(slides[i].dataset.editImg);
          } }));
        }
        return;
      }
      var host = img.parentElement;
      host.classList.add('lm-imghost');
      host.appendChild(h('div', { class: 'lm-imgtools lm-ui' }, [
        h('button', { type: 'button', class: 'lm-btn lm-btn--small', text: 'Cambia foto', onclick: function () { changeImage(key); } }),
        h('button', { type: 'button', class: 'lm-btn lm-btn--small lm-btn--ghost', text: 'Descrizione', onclick: function () { changeAlt(key); } })
      ]));
    });
  }

  // ----- Immobili, progetti, recensioni -----
  function items(name) {
    var key = R.LIST_KEY[name];
    var d = state.data[name];
    if (Array.isArray(d)) { state.data[name] = d = {}; d[key] = []; }
    if (!Array.isArray(d[key])) d[key] = [];
    return d[key];
  }

  // copia dei dati con le foto non ancora salvate mostrate in anteprima
  function withPreviews(name) {
    items(name);
    var data = clone(state.data[name]);
    R.all(data, name).forEach(function (it) {
      ['foto', 'foto_prima', 'foto_dopo'].forEach(function (f) {
        if (Array.isArray(it[f])) it[f] = it[f].map(previewSrc);
        else if (it[f]) it[f] = previewSrc(it[f]);
      });
    });
    return data;
  }

  function redraw(name) {
    document.querySelectorAll('[data-render="' + name + '"]').forEach(function (box) {
      R.draw(box, withPreviews(name), true);
      decorateCards(box, name);
    });
    var S = window.LaMaisonScheda;
    if (S && S.category === name && document.querySelector('[data-scheda]')) redrawScheda();
  }

  // Scheda del singolo immobile: in modifica mostra anche gli annunci nascosti
  function redrawScheda() {
    var S = window.LaMaisonScheda;
    var root = document.querySelector('[data-scheda]');
    root.dataset.editing = '1';
    S.render(withPreviews(S.category), true);
    var i = Number(root.dataset.index);
    var box = root.querySelector('.scheda');
    if (!box || isNaN(i) || i < 0) return;
    box.insertBefore(h('div', { class: 'lm-listbar lm-scheda-bar lm-ui' }, [
      h('button', { type: 'button', class: 'lm-btn lm-btn--primary', text: 'Modifica questo immobile', onclick: function () { editItem(S.category, i); } }),
      h('button', { type: 'button', class: 'lm-btn lm-danger', text: 'Elimina', onclick: function () { deleteItem(S.category, i); } })
    ]), box.firstChild);
  }

  function decorateCards(box, name) {
    var schema = SCHEMAS[name];
    var list = items(name);
    box.querySelectorAll('article[data-index]').forEach(function (card) {
      var i = Number(card.dataset.index);
      card.classList.add('lm-card');
      if (list[i] && list[i].pubblicata === false) card.appendChild(h('span', { class: 'lm-hidden-tag lm-ui', text: 'Nascosta' }));
      card.insertBefore(h('div', { class: 'lm-cardbar lm-ui' }, [
        h('button', { type: 'button', class: 'lm-btn lm-btn--small', text: 'Modifica', onclick: function () { editItem(name, i); } }),
        h('button', { type: 'button', class: 'lm-icon-btn', 'aria-label': 'Sposta prima', title: 'Sposta prima', html: '&uarr;', disabled: i === 0, onclick: function () { moveItem(name, i, -1); } }),
        h('button', { type: 'button', class: 'lm-icon-btn', 'aria-label': 'Sposta dopo', title: 'Sposta dopo', html: '&darr;', disabled: i === list.length - 1, onclick: function () { moveItem(name, i, 1); } }),
        h('button', { type: 'button', class: 'lm-icon-btn lm-danger', 'aria-label': 'Elimina', title: 'Elimina', html: '&#128465;', onclick: function () { deleteItem(name, i); } })
      ]), card.firstChild);
    });
    var bar = box.nextElementSibling && box.nextElementSibling.classList.contains('lm-listbar') ? box.nextElementSibling : null;
    if (!bar) {
      bar = h('div', { class: 'lm-listbar lm-ui' });
      box.parentNode.insertBefore(bar, box.nextSibling);
    }
    bar.innerHTML = '';
    bar.appendChild(h('button', { type: 'button', class: 'lm-btn lm-btn--primary', text: schema.addLabel, onclick: function () { editItem(name, -1); } }));
    var limit = parseInt(box.dataset.limit, 10);
    if (limit && list.length > limit) {
      bar.appendChild(h('button', { type: 'button', class: 'lm-btn', text: 'Tutti i ' + schema.plural + ' (' + list.length + ')', onclick: function () { manageList(name); } }));
    }
  }

  function setupLists() {
    document.querySelectorAll('[data-render]').forEach(function (box) {
      if (!SCHEMAS[box.dataset.render]) return;
      box.dataset.editing = '1';
    });
    Object.keys(SCHEMAS).forEach(redraw);
  }

  function moveItem(name, i, dir) {
    var list = items(name);
    var j = i + dir;
    if (j < 0 || j >= list.length) return;
    list.splice(j, 0, list.splice(i, 1)[0]);
    markDirty(name);
    redraw(name);
    if (document.querySelector('.lm-modal')) manageList(name);
  }
  function deleteItem(name, i) {
    var list = items(name);
    var label = list[i][SCHEMAS[name].title] || SCHEMAS[name].singular;
    if (!window.confirm('Eliminare "' + label + '"?')) return false;
    list.splice(i, 1);
    markDirty(name);
    redraw(name);
    return true;
  }

  function manageList(name) {
    var schema = SCHEMAS[name];
    var list = items(name);
    var ul = h('ol', { class: 'lm-list' }, list.map(function (it, i) {
      return h('li', {}, [
        h('span', { class: 'lm-list__title', text: (it[schema.title] || '(senza titolo)') + (it.pubblicata === false ? ' — nascosta' : '') }),
        h('span', { class: 'lm-list__actions' }, [
          h('button', { type: 'button', class: 'lm-btn lm-btn--small', text: 'Modifica', onclick: function () { editItem(name, i); } }),
          h('button', { type: 'button', class: 'lm-icon-btn', 'aria-label': 'Sposta prima', html: '&uarr;', disabled: i === 0, onclick: function () { moveItem(name, i, -1); } }),
          h('button', { type: 'button', class: 'lm-icon-btn', 'aria-label': 'Sposta dopo', html: '&darr;', disabled: i === list.length - 1, onclick: function () { moveItem(name, i, 1); } })
        ])
      ]);
    }));
    modal('Tutti i ' + schema.plural, [
      h('p', { class: 'lm-muted', text: 'L\'ordine qui è l\'ordine sul sito.' }), ul,
      h('button', { type: 'button', class: 'lm-btn lm-btn--primary', text: schema.addLabel, onclick: function () { editItem(name, -1); } })
    ], { drawer: true, noAutofocus: true });
  }

  function imageControl(value, nameHint, onchange, removable) {
    var wrap = h('div', { class: 'lm-imgfield' });
    function render() {
      wrap.innerHTML = '';
      if (value) wrap.appendChild(h('img', { src: previewSrc(value), alt: '' }));
      var btns = h('div', { class: 'lm-imgfield__btns' }, [
        h('button', { type: 'button', class: 'lm-btn lm-btn--small', text: value ? 'Sostituisci' : 'Carica foto', onclick: function () {
          pickImage(nameHint).then(function (p) { if (p) { value = p; onchange(p); render(); } });
        } }),
        value && removable !== false ? h('button', { type: 'button', class: 'lm-btn lm-btn--small lm-btn--ghost', text: 'Rimuovi', onclick: function () { value = ''; onchange(''); render(); } }) : null
      ]);
      wrap.appendChild(btns);
    }
    render();
    return wrap;
  }

  function editItem(name, index) {
    var schema = SCHEMAS[name];
    var list = items(name);
    var isNew = index < 0;
    var draft = isNew ? {} : clone(list[index]);
    if (isNew) schema.fields.forEach(function (f) { if (f.value !== undefined) draft[f.name] = f.value; });
    if (isNew && name === 'recensioni') draft.data = new Date().toISOString().slice(0, 10);
    var err = errorBox();

    var controls = schema.fields.map(function (f) {
      var v = draft[f.name];
      var input;
      if (f.type === 'heading') return h('h3', { class: 'lm-form__heading', text: f.label });
      if (f.type === 'tags') {
        var chosen = (Array.isArray(v) ? v : []).filter(function (t) { return f.options.indexOf(t) !== -1; });
        var other = h('input', { type: 'text', placeholder: 'Altro, separato da virgole', oninput: function () { sync(); } });
        other.value = (Array.isArray(v) ? v : []).filter(function (t) { return f.options.indexOf(t) === -1; }).join(', ');
        var sync = function () {
          draft[f.name] = chosen.concat(other.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean));
        };
        var boxes = f.options.map(function (o) {
          var c = h('input', { type: 'checkbox', onchange: function () {
            chosen = c.checked ? chosen.concat(o) : chosen.filter(function (x) { return x !== o; });
            sync();
          } });
          c.checked = chosen.indexOf(o) !== -1;
          return h('label', { class: 'lm-tag' }, [c, h('span', { text: o })]);
        });
        return h('div', { class: 'lm-field' }, [h('span', { class: 'lm-field__label', text: f.label }), h('div', { class: 'lm-tags' }, boxes), other]);
      }
      if (f.type === 'textarea') {
        input = h('textarea', { rows: f.rows || 5, oninput: function () { draft[f.name] = input.value; } });
        input.value = v || '';
      } else if (f.type === 'select') {
        input = h('select', { onchange: function () { draft[f.name] = f.number ? Number(input.value) : input.value; } },
          f.options.map(function (o) { return h('option', { value: o, text: o || '—' }); }));
        input.value = v == null ? f.options[0] : String(v);
        if (v == null) draft[f.name] = f.number ? Number(input.value) : input.value;
      } else if (f.type === 'checkbox') {
        input = h('input', { type: 'checkbox', onchange: function () { draft[f.name] = input.checked; } });
        input.checked = !!v;
        return h('label', { class: 'lm-check' }, [input, h('span', { text: f.label })]);
      } else if (f.type === 'image') {
        return h('div', { class: 'lm-field' + (f.half ? ' is-half' : '') }, [
          h('span', { class: 'lm-field__label', text: f.label }),
          imageControl(v, (draft.titolo || name) + '-' + f.name, function (p) { draft[f.name] = p; }),
          f.hint ? h('span', { class: 'lm-field__hint', text: f.hint }) : null
        ]);
      } else if (f.type === 'images') {
        var photos = Array.isArray(v) ? v.slice() : [];
        var box = h('div', { class: 'lm-photos' });
        var draw = function () {
          draft[f.name] = photos.filter(Boolean);
          box.innerHTML = '';
          photos.forEach(function (p, i) {
            box.appendChild(h('div', { class: 'lm-photo' }, [
              h('img', { src: previewSrc(p), alt: '' }),
              i === 0 ? h('span', { class: 'lm-photo__cover', text: 'Copertina' }) : null,
              h('div', { class: 'lm-photo__btns' }, [
                h('button', { type: 'button', class: 'lm-icon-btn', 'aria-label': 'Sposta prima', html: '&larr;', disabled: i === 0, onclick: function () { photos.splice(i - 1, 0, photos.splice(i, 1)[0]); draw(); } }),
                h('button', { type: 'button', class: 'lm-icon-btn lm-danger', 'aria-label': 'Rimuovi', html: '&times;', onclick: function () { photos.splice(i, 1); draw(); } })
              ])
            ]));
          });
          box.appendChild(h('button', { type: 'button', class: 'lm-photo lm-photo--add', text: '+ Aggiungi foto', onclick: function () {
            pickImage((draft.titolo || name) + '-foto').then(function (p) { if (p) { photos.push(p); draw(); } });
          } }));
        };
        draw();
        return h('div', { class: 'lm-field' }, [h('span', { class: 'lm-field__label', text: f.label }), box, f.hint ? h('span', { class: 'lm-field__hint', text: f.hint }) : null]);
      } else {
        var el = input = h('input', { type: ['number', 'date', 'url'].indexOf(f.type) !== -1 ? f.type : 'text', inputmode: f.type === 'number' ? 'numeric' : null, min: f.type === 'number' ? 0 : null,
          placeholder: f.placeholder || (f.type === 'url' ? 'https://…' : null),
          oninput: function () { draft[f.name] = f.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value; } });
        el.value = v == null ? '' : v;
        if (f.options) {
          var id = 'lm-dl-' + f.name;
          input.setAttribute('list', id);
          // il campo resta quello che legge il valore: la lista dei suggerimenti gli va solo accanto
          input = h('span', { class: 'lm-suggest' }, [input, h('datalist', { id: id }, f.options.map(function (o) { return h('option', { value: o }); }))]);
        }
      }
      var fl = field(f.label + (f.required ? ' *' : ''), input, f.hint);
      if (f.half) fl.classList.add('is-half');
      return fl;
    });

    var save = h('button', { type: 'submit', class: 'lm-btn lm-btn--primary', text: isNew ? 'Aggiungi' : 'Applica' });
    var del = isNew ? null : h('button', { type: 'button', class: 'lm-btn lm-btn--ghost lm-danger', text: 'Elimina', onclick: function () {
      if (deleteItem(name, index)) closeModal();
    } });
    var form = h('form', { class: 'lm-form lm-form--grid' }, controls.concat([err, h('div', { class: 'lm-form__actions' }, [del, save])]));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var missing = schema.fields.filter(function (f) { return f.required && !String(draft[f.name] || '').trim(); });
      var badUrl = schema.fields.filter(function (f) { return f.type === 'url' && draft[f.name] && !/^https?:\/\//.test(draft[f.name]); });
      if (badUrl.length) { err.textContent = 'Il link deve iniziare con https:// (' + badUrl[0].label + ')'; return; }
      if (missing.length) { err.textContent = 'Compila: ' + missing.map(function (f) { return f.label; }).join(', '); return; }
      Object.keys(draft).forEach(function (k) {
        if (draft[k] === null || draft[k] === '' || (Array.isArray(draft[k]) && !draft[k].length)) delete draft[k];
      });
      if (!draft.indirizzo_visibile) delete draft.indirizzo_visibile;
      if (!draft.esempio) delete draft.esempio;
      if (name !== 'recensioni' && !draft.id) {
        var base = slug(draft.titolo), id = base, n = 2;
        var taken = list.map(function (it) { return it.id; });
        while (taken.indexOf(id) !== -1) id = base + '-' + n++;
        draft.id = id;
      }
      if (isNew) list.unshift(draft); else list[index] = draft;
      markDirty(name);
      redraw(name);
      closeModal();
      toast(isNew ? 'Aggiunto. Ricordati di salvare.' : 'Modificato. Ricordati di salvare.', 'ok');
    });
    modal(isNew ? schema.newLabel : 'Modifica ' + schema.singular, form, { drawer: true, noAutofocus: true });
  }

  // ----- Mappa "Dove operiamo": clic su una provincia per aggiungerla o toglierla -----
  function setupMap() {
    var M = window.LaMaisonMap;
    var box = document.querySelector('[data-map]');
    if (!M || !box) return;
    box.insertBefore(h('p', { class: 'lm-map-hint lm-ui', text: 'Clicca su una provincia per aggiungerla o toglierla.' }), box.firstChild);
    M.setEditable(function (sigla) {
      var sito = state.data.comune.sito = state.data.comune.sito || {};
      var list = Array.isArray(sito.province) ? sito.province.slice() : ['TO'];
      var i = list.indexOf(sigla);
      if (i === -1) list.push(sigla); else list.splice(i, 1);
      sito.province = list;
      markDirty('comune');
      applyAll();
      var p = M.provinces().filter(function (x) { return x.sigla === sigla; })[0];
      toast((p ? p.nome : sigla) + (i === -1 ? ' aggiunta' : ' tolta') + '. Ricordati di salvare.', 'ok');
    });
  }

  // ----- Impostazioni -----
  function showSettings() {
    var page = EN ? state.data.page_en : state.data.page, sito = (state.data.comune.sito = state.data.comune.sito || {});
    page._seo = page._seo || {};
    var title = h('input', { type: 'text', value: page._seo.titolo || document.title });
    var desc = h('textarea', { rows: 3 });
    desc.value = page._seo.descrizione || '';
    var wa1 = h('input', { type: 'tel', value: sito.whatsapp_1 || '' });
    var wa2 = h('input', { type: 'tel', value: sito.whatsapp_2 || '' });
    var swiss = h('input', { type: 'checkbox' });
    swiss.checked = sito.mostra_svizzero !== false;
    var fb = h('input', { type: 'url', value: sito.facebook || '', placeholder: 'https://www.facebook.com/…' });
    var ig = h('input', { type: 'url', value: sito.instagram || '', placeholder: 'https://www.instagram.com/…' });
    var umId = h('input', { type: 'text', value: sito.umami_id || '', placeholder: 'es. 3f2a1b4c-…', autocapitalize: 'off', spellcheck: 'false' });
    var umShare = h('input', { type: 'url', value: sito.umami_condivisione || '', placeholder: 'https://cloud.umami.is/share/…' });
    var err = errorBox();
    var apply = h('button', { type: 'submit', class: 'lm-btn lm-btn--primary', text: 'Applica' });
    var form = h('form', { class: 'lm-form' }, [
      h('h3', { text: EN ? 'Questa pagina su Google (in inglese)' : 'Questa pagina su Google' }),
      field('Titolo', title, 'Il titolo blu nei risultati di Google (circa 60 caratteri).'),
      field('Descrizione', desc, 'Il testo sotto il titolo (circa 155 caratteri).'),
      h('h3', { text: 'WhatsApp' }),
      field('Numero principale', wa1, 'Con prefisso, senza + né spazi (es. 393932671463). Usato dal pulsante verde e dai link "Scrivici su WhatsApp".'),
      field('Secondo numero', wa2, 'Usato nella pagina Contatti per il secondo referente.'),
      h('h3', { text: 'Telefoni' }),
      h('label', { class: 'lm-check' }, [swiss, h('span', { text: 'Mostra il numero svizzero (+41) nel footer e in Contatti' })]),
      h('h3', { text: 'Social' }),
      field('Pagina Facebook', fb, 'Lascia vuoto finché non c\'è: l\'icona compare nel footer solo quando inserisci il link.'),
      field('Profilo Instagram', ig),
      h('h3', { text: 'Statistiche (Umami)' }),
      field('ID del sito (Website ID)', umId, 'Da Umami → Settings → Websites → Edit. Con l\'ID inserito il sito pubblicato inizia a contare visite e clic, e in Privacy e Cookie compaiono i paragrafi sulle statistiche.'),
      field('Link di condivisione (Share URL)', umShare, 'Da Umami → Settings → Websites → Edit → Share URL. Serve per vedere i numeri nel pulsante "Statistiche".'),
      err,
      apply
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      page._seo.titolo = title.value.trim();
      page._seo.descrizione = desc.value.trim();
      sito.whatsapp_1 = wa1.value.replace(/\D/g, '');
      sito.whatsapp_2 = wa2.value.replace(/\D/g, '');
      var links = [fb.value.trim(), ig.value.trim()];
      if (links.some(function (u) { return u && !/^https:\/\//.test(u); })) { err.textContent = 'I link social devono iniziare con https://'; return; }
      var uid = umId.value.trim(), ushare = umShare.value.trim();
      if (uid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) { err.textContent = 'L\'ID di Umami ha questa forma: 8-4-4-4-12 caratteri (es. 3f2a1b4c-1234-4abc-9def-0123456789ab).'; return; }
      if (ushare && !/^https:\/\//.test(ushare)) { err.textContent = 'Il link di condivisione di Umami deve iniziare con https://'; return; }
      sito.umami_id = uid;
      sito.umami_condivisione = ushare;
      sito.mostra_svizzero = swiss.checked;
      sito.facebook = links[0];
      sito.instagram = links[1];
      markDirty(EN ? 'page_en' : 'page');
      markDirty('comune');
      applyAll();
      closeModal();
      toast('Impostazioni applicate. Ricordati di salvare.', 'ok');
    });
    var access = h('button', { type: 'button', class: 'lm-btn', text: 'Cambia password o collegamento GitHub', onclick: showAccessSettings });
    modal('Impostazioni', [form, h('hr'), access], { drawer: true, noAutofocus: true });
  }

  // ----- Statistiche delle visite (Umami) -----
  function showStats() {
    var sito = (state.data.comune && state.data.comune.sito) || {};
    var share = String(sito.umami_condivisione || '').trim();
    var active = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(sito.umami_id || '').trim());
    var body = [];
    if (share && /^https:\/\//.test(share)) {
      body.push(h('p', { class: 'lm-stats__note', text: 'Visite, pagine viste, tempo medio, provenienza, dispositivi e clic (menu "Eventi": Chiamata, WhatsApp, Modulo inviato, Affida il tuo immobile, Richiedi valutazione…). Sono dati anonimi: le visite fatte da qui non vengono contate.' }));
      body.push(h('iframe', { class: 'lm-stats__frame', src: share, title: 'Statistiche del sito', loading: 'lazy', referrerpolicy: 'no-referrer' }));
      body.push(h('p', {}, [h('a', { class: 'lm-btn', href: share, target: '_blank', rel: 'noopener', text: 'Apri le statistiche a schermo intero' })]));
      if (!active) body.push(h('p', { class: 'lm-stats__warn', text: 'Attenzione: manca l\'ID del sito in Impostazioni → Statistiche, quindi il sito non sta contando le visite.' }));
      if (IS_LOCAL) body.push(h('p', { class: 'lm-stats__note', text: 'Il sito sul Mac non conta le visite: i numeri arrivano solo dal sito pubblicato.' }));
    } else if (active) {
      // conteggio attivo ma senza link di condivisione: si aprono le statistiche su Umami (con la propria email e password)
      var dash = 'https://cloud.umami.is/websites/' + String(sito.umami_id).trim();
      body.push(h('p', { html: '<strong>Le statistiche sono attive.</strong> Il sito pubblicato conta visite, tempo di navigazione e clic (Chiamata, WhatsApp, Modulo inviato, Affida il tuo immobile, Richiedi valutazione…).' }));
      body.push(h('p', {}, [h('a', { class: 'lm-btn lm-btn--primary', href: dash, target: '_blank', rel: 'noopener', text: 'Apri le statistiche su Umami' })]));
      body.push(h('p', { class: 'lm-stats__note', text: 'Si apre il sito di Umami: accedi con l\'email e la password del tuo account. Per vedere i numeri direttamente qui, crea in Umami il link di condivisione (Websites → Edit → Share URL → Add) e incollalo in Impostazioni → Statistiche.' }));
      if (IS_LOCAL) body.push(h('p', { class: 'lm-stats__note', text: 'Il sito sul Mac non conta le visite: i numeri arrivano solo dal sito pubblicato.' }));
    } else {
      body.push(h('p', { text: 'Le statistiche non sono ancora collegate. Per attivarle (gratis, senza cookie):' }));
      body.push(h('ol', { class: 'lm-stats__steps' }, [
        h('li', { text: 'Crea un account su cloud.umami.is (piano Hobby, gratuito). Se te lo chiede, scegli i dati in Europa (EU).' }),
        h('li', { text: 'Aggiungi il sito: Settings → Websites → Add website, nome "LA MAISON GROUP", dominio www.lamaison-group.it.' }),
        h('li', { text: 'Apri il sito appena creato (Edit) e copia il Website ID.' }),
        h('li', { text: 'Nella stessa pagina attiva "Share URL" e copia il link.' }),
        h('li', { text: 'Qui nell\'area riservata: Impostazioni → Statistiche, incolla ID e link, poi Applica e Salva.' })
      ]));
      body.push(h('p', { class: 'lm-stats__note', text: 'Le visite si contano solo sul sito pubblicato: sul Mac i numeri restano a zero.' }));
      body.push(h('button', { type: 'button', class: 'lm-btn lm-btn--primary', text: 'Vai alle impostazioni', onclick: showSettings }));
    }
    modal('Statistiche del sito', body, { wide: true, noAutofocus: true });
  }

  function showAccessSettings() {
    readAdminConfig().then(function (cfg) {
      var current = h('input', { type: 'password', autocomplete: 'current-password', required: true });
      var pw = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Lascia vuoto per non cambiarla' });
      var repo = h('input', { type: 'text', value: cfg.repo || state.session.repo || '', placeholder: 'utente/repository', autocapitalize: 'off', spellcheck: 'false' });
      var token = h('input', { type: 'password', placeholder: state.session.token ? 'Già inserito — lascia vuoto per tenerlo' : 'github_pat_…', autocomplete: 'off' });
      var err = errorBox();
      var btn = h('button', { type: 'submit', class: 'lm-btn lm-btn--primary', text: 'Salva l\'accesso' });
      var form = h('form', { class: 'lm-form' }, [
        field('Password attuale', current), field('Nuova password (almeno 10 caratteri)', pw),
        field('Repository GitHub', repo, 'Es. andreasettecasi/lamaisongroup'),
        field('Token GitHub', token, 'GitHub → Settings → Developer settings → Fine-grained tokens. Accesso solo a questo repository, permesso "Contents: Read and write".'),
        err, btn
      ]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        err.textContent = '';
        if (pw.value && pw.value.length < 10) { err.textContent = 'La nuova password deve avere almeno 10 caratteri.'; return; }
        busy(btn, true, 'Salvo…');
        var session;
        decrypt(current.value, cfg.key)
          .catch(function () { throw new Error('Password attuale non corretta.'); })
          .then(function (secret) {
            session = { token: token.value.trim() || secret.token || '', repo: repo.value.trim(), branch: cfg.branch || 'main' };
            return session.token && session.repo && state.backend.name === 'github' ? GitHub(session.repo, session.branch, session.token).check() : null;
          })
          .then(function () { return encrypt(pw.value || current.value, { token: session.token }); })
          .then(function (key) { return saveAdminConfig({ repo: session.repo, branch: session.branch, key: key }, state.backend); })
          .then(function () {
            state.session = session;
            sessionSet(session);
            closeModal();
            toast('Accesso aggiornato.', 'ok');
          })
          .catch(function (ex) { busy(btn, false); err.textContent = ex.message; });
      });
      modal('Accesso', form, { drawer: true });
    });
  }

  // ----- Barra in basso -----
  function updateSaveButton() {
    var btn = document.querySelector('.lm-save');
    if (!btn) return;
    var n = dirtyCount();
    btn.disabled = !n;
    btn.querySelector('.lm-save__count').textContent = n ? String(n) : '';
    btn.classList.toggle('has-changes', !!n);
  }

  function save() {
    var n = dirtyCount();
    if (!n) return Promise.resolve();
    var btn = document.querySelector('.lm-save');
    busy(btn, true, 'Salvo…');
    var keyOf = {};
    Object.keys(FILES).forEach(function (k) { keyOf[FILES[k]] = k; });
    var jsonFiles = Object.keys(state.dirty).map(function (path) {
      return { path: path, content: textToB64(json(state.data[keyOf[path]])) };
    });
    var names = Object.keys(state.uploads);
    return Promise.all(names.map(function (path) {
      return blobToB64(state.uploads[path]).then(function (b64) { return { path: path, content: b64 }; });
    })).then(function (imgs) {
      var message = 'Modifiche dal sito: ' + Object.keys(state.dirty).concat(names).map(function (p) { return p.split('/').pop(); }).join(', ');
      return state.backend.save(imgs.concat(jsonFiles), message);
    }).then(function () {
      state.dirty = {};
      state.uploads = {};
      busy(btn, false);
      updateSaveButton();
      toast(state.backend.name === 'github' ? 'Salvato! Il sito online si aggiorna in 1-2 minuti.' : 'Salvato!', 'ok');
    }).catch(function (ex) {
      busy(btn, false);
      updateSaveButton();
      toast('Non salvato: ' + ex.message, 'error');
      throw ex;
    });
  }

  function goTo(page) {
    if (page === PAGE) return;
    var go = function () { location.href = page + '.html'; };
    if (!dirtyCount()) return go();
    if (window.confirm('Hai modifiche non salvate. Le salvo prima di cambiare pagina?')) save().then(go).catch(function () {});
    else if (window.confirm('Cambiare pagina senza salvare? Le modifiche andranno perse.')) { state.dirty = {}; state.uploads = {}; go(); }
    else document.querySelector('.lm-pages').value = PAGE;
  }

  function exit() {
    if (dirtyCount() && !window.confirm('Uscire senza salvare? Le modifiche andranno perse.')) return;
    state.dirty = {}; state.uploads = {};
    sessionSet(null);
    location.reload();
  }

  var ICON = {
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    exit: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>'
  };

  function setupToolbar() {
    var keep = function (e) { e.preventDefault(); }; // i pulsanti di formato non tolgono il cursore dal testo
    var list = PAGES.some(function (p) { return p[0] === PAGE; }) ? PAGES : [[PAGE, 'Scheda immobile']].concat(PAGES);
    var pages = h('select', { class: 'lm-pages', 'aria-label': 'Pagina da modificare', onchange: function () { goTo(pages.value); } },
      list.map(function (p) { return h('option', { value: p[0], text: p[1] }); }));
    pages.value = PAGE;
    var fmt = function (kind, html, title) {
      return h('button', { type: 'button', class: 'lm-tool lm-fmt', title: title, 'aria-label': title, html: html, onmousedown: keep, onclick: function () { formatSelection(kind); } });
    };
    var bar = h('div', { class: 'lm-toolbar lm-ui', role: 'toolbar', 'aria-label': 'Modifica del sito' }, [
      h('span', { class: 'lm-badge', text: EN ? 'Modifica · EN' : 'Modifica', title: EN ? 'Stai modificando i testi in inglese' : 'Stai modificando i testi in italiano' }),
      pages,
      h('div', { class: 'lm-fmtgroup' }, [
        fmt('gold', '<span class="lm-gold">A</span>', 'Evidenzia in oro le parole selezionate'),
        fmt('bold', '<b>B</b>', 'Grassetto sulle parole selezionate'),
        fmt('plain', 'T&#x0338;', 'Togli evidenziazioni da questo testo')
      ]),
      h('span', { class: 'lm-spacer' }),
      h('button', { type: 'button', class: 'lm-tool', title: 'Statistiche delle visite', 'aria-label': 'Statistiche', html: ICON.chart + '<span class="lm-tool__text">Statistiche</span>', onclick: showStats }),
      h('button', { type: 'button', class: 'lm-tool', title: 'Impostazioni', 'aria-label': 'Impostazioni', html: ICON.gear + '<span class="lm-tool__text">Impostazioni</span>', onclick: showSettings }),
      h('button', { type: 'button', class: 'lm-tool', title: 'Esci', 'aria-label': 'Esci dalla modifica', html: ICON.exit + '<span class="lm-tool__text">Esci</span>', onclick: exit }),
      h('button', { type: 'button', class: 'lm-btn lm-btn--primary lm-save', onclick: function () { save().catch(function () {}); } }, [
        'Salva', h('span', { class: 'lm-save__count' })
      ])
    ]);
    document.body.appendChild(bar);
  }

  function setupGuards() {
    // In modifica i link non portano altrove (si cambia pagina dal menu in basso)
    document.addEventListener('click', function (e) {
      if (e.target.closest('.lm-ui')) return;
      var a = e.target.closest('a');
      if (a) { e.preventDefault(); e.stopPropagation(); }
      var label = e.target.closest('label[data-edit]');
      if (label) e.preventDefault();
    }, true);
    document.addEventListener('submit', function (e) {
      if (!e.target.closest('.lm-ui')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    window.addEventListener('beforeunload', function (e) {
      if (dirtyCount()) { e.preventDefault(); e.returnValue = ''; }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save().catch(function () {}); }
    });
  }

  // =====================================================================
  function ready(fn) {
    var go = function () { C = window.LaMaisonContent; R = window.LaMaisonRender; fn(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
  window.LaMaisonEditor = {
    open: function () { ready(open); },
    resume: function () { ready(resume); }
  };
})();

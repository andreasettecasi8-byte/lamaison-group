/* LA MAISON GROUP — testi, foto e link modificabili dal sito (modalità modifica)
   Legge data/pagine/<pagina>.json e data/pagine/comune.json (menu, footer, logo, WhatsApp)
   e aggiorna gli elementi con data-edit="sezione.campo" (testi) e data-edit-img (foto).
   Le chiavi che iniziano con "@" stanno in comune.json.
   Nei testi: *parola* = evidenziata in oro, **parola** = grassetto, a capo = nuova riga. */
(function () {
  'use strict';

  var root = document.documentElement;
  var page = document.body.dataset.page;

  // ----- Lingua: italiano (predefinita) o inglese -----
  // ?lang=en nel link, poi la scelta memorizzata, poi la lingua del browser (i motori di ricerca vedono l'italiano)
  var LANG_KEY = 'lm-lingua';
  function remember(l) { try { localStorage.setItem(LANG_KEY, l); } catch (e) {} }
  function initialLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'it') { remember(q); return q; }
    try { var s = localStorage.getItem(LANG_KEY); if (s === 'en' || s === 'it') return s; } catch (e) {}
    if (/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent)) return 'it';
    var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || 'it');
    return /^it\b/i.test(nav) ? 'it' : 'en';
  }
  var lang = initialLang();
  root.lang = lang;

  function done() { root.classList.remove('content-loading'); }
  // Se i file non arrivano in tempo, mostra comunque i testi già presenti nella pagina
  var fallback = setTimeout(done, 1500);

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function format(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<span class="accent">$1</span>')
      .replace(/\r?\n/g, '<br>');
  }
  function get(data, path) {
    return path.split('.').reduce(function (obj, key) { return obj == null ? obj : obj[key]; }, data);
  }
  // "@menu.index" -> comune.json, "servizi.titolo_1" -> file della pagina
  function lookup(all, key) {
    return key.charAt(0) === '@' ? get(all.comune, key.slice(1)) : get(all.page, key);
  }
  // Il link segue il testo solo se il testo è davvero un numero o un'email
  // (un pulsante "Chiama" tiene il suo numero)
  function hrefFor(kind, text) {
    if (kind === 'tel') {
      var num = text.replace(/[^\d+]/g, '');
      return num.replace(/\D/g, '').length >= 6 ? 'tel:' + num : null;
    }
    return /^[^@\s]+@[^@\s]+\.\w+$/.test(text.trim()) ? 'mailto:' + text.trim() : null;
  }

  var current = { page: {}, comune: {} };
  var namesPromise = null;
  function provinceNames() {
    namesPromise = namesPromise || fetch('data/province.json')
      .then(function (r) { return r.json(); })
      .then(function (map) {
        var names = {};
        (map.province || []).forEach(function (p) { names[p.sigla] = p.nome; });
        return names;
      })
      .catch(function () { return {}; });
    return namesPromise;
  }
  function apply(all) {
    current = all;
    document.querySelectorAll('[data-edit]').forEach(function (el) {
      var value = lookup(all, el.dataset.edit);
      if (typeof value !== 'string') return;
      // un testo svuotato dall'area riservata sparisce dalla pagina (resta modificabile)
      el.toggleAttribute('data-empty', !value.trim());
      el.innerHTML = format(value.trim());
      var href = el.dataset.editHref && hrefFor(el.dataset.editHref, value);
      if (href) el.setAttribute('href', href);
    });
    document.querySelectorAll('[data-edit-img]').forEach(function (img) {
      var key = img.dataset.editImg;
      var src = lookup(all, key);
      var alt = lookup(all, key + '_alt');
      if (typeof src === 'string' && src && img.getAttribute('src') !== src) {
        img.removeAttribute('srcset'); // le versioni ridotte e verticali sono della foto originale
        if (img.parentNode && img.parentNode.tagName === 'PICTURE') img.parentNode.querySelectorAll('source').forEach(function (s) { s.remove(); });
        img.src = src;
      }
      if (typeof alt === 'string') img.alt = alt;
    });
    // Numeri WhatsApp (1 = principale, 2 = secondo contatto)
    document.querySelectorAll('a[data-wa]').forEach(function (a) {
      var num = String(get(all.comune, 'sito.whatsapp_' + a.dataset.wa) || '').replace(/\D/g, '');
      if (num) a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + num);
    });
    var sito = (all.comune && all.comune.sito) || {};
    // Numero svizzero: si nasconde da Impostazioni → "Mostra il numero svizzero"
    document.querySelectorAll('[data-optional="svizzero"]').forEach(function (el) {
      el.hidden = sito.mostra_svizzero === false;
    });
    // Statistiche Umami: i paragrafi di Privacy e Cookie cambiano se sono attive o no
    var stats = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(sito.umami_id || '').trim());
    document.querySelectorAll('[data-optional="statistiche"]').forEach(function (el) { el.hidden = !stats; });
    document.querySelectorAll('[data-optional="senza-statistiche"]').forEach(function (el) { el.hidden = stats; });
    // Facebook e Instagram: compaiono nel footer solo quando c'è il link
    document.querySelectorAll('[data-social]').forEach(function (ul) {
      var any = false;
      ul.querySelectorAll('[data-social-item]').forEach(function (li) {
        var url = String(sito[li.dataset.socialItem] || '').trim();
        var ok = /^https:\/\//.test(url);
        li.hidden = !ok;
        if (ok) { li.querySelector('a').href = url; any = true; }
      });
      ul.hidden = !any;
    });
    // Contatti: zona operativa = province evidenziate sulla mappa
    var zone = document.querySelectorAll('[data-zone-text]');
    if (zone.length) {
      var codes = Array.isArray(sito.province) ? sito.province : ['TO'];
      provinceNames().then(function (names) {
        var list = codes.map(function (c) { return names[c] || c; });
        var text = list.length === 1 ? 'provincia di ' + list[0]
          : 'province di ' + list.slice(0, -1).join(', ') + ' e ' + list[list.length - 1];
        zone.forEach(function (el) { el.textContent = text; });
      });
    }
    // Province evidenziate sulla mappa (Home)
    if (window.LaMaisonMap) window.LaMaisonMap.update();
    // Titolo e descrizione per Google
    var seo = all.page && all.page._seo;
    if (seo) {
      if (seo.titolo) document.title = seo.titolo;
      var meta = document.querySelector('meta[name="description"]');
      if (meta && seo.descrizione) meta.setAttribute('content', seo.descrizione);
    }
  }

  function load(path) {
    return window.LaMaisonDati.json(path).then(function (d) { return d || {}; });
  }

  // Testi inglesi: si sovrappongono a quelli italiani; ciò che manca resta in italiano.
  // Le impostazioni del sito (comune.json → sito) valgono per tutte e due le lingue.
  function merge(base, over) {
    if (!over || typeof over !== 'object') return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(over).forEach(function (k) {
      var b = base ? base[k] : undefined, o = over[k];
      if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object') out[k] = merge(b, o);
      else if (typeof o === 'string' ? o.trim() : o != null) out[k] = o;
    });
    return out;
  }
  function compose(it, en) {
    if (!en) return it;
    var enComune = Object.assign({}, en.comune || {});
    delete enComune.sito;
    return { page: merge(it.page || {}, en.page || {}), comune: merge(it.comune || {}, enComune) };
  }
  var source = { it: null, en: null };
  function loadLang(l) {
    if (source[l]) return Promise.resolve(source[l]);
    var dir = l === 'en' ? 'data/pagine/en/' : 'data/pagine/';
    return Promise.all([page ? load(dir + page + '.json') : {}, load(dir + 'comune.json')])
      .then(function (res) { source[l] = { page: res[0], comune: res[1] }; return source[l]; });
  }
  function build() { return compose(source.it, lang === 'en' ? source.en : null); }
  function setLang(l) {
    if (l !== 'it' && l !== 'en') return Promise.resolve();
    lang = l;
    remember(l);
    root.lang = l;
    return Promise.all([loadLang('it'), l === 'en' ? loadLang('en') : null]).then(function () {
      apply(build());
      document.dispatchEvent(new CustomEvent('lm:lang', { detail: { lang: l } }));
    });
  }

  var ready = Promise.all([loadLang('it'), lang === 'en' ? loadLang('en') : null])
    .then(function () { apply(build()); })
    .catch(function () {})
    .then(function () {
      clearTimeout(fallback);
      done();
    });

  // ----- Scheda azienda per Google (dati strutturati schema.org), solo in Home -----
  // Costruita dai dati del sito: se cambi telefono, email o province, si aggiorna da sola.
  function businessData() {
    var sito = (current.comune && current.comune.sito) || {};
    var footer = (current.comune && current.comune.footer) || {};
    var base = sito.dominio || new URL('.', location.href).href;
    var phones = [], founders = [], email = '', vat = '';
    Object.keys(footer).forEach(function (k) {
      var v = String(footer[k]).replace(/\*/g, '').trim();
      var swiss = /^\+?41/.test(v.replace(/\s/g, ''));
      if (/^telefono_/.test(k) && !(swiss && sito.mostra_svizzero === false)) phones.push(v);
      if (/^nome_/.test(k)) founders.push({ '@type': 'Person', name: v });
      if (/^email_/.test(k) && !email) email = v;
      var m = v.match(/P\.?\s*IVA\s*(\d{11})/i);
      if (m) vat = 'IT' + m[1];
    });
    return provinceNames()
      .then(function (names) {
        var social = ['facebook', 'instagram'].map(function (k) { return String(sito[k] || '').trim(); })
          .filter(function (u) { return /^https:\/\//.test(u); });
        var data = {
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'LA MAISON GROUP',
          legalName: 'La Maison Group S.r.l.s.',
          url: base,
          logo: /^https?:\/\//.test(sito.logo || '') ? sito.logo : base + (sito.logo || 'img/logo.png'),
          image: base + 'img/hero.webp',
          description: (current.page._seo && current.page._seo.descrizione) || '',
          email: email || undefined,
          telephone: phones[0] || undefined,
          vatID: vat || undefined,
          founder: founders.length ? founders : undefined,
          areaServed: (Array.isArray(sito.province) ? sito.province : ['TO']).map(function (c) {
            return { '@type': 'AdministrativeArea', name: 'Provincia di ' + (names[c] || c) };
          }),
          contactPoint: phones.map(function (t) { return { '@type': 'ContactPoint', telephone: t.replace(/\s+/g, ''), contactType: 'customer service', availableLanguage: ['Italian', 'English'] }; })
        };
        if (sito.sede_legale) data.address = sito.sede_legale;
        if (social.length) data.sameAs = social;
        var tag = document.getElementById('ld-azienda') || document.head.appendChild(Object.assign(document.createElement('script'), { id: 'ld-azienda', type: 'application/ld+json' }));
        tag.textContent = JSON.stringify(data);
      });
  }
  if (page === 'index') ready.then(function () { setTimeout(businessData, 0); });

  // Usato dall'area riservata (js/editor.js)
  window.LaMaisonContent = { apply: apply, format: format, get: get, lookup: lookup, hrefFor: hrefFor, ready: ready,
    data: function () { return current; }, compose: compose,
    lang: function () { return lang; }, setLang: setLang, remember: remember };
})();

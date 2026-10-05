/* LA MAISON GROUP — statistiche anonime delle visite con Umami (senza cookie)
   Si accende solo quando in Area riservata → Impostazioni → Statistiche c'è l'ID del sito Umami,
   e solo sul sito pubblicato (sul Mac e in rete di casa non conta nulla).
   Le visite di chi è entrato nell'area riservata non vengono contate. */
(function () {
  'use strict';

  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function track(name, data) {
    try { if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data); } catch (e) {}
  }
  window.LaMaisonStats = { track: track };

  function isLocal() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' || /^(192\.168|10)\./.test(h) || /\.local$/.test(h);
  }
  function isAdmin() {
    try { return !!sessionStorage.getItem('lm-admin-session'); } catch (e) { return false; }
  }

  var C = window.LaMaisonContent;
  if (C && C.ready) {
    C.ready.then(function () {
      var sito = (C.data().comune || {}).sito || {};
      var id = String(sito.umami_id || '').trim();
      var src = String(sito.umami_script || 'https://cloud.umami.is/script.js').trim();
      if (!UUID.test(id) || !/^https:\/\//.test(src) || isLocal() || isAdmin()) return;
      var s = document.createElement('script');
      s.defer = true;
      s.src = src;
      s.setAttribute('data-website-id', id);
      var dom = String(sito.dominio || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (dom) s.setAttribute('data-domains', dom + ',' + dom.replace(/^www\./, ''));
      document.head.appendChild(s);
    });
  }

  // ----- Clic sui pulsanti che contano -----
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button');
    if (!el || el.closest('.lm-ui')) return;
    var href = el.getAttribute('href') || '';
    var page = document.body.dataset.page || '';
    if (/^tel:/.test(href)) track('Chiamata', { numero: href.slice(4), pagina: page });
    else if (/wa\.me\//.test(href)) track('WhatsApp', { pagina: page });
    else if (/^mailto:/.test(href)) track('Email', { pagina: page });
    else if (/contatti\.html\?tipo=affidare/.test(href)) track('Affida il tuo immobile', { pagina: page });
    else if (/valutazione\.html/.test(href)) track('Richiedi valutazione', { pagina: page });
    else if (el.dataset.choose) track('Alloggio scelto', { alloggio: el.dataset.choose });
    else if (/immobile\.html\?/.test(href)) track('Scheda immobile aperta', { pagina: page });
  }, true);
})();

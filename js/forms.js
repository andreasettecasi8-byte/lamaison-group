/* LA MAISON GROUP — invio dei moduli tramite Formspree
   ============================================================
   INSERISCI QUI L'INDIRIZZO FORMSPREE (es. https://formspree.io/f/abcdwxyz).
   Lo stesso indirizzo vale per entrambi i moduli: l'oggetto dell'email
   dice se è una richiesta di contatto o una recensione.
   Per usare due moduli Formspree separati, scrivi l'indirizzo anche
   nell'attributo data-endpoint del singolo <form>.
   ============================================================ */
var FORMSPREE_ENDPOINT = 'https://formspree.io/f/mppwrybn';

(function () {
  'use strict';

  var TYPES = {
    affidare: 'Affidare un immobile',
    affitto: 'Affitto',
    acquisto: 'Acquisto',
    consulenza: 'Consulenza',
    altro: 'Altro'
  };
  var PLANS = {
    'gestione-completa': 'Gestione Completa',
    'gestione-online': 'Gestione Online',
    'shooting-fotografico': 'shooting fotografico professionale'
  };

  function T(text) { return window.LaMaisonLingua ? window.LaMaisonLingua.t(text) : text; }

  function endpointFor(form) {
    return form.dataset.endpoint || FORMSPREE_ENDPOINT;
  }
  function isConfigured(url) {
    return /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(url) && url.indexOf('INSERISCI') === -1;
  }

  // ----- Precompila il modulo contatti dai link del sito -----
  function prefillContact(form) {
    var params = new URLSearchParams(location.search);
    var type = TYPES[params.get('tipo')];
    var plan = PLANS[params.get('formula')];
    var propertyId = params.get('immobile');
    var select = form.querySelector('[name="tipo_richiesta"]');
    var message = form.querySelector('[name="messaggio"]');

    if (type && select) select.value = type;
    if (plan && message && !message.value) {
      message.value = T('Vorrei ricevere un preventivo per la ' + plan + ' del mio immobile.');
    }
    var category = ['vendita', 'affitti-brevi', 'affitti-lungo'].indexOf(params.get('c')) !== -1 ? params.get('c') : 'vendita';
    if (propertyId && message && !message.value) {
      fetch('data/' + category + '.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var list = Array.isArray(data) ? data : (data && data.immobili) || [];
          var p = list.find(function (x) { return x.id === propertyId; });
          if (p && !message.value) {
            message.value = T((category === 'affitti-brevi' ? 'Vorrei sapere la disponibilità dell\'immobile "' : 'Vorrei ricevere informazioni sull\'immobile "') + p.titolo + '"' +
              (p.zona ? ' (' + p.zona + (p.citta ? ', ' + p.citta : '') + ')' : '') + '.');
          }
        })
        .catch(function () {});
    }
  }

  // ----- Invio -----
  function setup(form) {
    var card = form.closest('.form-card');
    var alert = form.querySelector('.form-alert');
    var button = form.querySelector('button[type="submit"]');
    var success = card.querySelector('.form-success');
    var buttonText = button.textContent;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      alert.textContent = '';
      alert.className = 'form-alert full';

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var endpoint = endpointFor(form);
      if (!isConfigured(endpoint)) {
        alert.classList.add('form-alert--error');
        alert.textContent = 'Il modulo non è ancora collegato. Nel frattempo contattaci per telefono, WhatsApp o email.';
        console.warn('Formspree: inserisci l\'indirizzo in js/forms.js (FORMSPREE_ENDPOINT).');
        return;
      }

      // Cliente dalla versione inglese: lo si vede nell'oggetto e in un campo dell'email
      var english = window.LaMaisonContent && window.LaMaisonContent.lang() === 'en';
      var langField = form.querySelector('[name="lingua"]');
      if (!langField) { langField = document.createElement('input'); langField.type = 'hidden'; langField.name = 'lingua'; form.appendChild(langField); }
      langField.value = english ? 'Inglese (il cliente ha usato la versione inglese del sito)' : 'Italiano';

      // Oggetto dell'email ricevuta
      var subject = form.querySelector('[name="_subject"]');
      var type = form.querySelector('[name="tipo_richiesta"]');
      if (subject && type) subject.value = 'Richiesta dal sito: ' + type.value;
      var comune = form.querySelector('[name="comune"]');
      var tipologia = form.querySelector('[name="tipologia"]');
      if (subject && comune && tipologia) subject.value = 'Richiesta di valutazione: ' + tipologia.value + ' a ' + comune.value.trim();

      if (subject) {
        subject.value = subject.value.replace(/ \[EN\]$/, '') + (english ? ' [EN]' : '');
      }

      button.disabled = true;
      button.textContent = 'Invio in corso…';

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) {
              var msg = data.errors && data.errors.length
                ? data.errors.map(function (e) { return e.message; }).join(' ')
                : 'Invio non riuscito.';
              throw new Error(msg);
            }
          });
        })
        .then(function () {
          if (window.LaMaisonStats) window.LaMaisonStats.track('Modulo inviato', { modulo: form.dataset.formspree || '' });
          form.reset();
          form.hidden = true;
          success.hidden = false;
          success.focus();
        })
        .catch(function (err) {
          alert.classList.add('form-alert--error');
          alert.textContent = err.message + ' Riprova tra poco oppure contattaci per telefono o WhatsApp.';
        })
        .then(function () {
          button.disabled = false;
          button.textContent = buttonText;
        });
    });

    // "Invia un altro messaggio"
    var again = success.querySelector('[data-form-again]');
    if (again) {
      again.addEventListener('click', function () {
        success.hidden = true;
        form.hidden = false;
        form.querySelector('input, select, textarea').focus();
      });
    }
  }

  document.querySelectorAll('form[data-formspree]').forEach(function (form) {
    if (form.dataset.formspree === 'contatti') prefillContact(form);
    setup(form);
  });

  // Per i moduli creati dopo il caricamento (es. richiesta preventivo con calendario)
  window.LaMaisonForms = { setup: setup };
})();

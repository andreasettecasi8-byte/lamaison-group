/* LA MAISON GROUP — richiesta di preventivo per un soggiorno (affitti brevi)
   Calendario per scegliere arrivo e partenza, senza prezzi: la richiesta arriva
   per email tramite Formspree (js/forms.js) e il preventivo si manda a mano.
   Pagina Affitti brevi: prima si sceglie l'alloggio (pulsanti data-choose sulle schede),
   poi si aprono calendario e modulo.
   Uso: <div data-booking></div> (con elenco immobili) oppure
        LaMaisonBooking.mount(elemento, { immobile: {...} }) nella scheda immobile. */
(function () {
  'use strict';

  var MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var DAYS = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  var DAYS_LONG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var uid = 0;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function day(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nice(d) { return DAYS_LONG[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); }
  function full(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function nights(a, b) { return Math.round((b - a) / 86400000); }

  function mount(host, opts) {
    opts = opts || {};
    var n = ++uid;
    var fixed = opts.immobile || null;          // scheda: immobile già scelto
    var choices = opts.immobili || [];          // pagina affitti brevi: elenco da cui scegliere
    var chosen = null;                          // alloggio scelto dall'ospite
    var today = day(new Date());
    var state = { view: new Date(today.getFullYear(), today.getMonth(), 1), start: null, end: null };
    function current() { return fixed || chosen; }
    function minNights() {
      var p = current();
      return Math.max(1, Number(p && p.minimo_notti) || 1);
    }
    function maxGuests() {
      var p = current();
      return Math.min(20, Number(p && p.ospiti) || 10);
    }

    host.innerHTML =
      (choices.length
        ? '<div class="booking__pick" data-b-pick>' +
            '<p><strong>Prima scegli l\'alloggio</strong> tra quelli qui sopra: poi potrai indicare le date del soggiorno.</p>' +
            '<a class="btn btn--secondary" href="#alloggi">Vedi gli alloggi</a>' +
          '</div>'
        : '') +
      '<div class="form-card booking"' + (choices.length ? ' hidden' : '') + '>' +
        '<form class="form" data-formspree="prenotazione" novalidate>' +
          '<input type="hidden" name="_subject" value="Richiesta preventivo affitto breve">' +
          '<input type="hidden" name="modulo" value="Preventivo affitto breve">' +
          '<input type="hidden" name="immobile" value="' + esc(fixed ? fixed.titolo : '') + '">' +
          '<input type="hidden" name="arrivo">' +
          '<input type="hidden" name="partenza">' +
          '<input type="hidden" name="notti">' +
          '<div class="hp" aria-hidden="true"><label>Non compilare<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label></div>' +
          (choices.length ? '<div class="booking__chosen full" data-b-chosen></div>' : '') +
          '<fieldset class="field full booking__dates"><legend>Date del soggiorno *</legend>' +
            '<div class="cal" data-b-cal></div>' +
            '<div class="booking__summary" aria-live="polite" data-b-summary></div>' +
          '</fieldset>' +
          '<div class="field"><label for="b-osp-' + n + '">Ospiti *</label><select id="b-osp-' + n + '" name="ospiti" required data-b-guests></select></div>' +
          '<div class="field"><label for="b-nome-' + n + '">Nome e cognome *</label><input id="b-nome-' + n + '" name="nome" type="text" autocomplete="name" required maxlength="100"></div>' +
          '<div class="field"><label for="b-mail-' + n + '">Email *</label><input id="b-mail-' + n + '" name="email" type="email" autocomplete="email" required maxlength="150"></div>' +
          '<div class="field"><label for="b-tel-' + n + '">Telefono <span class="optional">(facoltativo)</span></label><input id="b-tel-' + n + '" name="telefono" type="tel" autocomplete="tel" maxlength="40"></div>' +
          '<div class="field full"><label for="b-msg-' + n + '">Messaggio <span class="optional">(facoltativo)</span></label><textarea id="b-msg-' + n + '" name="messaggio" maxlength="3000" placeholder="Motivo del viaggio, orario di arrivo, richieste particolari…"></textarea></div>' +
          '<label class="consent full"><input type="checkbox" name="presa_visione_privacy" value="Sì" required>' +
            '<span>Ho letto l\'informativa sul trattamento dei dati personali (<a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>). *</span></label>' +
          '<p class="form-alert full" role="alert"></p>' +
          '<button class="btn btn--primary" type="submit">Richiedi un preventivo</button>' +
        '</form>' +
        '<div class="form-success" tabindex="-1" role="status" hidden>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-7"/></svg>' +
          '<h3>Richiesta inviata!</h3>' +
          '<p>Grazie: verifichiamo la disponibilità e ti mandiamo il preventivo per email al più presto.</p>' +
          '<button class="btn btn--secondary" type="button" data-form-again>Nuova richiesta</button>' +
        '</div>' +
      '</div>';

    var form = host.querySelector('form');
    var cal = host.querySelector('[data-b-cal]');
    var summary = host.querySelector('[data-b-summary]');
    var card = host.querySelector('.booking');
    var pick = host.querySelector('[data-b-pick]');
    var chosenBox = host.querySelector('[data-b-chosen]');
    var guests = host.querySelector('[data-b-guests]');
    var alertBox = host.querySelector('.form-alert');
    var twoMonths = window.matchMedia('(min-width: 768px)');

    function fillGuests() {
      var cur = Number(guests.value) || 2;
      var max = maxGuests();
      guests.innerHTML = '';
      for (var i = 1; i <= max; i++) guests.appendChild(new Option(i + (i === 1 ? ' ospite' : ' ospiti'), i));
      guests.value = String(Math.min(cur, max));
    }

    function month(first) {
      var y = first.getFullYear(), m = first.getMonth();
      var offset = (first.getDay() + 6) % 7; // lunedì = 0
      var count = new Date(y, m + 1, 0).getDate();
      var cells = '';
      for (var i = 0; i < offset; i++) cells += '<span class="cal__pad" aria-hidden="true"></span>';
      for (var d = 1; d <= count; d++) {
        var date = new Date(y, m, d);
        var cls = ['cal__day'];
        var past = date < today;
        if (+date === +today) cls.push('is-today');
        if (state.start && +date === +state.start) cls.push('is-start');
        if (state.end && +date === +state.end) cls.push('is-end');
        if (state.start && state.end && date > state.start && date < state.end) cls.push('is-range');
        var selected = cls.indexOf('is-start') !== -1 || cls.indexOf('is-end') !== -1;
        cells += '<button type="button" class="' + cls.join(' ') + '" data-day="' + iso(date) + '"' +
          (past ? ' disabled' : '') + (selected ? ' aria-pressed="true"' : '') +
          ' aria-label="' + DAYS_LONG[date.getDay()] + ' ' + full(date) + '">' + d + '</button>';
      }
      return '<div class="cal__month"><p class="cal__title">' + MONTHS[m] + ' ' + y + '</p>' +
        '<div class="cal__grid">' + DAYS.map(function (w) { return '<span class="cal__dow" aria-hidden="true">' + w + '</span>'; }).join('') + cells + '</div></div>';
    }

    function render() {
      var first = state.view;
      var canPrev = first > new Date(today.getFullYear(), today.getMonth(), 1);
      var months = twoMonths.matches ? [first, new Date(first.getFullYear(), first.getMonth() + 1, 1)] : [first];
      cal.innerHTML =
        '<div class="cal__nav">' +
          '<button type="button" class="cal__arrow" data-nav="-1" aria-label="Mese precedente"' + (canPrev ? '' : ' disabled') + '>&#8249;</button>' +
          '<button type="button" class="cal__arrow" data-nav="1" aria-label="Mese successivo">&#8250;</button>' +
        '</div>' +
        '<div class="cal__months">' + months.map(month).join('') + '</div>';
      var f = form.elements;
      if (state.start && state.end) {
        var nn = nights(state.start, state.end);
        summary.innerHTML = '<span><strong>Arrivo</strong> ' + nice(state.start) + '</span>' +
          '<span><strong>Partenza</strong> ' + nice(state.end) + '</span>' +
          '<span class="booking__nights">' + nn + (nn === 1 ? ' notte' : ' notti') + '</span>' +
          '<button type="button" class="booking__reset" data-reset>Cambia date</button>';
        f.arrivo.value = full(state.start);
        f.partenza.value = full(state.end);
        f.notti.value = nn;
      } else {
        summary.innerHTML = state.start
          ? '<span><strong>Arrivo</strong> ' + nice(state.start) + '</span><span class="booking__hint">Ora scegli la data di partenza</span>'
          : '<span class="booking__hint">Scegli sul calendario la data di arrivo</span>';
        f.arrivo.value = state.start ? full(state.start) : '';
        f.partenza.value = f.notti.value = '';
      }
      var who = current() ? current().titolo : '';
      f.immobile.value = who;
      f._subject.value = 'Richiesta preventivo affitto breve' + (who ? ': ' + who : '') +
        (state.start && state.end ? ' (' + iso(state.start) + ' → ' + iso(state.end) + ')' : '');
    }

    cal.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.nav) {
        state.view = new Date(state.view.getFullYear(), state.view.getMonth() + Number(b.dataset.nav), 1);
        render();
        cal.querySelector('[data-nav="' + b.dataset.nav + '"]').focus();
        return;
      }
      var parts = b.dataset.day.split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      alertBox.textContent = '';
      if (!state.start || state.end || d <= state.start) {
        state.start = d; state.end = null;
      } else {
        var min = minNights();
        if (nights(state.start, d) < min) {
          alertBox.className = 'form-alert full form-alert--error';
          alertBox.textContent = 'Il soggiorno minimo per questo immobile è di ' + min + (min === 1 ? ' notte.' : ' notti.');
          d = addDays(state.start, min);
        }
        state.end = d;
      }
      render();
      var again = cal.querySelector('[data-day="' + iso(d) + '"]');
      if (again) again.focus();
    });
    summary.addEventListener('click', function (e) {
      if (e.target.closest('[data-reset]')) { state.start = state.end = null; render(); }
    });
    // Scelta dell'alloggio (pagina Affitti brevi)
    function choose(id, scroll) {
      var p = choices.filter(function (x) { return String(x.id) === String(id); })[0];
      if (!p) return;
      chosen = p;
      if (state.start && state.end && nights(state.start, state.end) < minNights()) state.end = null;
      var cover = (p.foto || [])[0];
      var where = [p.zona, p.citta].filter(Boolean).join(', ');
      chosenBox.innerHTML =
        (cover ? '<img src="' + esc(cover) + '" alt="" width="96" height="72">' : '') +
        '<div><span class="booking__chosen-label">Alloggio scelto</span>' +
          '<strong>' + esc(window.LaMaisonRender ? window.LaMaisonRender.L(p, 'titolo') : p.titolo) + '</strong>' + (where ? '<span>' + esc(where) + '</span>' : '') + '</div>' +
        '<a class="booking__reset" href="#alloggi">Cambia</a>';
      if (pick) pick.hidden = true;
      card.hidden = false;
      alertBox.textContent = '';
      fillGuests();
      render();
      markCards();
      if (scroll) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function markCards() {
      document.querySelectorAll('button[data-choose]').forEach(function (b) {
        var on = chosen && b.dataset.choose === String(chosen.id);
        var art = b.closest('article');
        if (art) art.classList.toggle('is-chosen', !!on);
        b.textContent = on ? 'Alloggio scelto ✓' : 'Scegli questo alloggio';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    if (choices.length) {
      document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('button[data-choose]');
        if (b && !document.documentElement.classList.contains('lm-editing')) choose(b.dataset.choose, true);
      });
      document.addEventListener('lm:drawn', markCards); // le schede sono state ridisegnate
      var wanted = new URLSearchParams(location.search).get('alloggio');
      if (wanted) choose(wanted, false);
    }
    twoMonths.addEventListener('change', render);
    form.addEventListener('reset', function () { setTimeout(function () { state.start = state.end = null; fillGuests(); render(); }); });

    // Prima dell'invio: le date sono obbligatorie (questo controllo viene prima di js/forms.js)
    form.addEventListener('submit', function (e) {
      if (choices.length && !chosen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        card.hidden = true;
        if (pick) { pick.hidden = false; pick.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        return;
      }
      if (state.start && state.end) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      alertBox.className = 'form-alert full form-alert--error';
      alertBox.textContent = state.start ? 'Scegli anche la data di partenza.' : 'Scegli le date del soggiorno sul calendario.';
      cal.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    fillGuests();
    render();
    if (window.LaMaisonForms) window.LaMaisonForms.setup(form);
  }

  window.LaMaisonBooking = { mount: mount };

  // Pagina Affitti brevi: modulo con l'elenco degli immobili pubblicati
  document.querySelectorAll('[data-booking]').forEach(function (host) {
    window.LaMaisonDati.json('data/affitti-brevi.json')
      .then(function (d) { return d || {}; })
      .then(function (d) {
        var list = ((d && d.immobili) || []).filter(function (p) { return p && p.pubblicata !== false; });
        mount(host, { immobili: list });
      });
  });
})();

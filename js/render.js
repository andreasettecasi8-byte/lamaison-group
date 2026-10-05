/* LA MAISON GROUP — crea le schede leggendo i file in data/
   Ogni contenitore con data-render="vendita|affitti-brevi|affitti-lungo|progetti|recensioni"
   viene riempito da solo. data-limit="3" mostra solo i primi 3 elementi.
   Una sezione con data-hide-empty sparisce se non ci sono elementi da mostrare. */
(function () {
  'use strict';

  var ICON = {
    area: '<path d="M4 4h16v16H4z"/><path d="M4 9h5V4M20 15h-5v5"/>',
    rooms: '<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
    bath: '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V5a2 2 0 0 1 4 0M7 20l-1 2M17 20l1 2"/>',
    guests: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5 5.5"/>',
    bed: '<path d="M3 18V6M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-8v5"/><circle cx="6.5" cy="10.5" r="1.5"/>'
  };
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>';
  var MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  var EMPTY = {
    vendita: 'Nuovi immobili in arrivo. Contattaci per ricevere le prossime opportunità.',
    'affitti-brevi': 'Nuovi immobili in arrivo.',
    'affitti-lungo': 'Nuovi immobili in affitto in arrivo. Contattaci per ricevere le prossime disponibilità.',
    progetti: 'I primi progetti saranno pubblicati a breve.',
    recensioni: 'Le prime recensioni dei nostri clienti arriveranno presto.'
  };

  // ----- utilità -----
  // testo nella lingua scelta: titolo_en / descrizione_en se ci sono, altrimenti l'italiano
  function L(item, field) {
    var en = window.LaMaisonContent && window.LaMaisonContent.lang() === 'en';
    return (en && item && item[field + '_en']) || (item ? item[field] : '');
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';
  }
  function price(value) {
    if (typeof value !== 'number') return esc(value);
    return '€ ' + value.toLocaleString('it-IT', { useGrouping: 'always' });
  }
  function date(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0] : esc(iso);
  }
  function img(src, alt) {
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="800" height="600" loading="lazy">';
  }
  function exampleBadge(item) {
    return item.esempio ? '<span class="badge badge--example">Esempio</span>' : '';
  }

  // I file in data/ contengono { "immobili": [...] }, { "progetti": [...] }, { "recensioni": [...] }.
  // Le recensioni con "pubblicata": false restano nell'area riservata ma non compaiono sul sito.
  var LIST_KEY = { vendita: 'immobili', 'affitti-brevi': 'immobili', 'affitti-lungo': 'immobili', progetti: 'progetti', recensioni: 'recensioni' };

  // Le tre categorie di immobili: file, prezzo mostrato e caratteristiche principali
  var CATEGORIES = {
    vendita: { label: 'In vendita', request: 'acquisto',
      price: function (p) { return p.prezzo != null ? price(p.prezzo) : ''; } },
    'affitti-lungo': { label: 'Affitto a lungo termine', request: 'affitto',
      price: function (p) { return p.canone != null ? price(p.canone) + ' <small>/ mese</small>' : ''; } },
    // affitti brevi: niente prezzo, si chiede un preventivo scegliendo le date
    'affitti-brevi': { label: 'Affitto breve', request: 'affitto',
      price: function () { return ''; } }
  };
  function specsOf(cat, p) {
    var plural = function (n, one, many) { return esc(n) + ' ' + (n == 1 ? one : many); };
    var items = cat === 'affitti-brevi'
      ? [p.ospiti && ['guests', plural(p.ospiti, 'ospite', 'ospiti')], p.camere && ['bed', plural(p.camere, 'camera', 'camere')], p.bagni && ['bath', plural(p.bagni, 'bagno', 'bagni')]]
      : [p.mq && ['area', esc(p.mq) + ' m²'], p.locali && ['rooms', plural(p.locali, 'locale', 'locali')], p.bagni && ['bath', plural(p.bagni, 'bagno', 'bagni')]];
    return items.filter(Boolean).map(function (i) { return '<li>' + icon(i[0]) + i[1] + '</li>'; }).join('');
  }
  function schedaUrl(cat, p) {
    return 'immobile.html?c=' + encodeURIComponent(cat) + '&amp;id=' + encodeURIComponent(p.id || '');
  }
  function all(data, name) {
    return Array.isArray(data) ? data : (data && data[LIST_KEY[name]]) || [];
  }
  function list(data, name) {
    return all(data, name).filter(function (item) { return item && item.pubblicata !== false; });
  }

  // ----- schede -----
  // choose: pagina Affitti brevi, la scheda serve a scegliere l'alloggio prima delle date
  function propertyCard(cat, p, choose) {
    var cover = (p.foto || [])[0];
    var where = [p.zona, p.citta].filter(Boolean).join(', ');
    var specs = specsOf(cat, p);
    var cost = CATEGORIES[cat].price(p);
    return '<article class="card reveal">' +
      '<div class="card__media">' + (cover ? img(cover, L(p, 'titolo') + (where ? ' – ' + where : '')) : '') +
        (p.etichetta ? '<span class="badge">' + esc(p.etichetta) + '</span>' : '') + exampleBadge(p) + '</div>' +
      '<div class="card__body">' +
        '<p class="card__meta">' + esc(where) + (p.tipologia ? ' · ' + esc(p.tipologia) : '') + '</p>' +
        '<h3><a' + (choose ? '' : ' class="card__stretched"') + ' href="' + schedaUrl(cat, p) + '">' + esc(L(p, 'titolo')) + '</a></h3>' +
        (cost ? '<p class="price">' + cost + '</p>' : '') +
        (specs ? '<ul class="specs" aria-label="Caratteristiche">' + specs + '</ul>' : '') +
        (choose
          ? '<div class="card__actions">' +
              '<button type="button" class="btn btn--primary" data-choose="' + esc(p.id || '') + '">Scegli questo alloggio</button>' +
              '<a class="card__link" href="' + schedaUrl(cat, p) + '">Dettagli</a>' +
            '</div>'
          : '<span class="btn btn--secondary card__cta">Vedi la scheda</span>') +
      '</div></article>';
  }

  var templates = {
    vendita: function (p) { return propertyCard('vendita', p); },
    'affitti-lungo': function (p) { return propertyCard('affitti-lungo', p); },
    'affitti-brevi': function (p, choose) { return propertyCard('affitti-brevi', p, choose); },

    progetti: function (p) {
      var media = p.foto_prima && p.foto_dopo
        ? '<div class="before-after">' +
            '<img src="' + esc(p.foto_dopo) + '" alt="' + esc(L(p, 'titolo')) + ': dopo la ristrutturazione" width="800" height="600" loading="lazy">' +
            '<img class="ba-before" src="' + esc(p.foto_prima) + '" alt="' + esc(L(p, 'titolo')) + ': prima della ristrutturazione" width="800" height="600" loading="lazy">' +
            '<span class="ba-divider"></span><span class="ba-tag ba-tag--before">Prima</span><span class="ba-tag ba-tag--after">Dopo</span>' +
            '<input type="range" min="0" max="100" value="50" aria-label="Confronta prima e dopo: ' + esc(L(p, 'titolo')) + '">' +
          '</div>'
        : (p.foto ? img(p.foto, L(p, 'titolo') + (p.zona ? ' – ' + p.zona : '')) : '');
      return '<article class="card reveal">' +
        '<div class="card__media">' + media + (p.stato ? '<span class="badge">' + esc(p.stato) + '</span>' : '') + exampleBadge(p) + '</div>' +
        '<div class="card__body">' +
          (p.zona ? '<p class="card__meta">' + esc(p.zona) + '</p>' : '') +
          '<h3>' + esc(L(p, 'titolo')) + '</h3>' +
          (L(p, 'descrizione') ? '<p>' + esc(L(p, 'descrizione')) + '</p>' : '') +
        '</div></article>';
    },

    recensioni: function (r) {
      var n = Math.max(0, Math.min(5, Number(r.stelle) || 0));
      var stars = '';
      for (var i = 1; i <= 5; i++) stars += '<span class="' + (i <= n ? '' : 'is-off') + '">' + STAR + '</span>';
      return '<article class="card review reveal">' +
        '<span class="stars" role="img" aria-label="' + n + ' stelle su 5">' + stars + '</span>' +
        '<blockquote>“' + esc(r.testo) + '”</blockquote>' +
        '<p class="review__author"><strong>' + esc(r.nome) + '</strong>' + esc(r.tipo) + (r.data ? ' · ' + date(r.data) : '') + '</p>' +
        '</article>';
    }
  };

  // ----- caricamento -----
  // Disegna le schede di un contenitore. showHidden (modalità modifica) mostra anche
  // le recensioni non pubblicate; ogni scheda ricorda la sua posizione nel file (data-index).
  function draw(box, data, showHidden) {
    var name = box.dataset.render;
    var limit = parseInt(box.dataset.limit, 10) || Infinity;
    var items = all(data, name)
      .map(function (item, index) { return { item: item, index: index }; })
      .filter(function (e) { return e.item && (showHidden || e.item.pubblicata !== false); })
      .slice(0, limit);
    box.innerHTML = items.length
      ? items.map(function (e) {
          return templates[name](e.item, box.hasAttribute('data-scelta')).replace('<article class="', '<article data-index="' + e.index + '" class="' +
            (e.item.pubblicata === false ? 'is-unpublished ' : ''));
        }).join('')
      : '<p class="empty">' + EMPTY[name] + '</p>';
    var section = box.closest('[data-hide-empty]');
    if (section) section.hidden = !items.length && !showHidden;
    box.querySelectorAll('.before-after input').forEach(function (range) {
      range.addEventListener('input', function () {
        range.parentNode.style.setProperty('--pos', range.value + '%');
      });
    });
    if (window.LaMaison) window.LaMaison.observe(box);
    box.dispatchEvent(new CustomEvent('lm:drawn', { bubbles: true }));
  }

  function fill(box) {
    fetch('data/' + box.dataset.render + '.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (data) {
        if (!box.dataset.editing) draw(box, data, false);
      })
      .catch(function () {
        if (box.dataset.editing) return;
        box.innerHTML = '<p class="empty">' + EMPTY[box.dataset.render] + '</p>';
        var section = box.closest('[data-hide-empty]');
        if (section) section.hidden = true;
      });
  }

  document.querySelectorAll('[data-render]').forEach(function (box) {
    if (templates[box.dataset.render]) fill(box);
  });
  // cambio lingua: si ridisegnano le schede (titoli e descrizioni in inglese, se inseriti)
  document.addEventListener('lm:lang', function () {
    document.querySelectorAll('[data-render]').forEach(function (box) {
      if (templates[box.dataset.render] && !box.dataset.editing) fill(box);
    });
  });

  window.LaMaisonRender = {
    draw: draw, all: all, list: list, LIST_KEY: LIST_KEY, EMPTY: EMPTY, CATEGORIES: CATEGORIES,
    specsOf: specsOf, L: L, esc: esc, icon: icon, price: price, date: date
  };

  // ----- Media delle stelle (pagina Recensioni) -----
  document.querySelectorAll('[data-rating]').forEach(function (box) {
    fetch('data/recensioni.json', { cache: 'no-cache' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var items = list(data, 'recensioni');
        if (!items.length) return;
        var avg = items.reduce(function (sum, r) { return sum + (Number(r.stelle) || 0); }, 0) / items.length;
        var rounded = Math.round(avg), stars = '';
        for (var i = 1; i <= 5; i++) stars += '<span class="' + (i <= rounded ? '' : 'is-off') + '">' + STAR + '</span>';
        box.innerHTML = '<span class="score">' + avg.toFixed(1).replace('.', ',') + '<span class="visually-hidden"> su 5</span></span>' +
          '<div><span class="stars" aria-hidden="true">' + stars + '</span>' +
          '<p>Media su ' + items.length + (items.length === 1 ? ' recensione' : ' recensioni') + '</p></div>';
        box.hidden = false;
      })
      .catch(function () {});
  });
})();

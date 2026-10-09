/* LA MAISON GROUP — scheda del singolo immobile (immobile.html?c=categoria&id=codice)
   Categorie: vendita, affitti-lungo, affitti-brevi (file in data/<categoria>.json).
   Usata anche dall'area riservata per aggiornare la scheda dopo una modifica. */
(function () {
  'use strict';

  var R = window.LaMaisonRender;
  var root = document.querySelector('[data-scheda]');
  if (!root || !R) return;

  var params = new URLSearchParams(location.search);
  var cat = R.CATEGORIES[params.get('c')] ? params.get('c') : 'vendita';
  var id = params.get('id');
  var esc = R.esc;
  var BACK = { vendita: ['vendita.html', 'Tutti gli immobili in vendita'],
    'affitti-lungo': ['affitti-tradizionali.html', 'Affitti a lungo termine'],
    'affitti-brevi': ['affitti-brevi.html', 'Affitti brevi'] };

  function eur(n) { return n == null || n === '' ? '' : R.price(Number(n)); }
  function dateIt(iso) { return iso ? R.date(iso) : ''; }

  // Dettagli mostrati per ogni categoria: [etichetta, valore] (il prezzo è già in evidenza sopra)
  function facts(p) {
    var rows = {
      vendita: [
        ['Tipologia', esc(p.tipologia)], ['Superficie', p.mq ? esc(p.mq) + ' m²' : ''],
        ['Locali', esc(p.locali)], ['Camere', esc(p.camere)], ['Bagni', esc(p.bagni)], ['Piano', esc(p.piano)],
        ['Stato', esc(p.stato)], ['Classe energetica', esc(p.classe_energetica)], ['Spese condominiali', p.spese ? eur(p.spese) + ' / mese' : '']
      ],
      'affitti-lungo': [
        ['Spese condominiali', p.spese ? eur(p.spese) + ' / mese' : ''],
        ['Tipologia', esc(p.tipologia)], ['Contratto', esc(p.contratto)], ['Arredamento', esc(p.arredamento)],
        ['Disponibile dal', dateIt(p.disponibile_dal)], ['Superficie', p.mq ? esc(p.mq) + ' m²' : ''], ['Locali', esc(p.locali)],
        ['Camere', esc(p.camere)], ['Bagni', esc(p.bagni)], ['Piano', esc(p.piano)], ['Classe energetica', esc(p.classe_energetica)]
      ],
      'affitti-brevi': [
        ['Tipologia', esc(p.tipologia)],
        ['Ospiti', esc(p.ospiti)], ['Camere', esc(p.camere)], ['Letti', esc(p.letti)], ['Bagni', esc(p.bagni)],
        ['Superficie', p.mq ? esc(p.mq) + ' m²' : ''], ['Soggiorno minimo', p.minimo_notti ? esc(p.minimo_notti) + (p.minimo_notti == 1 ? ' notte' : ' notti') : ''],
        ['Codice CIN', esc(p.cin)]
      ]
    }[cat];
    return rows.filter(function (r) { return r[1] !== '' && r[1] != null && r[1] !== 'undefined'; });
  }

  function paragraphs(text) {
    return String(text || '').split(/\n{2,}/).filter(function (t) { return t.trim(); })
      .map(function (t) { return '<p>' + esc(t.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function gallery(p) {
    var photos = (p.foto || []).filter(Boolean);
    if (!photos.length) return '';
    var alt = function (i) { return esc(R.L(p, 'titolo')) + ' – foto ' + (i + 1) + ' di ' + photos.length; };
    return '<div class="gallery" data-index="0">' +
      '<div class="gallery__main">' +
        '<img src="' + esc(photos[0]) + '" alt="' + alt(0) + '" width="1200" height="800">' +
        (photos.length > 1
          ? '<button type="button" class="gallery__nav gallery__nav--prev" aria-label="Foto precedente">&#8249;</button>' +
            '<button type="button" class="gallery__nav gallery__nav--next" aria-label="Foto successiva">&#8250;</button>' +
            '<span class="gallery__count" aria-live="polite">1 / ' + photos.length + '</span>'
          : '') +
      '</div>' +
      (photos.length > 1
        ? '<ul class="gallery__thumbs">' + photos.map(function (src, i) {
            return '<li><button type="button" data-go="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + ' aria-label="Mostra foto ' + (i + 1) + '">' +
              '<img src="' + esc(src) + '" alt="" width="160" height="107" loading="lazy"></button></li>';
          }).join('') + '</ul>'
        : '') +
    '</div>';
  }

  function wireGallery(p) {
    var g = root.querySelector('.gallery');
    if (!g) return;
    var photos = (p.foto || []).filter(Boolean);
    var main = g.querySelector('.gallery__main img');
    var count = g.querySelector('.gallery__count');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i) {
      var from = Number(g.dataset.index) || 0;
      i = (i + photos.length) % photos.length;
      if (i === from && main.getAttribute('src') === photos[i]) return;
      var dir = (i > from || (from === photos.length - 1 && i === 0)) && !(from === 0 && i === photos.length - 1) ? 1 : -1;
      g.dataset.index = i;
      main.src = photos[i];
      // la nuova foto entra scorrendo dal lato giusto
      if (main.animate && !reduceMotion) {
        main.animate([{ opacity: 0.2, transform: 'translateX(' + (dir * 8) + '%) scale(1.02)' }, { opacity: 1, transform: 'none' }],
          { duration: 450, easing: 'cubic-bezier(.22,.61,.36,1)' });
      }
      main.alt = R.L(p, 'titolo') + ' – foto ' + (i + 1) + ' di ' + photos.length;
      if (count) count.textContent = (i + 1) + ' / ' + photos.length;
      g.querySelectorAll('[data-go]').forEach(function (b) {
        if (Number(b.dataset.go) === i) {
          b.setAttribute('aria-current', 'true');
          // scorre solo la fila delle miniature, non la pagina
          var strip = b.closest('.gallery__thumbs');
          var li = b.parentNode;
          if (li.offsetLeft < strip.scrollLeft || li.offsetLeft + li.offsetWidth > strip.scrollLeft + strip.clientWidth) {
            strip.scrollTo({ left: li.offsetLeft - (strip.clientWidth - li.offsetWidth) / 2, behavior: 'smooth' });
          }
        }
        else b.removeAttribute('aria-current');
      });
    }
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var i = Number(g.dataset.index);
      if (b.classList.contains('gallery__nav--prev')) show(i - 1);
      else if (b.classList.contains('gallery__nav--next')) show(i + 1);
      else if (b.dataset.go != null) show(Number(b.dataset.go));
    });
    // scorrimento col dito (o trascinando col mouse)
    if (window.LaMaisonSwipe && photos.length > 1) {
      window.LaMaisonSwipe(g.querySelector('.gallery__main'), function (dir) { show(Number(g.dataset.index) + dir); }, {
        move: function (dx) { main.style.transition = 'none'; main.style.transform = 'translateX(' + dx.toFixed(1) + 'px)'; },
        end: function () { main.style.transition = 'transform 0.25s ease'; main.style.transform = ''; }
      });
    }
  }

  // indirizzo ufficiale per Google (e niente indicizzazione per le schede che non esistono)
  function seoLink(rel, attr, value) {
    var el = document.querySelector(rel === 'canonical' ? 'link[rel="canonical"]' : 'meta[name="robots"]');
    if (!el) {
      el = document.createElement(rel === 'canonical' ? 'link' : 'meta');
      if (rel === 'canonical') el.rel = 'canonical'; else el.name = 'robots';
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }
  function notFound() {
    document.title = 'Immobile non trovato | LA MAISON GROUP';
    seoLink('robots', 'content', 'noindex');
    root.innerHTML = '<section class="page-hero page-hero--plain on-navy"><div class="container"><div class="page-hero__content">' +
      '<h1>Immobile non trovato</h1><p>Questo annuncio non è più disponibile o il link non è corretto.</p>' +
      '<a class="btn btn--gold" href="' + BACK[cat][0] + '">' + esc(BACK[cat][1]) + '</a></div></div></section>';
  }

  function render(data, showHidden) {
    var list = R.all(data, cat);
    var index = -1;
    list.forEach(function (p, i) { if (p && p.id === id) index = i; });
    var p = list[index];
    if (!p || (p.pubblicata === false && !showHidden)) return notFound();

    var where = [p.indirizzo_visibile ? p.indirizzo : '', p.zona, p.citta].filter(Boolean).join(', ');
    var cost = R.CATEGORIES[cat].price(p);
    var specs = R.specsOf(cat, p);
    var tags = (p.caratteristiche || []).filter(Boolean);
    var request = 'contatti.html?tipo=' + R.CATEGORIES[cat].request + '&amp;c=' + encodeURIComponent(cat) + '&amp;immobile=' + encodeURIComponent(p.id);
    var links = [p.link_airbnb && ['Prenota su Airbnb', p.link_airbnb], p.link_booking && ['Prenota su Booking.com', p.link_booking]]
      .filter(function (l) { return l && /^https?:\/\//.test(l[1]); });

    document.title = R.L(p, 'titolo') + ' | LA MAISON GROUP';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', (R.L(p, 'descrizione') || R.L(p, 'titolo')).slice(0, 155));
    var sito = (window.LaMaisonContent && window.LaMaisonContent.data().comune || {}).sito || {};
    var base = String(sito.dominio || 'https://www.lamaison-group.it/').replace(/\/?$/, '/');
    seoLink('canonical', 'href', base + 'immobile.html?c=' + encodeURIComponent(cat) + '&id=' + encodeURIComponent(p.id));

    root.dataset.index = index;
    root.innerHTML =
      '<section class="page-hero page-hero--plain page-hero--compact on-navy">' +
        '<div class="container">' +
          '<nav class="scheda__back" aria-label="Percorso"><a href="' + BACK[cat][0] + '">&larr; ' + esc(BACK[cat][1]) + '</a></nav>' +
          '<div class="page-hero__content">' +
            '<span class="label">' + esc(R.CATEGORIES[cat].label) + (p.etichetta ? ' · ' + esc(p.etichetta) : '') + '</span>' +
            '<h1>' + esc(R.L(p, 'titolo')) + '</h1>' +
            (where ? '<p class="scheda__where">' + esc(where) + '</p>' : '') +
            (p.pubblicata === false ? '<p class="scheda__hidden">Non visibile ai visitatori</p>' : '') +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section section--tight">' +
      '<div class="container scheda">' +
        '<div class="scheda__grid">' +
          '<div class="scheda__main">' +
            gallery(p) +
            (specs ? '<ul class="specs specs--large" aria-label="In breve">' + specs + '</ul>' : '') +
            (R.L(p, 'descrizione') ? '<section class="scheda__block"><h2>Descrizione</h2>' + paragraphs(R.L(p, 'descrizione')) + '</section>' : '') +
            (tags.length ? '<section class="scheda__block"><h2>Caratteristiche</h2><ul class="tags">' +
              tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' : '') +
          '</div>' +
          '<aside class="scheda__side">' +
            '<div class="card scheda__box">' +
              (cost ? '<p class="price">' + cost + '</p>' : '') +
              '<dl class="facts">' + facts(p).map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
              (cat === 'affitti-brevi'
                ? '<p class="scheda__quote">Scegli le date e ricevi un preventivo su misura.</p>' +
                  '<a class="btn btn--primary" href="#richiesta">Scegli le date</a>'
                : '<a class="btn btn--primary" href="' + request + '">Richiedi informazioni</a>') +
              links.map(function (l) { return '<a class="btn btn--secondary" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + l[0] + '</a>'; }).join('') +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
      '</section>' +
      (cat === 'affitti-brevi'
        ? '<section class="section section--grey" id="richiesta" aria-labelledby="richiesta-title">' +
            '<div class="container"><div class="section-head">' +
              '<span class="label">Preventivo</span>' +
              '<h2 id="richiesta-title">Scegli le tue <span class="accent">date</span></h2>' +
              '<p>Seleziona arrivo e partenza sul calendario: ti rispondiamo con disponibilità e preventivo.</p>' +
            '</div><div data-booking-slot></div></div>' +
          '</section>'
        : '');
    wireGallery(p);
    var slot = root.querySelector('[data-booking-slot]');
    if (slot && window.LaMaisonBooking) window.LaMaisonBooking.mount(slot, { immobile: p });
  }

  window.LaMaisonScheda = { category: cat, id: id, render: render };

  // cambio lingua: si ridisegna la scheda solo se ha titolo o descrizione in inglese
  // (le altre scritte cambiano da sole, senza perdere le date già scelte)
  var last = null;
  document.addEventListener('lm:lang', function () {
    if (!last || root.dataset.editing) return;
    var p = R.all(last, cat).filter(function (x) { return x && x.id === id; })[0];
    if (p && (p.titolo_en || p.descrizione_en)) render(last, false);
  });

  if (!id) return notFound();
  window.LaMaisonDati.json('data/' + cat + '.json')
    .then(function (data) { if (!data) throw new Error('dati non trovati'); return data; })
    .then(function (data) { last = data; if (!root.dataset.editing) render(data, false); })
    .catch(function () { if (!root.dataset.editing) notFound(); });
})();

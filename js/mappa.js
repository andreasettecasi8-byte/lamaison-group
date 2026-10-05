/* LA MAISON GROUP — mappa "Dove operiamo" (Home)
   Disegna l'Italia divisa in province (data/province.json) ed evidenzia in oro
   quelle elencate in data/pagine/comune.json → sito.province (es. ["TO"]).
   Passando col mouse (o toccando, su telefono e tablet) compare il nome della provincia.
   In modalità modifica si clicca una provincia per aggiungerla o toglierla. */
(function () {
  'use strict';

  var box = document.querySelector('[data-map]');
  if (!box) return;
  var shapes = null;
  var onToggle = null; // impostato dall'area riservata
  var shown = false;    // la mappa è già entrata nello schermo
  var NS = 'http://www.w3.org/2000/svg';

  function active() {
    var C = window.LaMaisonContent;
    var p = C && C.data().comune && C.data().comune.sito && C.data().comune.sito.province;
    return Array.isArray(p) ? p : ['TO'];
  }

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function draw() {
    var on = active();
    var svg = el('svg', { viewBox: shapes.viewBox, class: 'zone__svg', role: 'img',
      'aria-label': 'Mappa dell\'Italia. Province in cui operiamo: ' + names(on).join(', ') });
    shapes.province.forEach(function (p) {
      var isOn = on.indexOf(p.sigla) !== -1;
      var path = el('path', { d: p.d, class: 'zone__prov' + (isOn ? ' is-active' : ''), 'data-sigla': p.sigla });
      svg.appendChild(path);
    });
    var holder = box.querySelector('.zone__canvas');
    holder.innerHTML = '';
    holder.appendChild(svg);
    // le province evidenziate si accendono una dopo l'altra quando la mappa entra nello schermo
    if (!shown && 'IntersectionObserver' in window) {
      var lit = svg.querySelectorAll('.zone__prov.is-active');
      lit.forEach(function (path, i) { path.style.transitionDelay = (0.25 + i * 0.18) + 's'; });
      var seen = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        seen.disconnect();
        shown = true;
        box.classList.add('is-shown');
        // finita l'accensione, il passaggio del mouse torna immediato
        setTimeout(function () { lit.forEach(function (path) { path.style.transitionDelay = ''; }); }, 2500);
      }, { threshold: 0.35 });
      seen.observe(box);
    } else box.classList.add('is-shown');
    box.classList.toggle('is-editing', !!onToggle);
  }

  function byCode(code) {
    for (var i = 0; i < shapes.province.length; i++) if (shapes.province[i].sigla === code) return shapes.province[i];
    return { nome: code };
  }
  function names(codes) {
    return codes.map(function (c) { var p = byCode(c); return p.nome + ' (' + c + ')'; });
  }

  // ----- Nome della provincia: al passaggio del mouse o al tocco -----
  var tip = document.createElement('div');
  tip.className = 'zone__tip';
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  box.appendChild(tip);
  var tipFor = null;   // sigla della provincia mostrata

  function provinceAt(target) {
    return target && target.closest ? target.closest('.zone__prov') : null;
  }
  function showTip(path, x, y) {
    var code = path.dataset.sigla;
    var p = byCode(code);
    if (tipFor !== code) {
      tip.textContent = p.nome + ' (' + code + ')';
      if (path.classList.contains('is-active')) {
        var note = document.createElement('span');
        note.textContent = 'Operiamo qui';
        tip.appendChild(note);
      }
      box.querySelectorAll('.zone__prov.is-hover').forEach(function (n) { n.classList.remove('is-hover'); });
      path.classList.add('is-hover');
      tipFor = code;
    }
    tip.hidden = false;
    var r = box.getBoundingClientRect();
    var half = tip.offsetWidth / 2;
    var left = Math.min(Math.max(x - r.left, half), r.width - half);
    tip.style.left = left + 'px';
    tip.style.top = (y - r.top) + 'px';
  }
  function hideTip() {
    tip.hidden = true;
    tipFor = null;
    box.querySelectorAll('.zone__prov.is-hover').forEach(function (n) { n.classList.remove('is-hover'); });
  }

  box.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var path = provinceAt(e.target);
    if (path) showTip(path, e.clientX, e.clientY); else hideTip();
  });
  box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTip(); });

  function select(path, x, y, touch) {
    var code = path.dataset.sigla;
    if (onToggle) {
      onToggle(code); // ridisegna la mappa: il nome resta sulla provincia appena cambiata
      var fresh = box.querySelector('.zone__prov[data-sigla="' + code + '"]');
      tipFor = null;
      if (fresh) showTip(fresh, x, y);
      return;
    }
    // al tocco: un tocco mostra il nome, un secondo tocco sulla stessa provincia lo chiude
    if (touch && tipFor === code) hideTip(); else showTip(path, x, y);
  }
  // Dito (telefono, tablet): si usa il "pointerup" perché su iPhone il clic
  // sulle forme della mappa non arriva. Se il dito scorre la pagina il tocco viene annullato.
  var lastTouch = 0;
  box.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'mouse') return;
    lastTouch = Date.now();
    var path = provinceAt(document.elementFromPoint(e.clientX, e.clientY));
    if (path) select(path, e.clientX, e.clientY, true); else hideTip();
  });
  box.addEventListener('click', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return; // già gestito al tocco
    if (!e.pointerType && e.detail === 0) return;          // clic da tastiera: niente
    if (Date.now() - lastTouch < 800) return;              // clic generato dal tocco appena gestito
    var path = provinceAt(e.target);
    if (path) select(path, e.clientX, e.clientY, false);
  });
  // tocco o clic fuori dalla mappa: il nome si chiude
  document.addEventListener('pointerdown', function (e) { if (!box.contains(e.target)) hideTip(); });

  var loading = false;
  function load() {
    if (loading) return;
    loading = true;
    fetch('data/province.json')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        shapes = d;
        return window.LaMaisonContent ? window.LaMaisonContent.ready : null;
      })
      .then(draw)
      .catch(function () { box.hidden = true; });
  }

  // la mappa si carica solo quando ci si avvicina alla sezione
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: '400px' });
    io.observe(box);
  } else load();

  window.LaMaisonMap = {
    update: function () { if (shapes) draw(); },
    // area riservata: fn(sigla) viene chiamata al clic su una provincia
    setEditable: function (fn) { onToggle = fn; if (shapes) draw(); else load(); },
    provinces: function () { return shapes ? shapes.province : []; }
  };
})();

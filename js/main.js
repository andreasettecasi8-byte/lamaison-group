/* LA MAISON GROUP — comportamenti comuni a tutte le pagine */
(function () {
  'use strict';

  var body = document.body;
  var header = document.getElementById('header');
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');

  // ----- Menu a tutto schermo (sotto 1024px) -----
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        setMenu(false);
        burger.focus();
      }
    });
    // la tendina si chiude anche cliccando fuori (su computer la pagina resta visibile sotto)
    document.addEventListener('click', function (e) {
      if (body.classList.contains('menu-open') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
  }

  // ----- Menù "Servizi" a tendina (da 1024px) -----
  document.querySelectorAll('.nav__group').forEach(function (group) {
    var toggle = group.querySelector('.nav__toggle');
    function set(open) {
      group.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { set(!group.classList.contains('is-open')); });
    // con il mouse si apre passandoci sopra: aria-expanded segue
    group.addEventListener('mouseenter', function () { toggle.setAttribute('aria-expanded', 'true'); });
    group.addEventListener('mouseleave', function () { if (!group.classList.contains('is-open')) toggle.setAttribute('aria-expanded', 'false'); });
    group.addEventListener('focusout', function (e) { if (!group.contains(e.relatedTarget)) set(false); });
    group.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && group.classList.contains('is-open')) { set(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) { if (!group.contains(e.target)) set(false); });
  });

  // ----- Barra in alto: trasparente sulla foto iniziale, vetro bianco quando la si supera -----
  var cover = document.querySelector('.hero, .page-hero');
  function onScroll() {
    var past = cover
      ? cover.getBoundingClientRect().bottom <= header.offsetHeight + 1
      : window.scrollY > 8;
    header.classList.toggle('is-scrolled', past);
  }
  window.addEventListener('resize', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ----- Animazioni di comparsa allo scorrimento -----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var observer = null;
  if ('IntersectionObserver' in window && !reduce) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 4% 0px', threshold: 0.01 });
  }

  // Usata anche da render.js per le schede create dopo il caricamento
  function observe(root) {
    (root || document).querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
      if (observer) observer.observe(el);
      else el.classList.add('is-visible');
    });
  }
  observe();

  window.LaMaison = { observe: observe };

  // ----- Effetti legati allo scorrimento -----
  // (barra di avanzamento, foto in parallasse, scritte che scorrono; niente se si preferisce meno movimento)
  if (!reduce) {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var heroes = [].slice.call(document.querySelectorAll('.hero, .page-hero'));
    var floaters = [].slice.call(document.querySelectorAll('.split__media'));
    var ticking = false;
    var paint = function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      var max = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (document.documentElement.classList.contains('lm-editing')) return; // durante le modifiche tutto fermo
      heroes.forEach(function (h) {
        var r = h.getBoundingClientRect();
        if (r.bottom < 0) return;
        var done = Math.min(1, Math.max(0, -r.top / r.height)); // 0 in cima, 1 quando è uscita
        h.querySelectorAll('.hero__img').forEach(function (img) { img.style.translate = '0 ' + (done * r.height * 0.35).toFixed(1) + 'px'; });
        var content = h.querySelector('.hero__content, .page-hero__content');
        if (content) {
          content.style.translate = '0 ' + (done * -80).toFixed(1) + 'px';
          content.style.opacity = (1 - done * 1.4).toFixed(3);
        }
      });
      floaters.forEach(function (m) {
        var r = m.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -0,5 … 0,5 mentre attraversa lo schermo
        m.style.setProperty('--py', (p * -60).toFixed(1) + 'px');
      });
    };
    var onScrollFx = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(paint); } };
    window.addEventListener('scroll', onScrollFx, { passive: true });
    window.addEventListener('resize', onScrollFx);
    paint();
  }

  // ----- Foto iniziale della Home: presentazione con dissolvenza -----
  var slides = [].slice.call(document.querySelectorAll('.hero [data-hero-slide]'));
  if (slides.length > 1) {
    var heroIndex = 0;
    var dots = document.createElement('div');
    dots.className = 'hero__dots';
    slides.forEach(function (img, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Mostra la foto ' + (i + 1) + ' di ' + slides.length);
      b.addEventListener('click', function () { goHero(i); restartHero(); });
      dots.appendChild(b);
    });
    slides[0].closest('.hero').appendChild(dots);
    var goHero = function (i) {
      heroIndex = (i + slides.length) % slides.length;
      slides.forEach(function (img, k) { img.classList.toggle('is-active', k === heroIndex); });
      [].forEach.call(dots.children, function (b, k) { b.setAttribute('aria-current', k === heroIndex ? 'true' : 'false'); });
    };
    var heroTimer = null;
    var restartHero = function () {
      clearInterval(heroTimer);
      if (reduce) return; // chi preferisce meno animazioni cambia foto con i puntini
      heroTimer = setInterval(function () {
        // ferma durante le modifiche e quando la scheda del browser non è in primo piano
        if (document.hidden || document.documentElement.classList.contains('lm-editing')) return;
        goHero(heroIndex + 1);
      }, 6000);
    };
    goHero(0);
    restartHero();
    window.LaMaisonHero = { go: goHero, current: function () { return heroIndex; } };
  }

  // ----- Recensioni della Home: sul telefono scorrono da sole -----
  function setupTrack(track) {
    if (track.dataset.auto) return;
    var cards = track.querySelectorAll('.review');
    if (cards.length < 2) return;
    track.dataset.auto = '1';
    var nav = document.createElement('div');
    nav.className = 'reviews-dots';
    [].forEach.call(cards, function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Recensione ' + (i + 1) + ' di ' + cards.length);
      b.addEventListener('click', function () { goTo(i); pause(); });
      nav.appendChild(b);
    });
    track.after(nav);
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, dist = Infinity;
      [].forEach.call(cards, function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    }
    function goTo(i) {
      var c = cards[(i + cards.length) % cards.length];
      track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
    function mark() {
      var i = current();
      [].forEach.call(nav.children, function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    var resumeAt = 0;
    function pause() { resumeAt = Date.now() + 8000; } // se il cliente tocca, aspetta prima di ripartire
    track.addEventListener('scroll', function () { window.requestAnimationFrame(mark); }, { passive: true });
    track.addEventListener('pointerdown', pause);
    track.addEventListener('mouseenter', pause);
    mark();
    if (reduce) return;
    setInterval(function () {
      var scrolls = track.scrollWidth > track.clientWidth + 4; // solo quando le recensioni non stanno tutte nello schermo
      nav.hidden = !scrolls;
      if (!scrolls || document.hidden || Date.now() < resumeAt) return;
      var r = track.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // fuori dallo schermo: non si muove
      goTo(current() + 1);
    }, 5000);
    nav.hidden = !(track.scrollWidth > track.clientWidth + 4);
  }
  document.querySelectorAll('.reviews-track').forEach(function (t) { if (t.querySelector('.review')) setupTrack(t); });
  document.addEventListener('lm:drawn', function (e) {
    if (e.target.classList && e.target.classList.contains('reviews-track')) setupTrack(e.target);
  });

  // ----- Area riservata: l'editor si carica solo quando serve -----
  function loadEditor(action) {
    if (window.LaMaisonEditor) return window.LaMaisonEditor[action]();
    if (!document.querySelector('link[href="css/editor.css"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'css/editor.css?v=' + Date.now(); // sempre l'ultima versione dell'area riservata
      document.head.appendChild(css);
    }
    var script = document.createElement('script');
    script.src = 'js/editor.js?v=' + Date.now();
    script.onload = function () { window.LaMaisonEditor[action](); };
    document.head.appendChild(script);
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-admin-link]')) {
      e.preventDefault();
      loadEditor('open');
    }
  });
  var inSession = false;
  try { inSession = !!sessionStorage.getItem('lm-admin-session'); } catch (e) {}
  if (inSession) loadEditor('resume');
  else if (location.hash === '#admin') loadEditor('open');
})();

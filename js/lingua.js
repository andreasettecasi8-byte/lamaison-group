/* LA MAISON GROUP — cambio lingua italiano / inglese, in tempo reale
   - I testi modificabili (data-edit) li cambia js/content.js con i file data/pagine/en/*.json.
   - Le scritte fisse (voci dei menu a tendina, calendario, messaggi dei moduli, schede immobili…)
     le traduce questo file con il dizionario qui sotto, anche quando compaiono dopo il caricamento.
   - Le email che arrivano restano in italiano (i valori dei moduli non vengono tradotti). */
(function () {
  'use strict';

  var C = window.LaMaisonContent;
  if (!C) return;

  // ----- Dizionario: italiano → inglese -----
  var D = {
    // pagine
    '(facoltativo)': '(optional)', 'Area riservata': 'Restricted area', 'Caricamento…': 'Loading…', 'Chiama': 'Call',
    'Confini delle province: ISTAT': 'Province boundaries: ISTAT', 'Contatta Andrea': 'Contact Andrea', 'Contatta Paolo': 'Contact Paolo',
    'Ho letto l\'informativa sul trattamento dei dati personali (': 'I have read the notice on the processing of personal data (',
    'Menù': 'Menu', 'Non compilare': 'Do not fill in', 'Seleziona…': 'Select…', 'Telefono': 'Phone', 'Vai al contenuto': 'Skip to content',
    'Zona operativa:': 'Service area:', 'Altre informazioni': 'Other information', 'Operiamo qui': 'We work here',
    'Per sapere come il sito usa cookie e tecnologie simili consulta la': 'To find out how the website uses cookies and similar technologies, see the',
    'Per sapere come trattiamo i dati personali consulta la': 'To find out how we process personal data, see the',
    // modulo contatti
    'Affidare un immobile': 'Listing my property', 'Affitto': 'Renting', 'Acquisto': 'Buying', 'Consulenza': 'Consulting', 'Altro': 'Other',
    // modulo valutazione
    'Appartamento': 'Apartment', 'Attico': 'Penthouse', 'Villa / Casa indipendente': 'Villa / Detached house',
    'Casa semindipendente / a schiera': 'Semi-detached / Terraced house', 'Rustico / Baita': 'Farmhouse / Mountain chalet',
    'Ufficio / Negozio': 'Office / Shop', 'Terreno': 'Land', 'Vendere': 'Sell', 'Affittare a lungo termine': 'Rent out long-term',
    'Affittare per brevi periodi': 'Rent out short-term', 'Non ho ancora deciso': 'I haven\'t decided yet',
    'Nuovo / Ristrutturato di recente': 'New / Recently renovated', 'Buono / Abitabile': 'Good / Habitable', 'Da ristrutturare': 'Needs renovation',
    'Balcone / Terrazzo': 'Balcony / Terrace', 'Giardino': 'Garden', 'Box / Posto auto': 'Garage / Parking space', 'Cantina': 'Cellar',
    'Ascensore': 'Lift', 'Arredato': 'Furnished', '3 o più': '3 or more', '5 o più': '5 or more',
    // recensioni
    'Proprietario': 'Owner', 'Ospite': 'Guest', 'Acquirente': 'Buyer', 'Inquilino': 'Tenant',
    // attributi (aria-label, placeholder, title, alt)
    'Anche indicativo': 'Even approximate', 'Apri il menu': 'Open the menu', 'Chiudi il menu': 'Close the menu',
    'Es. 2° su 4, piano terra': 'E.g. 2nd of 4, ground floor', 'Es. SO': 'E.g. SO',
    'Es. vista, esposizione, spese condominiali, se è libero o affittato…': 'E.g. view, orientation, service charges, whether it is vacant or let…',
    'Informativa': 'Notice', 'LA MAISON GROUP, torna alla home': 'LA MAISON GROUP, back to home', 'Menu principale': 'Main menu', 'Menu': 'Menu',
    'Note legali': 'Legal notes', 'Recapiti e modulo di contatto': 'Contact details and form', 'Scrivici su WhatsApp': 'Message us on WhatsApp',
    'Via e numero civico': 'Street and number', 'Logo LA MAISON GROUP': 'LA MAISON GROUP logo', 'Lingua': 'Language',
    // schede immobili e progetti
    'Scegli questo alloggio': 'Choose this accommodation', 'Alloggio scelto ✓': 'Accommodation selected ✓', 'Dettagli': 'Details',
    'Vedi la scheda': 'View details', 'Prima': 'Before', 'Dopo': 'After', 'Esempio': 'Example', 'In vendita': 'For sale',
    'Affitto a lungo termine': 'Long-term rental', 'Affitto breve': 'Short-term rental', '/ mese': '/ month', 'su 5': 'out of 5',
    'Nuovi immobili in arrivo. Contattaci per ricevere le prossime opportunità.': 'New properties coming soon. Contact us to hear about the next opportunities.',
    'Nuovi immobili in arrivo.': 'New properties coming soon.',
    'Nuovi immobili in affitto in arrivo. Contattaci per ricevere le prossime disponibilità.': 'New rental properties coming soon. Contact us to hear about upcoming availability.',
    'I primi progetti saranno pubblicati a breve.': 'Our first projects will be published soon.',
    'Le prime recensioni dei nostri clienti arriveranno presto.': 'The first reviews from our clients are coming soon.',
    'Richiedi informazioni': 'Request information', 'Scegli le date': 'Choose your dates', 'Scegli le tue': 'Choose your', 'date': 'dates',
    'Immobile non trovato': 'Property not found', 'Questo annuncio non è più disponibile o il link non è corretto.': 'This listing is no longer available or the link is incorrect.',
    'Non visibile ai visitatori': 'Not visible to visitors', 'Scegli le date e ricevi un preventivo su misura.': 'Choose your dates and receive a tailor-made quote.',
    'Seleziona arrivo e partenza sul calendario: ti rispondiamo con disponibilità e preventivo.': 'Select arrival and departure on the calendar: we will reply with availability and a quote.',
    'Caratteristiche': 'Features', 'Descrizione': 'Description', 'Preventivo': 'Quote', 'In breve': 'At a glance', 'Percorso': 'Breadcrumb',
    'Foto successiva': 'Next photo', 'Foto precedente': 'Previous photo', 'Affitti a lungo termine': 'Long-term rentals', 'Affitti brevi': 'Short-term rentals',
    'Tutti gli immobili in vendita': 'All properties for sale', 'Classe energetica': 'Energy class', 'Codice CIN': 'CIN code', 'Disponibile dal': 'Available from',
    'Prenota su Airbnb': 'Book on Airbnb', 'Prenota su Booking.com': 'Book on Booking.com', 'Soggiorno minimo': 'Minimum stay', 'Spese condominiali': 'Service charges',
    'Tipologia': 'Type', 'Superficie': 'Floor area', 'Locali': 'Rooms', 'Camere': 'Bedrooms', 'Bagni': 'Bathrooms', 'Piano': 'Floor', 'Stato': 'Condition',
    'Contratto': 'Contract', 'Arredamento': 'Furnishing', 'Ospiti': 'Guests', 'Letti': 'Beds', 'Prezzo': 'Price', 'Canone': 'Rent', 'Canone mensile': 'Monthly rent',
    'Prezzo su richiesta': 'Price on request', 'Indirizzo': 'Address', 'Zona': 'Area', 'Città': 'Town',
    // tipologie, dotazioni, stati ed etichette scelti nell'area riservata
    'Monolocale': 'Studio', 'Bilocale': 'One-bedroom apartment', 'Trilocale': 'Two-bedroom apartment', 'Quadrilocale': 'Three-bedroom apartment',
    'Loft': 'Loft', 'Villa': 'Villa', 'Villetta a schiera': 'Terraced house', 'Casa indipendente': 'Detached house', 'Ufficio': 'Office', 'Negozio': 'Shop',
    'Baita': 'Mountain chalet', 'Rustico': 'Farmhouse',
    'Balcone': 'Balcony', 'Terrazzo': 'Terrace', 'Box auto': 'Garage', 'Posto auto': 'Parking space', 'Aria condizionata': 'Air conditioning',
    'Riscaldamento autonomo': 'Independent heating', 'Portineria': 'Concierge', 'Wi-Fi': 'Wi-Fi', 'Lavatrice': 'Washing machine', 'Lavastoviglie': 'Dishwasher',
    'Animali ammessi': 'Pets allowed', 'Accessibile ai disabili': 'Wheelchair accessible',
    'Nuovo': 'New', 'Ristrutturato': 'Renovated', 'Buono stato': 'Good condition', '3+2 canone concordato': '3+2 agreed rent', 'Transitorio': 'Transitional (short-term)',
    'Per studenti': 'Students', 'Parzialmente arredato': 'Partly furnished', 'Non arredato': 'Unfurnished', 'Esclusiva': 'Exclusive', 'Prezzo ribassato': 'Price reduced',
    'In trattativa': 'Under offer', 'Venduto': 'Sold', 'Disponibile subito': 'Available now', 'Affittato': 'Let', 'Più richiesto': 'Most requested',
    'Vista panoramica': 'Panoramic view', 'In arrivo': 'Coming soon', 'In corso': 'In progress', 'Completato': 'Completed',
    // richiesta di soggiorno (calendario)
    'Motivo del viaggio, orario di arrivo, richieste particolari…': 'Reason for your trip, arrival time, special requests…', 'Email *': 'Email *',
    'Messaggio': 'Message', 'Nome e cognome *': 'Full name *', 'Ospiti *': 'Guests *', 'Ora scegli la data di partenza': 'Now choose your departure date',
    'Vedi gli alloggi': 'See the accommodation', 'Richiedi un preventivo': 'Request a quote', 'Nuova richiesta': 'New request', 'Cambia date': 'Change dates',
    'Mese precedente': 'Previous month', 'Mese successivo': 'Next month', 'Alloggio scelto': 'Selected accommodation', 'Date del soggiorno *': 'Dates of stay *',
    'Richiesta inviata!': 'Request sent!', 'Prima scegli l\'alloggio': 'First choose your accommodation',
    'tra quelli qui sopra: poi potrai indicare le date del soggiorno.': 'from the ones above: then you can enter the dates of your stay.',
    'Grazie: verifichiamo la disponibilità e ti mandiamo il preventivo per email al più presto.': 'Thank you: we will check availability and email you a quote as soon as possible.',
    'Scegli sul calendario la data di arrivo': 'Choose your arrival date on the calendar', 'Arrivo': 'Arrival', 'Partenza': 'Departure', 'Cambia': 'Change',
    'Scegli anche la data di partenza.': 'Please also choose your departure date.', 'Scegli le date del soggiorno sul calendario.': 'Choose the dates of your stay on the calendar.',
    'lun': 'Mon', 'mar': 'Tue', 'mer': 'Wed', 'gio': 'Thu', 'ven': 'Fri', 'sab': 'Sat', 'dom': 'Sun',
    // messaggi dei moduli
    'Invio in corso…': 'Sending…', 'Invio non riuscito.': 'Sending failed.',
    'Il modulo non è ancora collegato. Nel frattempo contattaci per telefono, WhatsApp o email.': 'The form is not connected yet. In the meantime please contact us by phone, WhatsApp or email.',
    'Gestione Completa': 'Full Management', 'Gestione Online': 'Online Management', 'shooting fotografico professionale': 'professional photo shoot'
  };

  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var UNITS = { ospite: 'guest', ospiti: 'guests', camera: 'bedroom', camere: 'bedrooms', bagno: 'bathroom', bagni: 'bathrooms', locale: 'room',
    locali: 'rooms', notte: 'night', notti: 'nights', letto: 'bed', letti: 'beds', recensione: 'review', recensioni: 'reviews' };
  var mese = MESI.join('|');

  // ----- Frasi con numeri, date e nomi -----
  var P = [
    [new RegExp('^(\\d+) (' + Object.keys(UNITS).join('|') + ')$'), function (m) { return m[1] + ' ' + UNITS[m[2]]; }],
    [/^(\d) stelle su 5$/, function (m) { return m[1] + (m[1] === '1' ? ' star' : ' stars') + ' out of 5'; }],
    [new RegExp('^(' + GIORNI.join('|') + ') (\\d{1,2}) (' + mese + ') (\\d{4})$'), function (m) { return DAYS[GIORNI.indexOf(m[1])] + ' ' + m[2] + ' ' + MONTHS[MESI.indexOf(m[3])] + ' ' + m[4]; }],
    [new RegExp('^(\\d{1,2}) (' + mese + ') (\\d{4})$'), function (m) { return m[1] + ' ' + MONTHS[MESI.indexOf(m[2])] + ' ' + m[3]; }],
    [new RegExp('^(' + mese + ') (\\d{4})$'), function (m) { return MONTHS[MESI.indexOf(m[1])] + ' ' + m[2]; }],
    [/^(lun|mar|mer|gio|ven|sab|dom) (\d{1,2}) (gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)$/, function (m) {
      return D[m[1]] + ' ' + m[2] + ' ' + MONTHS['gen feb mar apr mag giu lug ago set ott nov dic'.split(' ').indexOf(m[3])].slice(0, 3);
    }],
    [/^Il soggiorno minimo per questo immobile è di (\d+) (notte|notti)\.$/, function (m) { return 'The minimum stay for this property is ' + m[1] + ' ' + UNITS[m[2]] + '.'; }],
    [/^Mostra la foto (\d+) di (\d+)$/, function (m) { return 'Show photo ' + m[1] + ' of ' + m[2]; }],
    [/^Mostra foto (\d+)$/, function (m) { return 'Show photo ' + m[1]; }],
    [/^Recensione (\d+) di (\d+)$/, function (m) { return 'Review ' + m[1] + ' of ' + m[2]; }],
    [/^Media su (\d+) (recensione|recensioni)$/, function (m) { return 'Average of ' + m[1] + ' ' + UNITS[m[2]]; }],
    [/^provincia di (.+)$/, function (m) { return 'province of ' + m[1]; }],
    [/^province di (.+) e ([^,]+)$/, function (m) { return 'provinces of ' + m[1] + ' and ' + m[2]; }],
    [/^Mappa dell'Italia\. Province in cui operiamo: (.*)$/, function (m) { return 'Map of Italy. Provinces where we work: ' + m[1]; }],
    [/^(.*) – foto (\d+) di (\d+)$/, function (m) { return m[1] + ' – photo ' + m[2] + ' of ' + m[3]; }],
    [/^Confronta prima e dopo: (.*)$/, function (m) { return 'Compare before and after: ' + m[1]; }],
    [/^(.*): (dopo|prima) la ristrutturazione$/, function (m) { return m[1] + (m[2] === 'dopo' ? ': after renovation' : ': before renovation'); }],
    [/^(.*) \/ mese$/, function (m) { return m[1] + ' / month'; }],
    [/^(.*) Riprova tra poco oppure contattaci per telefono o WhatsApp\.$/, function (m) { return (t(m[1]) || m[1]) + ' Please try again shortly or contact us by phone or WhatsApp.'; }],
    [/^Vorrei ricevere un preventivo per la (.+) del mio immobile\.$/, function (m) { return 'I would like a quote for the ' + (D[m[1]] || m[1]) + ' of my property.'; }],
    [/^Vorrei ricevere informazioni sull'immobile (.+)\.$/, function (m) { return 'I would like information about the property ' + m[1] + '.'; }],
    [/^Vorrei sapere la disponibilità dell'immobile (.+)\.$/, function (m) { return 'I would like to know the availability of the property ' + m[1] + '.'; }]
  ];

  function t(text) {
    var key = String(text).replace(/\s+/g, ' ').trim();
    if (!key) return null;
    if (Object.prototype.hasOwnProperty.call(D, key)) return D[key];
    var arrow = key.match(/^(←|→)\s*(.+)$/) || key.match(/^(.+?)\s*(→|←)$/);
    if (arrow) {
      var inner = arrow[1] === '←' || arrow[1] === '→' ? arrow[2] : arrow[1];
      var tr = t(inner);
      if (tr) return arrow[1] === '←' || arrow[1] === '→' ? arrow[1] + ' ' + tr : tr + ' ' + arrow[2];
    }
    for (var i = 0; i < P.length; i++) {
      var m = key.match(P[i][0]);
      if (m) return P[i][1](m);
    }
    // "Crocetta, Torino · Appartamento", "Acquirente · 20 luglio 2026": si traduce ogni parte
    if (key.indexOf(' · ') !== -1) {
      var parts = key.split(' · '), any = false;
      parts = parts.map(function (p) { var x = t(p); if (x) { any = true; return x; } return p; });
      if (any) return parts.join(' · ');
    }
    return null;
  }

  // ----- Traduzione della pagina -----
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var lang = C.lang();
  var writing = false;
  var touched = new Set();

  function skip(el) {
    return !el || el.closest('[data-edit], .lm-ui, script, style, textarea, [data-no-translate], svg');
  }
  function doText(node) {
    if (skip(node.parentElement)) return;
    var src = node.__lmIt != null && node.nodeValue === node.__lmEn ? node.__lmIt : node.nodeValue;
    if (lang === 'en') {
      var en = t(src);
      if (en == null || en === src.trim()) { if (node.__lmIt != null && node.nodeValue === node.__lmEn) { write(node, src); } return; }
      var lead = src.match(/^\s*/)[0], tail = src.match(/\s*$/)[0];
      node.__lmIt = src;
      node.__lmEn = lead + en + tail;
      touched.add(node);
      if (node.nodeValue !== node.__lmEn) write(node, node.__lmEn);
      // le voci dei menu a tendina continuano a inviare il valore italiano
      var opt = node.parentElement;
      if (opt && opt.tagName === 'OPTION' && !opt.hasAttribute('value')) opt.setAttribute('value', src.trim());
    } else if (node.__lmIt != null && node.nodeValue === node.__lmEn) {
      write(node, node.__lmIt);
    }
  }
  // si scrive solo se cambia davvero: riscrivere lo stesso testo farebbe ripartire l'osservatore all'infinito
  function write(node, value) { if (node.nodeValue === value) return; writing = true; node.nodeValue = value; writing = false; }
  function doAttrs(el) {
    if (el.closest('.lm-ui')) return;
    ATTRS.forEach(function (name) {
      if (!el.hasAttribute(name) || (name === 'alt' && el.hasAttribute('data-edit-img'))) return;
      var store = el.__lmAttr || (el.__lmAttr = {});
      var cur = el.getAttribute(name);
      var rec = store[name];
      var src = rec && cur === rec.en ? rec.it : cur;
      if (lang === 'en') {
        var en = t(src);
        if (en == null || en === src) { if (rec && cur === rec.en) setAttr(el, name, rec.it); return; }
        store[name] = { it: src, en: en };
        touched.add(el);
        if (cur !== en) setAttr(el, name, en);
      } else if (rec && cur === rec.en) {
        setAttr(el, name, rec.it);
      }
    });
  }
  function setAttr(el, name, value) { if (el.getAttribute(name) === value) return; writing = true; el.setAttribute(name, value); writing = false; }

  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    if (root.closest && root.closest('.lm-ui, script, style')) return;
    doAttrs(root);
    root.querySelectorAll('[placeholder], [aria-label], [title], img[alt]').forEach(doAttrs);
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = it.nextNode())) doText(n);
  }

  var observer = new MutationObserver(function (list) {
    if (writing) return;
    list.forEach(function (m) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
    });
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  // ----- Pulsanti per cambiare lingua -----
  function markButtons() {
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang]');
    if (!b || b.dataset.lang === lang) return;
    e.preventDefault();
    // durante le modifiche si ricarica la pagina, così l'area riservata apre i testi della lingua scelta
    if (document.documentElement.classList.contains('lm-editing')) {
      C.remember(b.dataset.lang);
      location.reload();
      return;
    }
    C.setLang(b.dataset.lang);
  });
  document.addEventListener('lm:lang', function (e) {
    lang = e.detail.lang;
    walk(document.body);
    markButtons();
  });

  walk(document.body);
  markButtons();
  window.LaMaisonLingua = { t: function (s) { return lang === 'en' ? (t(s) || s) : s; }, lang: function () { return lang; } };
})();

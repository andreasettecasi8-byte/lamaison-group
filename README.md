# LA MAISON GROUP — sito statico per GitHub Pages

HTML, CSS e JavaScript puro, senza framework.

## Struttura
```
index.html          Home
chi-siamo.html      Chi siamo
affitti-brevi.html  Affitti brevi
affitti-tradizionali.html Affitti a lungo termine
vendita.html        Tutti gli immobili in vendita
progetti.html       Tutti i progetti
privacy.html        Privacy Policy (bozza da verificare)
cookie.html         Cookie Policy (bozza da verificare)
contatti.html       Contatti + modulo (Formspree)
valutazione.html    Richiesta di valutazione immobile + modulo (Formspree)
recensioni.html     Recensioni + modulo "Lascia una recensione" (Formspree)
css/style.css       Stile (colori, font, spaziature in :root)
js/main.js          Menu, header, animazioni, pulsante WhatsApp
js/render.js        Crea le schede leggendo i file in data/
js/content.js       Applica testi, foto e link salvati in data/pagine/
js/forms.js         Invio dei moduli a Formspree
data/vendita.json   Immobili in vendita
data/affitti-brevi.json  Immobili in affitto breve
data/affitti-lungo.json  Immobili in affitto a lungo termine
immobile.html       Scheda del singolo immobile (immobile.html?c=categoria&id=codice)
js/scheda.js        Crea la scheda dell'immobile: galleria, dettagli, descrizione
js/prenota.js       Calendario e richiesta di preventivo per gli affitti brevi
js/mappa.js         Mappa delle province (Home)
css/fonts.css, fonts/  Caratteri ospitati nel sito (nessun collegamento a Google Fonts)
robots.txt          Istruzioni per i motori di ricerca
strumenti/sitemap.py  Crea sitemap.xml con pagine e immobili (serve il dominio)
data/province.json  Confini delle province (fonte ISTAT, semplificati)
data/progetti.json  Progetti e ristrutturazioni (con foto prima/dopo)
data/recensioni.json Recensioni
data/pagine/        Testi e foto di ogni pagina (modificabili da /admin)
data/pagine/comune.json Menu, footer, logo e numeri WhatsApp (uguali su tutte le pagine)
data/admin.json     Accesso all'area riservata (token cifrato con la password)
js/editor.js        Area riservata: modifica dalle pagine (si carica solo quando serve)
css/editor.css      Stile dell'area riservata
server.py           Server per il Mac: mostra il sito e salva le modifiche
img/                Foto in WebP (sotto i 300 KB) e logo
                    (foto di esempio da Unsplash, licenza Unsplash: uso gratuito anche commerciale)
```

## Vedere il sito sul Mac
Doppio clic su **Avvia sito.command** (oppure da Terminale: `python3 server.py`).
Si apre http://localhost:8090. I file JSON si leggono solo tramite il server,
non con doppio clic su index.html.

## Vedere il sito da iPhone (stessa Wi-Fi del Mac)
Doppio clic su **Avvia sito (anche iPhone).command**: nella finestra compare l'indirizzo
da aprire in Safari sull'iPhone (es. http://192.168.1.58:8090). Mac e iPhone devono essere
sulla stessa rete Wi-Fi. Da iPhone il sito si guarda soltanto: le modifiche si salvano dal Mac.

## Area riservata: modificare il sito dalle pagine
In fondo a ogni pagina c'è il link **Area riservata** (oppure aggiungi `#admin` all'indirizzo).

**Primo accesso:** scegli la password (almeno 10 caratteri). Non si può recuperare:
se la dimentichi, svuota `data/admin.json` (scrivi solo `{}`) e creane una nuova.

**In modalità modifica** (funziona su telefono e computer):
- Clicca su qualsiasi testo con il bordo tratteggiato e scrivi: titoli, testi, pulsanti,
  menu, footer, telefoni, email. Il menu è uguale su tutte le pagine: lo cambi una volta sola.
- Seleziona delle parole e usa **A** (oro), **B** (grassetto) o **T̸** (togli) nella barra in basso.
- Foto: **Cambia foto** e **Descrizione** sopra ogni foto. Il logo si cambia cliccandoci sopra.
  Le foto vengono ridotte e convertite in automatico, così il sito resta veloce da telefono.
- Immobili, progetti, recensioni: **Modifica**, frecce per l'ordine, cestino per eliminare,
  **+ Aggiungi** sotto le schede. Le recensioni con "Pubblicata" spenta restano visibili
  solo a te (sbiadite) e non ai visitatori.
- **Carica nuovo immobile** (pagine Vendita, Affitti brevi, Affitti a lungo termine) e
  **Carica nuovo progetto** (pagina Progetti): si apre la scheda da compilare con titolo,
  posizione, prezzo o canone, caratteristiche, dotazioni, foto e descrizione. Ogni immobile
  ha la sua pagina pubblica, che si apre cliccando la scheda. "Visibile sul sito" spento
  lo nasconde ai visitatori (es. quando è venduto o affittato) senza cancellarlo.
  Nelle pagine Affitti la sezione con gli immobili compare solo quando ce n'è almeno uno.
- **Mappa "Dove operiamo"** (Home): in modifica clicca una provincia per evidenziarla o toglierla.
- **Affitti brevi:** non c'è prezzo. Gli ospiti scelgono arrivo e partenza sul calendario
  (nella pagina Affitti brevi e nella scheda di ogni immobile) e la richiesta di preventivo
  arriva per email con date, notti e numero di ospiti. "Notti minime" dell'immobile viene rispettato.
- **Impostazioni** (ingranaggio): titolo e descrizione per Google della pagina, numeri WhatsApp,
  cambio password e collegamento a GitHub.
- Cambia pagina dal menu in basso a sinistra (in modifica i link non portano altrove).
- **Salva** (o Cmd+S) pubblica le modifiche. **Esci** torna al sito normale.

**Dove finiscono le modifiche**
- Sul Mac (Avvia sito.command): nei file di questa cartella.
- Online su GitHub Pages: su GitHub con un unico salvataggio; il sito si aggiorna in 1-2 minuti.
  Serve una volta sola il collegamento: Area riservata → Impostazioni → "Cambia password o
  collegamento GitHub", con il nome del repository (es. `andreasettecasi/lamaisongroup`) e un token:
  GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens →
  accesso solo al repository del sito, permesso **Contents: Read and write**.

**Sicurezza:** il token GitHub è salvato in `data/admin.json` cifrato con la tua password:
senza password nessuno può usarlo. Usa una password lunga e non riutilizzata altrove.

## Contenuti su Supabase
Con Supabase collegato, testi (IT/EN), immobili, progetti e recensioni stanno nella tabella
`contenuti` (una riga per file, colonna `percorso` = es. `data/vendita.json`) e le nuove foto
nello spazio di archiviazione `foto`. Le modifiche dall'area riservata si vedono subito.
I file in `data/` restano come **copia di riserva**: se Supabase non risponde il sito usa quelli
(con i contenuti com'erano al momento del collegamento).

1. Crea il progetto su supabase.com (piano gratuito, regione Europa).
2. SQL Editor → incolla `supabase/setup.sql`, cambia l'email nell'ultima riga, premi Run.
3. Authentication → Users → Add user → stessa email e una password (spunta "Auto Confirm User").
   In Authentication → Sign In / Providers disattiva "Allow new users to sign up".
4. In `js/dati.js` inserisci `SUPABASE_URL` e la chiave pubblica `SUPABASE_KEY`
   (Project Settings → API). Mai la chiave secret / service_role.
5. Area riservata → entra con email e password: al primo accesso i contenuti vengono copiati
   su Supabase. Da Impostazioni → "Password e copia di sicurezza" puoi scaricarli tutti in un file.

Senza `SUPABASE_URL` il sito funziona come prima (file in `data/` e salvataggio su GitHub).

## Aggiungere contenuti a mano (senza area riservata)
Immobili in `data/vendita.json`, progetti in `data/progetti.json`, recensioni in
`data/recensioni.json`, testi delle pagine in `data/pagine/`.

## Collegare i moduli a Formspree
Modulo contatti: già collegato a `https://formspree.io/f/mppwrybn` (attributo `data-endpoint` del form in contatti.html).
Modulo valutazione (valutazione.html): stesso indirizzo Formspree; l'email arriva con oggetto "Richiesta di valutazione: <tipologia> a <comune>".
Modulo recensioni: usa lo stesso indirizzo, impostato in `js/forms.js`.

1. Su formspree.io crea un modulo con l'email lamaisongroup@outlook.it.
2. Copia l'indirizzo del modulo (es. `https://formspree.io/f/abcdwxyz`).
3. Incollalo in `js/forms.js`, alla riga `var FORMSPREE_ENDPOINT = '...'`.
Lo stesso indirizzo serve a entrambi i moduli: l'oggetto dell'email dice se è una
richiesta di contatto o una recensione ("Nuova recensione dal sito (da approvare)").
Per usare due moduli Formspree separati, aggiungi `data-endpoint="https://formspree.io/f/..."`
al `<form>` della pagina recensioni.

Recensioni: arrivano per email. Se va bene, aggiungila dall'area riservata (+ Aggiungi recensione).

## Prima di pubblicare
- Sostituire le voci con `"esempio": true` in data/ (immobili, progetti e recensioni di esempio).
- Collegare l'area riservata a GitHub (Impostazioni → collegamento GitHub).
- Dominio: **www.lamaison-group.it** (file CNAME già pronto per GitHub Pages; va configurato il DNS
  presso chi ha registrato il dominio). Dopo aver caricato immobili veri:
  `python3 strumenti/sitemap.py https://www.lamaison-group.it`, poi Google Search Console → invia la sitemap.
- Far verificare Privacy Policy e Cookie Policy a un consulente (sono bozze basate su come funziona il sito).
- Rivedere i testi di Chi siamo e Affitti a lungo termine (scritti come punto di partenza, si cambiano dall'area riservata).
- Social: Area riservata → Impostazioni → link Facebook e Instagram (le icone compaiono da sole).
- Numero svizzero: Area riservata → Impostazioni → togli la spunta "Mostra il numero svizzero".

## Statistiche delle visite (Umami, senza cookie)

- `js/statistiche.js` conta visite e clic importanti (Chiamata, WhatsApp, Email, Affida il tuo immobile,
  Richiedi valutazione, Scheda immobile aperta, Alloggio scelto, Modulo inviato) con Umami Cloud.
- Si accende solo quando in **Area riservata → Impostazioni → Statistiche** c'è il *Website ID* di Umami,
  e solo sul sito pubblicato (sul Mac e sulla rete di casa non conta nulla). Le visite di chi è
  nell'area riservata non vengono contate.
- Con l'ID inserito, in Privacy e Cookie Policy compaiono da soli i paragrafi sulle statistiche
  (`data-optional="statistiche"`); senza ID resta la frase "il sito non usa strumenti di statistica".
- Il pulsante **Statistiche** nella barra dell'area riservata mostra il pannello di Umami
  (serve lo *Share URL* nelle stesse impostazioni).

## Versione inglese (cambio lingua in tempo reale)

- In alto c'è il selettore **IT | EN** (sul telefono un pulsante con l'altra lingua; nel menù "Italiano / English").
  La pagina cambia lingua subito, senza ricaricarsi; la scelta viene ricordata (localStorage, strumento tecnico).
- Prima visita: chi ha il browser in italiano vede l'italiano, gli altri l'inglese. Il link `?lang=en` apre il sito in inglese.
  Google indicizza l'italiano; le pagine dichiarano la versione inglese con `hreflang`.
- Testi inglesi: `data/pagine/en/<pagina>.json` e `data/pagine/en/comune.json` (menu e footer).
  Ciò che manca nei file inglesi si vede in italiano. Le impostazioni del sito (`comune.json → sito`) valgono per entrambe le lingue.
- Scritte fisse (voci dei menu a tendina, calendario, messaggi, schede): dizionario in `js/lingua.js`.
- Area riservata: con il sito in inglese si modificano i testi inglesi (badge "Modifica · EN"); foto, immobili e impostazioni sono in comune.
  Immobili e progetti hanno i campi facoltativi "Titolo in inglese" e "Descrizione in inglese".
- Le email dei moduli restano in italiano; se il cliente ha usato l'inglese l'oggetto finisce con **[EN]** e c'è il campo "lingua".

## Prima di pubblicare una modifica a CSS o JavaScript
Lancia `python3 strumenti/versione.py`: aggiorna il numero di versione (`?v=…`) dei file nelle pagine,
così telefoni e computer scaricano subito la versione nuova invece di quella rimasta in memoria.

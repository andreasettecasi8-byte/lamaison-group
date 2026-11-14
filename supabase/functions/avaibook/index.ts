// LA MAISON GROUP — legge un alloggio dal motore di prenotazione AvaiBook (bookonline.pro)
// per l'area riservata. Il browser non può leggere direttamente bookonline.pro: questa funzione
// lo fa al suo posto e restituisce titolo, luogo, descrizione, ospiti, camere, letti, bagni,
// dotazioni, codice CIN e i link delle foto (le foto le scarica poi il browser).
// Si installa da Supabase → Edge Functions → Deploy a new function → Via editor,
// con il nome "AvaiBook", con la A e la B maiuscole (lascia attiva l'opzione "Verify JWT").

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// es. https://bookonline.pro/it/property/409168 (anche con "//" doppi)
const LINK = /^https?:\/\/(?:www\.)?bookonline\.pro\/+(?:[a-z]{2}\/+)?property\/+(\d+)/i;

// dotazioni AvaiBook → dotazioni del sito (le altre non si importano)
const FEATURES: Record<string, string> = {
  wifi: "Wi-Fi", internet: "Wi-Fi", lavadora: "Lavatrice", lavavajillas: "Lavastoviglie", ac: "Aria condizionata",
  aire_acondicionado: "Aria condizionata", balcon: "Balcone", terraza: "Terrazzo", jardin: "Giardino",
  ascensor: "Ascensore", parking: "Posto auto", aparcamiento: "Posto auto", garaje: "Box auto", garage: "Box auto",
  mascotas: "Animali ammessi", admite_mascotas: "Animali ammessi", acceso_minusvalidos: "Accessibile ai disabili",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// La pagina è fatta con Next.js: i dati sono dentro self.__next_f.push([1, "..."]).
function flightData(page: string) {
  let out = "";
  const re = /self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g;
  for (const m of page.matchAll(re)) {
    try { const a = JSON.parse(m[1]); if (typeof a[1] === "string") out += a[1]; } catch { /* pezzo non leggibile */ }
  }
  return out;
}
// oggetto JSON che inizia in "start" (conta le graffe, saltando quelle dentro le stringhe)
function objectAt(s: string, start: number) {
  let depth = 0, inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === "\\") i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(s.slice(start, i + 1));
  }
  return null;
}
const lang = (v: Record<string, string> | null | undefined, l: string) => String((v && v[l]) || "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { link } = await req.json();
    const m = String(link || "").trim().match(LINK);
    if (!m) return reply({ error: "link non valido" }, 400);
    const res = await fetch("https://bookonline.pro/it/property/" + m[1], {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LaMaisonGroup/1.0)", "Accept-Language": "it" },
    });
    if (!res.ok) return reply({ error: "AvaiBook ha risposto " + res.status }, 502);
    const data = flightData(await res.text());
    const at = data.indexOf('{"accommodation":');
    const p = at >= 0 ? objectAt(data, at) : null;
    if (!p || !p.accommodation) return reply({ error: "alloggio non trovato" }, 404);

    const acc = p.accommodation, c = p.content || {};
    const amount = (code: string) => {
      const a = (c.amenities || []).find((x: { code: string }) => x.code === code);
      return a && a.amount != null ? Number(a.amount) : null;
    };
    // camere: dalla disposizione delle stanze (il totale di AvaiBook conta anche il soggiorno con divano letto)
    const rooms = (c.distribution || []).filter((d: { tipo_dormitorio?: string }) => d.tipo_dormitorio === "DORMITORIO").length;
    const unit = (p.accommodationUnits || [])[0] || {};
    const guests = Number(unit.capacity || 0) + Number(unit.additionalCapacity || 0);
    const features = [...new Set((c.amenities || []).map((a: { code: string }) => FEATURES[a.code]).filter(Boolean))];
    const photos = (p.images || []).map((i: Record<string, string>) => i.url_w1280 || i.url_compress).filter(Boolean);

    return reply({
      id: m[1],
      titolo: lang(c.tradeName, "it") || String(acc.name || "").trim(),
      nome: String(acc.name || "").trim(),
      citta: String(acc.city || "").trim(),
      indirizzo: String(acc.address || "").trim(),
      descrizione: lang(c.description, "it").replace(/\r/g, ""),
      descrizione_en: lang(c.description, "en").replace(/\r/g, ""),
      titolo_en: lang(c.tradeName, "en"),
      ospiti: guests || null,
      camere: rooms || amount("n_hab"),
      letti: amount("n_camas"),
      bagni: amount("n_banos"),
      caratteristiche: features,
      cin: String(c.nationalAccommodationITId || "").trim(),
      foto: photos,
    });
  } catch (e) {
    return reply({ error: String(e) }, 500);
  }
});

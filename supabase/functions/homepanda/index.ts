// LA MAISON GROUP — legge un annuncio di homepanda.it per l'area riservata.
// Il browser non può leggere direttamente homepanda.it: questa funzione lo fa al suo posto
// e restituisce titolo, comune, prezzo, mq, locali, bagni, classe energetica, descrizione e foto.
// Si installa da Supabase → Edge Functions → Deploy a new function → Via editor,
// con il nome "homepanda" (lascia attiva l'opzione "Verify JWT").

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const LINK = /^https:\/\/www\.homepanda\.it\/cerca-casa\/[^?#]+\/(\d+)\/?$/;

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function unescape(s: string) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function meta(page: string, prop: string) {
  const m = page.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`));
  return m ? unescape(m[1]).trim() : "";
}
const number = (v = "") => { const d = v.replace(/[^\d]/g, ""); return d ? Number(d) : null; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { link } = await req.json();
    if (!LINK.test(String(link || "").trim())) return reply({ error: "link non valido" }, 400);
    const res = await fetch(String(link).trim(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaMaisonGroup/1.0; +https://www.lamaison-group.it)" } });
    if (!res.ok) return reply({ error: "HomePanda ha risposto " + res.status }, 502);
    const page = await res.text();
    const body = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
    const lines = unescape(body.replace(/<[^>]+>/g, "\n")).split("\n").map((l) => l.trim()).filter(Boolean);
    // nella scheda HomePanda il valore viene prima dell'etichetta: "80" poi "Mq"
    const before = (label: string) => { const i = lines.slice(0, 60).indexOf(label); return i > 0 ? lines[i - 1] : ""; };
    const after = (label: string) => { const i = lines.indexOf(label); return i >= 0 ? lines[i + 1] || "" : ""; };
    const titolo = meta(page, "og:title").replace(/\s*[—|-]\s*Homepanda\s*$/i, "").replace(/\s+/g, " ").trim();
    if (!titolo) return reply({ error: "annuncio non trovato" }, 404);
    const start = lines.findIndex((l) => l.replace(/\s+/g, " ") === titolo);
    const desc: string[] = [];
    const d = lines.indexOf("Descrizione");
    if (d >= 0) for (const l of lines.slice(d + 1)) {
      if (l === "Prestazione energetica" || l === "Richiedi informazioni su questo immobile") break;
      desc.push(l);
    }
    const image = meta(page, "og:image");
    const classe = after("Classe");
    return reply({
      titolo,
      comune: start >= 0 ? lines[start + 1] || "" : "",
      prezzo: number(before("Prezzo")),
      mq: number(before("Mq")),
      locali: number(before("Locali")),
      bagni: number(before("Servizi")),
      classe_energetica: classe.length <= 3 ? classe : "",
      descrizione: desc.join("\n\n"),
      foto: image ? image.replace(/\/HP\/\d+x\d+\//, "/HP/1600x900/") : "",
    });
  } catch (e) {
    return reply({ error: String(e) }, 500);
  }
});

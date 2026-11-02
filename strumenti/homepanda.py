#!/usr/bin/env python3
"""LA MAISON GROUP — legge gli annunci HomePanda collegati agli immobili in vendita.

    python3 strumenti/homepanda.py

Per ogni immobile della pagina Vendita con il campo "homepanda" (il link all'annuncio
su homepanda.it, inserito dall'area riservata) scarica titolo, comune, prezzo, mq, locali,
bagni, classe energetica, descrizione e la foto principale, e scrive data/homepanda.json.
La foto viene salvata in img/homepanda/ (accordo con HomePanda): così resta anche quando
l'annuncio viene tolto dal loro sito dopo la vendita.
Su GitHub gira da solo ogni ora (.github/workflows/homepanda.yml).
"""
import datetime
import html
import io
import json
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'homepanda.json')
IMG = os.path.join(ROOT, 'img', 'homepanda')
UA = 'Mozilla/5.0 (compatible; LaMaisonGroup/1.0; +https://www.lamaison-group.it)'
LINK = re.compile(r'^https://www\.homepanda\.it/cerca-casa/[^?#]+/(\d+)/?$')


def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=30).read()
    return data if binary else data.decode('utf-8', 'replace')


def listings():
    try:
        src = open(os.path.join(ROOT, 'js', 'dati.js'), encoding='utf-8').read()
        url = re.search(r"SUPABASE_URL = '([^']+)'", src).group(1)
        key = re.search(r"SUPABASE_KEY = '([^']+)'", src).group(1)
        req = urllib.request.Request(url + '/rest/v1/contenuti?select=dati&percorso=eq.data/vendita.json', headers={'apikey': key})
        rows = json.load(urllib.request.urlopen(req, timeout=20))
        if rows:
            return rows[0]['dati'].get('immobili', [])
    except Exception as e:
        print('Supabase non raggiungibile, uso il file:', e)
    return json.load(open(os.path.join(ROOT, 'data', 'vendita.json'), encoding='utf-8')).get('immobili', [])


def meta(page, prop):
    m = re.search(r'<meta (?:property|name)="%s" content="([^"]*)"' % re.escape(prop), page)
    return html.unescape(m.group(1)).strip() if m else ''


def text_lines(page):
    body = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    body = html.unescape(re.sub(r'<[^>]+>', '\n', body))
    return [l.strip() for l in body.split('\n') if l.strip()]


def value_before(lines, label):
    """Nella scheda HomePanda il valore viene prima dell'etichetta: "80" poi "Mq"."""
    for i, l in enumerate(lines[:60]):
        if l == label and i:
            return lines[i - 1]
    return ''


def value_after(lines, label):
    for i, l in enumerate(lines):
        if l == label and i + 1 < len(lines):
            return lines[i + 1]
    return ''


def number(v):
    digits = re.sub(r'[^\d]', '', v or '')
    return int(digits) if digits else None


def save_photo(url, code):
    from PIL import Image  # installato dal workflow
    os.makedirs(IMG, exist_ok=True)
    im = Image.open(io.BytesIO(get(url, binary=True))).convert('RGB')
    paths = {}
    for suffix, width in (('', 1600), ('-800', 800)):
        copy = im.copy()
        copy.thumbnail((width, width))
        name = 'img/homepanda/%s%s.webp' % (code, suffix)
        copy.save(os.path.join(ROOT, name), 'WEBP', quality=80, method=6)
        paths[suffix or 'base'] = name
    return paths['base']


def read(url, code, previous=None):
    page = get(url)
    lines = text_lines(page)
    title = re.sub(r'\s*[—|-]\s*Homepanda\s*$', '', meta(page, 'og:title'), flags=re.I)
    title = re.sub(r'\s+', ' ', title).strip()
    if not title:
        raise ValueError('annuncio senza titolo (forse è stato tolto)')
    # titolo, comune e via sono le prime righe della scheda
    same = [i for i, l in enumerate(lines) if re.sub(r'\s+', ' ', l) == title]
    start = same[0] if same else 0
    comune = lines[start + 1] if start + 1 < len(lines) else ''
    price = number(value_before(lines, 'Prezzo'))
    desc_lines = []
    if 'Descrizione' in lines:
        for l in lines[lines.index('Descrizione') + 1:]:
            if l in ('Prestazione energetica', 'Richiedi informazioni su questo immobile'):
                break
            desc_lines.append(l)
    image = meta(page, 'og:image')
    big = re.sub(r'/HP/\d+x\d+/', '/HP/1600x900/', image) if image else ''
    return {
        'titolo': title,
        'comune': comune,
        'prezzo': price,
        'mq': number(value_before(lines, 'Mq')),
        'locali': number(value_before(lines, 'Locali')),
        'bagni': number(value_before(lines, 'Servizi')),
        'classe_energetica': value_after(lines, 'Classe') if len(value_after(lines, 'Classe')) <= 3 else '',
        'descrizione': '\n\n'.join(desc_lines),
        # la foto si riscarica solo se su HomePanda è cambiata
        'foto': (previous['foto'] if previous and previous.get('foto_origine') == (big or image) and os.path.exists(os.path.join(ROOT, previous.get('foto', '')))
                 else save_photo(big or image, code)) if (big or image) else '',
        'foto_origine': big or image,
    }


def main():
    old = {}
    if os.path.exists(OUT):
        old = json.load(open(OUT, encoding='utf-8')).get('annunci', {})
    result = {}
    for p in listings():
        url = str(p.get('homepanda') or '').strip()
        m = LINK.match(url)
        if not m:
            continue
        code = m.group(1)
        if p.get('stato_vendita') == 'Venduto' and code in old:
            result[code] = old[code]  # venduto: i dati restano quelli salvati, non si scarica più nulla
            continue
        try:
            data = read(url, code, old.get(code))
            data['link'] = url
            result[code] = data
            print('%s: %s, %s' % (code, data['titolo'], data['prezzo']))
        except Exception as e:
            # annuncio tolto o sito non raggiungibile: si tengono i dati già salvati
            if code in old:
                result[code] = old[code]
            print('%s: non leggibile (%s)' % (code, e))
    if result == old and os.path.exists(OUT):
        print('Nessuna novità.')
        return
    data = {'aggiornato': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes'), 'annunci': result}
    open(OUT, 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print('data/homepanda.json aggiornato: %d annunci.' % len(result))


if __name__ == '__main__':
    main()

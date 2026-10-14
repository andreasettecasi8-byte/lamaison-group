#!/usr/bin/env python3
"""LA MAISON GROUP — crea sitemap.xml e aggiorna robots.txt.

    python3 strumenti/sitemap.py https://www.tuodominio.it

Da rilanciare quando cambia il dominio o dopo aver aggiunto molti immobili
(le pagine fisse sono sempre incluse; gli immobili vengono letti da data/).
"""
import datetime
import json
import os
import re
import sys
import urllib.request
from urllib.parse import quote
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [('index.html', '1.0'), ('chi-siamo.html', '0.7'), ('affitti-brevi.html', '0.9'),
         ('affitti-tradizionali.html', '0.9'), ('vendita.html', '0.9'), ('valutazione.html', '0.8'), ('progetti.html', '0.7'),
         ('recensioni.html', '0.6'), ('contatti.html', '0.8'), ('privacy.html', '0.2'), ('cookie.html', '0.2')]
CATEGORIES = ['vendita', 'affitti-lungo', 'affitti-brevi']

if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
    sys.exit('Uso: python3 strumenti/sitemap.py https://www.tuodominio.it')
base = sys.argv[1].rstrip('/') + '/'
today = datetime.date.today().isoformat()

urls = [(base + ('' if p == 'index.html' else p), prio) for p, prio in PAGES]
def supabase():
    # Gli immobili veri stanno su Supabase (js/dati.js): se risponde si usano quelli
    try:
        src = open(os.path.join(ROOT, 'js', 'dati.js'), encoding='utf-8').read()
        url = re.search(r"SUPABASE_URL = '([^']+)'", src).group(1)
        key = re.search(r"SUPABASE_KEY = '([^']+)'", src).group(1)
        req = urllib.request.Request(url + '/rest/v1/contenuti?select=percorso,dati&percorso=like.data/*.json', headers={'apikey': key})
        return {r['percorso']: r['dati'] for r in json.load(urllib.request.urlopen(req, timeout=10))}
    except Exception:
        return {}

remote = supabase()
for cat in CATEGORIES:
    path = os.path.join(ROOT, 'data', cat + '.json')
    data = remote.get('data/%s.json' % cat)
    if data is None:
        if not os.path.exists(path):
            continue
        data = json.load(open(path, encoding='utf-8'))
    for item in data.get('immobili', []):
        if item.get('id') and item.get('pubblicata') is not False and not item.get('esempio'):
            urls.append((base + 'immobile.html?c=%s&id=%s' % (cat, quote(item['id'])), '0.8'))

xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url, prio in urls:
    xml.append('  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>' % (escape(url), today, prio))
xml.append('</urlset>')
open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(xml) + '\n')

robots_path = os.path.join(ROOT, 'robots.txt')
lines = [l for l in open(robots_path, encoding='utf-8').read().splitlines() if not l.lower().startswith('sitemap:')]
lines.append('Sitemap: ' + base + 'sitemap.xml')
open(robots_path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('sitemap.xml: %d indirizzi. robots.txt aggiornato.' % len(urls))

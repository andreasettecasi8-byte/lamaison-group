#!/usr/bin/env python3
"""LA MAISON GROUP — numera le versioni di CSS e JavaScript nelle pagine.

Aggiunge a ogni <link href="css/…"> e <script src="js/…"> un "?v=" calcolato
dal contenuto del file: quando un file cambia, cambia anche il suo indirizzo e
telefoni e computer scaricano subito la versione nuova invece di quella in memoria.
Da lanciare prima di ogni pubblicazione:  python3 strumenti/versione.py
"""
import glob, hashlib, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def version(path):
    with open(os.path.join(ROOT, path), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]

def fix(match):
    attr, path = match.group(1), match.group(2)
    if not os.path.exists(os.path.join(ROOT, path)):
        return match.group(0)
    return '%s="%s?v=%s"' % (attr, path, version(path))

changed = 0
for page in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    with open(page, encoding='utf-8') as f:
        text = f.read()
    new = re.sub(r'(href|src)="((?:css|js)/[a-z0-9-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"', fix, text)
    if new != text:
        with open(page, 'w', encoding='utf-8') as f:
            f.write(new)
        changed += 1
print('pagine aggiornate:', changed)

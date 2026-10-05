#!/usr/bin/env python3
"""LA MAISON GROUP — server per vedere e modificare il sito sul Mac.

    python3 server.py            (oppure doppio clic su "Avvia sito.command")

Apre il sito su http://localhost:8090. In modalità modifica le modifiche vengono
salvate direttamente nei file di questa cartella. Online (GitHub Pages) questo file
non serve: lì le modifiche vengono salvate su GitHub.
"""
import base64
import json
import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
PORT = int(ARGS[0]) if ARGS else 8090
# --rete: il sito si vede anche da telefono/tablet sulla stessa Wi-Fi (solo lettura:
# le modifiche si salvano soltanto dal Mac)
NETWORK = '--rete' in sys.argv
# Solo questi file possono essere scritti dalla modalità modifica
ALLOWED = re.compile(r'^(data/(pagine/(en/)?)?[a-z0-9_-]+\.json|img/[a-z0-9_-]+\.(webp|jpe?g|png))$')
MAX_BODY = 60 * 1024 * 1024


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.split('?')[0].endswith('.json'):
            self.send_header('Cache-Control', 'no-store')
        else:
            # il browser (anche su iPhone) ricontrolla sempre i file: si vedono subito le modifiche
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def trusted(self):
        # Accetta solo richieste dal sito stesso (non da altri siti aperti nel browser)
        origin = self.headers.get('Origin')
        host = self.headers.get('Host', '')
        return (self.headers.get('X-LaMaison-Admin') == '1'
                and (origin is None or origin in ('http://' + host,)))

    def from_this_mac(self):
        return self.client_address[0] in ('127.0.0.1', '::1', '::ffff:127.0.0.1')

    def do_GET(self):
        if self.path == '/__admin/ping':
            return self.send_json(200, {'local': self.from_this_mac()})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/__admin/save':
            return self.send_json(404, {'error': 'not found'})
        if not self.trusted() or not self.from_this_mac():
            return self.send_json(403, {'error': 'forbidden'})
        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0 or length > MAX_BODY:
            return self.send_json(413, {'error': 'too large'})
        try:
            files = json.loads(self.rfile.read(length))['files']
            for f in files:
                if not ALLOWED.match(f['path']):
                    return self.send_json(400, {'error': 'percorso non permesso: ' + f['path']})
            for f in files:
                target = os.path.join(ROOT, f['path'])
                os.makedirs(os.path.dirname(target), exist_ok=True)
                tmp = target + '.tmp'
                with open(tmp, 'wb') as out:
                    out.write(base64.b64decode(f['content']))
                os.replace(tmp, target)
        except (ValueError, KeyError, TypeError) as err:
            return self.send_json(400, {'error': str(err)})
        return self.send_json(200, {'ok': True, 'saved': [f['path'] for f in files]})

    def log_message(self, fmt, *args):
        if self.command == 'POST':
            super().log_message(fmt, *args)


class Server(ThreadingHTTPServer):
    # il browser chiede molti file insieme: una coda più lunga evita connessioni rifiutate
    request_queue_size = 128
    daemon_threads = True


if __name__ == '__main__':
    server = Server(('0.0.0.0' if NETWORK else '127.0.0.1', PORT), partial(Handler, directory=ROOT))
    print('Sito:  http://localhost:%d' % PORT)
    if NETWORK:
        import socket
        try:
            probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            probe.connect(('192.168.0.1', 1))
            print('Da iPhone (stessa Wi-Fi):  http://%s:%d' % (probe.getsockname()[0], PORT))
            probe.close()
        except OSError:
            pass
    print('Per modificare: apri il sito e clicca "Area riservata" in fondo alla pagina.')
    print('Per fermare: ctrl+C')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

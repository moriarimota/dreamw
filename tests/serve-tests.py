"""Local test pages only; never serves player saves or the project root."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        target = (ROOT / path.lstrip('/')).resolve()
        if not any(target.is_relative_to(ROOT / part) for part in ('game', 'tests')):
            self.send_error(403)
            return
        if target.suffix not in ('.html', '.js', '.css', '.png', '.svg', '.webmanifest'):
            self.send_error(403)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 18766), Handler).serve_forever()

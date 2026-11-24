"""Optional one-way local letter inbox for Dangdang v3. No network or AI calls."""
import json
import re
import time
from pathlib import Path


class Inbox:
    def __init__(self, outbox, receipts, clock=time.time):
        self.outbox, self.receipts, self.clock = Path(outbox), Path(receipts), clock
        self.seen = []
        if self.receipts.exists():
            data = json.loads(self.receipts.read_text(encoding='utf-8'))
            if not isinstance(data, list) or any(not isinstance(x, str) for x in data):
                raise ValueError('Invalid receipts')
            self.seen = data[-100:]

    def next(self):
        if not self.outbox.exists() or self.outbox.stat().st_size > 50000:
            return None
        data = json.loads(self.outbox.read_text(encoding='utf-8'))
        if data.get('version') != 1 or not isinstance(data.get('notes'), list):
            return None
        for note in data['notes'][-20:]:
            if not isinstance(note, dict):
                continue
            ident, text, stamp = note.get('id'), note.get('text'), note.get('at')
            if (isinstance(ident, str) and re.fullmatch(r'[a-zA-Z0-9-]{16,80}', ident)
                    and ident not in self.seen and note.get('source') == 'dreamw-life'
                    and isinstance(text, str) and 0 < len(text.strip()) <= 300
                    and isinstance(stamp, (int, float)) and 0 <= self.clock() * 1000 - stamp < 86400000):
                return note
        return None

    def acknowledge(self, ident):
        seen = (self.seen + [ident])[-100:]
        tmp = self.receipts.with_suffix('.tmp')
        tmp.write_text(json.dumps(seen), encoding='utf-8')
        tmp.replace(self.receipts)
        self.seen = seen


def attach_dreamw(pet):
    """Opt-in file is separate from pet config, API keys and life-state."""
    config = Path(pet.base_dir) / 'dreamw-link.json'
    if not config.exists():
        return
    try:
        settings = json.loads(config.read_text(encoding='utf-8'))
        if settings.get('enabled') is not True:
            return
        inbox = Inbox(settings['outbox'], Path(pet.base_dir) / 'dreamw-receipts.json')
    except (OSError, ValueError, KeyError, TypeError):
        return
    from PyQt6.QtCore import QTimer
    timer = QTimer(pet)
    def poll():
        if (not pet.isVisible() or pet.bubble.isVisible() or getattr(pet, '_chat_busy', False)
                or getattr(pet, '_gallery_demo', False) or getattr(pet, '_dialog_depth', 0)
                or getattr(pet, '_menu_open', False) or getattr(pet, 'walking', False)):
            return
        try:
            note = inbox.next()
            if note:
                # Persist before display; process restarts cannot replay old letters.
                inbox.acknowledge(note['id'])
                pet.bubble.show_text('铛铛收到来信：\n' + note['text'], 14000)
                pet._position_bubble()
        except (OSError, ValueError, TypeError):
            pass  # A partially replaced or unavailable outbox must not stop the pet.
    timer.timeout.connect(poll)
    timer.start(4000)
    pet._dreamw_timer, pet._dreamw_inbox = timer, inbox

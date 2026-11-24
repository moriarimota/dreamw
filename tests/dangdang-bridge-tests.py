import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('dreamw_bridge', Path(__file__).resolve().parents[1] / 'integrations/dangdang/dreamw_bridge.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class InboxTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name)
        self.outbox, self.receipts = self.folder / 'outbox.json', self.folder / 'receipts.json'
        self.note = dict(id='test-letter-1234567890', at=1000000, text='梦乡便笺测试', source='dreamw-life')
        self.inbox = bridge.Inbox(self.outbox, self.receipts, clock=lambda:1000)
    def write(self, note):
        self.outbox.write_text(json.dumps(dict(version=1, notes=[note])), encoding='utf-8')
    def test_absent_is_quiet(self):
        self.assertIsNone(self.inbox.next())
    def test_receipt_survives_restart(self):
        self.write(self.note)
        self.assertEqual(self.inbox.next(), self.note)
        self.inbox.acknowledge(self.note['id'])
        self.assertIsNone(bridge.Inbox(self.outbox, self.receipts, clock=lambda:1000).next())
    def test_expired_future_invalid_notes_ignored(self):
        for changes in [dict(at=-86400000),dict(at=1000001),dict(id='bad'),dict(source='command'),dict(text='x'*301)]:
            self.write(dict(self.note, **changes))
            self.assertIsNone(self.inbox.next())

if __name__ == '__main__':
    unittest.main()

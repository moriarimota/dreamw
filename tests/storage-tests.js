'use strict';

// Run with Node. The VM has a private in-memory storage map and fake fetch;
// no real browser, personal save, localhost server, or network is accessed.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '..');
const Life = require(path.join(project, 'game/life.js'));
const storageCode = fs.readFileSync(path.join(project, 'game/storage.js'), 'utf8');
const appCode = fs.readFileSync(path.join(project, 'game/app.js'), 'utf8');
const KEY = 'witchlife-world-v2';
const results = [];

function harness({ desktop = false, raw = null, disk = null, diskStatus = 200, health = 'witchlife', brokenDiskJson = false, failWrites = false } = {}) {
  const values = new Map();
  if (raw !== null) values.set(KEY, raw);
  const writes = [];
  const requests = [];
  const context = {
    WitchLife: Life,
    location: desktop ? { hostname: '127.0.0.1', port: '18765' } : { hostname: 'example.test', port: '' },
    Date,
    JSON,
    console,
    localStorage: {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(key, String(value)); writes.push({ key, value: String(value) }); }
    },
    async fetch(url, options = {}) {
      requests.push({ url, method: options.method || 'GET', body: options.body });
      if (url === './__health') return { ok: true, status: 200, async json() { return { app: health }; } };
      if (url === './api/state' && options.method === 'PUT') return { ok: !failWrites, status: failWrites ? 503 : 200 };
      if (url === './api/state') return { ok: diskStatus >= 200 && diskStatus < 300, status: diskStatus, async json() { if (brokenDiskJson) throw new SyntaxError('fixture broken JSON'); return disk; } };
      throw new Error('Unexpected network route: ' + url);
    }
  };
  vm.runInNewContext(storageCode, context, { filename: 'storage.js' });
  return { storage: context.WitchStorage, values, writes, requests };
}

async function test(name, run) {
  try { await run(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.stack || String(error) }); }
}

function finishCallback() {
  // Exercise the actual integration callback, so changing its key generation
  // cannot silently leave a copied test implementation passing.
  const marker = 'onFinish:(winner,b)=>{';
  const offset = appCode.indexOf(marker);
  assert.notEqual(offset, -1, 'The onFinish integration callback could not be located.');
  const start = offset + marker.length;
  let depth = 1;
  let quote = '';
  let escaped = false;
  for (let i = start; i < appCode.length; i += 1) {
    const ch = appCode[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
    } else if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}' && --depth === 0) return appCode.slice(start, i);
  }
  throw new Error('The onFinish integration callback was not closed.');
}

(async () => {
  await test('首次打开网页可创建世界，读取本身不写存档', async () => {
    const h = harness();
    const state = await h.storage.load();
    assert.equal(state.version, 3);
    assert.equal(h.writes.length, 0);
    assert.equal(h.requests.length, 0);
  });
  await test('正常浏览器存档经过引擎校验恢复', async () => {
    const original = Life.create(Date.now()); original.preferences.name = '测试角色';
    const h = harness({ raw: JSON.stringify(original) });
    const state = await h.storage.load();
    assert.equal(state.preferences.name, '测试角色');
    assert.equal(h.writes.length, 0);
  });
  await test('损坏的浏览器 JSON 阻止启动并保留原始内容', async () => {
    const raw = '{this is a broken fixture';
    const h = harness({ raw });
    await assert.rejects(() => h.storage.load());
    assert.equal(h.values.get(KEY), raw);
    assert.equal(h.writes.length, 0);
  });
  await test('结构不合法的浏览器存档不会变成新世界', async () => {
    const raw = JSON.stringify({ version: 2, personalNote: 'fixture only' });
    const h = harness({ raw });
    await assert.rejects(() => h.storage.load());
    assert.equal(h.values.get(KEY), raw);
    assert.equal(h.writes.length, 0);
  });
  await test('false、0、空字符串不是缺省存档，必须拒绝', async () => {
    for (const value of [false, 0, '']) {
      const raw = JSON.stringify(value);
      const h = harness({ raw });
      await assert.rejects(() => h.storage.load(), 'Unexpected new world for ' + raw);
      assert.equal(h.values.get(KEY), raw);
      assert.equal(h.writes.length, 0);
    }
  });
  await test('桌面磁盘存档优先于较旧浏览器副本', async () => {
    const disk = Life.create(Date.now()); disk.preferences.name = '磁盘中的她';
    const stale = Life.create(Date.now()); stale.preferences.name = '旧浏览器中的她';
    const h = harness({ desktop: true, raw: JSON.stringify(stale), disk });
    const state = await h.storage.load();
    assert.equal(state.preferences.name, '磁盘中的她');
    assert.equal(h.storage.desktop, true);
    assert.equal(h.writes.length, 0);
  });
  await test('桌面读取失败不得使用旧浏览器副本覆盖磁盘', async () => {
    const raw = JSON.stringify(Life.create(Date.now()));
    const h = harness({ desktop: true, raw, diskStatus: 503 });
    await assert.rejects(() => h.storage.load());
    assert.equal(h.writes.length, 0);
    assert.equal(h.requests.filter(r => r.method === 'PUT').length, 0);
  });
  await test('桌面坏 JSON 与坏结构均保持原状并拒绝启动', async () => {
    for (const settings of [{ brokenDiskJson: true }, { disk: { version: 2 } }]) {
      const h = harness({ desktop: true, ...settings });
      await assert.rejects(() => h.storage.load());
      assert.equal(h.writes.length, 0);
      assert.equal(h.requests.filter(r => r.method === 'PUT').length, 0);
    }
  });
  await test('其他本地程序占用了端口时不会进入桌面保存模式', async () => {
    const h = harness({ desktop: true, health: 'some-other-app' });
    await assert.rejects(() => h.storage.load());
    assert.equal(h.requests.filter(r => r.url === './api/state').length, 0);
  });
  await test('明确的桌面 404 可以创建第一份存档', async () => {
    const h = harness({ desktop: true, diskStatus: 404 });
    const state = await h.storage.load();
    assert.equal(state.version, 3);
    await h.storage.save(state);
    assert.equal(h.requests.filter(r => r.method === 'PUT').length, 1);
  });
  await test('连续保存按请求时的快照有序写入', async () => {
    const h = harness({ desktop: true, diskStatus: 404 });
    const state = await h.storage.load();
    state.preferences.name = '第一次'; const first = h.storage.save(state);
    state.preferences.name = '第二次'; const second = h.storage.save(state);
    await Promise.all([first, second]);
    const puts = h.requests.filter(r => r.method === 'PUT');
    assert.deepEqual(puts.map(r => JSON.parse(r.body).preferences.name), ['第一次', '第二次']);
  });
  await test('磁盘写入失败会明确出现在保存状态中', async () => {
    const h = harness({ desktop: true, diskStatus: 404, failWrites: true });
    const state = await h.storage.load();
    await h.storage.save(state);
    assert.match(h.storage.error, /保存|磁盘/);
  });
  await test('长棋局结束记忆能通过世界存档校验且不重复添加', async () => {
    const state = Life.create(Date.now());
    const board = Array(225).fill(0);
    for (let y = 0; y < 15; y += 1) for (let x = 0; x < 15; x += 1) board[y * 15 + x] = (x + 2 * y) % 4 < 2 ? 1 : 2;
    const black = [], white = [];
    board.forEach((player, index) => (player === 1 ? black : white).push(index));
    const history = [];
    while (black.length || white.length) {
      if (black.length) history.push({ index: black.shift(), player: 1 });
      if (white.length) history.push({ index: white.shift(), player: 2 });
    }
    const finished = { version: 1, size: 15, board, turn: 'witch', winner: 'draw', lastMove: history.at(-1).index, history, outcomeNotified: true };
    let saves = 0;
    const context = { state, Date, save() { saves += 1; } };
    const callback = vm.runInNewContext('(function(winner,b){' + finishCallback() + '})', context);
    const count = state.memories.length;
    callback('draw', finished);
    callback('draw', finished);
    assert.equal(state.memories.length, count + 1);
    assert.ok(state.memories.at(-1).key.length <= 100);
    assert.equal(Life.validate(state, Date.now()).board.board.length, 225);
    assert.equal(saves, 2);
  });
  for (const result of results) {
    console.log((result.ok ? 'PASS ' : 'FAIL ') + result.name);
    if (!result.ok) console.error(result.error);
  }
  const failed = results.filter(result => !result.ok).length;
  console.log(`${results.length - failed}/${results.length} storage and integration tests passed.`);
  process.exitCode = failed ? 1 : 0;
})();

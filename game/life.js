/* 那边的小日子 — local, finite life rules. No network or model calls. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WitchLife = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MINUTE = 60000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;
  const LIMITS = Object.freeze({ text: 600, fragments: 240, creations: 120, memories: 80, fileBytes: 1500000 });
  const BOOKS = [
    { id: 'moss', title: '苔藓邮差的旅行簿', chapters: [
      ['没有地址的信', '苔藓邮差出门前，总要把口袋翻过来。漏掉的种子比漏掉的信更多，但他觉得这也算一种投递。'],
      ['雨停以前', '渡口的屋檐住着一滴不肯落下的雨。邮差陪它等了半天，才知道它正在练习倒映月亮。'],
      ['借来的鞋', '蜗牛借走了他的靴子，说要去很远的地方。第三天，邮差在门槛另一头看见了它。那确实是一次远行。'],
      ['夜航灯', '河水把岸上的灯揉碎，又认真拼回去。邮差决定今晚不赶路了，他想看看拼错的那一盏。'],
      ['一封空白信', '信里没有字，只有一片干燥的叶子。他把叶子泡在水里，整间屋子慢慢有了春天的气味。'],
      ['明天的路', '他终于送完了最后一封信。回家路上，有人问明天还出门吗。邮差指了指鼓起来的种子口袋。']
    ] },
    { id: 'kitchen', title: '不太可靠的魔法厨房', chapters: [
      ['汤匙的意见', '汤匙说今天不适合煮汤。她问为什么，汤匙回答：因为昨天也是汤。'],
      ['会迷路的盐', '这瓶盐总把甜点当成自己的家。厨师画了张地图贴在瓶口，最后蛋糕还是有一点咸。'],
      ['给云烤面包', '云喜欢刚出炉的面包，但讨厌留下脚印。于是面包房的烟囱每天都会冒出一小串香气。'],
      ['蘑菇的时钟', '蘑菇煮熟之前会敲三下锅盖。没有敲的时候，可能只是它忘了数到几。'],
      ['晚餐客人', '她多摆了一只杯子。月亮路过窗前时，轻轻往杯子里添了一点光。'],
      ['留下最后一口', '食谱在最后一页写着：剩下一口，不是为了节省。是让明天知道，昨天还挺好。']
    ] },
    { id: 'stars', title: '小星星的野外观察', chapters: [
      ['辨认星迹', '星星落到地上会变得很小，通常和石子一样大。最可靠的辨认办法，是看看它有没有在偷偷打哈欠。'],
      ['口袋天气', '不要把阴天和晴天放在同一个口袋里。它们会聊天，然后谁也不肯出来。'],
      ['停在树上的风', '那阵风每晚都来同一根树枝休息。第三晚，我终于看清它带了一本非常薄的书。'],
      ['不发光的夜晚', '不发光的时候，星星也没有坏掉。它只是在认真听远处有人讲故事。'],
      ['借一条轨道', '迷路的小星星问萤火虫借路。萤火虫说我也不知道去哪里，但可以一起走一段。'],
      ['观察者的注记', '所有记录后面都留一页空白。明天遇见的东西，不一定愿意照着今天的名字生长。']
    ] }
  ];
  const ACTIVITIES = {
    read: { title: '在窗边慢慢看书', place: 'bed', detail: '书页夹着一片叶子。你随时可以坐下来，一起读她正读的这一段。', durations: [150, 180, 210] },
    tea: { title: '在炉边煮一壶茶', place: 'fire', detail: '她打算等茶香出来再熄火，顺便想想刚才读到的故事。', durations: [25, 35, 45] },
    research: { title: '观察桌上的梦种', place: 'desk', detail: '她正在比较暖光和月光里的叶片，偶尔低头记几笔。', durations: [70, 95, 120] },
    rest: { title: '窝着休息一会儿', place: 'rug', detail: '帽子有点沉，她想放空脑袋。等精神回来，再继续自己的小计划。', durations: [45, 70, 90] },
    break: { title: '在窗边听天气', place: 'window', detail: '她看着窗外的叶子，想到什么就让它慢慢飘过去。', durations: [20, 35, 50] },
    game: { title: '陪你下五子棋', place: 'rug', detail: '书签已经夹好。现在这段时间，留给你们一起。', durations: [60] },
    craft: { title: '把生活碎片做成小东西', place: 'desk', detail: '她把材料排在桌上，试着让你的日常在这里留下形状。', durations: [0.75] }
  };
  const WEATHER = ['晴朗', '薄云', '小雨', '雨后'];
  const ENERGY_RATE = { read: -3, research: -9, craft: -10, tea: 12, rest: 24, break: 6, game: -4 };
  function weatherAt(s, at) { return WEATHER[hash(String(s.createdAt) + ':' + Math.floor(at / (6 * HOUR))) % WEATHER.length]; }
  function updateWorld(s, at) {
    s.world.weather = weatherAt(s, at);
    s.world.day = Math.floor((at + 8 * HOUR) / DAY);
    s.world.hour = Math.floor((at + 8 * HOUR) % DAY / HOUR);
    if (s.activity) s.world.energy = Math.max(5, Math.min(100, (s.activity.energyAtStart === undefined ? 76 : s.activity.energyAtStart) + (at - s.activity.startedAt) / HOUR * (ENERGY_RATE[s.activity.kind] || 0)));
    s.world.lastUpdatedAt = at;
  }
  function event(s, key, type, text, at, sources) {
    const old = s.events.find(e => e.key === key); if (old) return old;
    const e = { id: id(s, 'event'), key, type, text, at, sourceIds: [...new Set(sources || [])].slice(0, 8) };
    s.events.push(e); s.events = s.events.slice(-160); return e;
  }
  function learn(s, key, label, at, sourceIds) {
    const existing = s.knowledge.find(k => k.key === key); if (existing) return existing;
    const e = event(s, 'knowledge:' + key, 'knowledge', label, at, sourceIds);
    const k = { id: id(s, 'knowledge'), key, label, learnedAt: at, sourceIds: [...sourceIds], eventId: e.id };
    s.knowledge.push(k); return k;
  }
  function scores(s, at, previous) {
    const weather = weatherAt(s, at), energy = s.world.energy;
    const hour = Math.floor((at + 8 * HOUR) % DAY / HOUR), p = s.preferences;
    const seed = s.fragments.find(f => ['accepted', 'studying', 'queued'].includes(f.status) && f.isDreamSeed);
    const known = seed && s.knowledge.some(k => k.key === 'seed:' + seed.id);
    const plantReady = seed && seed.proposal.kind === 'plant' && known;
    const rows = [
      { kind: 'read', score: 25 + p.bookish * 28 + (weather === '小雨' ? 14 : 0), eligible: true, reasons: ['她喜欢把一本书慢慢读完', ...(weather === '小雨' ? ['窗外在下雨，读书很合适'] : [])] },
      { kind: 'tea', score: 17 + (energy < 55 ? 18 : 0) + (weather === '小雨' ? 10 : 0), eligible: true, reasons: [energy < 55 ? '有些疲倦，热茶能让她缓一缓' : '她想在活动之间留一点喝茶的时间'] },
      { kind: 'research', score: 18 + p.curiosity * 30 + (seed && !known ? 50 : 0), eligible: energy >= 18, reasons: [seed && !known ? '你留下的梦种还没有弄明白，需要先查资料' : '梦种的叶片还有一个没弄明白的小变化'] },
      { kind: 'rest', score: 8 + Math.max(0, 60 - energy) * 1.8 + (hour >= 22 || hour < 7 ? 30 : 0), eligible: true, reasons: [energy < 45 ? '精神不足，先休息更合适' : hour >= 22 || hour < 7 ? '夜深了，身体想慢下来' : '她也想留一点不做事的时间'] },
      { kind: 'break', score: 13 + p.quiet * 15 + (weather === '雨后' ? 18 : 0), eligible: true, reasons: [weather === '雨后' ? '雨刚停，窗边有新鲜的气味' : '看看窗外，给脑袋换一点空气'] },
      { kind: 'plant', score: plantReady ? 80 : 0, eligible: !!plantReady, reasons: [plantReady ? '已经学会这颗梦种的种植方法' : seed && seed.proposal.kind === 'plant' ? '先研究这颗梦种，不能凭空知道怎么种' : '目前没有已经学会种法的植物提案'] },
      { kind: 'fish', score: 0, eligible: false, reasons: ['还没有鱼竿，也还没开放河岸路线'] }
    ];
    for (const row of rows) { if (row.kind === previous) { row.score *= .3; row.reasons.push('刚做过，暂时更想换件事'); } row.score = Math.round(row.score); row.reason = row.reasons.join('；'); }
    return rows;
  }
  function decision(s, at, previous) {
    const candidates = scores(s, at, previous);
    const available = candidates.filter(c => c.eligible && c.kind !== 'plant' && c.score > 0);
    let value = random(s) * available.reduce((sum, c) => sum + c.score, 0);
    let chosen = available[available.length - 1];
    for (const c of available) { value -= c.score; if (value <= 0) { chosen = c; break; } }
    return { kind: chosen.kind, reasons: chosen.reasons, reason: chosen.reason, candidates, sourceIds: [] };
  }
  function hash(text) { let n = 2166136261; for (const c of text) { n ^= c.codePointAt(0); n = Math.imul(n, 16777619); } return n >>> 0; }
  function random(s) { let x = s.rng >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; s.rng = x >>> 0 || 1; return s.rng / 4294967296; }
  function id(s, prefix) { s.serial += 1; return prefix + '-' + s.serial; }
  function time(now) { if (!Number.isFinite(now) || now < 0 || now > 8640000000000000) throw new Error('时间无效'); return Math.floor(now); }
  function progress(a, now) { return Math.max(0, Math.min(1, (a.progressBase || 0) + Math.max(0, now - a.startedAt) / a.durationMs)); }
  function remember(s, key, text, at, kind) {
    if (s.memories.some(m => m.key === key)) return;
    s.memories.push({ id: id(s, 'memory'), key, text, at, kind: kind || 'moment' });
    s.memories = s.memories.slice(-LIMITS.memories);
  }
  function spec(s, kind) {
    const d = ACTIVITIES[kind];
    const a = { kind, title: d.title, detail: d.detail, place: d.place, durationMs: d.durations[Math.floor(random(s) * d.durations.length)] * MINUTE };
    if (kind === 'read') {
      const candidates = BOOKS.filter(b => b.id !== s.lastBookId);
      const b = candidates[Math.floor(random(s) * candidates.length)];
      a.bookId = b.id; a.title = '在读《' + b.title + '》';
    }
    return a;
  }
  function plan(s, previous, at) { const d = decision(s, at === undefined ? s.lastAdvancedAt : at, previous); return { ...spec(s, d.kind), decision: d }; }
  function fillQueue(s) {
    // Plans are wishes. Actual choices are re-evaluated against the world when an activity ends.
    const committed = s.queue.filter(a => a.kind === 'craft' || a.studyFragmentId);
    const rows = scores(s, s.world.lastUpdatedAt, s.activity.kind).filter(c => c.eligible && ACTIVITIES[c.kind]).sort((a, b) => b.score - a.score);
    s.queue = committed.concat(rows.slice(0, 3).map(c => ({ kind: c.kind, title: ACTIVITIES[c.kind].title, detail: ACTIVITIES[c.kind].detail, place: ACTIVITIES[c.kind].place, durationMs: ACTIVITIES[c.kind].durations[0] * MINUTE, ...(c.kind === 'read' ? { bookId: 'moss' } : {}), tentative: true }))).slice(0, 12);
  }
  function start(s, a, now) {
    if (a.kind === 'craft' && a.fragmentId && !s.knowledge.some(k => k.key === 'seed:' + a.fragmentId)) throw new Error('还没有理解这颗梦种的材料和制作方法');
    if (a.knowledgeFragmentId && !s.knowledge.some(k => k.key === 'seed:' + a.knowledgeFragmentId)) throw new Error('还没有理解这颗梦种的材料和制作方法');
    if (a.plantFragmentId && !s.knowledge.some(k => k.key === 'seed:' + a.plantFragmentId)) throw new Error('还没有学会这颗梦种的种植方法');
    s.activity = { ...a, id: id(s, 'activity'), startedAt: now, endsAt: now + a.durationMs, progressBase: 0, energyAtStart: s.world.energy };
    if (!s.activity.decision) s.activity.decision = { reasons: ['你们一起决定了接下来做这件事'], reason: '你们一起决定了接下来做这件事', candidates: scores(s, now), sourceIds: a.fragmentId ? [a.fragmentId] : [] };
    if (a.fragmentId) { const f = s.fragments.find(v => v.id === a.fragmentId); if (f) f.status = 'making'; }
    if (a.studyFragmentId) { const f = s.fragments.find(v => v.id === a.studyFragmentId); if (f) f.status = 'studying'; }
    event(s, 'activity:' + s.activity.id, 'decision', s.activity.title + '：' + s.activity.decision.reason, now, s.activity.decision.sourceIds);
  }
  function pause(s, now) {
    if (!s.activity || s.activity.kind === 'game') return;
    s.paused.push({ ...s.activity, progressBase: progress(s.activity, now), pausedAt: now });
    s.paused = s.paused.slice(-8);
  }
  function restore(s, now) {
    const a = s.paused.pop();
    if (!a) return false;
    delete a.pausedAt;
    a.startedAt = now; a.endsAt = now + Math.max(1, (1 - a.progressBase) * a.durationMs); a.energyAtStart = s.world.energy;
    s.activity = a; return true;
  }
  function next(s, now) {
    const committedIndex = s.queue.findIndex(a => (a.kind === 'craft' || a.studyFragmentId) && (!a.knowledgeFragmentId || s.knowledge.some(k => k.key === 'seed:' + a.knowledgeFragmentId)) && (!a.plantFragmentId || s.knowledge.some(k => k.key === 'seed:' + a.plantFragmentId)));
    if (committedIndex >= 0) { const a = s.queue.splice(committedIndex, 1)[0]; start(s, a, now); fillQueue(s); return; }
    if (restore(s, now)) return;
    const a = plan(s, s.activity.kind, now);
    start(s, a, now); fillQueue(s);
  }
  function finish(s, at) {
    const a = s.activity;
    if (a.studyFragmentId) {
      const f = s.fragments.find(v => v.id === a.studyFragmentId);
      if (f) {
        const isPlant = f.proposal.kind === 'plant';
        const k = learn(s, 'seed:' + f.id, isPlant ? '学会了「' + f.proposal.name + '」需要松土和水分，雨水也能帮助它生长。' : '理解了「' + f.proposal.name + '」的材料搭配和定形方法，也记住它来自哪一段日常。', at, [f.id, a.id]);
        f.knowledgeId = k.id;
        remember(s, 'study:' + f.id, isPlant ? '她查过《小星星的野外观察》的附页，弄明白了这颗梦种的种法。' : '她查过材料札记，弄明白了怎样把这颗梦种做成「' + f.proposal.name + '」。', at, 'knowledge');
      }
    }
    if (a.kind === 'craft' && a.fragmentId) {
      const f = s.fragments.find(v => v.id === a.fragmentId);
      if (f && f.status !== 'made') {
        const existing = s.creations.find(v => v.fragmentId === f.id);
        if (!existing) {
          const c = { ...f.proposal, id: id(s, 'creation'), fragmentId: f.id, createdAt: at };
          s.creations.push(c); f.creationId = c.id;
          if (a.plantFragmentId) {
            const plant = { id: id(s, 'plant'), creationId: c.id, fragmentId: f.id, plantedAt: at, lastUpdatedAt: at, growth: 0, hydration: 1, anchorAt: at, growthAnchor: 0, hydrationAnchor: 1, bloomed: false, invitationId: null, sourceIds: [f.id, ...(f.knowledgeId ? [f.knowledgeId] : [])] };
            s.plants.push(plant); f.plantId = plant.id;
            event(s, 'plant:' + plant.id, 'planting', '掌握种法后，她把「' + c.name + '」种在窗边，并浇了第一遍水。', at, plant.sourceIds);
          }
          remember(s, 'creation:' + f.id, '她做出了「' + c.name + '」。这件小东西来自你留下的生活碎片。', at, 'creation');
        }
        f.status = 'made';
      }
    } else if (a.kind === 'read') {
      const book = BOOKS.find(b => b.id === a.bookId);
      if (book) {
        s.lastBookId = book.id;
        const record = s.books.find(b => b.id === book.id); record.readCount += 1; record.lastReadAt = at;
        if (record.readCount === 1) remember(s, 'book:' + book.id, '她读完了《' + book.title + '》，把最喜欢的一页折了一个小角。', at, 'book');
        if (book.id === 'stars') learn(s, 'book:stars', '认识了梦种：先观察，再尝试；水分和天气会影响生长。', at, [a.id]);
      }
    }
  }
  function growPlants(s, now) {
    for (const p of s.plants) {
      let cursor = p.lastUpdatedAt;
      while (!p.bloomed && cursor < now) {
        const boundary = (Math.floor(cursor / (6 * HOUR)) + 1) * 6 * HOUR;
        const end = Math.min(now, boundary), rain = weatherAt(s, cursor) === '小雨';
        const duration = end - p.anchorAt, waterMs = rain ? duration : Math.min(duration, p.hydrationAnchor * 180000);
        const needed = (1 - p.growthAnchor) * (rain ? 65000 : 90000);
        const used = Math.min(waterMs, needed), effectiveDuration = Math.min(duration, needed);
        p.growth = Math.min(1, p.growthAnchor + used / (rain ? 65000 : 90000));
        p.hydration = rain ? Math.min(1, p.hydrationAnchor + effectiveDuration / 90000) : Math.max(0, p.hydrationAnchor - effectiveDuration / 180000);
        if (p.growth >= 1 - 1e-10) {
          p.growth = 1; p.bloomed = true;
          const at = Math.round(p.anchorAt + used), c = s.creations.find(c => c.id === p.creationId);
          const title = '一封来自旧温室的邀请';
          const d = { id: id(s, 'discovery'), kind: 'invitation', title, text: '窗边的新芽引来了一只纸鹤。它放下一张便笺：“我在旧温室见过相似的叶子。哪天有空，可以带着你的观察笔记来看看。” 她把便笺收好了；温室路线会在后续版本展开。', createdAt: at, sourceIds: [...p.sourceIds, p.creationId], plantId: p.id };
          if (!s.discoveries.some(v => v.plantId === p.id)) { s.discoveries.push(d); p.invitationId = d.id; }
          event(s, 'bloom:' + p.id, 'growth', '「' + (c ? c.name : '窗边的植物') + '」长出了新叶。' + (rain ? '这阵雨给了它水分。' : '种下时浇的水帮助它慢慢长大。'), at, p.sourceIds);
          remember(s, 'invitation:' + p.id, '梦种长出了新叶，一只纸鹤送来旧温室的便笺。新的去处，先留在心里。', at, 'discovery');
        }
        cursor = end;
        if (!p.bloomed && end === boundary) { p.anchorAt = end; p.growthAnchor = p.growth; p.hydrationAnchor = p.hydration; }
        if (!rain && p.hydration <= 0 && !p.bloomed && now - cursor > 7 * DAY) {
          // A future rain bucket is reached in bounded steps even after a very long absence.
          let found = false;
          for (let i = 0; i < 128; i += 1) { const nextAt = cursor + i * 6 * HOUR; if (nextAt > now) break; if (weatherAt(s, nextAt) === '小雨') { cursor = nextAt; found = true; break; } }
          if (!found) cursor = now;
        }
      }
      p.lastUpdatedAt = Math.max(p.lastUpdatedAt, now);
    }
  }
  function waterPlant(s, pid, now) {
    advance(s, now); const p = s.plants.find(p => p.id === pid);
    if (!p) throw new Error('没有找到这株植物');
    p.hydration = 1;
    p.anchorAt = s.lastAdvancedAt; p.growthAnchor = p.growth; p.hydrationAnchor = 1;
    event(s, 'water:' + pid + ':' + Math.floor(s.lastAdvancedAt / MINUTE), 'care', '你给窗边的植物添了一点水。', s.lastAdvancedAt, [p.fragmentId, p.creationId]);
    return p;
  }
  function create(now) {
    now = time(now === undefined ? Date.now() : now);
    const s = { version: 2, serial: 0, rng: hash('a-little-witch:' + now) || 1, createdAt: now, lastAdvancedAt: now,
      activity: null, queue: [], paused: [], books: BOOKS.map(b => ({ id: b.id, readCount: 0, lastReadAt: null })),
      fragments: [], creations: [], memories: [], preferences: { name: '小罗', curiosity: .78, bookish: .7, quiet: .62 }, board: null, position: { x: 480, y: 895 }, lastBookId: null,
      world: { weather: '薄云', energy: 78, day: 0, hour: 0, lastUpdatedAt: now }, knowledge: [], events: [], plants: [], discoveries: [] };
    updateWorld(s, now);
    const initial = { ...spec(s, 'read'), durationMs: 3 * HOUR, bookId: 'moss', title: '在读《苔藓邮差的旅行簿》', decision: { reason: '她想慢慢读完这本书，在你来之前已经读了一会儿', reasons: ['她喜欢读书', '这本旅行簿还没有读完'], candidates: scores(s, now), sourceIds: [] } };
    start(s, initial, Math.max(0, now - 37 * MINUTE)); fillQueue(s);
    remember(s, 'hello', '她给你留了一个位置。你忙的时候，她会继续自己的小日子。', now, 'meeting');
    return s;
  }
  function advance(s, now) {
    now = Math.max(time(now === undefined ? Date.now() : now), s.lastAdvancedAt);
    let completed = 0;
    while (s.activity.endsAt <= now) {
      const at = s.activity.endsAt;
      growPlants(s, at); updateWorld(s, at);
      finish(s, at); next(s, at); completed += 1;
      // Exact event-time catch-up: opening frequently and returning later produce the same state.
      if (completed > 50000) throw new Error('设备时间跨越过大，请检查时钟后再打开存档');
    }
    growPlants(s, now); updateWorld(s, now);
    s.lastAdvancedAt = now;
    return s;
  }
  function currentView(s, now) {
    now = Math.max(time(now === undefined ? Date.now() : now), s.lastAdvancedAt);
    const a = s.activity, p = progress(a, now), b = BOOKS.find(v => v.id === a.bookId);
    let excerpt = null;
    if (a.kind === 'read' && b) { const i = Math.min(b.chapters.length - 1, Math.floor(p * b.chapters.length)); excerpt = { book: b.title, bookId: b.id, chapter: '第 ' + (i + 1) + ' 章 · ' + b.chapters[i][0], text: b.chapters[i][1] }; }
    if (a.studyFragmentId) {
      const f = s.fragments.find(f => f.id === a.studyFragmentId), isPlant = f && f.proposal.kind === 'plant';
      excerpt = isPlant ? { book: '小星星的野外观察', bookId: 'stars', chapter: '附页 · 梦种的第一片叶子', text: '先观察梦种的颜色，记下它从哪里来。松软的土和一点水能让它伸展；雨天可以借窗外的水汽。没有弄明白以前，先别急着种。新叶会吸引送信的纸鹤，但纸鹤从不承诺哪一天抵达。' } : { book: '小星星的野外观察', bookId: 'stars', chapter: '附页 · 日常材料的保存', text: '日常留下的梦种没有固定形状。先辨认材料，再选择容器：气味适合封在瓶中，想法可以编成书页，温暖可以藏进食物。定形以前要试一小份，并在标签上写下它的来历。' };
    }
    const thoughts = {
      read: ['这段很有意思，你要一起看吗？', '我想把这一页读慢一点。', '等这本看完，我想试试里面那个小点子。'],
      tea: ['先别急，茶叶还没有舒展开呢。', '杯子给你也留了一只。', '我想等茶凉一点，再翻下一页。'],
      research: ['这片叶子刚才是不是动了一下？', '我把不同的光照记下来了，晚一点再比较。', '好像快看出一点规律了。'],
      rest: ['你来了呀，坐一会儿？', '我什么都没忙，也挺舒服的。', '再歇一会儿，就有精神了。'],
      break: ['今天窗外的光很好看。', '你想换个事情做的话，我听着呢。', '等会儿回去接着做，也不着急。'],
      game: ['轮到你了。我把刚才的事情记着呢。'], craft: ['你的那一点日常，正在慢慢有了形状。', '我想把边角也弄得圆圆的。', '快好了，等下放到收藏架上。']
    };
    const lines = thoughts[a.kind] || thoughts.rest;
    return { title: a.title, detail: a.detail, progress: p, remainingMs: Math.max(0, a.endsAt - now), place: a.place, excerpt,
      thought: lines[Math.min(lines.length - 1, Math.floor(p * lines.length))], next: [...s.paused].reverse().map(v => '继续' + v.title).concat(s.queue.map(v => v.title)).slice(0, 3),
      paused: s.paused.length ? s.paused[s.paused.length - 1].title : null, kind: a.kind,
      reason: a.decision ? a.decision.reason : '她正在继续之前的计划', reasons: a.decision ? a.decision.reasons : ['她正在继续之前的计划'],
      candidateScores: scores(s, now, a.kind), facts: [s.world.weather + ' · 精神 ' + Math.round(s.world.energy) + '/100', '已学会 ' + s.knowledge.length + ' 条知识', '记下 ' + s.fragments.length + ' 颗梦种'],
      seedStage: s.fragments.some(f => f.status === 'studying') ? '正在查书研究' : s.plants.some(p => !p.bloomed) ? '窗边正在生长' : s.discoveries.length ? '收到一封邀请' : null };
  }
  function interrupt(s, kind, now) {
    if (!['break', 'tea', 'read', 'game'].includes(kind)) throw new Error('还没有这种活动');
    advance(s, now); now = s.lastAdvancedAt;
    if (s.activity.kind === kind) return s.activity;
    pause(s, now); const a = spec(s, kind); a.userInitiated = true;
    if (kind === 'break') a.durationMs = 8 * MINUTE;
    if (kind === 'game') a.durationMs = 4 * HOUR;
    start(s, a, now); return s.activity;
  }
  function holdGame(s, now) {
    now = Math.max(time(now === undefined ? Date.now() : now), s.lastAdvancedAt);
    if (s.activity.kind !== 'game') return advance(s, now);
    // A live board may stay open for hours. Only the world clock and plants run;
    // the bookmarked activity must not resume behind the board.
    growPlants(s, now); updateWorld(s, now);
    s.activity.startedAt = now;
    s.activity.endsAt = now + s.activity.durationMs;
    s.activity.progressBase = 0;
    s.activity.energyAtStart = s.world.energy;
    s.lastAdvancedAt = now;
    return s;
  }
  function resume(s, now) {
    if (s.activity.kind === 'game') holdGame(s, now); else advance(s, now);
    now = s.lastAdvancedAt;
    if (s.activity.kind === 'craft' || s.activity.studyFragmentId) return false;
    if (restore(s, now)) return true;
    if (s.activity.kind === 'game' || s.activity.userInitiated) { next(s, now); return true; }
    return false;
  }
  const THEMES = [
    { tag: '花草', words: /桂花|花(?!生|卷|费|钱)|草(?!莓)|叶|树|森林|植物/, color: '#d7b963', motif: '花香', noun: '花种瓶' },
    { tag: '雨水', words: /雨|水|潮湿|湿鞋|淋|雪/, color: '#84bac5', motif: '雨滴', noun: '雨声灯' },
    { tag: '梦境', words: /梦|鲸|飞|浮|天空|翅膀/, color: '#b69fd3', motif: '浮游', noun: '梦种瓶' },
    { tag: '饮食', words: /吃|饭|面|粥|汤|酒|奶|茶|咖啡|蛋糕|糖|甜|饼/, color: '#dda56f', motif: '暖香', noun: '暖茶杯' },
    { tag: '星夜', words: /星|月|夜|宇宙|银河/, color: '#cab371', motif: '星月', noun: '星灯' },
    { tag: '旅途', words: /走|路|车|旅行|地铁|出门|回家|迷路/, color: '#a0b991', motif: '归途', noun: '路标挂饰' },
    { tag: '海风', words: /海|河|湖|沙滩|鱼|贝壳/, color: '#79bdb4', motif: '潮汐', noun: '小潮汐瓶' },
    { tag: '声音', words: /歌|唱|音乐|琴|声音|听/, color: '#dba2b3', motif: '轻唱', noun: '风铃' },
    { tag: '陪伴', words: /猫|狗|朋友|家人|妈妈|爸爸|拥抱|陪|同事/, color: '#c8a17a', motif: '相伴', noun: '毛线挂饰' },
    { tag: '休息', words: /累|困|忙|加班|工作|睡|烦|难过|休息|压力/, color: '#95a7bf', motif: '安睡', noun: '晚安灯' }
  ];
  function shortLabel(text) { return text.replace(/<[^>]*>/g, '').replace(/[\s\p{P}\p{S}]/gu, '').slice(0, 8) || '这一天'; }
  function makeProposal(s, text, fid) {
    const matches = THEMES.filter(t => t.words.test(text));
    const first = matches[0], second = matches[1];
    const prior = s.creations[s.creations.length - 1];
    let name, kind, color, description;
    if (first) {
      const motif = second ? first.motif + second.motif : first.motif;
      kind = first.tag === '花草' ? 'plant' : first.tag === '梦境' || first.tag === '海风' || first.tag === '雨水' ? 'bottle' : first.tag === '饮食' ? 'food' : 'ornament';
      name = motif + (kind === 'plant' ? '灯花' : kind === 'bottle' ? '收藏瓶' : kind === 'food' ? '小点心' : first.noun);
      color = first.color;
      description = '从这段记录里的「' + matches.map(m => m.tag).join('、') + '」想到的小物件。';
    } else {
      name = shortLabel(text) + '·便笺灯'; kind = 'ornament'; color = '#d4b980';
      description = '先把你的这句话收进一盏便笺灯。现在的本地规则还没有识别到特定材料，原文会完整留在来历里。';
    }
    const sourceIds = [fid];
    if (prior) {
      const previousSources = prior.sourceIds.filter(v => s.fragments.some(f => f.id === v));
      sourceIds.push(...previousSources.slice(-4));
      description += ' 她还想借用「' + prior.name + '」的一点颜色，让这两段日子挨在一起。';
      name = (second ? name : '续页·' + name).slice(0, 60);
    } else description += ' 做好之后，会留在你们的收藏架上。';
    return { name, description, kind, color, sourceIds: [...new Set(sourceIds)], relatedCreationId: prior ? prior.id : null, rule: 'local-combination-v1', tags: matches.map(m => m.tag) };
  }
  function addFragment(s, text, now) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('先留下一小段今天吧');
    text = text.trim();
    if (text.length > LIMITS.text) throw new Error('一颗梦种最多写 ' + LIMITS.text + ' 个字');
    if (s.fragments.length >= LIMITS.fragments) throw new Error('本试玩版最多保存 ' + LIMITS.fragments + ' 颗梦种。请先导出备份；扩容将在后续版本处理。');
    advance(s, now); const fid = id(s, 'fragment'), proposal = makeProposal(s, text, fid);
    const f = { id: fid, text, createdAt: s.lastAdvancedAt, tags: [...proposal.tags], proposal, status: 'pending', isDreamSeed: true };
    s.fragments.push(f);
    event(s, 'fragment:' + fid, 'dream-seed', '你留下了一颗梦种。它的原文会一直留在这里。', s.lastAdvancedAt, [fid]);
    return f;
  }
  function acceptFragment(s, fid, now, options) {
    advance(s, now); now = s.lastAdvancedAt;
    const f = s.fragments.find(v => v.id === fid);
    if (!f) throw new Error('没有找到这颗梦种');
    if (['made', 'making', 'queued', 'studying', 'accepted'].includes(f.status)) return f;
    if (s.creations.length + s.fragments.filter(v => ['making', 'queued', 'studying', 'accepted'].includes(v.status)).length >= LIMITS.creations) throw new Error('本试玩版最多保存 ' + LIMITS.creations + ' 件收藏。请先导出备份；扩容将在后续版本处理。');
    if (s.queue.filter(a => a.kind === 'craft' || a.studyFragmentId).length >= 6) throw new Error('她的工作桌暂时摆满了。先等手边这几颗梦种慢慢长大吧。');
    const requiresStudy = !s.knowledge.some(k => k.key === 'seed:' + f.id), isPlant = f.proposal.kind === 'plant';
    const a = { ...spec(s, 'craft'), fragmentId: f.id, knowledgeFragmentId: f.id, ...(isPlant ? { plantFragmentId: f.id } : {}), title: (isPlant ? '在种下「' : '在做「') + f.proposal.name + '」', detail: (isPlant ? '把已经学会的种法用在这颗梦种上。' : '用刚弄明白的材料和方法，让这颗梦种定下形状。') + '做好后，她会接着之前的计划。', durationMs: 45000,
      decision: { reason: '已完成观察，接下来可以动手；材料来自你留下的梦种', reasons: ['已完成观察，接下来可以动手', '材料来自你留下的梦种'], candidates: scores(s, now), sourceIds: [f.id] } };
    const study = { ...spec(s, 'research'), studyFragmentId: f.id, title: '查书研究「' + f.proposal.name + '」', detail: isPlant ? '她翻开《小星星的野外观察》的种植附页。先学会它需要什么，再动手种下。' : '她翻开材料札记，试着理解这颗梦种适合怎样的材料和制作方法。', durationMs: 45000,
      decision: { reason: '你留下了一颗新梦种，她还不懂它的材料和方法，需要先查书', reasons: ['你留下了一颗新梦种', '还不懂材料和方法，需要先查书'], candidates: scores(s, now), sourceIds: [f.id] } };
    const busy = s.activity.kind === 'craft' || s.activity.studyFragmentId || (options && options.immediate === false);
    if (busy) {
      const committed = s.queue.filter(q => q.kind === 'craft' || q.studyFragmentId), wishes = s.queue.filter(q => q.kind !== 'craft' && !q.studyFragmentId);
      s.queue = committed.concat(requiresStudy ? [study, a] : [a], wishes); f.status = 'queued';
    }
    else { pause(s, now); if (requiresStudy) { s.queue.unshift(a); start(s, study, now); } else start(s, a, now); }
    event(s, 'accept:' + fid, 'intention', '你们决定让这颗梦种在这里长大。', now, [fid]);
    return f;
  }
  function deferFragment(s, fid) { const f = s.fragments.find(v => v.id === fid); if (f && f.status === 'pending') f.status = 'deferred'; return f || null; }
  function applyProposal(s, fid, data, now) {
    advance(s, now);
    const f = s.fragments.find(f => f.id === fid);
    if (!f || !['pending', 'deferred'].includes(f.status)) throw new Error('只有还没开始的梦种可以更换提案');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('提案需要是一个 JSON 对象');
    const name = cleanText(data.name, 40).trim(), description = cleanText(data.description, 300).trim();
    if (!name || !description) throw new Error('提案需要名字和描述');
    const kind = allowed(data.kind, ['plant', 'bottle', 'book', 'ornament', 'food']);
    const thought = data.thought === undefined ? '' : cleanText(data.thought, 180);
    if (typeof data.color !== 'string' || !/^#[a-f0-9]{6}$/i.test(data.color)) throw new Error('颜色需要是 # 加六位十六进制数字');
    // AI is only allowed to propose these presentation fields. All causal IDs and rules stay local.
    f.proposal = { ...f.proposal, name, description, kind, color: data.color, thought, rule: 'user-imported-proposal' };
    event(s, 'proposal:' + fid + ':' + hash(name + description), 'proposal', '你为这颗梦种选了一份新的表现提案。世界规则和来历没有改变。', s.lastAdvancedAt, [fid]);
    return f.proposal;
  }
  function inspectCreation(s, cid) {
    const c = s.creations.find(c => c.id === cid); if (!c) return null;
    const sources = s.fragments.filter(f => c.sourceIds.includes(f.id));
    const sourceSet = new Set([c.id, ...c.sourceIds]);
    return { creation: c, sources, events: s.events.filter(e => e.sourceIds.some(id => sourceSet.has(id))), knowledge: s.knowledge.filter(k => k.sourceIds.some(id => sourceSet.has(id))), plant: s.plants.find(p => p.creationId === cid) || null };
  }

  function validate(value, now) {
    now = time(now === undefined ? Date.now() : now);
    if (!value || typeof value !== 'object' || value.version !== 2) throw new Error('这不是当前版本的游戏存档');
    // Only whitelisted fields are copied; never merge imported objects into prototypes.
    const serial = number(value.serial, 0, 1000000000, '序号');
    const s = { version: 2, serial, rng: number(value.rng, 1, 4294967295, '随机状态'), createdAt: stamp(value.createdAt), lastAdvancedAt: stamp(value.lastAdvancedAt),
      activity: cleanActivity(value.activity), queue: list(value.queue, 12).map(a => cleanActivity(a, true)), paused: list(value.paused, 8).map(a => cleanActivity(a)),
      books: [], fragments: [], creations: [], memories: [], preferences: { name: cleanText(value.preferences && value.preferences.name || '小罗', 30), curiosity: number(value.preferences && value.preferences.curiosity === undefined ? .78 : value.preferences.curiosity, 0, 1, '性格'), bookish: number(value.preferences && value.preferences.bookish === undefined ? .7 : value.preferences.bookish, 0, 1, '性格'), quiet: number(value.preferences && value.preferences.quiet === undefined ? .62 : value.preferences.quiet, 0, 1, '性格') }, board: cleanBoard(value.board),
      position: { x: number(value.position && value.position.x, 0, 941, '位置'), y: number(value.position && value.position.y, 0, 1672, '位置') }, lastBookId: BOOKS.some(b => b.id === value.lastBookId) ? value.lastBookId : null,
      world: { weather: '薄云', energy: value.world ? number(value.world.energy, 0, 100, '精神') : 76, day: 0, hour: 0, lastUpdatedAt: stamp(value.lastAdvancedAt) }, knowledge: [], events: [], plants: [], discoveries: [] };
    if (s.lastAdvancedAt > now + DAY) throw new Error('存档时间远晚于当前设备时间，请检查设备时钟');
    const bookValues = list(value.books, 3);
    s.books = BOOKS.map(b => { const v = bookValues.find(v => v.id === b.id); return { id: b.id, readCount: v ? number(v.readCount, 0, 1000000, '阅读次数') : 0, lastReadAt: v && v.lastReadAt !== null ? stamp(v.lastReadAt) : null }; });
    s.fragments = list(value.fragments, LIMITS.fragments).map(f => ({ id: ident(f.id), text: cleanText(f.text, LIMITS.text), createdAt: stamp(f.createdAt),
      tags: cleanTags(f.tags), proposal: cleanProposal(f.proposal), status: allowed(f.status, ['pending', 'deferred', 'making', 'queued', 'made', 'accepted', 'studying']), isDreamSeed: f.isDreamSeed === true,
      ...(f.creationId ? { creationId: ident(f.creationId) } : {}), ...(f.knowledgeId ? { knowledgeId: ident(f.knowledgeId) } : {}), ...(f.plantId ? { plantId: ident(f.plantId) } : {}) }));
    s.creations = list(value.creations, LIMITS.creations).map(c => ({ ...cleanProposal(c), id: ident(c.id), fragmentId: ident(c.fragmentId), createdAt: stamp(c.createdAt) }));
    s.memories = list(value.memories, LIMITS.memories).map(m => ({ id: ident(m.id), key: cleanText(m.key, 100), text: cleanText(m.text, 500), at: stamp(m.at), kind: cleanText(m.kind, 30) }));
    s.events = list(value.events || [], 160).map(e => ({ id: ident(e.id), key: cleanText(e.key, 150), type: cleanText(e.type, 30), text: cleanText(e.text, 1000), at: stamp(e.at), sourceIds: list(e.sourceIds, 8).map(ident) }));
    s.knowledge = list(value.knowledge || [], 250).map(k => ({ id: ident(k.id), key: cleanText(k.key, 100), label: cleanText(k.label, 500), learnedAt: stamp(k.learnedAt), sourceIds: list(k.sourceIds, 8).map(ident), eventId: ident(k.eventId) }));
    s.plants = list(value.plants || [], LIMITS.creations).map(p => ({ id: ident(p.id), creationId: ident(p.creationId), fragmentId: ident(p.fragmentId), plantedAt: stamp(p.plantedAt), lastUpdatedAt: stamp(p.lastUpdatedAt), growth: number(p.growth, 0, 1, '生长'), hydration: number(p.hydration, 0, 1, '水分'), anchorAt: stamp(p.anchorAt === undefined ? p.lastUpdatedAt : p.anchorAt), growthAnchor: number(p.growthAnchor === undefined ? p.growth : p.growthAnchor, 0, 1, '生长'), hydrationAnchor: number(p.hydrationAnchor === undefined ? p.hydration : p.hydrationAnchor, 0, 1, '水分'), bloomed: p.bloomed === true, invitationId: p.invitationId ? ident(p.invitationId) : null, sourceIds: list(p.sourceIds, 8).map(ident) }));
    s.discoveries = list(value.discoveries || [], LIMITS.creations).map(d => ({ id: ident(d.id), kind: allowed(d.kind, ['invitation']), title: cleanText(d.title, 100), text: cleanText(d.text, 1000), createdAt: stamp(d.createdAt), sourceIds: list(d.sourceIds, 8).map(ident), plantId: ident(d.plantId) }));
    const fids = new Set(s.fragments.map(f => f.id)), cids = new Set(s.creations.map(c => c.id));
    if (fids.size !== s.fragments.length || cids.size !== s.creations.length || new Set(s.creations.map(c => c.fragmentId)).size !== s.creations.length) throw new Error('存档中存在重复物品');
    for (const f of s.fragments) if (f.proposal.sourceIds.some(id => !fids.has(id)) || !f.proposal.sourceIds.includes(f.id)) throw new Error('梦种的来历不完整');
    for (const c of s.creations) if (!fids.has(c.fragmentId) || c.sourceIds.some(id => !fids.has(id))) throw new Error('收藏物品的来历不完整');
    for (const a of [s.activity, ...s.queue, ...s.paused]) {
      if (a.kind === 'craft' && !fids.has(a.fragmentId)) throw new Error('制作计划缺少梦种');
      if (a.studyFragmentId && !fids.has(a.studyFragmentId)) throw new Error('研究计划缺少梦种');
    }
    for (const f of s.fragments) if (f.status === 'made' && !s.creations.some(c => c.fragmentId === f.id)) throw new Error('已完成的收藏物品缺失');
    if (new Set(s.knowledge.map(k => k.key)).size !== s.knowledge.length || new Set(s.plants.map(p => p.creationId)).size !== s.plants.length || new Set(s.discoveries.map(d => d.plantId)).size !== s.discoveries.length) throw new Error('成长记录出现重复');
    for (const p of s.plants) {
      if (!cids.has(p.creationId) || !fids.has(p.fragmentId) || !s.knowledge.some(k => k.key === 'seed:' + p.fragmentId)) throw new Error('植物缺少来历或种植知识');
      if (p.bloomed !== (p.growth === 1) || (p.bloomed && !s.discoveries.some(d => d.id === p.invitationId && d.plantId === p.id))) throw new Error('植物成长记录不一致');
    }
    for (const d of s.discoveries) if (!s.plants.some(p => p.id === d.plantId && p.bloomed)) throw new Error('发现缺少已经长大的植物');
    if (s.activity.plantFragmentId && !s.knowledge.some(k => k.key === 'seed:' + s.activity.plantFragmentId)) throw new Error('种植计划尚未掌握知识');
    if (s.activity.knowledgeFragmentId && !s.knowledge.some(k => k.key === 'seed:' + s.activity.knowledgeFragmentId)) throw new Error('制作计划尚未掌握材料和方法');
    if (s.activity.kind === 'craft' && !s.knowledge.some(k => k.key === 'seed:' + s.activity.fragmentId)) throw new Error('制作计划尚未掌握材料和方法');
    // Sequence cannot be rolled back by a malformed import and collide with existing IDs.
    const ids = [s.activity.id, ...s.paused.map(a => a.id), ...s.fragments.map(f => f.id), ...s.creations.map(c => c.id), ...s.memories.map(m => m.id), ...s.events.map(v => v.id), ...s.knowledge.map(v => v.id), ...s.plants.map(v => v.id), ...s.discoveries.map(v => v.id)];
    s.serial = Math.max(s.serial, ...ids.filter(Boolean).map(v => Number(v.split('-').pop()) || 0));
    // The saved board remains available, but a closed session is not a live
    // invitation. Resume her bookmarked life from the last saved instant.
    if (s.activity.kind === 'game') resume(s, s.lastAdvancedAt);
    advance(s, now); return s;
  }
  function number(v, min, max, label) { if (!Number.isFinite(v) || v < min || v > max) throw new Error((label || '数值') + '格式不正确'); return v; }
  function stamp(v) { return Math.floor(number(v, 0, 8640000000000000, '时间')); }
  function cleanText(v, max) { if (typeof v !== 'string' || v.length > max || /\u0000/.test(v)) throw new Error('文字内容格式不正确'); return v; }
  function ident(v) { if (typeof v !== 'string' || !/^[a-z]+-\d{1,10}$/.test(v)) throw new Error('编号格式不正确'); return v; }
  function list(v, max) { if (!Array.isArray(v) || v.length > max) throw new Error('存档列表格式不正确'); return v; }
  function allowed(v, values) { if (!values.includes(v)) throw new Error('存档类型不正确'); return v; }
  function cleanTags(v) { return list(v || [], 10).map(t => cleanText(t, 20)); }
  function cleanProposal(p) {
    if (!p || typeof p !== 'object') throw new Error('物品提案缺失');
    if (typeof p.color !== 'string' || !/^#[a-f0-9]{6}$/i.test(p.color)) throw new Error('物品颜色无效');
    return { name: cleanText(p.name, 60), description: cleanText(p.description, 800), kind: allowed(p.kind, ['seed', 'cup', 'charm', 'lantern', 'plant', 'bottle', 'book', 'ornament', 'food']), color: p.color,
      sourceIds: list(p.sourceIds, 5).map(ident), relatedCreationId: p.relatedCreationId ? ident(p.relatedCreationId) : null,
      rule: p.rule === 'user-imported-proposal' ? p.rule : 'local-combination-v1', tags: cleanTags(p.tags), ...(p.thought ? { thought: cleanText(p.thought, 180) } : {}) };
  }
  function cleanActivity(a, queued) {
    if (!a || typeof a !== 'object') throw new Error('生活计划缺失');
    const kind = allowed(a.kind, Object.keys(ACTIVITIES));
    const result = { kind, title: cleanText(a.title, 120), detail: cleanText(a.detail, 800), place: allowed(a.place, ['bed', 'fire', 'desk', 'rug', 'window', 'shelf']), durationMs: number(a.durationMs, 1000, 12 * HOUR, '活动时长') };
    if (!queued) {
      result.id = ident(a.id); result.startedAt = stamp(a.startedAt); result.endsAt = stamp(a.endsAt); result.progressBase = number(a.progressBase || 0, 0, 1, '活动进度');
      if (result.endsAt <= result.startedAt || result.endsAt - result.startedAt > result.durationMs + 1) throw new Error('活动时间不合理');
    }
    if (kind === 'read') result.bookId = allowed(a.bookId, BOOKS.map(b => b.id));
    if (kind === 'craft') result.fragmentId = ident(a.fragmentId);
    if (a.studyFragmentId) result.studyFragmentId = ident(a.studyFragmentId);
    if (a.plantFragmentId) result.plantFragmentId = ident(a.plantFragmentId);
    if (a.knowledgeFragmentId) result.knowledgeFragmentId = ident(a.knowledgeFragmentId);
    if (a.energyAtStart !== undefined) result.energyAtStart = number(a.energyAtStart, 0, 100, '精神');
    if (a.tentative === true) result.tentative = true;
    if (a.decision) result.decision = { reason: cleanText(a.decision.reason, 600), reasons: list(a.decision.reasons, 8).map(v => cleanText(v, 300)), candidates: list(a.decision.candidates || [], 10).map(c => ({ kind: cleanText(c.kind, 20), score: number(c.score, 0, 1000), eligible: c.eligible === true, reasons: list(c.reasons || [], 8).map(v => cleanText(v, 300)), reason: cleanText(c.reason || '', 600) })), sourceIds: list(a.decision.sourceIds || [], 8).map(ident) };
    if (a.userInitiated === true) result.userInitiated = true;
    return result;
  }
  function cleanBoard(b) {
    if (b === null || b === undefined) return null;
    if (!b || typeof b !== 'object' || b.version !== 1 || b.size !== 15) throw new Error('棋局格式不正确');
    const board = list(b.board, 225).map(v => allowed(v, [0, 1, 2])); if (board.length !== 225) throw new Error('棋盘大小不正确');
    const result = { version: 1, size: 15, board, turn: allowed(b.turn, ['human', 'witch']), winner: allowed(b.winner, [null, 'human', 'witch', 'draw']), lastMove: b.lastMove === null ? null : number(b.lastMove, 0, 224), history: list(b.history || [], 225).map(m => ({ index: number(m.index, 0, 224), player: allowed(m.player, [1, 2]) })), outcomeNotified: b.outcomeNotified === true };
    if (result.history.some(m => !Number.isInteger(m.index)) || (result.lastMove !== null && !Number.isInteger(result.lastMove))) throw new Error('棋局位置不正确');
    return result;
  }
  function exportState(s) { return JSON.stringify({ ...s, exportedAt: Date.now() }, null, 2); }
  return { create, advance, holdGame, currentView, interrupt, resume, addFragment, acceptFragment, deferFragment, applyProposal, waterPlant, inspectCreation, decisionView: (s, now) => scores(s, now === undefined ? s.lastAdvancedAt : now, s.activity.kind), validate, exportState, BOOKS, LIMITS, MINUTE, HOUR };
});

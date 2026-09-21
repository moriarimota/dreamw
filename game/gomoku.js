(function (global) {
  'use strict';

  const SIZE = 15;
  const CELLS = SIZE * SIZE;
  const AXES = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;
  const cell = (x, y) => y * SIZE + x;
  const clone = value => JSON.parse(JSON.stringify(value));

  function createState() {
    return { version: 1, size: SIZE, board: Array(CELLS).fill(0), turn: 'human', winner: null, lastMove: null, history: [], outcomeNotified: false };
  }

  function winnerAt(board, index, player) {
    if (!Number.isInteger(index) || index < 0 || index >= CELLS || !player || board[index] !== player) return false;
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    return AXES.some(([dx, dy]) => {
      let count = 1;
      for (const sign of [-1, 1]) {
        let xx = x + dx * sign;
        let yy = y + dy * sign;
        while (inBounds(xx, yy) && board[cell(xx, yy)] === player) {
          count += 1;
          xx += dx * sign;
          yy += dy * sign;
        }
      }
      return count >= 5;
    });
  }

  function checkWinner(board) {
    for (let i = 0; i < CELLS; i += 1) {
      if (board[i] && winnerAt(board, i, board[i])) return board[i] === 1 ? 'human' : 'witch';
    }
    return board.every(value => value !== 0) ? 'draw' : null;
  }

  function validateSave(saved) {
    const invalid = reason => ({ valid: false, reason, state: createState() });
    if (saved == null) return { valid: true, reason: '', state: createState() };
    if (!saved || typeof saved !== 'object' || !Array.isArray(saved.board) || saved.board.length !== CELLS) return invalid('棋盘记录不完整，已经铺好一张新棋盘。');
    if (saved.version !== undefined && saved.version !== 1) return invalid('这份棋局暂时无法读取，已经铺好一张新棋盘。');
    if (!saved.board.every(value => Number.isInteger(value) && value >= 0 && value <= 2)) return invalid('棋子记录有些混乱，已经铺好一张新棋盘。');
    const board = saved.board.slice();
    const black = board.filter(value => value === 1).length;
    const white = board.filter(value => value === 2).length;
    if (black !== white && black !== white + 1) return invalid('落子顺序不完整，已经铺好一张新棋盘。');
    const blackWon = board.some((value, i) => value === 1 && winnerAt(board, i, 1));
    const whiteWon = board.some((value, i) => value === 2 && winnerAt(board, i, 2));
    if ((blackWon && whiteWon) || (blackWon && black !== white + 1) || (whiteWon && black !== white)) return invalid('这份棋局的结果无法确认，已经铺好一张新棋盘。');
    const state = createState();
    state.board = board;
    state.turn = black === white ? 'human' : 'witch';
    state.winner = blackWon ? 'human' : whiteWon ? 'witch' : black + white === CELLS ? 'draw' : null;
    state.outcomeNotified = Boolean(state.winner && saved.outcomeNotified);
    // History may be a known suffix: old saves without history remain playable.
    if (Array.isArray(saved.history) && saved.history.length <= black + white) {
      let expected = black === white ? 2 : 1;
      const seen = new Set();
      let valid = true;
      for (let i = saved.history.length - 1; i >= 0; i -= 1) {
        const move = saved.history[i];
        if (!move || !Number.isInteger(move.index) || move.index < 0 || move.index >= CELLS || move.player !== expected || board[move.index] !== expected || seen.has(move.index)) { valid = false; break; }
        seen.add(move.index);
        expected = 3 - expected;
      }
      if (valid) state.history = saved.history.map(move => ({ index: move.index, player: move.player }));
    }
    const tail = state.history[state.history.length - 1];
    if (tail) state.lastMove = tail.index;
    else if (Number.isInteger(saved.lastMove) && saved.lastMove >= 0 && saved.lastMove < CELLS && board[saved.lastMove] === (black === white ? 2 : 1)) state.lastMove = saved.lastMove;
    return { valid: true, reason: '', state };
  }

  function restoreState(saved) { return validateSave(saved).state; }

  function play(state, index) {
    if (!Number.isInteger(index) || index < 0 || index >= CELLS || state.winner || state.board[index]) return null;
    const next = clone(state);
    const player = state.turn === 'human' ? 1 : 2;
    next.board[index] = player;
    next.history.push({ index, player });
    next.lastMove = index;
    next.turn = player === 1 ? 'witch' : 'human';
    next.winner = winnerAt(next.board, index, player) ? (player === 1 ? 'human' : 'witch') : next.board.every(Boolean) ? 'draw' : null;
    return next;
  }

  function canUndo(state) {
    if (state.winner || !state.history.length) return false;
    const last = state.history[state.history.length - 1];
    return last.player === 1 || (state.history.length >= 2 && state.history[state.history.length - 2].player === 1);
  }

  function undo(state) {
    if (!canUndo(state)) return null;
    const next = clone(state);
    const last = next.history.pop();
    next.board[last.index] = 0;
    if (last.player === 2) next.board[next.history.pop().index] = 0;
    next.lastMove = next.history.length ? next.history[next.history.length - 1].index : null;
    next.turn = 'human';
    next.winner = null;
    next.outcomeNotified = false;
    return next;
  }

  function candidates(board) {
    const near = new Set();
    for (let i = 0; i < CELLS; i += 1) {
      if (!board[i]) continue;
      const x = i % SIZE;
      const y = Math.floor(i / SIZE);
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        if (inBounds(xx, yy) && !board[cell(xx, yy)]) near.add(cell(xx, yy));
      }
    }
    return near.size ? Array.from(near) : board.some(Boolean) ? [] : [cell(7, 7)];
  }

  function positionalScore(board, index, player) {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    let total = 0;
    let threats = 0;
    board[index] = player;
    for (const [dx, dy] of AXES) {
      let run = 1;
      let open = 0;
      for (const sign of [-1, 1]) {
        let xx = x + dx * sign;
        let yy = y + dy * sign;
        while (inBounds(xx, yy) && board[cell(xx, yy)] === player) { run += 1; xx += dx * sign; yy += dy * sign; }
        if (inBounds(xx, yy) && !board[cell(xx, yy)]) open += 1;
      }
      if (run >= 5) total += 1000000;
      else if (run === 4 && open === 2) { total += 50000; threats += 2; }
      else if (run === 4 && open === 1) { total += 8000; threats += 1; }
      else if (run === 3 && open === 2) { total += 3500; threats += 1; }
      else if (run === 3 && open === 1) total += 240;
      else if (run === 2 && open === 2) total += 160;
      else if (run === 2 && open === 1) total += 25;
      // Five-cell windows also detect broken lines such as XX_XX.
      for (let offset = -4; offset <= 0; offset += 1) {
        let friends = 0;
        let viable = true;
        for (let step = 0; step < 5; step += 1) {
          const xx = x + (offset + step) * dx;
          const yy = y + (offset + step) * dy;
          if (!inBounds(xx, yy) || board[cell(xx, yy)] === 3 - player) { viable = false; break; }
          if (board[cell(xx, yy)] === player) friends += 1;
        }
        if (viable) total += [0, 1, 8, 75, 650, 100000][friends];
      }
    }
    if (threats > 1) total += threats * 2500;
    board[index] = 0;
    return total;
  }

  function chooseMove(input, player = 2) {
    if (!Array.isArray(input) || input.length !== CELLS || !input.every(value => value === 0 || value === 1 || value === 2) || (player !== 1 && player !== 2)) return null;
    const board = input.slice();
    if (checkWinner(board)) return null;
    const choices = candidates(board);
    for (const side of [player, 3 - player]) {
      for (const index of choices) {
        board[index] = side;
        const wins = winnerAt(board, index, side);
        board[index] = 0;
        if (wins) return index;
      }
    }
    let best = null;
    let bestScore = -Infinity;
    for (const index of choices) {
      const offense = positionalScore(board, index, player);
      const defense = positionalScore(board, index, 3 - player);
      const center = 14 - Math.abs(index % SIZE - 7) - Math.abs(Math.floor(index / SIZE) - 7);
      const score = offense * 1.05 + defense + center * 0.6;
      if (score > bestScore) { bestScore = score; best = index; }
    }
    return best;
  }

  const CSS = `
.wg-game{--wg-ink:#354739;--wg-muted:#716d58;--wg-rust:#994e42;color:var(--wg-ink);width:100%;max-width:510px;margin:0 auto;font-family:inherit;box-sizing:border-box;padding:6px 0 2px}
.wg-game *{box-sizing:border-box}.wg-game button{font:inherit;touch-action:manipulation;cursor:pointer}.wg-game button:disabled{cursor:default;opacity:.45}
.wg-intro{margin:0 0 12px;font-size:14px;line-height:1.7;color:var(--wg-muted)}
.wg-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}.wg-turn{display:inline-flex;gap:8px;align-items:center;font-weight:600;font-size:14px}.wg-dot{width:12px;height:12px;border-radius:50%;background:#35362f;box-shadow:0 1px 2px #0004}.wg-dot.is-white{background:#fffcdf;border:1px solid #afa785}.wg-count{font-size:12px;color:var(--wg-muted)}
.wg-board{position:relative;display:grid;grid-template-rows:repeat(15,1fr);width:100%;aspect-ratio:1;overflow:hidden;border:1px solid #bc9f6e;border-radius:8px;background:#dfc494;box-shadow:inset 0 0 25px #9d76371c,0 3px 9px #46382018;isolation:isolate;touch-action:manipulation}
.wg-board:before{content:'';position:absolute;inset:calc(100% / 30);border:1px solid #92764e99;background-image:linear-gradient(to right,#92764e88 1px,transparent 1px),linear-gradient(to bottom,#92764e88 1px,transparent 1px);background-size:calc(100% / 14) calc(100% / 14);pointer-events:none;z-index:-1}
.wg-row{display:grid;grid-template-columns:repeat(15,minmax(0,1fr));min-height:0}.wg-cell{position:relative;display:block;min-width:0;min-height:0;width:100%;height:100%;padding:0;border:0;border-radius:0;background:transparent;outline:none;-webkit-tap-highlight-color:transparent}
.wg-cell:before{content:'';position:absolute;width:79%;height:79%;left:10.5%;top:10.5%;border-radius:50%;transform:scale(.96)}
.wg-cell.is-black:before{background:radial-gradient(circle at 35% 28%,#55574b,#292d27 70%);box-shadow:0 2px 3px #4c372957,inset 0 0 0 1px #272921}
.wg-cell.is-white:before{background:radial-gradient(circle at 35% 28%,#fffef1,#eee4c9 76%);box-shadow:0 2px 3px #4c37294a,inset 0 0 0 1px #c4b68e}
.wg-cell.is-star:not(.is-black):not(.is-white):not(.is-selected):before{width:15%;height:15%;left:42.5%;top:42.5%;background:#8b714b}
.wg-cell.is-last:after{content:'';position:absolute;width:18%;height:18%;top:41%;left:41%;border-radius:50%;background:#d88960;box-shadow:0 0 0 1px #fff6}
.wg-cell.is-selected:before{background:#35473955;box-shadow:0 0 0 2px #4d674f;transform:scale(.88)}
.wg-cell:focus-visible{outline:2px solid #344d36;outline-offset:-2px;border-radius:4px;background:#ffffff21}
.wg-status{min-height:42px;margin:11px 0 6px;line-height:1.6;font-size:14px}.wg-hint{margin:0 0 13px;color:var(--wg-muted);font-size:12px;line-height:1.6}
.wg-actions{display:flex;flex-wrap:wrap;gap:8px}.wg-btn{border:1px solid #cfc1a2!important;background:#f4eddc!important;color:var(--wg-ink)!important;border-radius:10px!important;min-height:42px;padding:9px 13px!important;line-height:1.3!important;font-size:13px!important;box-shadow:none!important}.wg-btn:focus-visible{outline:2px solid #506a52;outline-offset:2px}.wg-btn.wg-primary{background:#4c644e!important;border-color:#4c644e!important;color:#fff8e6!important;font-weight:600;flex:1}.wg-btn.wg-exit{margin-left:auto}.wg-restart{margin:12px 0 0;padding:12px;border:1px solid #d8b598;background:#f3e4cc;border-radius:10px}.wg-restart[hidden]{display:none}.wg-restart p{margin:0 0 10px;font-size:13px;line-height:1.6}.wg-restart .wg-btn{min-height:38px}.wg-restart .wg-danger{color:#8d4036!important}.wg-notice{font-size:12px;line-height:1.6;color:#8b4b37;margin:8px 0}.wg-notice:empty{display:none}
@media(max-width:360px){.wg-actions{gap:6px}.wg-btn{padding:9px 10px!important}.wg-intro{font-size:13px}.wg-game{padding-top:0}}
`;

  function mount(container, options = {}) {
    if (!container || typeof container.appendChild !== 'function') throw new TypeError('WitchGomoku.mount needs a DOM container.');
    if (!global.document.getElementById('witch-gomoku-styles')) {
      const style = global.document.createElement('style');
      style.id = 'witch-gomoku-styles';
      style.textContent = CSS;
      global.document.head.appendChild(style);
    }
    const loaded = validateSave(options.saved);
    let state = loaded.state;
    // A completed imported match was already experienced; reopening is not a new win.
    if (state.winner) state.outcomeNotified = true;
    let selected = null;
    let cursor = state.lastMove == null ? cell(7, 7) : state.lastMove;
    let timer = null;
    let destroyed = false;
    let closed = false;
    let comment = '';
    const root = global.document.createElement('section');
    root.className = 'wg-game';
    root.setAttribute('aria-label', '和她下一盘五子棋');
    root.innerHTML = `<p class="wg-intro">她把手边的事情放了放，挪来两张小凳子。<br>「来吧，你拿黑子。下到一半也可以留着。」</p><div class="wg-meta"><span class="wg-turn"><i class="wg-dot" aria-hidden="true"></i><span class="wg-turn-text"></span></span><span class="wg-count"></span></div><div class="wg-board" role="grid" aria-label="十五路五子棋棋盘，方向键移动，回车确认落子" aria-rowcount="15" aria-colcount="15"></div><p class="wg-status" role="status" aria-live="polite" aria-atomic="true"></p><p class="wg-hint">轻点选位置，再点同处或「落子」确认。连成五颗就赢，没有禁手。</p><div class="wg-actions"><button type="button" class="wg-btn wg-primary" data-action="place">先选一个位置</button><button type="button" class="wg-btn" data-action="undo">悔一步</button><button type="button" class="wg-btn" data-action="restart">重新开局</button><button type="button" class="wg-btn wg-exit" data-action="exit">收好棋盘</button></div><div class="wg-restart" hidden><p>把这一盘收起来，重新摆一张空棋盘吗？当前棋局会被替换。</p><div class="wg-actions"><button type="button" class="wg-btn wg-danger" data-action="confirm-restart">好，再来一盘</button><button type="button" class="wg-btn" data-action="cancel-restart">继续这一盘</button></div></div><p class="wg-notice"></p>`;
    const boardEl = root.querySelector('.wg-board');
    const statusEl = root.querySelector('.wg-status');
    const turnEl = root.querySelector('.wg-turn-text');
    const dotEl = root.querySelector('.wg-dot');
    const countEl = root.querySelector('.wg-count');
    const placeButton = root.querySelector('[data-action="place"]');
    const undoButton = root.querySelector('[data-action="undo"]');
    const restartPanel = root.querySelector('.wg-restart');
    root.querySelector('.wg-notice').textContent = loaded.reason;
    const buttons = [];
    for (let y = 0; y < SIZE; y += 1) {
      const row = global.document.createElement('div');
      row.className = 'wg-row';
      row.setAttribute('role', 'row');
      for (let x = 0; x < SIZE; x += 1) {
        const button = global.document.createElement('button');
        button.type = 'button';
        button.className = 'wg-cell';
        button.dataset.index = String(cell(x, y));
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-rowindex', String(y + 1));
        button.setAttribute('aria-colindex', String(x + 1));
        row.appendChild(button);
        buttons.push(button);
      }
      boardEl.appendChild(row);
    }
    container.appendChild(root);

    function emit(name, ...args) {
      if (typeof options[name] === 'function') {
        try { options[name](...args); } catch (error) { if (global.console) global.console.error('五子棋回调未完成:', name, error); }
      }
    }
    function save() { emit('onChange', clone(state)); }
    function cancelTimer() { if (timer !== null) global.clearTimeout(timer); timer = null; }
    function coordinate(index) { return `第 ${Math.floor(index / SIZE) + 1} 行、第 ${index % SIZE + 1} 列`; }
    function render() {
      if (destroyed) return;
      buttons.forEach((button, index) => {
        const x = index % SIZE;
        const y = Math.floor(index / SIZE);
        button.className = 'wg-cell' + (state.board[index] === 1 ? ' is-black' : state.board[index] === 2 ? ' is-white' : '') + (index === state.lastMove ? ' is-last' : '') + (index === selected ? ' is-selected' : '') + ([3, 7, 11].includes(x) && [3, 7, 11].includes(y) ? ' is-star' : '');
        button.tabIndex = index === cursor ? 0 : -1;
        button.setAttribute('aria-label', `${coordinate(index)}，${state.board[index] === 1 ? '你的黑子' : state.board[index] === 2 ? '她的白子' : '空位'}${index === state.lastMove ? '，最后落子' : ''}${index === selected ? '，已选中，再次确认即可落子' : ''}`);
        button.setAttribute('aria-selected', String(index === selected));
        button.setAttribute('aria-disabled', String(Boolean(state.winner || state.turn !== 'human' || state.board[index])));
      });
      const total = state.board.filter(Boolean).length;
      countEl.textContent = total ? `已落 ${total} 子 · 橙点是上一手` : '你执黑，她执白';
      dotEl.classList.toggle('is-white', state.turn === 'witch');
      turnEl.textContent = state.winner ? '这一盘收好啦' : state.turn === 'human' ? '轮到你了' : '她正在想下一步';
      if (state.winner === 'human') statusEl.textContent = '「呀，被你连起来了。让我再看一眼……」她笑着把棋盘往你这边推了推。';
      else if (state.winner === 'witch') statusEl.textContent = '「这里，刚好五颗！」她忍不住轻轻敲了敲棋盘。';
      else if (state.winner === 'draw') statusEl.textContent = '棋盘已经满满当当。「这一盘好长，我们一起把棋子收好吧。」';
      else if (state.turn === 'witch') statusEl.textContent = '她捏着一颗白子，沿着棋盘看了看。「唔，让我想想……」';
      else if (selected !== null) statusEl.textContent = `选好了${coordinate(selected)}。再点一下这里，或按「落子」。`;
      else statusEl.textContent = comment || (total ? '她落好了白子，抬头等你。你可以慢慢想。' : '「先从哪里开始呢？」轻点棋盘，为你的第一颗黑子找个位置。');
      placeButton.disabled = Boolean(state.winner || state.turn !== 'human' || selected === null || state.board[selected]);
      placeButton.textContent = state.winner ? '这一盘结束了' : state.turn === 'witch' ? '等她落子…' : selected === null ? '先选一个位置' : '落子';
      undoButton.disabled = !canUndo(state);
    }
    function commit(next) {
      if (!next || destroyed || closed) return;
      state = next;
      selected = null;
      comment = '';
      let finished = false;
      if (state.winner && !state.outcomeNotified) { state.outcomeNotified = true; finished = true; }
      render();
      save();
      if (finished) emit('onFinish', state.winner, clone(state));
      if (!destroyed && !closed) scheduleAI();
    }
    function scheduleAI() {
      cancelTimer();
      if (destroyed || closed || state.winner || state.turn !== 'witch') return;
      timer = global.setTimeout(() => {
        timer = null;
        if (destroyed || closed || state.winner || state.turn !== 'witch') return;
        const index = chooseMove(state.board, 2);
        if (index !== null) commit(play(state, index));
      }, 650);
    }
    function place() {
      if (state.turn !== 'human' || selected === null || state.winner || destroyed || closed) return;
      commit(play(state, selected));
    }
    function select(index, confirm) {
      if (destroyed || closed || state.winner || state.turn !== 'human' || state.board[index]) return;
      cursor = index;
      if (selected === index && confirm) { place(); return; }
      selected = index;
      comment = '';
      render();
    }
    function reset() {
      cancelTimer();
      state = createState();
      selected = null;
      cursor = cell(7, 7);
      comment = '她把黑子重新推给你。「再来一盘。」';
      restartPanel.hidden = true;
      render();
      save();
      buttons[cursor].focus({ preventScroll: true });
    }
    function onClick(event) {
      const button = event.target.closest('button');
      if (!button || !root.contains(button) || destroyed || closed) return;
      if (button.dataset.index !== undefined) { select(Number(button.dataset.index), true); return; }
      switch (button.dataset.action) {
        case 'place': place(); break;
        case 'undo': {
          const next = undo(state);
          if (next) { cancelTimer(); state = next; selected = null; comment = '「好，刚才那一步不算。」她把棋子轻轻收了回来。'; render(); save(); }
          break;
        }
        case 'restart':
          if (!state.board.some(Boolean) || state.winner) reset();
          else { restartPanel.hidden = false; root.querySelector('[data-action="cancel-restart"]').focus({ preventScroll: true }); }
          break;
        case 'confirm-restart': reset(); break;
        case 'cancel-restart': restartPanel.hidden = true; root.querySelector('[data-action="restart"]').focus({ preventScroll: true }); break;
        case 'exit': cancelTimer(); save(); closed = true; emit('onExit', clone(state)); break;
      }
    }
    function onKeyDown(event) {
      const button = event.target.closest('[data-index]');
      if (!button || destroyed || closed) return;
      cursor = Number(button.dataset.index);
      const shifts = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (shifts[event.key]) {
        event.preventDefault();
        const [dx, dy] = shifts[event.key];
        const x = Math.max(0, Math.min(SIZE - 1, cursor % SIZE + dx));
        const y = Math.max(0, Math.min(SIZE - 1, Math.floor(cursor / SIZE) + dy));
        cursor = cell(x, y);
        if (state.turn === 'human' && !state.winner && !state.board[cursor]) selected = cursor;
        else selected = null;
        render();
        buttons[cursor].focus({ preventScroll: true });
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(cursor, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        selected = null;
        render();
      }
    }
    root.addEventListener('click', onClick);
    boardEl.addEventListener('keydown', onKeyDown);
    render();
    scheduleAI();
    return {
      getState() { return clone(state); },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        cancelTimer();
        root.removeEventListener('click', onClick);
        boardEl.removeEventListener('keydown', onKeyDown);
        root.remove();
      }
    };
  }

  global.WitchGomoku = {
    mount,
    engine: Object.freeze({ SIZE, createState, validateSave, restoreState, winnerAt, checkWinner, chooseMove, play, canUndo, undo })
  };
})(typeof window !== 'undefined' ? window : globalThis);

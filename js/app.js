// ─────────────────────────────────────────────
// FIREBASE
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCvh-pNeesCaGE32LTLjpF7SypCbybx0Yw",
  authDomain: "jogo-da-memoria-1ad1e.firebaseapp.com",
  databaseURL: "https://jogo-da-memoria-1ad1e-default-rtdb.firebaseio.com",
  projectId: "jogo-da-memoria-1ad1e",
  storageBucket: "jogo-da-memoria-1ad1e.firebasestorage.app",
  messagingSenderId: "616006526373",
  appId: "1:616006526373:web:6210c90d46be1c8072744c"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const EMOJIS = [
  '🐶','🐱','🦊','🐻','🐼','🦁','🐮','🐷','🐸','🐵',
  '🍕','🍔','🌮','🍣','🍦','🎂','🍩','🍓','🍇','🥑',
  '🚀','🌈','⚡','🔥','💎','🎮','🎸','🏆','🎯','🌸',
  '🌊','⭐','🌙','☀️','🦋','🎭','🎪','🎨','🦄','🌴'
];

let COLORS     = ['#e94560','#4fc3f7','#81c784','#ffb74d'];
let COLORS_RGB = ['233,69,96','79,195,247','129,199,132','255,183,77'];
const COLORS_D     = ['#0077bb','#ee7733','#33bbee','#ee3377'];
const COLORS_RGB_D = ['0,119,187','238,119,51','51,187,238','238,51,119'];
let modoDaltonico = false;

const SIZES = {
  '4x4': { cols: 4, pairs: 8  },
  '4x5': { cols: 5, pairs: 10 },
  '6x6': { cols: 6, pairs: 18 }
};

// ─────────────────────────────────────────────
// CONFIG STATE (setup screen values)
// ─────────────────────────────────────────────
const cfg = { mode:'ai', diff:'easy', np:2, size:'4x4', osize:'4x4' };

// ─────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────
let G = {};
let jogoTimer      = null;
let jogoTempo      = 0;
let jogoTentativas = 0;
let jogoStartOnline = 0;
let layoutHorizontal = localStorage.getItem('layoutH') === '1';

// ─────────────────────────────────────────────
// SETUP HELPERS
// ─────────────────────────────────────────────
function showScreen(id) {
  initAudio();
  stopHinoFlamengo();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  playMusic();
  if (id === 'screen-online') limparStatusOnline();
  const layoutBtn = document.getElementById('layout-toggle-btn');
  if (layoutBtn) layoutBtn.classList.toggle('visivel', id === 'screen-game');
  if (id === 'screen-game') aplicarLayoutJogo();
}

function toggleLayoutJogo() {
  layoutHorizontal = !layoutHorizontal;
  localStorage.setItem('layoutH', layoutHorizontal ? '1' : '0');
  aplicarLayoutJogo();
  recalcBoardSize();
}

function aplicarLayoutJogo() {
  const screen = document.getElementById('screen-game');
  const btn    = document.getElementById('layout-toggle-btn');
  if (!screen) return;
  screen.classList.toggle('layout-h', layoutHorizontal);
  if (btn) btn.textContent = layoutHorizontal ? '↕' : '↔';
}

function recalcBoardSize() {
  if (!G.cols || !G.cards) return;
  const board = document.getElementById('board');
  if (!board) return;
  let cardSize;
  if (layoutHorizontal) {
    const rows   = Math.ceil(G.cards.length / G.cols);
    const availW = Math.max(60, window.innerWidth  - 40 - 190 - 20);
    const availH = Math.max(60, window.innerHeight - 60);
    const byW    = Math.floor((Math.min(availW, 600) - G.cols * 9) / G.cols);
    const byH    = Math.floor((availH - rows * 9) / rows);
    cardSize = Math.max(36, Math.min(byW, byH, 100));
  } else {
    const vw = Math.min(window.innerWidth - 40, 960);
    cardSize  = Math.min(Math.floor((vw - G.cols * 9) / G.cols), 110);
  }
  board.style.width = `${cardSize * G.cols + 9 * (G.cols - 1)}px`;
}

function limparStatusOnline() {
  const st = document.getElementById('online-status');
  if (st) st.innerHTML = '';
  const cod = document.getElementById('codigo-sala');
  if (cod) cod.value = '';
  if (salaRef) {
    salaRef.child('status').off();
    salaRef.child('jogadores').off();
    salaRef.off();
    salaRef = null;
  }
}

function switchTab(panelId, tabEl) {
  const card = tabEl.closest('.glass-card');
  card.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  card.querySelectorAll('.screen-tab').forEach(t => t.classList.remove('sel'));
  document.getElementById(panelId).style.display = 'block';
  tabEl.classList.add('sel');
  if (panelId === 'tab-recordes')      mostrarRecordes();
  if (panelId === 'tab-ranking')       carregarRanking('4x4');
  if (panelId === 'tab-stats-offline') mostrarEstatisticasOffline();
  if (panelId === 'tab-stats-online')  mostrarEstatisticasOnline();
}

function pick(el) {
  const g = el.dataset.g;
  document.querySelectorAll(`[data-g="${g}"]`).forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  cfg[g] = el.dataset.v;
  if (g === 'np') cfg.np = parseInt(el.dataset.v);

  if (g === 'mode') {
    const ai = cfg.mode === 'ai';
    document.getElementById('sec-hname').style.display = ai ? '' : 'none';
    document.getElementById('sec-diff').style.display  = ai ? '' : 'none';
    document.getElementById('sec-nump').style.display  = ai ? 'none' : '';
    document.getElementById('sec-names').style.display = ai ? 'none' : '';
    if (!ai) buildNames();
  }
}

function buildNames() {
  const n   = cfg.np;
  const box = document.getElementById('names-container');
  box.innerHTML = '';
  document.getElementById('sec-names').style.display = '';
  for (let i = 0; i < n; i++) {
    const inp = document.createElement('input');
    inp.className   = 'p-input';
    inp.type        = 'text';
    inp.placeholder = `Jogador ${i + 1}`;
    inp.maxLength   = 20;
    inp.style.borderColor = COLORS[i] + '55';
    box.appendChild(inp);
  }
}

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
function startGame() {
  const rbar = document.getElementById('reaction-bar');
  if (rbar) rbar.style.display = 'none';
  const size = SIZES[cfg.size];

  // Build players
  const players = [];
  if (cfg.mode === 'ai') {
    const humanName = (document.getElementById('human-name').value.trim()) || 'Você';
    players.push({ name: humanName,  score: 0, isAI: false, color: COLORS[0], rgb: COLORS_RGB[0] });
    players.push({ name: 'Máquina', score: 0, isAI: true,  color: COLORS[1], rgb: COLORS_RGB[1] });
  } else {
    const inputs = document.querySelectorAll('#names-container input');
    for (let i = 0; i < cfg.np; i++) {
      const name = (inputs[i] && inputs[i].value.trim()) || `Jogador ${i + 1}`;
      players.push({ name, score: 0, isAI: false, color: COLORS[i], rgb: COLORS_RGB[i] });
    }
  }

  // Build shuffled cards
  const picked = shuffle([...EMOJIS]).slice(0, size.pairs);
  const values = shuffle([...picked, ...picked]);

  G = {
    cards: values.map((emoji, id) => ({ id, emoji, flipped: false, matched: false })),
    flipped: [],
    players,
    cur: 0,
    busy: false,
    aiMem: {},        // { cardIndex: emoji }
    totalPairs: size.pairs,
    donePairs: 0,
    cols: size.cols
  };

  jogoTempo = 0; jogoTentativas = 0;
  clearInterval(jogoTimer);
  jogoTimer = setInterval(() => { jogoTempo++; atualizarTimerOffline(); }, 1000);

  renderScores();
  renderBoard();
  setTurnBar();
  showScreen('screen-game');
  atualizarTimerOffline();

  // If somehow AI goes first (shouldn't happen), trigger it
  if (G.players[G.cur].isAI) scheduleAI();
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function renderBoard() {
  playSomEntrada();
  aplicarLayoutJogo();
  const board = document.getElementById('board');
  board.innerHTML = '';
  board.style.gridTemplateColumns = `repeat(${G.cols}, 1fr)`;
  recalcBoardSize();

  G.cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card' + (card.flipped ? ' flipped' : '') + (card.matched ? ' matched' : '');
    el.id = `c${i}`;
    el.innerHTML = `
      <div class="card-inner">
        <div class="face back">🃏</div>
        <div class="face front">${card.emoji}</div>
      </div>`;
    if (!card.flipped && !card.matched) el.addEventListener('click', (e) => { criarRipple(el, e); onCardClick(i); });

    const row = Math.floor(i / G.cols);
    const col = i % G.cols;
    el.style.animationDelay = `${(row + col) * 60}ms`;
    el.classList.add('card-entrada');
    el.addEventListener('animationend', () => {
      el.classList.remove('card-entrada');
      el.style.animationDelay = '';
    }, { once: true });

    board.appendChild(el);
  });
}

function syncBoard() {
  G.cards.forEach((card, i) => {
    const el = document.getElementById(`c${i}`);
    if (!el) return;

    if (card.matched && !el.classList.contains('matched')) {
      setTimeout(() => {
        el.classList.add('matched');
        el.classList.remove('flipped');
        el.style.pointerEvents = 'none';
      }, 50);
    } else if (!card.matched) {
      const deveVirar = !!card.flipped;
      if (deveVirar && !el.classList.contains('flipped')) {
        playSomFlip();
        setTimeout(() => el.classList.add('flipped'), 50);
        el.style.pointerEvents = 'none';
      } else if (!deveVirar && el.classList.contains('flipped')) {
        el.classList.remove('flipped');
        el.style.pointerEvents = '';
      }
    }
  });
}

function renderScores() {
  const panel = document.getElementById('scores-panel');
  panel.innerHTML = '';
  G.players.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'pscore' + (i === G.cur ? ' active' : '');
    el.id = `ps${i}`;
    el.style.cssText = `--pc:${p.color};--pc-rgb:${p.rgb}`;
    const suaVezVisivel = G.online && i === G.meuIndex && i === G.cur;
    el.innerHTML = `<div class="sua-vez" style="font-size:.7rem;color:#4fc3f7;font-weight:700;margin-bottom:2px;display:${suaVezVisivel ? '' : 'none'}">▶ SUA VEZ</div><div class="pn">${p.isAI ? '🤖' : '👤'} ${sanitize(p.name)}</div><div class="pp">${p.score}</div>`;
    panel.appendChild(el);
  });
}

function mostrarPontoFloat(el) {
  const rect  = el.getBoundingClientRect();
  const label = document.createElement('div');
  label.textContent = '+1';
  label.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top}px;` +
    `transform:translateX(-50%);font-size:1.4rem;font-weight:800;color:var(--accent);` +
    `pointer-events:none;z-index:10000;animation:floatPoint .8s ease-out forwards;`;
  document.body.appendChild(label);
  setTimeout(() => label.remove(), 850);
}

function refreshScores() {
  G.players.forEach((p, i) => {
    const el = document.getElementById(`ps${i}`);
    if (!el) return;
    const ppEl     = el.querySelector('.pp');
    const oldScore = parseInt(ppEl.textContent) || 0;
    const scored   = p.score > oldScore;
    el.className = 'pscore' + (i === G.cur ? ' active' : '');
    ppEl.textContent = p.score;
    const aviso = el.querySelector('.sua-vez');
    if (aviso) {
      aviso.style.display = (G.online && i === G.meuIndex && i === G.cur) ? '' : 'none';
    }
    if (scored) {
      el.classList.add('score-pop');
      setTimeout(() => el.classList.remove('score-pop'), 600);
      mostrarPontoFloat(el);
    }
  });
}

function setTurnBar(thinking = false) {
  const p  = G.players[G.cur];
  const ic = p.isAI ? '🤖' : '👤';
  const tx = thinking ? ` <em style="color:#666;font-style:normal">(pensando…)</em>` : '';
  let turnLabel;
  if (p.isAI) {
    turnLabel = `${ic} Vez da máquina`;
  } else if (p.name === 'Você') {
    turnLabel = `${ic} Sua vez de jogar`;
  } else {
    turnLabel = `${ic} Vez de <span>${sanitize(p.name)}</span>`;
  }
  document.getElementById('turn-bar').innerHTML = turnLabel + tx;
}

// ─────────────────────────────────────────────
// INTERACTION
// ─────────────────────────────────────────────
function criarRipple(el, e) {
  const back = el.querySelector('.back');
  if (!back) return;
  const rect = back.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement('span');
  span.className = 'card-ripple';
  span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  back.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function onCardClick(i) {
  if (G.busy) return;
  if (G.cards[i].matched || G.cards[i].flipped) return;
  if (G.flipped.length >= 2) return;

  if (G.online) {
    if (G.cur !== G.meuIndex) return;
    const cards = G.cards.map(c => ({ ...c }));
    cards[i].flipped = true;
    salaRef.child('estado').update({ cards, flipped: [...G.flipped, i] });
  } else {
    if (G.players[G.cur].isAI) return;
    revealCard(i);
  }
}

function revealCard(i) {
  playSomFlip();
  G.cards[i].flipped = true;
  const el = document.getElementById(`c${i}`);
  if (el) el.classList.add('flipped');
  G.flipped.push(i);
  if (G.flipped.length === 2) {
    G.busy = true;
    setTimeout(checkMatch, 950);
  }
}

function checkMatch() {
  const [a, b] = G.flipped;
  const hit    = G.cards[a].emoji === G.cards[b].emoji;
  jogoTentativas++;

  // AI always learns from revealed cards
  G.aiMem[a] = G.cards[a].emoji;
  G.aiMem[b] = G.cards[b].emoji;

  if (hit) {
    playSomMatch();
    G.cards[a].matched = G.cards[b].matched = true;
    document.getElementById(`c${a}`).classList.add('matched');
    document.getElementById(`c${b}`).classList.add('matched');
    G.players[G.cur].score++;
    G.donePairs++;
    refreshScores();

    if (G.donePairs === G.totalPairs) { setTimeout(endGame, 600); return; }

    G.flipped = [];
    G.busy    = false;
    // Same player plays again
    if (G.players[G.cur].isAI) scheduleAI();
  } else {
    // Flip back
    [a, b].forEach(i => {
      G.cards[i].flipped = false;
      document.getElementById(`c${i}`).classList.remove('flipped');
    });
    G.flipped = [];

    G.cur = (G.cur + 1) % G.players.length;
    setTurnBar();
    refreshScores();
    G.busy = false;

    if (G.players[G.cur].isAI) scheduleAI();
  }
}

// ─────────────────────────────────────────────
// AI
// ─────────────────────────────────────────────
function scheduleAI() {
  G.busy = true;
  setTurnBar(true);
  setTimeout(aiTurn, 900);
}

function aiTurn() {
  const unmatched   = G.cards.map((_, i) => i).filter(i => !G.cards[i].matched);
  const diff        = cfg.diff;

  // Group known cards by emoji
  const byEmoji = {};
  for (const [k, v] of Object.entries(G.aiMem)) {
    const i = +k;
    if (G.cards[i].matched) continue;
    (byEmoji[v] = byEmoji[v] || []).push(i);
  }
  const pairs = Object.values(byEmoji).filter(arr => arr.length >= 2);

  // Decide whether to exploit memory
  const exploit = diff === 'hard' ? true
                : diff === 'medium' ? Math.random() < .6
                : false;

  let first, second;

  if (pairs.length > 0 && exploit) {
    // Play a known pair
    const p = pairs[Math.floor(Math.random() * pairs.length)];
    [first, second] = p;
  } else {
    // Pick an unlearned card first
    const unknown = unmatched.filter(i => !(i in G.aiMem));
    const pool1   = unknown.length > 0 ? unknown : unmatched;
    first = rand(pool1);

    // Check if we know a match for `first`
    const fEmoji     = G.cards[first].emoji;
    const knownMatch = (byEmoji[fEmoji] || []).find(i => i !== first);

    if (knownMatch !== undefined && exploit) {
      second = knownMatch;
    } else {
      const rest   = unmatched.filter(i => i !== first);
      const unk2   = rest.filter(i => !(i in G.aiMem));
      const pool2  = unk2.length > 0 ? unk2 : rest;
      second = rand(pool2);
    }
  }

  setTurnBar(false);
  // Flip first, then second
  setTimeout(() => {
    revealCard(first);
    setTimeout(() => revealCard(second), 700);
  }, 200);
}

// ─────────────────────────────────────────────
// END
// ─────────────────────────────────────────────
function endGame() {
  clearInterval(jogoTimer);
  const sorted  = [...G.players].sort((a, b) => b.score - a.score);
  const top     = sorted[0].score;
  const winners = sorted.filter(p => p.score === top);
  const isAI    = cfg.mode === 'ai';

  // Dificuldade
  const isFlamengo = document.documentElement.dataset.tema === 'flamengo';
  const diffLabel = isFlamengo
    ? { easy: 'Amador', medium: 'Banco de reserva', hard: 'Camisa 10' }
    : { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
  document.getElementById('end-diff').textContent =
    isAI ? `Dificuldade: ${diffLabel[cfg.diff]}` : '';

  // Título
  document.getElementById('winner-txt').textContent =
    winners.length > 1 ? '🤝 Empate!' : `🏆 ${winners[0].name} venceu!`;

  // Mensagem especial no modo contra a máquina
  let msg = '';
  if (isAI) {
    const humanPlayer  = G.players.find(p => !p.isAI);
    const aiPlayer     = G.players.find(p =>  p.isAI);
    const humanVenceu  = humanPlayer && aiPlayer && humanPlayer.score > aiPlayer.score;
    const humanPerdeu  = humanPlayer && aiPlayer && humanPlayer.score < aiPlayer.score;

    if (humanPerdeu && cfg.diff === 'easy')   msg = 'Sério que você perdeu para uma máquina? 🤣';
    else if (humanPerdeu && cfg.diff === 'medium') msg = 'Você perdeu para o nível médio... tá bom não 😬';
    else if (humanPerdeu && cfg.diff === 'hard')   msg = 'Ok, o modo difícil é difícil mesmo. Mas tente de novo! 😤';
    else if (humanVenceu && cfg.diff === 'easy')   msg = 'Ainda bem que você não é tão burro assim 😂';
    else if (humanVenceu && cfg.diff === 'medium') msg = 'Boa! Venceu no médio, não é qualquer um 😏';
    else if (humanVenceu && cfg.diff === 'hard')   msg = 'Venceu no difícil?! Respeito. 🫡';
  }
  document.getElementById('end-msg').textContent = msg;

  const list  = document.getElementById('final-list');
  list.innerHTML = '';
  const medals = ['🥇','🥈','🥉','4️⃣'];
  sorted.forEach((p, i) => {
    const el   = document.createElement('div');
    el.className = 'final-item';
    el.style.cssText = `--pc:${p.color}`;
    el.innerHTML = `<span>${medals[i]} ${sanitize(p.name)}</span><span class="fi-score">${p.score} par${p.score !== 1 ? 'es' : ''}</span>`;
    list.appendChild(el);
  });

  // Recorde local + ranking global
  const humanP = G.players.find(p => !p.isAI);
  const aiP    = G.players.find(p =>  p.isAI);
  let posRecorde = 0;
  if (isAI && humanP && aiP && humanP.score > aiP.score) {
    posRecorde = salvarRecorde(humanP.name, cfg.size, diffLabel[cfg.diff], jogoTempo, jogoTentativas);
  } else if (!isAI && winners.length === 1) {
    posRecorde = salvarRecorde(winners[0].name, cfg.size, 'Multi', jogoTempo, jogoTentativas);
  }
  const ganhouStat = isAI ? (humanP && aiP && humanP.score > aiP.score) : winners.length === 1;
  registrarStatOffline(cfg.size, ganhouStat, jogoTentativas, jogoTempo);
  document.getElementById('end-record').textContent =
    posRecorde ? `🏅 Novo recorde! ${['','🥇','🥈','🥉','4️⃣','5️⃣'][posRecorde]} Top ${posRecorde}` : '';

  showScreen('screen-end');

  setTimeout(() => {
    if (isAI && humanP && aiP) {
      if      (humanP.score > aiP.score) { iniciarConfete(); playSomVitoria(); }
      else if (humanP.score < aiP.score) { iniciarAnimacaoDerrota(); playSomDerrota(); }
      else                               { playSomEmpate(); }
    } else if (!isAI) {
      if (winners.length === 1) { iniciarConfete(); playSomVitoria(); }
      else                      { playSomEmpate(); }
    }
  }, 400);
}

function askMenu() {
  document.getElementById('confirm-overlay').classList.add('aberto');
}

function fecharConfirm() {
  document.getElementById('confirm-overlay').classList.remove('aberto');
}

function fecharConfirmFora(e) {
  if (e.target === document.getElementById('confirm-overlay')) fecharConfirm();
}

function confirmarSaida() {
  fecharConfirm();
  if (G.online) {
    voltarMenuOnline();
  } else {
    clearInterval(jogoTimer);
    clearInterval(timerInterval);
    G = {};
    showScreen('screen-menu');
  }
}

// ─────────────────────────────────────────────
// ONLINE
// ─────────────────────────────────────────────
let salaRef = null;
let meuIndex = 0;
let timerInterval = null;
let timerSegundos = 120;
let reacaoTs = 0;
let desconexaoTimer = null;
let jugadorOnline   = {};
let toastTimer      = null;

function enviarReacao(emoji) {
  if (!salaRef) return;
  const agora = Date.now();
  if (agora - reacaoTs < 2500) return;
  reacaoTs = agora;
  const btns = document.querySelectorAll('.react-btn');
  btns.forEach(b => b.disabled = true);
  setTimeout(() => btns.forEach(b => b.disabled = false), 2500);
  salaRef.child('reacao').set({ de: meuIndex, emoji, ts: agora });
}

function mostrarReacaoFlutuante(emoji, nome) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;bottom:110px;pointer-events:none;' +
    'z-index:5000;text-align:center;animation:reacaoFlutuar 1.9s ease-out forwards;';
  el.innerHTML = `<div style="font-size:4rem;line-height:1">${emoji}</div>` +
    `<div style="font-size:.78rem;color:var(--txt-muted);margin-top:5px">${sanitize(nome)}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}
let gameEnded = false;

function iniciarTimer(turnStartTime) {
  clearInterval(timerInterval);
  const DURACAO = 120;

  function tick() {
    timerSegundos = Math.max(0, DURACAO - Math.floor((Date.now() - turnStartTime) / 1000));
    atualizarTimerDisplay();
    if (timerSegundos <= 0) {
      clearInterval(timerInterval);
      if (G.online && G.cur === G.meuIndex && !G.busy) {
        salaRef.child('estado').update({
          cur: 1 - G.cur,
          flipped: [],
          turnStartTime: firebase.database.ServerValue.TIMESTAMP
        });
      }
    }
  }

  tick();
  timerInterval = setInterval(tick, 1000);
}

function atualizarTimerOffline() {
  const el = document.getElementById('timer-bar');
  if (!el || G.online) return;
  const min = Math.floor(jogoTempo / 60);
  const seg = jogoTempo % 60;
  el.textContent = `⏱ ${min}:${seg.toString().padStart(2, '0')}`;
  el.style.color = '';
}

function atualizarTimerDisplay() {
  const el = document.getElementById('timer-bar');
  if (!el) return;
  if (!G.online) { atualizarTimerOffline(); return; }
  const min = Math.floor(timerSegundos / 60);
  const seg = timerSegundos % 60;
  el.textContent = `⏱ ${min}:${seg.toString().padStart(2, '0')}`;
  el.style.color = timerSegundos <= 10 ? '#e94560' : '#888';
}

function copiarCodigo(codigo, btn) {
  navigator.clipboard.writeText(codigo).then(() => {
    btn.textContent = '✅ Copiado!';
    setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
  });
}

function criarSala() {
  const nome = cleanNome(document.getElementById('online-name').value.trim() || 'Jogador 1');
  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  salaRef = db.ref('salas/' + codigo);
  salaRef.set({
    jogadores: { 0: { nome, score: 0 } },
    status: 'aguardando', tamanho: cfg.osize,
    placarTotal: { 0: 0, 1: 0 }, revanche: { pedido: false }
  });
  meuIndex = 0;

  document.getElementById('online-status').innerHTML =
    `Sala criada! Compartilhe o código:<br>
     <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0">
       <strong style="color:#4fc3f7;font-size:1.3rem;letter-spacing:3px">${codigo}</strong>
       <button onclick="copiarCodigo('${codigo}', this)"
         style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
                border-radius:8px;color:#eee;padding:4px 10px;cursor:pointer;font-size:.8rem">
         📋 Copiar
       </button>
     </div>
     <span style="color:#888;font-size:.82rem">Aguardando adversário...</span>`;

  salaRef.child('status').on('value', snap => {
    if (snap.val() === 'jogando') {
      salaRef.child('status').off();
      iniciarOnline(codigo);
    }
  });
}

function entrarSala() {
  const nome = cleanNome(document.getElementById('online-name').value.trim() || 'Jogador');
  const codigo = document.getElementById('codigo-sala').value.trim().toUpperCase();
  if (!codigo) return;

  salaRef = db.ref('salas/' + codigo);
  salaRef.once('value', snap => {
    if (!snap.exists()) {
      document.getElementById('online-status').textContent = 'Sala não encontrada.';
      salaRef = null; return;
    }
    const sala = snap.val();
    if (sala.status === 'jogando') {
      document.getElementById('online-status').textContent = 'Partida em andamento.';
      salaRef = null; return;
    }
    const jogadores = sala.jogadores || {};
    if (Object.keys(jogadores).length >= 2) {
      document.getElementById('online-status').textContent = 'Sala cheia.';
      salaRef = null; return;
    }
    meuIndex = 1;
    salaRef.child('jogadores/1').set({ nome, score: 0 });
    salaRef.child('status').set('jogando');
    iniciarOnline(codigo);
  });
}

function mostrarToast(msg) {
  const el = document.getElementById('toast-online');
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.innerHTML = msg;
  el.classList.add('vis');
  toastTimer = setTimeout(() => { el.classList.remove('vis'); toastTimer = null; }, 4500);
}


function iniciarOnline(codigo) {
  salaRef.once('value', snap => {
    const sala = snap.val();
    const jogadores = sala.jogadores || {};
    const outroIdx  = 1 - meuIndex;

    G = {
      cards: [], flipped: [], cur: 0, busy: false, aiMem: {},
      totalPairs: SIZES[sala.tamanho || '4x4'].pairs,
      donePairs: 0, cols: SIZES[sala.tamanho || '4x4'].cols,
      online: true, meuIndex,
      players: [
        { name: jogadores[0] ? jogadores[0].nome : 'Jogador 1', score: 0, isAI: false, color: COLORS[0], rgb: COLORS_RGB[0] },
        { name: jogadores[1] ? jogadores[1].nome : 'Jogador 2', score: 0, isAI: false, color: COLORS[1], rgb: COLORS_RGB[1] }
      ]
    };

    if (meuIndex === 0) {
      const picked = shuffle([...EMOJIS]).slice(0, G.totalPairs);
      const cards = shuffle([...picked, ...picked]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
      salaRef.child('estado').set({
        cards, cur: 0, flipped: [], donePairs: 0,
        players: [
          { score: 0 },
          { score: 0 }
        ],
        turnStartTime: firebase.database.ServerValue.TIMESTAMP
      });
    }

    jogoTentativas = 0;
    jogoStartOnline = Date.now();
    gameEnded = false;
    showScreen('screen-game');
    renderScores();

    const rbar = document.getElementById('reaction-bar');
    if (rbar) rbar.style.display = 'flex';
    reacaoTs = 0;
    if (meuIndex === 0) salaRef.child('reacao').set(null);
    salaRef.child('reacao').on('value', snap => {
      const r = snap.val();
      if (!r || !r.emoji || !r.ts) return;
      const nome = G.players[r.de] ? G.players[r.de].name : 'Jogador';
      mostrarReacaoFlutuante(r.emoji, nome);
    });

    jugadorOnline = {};
    jugadorOnline[meuIndex] = true;
    jugadorOnline[outroIdx] = true;
    const minhaRef = salaRef.child('jogadores/' + meuIndex + '/online');
    minhaRef.set(true);
    minhaRef.onDisconnect().set(false);

    salaRef.child('jogadores/' + outroIdx + '/online').on('value', snap => {
      const prevOnline = jugadorOnline[outroIdx];
      jugadorOnline[outroIdx] = snap.val() !== false;
      if (!G.players || !G.players[outroIdx]) return;
      const nome = sanitize(G.players[outroIdx].name);

      if (!jugadorOnline[outroIdx] && prevOnline !== false) {
        let seg = 10;
        const turnBar = document.getElementById('turn-bar');
        const atualizar = () => {
          if (turnBar) turnBar.innerHTML = `⚠️ <span>${nome}</span> saiu. Voltando ao menu em ${seg}s…`;
        };
        atualizar();
        clearInterval(desconexaoTimer);
        desconexaoTimer = setInterval(() => {
          seg--;
          if (seg <= 0) {
            clearInterval(desconexaoTimer); desconexaoTimer = null;
            voltarMenuOnline();
          } else {
            atualizar();
          }
        }, 1000);

      }
    });

    salaRef.child('estado').on('value', snap => {
      const e = snap.val();
      if (!e || !e.cards) return;

      const primeiraVez   = G.cards.length === 0;
      const prevDonePairs = G.donePairs || 0;

      G.cards     = e.cards;
      G.cur       = e.cur;
      G.flipped   = e.flipped || [];
      G.donePairs = e.donePairs || 0;
      e.players.forEach((p, i) => {
        G.players[i].score = p.score || 0;
      });
      G.busy = G.flipped.length >= 2;

      if (primeiraVez) { renderBoard(); } else { syncBoard(); }
      if (!primeiraVez && G.donePairs > prevDonePairs) playSomMatch();
      refreshScores();
      setTurnBar();
      iniciarTimer(e.turnStartTime || Date.now());

      if (G.flipped.length === 2 && G.cur === meuIndex) setTimeout(checkMatchOnline, 950);
      if (G.donePairs === G.totalPairs && !gameEnded) {
        gameEnded = true;
        setTimeout(G.online ? endGameOnline : endGame, 600);
      }
    });
  });
}

function endGameOnline() {
  clearInterval(timerInterval);
  const n = G.players.length;
  const scores = G.players.map(p => p.score);

  if (meuIndex === 0) {
    salaRef.child('placarTotal').once('value', snap => {
      const pt = snap.val() || {};
      const novo = {};
      for (let i = 0; i < n; i++) novo[i] = (pt[i] || 0) + scores[i];
      salaRef.child('placarTotal').set(novo);
      salaRef.child('revanche').set({ pedido: false });
    });
  }

  setTimeout(() => {
    salaRef.child('placarTotal').once('value', snap => {
      mostrarFimOnline(scores, snap.val() || {});
    });
  }, meuIndex === 0 ? 400 : 700);
}

function mostrarFimOnline(scores, pt) {
  const n = G.players.length;
  const maxScore = Math.max(...scores);
  const winners = G.players.filter((_, i) => scores[i] === maxScore);

  const winnerTxt = winners.length > 1 ? '🤝 Empate!' : `🏆 ${sanitize(winners[0].name)} venceu!`;
  document.getElementById('online-winner-txt').innerHTML = winnerTxt;

  let tableHtml = `<tr><th></th><th>Este jogo</th><th>Total</th></tr>`;
  for (let i = 0; i < n; i++) {
    tableHtml += `<tr>
      <td style="color:${G.players[i].color};font-weight:700">👤 ${sanitize(G.players[i].name)}</td>
      <td style="color:${G.players[i].color};font-weight:800;font-size:1.1rem">${scores[i]}</td>
      <td style="color:#666">${pt[i] || 0}</td>
    </tr>`;
  }
  document.getElementById('online-scores-table').innerHTML = tableHtml;

  const tempoOnline = Math.floor((Date.now() - jogoStartOnline) / 1000);
  const meuScore = scores[meuIndex];
  const isWinner = meuScore === maxScore && winners.length === 1;

  if (isWinner) salvarRankingGlobal(G.players[meuIndex].name, cfg.osize, 'Online', jogoTentativas, tempoOnline);
  registrarStatOnline(cfg.osize, isWinner, tempoOnline);

  const revArea = document.getElementById('revanche-area');

  const outroIndex = 1 - meuIndex;
  revArea.innerHTML = !isWinner
    ? `<button class="btn btn-primary" onclick="pedirRevanche()">🔄 Pedir Revanche</button>`
    : `<p style="color:#666;font-size:.9rem">Aguardando o adversário...</p>`;

  salaRef.child('revanche').on('value', snap => {
    const rev = snap.val();
    if (!rev) return;
    if (rev.desistiu === true) {
      salaRef.child('revanche').off();
      if (rev.de === meuIndex) return;
      const nomeAdv = sanitize(G.players[outroIndex].name);
      let seg = 5;
      const atualizar = () => { revArea.innerHTML = `<p style="color:#e94560;font-weight:600">😔 ${nomeAdv} não quer mais jogar.<br>Voltando ao menu em ${seg}s...</p>`; };
      atualizar();
      const t = setInterval(() => { seg--; if (seg <= 0) { clearInterval(t); voltarMenuOnline(); } else atualizar(); }, 1000);
      return;
    }
    if (rev.aceito === true)  { salaRef.child('revanche').off(); iniciarRevanche(); return; }
    if (rev.aceito === false) {
      salaRef.child('revanche').off();
      revArea.innerHTML = `<p style="color:#e94560">Revanche recusada.</p>`;
      setTimeout(() => voltarMenuOnline(), 2000); return;
    }
    if (rev.pedido && rev.de !== meuIndex) {
      let seg = 20;
      const nomePedinte = sanitize(G.players[rev.de].name);
      const mostrar = () => {
        revArea.innerHTML = `
          <p style="color:#fff;font-weight:700;margin-bottom:12px">🔄 ${nomePedinte} quer revanche!</p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-primary"   onclick="aceitarRevanche()">Aceitar (${seg}s)</button>
            <button class="btn btn-secondary" onclick="recusarRevanche()">Recusar</button>
          </div>`;
      };
      mostrar();
      const t = setInterval(() => { seg--; if (seg <= 0) { clearInterval(t); recusarRevanche(); } else mostrar(); }, 1000);
    }
    if (rev.pedido && rev.de === meuIndex) {
      revArea.innerHTML = `<p style="color:#888;font-size:.9rem">Aguardando resposta...</p>`;
    }
  });

  showScreen('screen-end-online');

  setTimeout(() => {
    if (isWinner)                { iniciarConfete(); playSomVitoria(); }
    else if (meuScore === maxScore) { playSomEmpate(); }
    else                         { iniciarAnimacaoDerrota(); playSomDerrota(); }
  }, 400);
}

function sairFimJogo() {
  if (salaRef) salaRef.child('revanche').set({ desistiu: true, de: meuIndex });
  setTimeout(() => voltarMenuOnline(), 200);
}

function pedirRevanche() {
  document.getElementById('revanche-area').innerHTML = `<p style="color:#888;font-size:.9rem">Aguardando resposta...</p>`;
  salaRef.child('revanche').set({ pedido: true, de: meuIndex });
}

function aceitarRevanche() {
  salaRef.child('revanche').set({ pedido: false, aceito: true });
}

function recusarRevanche() {
  salaRef.child('revanche').set({ pedido: false, aceito: false });
}

function iniciarRevanche() {
  clearInterval(desconexaoTimer); desconexaoTimer = null;
  gameEnded = false;
  G.cards = [];
  G.flipped = [];
  G.cur = 0;
  G.busy = false;
  G.donePairs = 0;
  G.players.forEach(p => { p.score = 0; });
  jugadorOnline = {};

  if (meuIndex === 0) {
    const picked = shuffle([...EMOJIS]).slice(0, G.totalPairs);
    const cards  = shuffle([...picked, ...picked]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    salaRef.child('estado').set({
      cards, cur: 0, flipped: [], donePairs: 0,
      players: [
        { score: 0 },
        { score: 0 }
      ],
      turnStartTime: firebase.database.ServerValue.TIMESTAMP
    });
    salaRef.child('revanche').set({ pedido: false });
  }

  showScreen('screen-game');
  renderScores();
}

function voltarMenuOnline() {
  clearInterval(desconexaoTimer); desconexaoTimer = null;
  clearInterval(timerInterval);
  if (salaRef) {
    salaRef.child('jogadores/' + meuIndex + '/online').set(false);
    if (G.players) G.players.forEach((_, i) => salaRef.child('jogadores/' + i + '/online').off());
    salaRef.child('estado').off();
    salaRef.child('revanche').off();
    salaRef.child('reacao').off();
    salaRef.child('status').off();
    salaRef.child('jogadores').off();
    salaRef.off();
    salaRef = null;
  }
  const rbar = document.getElementById('reaction-bar');
  if (rbar) rbar.style.display = 'none';
  G = {};
  showScreen('screen-menu');
}

function checkMatchOnline() {
  if (G.cur !== G.meuIndex) return;
  if (!G.flipped || G.flipped.length !== 2) return;
  const [a, b] = G.flipped;
  if (a === b || !G.cards[a] || !G.cards[b]) return;
  const hit = G.cards[a].emoji === G.cards[b].emoji;
  const cards  = G.cards.map(c => ({ ...c }));
  const placar = G.players.map(p => ({ score: p.score }));

  jogoTentativas++;
  if (hit) {
    cards[a].matched = cards[b].matched = true;
    placar[G.cur].score++;
    salaRef.child('estado').update({ cards, flipped: [], donePairs: G.donePairs + 1, players: placar, turnStartTime: firebase.database.ServerValue.TIMESTAMP });
  } else {
    cards[a].flipped = cards[b].flipped = false;
    salaRef.child('estado').update({ cards, flipped: [], cur: 1 - G.cur, players: placar, turnStartTime: firebase.database.ServerValue.TIMESTAMP });
  }
}

// ─────────────────────────────────────────────
// AUDIO
// ─────────────────────────────────────────────
let audioCtx    = null;
let musicGain   = null;
let somGain     = null;
let musicPlaying = false;
let melodyIdx   = 0;
let melodyTimer = null;
let muteMus     = false;
let muteSom     = false;
const MELODY    = [523.25, 659.25, 783.99, 659.25, 523.25, 440.00, 392.00, 440.00];
const NOTE_DUR  = 0.38;

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  somGain   = audioCtx.createGain();
  musicGain.gain.value = document.getElementById('vol-musica') ? document.getElementById('vol-musica').value / 100 : 0.00;
  somGain.gain.value   = document.getElementById('vol-som')    ? document.getElementById('vol-som').value    / 100 : 1.00;
  musicGain.connect(audioCtx.destination);
  somGain.connect(audioCtx.destination);
  // desbloqueia em iOS que cria o contexto já suspenso
  audioCtx.resume();
}

function playMusic() {
  if (!audioCtx || musicPlaying) return;
  musicPlaying = true;
  melodyIdx = 0;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(scheduleNote);
  } else {
    scheduleNote();
  }
}

function scheduleNote() {
  if (!musicPlaying || !audioCtx) return;
  const freq = MELODY[melodyIdx % MELODY.length];
  const t    = audioCtx.currentTime;
  const osc  = audioCtx.createOscillator();
  const env  = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.6, t + 0.04);
  env.gain.exponentialRampToValueAtTime(0.001, t + NOTE_DUR - 0.04);
  osc.connect(env);
  env.connect(musicGain);
  osc.start(t);
  osc.stop(t + NOTE_DUR);
  melodyIdx++;
  melodyTimer = setTimeout(scheduleNote, NOTE_DUR * 1000);
}

function stopMusic() {
  musicPlaying = false;
  clearTimeout(melodyTimer);
}

function playSomEntrada() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const t = audioCtx.currentTime;

  // Whoosh de ruído (cartas sendo distribuídas)
  const bufSz = Math.floor(audioCtx.sampleRate * 0.5);
  const buf   = audioCtx.createBuffer(1, bufSz, audioCtx.sampleRate);
  const data  = buf.getChannelData(0);
  for (let i = 0; i < bufSz; i++) data[i] = Math.random() * 2 - 1;

  const noise  = audioCtx.createBufferSource();
  noise.buffer = buf;

  const filt = audioCtx.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.setValueAtTime(600, t);
  filt.frequency.exponentialRampToValueAtTime(3200, t + 0.38);

  const envN = audioCtx.createGain();
  envN.gain.setValueAtTime(0, t);
  envN.gain.linearRampToValueAtTime(0.14, t + 0.04);
  envN.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

  noise.connect(filt); filt.connect(envN); envN.connect(somGain);
  noise.start(t); noise.stop(t + 0.5);

  // Shimmer ascendente (4 notas)
  [392, 523.25, 659.25, 880].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    const s   = t + i * 0.07;
    osc.type  = 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, s);
    env.gain.linearRampToValueAtTime(0.08, s + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.28);
    osc.connect(env); env.connect(somGain);
    osc.start(s); osc.stop(s + 0.28);
  });
}

function playSomFlip() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') { audioCtx.resume(); return; }
  const t   = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.10);
  env.gain.setValueAtTime(0.4, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
  osc.connect(env);
  env.connect(somGain);
  osc.start(t);
  osc.stop(t + 0.10);
}

function playSomMatch() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') { audioCtx.resume(); return; }
  const t = audioCtx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    const s   = t + i * 0.13;
    osc.type = 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, s);
    env.gain.linearRampToValueAtTime(0.5, s + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.22);
    osc.connect(env);
    env.connect(somGain);
    osc.start(s);
    osc.stop(s + 0.22);
  });
}

let hinoAudio = null;

function playHinoFlamengo() {
  stopMusic();
  if (hinoAudio) { hinoAudio.pause(); hinoAudio.currentTime = 0; }
  hinoAudio = new Audio('.sons e musicas/flamengo-hino-remix.mp3');
  const volSlider = document.getElementById('vol-som');
  hinoAudio.volume = volSlider ? volSlider.value / 100 : 1.0;
  hinoAudio.play().catch(() => {});
}

function stopHinoFlamengo() {
  if (!hinoAudio) return;
  hinoAudio.pause();
  hinoAudio.currentTime = 0;
  hinoAudio = null;
}

function playSomVitoria() {
  if (document.documentElement.dataset.tema === 'flamengo') {
    playHinoFlamengo();
    return;
  }
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const t = audioCtx.currentTime;
  [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    const s   = t + i * 0.13;
    const dur = i === 4 ? 0.9 : 0.28;
    osc.type = 'triangle';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, s);
    env.gain.linearRampToValueAtTime(0.55, s + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, s + dur);
    osc.connect(env); env.connect(somGain);
    osc.start(s); osc.stop(s + dur);
  });
}

function playSomEmpate() {
  const audio = new Audio('.sons e musicas/aplausos.mp3');
  const volSlider = document.getElementById('vol-som');
  audio.volume = volSlider ? volSlider.value / 100 : 1.0;
  audio.play().catch(() => {});
}

function playSomDerrota() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const t = audioCtx.currentTime;
  [196.00, 174.61, 155.56, 130.81].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    const s   = t + i * 0.22;
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, s);
    env.gain.linearRampToValueAtTime(0.4, s + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.38);
    osc.connect(env); env.connect(somGain);
    osc.start(s); osc.stop(s + 0.38);
  });
}

function setVolMusica(v) {
  muteMus = (v === 0);
  if (musicGain) musicGain.gain.value = v / 100;
  atualizarIconeMute();
}

function setVolSom(v) {
  muteSom = (v === 0);
  if (somGain) somGain.gain.value = v / 100;
  atualizarIconeMute();
}

function atualizarIconeMute() {
  const iconGeral = document.querySelector('.audio-icon');
  if (iconGeral) iconGeral.textContent = (muteMus && muteSom) ? '🔇' : '🔊';

  const iconMus = document.getElementById('icon-musica');
  const iconSom = document.getElementById('icon-som');
  const rowMus  = document.getElementById('row-musica');
  const rowSom  = document.getElementById('row-som');

  if (iconMus) iconMus.textContent = muteMus ? '🔕' : '🎵';
  if (iconSom) iconSom.textContent = muteSom ? '🔇' : '🔊';
  if (rowMus)  rowMus.style.opacity = muteMus ? '0.4' : '1';
  if (rowSom)  rowSom.style.opacity = muteSom ? '0.4' : '1';
}

function toggleMusica() {
  initAudio();
  muteMus = !muteMus;
  const vm = document.getElementById('vol-musica');
  if (musicGain) musicGain.gain.value = muteMus ? 0 : (vm ? vm.value / 100 : 0.3);
  atualizarIconeMute();
}

function toggleSomJogo() {
  initAudio();
  muteSom = !muteSom;
  const vs = document.getElementById('vol-som');
  if (somGain) somGain.gain.value = muteSom ? 0 : (vs ? vs.value / 100 : 0.5);
  atualizarIconeMute();
}

function toggleMute() {
  initAudio();
  const algumAtivo = !muteMus || !muteSom;
  muteMus = algumAtivo;
  muteSom = algumAtivo;
  const vm = document.getElementById('vol-musica');
  const vs = document.getElementById('vol-som');
  if (musicGain) musicGain.gain.value = muteMus ? 0 : (vm ? vm.value / 100 : 0.3);
  if (somGain)   somGain.gain.value   = muteSom ? 0 : (vs ? vs.value / 100 : 0.5);
  atualizarIconeMute();
}

// ─────────────────────────────────────────────
// ANIMAÇÕES DE RESULTADO
// ─────────────────────────────────────────────
function criarCanvas() {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(c);
  c.width  = window.innerWidth;
  c.height = window.innerHeight;
  return c;
}

function iniciarConfete() {
  const isFlamengo = document.documentElement.dataset.tema === 'flamengo';
  const canvas = criarCanvas();
  const ctx    = canvas.getContext('2d');
  const cores  = isFlamengo
    ? ['#e30613','#e30613','#111111','#ffd700','#cc0000','#ffd700','#111111','#e30613']
    : ['#e94560','#4fc3f7','#81c784','#ffb74d','#f06292','#aed581','#ff8a65','#ba68c8'];
  const parts = Array.from({ length: 170 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 11 + 5, h: Math.random() * 6 + 3,
    cor: cores[Math.floor(Math.random() * cores.length)],
    rot: Math.random() * 360, vRot: Math.random() * 5 - 2.5,
    vy: Math.random() * 3 + 2, swing: Math.random() * 1.5,
    swingV: Math.random() * .04 + .02, swingPos: Math.random() * Math.PI * 2,
    tipo: 'rect'
  }));
  if (isFlamengo) {
    const img = new Image();
    img.src = '.imagens/AcronimoCamisaFlamengo.png';
    Array.from({ length: 20 }, () => parts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 28 + 22,
      rot: Math.random() * 360, vRot: Math.random() * 4 - 2,
      vy: Math.random() * 2 + 1.5, swing: Math.random() * 1.2,
      swingV: Math.random() * .03 + .015, swingPos: Math.random() * Math.PI * 2,
      tipo: 'img', img
    }));
  }
  const TOTAL = 1140; let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alfa = f > TOTAL * .72 ? 1 - (f - TOTAL * .72) / (TOTAL * .28) : 1;
    parts.forEach(p => {
      p.y += p.vy; p.rot += p.vRot;
      p.swingPos += p.swingV; p.x += Math.sin(p.swingPos) * p.swing;
      const limY = p.tipo === 'img' ? p.size : p.h;
      if (p.y > canvas.height + limY) {
        p.y = -limY;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      if (p.tipo === 'img' && p.img.complete) {
        ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.tipo === 'rect') {
        ctx.fillStyle = p.cor;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    if (++f < TOTAL) requestAnimationFrame(draw); else canvas.remove();
  })();
}

function iniciarAnimacaoDerrota() {
  const canvas = criarCanvas();
  const ctx    = canvas.getContext('2d');
  const parts  = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 3 + 1,
    vy: Math.random() * 2 + 1,  vx: Math.random() * .6 - .3,
    op: Math.random() * .5 + .2
  }));
  const TOTAL = 210; let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fade = f > TOTAL * .7 ? 1 - (f - TOTAL * .7) / (TOTAL * .3) : 1;
    ctx.fillStyle = `rgba(0,0,0,${Math.min(f / 50, .38) * fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.y += p.vy; p.x += p.vx;
      if (p.y > canvas.height) { p.y = -5; p.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(130,130,140,${p.op * fade})`;
      ctx.fill();
    });
    if (++f < TOTAL) requestAnimationFrame(draw); else canvas.remove();
  })();
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function sanitize(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cleanNome(str) {
  return String(str).replace(/<[^>]*>/g,'').replace(/[<>"'&]/g,'').trim().substring(0, 20) || 'Jogador';
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Inicia áudio no primeiro toque/clique na tela inicial
document.getElementById('screen-menu').addEventListener('pointerdown', function() {
  initAudio();
  playMusic();
}, { once: true });

// iOS exige desbloqueio do AudioContext em qualquer toque subsequente
document.addEventListener('touchstart', function() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { passive: true });

// ─────────────────────────────────────────────
// RECORDES
// ─────────────────────────────────────────────
function formatarTempo(s) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function salvarRecorde(nome, tamanho, modo, tempo, tentativas) {
  const lista = JSON.parse(localStorage.getItem('recordes') || '[]');
  const novo  = { nome, tamanho, modo, tempo, tentativas, data: new Date().toLocaleDateString('pt-BR') };
  lista.push(novo);
  lista.sort((a, b) => a.tentativas - b.tentativas || a.tempo - b.tempo);
  const pos = lista.indexOf(novo) + 1;
  lista.splice(5);
  const entrou = lista.includes(novo);
  localStorage.setItem('recordes', JSON.stringify(lista));
  return entrou ? pos : 0;
}

function mostrarRecordes() {
  const lista = JSON.parse(localStorage.getItem('recordes') || '[]');
  const el    = document.getElementById('records-list');
  if (!el) return;
  if (lista.length === 0) {
    el.innerHTML = '<p class="records-empty">Nenhum recorde ainda.<br>Vença uma partida para registrar!</p>';
    return;
  }
  const medalhas = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  el.innerHTML = `
    <table class="records-table">
      <tr>
        <th>#</th><th>Jogador</th><th>Modo</th>
        <th style="text-align:center">Tentativas</th>
        <th style="text-align:center">Tempo</th>
        <th>Data</th>
      </tr>
      ${lista.map((r, i) => `
        <tr>
          <td>${medalhas[i]}</td>
          <td><strong>${sanitize(r.nome)}</strong></td>
          <td class="dim">${r.tamanho} · ${r.modo}</td>
          <td class="num">${r.tentativas}</td>
          <td style="text-align:center">${formatarTempo(r.tempo)}</td>
          <td class="dim">${r.data}</td>
        </tr>`).join('')}
    </table>
    <button class="btn btn-secondary" style="font-size:.8rem;padding:8px 18px" onclick="limparRecordes()">🗑️ Limpar recordes</button>`;
}

function limparRecordes() {
  if (confirm('Apagar todos os recordes?')) {
    localStorage.removeItem('recordes');
    mostrarRecordes();
  }
}

// ─────────────────────────────────────────────
// RANKING GLOBAL (Firebase)
// ─────────────────────────────────────────────
function salvarRankingGlobal(nome, tamanho, modo, tentativas, tempo) {
  if (!nome || !tamanho || tentativas < 1 || tempo < 5) return;
  const nomeSeguro = cleanNome(nome);
  if (!nomeSeguro) return;
  const ref = db.ref('ranking/' + tamanho);
  ref.push({ nome: nomeSeguro, tentativas, tempo, modo, ts: Date.now() })
    .then(() => ref.once('value'))
    .then(snap => {
      const entries = [];
      snap.forEach(c => entries.push({ key: c.key, ...c.val() }));
      entries.sort((a, b) => a.tentativas - b.tentativas || a.tempo - b.tempo);
      entries.slice(10).forEach(e => ref.child(e.key).remove());
    })
    .catch(() => {});
}

function carregarRanking(tamanho, tabEl) {
  // Atualiza aba selecionada
  document.querySelectorAll('.rank-tab').forEach((t, i) => {
    t.classList.toggle('sel', tabEl ? t === tabEl : i === 0);
  });

  const el = document.getElementById('ranking-lista');
  if (!el) return;
  el.innerHTML = '<p class="rank-loading">Carregando...</p>';

  db.ref('ranking/' + tamanho).once('value')
    .then(snap => {
      const entries = [];
      snap.forEach(c => entries.push(c.val()));
      entries.sort((a, b) => a.tentativas - b.tentativas || a.tempo - b.tempo);
      const top = entries.slice(0, 10);

      if (top.length === 0) {
        el.innerHTML = '<p class="rank-empty">Nenhum recorde ainda.<br>Seja o primeiro a entrar no ranking! 🏆</p>';
        return;
      }

      const medalhas = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
      el.innerHTML = `
        <table class="records-table">
          <tr>
            <th>#</th><th>Jogador</th><th>Modo</th>
            <th style="text-align:center">Tentativas</th>
            <th style="text-align:center">Tempo</th>
          </tr>
          ${top.map((r, i) => `
            <tr>
              <td>${medalhas[i]}</td>
              <td><strong>${sanitize(r.nome)}</strong></td>
              <td class="dim">${r.modo}</td>
              <td class="num">${r.tentativas}</td>
              <td style="text-align:center">${formatarTempo(r.tempo)}</td>
            </tr>`).join('')}
        </table>`;
    })
    .catch(() => {
      el.innerHTML = '<p class="rank-empty">Sem permissão no banco de dados.<br>Atualize as regras do Firebase. 🔒</p>';
    });
}

// ─────────────────────────────────────────────
// TEMAS
// ─────────────────────────────────────────────
const THEMES = {
  padrao: {
    '--bg': '#1a1a2e', '--accent': '#e94560', '--accent-dark': '#c62a47',
    '--accent-rgb': '233,69,96', '--accent2': '#4fc3f7',
    '--card-back1': '#16213e', '--card-back2': '#0f3460',
    '--card-matched': '#e8f5e9', '--btn-txt': '#fff',
    '--txt-muted': '#eee', '--txt-dim': '#aaa',
    '--title-c1': '#e94560', '--title-c2': '#4fc3f7'
  },
  dark: {
    '--bg': '#000000', '--accent': '#d4d4d4', '--accent-dark': '#aaaaaa',
    '--accent-rgb': '212,212,212', '--accent2': '#888888',
    '--card-back1': '#1a1a1a', '--card-back2': '#0a0a0a',
    '--card-matched': '#eeeeee', '--btn-txt': '#111',
    '--txt-muted': '#bbb', '--txt-dim': '#777',
    '--title-c1': '#ffffff', '--title-c2': '#66aaff'
  },
  flamengo: {
    '--bg': '#080808', '--accent': '#e30613', '--accent-dark': '#b5000e',
    '--accent-rgb': '227,6,19', '--accent2': '#ffd700',
    '--card-back1': '#1c0000', '--card-back2': '#0a0000',
    '--card-matched': '#ffe0e0', '--btn-txt': '#fff',
    '--txt-muted': '#eee', '--txt-dim': '#aaa',
    '--title-c1': '#e30613', '--title-c2': '#ffd700'
  }
};

function toggleDaltonico(ativo) {
  modoDaltonico = ativo;
  COLORS     = ativo ? COLORS_D     : ['#e94560','#4fc3f7','#81c784','#ffb74d'];
  COLORS_RGB = ativo ? COLORS_RGB_D : ['233,69,96','79,195,247','129,199,132','255,183,77'];
  localStorage.setItem('daltonico', ativo ? '1' : '0');
  document.querySelectorAll('#names-container input').forEach((inp, i) => {
    inp.style.borderColor = COLORS[i] + '55';
  });
  if (G.players && G.players.length) {
    G.players.forEach((p, i) => { p.color = COLORS[i]; p.rgb = COLORS_RGB[i]; });
    renderScores();
  }
}

// ─────────────────────────────────────────────
// AJUDA
// ─────────────────────────────────────────────
const HELP_CONTENT = {
  'screen-menu': {
    titulo: '🏠 Menu Principal',
    itens: [
      ['Jogar', 'Inicia uma partida local contra a IA ou com amigos no mesmo dispositivo.'],
      ['Jogar Online', 'Cria ou entra em uma sala para jogar com outras pessoas pela internet.'],
      ['🎨 Tema', 'Clique no ícone para trocar as cores e o visual do jogo.'],
      ['🔊 Som', 'Controla o volume da música de fundo e dos efeitos sonoros independentemente.'],
    ]
  },
  'tab-jogar': {
    titulo: '⚙️ Configurações da Partida',
    itens: [
      ['Modo de Jogo', 'Humano × Máquina: jogue contra a IA. Multijogador: 2 a 4 jogadores no mesmo dispositivo.'],
      ['Dificuldade', 'Define o nível de raciocínio da IA. Fácil memoriza pouco; Difícil quase não erra.'],
      ['Tamanho do Tabuleiro', '4×4 tem 8 pares, 4×5 tem 10 pares e 6×6 tem 18 pares para encontrar.'],
    ]
  },
  'tab-recordes': {
    titulo: '🏅 Recordes',
    itens: [
      ['Tabela de recordes', 'Seus melhores resultados offline, ordenados por pontuação e tempo de partida.'],
      ['Top 5', 'Apenas as 5 melhores partidas por tamanho de tabuleiro são registradas.'],
    ]
  },
  'tab-stats-offline': {
    titulo: '📊 Estatísticas Offline',
    itens: [
      ['Vitórias / Derrotas / Empates', 'Contagem total de resultados em partidas locais.'],
      ['Médias', 'Tempo médio e número médio de tentativas por partida, por tamanho de tabuleiro.'],
    ]
  },
  'tab-online-jogar': {
    titulo: '🌐 Jogar Online',
    itens: [
      ['Nº de Jogadores', 'Quantos jogadores podem entrar na sala ao criar (2 a 4). Irrelevante ao entrar.'],
      ['Criar Sala', 'Gera um código de 6 letras. Compartilhe com os amigos para que entrem.'],
      ['▶ Iniciar', 'Aparece para o anfitrião quando há ao menos 2 jogadores. Permite começar antes de encher a sala.'],
      ['Entrar na Sala', 'Digite o código recebido do anfitrião e clique em Entrar.'],
    ]
  },
  'tab-ranking': {
    titulo: '🌍 Ranking Global',
    itens: [
      ['Ranking', 'Melhores jogadores de partidas online, ordenados por tempo e tentativas.'],
      ['Quem entra', 'Apenas o vencedor da partida tem a pontuação registrada no ranking global.'],
    ]
  },
  'tab-stats-online': {
    titulo: '📊 Estatísticas Online',
    itens: [
      ['Vitórias / Derrotas / Empates', 'Contagem total de resultados em partidas online.'],
      ['Médias', 'Tempo médio e tentativas médias por tamanho de tabuleiro nas partidas online.'],
    ]
  },
  'screen-game': {
    titulo: '🎮 Como Jogar',
    itens: [
      ['Virar cartas', 'Clique em duas cartas por turno para tentar encontrar um par idêntico.'],
      ['Par correto', 'Ganhe 1 ponto e jogue novamente sem passar a vez para o próximo.'],
      ['Par errado', 'As cartas voltam viradas e a vez passa ao próximo jogador.'],
      ['⏱ Relógio', 'Conta o tempo total da partida. Quanto mais rápido terminar, maior a chance de bater o recorde.'],
      ['Menu', 'Sai da partida atual e volta ao menu principal.'],
    ]
  },
  'screen-game-online': {
    titulo: '🎮 Como Jogar (Online)',
    itens: [
      ['Virar cartas', 'Clique em duas cartas por turno para tentar encontrar um par idêntico.'],
      ['Par correto', 'Ganhe 1 ponto e jogue novamente sem passar a vez para o próximo.'],
      ['Par errado', 'As cartas voltam viradas e a vez passa ao próximo jogador.'],
      ['⏱ Timer', 'Cada turno tem 2 minutos. Se esgotar, a vez passa automaticamente para o próximo.'],
      ['Reações', 'Use os emojis para reagir às jogadas dos adversários em tempo real.'],
      ['Menu', 'Sai da partida atual e volta ao menu principal.'],
    ]
  },
  'screen-end': {
    titulo: '🏆 Fim de Partida',
    itens: [
      ['Resultado', 'Exibe o vencedor, a dificuldade utilizada e se foi um novo recorde pessoal.'],
      ['Jogar Novamente', 'Reinicia uma nova partida com exatamente as mesmas configurações.'],
      ['Menu', 'Volta ao menu principal sem iniciar nova partida.'],
    ]
  },
  'screen-end-online': {
    titulo: '🏆 Fim de Partida Online',
    itens: [
      ['Placar', 'Pontos desta partida e total acumulado da sessão para cada jogador.'],
      ['Pedir Revanche (2 jogadores)', 'Solicita nova partida ao adversário. Ele tem 20 segundos para aceitar ou recusar.'],
      ['Jogar Novamente (3–4 jogadores)', 'O anfitrião inicia uma nova rodada para todos os jogadores da sala.'],
      ['← Menu', 'Sai da sala e volta ao menu principal.'],
    ]
  }
};

function abrirAjuda() {
  const activeScreen = document.querySelector('.screen.active');
  const screenId = activeScreen ? activeScreen.id : 'screen-menu';

  let chave = screenId;
  if (screenId === 'screen-game' && G && G.online) chave = 'screen-game-online';
  if (screenId === 'screen-setup' || screenId === 'screen-online') {
    const panels = activeScreen.querySelectorAll('.tab-panel');
    for (const p of panels) {
      if (p.style.display !== 'none') { chave = p.id; break; }
    }
  }

  const conteudo = HELP_CONTENT[chave] || HELP_CONTENT[screenId];
  if (!conteudo) return;

  document.getElementById('help-titulo').textContent = conteudo.titulo;
  document.getElementById('help-corpo').innerHTML = conteudo.itens.map(([titulo, desc]) =>
    `<div class="help-item"><strong>${titulo}</strong><span>${desc}</span></div>`
  ).join('');

  document.getElementById('help-overlay').classList.add('aberto');
}

function fecharAjuda() {
  document.getElementById('help-overlay').classList.remove('aberto');
}

function fecharAjudaFora(e) {
  if (e.target === document.getElementById('help-overlay')) fecharAjuda();
}

function aplicarTema(nome) {
  const tema = THEMES[nome];
  if (!tema) return;
  const root = document.documentElement;
  Object.entries(tema).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.tema = nome;
  document.querySelectorAll('.theme-dot').forEach(el => {
    el.classList.toggle('ativo', el.dataset.tema === nome);
  });
  const diffNames = nome === 'flamengo'
    ? { easy: '🥺 Amador', medium: '🎽 Banco de reserva', hard: '⚽ Camisa 10' }
    : { easy: '😊 Fácil', medium: '🧠 Médio', hard: '😈 Difícil' };
  document.querySelectorAll('[data-g="diff"]').forEach(el => {
    el.textContent = diffNames[el.dataset.v] || el.textContent;
  });
  const nomeLabel = nome === 'flamengo' ? 'Nome do Jogador' : 'Seu Nome';
  ['label-online-name', 'label-human-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = nomeLabel;
  });
  const modoAiEl = document.getElementById('opt-mode-ai');
  if (modoAiEl) modoAiEl.textContent = nome === 'flamengo' ? '🤖 Jogador × Treinador' : '🤖 Humano × Máquina';
  const diffMaqEl = document.getElementById('label-diff-maquina');
  if (diffMaqEl) diffMaqEl.textContent = nome === 'flamengo' ? 'Dificuldade do Treino' : 'Dificuldade da Máquina';
  localStorage.setItem('tema', nome);
}

// Carrega tema salvo ou padrão
aplicarTema(localStorage.getItem('tema') || 'padrao');

// ─────────────────────────────────────────────
// PARALLAX MENU
// ─────────────────────────────────────────────
(function () {
  const layers = [
    { id: 'pl-1', f: 0.012 },
    { id: 'pl-2', f: 0.032 },
    { id: 'pl-3', f: 0.058 },
  ];
  let tx = 0, ty = 0, cx = 0, cy = 0;

  function tick() {
    cx += (tx - cx) * 0.07;
    cy += (ty - cy) * 0.07;
    layers.forEach(({ id, f }) => {
      const el = document.getElementById(id);
      if (el) el.style.transform = `translate3d(${cx * f}px,${cy * f}px,0)`;
    });
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', e => {
    tx = e.clientX - window.innerWidth  / 2;
    ty = e.clientY - window.innerHeight / 2;
  });

  // Mobile: giroscópio
  function ativarGiro() {
    window.addEventListener('deviceorientation', e => {
      tx = (e.gamma || 0) * 10;
      ty = ((e.beta  || 0) - 30) * 5;
    }, { passive: true });
  }

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ exige permissão explícita — pede no primeiro toque
    document.addEventListener('touchstart', () => {
      DeviceOrientationEvent.requestPermission()
        .then(r => { if (r === 'granted') ativarGiro(); })
        .catch(() => {});
    }, { once: true, passive: true });
  } else {
    // Android e demais — sem necessidade de permissão
    ativarGiro();
  }

  tick();
}());

// Restaura modo daltônico
if (localStorage.getItem('daltonico') === '1') {
  toggleDaltonico(true);
  const chk = document.getElementById('chk-daltonico');
  if (chk) chk.checked = true;
}

// ─────────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────────
// ESTATÍSTICAS
// ─────────────────────────────────────────────
const STATS_KEY = 'gameStats';

function getStats() {
  const defOff = () => ({ p: 0, v: 0, t: [], s: [] });
  const defOn  = () => ({ p: 0, v: 0, s: [] });
  try {
    const d = JSON.parse(localStorage.getItem(STATS_KEY));
    if (!d || !d.offline || !d.online) throw 0;
    ['4x4','4x5','6x6'].forEach(k => {
      if (!d.offline[k]) d.offline[k] = defOff();
      if (!d.online[k])  d.online[k]  = defOn();
    });
    return d;
  } catch {
    return {
      offline: { '4x4': defOff(), '4x5': defOff(), '6x6': defOff() },
      online:  { '4x4': defOn(),  '4x5': defOn(),  '6x6': defOn()  }
    };
  }
}

function registrarStatOffline(tamanho, ganhou, tentativas, tempo) {
  const st = getStats();
  const s  = st.offline[tamanho];
  if (!s) return;
  s.p++;
  if (ganhou) s.v++;
  s.t = [...s.t, tentativas].slice(-200);
  s.s = [...s.s, tempo].slice(-200);
  localStorage.setItem(STATS_KEY, JSON.stringify(st));
}

function registrarStatOnline(tamanho, ganhou, tempo) {
  const st = getStats();
  const s  = st.online[tamanho];
  if (!s) return;
  s.p++;
  if (ganhou) s.v++;
  s.s = [...s.s, tempo].slice(-200);
  localStorage.setItem(STATS_KEY, JSON.stringify(st));
}

function statsAvg(arr) {
  return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

function statsFmtTempo(seg) {
  if (seg === null || seg === undefined) return '—';
  const m = Math.floor(seg / 60), s = seg % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function statsCardHtml(label, s, showTentativas) {
  const txa  = s.p ? Math.round(s.v / s.p * 100) : 0;
  const mTmp = statsAvg(s.s);
  const minS = s.s.length ? Math.min(...s.s) : null;
  const mTnt = showTentativas ? statsAvg(s.t) : null;
  const minT = showTentativas && s.t.length ? Math.min(...s.t) : null;

  return `<div class="stats-card">
    <div class="stats-card-title">${label}</div>
    <div class="stats-row"><span>Partidas</span><strong>${s.p}</strong></div>
    <div class="stats-row"><span>Vitórias</span><strong>${s.v} <small>(${txa}%)</small></strong></div>
    <div class="stats-row"><span>Derrotas</span><strong>${s.p - s.v}</strong></div>
    ${mTmp !== null ? `
    <div class="stats-divider"></div>
    <div class="stats-row"><span>Tempo médio</span><strong>${statsFmtTempo(Math.round(mTmp))}</strong></div>
    <div class="stats-row"><span>Melhor tempo</span><strong>${statsFmtTempo(minS)}</strong></div>` : ''}
    ${mTnt !== null ? `
    <div class="stats-divider"></div>
    <div class="stats-row"><span>Tentativas (média)</span><strong>${mTnt.toFixed(1)}</strong></div>
    <div class="stats-row"><span>Tentativas (mínimo)</span><strong>${minT}</strong></div>` : ''}
  </div>`;
}

function mostrarEstatisticasOffline() {
  const el = document.getElementById('tab-stats-offline');
  if (!el) return;
  const st     = getStats().offline;
  const sizes  = ['4x4','4x5','6x6'];
  const labels = { '4x4': '4 × 4', '4x5': '4 × 5', '6x6': '6 × 6' };
  const totalP = sizes.reduce((a, k) => a + st[k].p, 0);
  const totalV = sizes.reduce((a, k) => a + st[k].v, 0);
  const taxa   = totalP ? Math.round(totalV / totalP * 100) : 0;

  const btnVoltar = `<button class="btn btn-secondary" style="margin-top:20px" onclick="showScreen('screen-menu')">← Voltar</button>`;
  if (totalP === 0) {
    el.innerHTML = '<p class="stats-empty">Nenhuma partida registrada ainda.<br>Jogue uma partida para ver suas estatísticas! 🎮</p>' + btnVoltar;
    return;
  }
  el.innerHTML = `
    <div class="stats-summary">
      <div class="stats-sum-item"><span class="stats-sum-val">${totalP}</span><span class="stats-sum-lbl">Partidas</span></div>
      <div class="stats-sum-item"><span class="stats-sum-val">${totalV}</span><span class="stats-sum-lbl">Vitórias</span></div>
      <div class="stats-sum-item"><span class="stats-sum-val">${taxa}%</span><span class="stats-sum-lbl">Taxa vitória</span></div>
    </div>
    <div class="stats-grid">
      ${sizes.map(k => statsCardHtml(labels[k], st[k], true)).join('')}
    </div>
    ${btnVoltar}`;
}

function mostrarEstatisticasOnline() {
  const el = document.getElementById('tab-stats-online');
  if (!el) return;
  const st     = getStats().online;
  const sizes  = ['4x4','4x5','6x6'];
  const labels = { '4x4': '4 × 4', '4x5': '4 × 5', '6x6': '6 × 6' };
  const totalP = sizes.reduce((a, k) => a + st[k].p, 0);
  const totalV = sizes.reduce((a, k) => a + st[k].v, 0);
  const taxa   = totalP ? Math.round(totalV / totalP * 100) : 0;

  const btnVoltar = `<button class="btn btn-secondary" style="margin-top:20px" onclick="showScreen('screen-menu')">← Voltar</button>`;
  if (totalP === 0) {
    el.innerHTML = '<p class="stats-empty">Nenhuma partida online registrada ainda.<br>Jogue online para ver suas estatísticas! 🌐</p>' + btnVoltar;
    return;
  }
  el.innerHTML = `
    <div class="stats-summary">
      <div class="stats-sum-item"><span class="stats-sum-val">${totalP}</span><span class="stats-sum-lbl">Partidas</span></div>
      <div class="stats-sum-item"><span class="stats-sum-val">${totalV}</span><span class="stats-sum-lbl">Vitórias</span></div>
      <div class="stats-sum-item"><span class="stats-sum-val">${taxa}%</span><span class="stats-sum-lbl">Taxa vitória</span></div>
    </div>
    <div class="stats-grid">
      ${sizes.map(k => statsCardHtml(labels[k], st[k], false)).join('')}
    </div>
    ${btnVoltar}`;
}

// ─────────────────────────────────────────────
// NOME SALVO
// ─────────────────────────────────────────────
const NOME_KEY = 'savedPlayerName';

function carregarNomeSalvo() {
  const nome = localStorage.getItem(NOME_KEY) || '';
  const ids  = ['human-name', 'online-name'];
  ids.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    if (nome) input.value = nome;
    atualizarBadgeNome(id, input.value.trim());
    input.addEventListener('input', () => {
      const v = input.value.trim();
      if (v) localStorage.setItem(NOME_KEY, v);
      // sincroniza o outro campo
      const outroId = id === 'human-name' ? 'online-name' : 'human-name';
      const outro   = document.getElementById(outroId);
      if (outro) outro.value = input.value;
      atualizarBadgeNome(id, v);
      atualizarBadgeNome(outroId, v);
    });
  });
}

function atualizarBadgeNome(inputId, valor) {
  const badgeId = inputId === 'human-name' ? 'badge-human' : 'badge-online';
  const badge   = document.getElementById(badgeId);
  if (!badge) return;
  badge.classList.toggle('vis', !!valor);
}

// ─────────────────────────────────────────────
// LOADING
// ─────────────────────────────────────────────
(function () {
  const MIN_MS = 2000;
  const start  = Date.now();
  function dismiss() {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    el.classList.add('hide');
    setTimeout(() => el.remove(), 650);
    carregarNomeSalvo();
  }
  window.addEventListener('load', function () {
    const delay = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(dismiss, delay);
  });
}());

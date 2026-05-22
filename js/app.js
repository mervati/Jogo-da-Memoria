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

// ─────────────────────────────────────────────
// SETUP HELPERS
// ─────────────────────────────────────────────
function showScreen(id) {
  initAudio();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  playMusic();
  if (id === 'screen-records') mostrarRecordes();
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
  const board = document.getElementById('board');
  board.innerHTML = '';
  board.style.gridTemplateColumns = `repeat(${G.cols}, 1fr)`;

  const vw       = Math.min(window.innerWidth - 40, 960);
  const cardSize = Math.floor((vw - G.cols * 9) / G.cols);
  const capped   = Math.min(cardSize, 110);
  board.style.width = `${capped * G.cols + 9 * (G.cols - 1)}px`;

  G.cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card' + (card.flipped ? ' flipped' : '') + (card.matched ? ' matched' : '');
    el.id = `c${i}`;
    el.innerHTML = `
      <div class="card-inner">
        <div class="face back">🃏</div>
        <div class="face front">${card.emoji}</div>
      </div>`;
    if (!card.flipped && !card.matched) el.addEventListener('click', () => onCardClick(i));
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
  document.getElementById('turn-bar').innerHTML = `${ic} Vez de <span>${sanitize(p.name)}</span>${tx}`;
}

// ─────────────────────────────────────────────
// INTERACTION
// ─────────────────────────────────────────────
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
  const diffLabel = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
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

  // Recorde
  const humanP = G.players.find(p => !p.isAI);
  const aiP    = G.players.find(p =>  p.isAI);
  let posRecorde = 0;
  if (isAI && humanP && aiP && humanP.score > aiP.score) {
    posRecorde = salvarRecorde(humanP.name, cfg.size, diffLabel[cfg.diff], jogoTempo, jogoTentativas);
  } else if (!isAI && winners.length === 1) {
    posRecorde = salvarRecorde(winners[0].name, cfg.size, 'Multi', jogoTempo, jogoTentativas);
  }
  document.getElementById('end-record').textContent =
    posRecorde ? `🏅 Novo recorde! ${['','🥇','🥈','🥉','4️⃣','5️⃣'][posRecorde]} Top ${posRecorde}` : '';

  showScreen('screen-end');

  setTimeout(() => {
    if (isAI && humanP && aiP) {
      if      (humanP.score > aiP.score) { iniciarConfete(); playSomVitoria(); }
      else if (humanP.score < aiP.score) { iniciarAnimacaoDerrota(); playSomDerrota(); }
    } else if (!isAI && winners.length === 1) {
      iniciarConfete(); playSomVitoria();
    }
  }, 400);
}

function askMenu() {
  if (confirm('Sair da partida atual?')) {
    if (G.online && salaRef) {
      salaRef.child('jogadores/' + G.meuIndex + '/online').set(false);
    }
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
          cur: (G.cur + 1) % 2,
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

function criarSala() {
  const nome   = document.getElementById('online-name').value.trim() || 'Jogador 1';
  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  salaRef = db.ref('salas/' + codigo);
  salaRef.set({ jogadores: { 0: { nome, score: 0 } }, status: 'aguardando', tamanho: cfg.osize, placarTotal: { 0: 0, 1: 0 }, revanche: { pedido: false } });

  meuIndex = 0;
  document.getElementById('online-status').innerHTML =
    `Sala criada! Código: <strong style="color:#4fc3f7">${codigo}</strong><br>Aguardando outro jogador...`;

  salaRef.child('status').on('value', snap => {
    if (snap.val() === 'jogando') iniciarOnline(codigo);
  });
}

function entrarSala() {
  const nome   = document.getElementById('online-name').value.trim() || 'Jogador 2';
  const codigo = document.getElementById('codigo-sala').value.trim().toUpperCase();
  if (!codigo) return;

  salaRef = db.ref('salas/' + codigo);
  salaRef.once('value', snap => {
    if (!snap.exists()) {
      document.getElementById('online-status').textContent = 'Sala não encontrada.';
      return;
    }
    salaRef.child('jogadores/1').set({ nome, score: 0 });
    salaRef.child('status').set('jogando');
    meuIndex = 1;
    iniciarOnline(codigo);
  });
}

function iniciarOnline(codigo) {
  salaRef.once('value', snap => {
    const sala      = snap.val();
    const jogadores = sala.jogadores;

    G = {
      cards: [], flipped: [], cur: 0, busy: false, aiMem: {},
      totalPairs: SIZES[sala.tamanho || '4x4'].pairs, donePairs: 0, cols: SIZES[sala.tamanho || '4x4'].cols,
      online: true, meuIndex,
      players: [
        { name: jogadores[0].nome, score: 0, isAI: false, color: COLORS[0], rgb: COLORS_RGB[0] },
        { name: jogadores[1].nome, score: 0, isAI: false, color: COLORS[1], rgb: COLORS_RGB[1] }
      ]
    };

    if (meuIndex === 0) {
      const picked = shuffle([...EMOJIS]).slice(0, G.totalPairs);
      const cards  = shuffle([...picked, ...picked]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
      salaRef.child('estado').set({ cards, cur: 0, flipped: [], donePairs: 0, players: [{ score: 0 }, { score: 0 }], turnStartTime: firebase.database.ServerValue.TIMESTAMP });
    }

    gameEnded = false;
    showScreen('screen-game');
    renderScores();

    // Barra de reações
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

    const minhaRef = salaRef.child('jogadores/' + meuIndex + '/online');
    minhaRef.set(true);
    minhaRef.onDisconnect().set(false);

    const outroIndex = meuIndex === 0 ? 1 : 0;
    salaRef.child('jogadores/' + outroIndex + '/online').on('value', snap => {
      if (snap.val() === false && G.players[outroIndex]) {
        G.busy = true;
        let segundos = 10;
        const turnBar = document.getElementById('turn-bar');
        turnBar.innerHTML = `<span style="color:#e94560">⚠️ ${sanitize(G.players[outroIndex].name)} saiu da sala. Voltando ao menu em ${segundos}s...</span>`;
        const timer = setInterval(() => {
          segundos--;
          if (segundos <= 0) {
            clearInterval(timer);
            showScreen('screen-menu');
          } else {
            turnBar.innerHTML = `<span style="color:#e94560">⚠️ ${sanitize(G.players[outroIndex].name)} saiu da sala. Voltando ao menu em ${segundos}s...</span>`;
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
      e.players.forEach((p, i) => { G.players[i].score = p.score; });
      G.busy = G.flipped.length >= 2;

      if (primeiraVez) {
        renderBoard();
      } else {
        syncBoard();
      }
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
  const s0 = G.players[0].score;
  const s1 = G.players[1].score;

  if (meuIndex === 0) {
    salaRef.child('placarTotal').once('value', snap => {
      const pt = snap.val() || { 0: 0, 1: 0 };
      salaRef.child('placarTotal').set({ 0: pt[0] + s0, 1: pt[1] + s1 });
      salaRef.child('revanche').set({ pedido: false });
    });
  }

  setTimeout(() => {
    salaRef.child('placarTotal').once('value', snap => {
      const pt = snap.val() || { 0: s0, 1: s1 };
      mostrarFimOnline(s0, s1, pt[0], pt[1]);
    });
  }, meuIndex === 0 ? 400 : 700);
}

function mostrarFimOnline(s0, s1, t0, t1) {
  let winnerTxt;
  if (s0 === s1)      winnerTxt = '🤝 Empate!';
  else if (s0 > s1)   winnerTxt = `🏆 ${sanitize(G.players[0].name)} venceu!`;
  else                winnerTxt = `🏆 ${sanitize(G.players[1].name)} venceu!`;
  document.getElementById('online-winner-txt').innerHTML = winnerTxt;

  document.getElementById('online-scores-table').innerHTML = `
    <tr>
      <th></th><th>Este jogo</th><th>Total</th>
    </tr>
    <tr>
      <td style="color:${G.players[0].color};font-weight:700">👤 ${sanitize(G.players[0].name)}</td>
      <td style="color:${G.players[0].color};font-weight:800;font-size:1.1rem">${s0}</td>
      <td style="color:#666">${t0}</td>
    </tr>
    <tr>
      <td style="color:${G.players[1].color};font-weight:700">👤 ${sanitize(G.players[1].name)}</td>
      <td style="color:${G.players[1].color};font-weight:800;font-size:1.1rem">${s1}</td>
      <td style="color:#666">${t1}</td>
    </tr>`;

  const isWinner = (s0 > s1 && meuIndex === 0) || (s1 > s0 && meuIndex === 1);
  const revArea  = document.getElementById('revanche-area');

  if (!isWinner) {
    revArea.innerHTML = `<button class="btn btn-primary" onclick="pedirRevanche()">🔄 Pedir Revanche</button>`;
  } else {
    revArea.innerHTML = `<p style="color:#666;font-size:.9rem">Aguardando o adversário...</p>`;
  }

  showScreen('screen-end-online');

  setTimeout(() => {
    const meuScore   = meuIndex === 0 ? s0 : s1;
    const outroScore = meuIndex === 0 ? s1 : s0;
    if      (meuScore > outroScore) { iniciarConfete(); playSomVitoria(); }
    else if (meuScore < outroScore) { iniciarAnimacaoDerrota(); playSomDerrota(); }
  }, 400);

  salaRef.child('revanche').on('value', snap => {
    const rev = snap.val();
    if (!rev) return;

    if (rev.aceito === true)  { salaRef.child('revanche').off(); iniciarRevanche(); return; }
    if (rev.aceito === false) {
      salaRef.child('revanche').off();
      revArea.innerHTML = `<p style="color:#e94560">Revanche recusada.</p>`;
      setTimeout(() => { voltarMenuOnline(); }, 2000);
      return;
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
      const t = setInterval(() => {
        seg--;
        if (seg <= 0) { clearInterval(t); recusarRevanche(); }
        else mostrar();
      }, 1000);
    }

    if (rev.pedido && rev.de === meuIndex) {
      revArea.innerHTML = `<p style="color:#888;font-size:.9rem">Aguardando resposta...</p>`;
    }
  });
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
  gameEnded = false;
  G.cards = [];
  G.flipped = [];
  G.cur = 0;
  G.busy = false;
  G.donePairs = 0;
  G.players.forEach(p => p.score = 0);

  if (meuIndex === 0) {
    const chave  = G.cols === 4 ? '4x4' : G.cols === 5 ? '4x5' : '6x6';
    const picked = shuffle([...EMOJIS]).slice(0, G.totalPairs);
    const cards  = shuffle([...picked, ...picked]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    salaRef.child('estado').set({ cards, cur: 0, flipped: [], donePairs: 0, players: [{ score: 0 }, { score: 0 }], turnStartTime: firebase.database.ServerValue.TIMESTAMP });
    salaRef.child('revanche').set({ pedido: false });
  }

  showScreen('screen-game');
  renderScores();
}

function voltarMenuOnline() {
  if (salaRef) {
    salaRef.child('jogadores/' + meuIndex + '/online').set(false);
    salaRef.child('revanche').off();
    salaRef.child('reacao').off();
    salaRef.off();
  }
  const rbar = document.getElementById('reaction-bar');
  if (rbar) rbar.style.display = 'none';
  clearInterval(timerInterval);
  G = {};
  showScreen('screen-menu');
}

function checkMatchOnline() {
  const [a, b] = G.flipped;
  const hit    = G.cards[a].emoji === G.cards[b].emoji;
  const cards  = G.cards.map(c => ({ ...c }));
  const placar = G.players.map(p => ({ score: p.score }));

  if (hit) {
    cards[a].matched = cards[b].matched = true;
    placar[G.cur].score++;
    salaRef.child('estado').update({ cards, flipped: [], donePairs: G.donePairs + 1, players: placar, turnStartTime: firebase.database.ServerValue.TIMESTAMP });
  } else {
    cards[a].flipped = cards[b].flipped = false;
    salaRef.child('estado').update({ cards, flipped: [], cur: (G.cur + 1) % 2, players: placar, turnStartTime: firebase.database.ServerValue.TIMESTAMP });
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
  musicGain.gain.value = document.getElementById('vol-musica') ? document.getElementById('vol-musica').value / 100 : 0.30;
  somGain.gain.value   = document.getElementById('vol-som')    ? document.getElementById('vol-som').value    / 100 : 0.50;
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

function playSomVitoria() {
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
  muteMus = (v == 0);
  if (musicGain) musicGain.gain.value = v / 100;
  atualizarIconeMute();
}

function setVolSom(v) {
  muteSom = (v == 0);
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
  const canvas = criarCanvas();
  const ctx    = canvas.getContext('2d');
  const cores  = ['#e94560','#4fc3f7','#81c784','#ffb74d','#f06292','#aed581','#ff8a65','#ba68c8'];
  const parts  = Array.from({ length: 170 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 11 + 5,  h: Math.random() * 6 + 3,
    cor: cores[Math.floor(Math.random() * cores.length)],
    rot: Math.random() * 360,   vRot: Math.random() * 5 - 2.5,
    vy: Math.random() * 3 + 2,  swing: Math.random() * 1.5,
    swingV: Math.random() * .04 + .02, swingPos: Math.random() * Math.PI * 2
  }));
  const TOTAL = 230; let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alfa = f > TOTAL * .72 ? 1 - (f - TOTAL * .72) / (TOTAL * .28) : 1;
    parts.forEach(p => {
      p.y += p.vy; p.rot += p.vRot;
      p.swingPos += p.swingV; p.x += Math.sin(p.swingPos) * p.swing;
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
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
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
  preto: {
    '--bg': '#000000', '--accent': '#d4d4d4', '--accent-dark': '#aaaaaa',
    '--accent-rgb': '212,212,212', '--accent2': '#888888',
    '--card-back1': '#1a1a1a', '--card-back2': '#0a0a0a',
    '--card-matched': '#eeeeee', '--btn-txt': '#111',
    '--txt-muted': '#bbb', '--txt-dim': '#777',
    '--title-c1': '#ffffff', '--title-c2': '#66aaff'
  },
  vermelho: {
    '--bg': '#0d0000', '--accent': '#dd0000', '--accent-dark': '#aa0000',
    '--accent-rgb': '221,0,0', '--accent2': '#ff5533',
    '--card-back1': '#1a0505', '--card-back2': '#0a0000',
    '--card-matched': '#ffe0e0', '--btn-txt': '#fff',
    '--txt-muted': '#eee', '--txt-dim': '#aaa',
    '--title-c1': '#ff3333', '--title-c2': '#ffaa00'
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

function aplicarTema(nome) {
  const tema = THEMES[nome];
  if (!tema) return;
  const root = document.documentElement;
  Object.entries(tema).forEach(([k, v]) => root.style.setProperty(k, v));
  document.querySelectorAll('.theme-dot').forEach(el => {
    el.classList.toggle('ativo', el.dataset.tema === nome);
  });
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
  window.addEventListener('deviceorientation', e => {
    tx = (e.gamma || 0) * 10;
    ty = ((e.beta  || 0) - 30) * 5;
  }, { passive: true });

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
(function () {
  const MIN_MS = 2000;
  const start  = Date.now();
  function dismiss() {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    el.classList.add('hide');
    setTimeout(() => el.remove(), 650);
  }
  window.addEventListener('load', function () {
    const delay = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(dismiss, delay);
  });
}());

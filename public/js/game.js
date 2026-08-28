// game.js - Main Game Client Logic
// Handles: socket events, UI updates, player actions, state sync

// ── Constants ─────────────────────────────────────────────────
const FIGURES_DATA = [
  { id:'uzeyir', nameAz:'Üzeyir Hacıbəyov', nameEn:'Uzeyir Hajibeyli', emoji:'🎼' },
  { id:'heydar', nameAz:'Heydər Əliyev',     nameEn:'Heydar Aliyev',    emoji:'⭐' },
  { id:'nizami', nameAz:'Nizami Gəncəvi',     nameEn:'Nizami Ganjavi',   emoji:'📜' },
  { id:'musfiq', nameAz:'Mikayıl Müşfiq',     nameEn:'Mikayil Mushfig',  emoji:'🖊️' },
  { id:'cavid',  nameAz:'Hüseyn Cavid',        nameEn:'Huseyn Javid',     emoji:'📖' },
  { id:'rashid', nameAz:'Rəşid Behbudov',     nameEn:'Rashid Behbudov',  emoji:'🎵' },
  { id:'khatai', nameAz:'Ş.İ. Xətai',         nameEn:'Shah Khatai',      emoji:'⚔️' },
  { id:'ilhama', nameAz:'İlhamə Quliyeva',    nameEn:'Ilhama Guliyeva',  emoji:'🎻' },
  { id:'lotfi',  nameAz:'Lotfi Zadeh',         nameEn:'Lotfi Zadeh',      emoji:'∞'  },
];

const PLAYER_COLORS = {
  red:'#E74C3C', blue:'#3498DB', green:'#2ECC71', orange:'#F39C12',
  purple:'#9B59B6', teal:'#1ABC9C', yellow:'#F1C40F', pink:'#EC407A',
};

const BOARD_SQUARES = [
  {id:0,type:'go'},{id:1,type:'property',name:'Zabrat',nameEn:'Zabrat',color:'brown',price:60},
  {id:2,type:'community'},{id:3,type:'property',name:'Balaxanı',nameEn:'Balaxani',color:'brown',price:80},
  {id:4,type:'tax',name:'Gəlir Vergisi',nameEn:'Income Tax',amount:200},
  {id:5,type:'transport',name:'Hava Limanı',nameEn:'Airport',price:200},
  {id:6,type:'property',name:'Binəqədi',nameEn:'Binagadi',color:'lightblue',price:100},
  {id:7,type:'chance'},{id:8,type:'property',name:'Suraxanı',nameEn:'Surakhani',color:'lightblue',price:100},
  {id:9,type:'property',name:'Maştağa',nameEn:'Mashtaga',color:'lightblue',price:120},
  {id:10,type:'jail',name:'Həbs',nameEn:'Jail'},
  {id:11,type:'property',name:'Sabunçu',nameEn:'Sabunchu',color:'pink',price:140},
  {id:12,type:'utility',name:'Elektrik',nameEn:'Electric Co.',price:150},
  {id:13,type:'property',name:'Lökbatan',nameEn:'Lokbatan',color:'pink',price:140},
  {id:14,type:'property',name:'Ramana',nameEn:'Ramana',color:'pink',price:160},
  {id:15,type:'transport',name:'Dəmiryolu',nameEn:'Railway',price:200},
  {id:16,type:'property',name:'Nardaran',nameEn:'Nardaran',color:'orange',price:180},
  {id:17,type:'community'},{id:18,type:'property',name:'Novxanı',nameEn:'Novkhani',color:'orange',price:180},
  {id:19,type:'property',name:'Bilgəh',nameEn:'Bilgah',color:'orange',price:200},
  {id:20,type:'freeparking',name:'Pulsuz Park',nameEn:'Free Parking'},
  {id:21,type:'property',name:'Buzovna',nameEn:'Buzovna',color:'red',price:220},
  {id:22,type:'chance'},{id:23,type:'property',name:'Novbəgün',nameEn:'Novbagun',color:'red',price:220},
  {id:24,type:'property',name:'Balacadir',nameEn:'Balacadir',color:'red',price:240},
  {id:25,type:'transport',name:'Avtovağzal',nameEn:'Bus Terminal',price:200},
  {id:26,type:'property',name:'Xətai',nameEn:'Khatai',color:'yellow',price:260},
  {id:27,type:'property',name:'Binə',nameEn:'Bina',color:'yellow',price:260},
  {id:28,type:'utility',name:'Su Şirkəti',nameEn:'Water Works',price:150},
  {id:29,type:'property',name:'Nərimanov',nameEn:'Narimanov',color:'yellow',price:280},
  {id:30,type:'gotojail',name:'Həbsə Get',nameEn:'Go To Jail'},
  {id:31,type:'property',name:'Nizami',nameEn:'Nizami',color:'green',price:300},
  {id:32,type:'property',name:'Yasamal',nameEn:'Yasamal',color:'green',price:300},
  {id:33,type:'community'},{id:34,type:'property',name:'Nəsimi',nameEn:'Nasimi',color:'green',price:320},
  {id:35,type:'transport',name:'Dəniz Limanı',nameEn:'Sea Port',price:200},
  {id:36,type:'chance'},{id:37,type:'property',name:'Şirvan',nameEn:'Shirvan',color:'darkblue',price:350},
  {id:38,type:'tax',name:'Əmlak Vergisi',nameEn:'Luxury Tax',amount:100},
  {id:39,type:'property',name:'İçərişəhər',nameEn:'Icherisheher',color:'darkblue',price:400},
];

const TRANSPORT_IDS = [5, 15, 25, 35];
const COLOR_HEX_MAP = {
  brown:'#8B4513',lightblue:'#87CEEB',pink:'#FF69B4',orange:'#FFA500',
  red:'#FF3333',yellow:'#FFD700',green:'#228B22',darkblue:'#00008B',
};

// ── State ─────────────────────────────────────────────────────
let socket = null;
let lang = 'az';
let myPlayerId = null;
let myRoomCode = null;
let gameState = null;
let iAmCurrentPlayer = false;

// Starting phase state
let hasRolledForStart = false;
let hasRolledInTie = false;
let inTieBreaker = false;
let startingOrderDone = false;
let startingRollInProgress = false;
let startingUIInited = false; // ensures initStartingUI runs exactly once
let boardInitialized = false; // ensures board re-renders after layout is ready

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  myRoomCode  = params.get('room');
  myPlayerId  = params.get('player');

  if (!myRoomCode || !myPlayerId) {
    showToast(lang==='az'?'Otaq tapılmadı, ana səhifəyə yönləndirilirsiniz...':'No room found, redirecting...', 'error');
    setTimeout(() => { window.location.href = '/'; }, 2000);
    return;
  }

  // Init canvas
  canvas = document.getElementById('board-canvas');
  ctx = canvas.getContext('2d');
  drawBoard(lang);

  // Re-render board after a short delay to ensure layout has settled
  // (fixes canvas being 0-size if CSS grid hasn't fully calculated yet)
  setTimeout(() => {
    drawBoard(lang);
  }, 100);

  // Board click
  canvas.addEventListener('click', onBoardClick);

  // Connect socket
  socket = io();

  // Bind game-state listener immediately after socket is created
  // so it catches the very first state emitted by the server upon reconnect
  socket.on('game-state', (state) => { handleGameState(state); });

  socket.on('connect', () => {
    console.log('Connected:', socket.id);
    socket.emit('rejoin-game', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
      if (res?.error) {
        showToast(lang === 'az' ? 'Otaq tapılmadı...' : 'Room not found...', 'error');
        setTimeout(() => { window.location.href = '/'; }, 2000);
      }
    });
  });

  // Everyone sees the starting dice roll result
  socket.on('start-roll-result', ({ playerId, result }) => {
    if (!result) return;

    // Get the roll value: from allRolls, or from result.roll (partial has it)
    const roll = (result.allRolls?.[playerId]) ?? result.roll;

    if (roll !== undefined) {
      // Split the 2-die sum into two dice for animation
      const d1 = Math.min(6, Math.ceil(roll / 2));
      const d2 = Math.min(6, roll - d1 > 0 ? roll - d1 : 1);
      // Animate starting dice panel for ALL clients
      animateStartDice(d1, d2, () => {
        // Update all roll displays (use gameState.startingOrderRolls as source of truth)
        if (result.allRolls && Object.keys(result.allRolls).length > 0) {
          updateStartingRolls(result.allRolls);
        } else if (gameState?.startingOrderRolls) {
          updateStartingRolls(gameState.startingOrderRolls);
        }
        // Toast for the roller
        if (gameState) {
          const roller = gameState.players.find(p => p.id === playerId);
          if (roller) {
            const name = lang === 'az' ? roller.nameAz : roller.nameEn;
            showToast(`${name}: ${roll} 🎲`, 'info');
          }
        }
        // If order decided, announce winner then transition
        if (result.type === 'ordered') {
          const winnerId = result.orderedPlayerIds?.[0];
          // Try to get winner from gameState (it has updated currentPlayerId)
          const winnerFromState = gameState?.players.find(p => p.id === (winnerId || gameState?.currentPlayerId));
          if (winnerFromState) {
            const wname = lang === 'az' ? winnerFromState.nameAz : winnerFromState.nameEn;
            const statusEl = document.getElementById('starting-status');
            if (statusEl) {
              statusEl.innerHTML = `<span style="color:#FFD700;font-size:1.3em;font-weight:800">🏆 ${wname} ${lang === 'az' ? 'birinci oynayır!' : 'goes first!'}</span>`;
            }
          }
          // Transition to game board after short delay
          setTimeout(() => {
            transitionToGame();
          }, 2500);
        }
      });
    } else if (result.allRolls) {
      updateStartingRolls(result.allRolls);
    }
  });

  // Tie-breaker: only tied players need to re-roll
  socket.on('start-tie', ({ tiedPlayers }) => {
    inTieBreaker = true;
    hasRolledInTie = false;
    // Reset tied players' display
    if (gameState) {
      gameState.players.forEach(p => {
        if (tiedPlayers.includes(p.id)) {
          const el = document.getElementById(`srv-${p.id}`);
          if (el) el.textContent = '?';
          const item = document.getElementById(`start-roll-${p.id}`);
          if (item) item.classList.remove('rolled');
        }
      });
    }
    const statusEl = document.getElementById('starting-status');
    if (statusEl) statusEl.textContent = lang === 'az' ? 'Bərabərlik! Eyni rəqəm alanlar yenidən atır...' : 'Tie! Re-rolling...';
    updateStartBtn();
  });

  // Everyone sees the dice roll animation during main game
  socket.on('dice-rolled', ({ playerId, dice, doubles }) => {
    animateDice(dice[0], dice[1], () => {
      showDoublesBadge(doubles);
      // Show who rolled in log area
      if (gameState) {
        const roller = gameState.players.find(p => p.id === playerId);
        if (roller && playerId !== myPlayerId) {
          const name = lang === 'az' ? roller.nameAz : roller.nameEn;
          addLogMessage(`🎲 ${name}: ${dice[0]} + ${dice[1]} = ${dice[0]+dice[1]}`);
        }
      }
    });
  });

  socket.on('chat-message', ({ playerId, playerName, message }) => {
    addChatMessage(playerName, message, playerId === myPlayerId);
  });
  socket.on('player-left', ({ playerName }) => {
    addLogMessage(`⚠️ ${playerName} ${lang==='az'?'oyundan çıxdı':'left the game'}`);
  });
});



// ── Language ─────────────────────────────────────────────────
window.setLang = function(l) {
  lang = l;
  document.querySelectorAll('[data-az]').forEach(el => {
    el.textContent = l === 'az' ? el.dataset.az : el.dataset.en;
  });
  document.getElementById('btn-az').classList.toggle('active', l === 'az');
  document.getElementById('btn-en').classList.toggle('active', l === 'en');
  if (gameState) {
    updateBoard(gameState, buildColorMap(), lang);
    renderAllUI();
  } else {
    drawBoard(lang);
  }
};

// ── Game State Handler ────────────────────────────────────────
function handleGameState(state) {
  const wasStarting = !gameState || gameState.startingPhase;
  gameState = state;
  iAmCurrentPlayer = state.currentPlayerId === myPlayerId;

  // If starting phase is active, init the starting UI
  if (state.startingPhase && !startingUIInited) {
    startingUIInited = true;
    initStartingUI();
    updateStartBtn();
  }

  // Update rolls display if in starting phase
  if (state.startingPhase && state.startingOrderRolls) {
    const rolls = state.startingOrderRolls;
    if (Object.keys(rolls).length > 0) {
      if (!startingUIInited) {
        startingUIInited = true;
        initStartingUI();
      }
      updateStartingRolls(rolls);
    }
  }

  // Starting phase ended or was never active → make sure game board is visible
  if (!state.startingPhase && !startingOrderDone) {
    startingOrderDone = true;
    transitionToGame();
  }

  updateBoard(state, buildColorMap(), lang);
  renderAllUI();

  // Re-render board after a short delay on first game state to ensure canvas is properly sized
  if (!boardInitialized) {
    boardInitialized = true;
    setTimeout(() => {
      if (gameState) {
        updateBoard(gameState, buildColorMap(), lang);
        renderTokens();
      }
    }, 200);
  }

  // Modals
  if (state.phase === 'card' && state.pendingCard) {
    if (iAmCurrentPlayer) {
      showCardModal(state.pendingCard.card, state.pendingCard.type, lang, () => {});
    }
  } else {
    hideCardModal();
  }

  if (state.phase === 'auction' && state.auctionData) {
    showAuctionModal(state.auctionData, lang);
    updateAuctionModal(state.auctionData, state.players, lang);
  } else if (state.phase !== 'auction') {
    hideAuctionModal();
  }

  if (state.phase === 'trade' && state.tradeData) {
    if (state.tradeData.toId === myPlayerId) {
      const fromPlayer = state.players.find(p => p.id === state.tradeData.fromId);
      const me = state.players.find(p => p.id === myPlayerId);
      showIncomingTrade(state.tradeData, fromPlayer, me, lang);
    }
  }

  if (state.phase === 'buying' && iAmCurrentPlayer) {
    showBuyPanel(state.players.find(p=>p.id===myPlayerId));
  } else {
    hideBuyPanel();
  }

  if (state.gameOver && state.winner) {
    showGameOver(state.winner);
  }
}

function buildColorMap() {
  const map = {};
  if (gameState) {
    gameState.players.forEach(p => {
      map[p.id] = PLAYER_COLORS[p.color] || '#FFFFFF';
    });
  }
  return map;
}

// ── Starting Order UI ─────────────────────────────────────────
function initStartingUI() {
  const container = document.getElementById('starting-rolls');
  if (!container || !gameState) return;
  container.innerHTML = '';
  gameState.players.forEach(p => {
    const fig = FIGURES_DATA.find(f => f.id === p.figure);
    const colorHex = PLAYER_COLORS[p.color] || '#fff';
    const div = document.createElement('div');
    div.className = 'start-roll-item';
    div.id = `start-roll-${p.id}`;
    div.innerHTML = `
      <div class="start-roll-figure" style="border-color:${colorHex};background:${colorHex}22">${fig?.emoji || '👤'}</div>
      <div class="start-roll-name">${lang==='az'?p.nameAz:p.nameEn}</div>
      <div class="start-roll-value" id="srv-${p.id}">?</div>
    `;
    container.appendChild(div);
  });
  // Note: start-die1 / start-die2 are now in game.html directly, no need to create them here
}

function updateStartingRolls(rolls) {
  if (!gameState) return;
  Object.entries(rolls).forEach(([pid, roll]) => {
    const el = document.getElementById(`srv-${pid}`);
    if (el && roll !== undefined) {
      el.textContent = roll;
      const item = document.getElementById(`start-roll-${pid}`);
      if (item) item.classList.add('rolled');
    }
  });

  // Check if my roll is already in there (e.g. after a reconnect)
  if (rolls[myPlayerId] !== undefined) {
    hasRolledForStart = true;
    updateStartBtn();
  }
}

// Animate starting dice in the overlay
function animateStartDice(d1, d2, callback) {
  const die1 = document.getElementById('start-die1');
  const die2 = document.getElementById('start-die2');
  if (!die1 || !die2) { callback && callback(); return; }

  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  let count = 0;
  const interval = setInterval(() => {
    die1.textContent = faces[Math.floor(Math.random() * 6)];
    die2.textContent = faces[Math.floor(Math.random() * 6)];
    die1.classList.add('rolling');
    die2.classList.add('rolling');
    count++;
    if (count >= 8) {
      clearInterval(interval);
      die1.textContent = faces[Math.min(d1, 6) - 1];
      die2.textContent = faces[Math.min(d2, 6) - 1];
      die1.classList.remove('rolling');
      die2.classList.remove('rolling');
      die1.classList.add('rolled-anim');
      die2.classList.add('rolled-anim');
      setTimeout(() => {
        die1.classList.remove('rolled-anim');
        die2.classList.remove('rolled-anim');
        callback && callback();
      }, 400);
    }
  }, 80);
}

// Transition from starting overlay to game board
function transitionToGame() {
  const layout = document.getElementById('game-layout');
  if (!layout) return;

  // Hide any starting overlay if it exists
  const overlay = document.getElementById('starting-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.8s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.opacity = '';
    }, 800);
  }

  // Ensure game layout is visible
  layout.classList.remove('hidden');
  layout.classList.add('visible-after-start');

  // Trigger re-render once layout is visible
  if (gameState) {
    updateBoard(gameState, buildColorMap(), lang);
    renderAllUI();
  }

  // Also re-render after a frame to make sure canvas container has proper dimensions
  requestAnimationFrame(() => {
    if (gameState) {
      updateBoard(gameState, buildColorMap(), lang);
      renderTokens();
    }
  });
}

function updateStartBtn() {
  const btn = document.getElementById('btn-roll-start');
  if (!btn) return;

  // Can I roll right now?
  const canRoll = inTieBreaker ? !hasRolledInTie : !hasRolledForStart;

  btn.disabled = !canRoll;
  btn.style.opacity = canRoll ? '1' : '0.4';

  const spanEl = btn.querySelector('span[data-az]');
  if (!spanEl) return;
  if (!canRoll) {
    spanEl.textContent = lang === 'az' ? 'Gözlənilir...' : 'Waiting...';
  } else {
    spanEl.textContent = lang === 'az'
      ? (inTieBreaker ? 'Yenidən At (Bərabərlik)' : 'Zər At')
      : (inTieBreaker ? 'Re-Roll (Tie)' : 'Roll Die');
  }
}

window.rollForStart = function() {
  const canRoll = inTieBreaker ? !hasRolledInTie : !hasRolledForStart;
  if (!canRoll || startingRollInProgress) return;

  startingRollInProgress = true;

  // Immediately show feedback so user knows click worked
  const statusEl = document.getElementById('starting-status');
  if (statusEl) {
    statusEl.textContent = lang === 'az' ? '☀️ Zər atıldı, nəticə gəlir...' : '☀️ Rolled, waiting for result...';
  }
  // Animate dice immediately (local preview)
  animateStartDice(
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    () => { startingRollInProgress = false; }
  );

  if (inTieBreaker) {
    hasRolledInTie = true;
    socket.emit('roll-for-start-tie', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
      if (res?.error) {
        showToast(res.error, 'error');
        hasRolledInTie = false;
        startingRollInProgress = false;
        updateStartBtn();
      }
    });
  } else {
    hasRolledForStart = true;
    socket.emit('roll-for-start', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
      if (res?.error) {
        showToast(res.error, 'error');
        hasRolledForStart = false;
        startingRollInProgress = false;
        updateStartBtn();
      }
    });
  }
  updateStartBtn();
};

// ── Render All UI ─────────────────────────────────────────────
function renderAllUI() {
  if (!gameState) return;
  renderPlayerList();
  renderTokens();
  renderTurnPanel();
  renderDicePanel();
  renderJailPanel();
  renderMyProps();
  renderBuildPanel();
  updateBankPool();

  // Log messages
  const logs = gameState.log || [];
  const chatEl = document.getElementById('chat-messages');
  if (chatEl) {
    const existingLogs = chatEl.querySelectorAll('.chat-msg-log').length;
    if (logs.length > existingLogs) {
      const newLogs = logs.slice(existingLogs);
      newLogs.forEach(entry => {
        addLogMessage(lang === 'az' ? entry.az : entry.en);
      });
    }
  }
}

// ── Player List ───────────────────────────────────────────────
function renderPlayerList() {
  const list = document.getElementById('player-list');
  if (!list || !gameState) return;
  list.innerHTML = '';

  gameState.players.forEach(p => {
    const fig = FIGURES_DATA.find(f => f.id === p.figure);
    const colorHex = PLAYER_COLORS[p.color] || '#FFF';
    const isCurrentTurn = p.id === gameState.currentPlayerId;
    const isMe = p.id === myPlayerId;

    const item = document.createElement('div');
    item.className = 'player-item' +
      (isCurrentTurn ? ' current-turn' : '') +
      (p.isBankrupt ? ' bankrupt' : '');

    // Property color dots
    const propDots = p.properties.map(propId => {
      const sq = BOARD_SQUARES[propId];
      if (!sq) return '';
      const c = sq.color ? COLOR_HEX_MAP[sq.color] : colorHex;
      return `<div class="player-prop-dot" style="background:${c}" title="${lang==='az'?sq.name:sq.nameEn}"></div>`;
    }).join('');

    item.innerHTML = `
      <div class="player-item-top">
        <div class="player-avatar" style="border-color:${colorHex};background:${colorHex}22">
          ${fig?.emoji || '👤'}
        </div>
        <div>
          <div class="player-info-name">${lang==='az'?p.nameAz:p.nameEn}${isMe?' 👤':''}</div>
          <div class="player-info-fig">${fig?.[lang==='az'?'nameAz':'nameEn'] || ''}</div>
        </div>
      </div>
      <div class="player-money">${p.money}₼</div>
      <div class="player-props-row">${propDots}</div>
      <div class="player-badges">
        ${p.inJail ? `<span class="badge-jail">⛓️</span>` : ''}
      </div>
    `;

    // Click to trade
    if (!isMe && !p.isBankrupt) {
      item.style.cursor = 'pointer';
      item.onclick = () => initiateTrade(p);
    }

    list.appendChild(item);
  });
}

// ── Tokens ────────────────────────────────────────────────────
function renderTokens() {
  const overlay = document.getElementById('tokens-overlay');
  if (!overlay || !gameState) return;
  overlay.innerHTML = '';

  // Group players by position
  const byPosition = {};
  gameState.players.forEach(p => {
    if (!p.isBankrupt) {
      if (!byPosition[p.position]) byPosition[p.position] = [];
      byPosition[p.position].push(p);
    }
  });

  Object.entries(byPosition).forEach(([pos, players]) => {
    players.forEach((p, idx) => {
      const fig = FIGURES_DATA.find(f => f.id === p.figure);
      const colorHex = PLAYER_COLORS[p.color] || '#FFF';
      const screenPos = getTokenScreenPos(parseInt(pos), idx, players.length);

      // Scale to canvas display size (canvas might be bigger than element)
      const canvasEl = document.getElementById('board-canvas');
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = rect.width / BOARD_SIZE;
      const scaleY = rect.height / BOARD_SIZE;

      const token = document.createElement('div');
      token.className = 'player-token' + (p.inJail ? ' in-jail' : '');
      token.style.left = (screenPos.x * scaleX + rect.left - overlay.getBoundingClientRect().left) + 'px';
      token.style.top  = (screenPos.y * scaleY + rect.top  - overlay.getBoundingClientRect().top)  + 'px';
      token.style.borderColor = colorHex;
      token.style.background = colorHex + '33';
      token.textContent = fig?.emoji || '👤';
      token.title = lang==='az' ? p.nameAz : p.nameEn;
      overlay.appendChild(token);
    });
  });
}

// ── Turn Panel ────────────────────────────────────────────────
function renderTurnPanel() {
  if (!gameState) return;
  const current = gameState.players.find(p => p.id === gameState.currentPlayerId);
  if (!current) return;

  const nameEl  = document.getElementById('turn-player');
  const phaseEl = document.getElementById('turn-phase');

  if (nameEl) {
    const fig = FIGURES_DATA.find(f => f.id === current.figure);
    nameEl.textContent = (fig?.emoji || '') + ' ' + (lang==='az' ? current.nameAz : current.nameEn);
    nameEl.style.color = PLAYER_COLORS[current.color] || '#FFF';
  }

  if (phaseEl) {
    const phases = {
      rolling:  { az:'Zər at',    en:'Roll dice' },
      buying:   { az:'Al və ya artır', en:'Buy or auction' },
      auction:  { az:'Artırma',   en:'Auction' },
      card:     { az:'Kart çək',  en:'Draw card' },
      trade:    { az:'Mübadilə',  en:'Trade' },
      jail:     { az:'Həbsdəsən', en:'In jail' },
      endturn:  { az:'Növbəni bitir', en:'End turn' },
      building: { az:'Tikinti',   en:'Building' },
    };
    const p = phases[gameState.phase] || { az: gameState.phase, en: gameState.phase };
    phaseEl.textContent = lang === 'az' ? p.az : p.en;
  }
}

// ── Dice Panel ────────────────────────────────────────────────
function renderDicePanel() {
  if (!gameState) return;
  const rollBtn   = document.getElementById('btn-roll');
  const endBtn    = document.getElementById('btn-end-turn');

  if (!rollBtn || !endBtn) return;

  if (iAmCurrentPlayer) {
    if (gameState.phase === 'rolling') {
      rollBtn.classList.remove('hidden');
      endBtn.classList.add('hidden');
    } else if (gameState.phase === 'endturn') {
      rollBtn.classList.add('hidden');
      endBtn.classList.remove('hidden');
    } else {
      rollBtn.classList.add('hidden');
      endBtn.classList.add('hidden');
    }
  } else {
    rollBtn.classList.add('hidden');
    endBtn.classList.add('hidden');
  }

  // Show dice values
  if (gameState.lastDice) {
    showDice(gameState.lastDice[0], gameState.lastDice[1]);
  }
  showDoublesBadge(gameState.lastDoubles);
}

// ── Jail Panel ────────────────────────────────────────────────
function renderJailPanel() {
  if (!gameState) return;
  const jailPanel = document.getElementById('jail-panel');
  if (!jailPanel) return;

  const me = gameState.players.find(p => p.id === myPlayerId);
  if (!me || !me.inJail || !iAmCurrentPlayer || gameState.phase !== 'rolling') {
    jailPanel.classList.add('hidden');
    return;
  }

  jailPanel.classList.remove('hidden');
  const cardBtn = document.getElementById('btn-jail-card');
  if (cardBtn) {
    cardBtn.disabled = (me.jailFreeCards || 0) === 0;
    cardBtn.style.opacity = cardBtn.disabled ? '0.4' : '1';
  }
}

// ── Buy Panel ─────────────────────────────────────────────────
function showBuyPanel(player) {
  if (!player) return;
  const sq = BOARD_SQUARES[player.position];
  if (!sq) return;

  const panel = document.getElementById('buy-panel');
  document.getElementById('buy-prop-icon').textContent = getBoardIcon(sq.id);
  document.getElementById('buy-prop-name').textContent = lang==='az' ? sq.name : sq.nameEn;
  document.getElementById('buy-prop-price').textContent = `${sq.price}₼`;
  document.getElementById('buy-prop-rent').textContent = sq.rent
    ? (lang==='az'?'Kirayə: ':'Rent: ') + sq.rent[0] + '₼'
    : '';

  if (panel) panel.classList.remove('hidden');
}

function hideBuyPanel() {
  const panel = document.getElementById('buy-panel');
  if (panel) panel.classList.add('hidden');
}

const BOARD_ICONS = {0:'🚀',2:'💰',4:'🏦',5:'✈️',7:'⚡',10:'⛓️',12:'⚡',15:'🚂',17:'💰',
  20:'🅿️',22:'⚡',25:'🚌',28:'💧',30:'🚓',33:'💰',35:'🚢',36:'⚡',38:'💸',
  1:'🏭',3:'🏭',6:'🕌',8:'🔥',9:'🏘️',11:'🏗️',13:'🌋',14:'🏰',16:'🏰',18:'🌿',19:'🏖️',
  21:'🏖️',23:'🌲',24:'🌾',26:'🏛️',27:'✈️',29:'🏟️',31:'🛍️',32:'🏙️',34:'🕌',37:'🏰',39:'🗼'};

function getBoardIcon(id) { return BOARD_ICONS[id] || '🏠'; }

// ── My Properties ─────────────────────────────────────────────
function renderMyProps() {
  if (!gameState) return;
  const me = gameState.players.find(p => p.id === myPlayerId);
  const list = document.getElementById('my-props-list');
  if (!list || !me) return;

  list.innerHTML = '';
  me.properties.forEach(propId => {
    const sq = BOARD_SQUARES[propId];
    if (!sq) return;
    const name = lang==='az' ? sq.name : sq.nameEn;
    const colorHex = sq.color ? COLOR_HEX_MAP[sq.color] : '#888';
    const houses = me.houses?.[propId] || 0;

    const item = document.createElement('div');
    item.className = 'my-prop-item';
    item.innerHTML = `
      <div class="my-prop-color" style="background:${colorHex}"></div>
      <span class="my-prop-name">${getBoardIcon(propId)} ${name}</span>
      <span class="my-prop-houses">${houses > 0 ? (houses === 5 ? '🏨' : '🏠'.repeat(houses)) : ''}</span>
    `;
    item.onclick = () => showPropInfo(propId);
    list.appendChild(item);
  });
}

// ── Build Panel ───────────────────────────────────────────────
function renderBuildPanel() {
  if (!gameState) return;
  const me = gameState.players.find(p => p.id === myPlayerId);
  const panel = document.getElementById('build-panel');
  const list  = document.getElementById('build-props-list');
  if (!panel || !list || !me) return;

  // Find buildable properties (full color group)
  const buildable = me.properties.filter(propId => {
    const sq = BOARD_SQUARES[propId];
    if (!sq || sq.type !== 'property') return false;
    // Check full group
    const group = BOARD_SQUARES.filter(s => s.type === 'property' && s.color === sq.color);
    return group.every(s => me.properties.includes(s.id));
  });

  if (buildable.length === 0 || !iAmCurrentPlayer) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');
  list.innerHTML = '';

  buildable.forEach(propId => {
    const sq = BOARD_SQUARES[propId];
    const houses = me.houses?.[propId] || 0;
    const houseLabel = houses === 5 ? (lang==='az'?'🏨 Otel':'🏨 Hotel') : `🏠 x${houses}`;

    const item = document.createElement('div');
    item.className = 'build-prop-item';
    item.innerHTML = `
      <span class="build-prop-name">${lang==='az'?sq.name:sq.nameEn}</span>
      <span class="build-prop-houses">${houseLabel}</span>
      <button class="build-btn" onclick="buildHouse(${propId})" ${houses>=5?'disabled':''}>+</button>
      <button class="build-btn sell-btn" onclick="sellHouse(${propId})" ${houses<=0?'disabled':''}>−</button>
    `;
    list.appendChild(item);
  });
}

// ── Bank Pool ─────────────────────────────────────────────────
function updateBankPool() {
  const el = document.getElementById('bank-pool');
  if (el && gameState) el.textContent = `🅿️ ${gameState.freeParkingPool}₼`;
}

// ── Property Info Modal ───────────────────────────────────────
function showPropInfo(propId) {
  const sq = BOARD_SQUARES[propId];
  if (!sq) return;

  document.getElementById('prop-info-icon').textContent = getBoardIcon(propId);
  document.getElementById('prop-info-name').textContent = lang==='az' ? sq.name : sq.nameEn;

  const groupEl = document.getElementById('prop-info-group');
  if (sq.color) {
    groupEl.style.background = COLOR_HEX_MAP[sq.color];
    const groupNames = { brown:'Qəhvəyi',lightblue:'Açıq Mavi',pink:'Çəhrayı',orange:'Narıncı',
      red:'Qırmızı',yellow:'Sarı',green:'Yaşıl',darkblue:'Tünd Mavi' };
    groupEl.textContent = lang==='az' ? (groupNames[sq.color]||sq.color) : sq.color;
    groupEl.style.display = 'inline-block';
  } else {
    groupEl.style.display = 'none';
  }

  // Rent table
  const table = document.getElementById('rent-table');
  table.innerHTML = '';
  if (sq.type === 'property' && sq.rent) {
    const labels = lang==='az'
      ? ['İcàrə','1 Ev','2 Ev','3 Ev','4 Ev','Otel']
      : ['Rent','1 House','2 Houses','3 Houses','4 Houses','Hotel'];
    sq.rent.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${labels[i]||i}</td><td>${r}₼</td>`;
      table.appendChild(tr);
    });
    if (sq.price) {
      const tr2 = document.createElement('tr');
      tr2.innerHTML = `<td>${lang==='az'?'Qiymət':'Price'}</td><td>${sq.price}₼</td>`;
      table.appendChild(tr2);
    }
    if (sq.mortgage) {
      const tr3 = document.createElement('tr');
      tr3.innerHTML = `<td>${lang==='az'?'İpoteka':'Mortgage'}</td><td>${sq.mortgage}₼</td>`;
      table.appendChild(tr3);
    }
    if (sq.houseCost) {
      const tr4 = document.createElement('tr');
      tr4.innerHTML = `<td>${lang==='az'?'Ev tikinti':'House cost'}</td><td>${sq.houseCost}₼</td>`;
      table.appendChild(tr4);
    }
  }

  // Actions
  const me = gameState?.players.find(p => p.id === myPlayerId);
  const actionsEl = document.getElementById('prop-info-actions');
  actionsEl.innerHTML = '';

  if (me && me.properties.includes(propId) && iAmCurrentPlayer) {
    const mortgageBtn = document.createElement('button');
    mortgageBtn.className = 'btn-secondary btn-sm';
    mortgageBtn.textContent = lang==='az' ? '🏦 İpoteka Et' : '🏦 Mortgage';
    mortgageBtn.onclick = () => { mortgageProperty(propId); closePropInfo(); };
    actionsEl.appendChild(mortgageBtn);
  }

  document.getElementById('prop-info-modal').classList.remove('hidden');
}

window.closePropInfo = function() {
  document.getElementById('prop-info-modal').classList.add('hidden');
};

// ── Board Click ───────────────────────────────────────────────
function onBoardClick(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = BOARD_SIZE / rect.width;
  const scaleY = BOARD_SIZE / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top)  * scaleY;

  const squareId = getBoardSquareAtClick(x, y);
  if (squareId >= 0 && gameState) {
    const sq = BOARD_SQUARES[squareId];
    if (sq && (sq.type === 'property' || sq.type === 'transport' || sq.type === 'utility')) {
      showPropInfo(squareId);
    }
  }
}

// ── Player Click (Trade) ──────────────────────────────────────
function initiateTrade(targetPlayer) {
  if (!gameState || !iAmCurrentPlayer) {
    showToast(lang==='az'?'Yalnız öz növbənizdə mübadilə edə bilərsiniz':'Only trade on your turn', 'error');
    return;
  }
  const me = gameState.players.find(p => p.id === myPlayerId);
  openTradeModal(targetPlayer, me, lang);
}

// ── Actions ───────────────────────────────────────────────────
window.rollDice = function() {
  socket.emit('roll-dice', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
  });
};

window.endTurn = function() {
  socket.emit('end-turn', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
  });
};

window.buyProperty = function() {
  socket.emit('buy-property', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    else hideBuyPanel();
  });
};

window.declineBuy = function() {
  socket.emit('decline-buy', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    else hideBuyPanel();
  });
};

window.executeCard = function() {
  if (window._cardExecuteCallback) window._cardExecuteCallback();
  socket.emit('execute-card', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    hideCardModal();
  });
};

window.payJail = function() {
  socket.emit('pay-jail', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    else showToast(lang==='az'?'50₼ ödəndi, azadsınız!':'Paid 50₼, you\'re free!', 'success');
  });
};

window.useJailCard = function() {
  socket.emit('use-jail-card', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    else showToast(lang==='az'?'Kart istifadə edildi!':'Card used!', 'success');
  });
};

window.buildHouse = function(squareId) {
  socket.emit('build-house', { roomCode: myRoomCode, playerId: myPlayerId, squareId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
  });
};

window.sellHouse = function(squareId) {
  socket.emit('sell-house', { roomCode: myRoomCode, playerId: myPlayerId, squareId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
  });
};

window.mortgageProperty = function(squareId) {
  socket.emit('mortgage', { roomCode: myRoomCode, playerId: myPlayerId, squareId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    else showToast(lang==='az'?'İpoteka edildi':'Mortgaged', 'success');
  });
};

// ── Auction ───────────────────────────────────────────────────
window.placeBid = function() {
  const amount = parseInt(document.getElementById('auction-bid-input').value);
  if (isNaN(amount) || amount <= 0) return;
  socket.emit('place-bid', { roomCode: myRoomCode, playerId: myPlayerId, amount }, (res) => {
    if (res?.error) showToast(res.error, 'error');
  });
};

window.passAuction = function() {
  socket.emit('pass-auction', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res?.error) showToast(res.error, 'error');
  });
};

// ── Trade ─────────────────────────────────────────────────────
window.sendTrade = function() {
  const offer = getTradeOffer();
  socket.emit('initiate-trade', {
    roomCode: myRoomCode,
    fromId: myPlayerId,
    toId: offer.toId,
    fromOffer: offer.fromOffer,
    toOffer: offer.toOffer,
  }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    else {
      closeTrade();
      showToast(lang==='az'?'Təklif göndərildi':'Offer sent', 'success');
    }
  });
};

window.respondTrade = function(accepted) {
  socket.emit('respond-trade', { roomCode: myRoomCode, playerId: myPlayerId, accepted }, (res) => {
    if (res?.error) showToast(res.error, 'error');
    hideIncomingTrade();
    showToast(accepted
      ? (lang==='az'?'Mübadilə qəbul edildi':'Trade accepted')
      : (lang==='az'?'Mübadilə rədd edildi':'Trade rejected'),
      accepted ? 'success' : 'error');
  });
};

window.closeTrade = function() {
  closeTrade(); // from trade.js
  socket.emit('cancel-trade', { roomCode: myRoomCode, playerId: myPlayerId });
};

// ── Transport Teleport ────────────────────────────────────────
function showTransportModal() {
  const modal = document.getElementById('transport-modal');
  const container = document.getElementById('transport-options');
  container.innerHTML = '';

  const transports = [
    { id:5,  nameAz:'Hava Limanı',  nameEn:'Airport',      icon:'✈️' },
    { id:15, nameAz:'Dəmiryolu',    nameEn:'Railway',       icon:'🚂' },
    { id:25, nameAz:'Avtovağzal',   nameEn:'Bus Terminal',  icon:'🚌' },
    { id:35, nameAz:'Dəniz Limanı', nameEn:'Sea Port',      icon:'🚢' },
  ];

  transports.forEach(t => {
    const me = gameState.players.find(p => p.id === myPlayerId);
    if (me && me.position === t.id) return; // skip current position

    const opt = document.createElement('div');
    opt.className = 'transport-option';
    opt.innerHTML = `<span class="transport-option-icon">${t.icon}</span><span>${lang==='az'?t.nameAz:t.nameEn}</span>`;
    opt.onclick = () => {
      socket.emit('teleport-transport', { roomCode: myRoomCode, playerId: myPlayerId, targetSquareId: t.id });
      closeTransportModal();
    };
    container.appendChild(opt);
  });

  modal.classList.remove('hidden');
}

window.closeTransportModal = function() {
  document.getElementById('transport-modal').classList.add('hidden');
};

// ── Game Over ─────────────────────────────────────────────────
function showGameOver(winner) {
  const modal = document.getElementById('gameover-modal');
  const winnerEl = document.getElementById('gameover-winner');
  const fig = FIGURES_DATA.find(f => f.id === winner.figure);
  winnerEl.textContent = `${fig?.emoji||''} ${lang==='az'?winner.nameAz:winner.nameEn} 🏆`;
  modal.classList.remove('hidden');
}

// ── Chat ──────────────────────────────────────────────────────
function addChatMessage(name, message, isMe) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.innerHTML = `<span class="chat-msg-name" style="color:${isMe?'#FFD700':'#87CEEB'}">${name}:</span> ${message}`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function addLogMessage(text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'chat-msg chat-msg-log';
  el.textContent = text;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

window.sendChat = function() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  socket.emit('chat-message', { roomCode: myRoomCode, playerId: myPlayerId, message: msg });
  input.value = '';
};

window.chatKeyDown = function(e) {
  if (e.key === 'Enter') window.sendChat();
};

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// ── Window resize ─────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (gameState) updateBoard(gameState, buildColorMap(), lang);
  else drawBoard(lang);
  if (gameState) renderTokens();
});

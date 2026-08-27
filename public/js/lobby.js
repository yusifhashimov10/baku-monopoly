// lobby.js - Lobby page client logic
const FIGURES = [
  { id: 'uzeyir',  nameAz: 'Üzeyir Hacıbəyov',  nameEn: 'Uzeyir Hajibeyli', emoji: '🎼', desc: 'Bəstəkar', descEn: 'Composer' },
  { id: 'heydar',  nameAz: 'Heydər Əliyev',      nameEn: 'Heydar Aliyev',    emoji: '⭐', desc: 'Siyasətçi', descEn: 'Statesman' },
  { id: 'nizami',  nameAz: 'Nizami Gəncəvi',      nameEn: 'Nizami Ganjavi',   emoji: '📜', desc: 'Şair', descEn: 'Poet' },
  { id: 'musfiq',  nameAz: 'Mikayıl Müşfiq',      nameEn: 'Mikayil Mushfig',  emoji: '🖊️', desc: 'Şair', descEn: 'Poet' },
  { id: 'cavid',   nameAz: 'Hüseyn Cavid',         nameEn: 'Huseyn Javid',     emoji: '📖', desc: 'Dramaturq', descEn: 'Playwright' },
  { id: 'rashid',  nameAz: 'Rəşid Behbudov',      nameEn: 'Rashid Behbudov',  emoji: '🎵', desc: 'Müğənni', descEn: 'Singer' },
  { id: 'khatai',  nameAz: 'Ş.İ. Xətai',          nameEn: 'Shah Khatai',      emoji: '⚔️', desc: 'Hökmdar', descEn: 'Ruler' },
  { id: 'ilhama',  nameAz: 'İlhamə Quliyeva',     nameEn: 'Ilhama Guliyeva',  emoji: '🎻', desc: 'Musiqiçi', descEn: 'Musician' },
  { id: 'lotfi',   nameAz: 'Lotfi Zadeh',          nameEn: 'Lotfi Zadeh',      emoji: '∞',  desc: 'Alim', descEn: 'Scientist' },
];

const COLORS = [
  { id: 'red',    hex: '#E74C3C' }, { id: 'blue',   hex: '#3498DB' },
  { id: 'green',  hex: '#2ECC71' }, { id: 'orange', hex: '#F39C12' },
  { id: 'purple', hex: '#9B59B6' }, { id: 'teal',   hex: '#1ABC9C' },
  { id: 'yellow', hex: '#F1C40F' }, { id: 'pink',   hex: '#EC407A' },
];

let lang = 'az';
let socket = null;
let myPlayerId = null;
let myRoomCode = null;
let myRoomLink = null;
let isHost = false;
let isReady = false;
let selectedFigureCreate = null;
let selectedColorCreate = null;
let selectedFigureJoin = null;
let selectedColorJoin = null;

// ── Init ────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  buildFigureGrids();
  buildColorGrids();
  initSocket();

  // Check if joining via URL param
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  if (roomFromUrl) {
    showTab('join');
    document.getElementById('join-code').value = roomFromUrl;
  }
});

function initSocket() {
  socket = io();

  socket.on('room-update', (room) => {
    renderLobbyPlayers(room.players, room.hostId);
    // Show start button if host and >= 2 players
    if (isHost) {
      const startBtn = document.getElementById('btn-start');
      if (room.players.length >= 2) {
        startBtn.classList.remove('hidden');
      } else {
        startBtn.classList.add('hidden');
      }
    }
  });

  socket.on('game-started', ({ roomCode }) => {
    window.location.href = `/game.html?room=${roomCode}&player=${myPlayerId}`;
  });

  socket.on('player-left', ({ playerName }) => {
    showToast(lang === 'az' ? `${playerName} otaqdan çıxdı` : `${playerName} left the room`, 'info');
  });
}

// ── Language ─────────────────────────────────────────────────────
window.setLang = function(l) {
  lang = l;
  document.querySelectorAll('[data-az]').forEach(el => {
    el.textContent = l === 'az' ? el.dataset.az : el.dataset.en;
  });
  document.getElementById('btn-az').classList.toggle('active', l === 'az');
  document.getElementById('btn-en').classList.toggle('active', l === 'en');
};

// ── Tabs ─────────────────────────────────────────────────────────
window.showTab = function(tab) {
  ['create','join'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`tab-content-${t}`).classList.toggle('active', t === tab);
  });
};

// ── Figure Grids ─────────────────────────────────────────────────
function buildFigureGrids() {
  ['create','join'].forEach(mode => {
    const grid = document.getElementById(`figure-grid-${mode}`);
    grid.innerHTML = '';
    FIGURES.forEach(fig => {
      const card = document.createElement('div');
      card.className = 'figure-card';
      card.dataset.id = fig.id;
      card.innerHTML = `
        <div class="figure-emoji">${fig.emoji}</div>
        <div class="figure-name">${fig.nameAz}</div>
        <div class="figure-desc">${fig.desc}</div>
      `;
      card.onclick = () => selectFigure(mode, fig.id);
      grid.appendChild(card);
    });
  });
}

function selectFigure(mode, id) {
  const grid = document.getElementById(`figure-grid-${mode}`);
  grid.querySelectorAll('.figure-card').forEach(c => c.classList.remove('selected'));
  grid.querySelector(`[data-id="${id}"]`).classList.add('selected');
  if (mode === 'create') selectedFigureCreate = id;
  else selectedFigureJoin = id;
}

// ── Color Grids ──────────────────────────────────────────────────
function buildColorGrids() {
  ['create','join'].forEach(mode => {
    const grid = document.getElementById(`color-grid-${mode}`);
    grid.innerHTML = '';
    COLORS.forEach(col => {
      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.dataset.id = col.id;
      dot.style.background = col.hex;
      dot.title = col.id;
      dot.onclick = () => selectColor(mode, col.id);
      grid.appendChild(dot);
    });
  });
}

function selectColor(mode, id) {
  const grid = document.getElementById(`color-grid-${mode}`);
  grid.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
  grid.querySelector(`[data-id="${id}"]`).classList.add('selected');
  if (mode === 'create') selectedColorCreate = id;
  else selectedColorJoin = id;
}

// ── Create Room ──────────────────────────────────────────────────
window.createRoom = function() {
  const name = document.getElementById('create-name').value.trim();
  if (!name) return showToast(lang === 'az' ? 'Adınızı daxil edin' : 'Please enter your name', 'error');
  if (!selectedFigureCreate) return showToast(lang === 'az' ? 'Fiqur seçin' : 'Please select a figure', 'error');
  if (!selectedColorCreate) return showToast(lang === 'az' ? 'Rəng seçin' : 'Please select a color', 'error');

  const fig = FIGURES.find(f => f.id === selectedFigureCreate);
  socket.emit('create-room', {
    playerName: name,
    nameAz: name,
    nameEn: name,
    figure: selectedFigureCreate,
    color: selectedColorCreate,
  }, (res) => {
    if (!res.success) return showToast(res.error, 'error');
    myPlayerId = res.playerId;
    myRoomCode = res.roomCode;
    myRoomLink = window.location.origin + res.link;
    isHost = true;
    showLobbyRoom(res.roomCode, res.link);
  });
};

// ── Join Room ────────────────────────────────────────────────────
window.joinRoom = function() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim();
  if (!name) return showToast(lang === 'az' ? 'Adınızı daxil edin' : 'Please enter your name', 'error');
  if (code.length !== 6) return showToast(lang === 'az' ? '6 rəqəmli kod daxil edin' : 'Enter 6-digit room code', 'error');
  if (!selectedFigureJoin) return showToast(lang === 'az' ? 'Fiqur seçin' : 'Please select a figure', 'error');
  if (!selectedColorJoin) return showToast(lang === 'az' ? 'Rəng seçin' : 'Please select a color', 'error');

  socket.emit('join-room', {
    roomCode: code,
    playerName: name,
    nameAz: name,
    nameEn: name,
    figure: selectedFigureJoin,
    color: selectedColorJoin,
  }, (res) => {
    if (!res.success) return showToast(res.error, 'error');
    myPlayerId = res.playerId;
    myRoomCode = res.roomCode;
    myRoomLink = window.location.origin + `/game.html?room=${code}`;
    isHost = false;
    showLobbyRoom(code, `/game.html?room=${code}`);
  });
};

function showLobbyRoom(roomCode, link) {
  document.querySelector('.main-panel').classList.add('hidden');
  const lobbyRoom = document.getElementById('lobby-room');
  lobbyRoom.classList.remove('hidden');
  document.getElementById('display-room-code').textContent = roomCode;
  document.getElementById('display-room-link').textContent = window.location.origin + link;

  if (!isHost) {
    document.getElementById('btn-start').classList.add('hidden');
  }
}

function renderLobbyPlayers(players, hostId) {
  const list = document.getElementById('lobby-players-list');
  list.innerHTML = '';
  players.forEach(p => {
    const fig = FIGURES.find(f => f.id === p.figure);
    const col = COLORS.find(c => c.id === p.color);
    const isMe = p.id === myPlayerId;
    const isH = p.id === hostId;
    const div = document.createElement('div');
    div.className = 'lobby-player-item';
    div.innerHTML = `
      <div class="lobby-player-figure" style="border-color:${col?.hex||'#fff'}; background:${col?.hex||'#fff'}20">
        ${fig?.emoji||'👤'}
      </div>
      <div class="lobby-player-info">
        <div class="lobby-player-name">${p.nameAz}${isMe?' (Siz)':''}${isH?' 👑':''}</div>
        <div class="lobby-player-sub">${fig?.nameAz||''} • ${fig?.desc||''}</div>
      </div>
      <div class="lobby-player-status">${p.ready ? '✅' : '⏳'}</div>
    `;
    list.appendChild(div);
  });
}

// ── Ready / Start ─────────────────────────────────────────────────
window.toggleReady = function() {
  isReady = !isReady;
  socket.emit('player-ready', { roomCode: myRoomCode, playerId: myPlayerId });
  const btn = document.getElementById('btn-ready');
  if (isReady) {
    btn.classList.add('ready-active');
    btn.querySelector('span').textContent = lang === 'az' ? '✅ Hazıram' : '✅ Ready';
  } else {
    btn.classList.remove('ready-active');
    btn.querySelector('span').textContent = lang === 'az' ? 'Hazıram' : 'Ready';
  }
};

window.startGame = function() {
  socket.emit('start-game', { roomCode: myRoomCode, playerId: myPlayerId }, (res) => {
    if (res && res.error) showToast(res.error, 'error');
  });
};

// ── Copy helpers ──────────────────────────────────────────────────
window.copyRoomCode = function() {
  navigator.clipboard.writeText(myRoomCode);
  showToast(lang === 'az' ? 'Kod kopyalandı!' : 'Code copied!', 'success');
};

window.copyLink = function() {
  navigator.clipboard.writeText(myRoomLink || '');
  showToast(lang === 'az' ? 'Link kopyalandı!' : 'Link copied!', 'success');
};

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

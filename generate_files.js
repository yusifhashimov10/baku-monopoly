const fs = require('fs');
const path = require('path');

const baseDir = 'd:\\\\Yusif\\\\baku-monopoly';

const dirs = [
    'public/css',
    'public/js',
    'public/assets',
    'game'
];

dirs.forEach(d => {
    fs.mkdirSync(path.join(baseDir, d), { recursive: true });
});

const files = {
    'package.json': `{
  "name": "baku-monopoly",
  "version": "1.0.0",
  "description": "Baku-themed Monopoly game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  }
}`,
    'server.js': `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const rooms = new Map();

io.on('connection', (socket) => {
    socket.on('create-room', (data, callback) => {
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        rooms.set(roomCode, {
            players: [{ id: socket.id, name: data.playerName, isHost: true }],
            state: 'lobby'
        });
        socket.join(roomCode);
        callback({ success: true, roomCode });
    });

    socket.on('join-room', (data, callback) => {
        const room = rooms.get(data.roomCode);
        if (room) {
            room.players.push({ id: socket.id, name: data.playerName, isHost: false });
            socket.join(data.roomCode);
            io.to(data.roomCode).emit('room-update', room);
            callback({ success: true });
        } else {
            callback({ success: false, message: 'Room not found' });
        }
    });

    socket.on('start-game', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room && room.players[0].id === socket.id) {
            room.state = 'playing';
            io.to(roomCode).emit('game-started');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`,
    'game/boardData.js': `module.exports = [
    { id: 0, name: "GO", type: "go", az: "Başlanğıc", price: 0 },
    { id: 1, name: "Zabrat", type: "property", color: "brown", price: 60, rent: 2, icon: "🏭" },
    { id: 2, name: "Community Chest", type: "chest", az: "Xəzinə" },
    { id: 3, name: "Balaxanı", type: "property", color: "brown", price: 80, rent: 4, icon: "🏭" },
    { id: 4, name: "Tax", type: "tax", az: "Gəlir Vergisi", amount: 200 },
    { id: 5, name: "Airport", type: "transport", az: "Hava Limanı", price: 200 },
    { id: 6, name: "Binəqədi", type: "property", color: "lightblue", price: 100, rent: 6, icon: "🕌" },
    { id: 7, name: "Chance", type: "chance", az: "Şans" },
    { id: 8, name: "Suraxanı", type: "property", color: "lightblue", price: 100, rent: 6, icon: "🔥" },
    { id: 9, name: "Maştağa", type: "property", color: "lightblue", price: 120, rent: 8, icon: "🏘" },
    { id: 10, name: "Jail", type: "jail", az: "Həbs" },
    { id: 11, name: "Sabunçu", type: "property", color: "pink", price: 140, rent: 10, icon: "🏗" },
    { id: 12, name: "Electric Company", type: "utility", az: "Elektrik", price: 150 },
    { id: 13, name: "Lökbatan", type: "property", color: "pink", price: 140, rent: 10, icon: "🌋" },
    { id: 14, name: "Ramana", type: "property", color: "pink", price: 160, rent: 12, icon: "🏰" },
    { id: 15, name: "Railway", type: "transport", az: "Dəmiryolu", price: 200 },
    { id: 16, name: "Nardaran", type: "property", color: "orange", price: 180, rent: 14, icon: "🏰" },
    { id: 17, name: "Community Chest", type: "chest", az: "Xəzinə" },
    { id: 18, name: "Novxanı", type: "property", color: "orange", price: 180, rent: 14, icon: "🌿" },
    { id: 19, name: "Bilgəh", type: "property", color: "orange", price: 200, rent: 16, icon: "🏖" },
    { id: 20, name: "Free Parking", type: "parking", az: "Pulsuz Park" },
    { id: 21, name: "Buzovna", type: "property", color: "red", price: 220, rent: 18, icon: "🏖" },
    { id: 22, name: "Chance", type: "chance", az: "Şans" },
    { id: 23, name: "Növbəgün", type: "property", color: "red", price: 220, rent: 18, icon: "🌲" },
    { id: 24, name: "Balacədir", type: "property", color: "red", price: 240, rent: 20, icon: "🌿" },
    { id: 25, name: "Bus Station", type: "transport", az: "Avtovağzal", price: 200 },
    { id: 26, name: "Xətai", type: "property", color: "yellow", price: 260, rent: 22, icon: "🏛" },
    { id: 27, name: "Binə", type: "property", color: "yellow", price: 260, rent: 22, icon: "✈" },
    { id: 28, name: "Water Works", type: "utility", az: "Su", price: 150 },
    { id: 29, name: "Nərimanov", type: "property", color: "yellow", price: 280, rent: 24, icon: "🏟" },
    { id: 30, name: "Go to Jail", type: "gotojail", az: "Həbsə Get" },
    { id: 31, name: "Nizami", type: "property", color: "green", price: 300, rent: 26, icon: "🛍" },
    { id: 32, name: "Yasamal", type: "property", color: "green", price: 300, rent: 26, icon: "🏙" },
    { id: 33, name: "Community Chest", type: "chest", az: "Xəzinə" },
    { id: 34, name: "Nəsimi", type: "property", color: "green", price: 320, rent: 28, icon: "🕌" },
    { id: 35, name: "Sea Port", type: "transport", az: "Dəniz Limanı", price: 200 },
    { id: 36, name: "Chance", type: "chance", az: "Şans" },
    { id: 37, name: "Şirvan", type: "property", color: "darkblue", price: 350, rent: 35, icon: "🏰" },
    { id: 38, name: "Luxury Tax", type: "tax", az: "Əmlak Vergisi", amount: 100 },
    { id: 39, name: "İçərişəhər", type: "property", color: "darkblue", price: 400, rent: 50, icon: "🔥" }
];`,
    'public/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Baku Monopoly</title>
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
    <div class="lobby-container">
        <h1>Baku Monopoly</h1>
        <div id="auth-screen">
            <input type="text" id="player-name" placeholder="Enter your name">
            <button onclick="createRoom()">Create Room</button>
            <hr>
            <input type="text" id="room-code" placeholder="Room Code">
            <button onclick="joinRoom()">Join Room</button>
        </div>
        <div id="room-screen" style="display: none;">
            <h2>Room: <span id="display-room-code"></span></h2>
            <ul id="player-list"></ul>
            <button id="start-btn" style="display: none;" onclick="startGame()">Start Game</button>
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/lobby.js"></script>
</body>
</html>`,
    'public/game.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Baku Monopoly - Game</title>
    <link rel="stylesheet" href="/css/game.css">
</head>
<body>
    <div id="game-container">
        <div id="board"></div>
        <div id="ui-panel">
            <h2>Baku Monopoly</h2>
            <div id="players-info"></div>
            <div id="actions">
                <button id="roll-dice">Roll Dice</button>
            </div>
            <div id="log"></div>
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/game.js"></script>
</body>
</html>`,
    'public/css/main.css': `body { background: #1a1a1a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.lobby-container { background: #333; padding: 2rem; border-radius: 8px; text-align: center; }
input, button { margin: 10px; padding: 10px; }`,
    'public/css/game.css': `body { background: #1a1a1a; color: white; font-family: sans-serif; margin: 0; }
#game-container { display: flex; height: 100vh; }
#board { flex: 1; border: 1px solid #555; background: #2a2a2a; }
#ui-panel { width: 300px; padding: 20px; background: #333; overflow-y: auto; }`,
    'public/js/lobby.js': `const socket = io();
function createRoom() {
    const name = document.getElementById('player-name').value;
    socket.emit('create-room', { playerName: name }, (res) => {
        if(res.success) showRoom(res.roomCode, true);
    });
}
function joinRoom() {
    const name = document.getElementById('player-name').value;
    const code = document.getElementById('room-code').value;
    socket.emit('join-room', { playerName: name, roomCode: code }, (res) => {
        if(res.success) showRoom(code, false);
    });
}
function showRoom(code, isHost) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('room-screen').style.display = 'block';
    document.getElementById('display-room-code').innerText = code;
    if(isHost) document.getElementById('start-btn').style.display = 'block';
}
socket.on('room-update', (room) => {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    room.players.forEach(p => {
        const li = document.createElement('li');
        li.innerText = p.name;
        list.appendChild(li);
    });
});
function startGame() {
    socket.emit('start-game', document.getElementById('display-room-code').innerText);
}
socket.on('game-started', () => {
    window.location.href = '/game.html';
});`,
    'public/js/game.js': `console.log('Game UI Initialized');
const socket = io();`,
    'game/cardData.js': `module.exports = { chance: [], communityChest: [] };`,
    'game/gameEngine.js': `module.exports = {};`,
    'game/playerColors.js': `module.exports = {};`,
    'public/js/board.js': `console.log('Board renderer initialized');`,
    'public/js/dice.js': `console.log('Dice initialized');`,
    'public/js/cards.js': `console.log('Cards initialized');`,
    'public/js/trade.js': `console.log('Trade UI initialized');`,
    'public/js/auction.js': `console.log('Auction UI initialized');`,
    'public/admin.html': `<!DOCTYPE html><html><head><title>Admin</title></head><body><h1>Admin Panel</h1></body></html>`
};

for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('All files generated successfully.');

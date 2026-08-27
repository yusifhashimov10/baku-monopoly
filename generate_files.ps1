$dir = "d:\Yusif\baku-monopoly"
New-Item -ItemType Directory -Force -Path $dir\public\css
New-Item -ItemType Directory -Force -Path $dir\public\js
New-Item -ItemType Directory -Force -Path $dir\public\assets
New-Item -ItemType Directory -Force -Path $dir\game

Set-Content -Path $dir\public\index.html -Value @"
<!DOCTYPE html>
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
</html>
"@

Set-Content -Path $dir\public\game.html -Value @"
<!DOCTYPE html>
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
</html>
"@

Set-Content -Path $dir\public\css\main.css -Value @"
body { background: #1a1a1a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.lobby-container { background: #333; padding: 2rem; border-radius: 8px; text-align: center; }
input, button { margin: 10px; padding: 10px; }
"@

Set-Content -Path $dir\public\css\game.css -Value @"
body { background: #1a1a1a; color: white; font-family: sans-serif; margin: 0; }
#game-container { display: flex; height: 100vh; }
#board { flex: 1; border: 1px solid #555; background: #2a2a2a; }
#ui-panel { width: 300px; padding: 20px; background: #333; overflow-y: auto; }
"@

Set-Content -Path $dir\public\js\lobby.js -Value @"
const socket = io();
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
});
"@

Set-Content -Path $dir\public\js\game.js -Value @"
console.log('Game UI Initialized');
const socket = io();
"@

Set-Content -Path $dir\game\cardData.js -Value @"
module.exports = { chance: [], communityChest: [] };
"@

Set-Content -Path $dir\game\gameEngine.js -Value @"
module.exports = {};
"@

Set-Content -Path $dir\game\playerColors.js -Value @"
module.exports = {};
"@

Set-Content -Path $dir\public\js\board.js -Value @"
console.log('Board renderer initialized');
"@

Set-Content -Path $dir\public\js\dice.js -Value @"
console.log('Dice initialized');
"@

Set-Content -Path $dir\public\js\cards.js -Value @"
console.log('Cards initialized');
"@

Set-Content -Path $dir\public\js\trade.js -Value @"
console.log('Trade UI initialized');
"@

Set-Content -Path $dir\public\js\auction.js -Value @"
console.log('Auction UI initialized');
"@

Set-Content -Path $dir\public\admin.html -Value @"
<!DOCTYPE html>
<html>
<head><title>Admin</title></head>
<body><h1>Admin Panel</h1></body>
</html>
"@

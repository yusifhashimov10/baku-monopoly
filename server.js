// server.js - Baku Monopoly Server (Express + Socket.IO)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GameEngine = require('./game/gameEngine');
const boardData = require('./game/boardData');
const cardData = require('./game/cardData');
const playerColors = require('./game/playerColors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── In-memory store ─────────────────────────────────────────────────────────
// rooms: Map<roomCode, { players[], state: 'lobby'|'starting'|'playing', game: GameEngine|null, hostId }>
const rooms = new Map();
// socketToRoom: Map<socketId, { roomCode, playerId }>
const socketToRoom = new Map();

function generateRoomCode() {
  let code;
  do { code = Math.floor(100000 + Math.random() * 900000).toString(); }
  while (rooms.has(code));
  return code;
}

function broadcastRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('room-update', {
    roomCode,
    players: room.players,
    state: room.state,
    hostId: room.hostId,
  });
}

function broadcastGameState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) return;
  io.to(roomCode).emit('game-state', room.game.getState());
}

// ── REST: Board data ─────────────────────────────────────────────────────────
app.get('/api/board', (req, res) => res.json(boardData));
app.get('/api/figures', (req, res) => res.json(playerColors.figures));
app.get('/api/colors', (req, res) => res.json(playerColors.colors));

// ── REST: Admin card management ───────────────────────────────────────────────
const ADMIN_PASS = 'baku2024';

app.get('/api/admin/cards', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ chance: cardData.chance, community: cardData.community });
});

app.post('/api/admin/cards/:type', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const { type } = req.params;
  const card = { id: uuidv4(), ...req.body };
  if (type === 'chance') cardData.chance.push(card);
  else if (type === 'community') cardData.community.push(card);
  else return res.status(400).json({ error: 'Invalid type' });
  // Update all running games
  for (const [, room] of rooms) {
    if (room.game) room.game.addCard(type, card);
  }
  res.json({ added: true, card });
});

app.put('/api/admin/cards/:type/:id', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const { type, id } = req.params;
  const arr = type === 'chance' ? cardData.chance : cardData.community;
  const idx = arr.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Card not found' });
  arr[idx] = { ...arr[idx], ...req.body };
  for (const [, room] of rooms) {
    if (room.game) room.game.updateCard(type, id, req.body);
  }
  res.json({ updated: true, card: arr[idx] });
});

app.delete('/api/admin/cards/:type/:id', (req, res) => {
  if (req.headers['x-admin-pass'] !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const { type, id } = req.params;
  if (type === 'chance') cardData.chance = cardData.chance.filter(c => c.id !== id);
  else cardData.community = cardData.community.filter(c => c.id !== id);
  for (const [, room] of rooms) {
    if (room.game) room.game.removeCard(type, id);
  }
  res.json({ removed: true });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // REJOIN GAME - critical: game page opens a NEW socket, must re-join room
  socket.on('rejoin-game', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room) return cb && cb({ error: 'Otaq tapılmadı' });

    // Update player's socketId to the new connection
    const player = room.players.find(p => p.id === playerId);
    if (player) player.socketId = socket.id;

    socketToRoom.set(socket.id, { roomCode, playerId });
    socket.join(roomCode);

    // Immediately send current game state to this socket
    if (room.game) {
      socket.emit('game-state', room.game.getState());
    }

    cb && cb({ success: true });
    console.log(`[↩] Player ${playerId.slice(0,8)} rejoined room ${roomCode}`);
  });

  // CREATE ROOM
  socket.on('create-room', ({ playerName, nameAz, nameEn, figure, color }, cb) => {
    const roomCode = generateRoomCode();
    const playerId = uuidv4();
    const player = {
      id: playerId,
      socketId: socket.id,
      nameAz: nameAz || playerName,
      nameEn: nameEn || playerName,
      figure,
      color,
      isHost: true,
      ready: false,
    };
    rooms.set(roomCode, {
      players: [player],
      state: 'lobby',
      game: null,
      hostId: playerId,
    });
    socketToRoom.set(socket.id, { roomCode, playerId });
    socket.join(roomCode);
    cb({ success: true, roomCode, playerId, link: `/game.html?room=${roomCode}` });
    broadcastRoom(roomCode);
  });

  // JOIN ROOM
  socket.on('join-room', ({ roomCode, playerName, nameAz, nameEn, figure, color }, cb) => {
    const room = rooms.get(roomCode);
    if (!room) return cb({ success: false, error: 'Otaq tapılmadı / Room not found' });
    if (room.state !== 'lobby') return cb({ success: false, error: 'Oyun artıq başlayıb / Game already started' });
    if (room.players.length >= 8) return cb({ success: false, error: 'Otaq dolu / Room is full' });

    const playerId = uuidv4();
    const player = {
      id: playerId,
      socketId: socket.id,
      nameAz: nameAz || playerName,
      nameEn: nameEn || playerName,
      figure,
      color,
      isHost: false,
      ready: false,
    };
    room.players.push(player);
    socketToRoom.set(socket.id, { roomCode, playerId });
    socket.join(roomCode);
    cb({ success: true, roomCode, playerId });
    broadcastRoom(roomCode);
  });

  // PLAYER READY
  socket.on('player-ready', ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const p = room.players.find(x => x.id === playerId);
    if (p) { p.ready = !p.ready; broadcastRoom(roomCode); }
  });

  // START GAME
  socket.on('start-game', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room) return cb && cb({ error: 'No room' });
    if (room.hostId !== playerId) return cb && cb({ error: 'Not host' });
    if (room.players.length < 2) return cb && cb({ error: 'Need at least 2 players' });

    room.game = new GameEngine(roomCode, room.players);
    room.state = 'starting';
    io.to(roomCode).emit('game-started', { roomCode });
    broadcastGameState(roomCode);
    cb && cb({ success: true });
  });

  // ROLL FOR START ORDER
  socket.on('roll-for-start', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return cb && cb({ error: 'Oyun tapılmadı' });
    const result = room.game.rollForStart(playerId);
    if (!result) return cb && cb({ error: 'Artıq zər atmısınız' });

    // Always broadcast so all players see the updated rolls
    broadcastGameState(roomCode);
    io.to(roomCode).emit('start-roll-result', { playerId, result });

    if (result.type === 'ordered') {
      room.state = 'playing';
    } else if (result.type === 'tie') {
      io.to(roomCode).emit('start-tie', result);
    }
    cb && cb({ success: true, result });
  });

  // ROLL FOR START TIE
  socket.on('roll-for-start-tie', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return cb && cb({ error: 'Oyun tapılmadı' });
    const result = room.game.rollForStartTie(playerId);
    if (!result) return cb && cb({ error: 'Artıq zər atmısınız' });

    // Always broadcast so all players see tie re-rolls
    broadcastGameState(roomCode);
    io.to(roomCode).emit('start-roll-result', { playerId, result });

    if (result && result.type === 'ordered') {
      room.state = 'playing';
    }
    cb && cb({ success: true, result });
  });

  // ROLL DICE
  socket.on('roll-dice', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.rollDice(playerId);
    if (result.error) return cb && cb(result);
    io.to(roomCode).emit('dice-rolled', { playerId, dice: result.dice, doubles: result.doubles });
    broadcastGameState(roomCode);
    cb && cb({ success: true, result });
  });

  // BUY PROPERTY
  socket.on('buy-property', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.buyProperty(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // DECLINE BUY (triggers auction)
  socket.on('decline-buy', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.declineBuy(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // PLACE AUCTION BID
  socket.on('place-bid', ({ roomCode, playerId, amount }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.placeBid(playerId, amount);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // PASS AUCTION
  socket.on('pass-auction', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.passAuction(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // EXECUTE CARD
  socket.on('execute-card', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.executeCard(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // PAY JAIL
  socket.on('pay-jail', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.payJail(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // USE JAIL CARD
  socket.on('use-jail-card', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.useJailCard(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // BUILD HOUSE
  socket.on('build-house', ({ roomCode, playerId, squareId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.buildHouse(playerId, squareId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // SELL HOUSE
  socket.on('sell-house', ({ roomCode, playerId, squareId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.sellHouse(playerId, squareId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // MORTGAGE
  socket.on('mortgage', ({ roomCode, playerId, squareId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.mortgage(playerId, squareId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  socket.on('unmortgage', ({ roomCode, playerId, squareId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.unmortgage(playerId, squareId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // TRANSPORT TELEPORT
  socket.on('teleport-transport', ({ roomCode, playerId, targetSquareId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.teleportTransport(playerId, targetSquareId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  socket.on('skip-teleport', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.skipTeleport(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // INITIATE TRADE
  socket.on('initiate-trade', ({ roomCode, fromId, toId, fromOffer, toOffer }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.initiateTrade(fromId, toId, { fromOffer, toOffer });
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // RESPOND TRADE
  socket.on('respond-trade', ({ roomCode, playerId, accepted }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.respondTrade(playerId, accepted);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // CANCEL TRADE
  socket.on('cancel-trade', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.cancelTrade(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // END TURN
  socket.on('end-turn', ({ roomCode, playerId }, cb) => {
    const room = rooms.get(roomCode);
    if (!room || !room.game) return;
    const result = room.game.endTurn(playerId);
    broadcastGameState(roomCode);
    cb && cb(result);
  });

  // CHAT MESSAGE
  socket.on('chat-message', ({ roomCode, playerId, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    io.to(roomCode).emit('chat-message', {
      playerId, playerName: player.nameAz, message, time: Date.now()
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const roomInfo = socketToRoom.get(socket.id);
    if (roomInfo) {
      const { roomCode, playerId } = roomInfo;
      const room = rooms.get(roomCode);
      if (room) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          io.to(roomCode).emit('player-left', { playerId, playerName: player.nameAz });
        }
        if (room.state === 'lobby') {
          room.players = room.players.filter(p => p.id !== playerId);
          if (room.players.length === 0) {
            rooms.delete(roomCode);
          } else {
            if (room.hostId === playerId) {
              room.hostId = room.players[0].id;
              room.players[0].isHost = true;
            }
            broadcastRoom(roomCode);
          }
        }
      }
      socketToRoom.delete(socket.id);
    }
    console.log(`[-] Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎲 Bakı Monopoly Server işləyir: http://localhost:${PORT}`);
  console.log(`📋 Admin panel: http://localhost:${PORT}/admin.html`);
});

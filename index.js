const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, '../public')));

// ─── In-memory lobby store ───────────────────────────────────────────────────
// lobby: { id, hostId, players: [{ id, name, race, score, ready }], state, gameType }
const lobbies = new Map();

function getLobby(lobbyId) { return lobbies.get(lobbyId); }

function broadcastLobby(lobbyId) {
  const lobby = getLobby(lobbyId);
  if (!lobby) return;
  io.to(lobbyId).emit('lobby:update', lobby);
}

function calcAvgScore(players) {
  const scores = players.map(p => p.score ?? 0);
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

// ─── Socket events ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Create a new lobby
  socket.on('lobby:create', ({ playerName, race, gameType }) => {
    const lobbyId = uuidv4().slice(0, 6).toUpperCase();
    const player = { id: socket.id, name: playerName, race, score: null, ready: false };
    const lobby = { id: lobbyId, hostId: socket.id, players: [player], state: 'waiting', gameType };
    lobbies.set(lobbyId, lobby);
    socket.join(lobbyId);
    socket.data.lobbyId = lobbyId;
    socket.emit('lobby:created', { lobbyId });
    broadcastLobby(lobbyId);
  });

  // Join existing lobby
  socket.on('lobby:join', ({ lobbyId, playerName, race }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) { socket.emit('lobby:error', 'Lobby not found'); return; }
    if (lobby.state !== 'waiting') { socket.emit('lobby:error', 'Game already started'); return; }
    if (lobby.players.length >= 4) { socket.emit('lobby:error', 'Lobby full (max 4)'); return; }
    const player = { id: socket.id, name: playerName, race, score: null, ready: false };
    lobby.players.push(player);
    socket.join(lobbyId);
    socket.data.lobbyId = lobbyId;
    socket.emit('lobby:joined', { lobbyId });
    broadcastLobby(lobbyId);
  });

  // Host starts the game
  socket.on('game:start', ({ lobbyId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby || lobby.hostId !== socket.id) return;
    lobby.state = 'playing';
    lobby.players.forEach(p => { p.score = null; });
    io.to(lobbyId).emit('game:begin', { gameType: lobby.gameType });
    broadcastLobby(lobbyId);
  });

  // Player submits score
  socket.on('game:score', ({ lobbyId, score }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (player) player.score = score;

    io.to(lobbyId).emit('game:player-scored', { playerId: socket.id, name: player?.name });

    const allDone = lobby.players.every(p => p.score !== null);
    if (allDone) {
      const avg = calcAvgScore(lobby.players);
      const coins = Math.round(avg * 0.1); // 10% of score as coins
      lobby.state = 'results';
      io.to(lobbyId).emit('game:results', {
        players: lobby.players,
        avgScore: avg,
        coinsEarned: coins
      });
      broadcastLobby(lobbyId);
    }
  });

  // Return to lobby after results
  socket.on('lobby:reset', ({ lobbyId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby || lobby.hostId !== socket.id) return;
    lobby.state = 'waiting';
    lobby.players.forEach(p => { p.score = null; });
    broadcastLobby(lobbyId);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const lobbyId = socket.data.lobbyId;
    if (!lobbyId) return;
    const lobby = getLobby(lobbyId);
    if (!lobby) return;
    lobby.players = lobby.players.filter(p => p.id !== socket.id);
    if (lobby.players.length === 0) {
      lobbies.delete(lobbyId);
      return;
    }
    if (lobby.hostId === socket.id) lobby.hostId = lobby.players[0].id;
    broadcastLobby(lobbyId);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Tamagotchi server running on :${PORT}`));

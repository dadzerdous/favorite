// Lobby module — create/join lobbies, sync minigames, display results
import { showToast } from './ui.js';
import { petState } from './petState.js';

export class LobbyManager {
  constructor(socket, race, playerName) {
    this.socket = socket;
    this.race = race;
    this.playerName = playerName;
    this.lobbyId = null;
    this.isHost = false;
    this.currentLobby = null;
    this.onGameStart = null; // callback(gameType)
    this.onGameResults = null; // callback(results)

    this._init();
  }

  _init() {
    const s = this.socket;

    s.on('lobby:created', ({ lobbyId }) => {
      this.lobbyId = lobbyId;
      this.isHost = true;
      this._showRoom();
    });

    s.on('lobby:joined', ({ lobbyId }) => {
      this.lobbyId = lobbyId;
      this.isHost = false;
      this._showRoom();
    });

    s.on('lobby:error', (msg) => {
      showToast(`⚠ ${msg}`);
    });

    s.on('lobby:update', (lobby) => {
      this.currentLobby = lobby;
      this._renderPlayerList(lobby);
      const startBtn = document.getElementById('btn-lobby-start');
      if (startBtn) {
        if (this.isHost && lobby.players.length >= 1) {
          startBtn.classList.remove('hidden');
        } else {
          startBtn.classList.add('hidden');
        }
      }
    });

    s.on('game:begin', ({ gameType }) => {
      // Close lobby modal and launch minigame
      document.getElementById('modal-lobby').classList.add('hidden');
      this.onGameStart?.(gameType);
    });

    s.on('game:player-scored', ({ name }) => {
      const statusEl = document.getElementById('lobby-status');
      if (statusEl) statusEl.textContent = `${name} finished!`;
    });

    s.on('game:results', ({ players, avgScore, coinsEarned }) => {
      this._showResults(players, avgScore, coinsEarned);
      // Award coins to local player
      petState.adjust('coins', coinsEarned);
      petState.adjust('xp', Math.round(avgScore / 10));
      this.onGameResults?.({ players, avgScore, coinsEarned });
    });

    // Button bindings
    document.getElementById('btn-create-lobby').onclick = () => this._createLobby();
    document.getElementById('btn-join-lobby').onclick = () => this._joinLobby();
    document.getElementById('btn-lobby-start').onclick = () => this._startGame();
    document.getElementById('btn-lobby-leave').onclick = () => this._leaveLobby();
    document.getElementById('btn-copy-code').onclick = () => {
      if (this.lobbyId) {
        navigator.clipboard.writeText(this.lobbyId).then(() => showToast('Code copied! 📋'));
      }
    };
    document.getElementById('btn-results-close').onclick = () => {
      document.getElementById('modal-lobby').classList.add('hidden');
    };
    document.getElementById('btn-results-lobby').onclick = () => {
      if (this.isHost) {
        this.socket.emit('lobby:reset', { lobbyId: this.lobbyId });
      }
      document.getElementById('lobby-results').classList.add('hidden');
      document.getElementById('lobby-room').classList.remove('hidden');
    };
    document.getElementById('lobby-close-btn').onclick = () => {
      document.getElementById('modal-lobby').classList.add('hidden');
    };
    document.getElementById('join-code').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  open() {
    document.getElementById('modal-lobby').classList.remove('hidden');
    if (this.lobbyId) {
      this._showRoom();
    } else {
      document.getElementById('lobby-setup').classList.remove('hidden');
      document.getElementById('lobby-room').classList.add('hidden');
      document.getElementById('lobby-results').classList.add('hidden');
    }
  }

  _createLobby() {
    const gameType = document.getElementById('lobby-game-type').value;
    this.socket.emit('lobby:create', { playerName: this.playerName, race: this.race, gameType });
  }

  _joinLobby() {
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (!code) { showToast('Enter a lobby code'); return; }
    this.socket.emit('lobby:join', { lobbyId: code, playerName: this.playerName, race: this.race });
  }

  _startGame() {
    if (!this.lobbyId) return;
    this.socket.emit('game:start', { lobbyId: this.lobbyId });
  }

  _leaveLobby() {
    this.lobbyId = null;
    this.isHost = false;
    this.currentLobby = null;
    document.getElementById('lobby-room').classList.add('hidden');
    document.getElementById('lobby-setup').classList.remove('hidden');
    // Disconnect and reconnect to shed the room
    this.socket.disconnect();
    this.socket.connect();
  }

  submitScore(score) {
    if (!this.lobbyId) return;
    this.socket.emit('game:score', { lobbyId: this.lobbyId, score });
  }

  _showRoom() {
    document.getElementById('lobby-setup').classList.add('hidden');
    document.getElementById('lobby-results').classList.add('hidden');
    document.getElementById('lobby-room').classList.remove('hidden');
    document.getElementById('lobby-code-show').textContent = this.lobbyId;
  }

  _renderPlayerList(lobby) {
    const list = document.getElementById('lobby-player-list');
    if (!list) return;
    const raceEmoji = { goblin: '👺', human: '🧑', elf: '🧝' };
    list.innerHTML = lobby.players.map(p => `
      <div class="player-entry">
        <span>${raceEmoji[p.race] ?? '🧑'}</span>
        <span>${p.name}</span>
        ${p.id === lobby.hostId ? '<span class="host-badge">👑 Host</span>' : ''}
      </div>
    `).join('');

    const count = lobby.players.length;
    const statusEl = document.getElementById('lobby-status');
    if (statusEl) {
      statusEl.textContent = lobby.state === 'playing'
        ? '🎮 Game in progress...'
        : `${count} player${count !== 1 ? 's' : ''} in lobby`;
    }
  }

  _showResults(players, avgScore, coinsEarned) {
    document.getElementById('modal-lobby').classList.remove('hidden');
    document.getElementById('lobby-room').classList.add('hidden');
    document.getElementById('lobby-setup').classList.add('hidden');
    document.getElementById('lobby-results').classList.remove('hidden');

    const raceEmoji = { goblin: '👺', human: '🧑', elf: '🧝' };
    const list = document.getElementById('results-list');
    const sorted = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const medals = ['🥇','🥈','🥉'];
    list.innerHTML = sorted.map((p, i) => `
      <div class="result-entry">
        <span>${medals[i] ?? '  '} ${raceEmoji[p.race] ?? ''} ${p.name}</span>
        <span class="score-val">${p.score ?? 0} pts</span>
      </div>
    `).join('');

    document.getElementById('reward-banner').textContent =
      `🏆 Group avg: ${avgScore} pts — Everyone earned +${coinsEarned} 💰 & +${Math.round(avgScore / 10)} XP!`;

    const backBtn = document.getElementById('btn-results-lobby');
    if (this.isHost) backBtn.classList.remove('hidden');
    else backBtn.classList.add('hidden');
  }
}

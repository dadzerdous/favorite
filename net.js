// net.js
const WS_URL = "wss://gyrorunner-server.onrender.com";

let ws = null;
export let remotePlayers = {};
export let remoteEnemies = [];
export let portal = null;
export let serverPhase = 'WAVE';
export let myId = null;

export function connectNet() {
    if (ws) ws.close();
    ws = new WebSocket(WS_URL);

    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "welcome") {
            myId = msg.id;
            window._myId = msg.id;
        }
        if (msg.type === "state") {
            remotePlayers = msg.players;
            remoteEnemies = msg.enemies || [];
            portal = msg.portal;
            serverPhase = msg.phase || 'WAVE';
        }
    };
}

export function isConnected() {
    return ws && ws.readyState === 1;
}

export function disconnectNet() {
    if (ws) { ws.close(); ws = null; }
    remotePlayers = {};
    remoteEnemies = [];
    portal = null;
}

export function sendMove(x, y) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "move", x, y }));
}

export function sendHit(enemyId, damage) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "hit", enemyId, damage }));
}

export function sendReady(status) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "playerReady", status }));
}

export function sendProfile(avatar, className, heroName) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "profile", avatar, className, heroName }));
}

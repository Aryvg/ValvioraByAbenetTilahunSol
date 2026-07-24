import { getAccessToken } from "./auth.js";

const HEARTBEAT_URL = "https://valviorabackend2.onrender.com/registered/presence/heartbeat";
const OFFLINE_URL = "https://valviorabackend2.onrender.com/registered/presence/offline";
const HEARTBEAT_INTERVAL_MS = 15000;

let cachedToken = null;

async function sendHeartbeat() {
    try {
        const token = await getAccessToken();
        if (!token) return;
        cachedToken = token;
        await fetch(HEARTBEAT_URL, {
            method: "POST",
            credentials: "include",
            headers: { Authorization: "Bearer " + token }
        });
    } catch (err) {
        console.error("Presence heartbeat failed", err);
    }
}

function sendOfflineSignal() {
    if (!cachedToken) return;
    fetch(OFFLINE_URL, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { Authorization: "Bearer " + cachedToken }
    });
}

export function initPresence() {
    sendHeartbeat();
    setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("pagehide", sendOfflineSignal);
}

// Simple in-memory token storage. Not persisted to disk or storage.
let _accessToken = null;

export function setAccessToken(token) {
    _accessToken = token || null;
}

export function getAccessToken() {
    return _accessToken;
}

export function clearAccessToken() {
    _accessToken = null;
}

export default { setAccessToken, getAccessToken, clearAccessToken };

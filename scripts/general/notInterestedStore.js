import { getAccessToken } from '../auth.js';

let cachedIds = null;

export async function getNotInterestedIds() {
    if (cachedIds) return cachedIds;
    try {
        const token = await getAccessToken(true);
        const headers = token ? { Authorization: 'Bearer ' + token } : {};
        const res = await fetch('https://valviorabackend2.onrender.com/notInterestedApi', { headers, credentials: 'include' });
        if (!res.ok) {
            cachedIds = new Set();
            return cachedIds;
        }
        const data = await res.json();
        cachedIds = new Set((data.notInterested || []).map(i => i.contentId));
    } catch (e) {
        console.warn('getNotInterestedIds error:', e);
        cachedIds = new Set();
    }
    return cachedIds;
}

export function markIdNotInterestedLocally(contentId) {
    if (!cachedIds) cachedIds = new Set();
    cachedIds.add(contentId);
}

export async function postNotInterested(contentId, token) {
    const freshToken = token || await getAccessToken(true);
    const headers = { 'Content-Type': 'application/json', ...(freshToken ? { Authorization: 'Bearer ' + freshToken } : {}) };
    const res = await fetch('https://valviorabackend2.onrender.com/notInterestedApi', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ contentId })
    });
    if (res.ok) markIdNotInterestedLocally(contentId);
    return res.ok;
}

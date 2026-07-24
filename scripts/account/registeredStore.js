import { getAccessToken } from '../auth.js';

const REGISTERED_URL = 'https://valviorabackend2.onrender.com/registered';

let cachedProfile = null;
let inFlight = null;

export async function fetchMyRegistered(forceRefresh = false) {
    if (cachedProfile && !forceRefresh) return cachedProfile;
    if (inFlight && !forceRefresh) return inFlight;

    inFlight = (async () => {
        try {
            const token = await getAccessToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await fetch(`${REGISTERED_URL}/me`, { credentials: 'include', headers });

            if (!response.ok) {
                cachedProfile = null;
                return null;
            }

            const data = await response.json();
            cachedProfile = data || null;
            return cachedProfile;
        } catch (error) {
            console.warn('Failed to load account profile', error);
            cachedProfile = null;
            return null;
        } finally {
            inFlight = null;
        }
    })();

    return inFlight;
}

export async function deleteMyAccount() {
    const profile = cachedProfile || await fetchMyRegistered();
    const token = await getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${REGISTERED_URL}/me`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
        body: JSON.stringify({ UserId: profile?.UserId || null })
    });

    return response.ok;
}

export function clearRegisteredCache() {
    cachedProfile = null;
}

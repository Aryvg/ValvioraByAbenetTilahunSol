// auth.js - Shared module for managing access token in memory
let accessToken = null;

export async function getAccessToken() {
    if (accessToken) return accessToken;

    try {
        const response = await fetch('https://valviorabackend2.onrender.com/refresh', { credentials: 'include' });// means we send refreshToken to the backend since we have logged in and in response, it sends us accessToken
        if (response.ok) {
            const data = await response.json();
            accessToken = data?.accessToken || null;
            return accessToken;
        }
    } catch (error) {
        console.warn('Refresh failed, no access token available', error);
    }

    return null;
}

export function clearAccessToken() {
    accessToken = null;
}
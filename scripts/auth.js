// auth.js - Shared module for managing access token in memory
const ADMIN_ROLE_VALUE = 5150;
let accessToken = null;

export async function getAccessToken(forceRefresh = false) {
    if (!forceRefresh && accessToken) return accessToken;

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

function decodeJwtPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

export async function isCurrentUserAdmin() {
    try {
        const token = await getAccessToken();
        if (!token) return false;
        const payload = decodeJwtPayload(token);
        const info = payload && (payload.UserInfo || payload.userInfo);
        const roles = info && info.roles;
        return Array.isArray(roles) && roles.includes(ADMIN_ROLE_VALUE);
    } catch (e) {
        return false;
    }
}

export async function applyAdminNavVisibility() {
    const link = document.getElementById('adminSidebarLink');
    if (!link) return;
    const admin = await isCurrentUserAdmin();
    link.classList.toggle('is-visible', admin === true);
}
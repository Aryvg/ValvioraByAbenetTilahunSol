// checkAuthOnLoad.js
// Purpose: When the signup/login page opens, try to refresh the session.
// If the user already has a valid session, send them to the protected page.
// Simple English: "If you're already logged in, go to the main app page without signing up or logging in." 

export async function checkAuthOnLoad() {
    try {
            // If this tab was just redirected here due to a logout action,
            // don't auto-refresh/auth-check — the user intentionally signed out.
            try {
                if (sessionStorage.getItem('loggedOut')) {
                    sessionStorage.removeItem('loggedOut');
                    return;
                }
            } catch (e) {
                // ignore storage access errors and continue
            }
        const res = await fetch('https://valviorabackend2.onrender.com/refresh', {
            method: 'GET',
            credentials: 'include'
        });
        if (res.ok) {
            // we have a valid session — go to the protected page.
            // Prefer a post-login redirect if one was set (e.g. user clicked Sign in),
            // but avoid redirecting the page to itself (index -> index).
            try {
                const target = sessionStorage.getItem('postLoginRedirect');
                const current = (window.location.pathname || '').split('/').pop() || '';
                // clear the flag either way to avoid stale state
                if (target) sessionStorage.removeItem('postLoginRedirect');
                if (target && target !== current && !/index\.html$/i.test(target)) {
                    window.location.replace(target);
                } else {
                    window.location.replace('Velviora.html');
                }
            } catch (e) {
                sessionStorage.removeItem('postLoginRedirect');
                window.location.replace('Velviora.html');
            }
        }
    } catch (e) {
        console.error('Auth check failed', e);
    }
}

// Attach the check to DOMContentLoaded so it runs when the page opens
window.addEventListener('DOMContentLoaded', checkAuthOnLoad);
// means run the checkAUTHLOAD FUNCTION when the html page is fully loaded
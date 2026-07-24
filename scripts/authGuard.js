// Auth guard: checks refresh token with server; redirects to index if unauthorized.
(function(){
    const REFRESH_URL = 'https://valviorabackend2.onrender.com/refresh';

    // Remove the temporary hide style if present
    function revealPage(){
        try {
            const s = document.getElementById('auth-hide-style');
            if (s && s.parentNode) s.parentNode.removeChild(s);
            document.documentElement.style.visibility = '';
        } catch (e) {}
    }

    async function checkAuth(){
        // If this tab recently logged out, block access immediately.
        if (sessionStorage.getItem('loggedOut')) {
            sessionStorage.removeItem('loggedOut');
            window.location.replace('index.html');
            return;
        }
        try{
            const res = await fetch(REFRESH_URL, { method: 'GET', credentials: 'include' });
            if (!res.ok) {
                // Not authenticated -> redirect to index/login
                window.location.replace('index.html');
            } else {
                // authorized — reveal page
                revealPage();
            }
        }catch(e){
            // Network or other error -> treat as unauthenticated
            window.location.replace('index.html');
        }
    }

    // Check on load
    window.addEventListener('DOMContentLoaded', checkAuth);

    // Also check when page is shown (handles back-button bfcache)
    window.addEventListener('pageshow', (event) => {
        checkAuth();
    });

    // If page didn't include an inline hide-style, add a fail-safe hide so nothing flashes
    try {
        if (!document.getElementById('auth-hide-style')) {
            const style = document.createElement('style');
            style.id = 'auth-hide-style';
            style.textContent = 'html{visibility:hidden !important}';
            document.head && document.head.appendChild(style);
        }
    } catch (e) {}
})();

export function logout() {
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('https://valviorabackend2.onrender.com/logout', {
          method: 'GET',
          credentials: 'include'
        });

        if (res.ok) {
          try { const mod = await import('../authToken.js'); mod.clearAccessToken(); } catch(e){}
          window.location.href = 'html.html';
          return;
        }

        console.error('Logout failed', res.status, res.statusText);
      } catch (err) {
        console.error(err);
      }
});
}
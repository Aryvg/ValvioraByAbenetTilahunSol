// Login handler moved from html.js
const loginBtn = document.querySelector('.js-login-button');

if (loginBtn) {
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const userMsg = document.querySelector('.username-login-msg');
  const passMsg = document.querySelector('.password-login-msg');
  const emailRegex = /^[\w-.]+@gmail\.com$/;

  // realtime input validation
  if (loginUser && userMsg) {
    loginUser.addEventListener('input', () => {
      const v = loginUser.value.trim();
      if (!v) {
        userMsg.textContent = '';
        return;
      }
      if (v.length > 50) {
        userMsg.textContent = 'Email must be 50 characters or less.';
        userMsg.style.color = 'red';
        return;
      }
      if (!emailRegex.test(v)) {
        userMsg.textContent = '❌ Email is not valid';
        userMsg.style.color = 'red';
        return;
      }
      userMsg.textContent = '';
    });
  }

  if (loginPass && passMsg) {
    loginPass.addEventListener('input', () => {
      const v = loginPass.value || '';
      if (!v) {
        passMsg.textContent = '';
        return;
      }
      if (v.length > 12) {
        passMsg.textContent = 'Password must be 12 characters or less.';
        passMsg.style.color = 'red';
        return;
      }
      passMsg.textContent = '';
    });
  }

  loginBtn.addEventListener('click', async () => {
    const username = loginUser ? loginUser.value.trim() : '';
    const pwd = loginPass ? loginPass.value.trim() : '';

    // prevent sending if client-side validation fails
    if ((userMsg && userMsg.textContent) || (passMsg && passMsg.textContent)) {
      document.querySelector('.notfound').textContent = 'Please fix validation errors.';
      document.querySelector('.notfound').style.color = 'red';
      return;
    }

    // Replace button text with spinner and disable button (simple, reliable)
    const originalButtonHTML = loginBtn.innerHTML;
    try {
      loginBtn.disabled = true;
      loginBtn.setAttribute('aria-busy', 'true');
      loginBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span>';
      const res = await fetch('https://valviorabackend2.onrender.com/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user: username,
          pwd: pwd
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          document.querySelector('.notfound').textContent = '❌ Not found — try again';
          document.querySelector('.notfound').style.color = 'red';
          return;
        }
        throw new Error(`${res.status} ${res.statusText}`);
      } else {
        document.querySelector('.notfound').textContent = '';
        try {
          const target = sessionStorage.getItem('postLoginRedirect');
          const current = (window.location.pathname || '').split('/').pop() || '';
          if (target) sessionStorage.removeItem('postLoginRedirect');
          // don't redirect to the same page or back to index
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

      return await res.json();

    } catch (err) {
      console.error(err);
    } finally {
      // restore button state
      try {
        loginBtn.innerHTML = originalButtonHTML;
        loginBtn.disabled = false;
        loginBtn.removeAttribute('aria-busy');
      } catch (e) {
        // ignore errors while restoring UI
      }
    }
  });
}

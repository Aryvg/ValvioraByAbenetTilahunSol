import { renderAccountDropdown } from './accountDropdown.js';
import { fetchMyRegistered, deleteMyAccount } from './registeredStore.js';

// SVG Icon Library
const icons = {
    google: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/></svg>`,
    switch: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    signout: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`,
    studio: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>`,
    purchases: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/></svg>`,
    data: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
    language: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04z"/></svg>`,
    location: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
    keyboard: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    age: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-4 3a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm0 14a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm2-8h-2V7h2z"/></svg>`,
    delete: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
};

const menuData = [
    [
        { label: "20 years old", icon: icons.age, id: "accou786-age-item" },
        { label: "Sign out", icon: icons.signout }
    ],
    [
        { label: "Display language: English", icon: icons.language, arrow: true },
        { label: "Location: United States", icon: icons.location, arrow: true, id: "accou786-location-item" },
    ],
    [
        { label: "Delete account", icon: icons.delete, id: "accou786-delete-item" }
    ]
];

function renderMenu() {
    renderAccountDropdown();

    const container = document.querySelector('#accou786-menu-container');
    if (!container) return;

    menuData.forEach((section, idx) => {
        section.forEach(item => {
            const div = document.createElement('div');
            div.className = 'accou786-menu-item';
            if (item.label === 'Sign out' || item.label === 'Delete account') div.classList.add('accou786-signout');
            if (item.id) div.id = item.id;

            div.innerHTML = `
                        <div class="accou786-icon-box">${item.icon}</div>
                        <div class="accou786-label-box">
                            <span>${item.label}</span>
                            ${item.arrow ? `<div class="accou786-chevron">${icons.chevron}</div>` : ''}
                        </div>
                    `;
            container.appendChild(div);
        });
        if (idx < menuData.length - 1) {
            const hr = document.createElement('hr');
            hr.className = 'accou786-divider';
            container.appendChild(hr);
        }
    });

    const appearanceItem = document.querySelector('#accou786-appearance-trigger');
    if (!appearanceItem) return;

    let isDarkMode = true;

    appearanceItem.addEventListener('click', () => {
        const iconBox = appearanceItem.querySelector('.accou786-icon-box');
        const label = appearanceItem.querySelector('.accou786-label-box span');

        if (isDarkMode) {
            iconBox.innerHTML = icons.sun;
            label.innerText = "Appearance: Light theme";
        } else {
            iconBox.innerHTML = icons.moon;
            label.innerText = "Appearance: Dark theme";
        }
        isDarkMode = !isDarkMode;
    });
}

renderMenu();

(async function populateAgeAndLocation() {
    const profile = await fetchMyRegistered();
    if (!profile) return;

    const ageItem = document.querySelector('#accou786-age-item .accou786-label-box span');
    if (ageItem && profile.age) {
        ageItem.textContent = `${profile.age} years old`;
    }

    const locationItem = document.querySelector('#accou786-location-item .accou786-label-box span');
    if (locationItem && profile.country) {
        locationItem.textContent = `Location: ${profile.country}`;
    }
})();

const signOutEls = document.querySelectorAll('.accou786-signout');
signOutEls.forEach(el => {
    if (el.id === 'accou786-delete-item') return;
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.currentTarget;
        if (btn.dataset.signing === '1') return;
        btn.dataset.signing = '1';

        const origHTML = btn.innerHTML;
        btn.setAttribute('aria-disabled', 'true');
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.65';

        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 50 50" style="vertical-align:middle;margin-right:8px;"><path fill="currentColor" d="M43.935,25.145c0-10.318-8.356-18.686-18.686-18.686c-10.329,0-18.686,8.368-18.686,18.686h4.068c0-8.07,6.548-14.617,14.617-14.617 c8.07,0,14.617,6.547,14.617,14.617H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></path></svg><span>Signing out...</span>';

        try {
            const res = await fetch('https://valviorabackend2.onrender.com/logout', {
                method: 'GET',
                credentials: 'include'
            });

            if (res.ok) {
                try { sessionStorage.setItem('loggedOut', '1'); } catch (e) {}
                try { const mod = await import('../authToken.js'); mod.clearAccessToken(); } catch(e){}
                window.location.replace('index.html');
                return;
            }

            console.error('Logout failed', res.status, res.statusText);
            btn.innerHTML = origHTML;
            btn.removeAttribute('aria-disabled');
            btn.style.pointerEvents = '';
            btn.style.opacity = '';
            btn.dataset.signing = '0';
        } catch (err) {
            console.error(err);
            btn.innerHTML = origHTML;
            btn.removeAttribute('aria-disabled');
            btn.style.pointerEvents = '';
            btn.style.opacity = '';
            btn.dataset.signing = '0';
        }
    });
});

function showDeleteAccountConfirm() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000; padding: 16px; box-sizing: border-box;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            background: #212121; color: #fff; border-radius: 12px;
            max-width: 360px; width: 100%; padding: 24px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.5);
            font-family: Roboto, Arial, sans-serif;
        `;
        card.innerHTML = `
            <h3 style="margin:0 0 12px; font-size:18px;">Delete your account?</h3>
            <p style="margin:0 0 20px; font-size:14px; color:#aaa; line-height:1.4;">
                This will permanently delete your account and cannot be undone.
            </p>
            <div style="display:flex; justify-content:flex-end; gap:12px; flex-wrap:wrap;">
                <button type="button" id="accou786-delete-cancel" style="
                    background:transparent; color:#3ea6ff; border:none;
                    padding:10px 16px; border-radius:18px; font-size:14px;
                    font-weight:600; cursor:pointer;
                ">Cancel</button>
                <button type="button" id="accou786-delete-confirm" style="
                    background:#f03434; color:#fff; border:none;
                    padding:10px 16px; border-radius:18px; font-size:14px;
                    font-weight:600; cursor:pointer;
                ">Delete account</button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const cleanup = (result) => {
            overlay.remove();
            resolve(result);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });
        card.querySelector('#accou786-delete-cancel').addEventListener('click', () => cleanup(false));
        card.querySelector('#accou786-delete-confirm').addEventListener('click', () => cleanup(true));
    });
}

const deleteAccountEl = document.querySelector('#accou786-delete-item');
if (deleteAccountEl) {
    deleteAccountEl.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const confirmed = await showDeleteAccountConfirm();
        if (!confirmed) return;

        try {
            const ok = await deleteMyAccount();
            if (ok) {
                try { sessionStorage.setItem('loggedOut', '1'); } catch (e) {}
                try { const mod = await import('../authToken.js'); mod.clearAccessToken(); } catch (e) {}
                window.location.replace('index.html');
            } else {
                console.error('Account deletion failed.');
            }
        } catch (err) {
            console.error('Account deletion failed', err);
        }
    });
}

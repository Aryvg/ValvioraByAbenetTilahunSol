// Popup module for success notifications
let successTimer = null;
function ensureSuccessStyles() {
    if (document.getElementById('customSuccessStyles')) return;
    const style = document.createElement('style');
    style.id = 'customSuccessStyles';
    style.textContent = `
    .custom-success-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.38);z-index:2147483646;backdrop-filter:blur(2px);}
    .custom-success-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;display:flex;align-items:center;gap:16px;max-width:540px;width:calc(100% - 48px);background:linear-gradient(180deg,#ffffff,#f7fffb);box-shadow:0 20px 50px rgba(2,6,23,0.32);border-radius:14px;padding:18px 20px;border:1px solid rgba(34,197,94,0.14);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;animation:popIn .32s cubic-bezier(.2,.9,.3,1);}
    .custom-success-popup .msg{color:#064e3b;font-weight:700;font-size:18px;line-height:1.1}
    .custom-success-popup .sub{color:#065f46;font-size:14px;opacity:0.95}
    .custom-success-popup .icon{width:56px;height:56px;flex:0 0 56px;border-radius:12px;background:linear-gradient(180deg,#ecfdf5,#bbf7d0);display:flex;align-items:center;justify-content:center}
    .custom-success-popup .close-btn{background:transparent;border:none;color:#065f46;cursor:pointer;font-size:18px;padding:8px;border-radius:10px}
    @keyframes popIn{0%{transform:translate(-50%,-46%) scale(.96);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
    .custom-success-popup.hide{animation:fadeOut .22s forwards}
    @keyframes fadeOut{to{opacity:0;transform:translate(-50%,-46%) scale(.96)}}
    @media (max-width:420px){.custom-success-popup{left:50%;right:auto;top:50%;transform:translate(-50%,-50%);width:calc(100% - 24px);}}
    `;
    document.head.appendChild(style);
}

function escapeHtml(str){
    return String(str).replace(/[&<>\"'`]/g, (s)=>({
        '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;','`':'&#96;'
    }[s]));
}

export function showSuccessPopup(message) {
    ensureSuccessStyles();
    let container = document.getElementById('customSuccessPopup');
    if (!container) {
        const backdrop = document.createElement('div');
        backdrop.id = 'customSuccessBackdrop';
        backdrop.className = 'custom-success-backdrop';
        backdrop.addEventListener('click', () => hideSuccessPopup());

        container = document.createElement('div');
        container.id = 'customSuccessPopup';
        container.className = 'custom-success-popup';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-modal', 'true');
        container.innerHTML = `
            <div class="icon" aria-hidden="true"> 
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17l-5-5" stroke="#065f46" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div style="flex:1;min-width:0">
                <div class="msg">${escapeHtml(message)}</div>
            </div>
            <button class="close-btn" aria-label="Dismiss" title="Dismiss">✕</button>
        `;
        const btn = container.querySelector('.close-btn');
        btn.addEventListener('click', () => hideSuccessPopup());
        document.body.appendChild(backdrop);
        document.body.appendChild(container);
    } else {
        const msgEl = container.querySelector('.msg');
        if (msgEl) msgEl.textContent = message;
        container.classList.remove('hide');
        const backdrop = document.getElementById('customSuccessBackdrop');
        if (backdrop) backdrop.style.display = '';
    }
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => hideSuccessPopup(), 4000);
}

export function hideSuccessPopup() {
    const container = document.getElementById('customSuccessPopup');
    if (!container) return;
    container.classList.add('hide');
    const backdrop = document.getElementById('customSuccessBackdrop');
    if (backdrop) backdrop.style.display = 'none';
    setTimeout(() => { try { container.remove(); if (backdrop) backdrop.remove(); } catch {} }, 260);
    if (successTimer) { clearTimeout(successTimer); successTimer = null; }
}

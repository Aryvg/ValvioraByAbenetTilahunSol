// subscribeButton.js — encapsulates subscribe toggle, optimistic UI, and server update
let storedAccessToken = null;
const SUBSCRIPTION_CHANGED_EVENT = 'subscription-state-changed';

function notifySubscriptionChange(channelId, subscribed) {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(new CustomEvent(SUBSCRIPTION_CHANGED_EVENT, {
    detail: { channelId, subscribed }
  }));
}

async function getAuthToken() {
  let token = null;
  try {
    const r = await fetch('https://valviorabackend2.onrender.com/refresh', { credentials: 'include' });
    if (r.ok) {
      const d = await r.json();
      token = d?.accessToken || null;
      if (token) storedAccessToken = token;
    }
  } catch (e) {
    console.warn('Refresh failed, falling back to stored token', e);
  }
  if (!token) token = storedAccessToken;
  return token;
}

async function sendSubscribeCount(channelId, token, subscribeValue) {
  if (!channelId || !token) return null;
  const response = await fetch('https://valviorabackend2.onrender.com/channelApi', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ channelId, subscribe: subscribeValue })
  });
  if (!response.ok) throw new Error(`subscribe update failed (${response.status})`);
  return response;
}

async function getRemoteSubscriptionState(channelId, token) {
  if (!channelId || !token) return null;
  try {
    const response = await fetch(`https://valviorabackend2.onrender.com/channelApi/${encodeURIComponent(channelId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.subscribed ?? null;
  } catch (e) {
    return null;
  }
}

function parseCount(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s) return 0;
  const last = s.slice(-1).toLowerCase();
  const num = parseFloat(s.replace(/[\s,]/g, '').replace(/[^0-9\.]/g, '')) || 0;
  if (last === 'k') return Math.round(num * 1e3);
  if (last === 'm') return Math.round(num * 1e6);
  if (last === 'b') return Math.round(num * 1e9);
  if (last === 't') return Math.round(num * 1e12);
  return Math.round(num);
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${+(n / 1e12).toFixed(2).replace(/\.00$/, '')}T`;
  if (abs >= 1e9) return `${+(n / 1e9).toFixed(2).replace(/\.00$/, '')}B`;
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(2).replace(/\.00$/, '')}M`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(2).replace(/\.00$/, '')}k`;
  return String(n);
}

export async function setupSubscribe(container, channelId, initialSubscribeCount) {
  if (!container) return;
  const subscribeButton = container.querySelector('.subscribe');
  const subscribeViewEl = container.querySelector('.vid-view');
  if (!subscribeButton) return;

  const subscribeStateKey = `subscribed:${channelId || 'unknown'}`;
  let currentlySubscribed = localStorage.getItem(subscribeStateKey) === '1';
  const token = await getAuthToken();
  const remoteSubscribed = channelId ? await getRemoteSubscriptionState(channelId, token) : null;
  if (remoteSubscribed !== null) {
    currentlySubscribed = !!remoteSubscribed;
    localStorage.setItem(subscribeStateKey, currentlySubscribed ? '1' : '0');
  }

  const setView = (n) => {
    if (!subscribeViewEl) return;
    const label = n === 1 ? 'subscriber' : 'subscribers';
    subscribeViewEl.textContent = `${fmt(n)} ${label}`;
  };

  setView(parseCount(initialSubscribeCount));

  subscribeButton.dataset.subscribed = currentlySubscribed ? 'true' : 'false';
  subscribeButton.textContent = currentlySubscribed ? 'Subscribed' : 'Subscribe';
  subscribeButton.classList.toggle('is-subscribed', currentlySubscribed);

  subscribeButton.addEventListener('click', async () => {
    if (subscribeButton.dataset.busy === 'true') return;

    const token = await getAuthToken();
    if (!token) { console.warn('No auth token available for subscribe toggle.'); return; }

    const isSubscribed = subscribeButton.dataset.subscribed === 'true';
    const prev = parseCount(subscribeViewEl ? subscribeViewEl.textContent : String(initialSubscribeCount));
    const next = Math.max(0, prev + (isSubscribed ? -1 : 1));

    // optimistic UI update
    subscribeButton.dataset.busy = 'true';
    subscribeButton.disabled = true;
    subscribeButton.dataset.subscribed = String(!isSubscribed);
    subscribeButton.textContent = !isSubscribed ? 'Subscribed' : 'Subscribe';
    subscribeButton.classList.toggle('is-subscribed', !isSubscribed);
    localStorage.setItem(subscribeStateKey, !isSubscribed ? '1' : '0');
    setView(next);

    try {
      await sendSubscribeCount(channelId, token, isSubscribed ? 0 : 1);
      notifySubscriptionChange(channelId, !isSubscribed);
    } catch (err) {
      console.error('subscribe toggle failed:', err);
      // rollback
      subscribeButton.dataset.subscribed = String(isSubscribed);
      subscribeButton.textContent = isSubscribed ? 'Subscribed' : 'Subscribe';
      subscribeButton.classList.toggle('is-subscribed', isSubscribed);
      localStorage.setItem(subscribeStateKey, isSubscribed ? '1' : '0');
      setView(prev);
    } finally {
      subscribeButton.dataset.busy = 'false';
      subscribeButton.disabled = false;
    }
  });
}

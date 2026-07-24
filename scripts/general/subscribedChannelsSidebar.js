import { getAccessToken } from '../auth.js';
import { setupSubscribe } from '../YouTubeSecondHomePage/subscribeButton.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildChannelMarkup(item) {
    const name = escapeHtml(item.channelname || item.channelName || 'Channel');
    const image = escapeHtml(item.profilePicture || '');
    const channelId = escapeHtml(String(item.channelId || item._id || item.id || ''));

    return `
        <div class="moving-sidebar-container moving-sidebar-channel" data-channel-id="${channelId}">
            <img src="${image}" class="movin-sidebar-image" alt="${name}" loading="lazy">
            <div class="moving-sidebar-text">${name}</div>
            <button class="channel-menu-trigger" type="button" aria-label="More options" title="More options">
                <span aria-hidden="true">⋯</span>
            </button>
            <div class="channel-subscribe-card" aria-hidden="true">
                <button class="subscribe channel-subscribe-btn" type="button">Unsubscribe</button>
            </div>
        </div>`;
}

function wireChannelInteractions(channelEl) {
    const trigger = channelEl.querySelector('.channel-menu-trigger');
    const panel = channelEl.querySelector('.channel-subscribe-card');
    const channelId = channelEl.dataset.channelId || '';

    if (!trigger || !panel) return;

    const closePanel = () => {
        panel.classList.remove('is-open');
        trigger.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
    };

    trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = panel.classList.toggle('is-open');
        trigger.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen) {
            const subscribeButton = panel.querySelector('.subscribe');
            if (subscribeButton) subscribeButton.focus();
        }
    });

    panel.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('click', closePanel, { once: false });

    const subscribeButton = panel.querySelector('.subscribe');
    if (subscribeButton) {
        subscribeButton.textContent = 'Subscribe';
        subscribeButton.classList.remove('is-subscribed');
        subscribeButton.dataset.subscribed = 'false';
    }

    if (channelId) {
        setupSubscribe(channelEl, channelId, 0);
    }
}

export async function populateSubscribedChannelsSection(root) {
    if (!root) return;

    const list = root.querySelector('.js-subscribed-channels-list');
    const toggle = root.querySelector('.show');
    const header = root.querySelector('.js-subscribed-header');
    if (!list || !toggle || !header) return;

    try {
        const token = await getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch('https://valviorabackend2.onrender.com/subscribedChannelsApi', {
            headers,
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        const data = await response.json();
        const channels = Array.isArray(data) ? data : [];
        const shouldShowToggle = channels.length > 3;
        const expanded = toggle.dataset.expanded === 'true';

        if (!channels.length) {
            list.innerHTML = '';
            toggle.style.display = 'none';
            return;
        }

        const visibleChannels = shouldShowToggle && !expanded ? channels.slice(0, 3) : channels;
        list.innerHTML = visibleChannels.map((item) => buildChannelMarkup(item)).join('');

        list.querySelectorAll('.moving-sidebar-channel').forEach((channelEl) => {
            wireChannelInteractions(channelEl);
        });

        toggle.style.display = shouldShowToggle ? '' : 'none';
        toggle.style.cursor = 'pointer';
        const label = toggle.querySelector('.moving-sidebar-text');
        const icon = toggle.querySelector('.moving-sidebar-images');
        const headerIcon = header.querySelector('.moving-sidebar-images');
        if (label) {
            label.textContent = shouldShowToggle ? (expanded ? 'Show Less' : 'Show More') : 'Show More';
        }
        if (icon) {
            icon.style.transition = 'transform 0.2s ease';
            icon.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        if (headerIcon) {
            headerIcon.style.transition = 'transform 0.2s ease';
            headerIcon.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        const toggleSection = () => {
            toggle.dataset.expanded = String(!expanded);
            populateSubscribedChannelsSection(root);
        };

        toggle.onclick = toggleSection;
        header.onclick = toggleSection;
    } catch (error) {
        console.warn('Failed to load subscribed channels', error);
        list.innerHTML = '';
        toggle.style.display = 'none';
    }
}

function refreshSubscribedChannelSections() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.js-subscribed-channels-section').forEach((section) => {
        populateSubscribedChannelsSection(section);
    });
}

export function scheduleSubscribedChannelsRender() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const run = () => refreshSubscribedChannelSections();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
        requestAnimationFrame(run);
    }

    document.addEventListener('subscription-state-changed', () => {
        refreshSubscribedChannelSections();
    });
}

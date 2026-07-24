import { getAccessToken } from '../auth.js';
import { getNotInterestedIds, postNotInterested } from '../general/notInterestedStore.js';
import { decodeText } from '../general/decodeText.js';

const SIDEBAR_LAZY_BATCH_SIZE = 6;

// Module-level state for the currently loaded sidebar list, so the lazy
// loader (initSidebarLazyLoading) can keep rendering more already-fetched
// items as the user scrolls, without re-fetching anything from the server.
let sidebarLazyItems = [];
let sidebarLazyRenderedCount = 0;
let sidebarLazyObserver = null;

const formatViews = (views) => {
    const n = Number(views);
    if (!Number.isFinite(n) || n <= 0) return 'No views';
    if (n === 1) return '1 view';
    if (n >= 1e9) return `${Math.floor(n / 1e9)}B views`;
    if (n >= 1e6) return `${Math.floor(n / 1e6)}M views`;
    if (n >= 1000) return `${Math.floor(n / 1000)}k views`;
    return `${n} views`;
};

const formatAge = (timestamp) => {
    const ms = Number(timestamp);
    if (!Number.isFinite(ms)) return '';
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
};

// Single-item template — unchanged from the original buildSidebarHtml map
// callback, just extracted so it can be reused by the lazy batch renderer.
const buildSidebarItemHtml = (item) => {
    const isBanned = item.isBanned === true || item.isBanned === 'true';
    return `
 <div class="sidebar-item-container${isBanned ? ' banned-thumbnail' : ''}" data-video-id="${item.videoId || ''}" data-banned="${isBanned ? '1' : '0'}">
    <div class="image-text">
        <div class="image-container-side">
            <img src="${item.image || ''}" class="side-image" data-id="${item.videoId || ''}" data-banned="${isBanned ? '1' : '0'}" role="button" tabindex="${isBanned ? '-1' : '0'}" ${isBanned ? 'aria-disabled="true"' : ''} />
        </div>
        <div class="texts-container">
            <div class="text-stack">
                <div class="title">${decodeText(item.title || '')}</div>
                <div class="channel-name">${decodeText(item.channelName || '')}</div>
                <div class="channel-name">${formatViews(item.Views)}${item.Time ? '. ' + formatAge(item.Time) : ''}</div>
            </div>
            <div class="three-dots-sidebar" role="button" tabindex="0" aria-label="More options">
                <div></div>
                <div></div>
                <div></div>
                <div class="sidebar-not-interested-popup" style="display:none; margin-right:200px ;">
                    <button type="button" 
                    style="padding:15px; background-color: #fff; border: 1px solid #ccc; border-radius: 8px; cursor: pointer; white-space: nowrap; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1;"
                    class="sidebar-not-interested-action">Not interested</button>
                </div>
            </div>
        </div>
    </div>
 </div>
   `;
};

// Placeholder (grey box) template — no data-id/side-image class on purpose,
// so it's visually inert (not clickable) until it's swapped for real content.
const buildSidebarPlaceholderHtml = () => `
 <div class="sidebar-item-container sidebar-item-placeholder">
    <div class="image-text">
        <div class="image-container-side sidebar-skeleton-image"></div>
        <div class="texts-container">
            <div class="text-stack">
                <div class="sidebar-skeleton-line sidebar-skeleton-line--title"></div>
                <div class="sidebar-skeleton-line sidebar-skeleton-line--subtitle"></div>
            </div>
        </div>
    </div>
 </div>
`;

const buildSidebarHtml = (items) => items.map(buildSidebarItemHtml).join('');

const buildLazySidebarHtml = (items) =>
    items
        .map((item, index) => (index < SIDEBAR_LAZY_BATCH_SIZE ? buildSidebarItemHtml(item) : buildSidebarPlaceholderHtml()))
        .join('');

const handleSidebarPopupClick = async (e) => {
    const actionBtn = e.target.closest('.sidebar-not-interested-action');
    if (actionBtn) {
        e.stopPropagation();
        const popup = actionBtn.closest('.sidebar-not-interested-popup');
        if (popup) popup.style.display = 'none';
        const item = actionBtn.closest('.sidebar-item-container');
        const imageText = item?.querySelector('.image-text');
        const contentId = item?.dataset.videoId || item?.querySelector('.side-image')?.getAttribute('data-id');
        if (!contentId) return;
        try {
            const token = await getAccessToken();
            const ok = await postNotInterested(contentId, token);
            if (ok && imageText) imageText.style.display = 'none';
        } catch (err) {
            console.warn('sidebar not interested action failed', err);
        }
        return;
    }

    const dotsBtn = e.target.closest('.three-dots-sidebar');
    if (dotsBtn) {
        e.stopPropagation();
        const popup = dotsBtn.querySelector('.sidebar-not-interested-popup');
        if (!popup) return;
        document.querySelectorAll('.sidebar-not-interested-popup').forEach((openPopup) => {
            if (openPopup !== popup) openPopup.style.display = 'none';
        });
        popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
        return;
    }
};

document.addEventListener('click', handleSidebarPopupClick);

export async function getSidebarList() {
    const token = await getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;

    try {
        const response = await fetch('https://valviorabackend2.onrender.com/youtubeHomepageApi', {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response.ok) return '';
        const data = await response.json();
        if (!Array.isArray(data)) return '';
        const notInterestedIds = await getNotInterestedIds();
        const visibleItems = data.filter(item => !notInterestedIds.has(item.videoId));

        sidebarLazyItems = visibleItems;
        sidebarLazyRenderedCount = Math.min(SIDEBAR_LAZY_BATCH_SIZE, visibleItems.length);

        return buildLazySidebarHtml(visibleItems);
    } catch (e) {
        console.warn('Failed to load sidebar list', e);
        return '';
    }
}

// Call this once, right after the HTML from getSidebarList() has been
// inserted into the DOM. It watches the first remaining placeholder and,
// once it's about to enter the viewport, swaps the next batch of 6
// placeholders for their real content (data is already in memory —
// nothing is re-fetched).
export function initSidebarLazyLoading(containerEl, onBatchRendered) {
    if (!containerEl) return;
    if (sidebarLazyObserver) {
        sidebarLazyObserver.disconnect();
        sidebarLazyObserver = null;
    }

    function renderNextBatch() {
        const placeholders = containerEl.querySelectorAll('.sidebar-item-placeholder');
        const batch = Array.from(placeholders).slice(0, SIDEBAR_LAZY_BATCH_SIZE);

        batch.forEach((placeholderEl, i) => {
            const item = sidebarLazyItems[sidebarLazyRenderedCount + i];
            if (item) placeholderEl.outerHTML = buildSidebarItemHtml(item);
        });
        sidebarLazyRenderedCount += batch.length;

        const nextPlaceholder = containerEl.querySelector('.sidebar-item-placeholder');
        if (nextPlaceholder && sidebarLazyObserver) {
            sidebarLazyObserver.observe(nextPlaceholder);
        }

        if (typeof onBatchRendered === 'function') onBatchRendered();
    }

    sidebarLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                sidebarLazyObserver.unobserve(entry.target);
                renderNextBatch();
            }
        });
    }, { root: null, rootMargin: '200px', threshold: 0 });

    const firstPlaceholder = containerEl.querySelector('.sidebar-item-placeholder');
    if (firstPlaceholder) sidebarLazyObserver.observe(firstPlaceholder);
}

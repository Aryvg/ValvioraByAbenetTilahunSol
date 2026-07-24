import { fetchAndRenderShorts } from '../shortsThumbnail/shortsThumbnail.js';
import { getNotInterestedIds } from '../general/notInterestedStore.js';
import { decodeText } from '../general/decodeText.js';

// Cached copy of the currently-rendered thumbnails. Other modules should
// call `getCachedThumbnails()` instead of importing a separate thumbnails.js
// file so the app stays in sync with the homepage API.
let cachedThumbnails = [];
export function getCachedThumbnails() { return cachedThumbnails; }

let storedAccessToken = null;

const cleanUrl = (url) => {
    if (!url) return '';
    // Step 1: Decode HTML entities
    let decoded = url
        .replace(/&#x2F;/gi, '/')
        .replace(/&#x27;/gi, "'")
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');
    // Step 2: Strip any wrongly prepended local host prefix before a real https:// URL
    const match = decoded.match(/https?:\/\/[^/]+\/(https?:\/\/.+)/);
    if (match) return match[1];
    return decoded;
};

const formatViews = (v) => {
    if (v === undefined || v === null || v === 0) return 'No views';
    const n = Number(v);
    if (Number.isNaN(n)) return 'No views';
    if (n === 1) return '1 view';
    if (n >= 1e9) return `${Math.floor(n / 1e9)}B views`;
    if (n >= 1e6) return `${Math.floor(n / 1e6)}M views`;
    if (n >= 1000) return `${Math.floor(n / 1000)}k views`;
    return `${n} views`;
};

const formatTime = (ms) => {
    if (!ms) return '';
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
};

// timer is read directly from the homepage API response; no client-side duration extraction needed

async function fetchPlaylistsForHomepage(token) {
    try {
        const headers = token
            ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };
        const res = await fetch('https://valviorabackend2.onrender.com/playlistHomeApi', {
            method: 'GET', headers, credentials: 'include'
        });
        if (!res.ok || res.status === 204) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.warn('fetchPlaylistsForHomepage error:', e);
        return [];
    }
}

function showSkeletonGrid(count = 6) {
    const container = document.querySelector('.js-thumbnail-container');
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="thumbnail-container">
                <div class="skeleton-bg skeleton-image-box"></div>
                <div class="skeleton-description">
                    <div class="skeleton-avatar-box"></div>
                    <div class="skeleton-lines">
                        <div class="skeleton-bg skeleton-line skeleton-line-long"></div>
                        <div class="skeleton-bg skeleton-line skeleton-line-medium"></div>
                        <div class="skeleton-bg skeleton-line skeleton-line-short"></div>
                    </div>
                </div>
            </div>`;
    }
    container.innerHTML = html;
}

export async function fetchAndRenderHomepage(skipRender = false) {
    try {
        showSkeletonGrid(8); // show placeholders immediately while API loads
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

        const headers = token
            ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };

        const response = await fetch('https://valviorabackend2.onrender.com/youtubeHomepageApi', {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (response.status === 204) {
            if (!skipRender) renderThumbnails([]);
            return;
        }

        if (!response.ok) {
            console.error('youtubeHomepageApi fetch failed:', response.status);
            if (!skipRender) renderThumbnails([]);
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            if (!skipRender) renderThumbnails([]);
            return;
        }

        // No need to fetch videoContentApi or compute durations client-side - homepage API includes `timer`

        const mapped = data.map((item) => ({
            videoId:      item.videoId || '',
            image:        cleanUrl(item.image) || '',
            profileImage: cleanUrl(item.profilePicture) || '',
            title:        decodeText(item.title || ''),
            channelName:  decodeText(item.channelName || ''),
            views:        formatViews(item.Views),
            time:         formatTime(item.Time),
            rawTime:      Number(item.Time) || 0,
            timer:        item.timer || '',
            isBanned:     Boolean(item.isBanned),
            Isplaylist:   false
        }));

        // Also fetch playlists and append them as playlist-styled thumbnails
        const playlists = await fetchPlaylistsForHomepage(token);
        const mappedPlaylists = playlists.map((pl) => ({
            id:           pl.playlistId || '',
            image:        cleanUrl(pl.thumbnail) || '',
            profileImage: cleanUrl(pl.ProfilePicture) || '',
            title:        decodeText(pl.playlistTitle || ''),
            channelName:  decodeText(pl.channelName || ''),
            views:        formatViews(pl.views),
            time:         formatTime(pl.time),
            rawTime:      Number(pl.time) || 0,
            timer:        '',
            isBanned:     Boolean(pl.isBanned),
            Isplaylist:   true
        }));

        // Videos and playlists come from two separate API calls, so simply
        // concatenating them (videos, then playlists) always groups every
        // playlist at the end regardless of when it was actually uploaded.
        // Sorting the merged list by each item's real upload timestamp
        // (newest first) puts playlists back in their correct chronological
        // position relative to videos uploaded before or after them.
        const combined = [...mapped, ...mappedPlaylists].sort(
            (a, b) => b.rawTime - a.rawTime
        );
        const notInterestedIds = await getNotInterestedIds();
        const filtered = combined.filter(item => {
            const id = item.Isplaylist ? item.id : item.videoId;
            return !notInterestedIds.has(id);
        });
        cachedThumbnails = filtered;

        // Skip the normal full-grid (with Shorts) render when the caller
        // already knows a search is about to replace it immediately. This
        // is what previously made a search coming from the second page
        // flash and then disappear a moment later: the full homepage (and
        // its Shorts row) rendered first and kicked off its own Shorts
        // fetch, which finished AFTER the search results were shown and
        // forced the Shorts row back open.
        if (!skipRender) {
            renderThumbnails(filtered);
        }

    } catch (err) {
        console.error('fetchAndRenderHomepage error:', err);
        if (!skipRender) renderThumbnails([]);
    }
}

export function renderThumbnails(list, isSearchResult = false) {
    const container = document.querySelector('.js-thumbnail-container');
    if (!container) return;

    // Only overwrite the master cache when this is the FULL homepage list.
    // Never overwrite it with filtered search results — otherwise later
    // searches can only search inside the last search's results.
    if (!isSearchResult) {
        cachedThumbnails = Array.isArray(list) ? list : [];
    }

    // Show or hide the Shorts row(s) that already exist in the page HTML
    // (outside this container) depending on whether we are showing search
    // results or the normal homepage feed. This is used for Bug 2 below.
    document.querySelectorAll('.shortsgh, .gsho-layout-wrapper').forEach((el) => {
        el.style.display = isSearchResult ? 'none' : '';
    });

    const BATCH = 6; // thumbnails per group before a Shorts section
    const allItems = list || [];

    // ── helpers ────────────────────────────────────────────────────────────────

    function buildSkeletonShortsHTML() {
        return Array(4).fill(`
            <div class="gsho-video-card">
                <div class="gsho-thumbnail-box skeleton-bg"
                     style="height:200px;border-radius:12px;margin-bottom:8px;"></div>
                <div class="gsho-content-row">
                    <div class="gsho-text-stack">
                        <div class="skeleton-bg"
                             style="height:13px;width:80%;border-radius:4px;margin-bottom:6px;"></div>
                        <div class="skeleton-bg"
                             style="height:11px;width:50%;border-radius:4px;"></div>
                    </div>
                </div>
            </div>`).join('');
    }

    function buildThumbnailElement(thumbnail, lazy) {
        const isPlaylist = thumbnail.Isplaylist === true;
        const isBanned = thumbnail.isBanned === true;
        const div = document.createElement('div');
        div.className = 'thumbnail-container' + (lazy ? ' lazy-thumbnail' : '') + (isBanned ? ' banned-thumbnail' : '');
        div.dataset.videoId = thumbnail.videoId || '';
        div.dataset.playlistId = isPlaylist ? (thumbnail.id || '') : '';
        div.dataset.banned = isBanned ? '1' : '0';
        div.innerHTML = `
            <div class="thumbnail-image-container"${isPlaylist ? ' style="margin-bottom:10px;"' : ''}>
                <div class="channel-playlist"${isPlaylist ? ' style="display:block;"' : ''}>
                    <div class="small-playlist-sign"></div>
                    <div class="playlist-sign"></div>
                </div>
                <img src="${thumbnail.image}" class="thumbnail-image"
                    data-video-id="${thumbnail.videoId || ''}"
                     ${isPlaylist ? 'style="border-radius:10px;"' : ''}
                     data-id="${thumbnail.id || thumbnail.videoId || ''}"
                     tabindex="0" role="button" aria-label="Open video"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='';this.classList.add('skeleton-bg');">
                <div class="timer"${isPlaylist ? ' style="bottom:-5px;"' : ''}>${thumbnail.timer || ''}</div>
            </div>
            <div class="second-container">
                <div class="description-container">
                    <div class="left-side">
                        <img src="${thumbnail.profileImage || ''}" class="left-side-image" loading="lazy">
                    </div>
                    <div class="right-side">
                        <div class="video-title">${decodeText(thumbnail.title || '')}</div>
                        <div class="channel-name">${decodeText(thumbnail.channelName || '')}</div>
                        <div class="view-and-time">
                            <div class="view">${thumbnail.views || ''}</div>
                            <div class="time">${thumbnail.time || ''}</div>
                        </div>
                    </div>
                </div>
                <div class="dot-menu" tabindex="0" aria-label="More options">
                    <div></div><div></div><div></div>
                    <button type="button" class="not-interested-popup" style="display:none;">
                        <span class="not-interested-icon" aria-hidden="true">&#128078;</span>
                        <span class="not-interested-text">Not interested</span>
                    </button>
                </div>
            </div>`;
        return div;
    }

    function buildShortsSection(deferred) {
        const titleEl = document.createElement('div');
        titleEl.className = 'shortsgh' + (deferred ? ' shortsgh-deferred' : '');
        titleEl.textContent = 'Shorts';
        titleEl.style.gridColumn = '1 / -1';

        const wrapperEl = document.createElement('div');
        wrapperEl.className = 'gsho-layout-wrapper' + (deferred ? ' gsho-wrapper-deferred' : '');
        wrapperEl.style.gridColumn = '1 / -1';
        wrapperEl.innerHTML = buildSkeletonShortsHTML();

        return { titleEl, wrapperEl };
    }

    function observeLazy(elements) {
        if (!elements.length) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('thumbnail-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '120px', threshold: 0.05 });
        elements.forEach(el => io.observe(el));
    }

    function observeShortsSection(titleEl, wrapperEl, onReveal) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    io.disconnect();
                    titleEl.classList.add('section-visible');
                    wrapperEl.classList.add('section-visible');
                    onReveal(wrapperEl);
                }
            });
        }, { rootMargin: '200px', threshold: 0 });
        io.observe(titleEl);
    }

    let shortsCallPending = false;
    function loadRealShorts(wrapperEl) {
        if (shortsCallPending) return;
        shortsCallPending = true;
        if (typeof fetchAndRenderShorts === 'function') {
            fetchAndRenderShorts(wrapperEl).catch(e => {
                console.warn('fetchAndRenderShorts error:', e);
                shortsCallPending = false;
            });
        }
    }

    // ── render ─────────────────────────────────────────────────────────────────

    container.innerHTML = ''; // clear skeletons from showSkeletonGrid

    // Slice into groups of BATCH
    const groups = [];
    for (let i = 0; i < allItems.length; i += BATCH) {
        groups.push(allItems.slice(i, i + BATCH));
    }

    const fragment = document.createDocumentFragment();
    const lazyCards = [];

    groups.forEach((group, groupIdx) => {
        const isFirstGroup = groupIdx === 0;

        group.forEach((thumbnail, i) => {
            const isLazy = !isFirstGroup; // first 6 render immediately
            const card = buildThumbnailElement(thumbnail, isLazy);
            if (isLazy) lazyCards.push(card);
            fragment.appendChild(card);
        });

        // Never add Shorts sections while we are showing search results.
        if (isSearchResult) return;

        // After every group, append a Shorts section
        const isDeferred = !isFirstGroup;
        const { titleEl, wrapperEl } = buildShortsSection(isDeferred);
        fragment.appendChild(titleEl);
        fragment.appendChild(wrapperEl);

        if (isDeferred) {
            // Reveal the section title + wrapper only when scrolled near
            observeShortsSection(titleEl, wrapperEl, loadRealShorts);
        }
        // First Shorts section loads immediately (not deferred)
        if (isFirstGroup) {
            loadRealShorts(wrapperEl);
        }
    });

    // If there are no items at all, nothing to render
    if (allItems.length === 0) {
        container.appendChild(fragment);
        return;
    }

    container.appendChild(fragment);

    // Observe deferred thumbnail cards for lazy fade-in
    observeLazy(lazyCards);
}
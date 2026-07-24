import { getAccessToken } from '../auth.js';
import { getNotInterestedIds, postNotInterested } from '../general/notInterestedStore.js';

        // 1. DATA ARRAY
        // stored access token for refresh fallback
        let storedAccessToken = null;

        const formatViews = (v) => {
            if (!v || v === 0) return 'No views yet';
            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M views`;
            if (v >= 1000) return `${(v / 1000).toFixed(1)}K views`;
            return `${v} views`;
        };

        const cleanUrl = (url) => {
            if (!url) return '';
            const match = url.match(/https?:\/\/[^/]+\/(https?:\/\/.+)/);
            if (match) return match[1];
            return url;
        };

        let shortsData = [
           
        ];

        // DOM selector used by the action-dots popup
        const popupMenu = document.querySelector('#gsho-context-popup');
        let currentPopupCard = null;

        if (popupMenu) {
            popupMenu.addEventListener('click', async (e) => {
            const option = e.target.closest('.gsho-option-item');
            if (!option) return;
            e.stopPropagation();
            popupMenu.style.display = 'none';
            if (!currentPopupCard) return;
            const contentId = currentPopupCard.dataset.shortId;
            if (!contentId) return;
            const token = await getAccessToken();
                const ok = await postNotInterested(contentId, token);
                if (ok) currentPopupCard.style.display = 'none';
            });
        }

        // tracks each wrapper's independent carousel offset
        const wrapperOffsets = new Map(); // tracks each wrapper's independent carousel offset
        function renderShortsSequentially() {
            const wrappers = Array.from(document.querySelectorAll('.gsho-layout-wrapper'));
            const shortsTitles = Array.from(document.querySelectorAll('.shortsgh'));
            if (wrappers.length === 0) return;

            const VISIBLE = 4;
            const total = shortsData.length;

            wrappers.forEach((wrapper, wrapperIdx) => {
                const shortsTitle = shortsTitles[wrapperIdx];
                const baseStart = wrapperIdx * VISIBLE; // each wrapper owns a base slice of 4 shorts

                // If this wrapper does not have a full base group of shorts, hide it
                if (baseStart + VISIBLE > total) {
                    wrapper.style.display = 'none';
                    wrapper.innerHTML = '';
                    if (shortsTitle) shortsTitle.style.display = 'none';
                    return;
                }

                // Show this wrapper and its title
                wrapper.style.display = '';
                wrapper.style.position = 'relative';
                if (shortsTitle) shortsTitle.style.display = '';

                // Get or initialize this wrapper's local carousel offset
                let localOffset = wrapperOffsets.get(wrapperIdx) || 0;
                // Clamp so we never go out of bounds
                const maxOffset = Math.max(0, total - baseStart - VISIBLE);
                localOffset = Math.max(0, Math.min(localOffset, maxOffset));
                wrapperOffsets.set(wrapperIdx, localOffset);

                const canGoLeft  = localOffset > 0;
                const canGoRight = baseStart + localOffset + VISIBLE < total;

                // Slice the 4 visible shorts for this wrapper
                const visible = shortsData.slice(
                    baseStart + localOffset,
                    baseStart + localOffset + VISIBLE
                );

                // Build card HTML
                const cardsHtml = visible.map((item) => `
                    <div class="gsho-video-card${item.isBanned ? ' banned-thumbnail' : ''}" data-short-id="${item.shortId || ''}" data-banned="${item.isBanned ? '1' : '0'}">
                        <div class="gsho-thumbnail-box">
                            <img src="${item.img}" class="gsho-img-element" alt="Shorts">
                        </div>
                        <div class="gsho-content-row">
                            <div class="gsho-text-stack">
                                <div class="gsho-title-text">${item.title}</div>
                                <div class="gsho-stat-text">${item.views}</div>
                            </div>
                            <button class="gsho-action-dots">
                                <svg viewBox="0 0 24 24" class="gsho-icon-svg"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                            </button>
                        </div>
                    </div>
                `).join('');

                // Inject cards and navigation arrows
                wrapper.innerHTML = `
                    <div class="gsho-carousel-inner">${cardsHtml}</div>
                    <button class="gsho-arrow gsho-arrow-left${canGoLeft ? '' : ' gsho-arrow-hidden'}" aria-label="Previous shorts">&#8249;</button>
                    <button class="gsho-arrow gsho-arrow-right${canGoRight ? '' : ' gsho-arrow-hidden'}" aria-label="Next shorts">&#8250;</button>
                `;

                wrapper.querySelectorAll('.gsho-video-card').forEach((card) => {
                    const shortId = card.dataset.shortId;
                    if (!shortId) return;

                    card.addEventListener('click', (event) => {
                        const actionDots = event.target.closest('.gsho-action-dots');
                        if (actionDots) {
                            event.stopPropagation();
                            currentPopupCard = card;
                            const rect = actionDots.getBoundingClientRect();
                            if (popupMenu) {
                                if (popupMenu.style.display === 'flex') {
                                    popupMenu.style.display = 'none';
                                } else {
                                    popupMenu.style.display = 'flex';
                                    popupMenu.style.top = `${rect.top + window.scrollY + 35}px`;
                                    popupMenu.style.left = `${rect.left - 150}px`;
                                }
                            }
                            return;
                        }

                        if (popupMenu) popupMenu.style.display = 'none';

                        const thumbnailImg = event.target.closest('.gsho-img-element');
                        if (!thumbnailImg) return;
                        if (card.dataset.banned === '1') return;

                        window.location.href = 'Shorts?shortId=' + encodeURIComponent(shortId);
                    });
                });

                // Wire left arrow: decrement this wrapper's local offset by 1
                const leftBtn  = wrapper.querySelector('.gsho-arrow-left');
                const rightBtn = wrapper.querySelector('.gsho-arrow-right');

                if (leftBtn) {
                    leftBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const curr = wrapperOffsets.get(wrapperIdx) || 0;
                        if (curr > 0) {
                            wrapperOffsets.set(wrapperIdx, curr - 1);
                            renderShortsSequentially();
                        }
                    });
                }

                // Wire right arrow: increment this wrapper's local offset by 1
                if (rightBtn) {
                    rightBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const curr = wrapperOffsets.get(wrapperIdx) || 0;
                        if (baseStart + curr + VISIBLE < total) {
                            wrapperOffsets.set(wrapperIdx, curr + 1);
                            renderShortsSequentially();
                        }
                    });
                }
            });
        }

        // renderShorts wrapper — update shortsData then delegate to sequential renderer
        function renderShorts(items) {
            if (!Array.isArray(items)) items = [];
                        // reset all wrapper offsets when new data loads
                            wrapperOffsets.clear(); // reset all wrapper offsets when new data loads
                    // Map items to expected shape in case they already contain formatted fields
                    shortsData = items.map(it => ({
                shortId: it.shortId || '',
                img: it.img || it.thumbnail || '',
                title: it.title || '',
                views: it.views || '',
                isBanned: Boolean(it.isBanned)
            }));
                            // Mark all wrappers as loaded so skeleton injection is skipped on re-render
                            document.querySelectorAll('.gsho-layout-wrapper').forEach(w => {
                                w.dataset.shortsLoaded = 'true';
                            });
            // Wait a tick to ensure any other thumbnail rendering has completed
            setTimeout(renderShortsSequentially, 0);
        }

        // Fetch and render shorts using refresh token pattern, then fallback to stored token
        export async function fetchAndRenderShorts() {
            try {
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

                const response = await fetch('https://valviorabackend2.onrender.com/shortsSummaryApi', {
                    method: 'GET',
                    headers,
                    credentials: 'include'
                });

                if (response.status === 204) {
                    renderShorts([]);
                    return;
                }

                if (!response.ok) {
                    console.error('shortsSummaryApi fetch failed:', response.status);
                    renderShorts([]);
                    return;
                }

                const data = await response.json();

                if (!Array.isArray(data) || data.length === 0) {
                    renderShorts([]);
                    return;
                }

                const mapped = data.map(item => ({
                    shortId: item.shortId || '',
                    img: cleanUrl(item.thumbnail) || '',
                    title: item.title || '',
                    views: formatViews(item.views),
                    isBanned: Boolean(item.isBanned)
                }));

                const notInterestedIds = await getNotInterestedIds();
                const filteredMapped = mapped.filter(item => !notInterestedIds.has(item.shortId));
                renderShorts(filteredMapped);

            } catch (err) {
                console.error('fetchAndRenderShorts error:', err);
                renderShorts([]);
            }
        }

        // Note: fetchAndRenderShorts is called by renderThumbnails.js after DOM injection
    
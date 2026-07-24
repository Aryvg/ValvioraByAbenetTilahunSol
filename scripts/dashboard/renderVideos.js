import { getAccessToken } from '../auth.js';
import { updateVideoAllApis } from './updateVideoApi.js';
import { decodeText } from '../general/decodeText.js';

async function deleteVideo(videoId, videoType) {
    const confirmed = confirm('Delete this item forever? This cannot be undone.');
    if (!confirmed) return;

    const token = await getAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };

    try {
        if (videoType === 'shorts') {
            // Shorts: single DELETE to aggregatedShortsApi (backend handles Cloudinary cleanup)
            const r = await fetch('https://valviorabackend2.onrender.com/aggregatedShortsApi', {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ shortId: videoId })
            });
            if (!r.ok && r.status !== 204) {
                const err = await r.json().catch(() => ({}));
                alert('Delete failed: ' + (err?.message || r.status));
                return;
            }
        } else if (videoType === 'playlist') {
            // Playlists: single DELETE to playlistHomeApi
            const r = await fetch('https://valviorabackend2.onrender.com/playlistHomeApi', {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ playlistId: videoId })
            });
            if (!r.ok && r.status !== 204) {
                const err = await r.json().catch(() => ({}));
                alert('Delete failed: ' + (err?.message || r.status));
                return;
            }
        } else {
            // Videos: existing four-API fan-out delete — keep exactly as before
            const body = JSON.stringify({ videoId });
            const [r1, r2, r3, r4] = await Promise.all([
                fetch('https://valviorabackend2.onrender.com/aggregatedApi', { method: 'DELETE', headers, body }),
                fetch('https://valviorabackend2.onrender.com/thumbnailApi', { method: 'DELETE', headers, body }),
                fetch('https://valviorabackend2.onrender.com/videoContentApi', { method: 'DELETE', headers, body }),
                fetch('https://valviorabackend2.onrender.com/videoSummaryApi', { method: 'DELETE', headers, body })
            ]);
            if (!r1.ok && r1.status !== 204) {
                const err = await r1.json().catch(() => ({}));
                alert('Delete failed: ' + (err?.message || r1.status));
                return;
            }
            [r2, r3, r4].forEach((r, i) => {
                const names = ['thumbnailApi', 'videoContentApi', 'videoSummaryApi'];
                if (!r.ok && r.status !== 204) {
                    console.warn(`Delete from ${names[i]} returned ${r.status} — data may already be gone.`);
                }
            });
        }

        // Remove the row from the table immediately
        const row = document.querySelector(`.delete-trigger[data-id="${videoId}"]`)?.closest('tr');
        if (row) row.remove();

        const totalEl = document.getElementById('totalVideosCount');
        if (totalEl) totalEl.innerText = Math.max(0, parseInt(totalEl.innerText || '0') - 1);

    } catch (err) {
        console.error('deleteVideo error:', err?.message || err);
        alert('An error occurred while deleting. Please try again.');
    }
}



async function fetchVideosFromApi(token, attempt = 1) {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 2000;
    const TIMEOUT_MS = 30000;

    try {
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch('https://valviorabackend2.onrender.com/aggregatedApi', {
            method: 'GET',
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.status === 204) return [];

        if ([502, 503, 504].includes(res.status) && attempt < MAX_ATTEMPTS) {
            console.warn(`GET /aggregatedApi attempt ${attempt} got ${res.status}, retrying...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return fetchVideosFromApi(token, attempt + 1);
        }

        if (!res.ok) {
            console.error(`GET /aggregatedApi failed with status ${res.status}`);
            if (attempt < MAX_ATTEMPTS) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
                return fetchVideosFromApi(token, attempt + 1);
            }
            return [];
        }

        const data = await res.json();
        return Array.isArray(data) ? data : [];

    } catch (err) {
        if (err?.name === 'AbortError') {
            console.error('GET /aggregatedApi timed out after 30 seconds.');
        } else {
            console.error('GET /aggregatedApi error:', err?.message || err);
        }
        if (attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return fetchVideosFromApi(token, attempt + 1);
        }
        return [];
    }
}

async function fetchShortsFromApi(token, attempt = 1) {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 2000;
    const TIMEOUT_MS = 30000;

    try {

        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch('https://valviorabackend2.onrender.com/aggregatedShortsApi?mine=1', {
            method: 'GET',
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.status === 204) return [];

        if ([502, 503, 504].includes(res.status) && attempt < MAX_ATTEMPTS) {
            console.warn(`GET /aggregatedShortsApi attempt ${attempt} got ${res.status}, retrying...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return fetchShortsFromApi(token, attempt + 1);
        }

        if (!res.ok) {
            console.error(`GET /aggregatedShortsApi failed with status ${res.status}`);
            if (attempt < MAX_ATTEMPTS) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
                return fetchShortsFromApi(token, attempt + 1);
            }
            return [];
        }

        const data = await res.json();
        return Array.isArray(data) ? data : [];

    } catch (err) {
        if (err?.name === 'AbortError') {
            console.error('GET /aggregatedShortsApi timed out after 30 seconds.');
        } else {
            console.error('GET /aggregatedShortsApi error:', err?.message || err);
        }
        if (attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return fetchShortsFromApi(token, attempt + 1);
        }
        return [];
    }
}

async function fetchPlaylistsFromApi(token) {
    try {

        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('https://valviorabackend2.onrender.com/playlistVideoApi', {
            method: 'GET', headers
        });
        if (!res.ok || res.status === 204) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('fetchPlaylistsFromApi error:', err?.message || err);
        return [];
    }
}

export async function renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem }) {
    const tableBody = document.getElementById("videoTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">Loading videos...</td></tr>`;

    const token = await getAccessToken();
    const [apiVideos, apiShorts, apiPlaylists] = await Promise.all([
        fetchVideosFromApi(token),
        fetchShortsFromApi(token),
        fetchPlaylistsFromApi(token)
    ]);

    const videos = (apiVideos.map(v => ({
        id: v.videoId,
        cid: v.channelId,
        title: v.title || '',
        thumb: v.image || '',
        video: v.video || '',
        shortDesc: v.shortDescription || '',
        desc: v.DetailedDescription || '',
        views: v.Views ?? 0,
        date: v.Time ? new Date(v.Time).toLocaleDateString() : '',
        type: 'video'
    })) || []).concat((apiShorts.map(s => ({
        id: s.shortId,
        cid: s.channelId,
        title: s.title || '',
        thumb: s.thumbnail || '',
        video: s.videoUrl || '',
        shortDesc: '',
        desc: '',
        views: s.views ?? 0,
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
        type: 'shorts'
    })) || []));

    const playlistRows = apiPlaylists.map(pl => ({
        id:        pl.playlistId,
        type:      'playlist',
        title:     pl.playlistTitle || '',
        thumb:     pl.thumbnail || '',
        shortDesc: `${pl.videoCount || 0} video${pl.videoCount !== 1 ? 's' : ''}`,
        desc:      'Grouped content',
        views:     0,
        date:      '',
        video:     '',
        cid:       pl.channelId || ''
    }));

    const allItems = [...videos, ...playlistRows];

    tableBody.innerHTML = '';

    // All three APIs already filter by the authenticated user's channel server-side.
    // No client-side channelId filtering needed.
    const channelVideos = allItems;

    const totalEl = document.getElementById('totalVideosCount');
    if (totalEl) totalEl.innerText = channelVideos.length;

    if (channelVideos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No videos found.</td></tr>`;
        return;
    }

    channelVideos.forEach(item => {
        const isPl = item.type === 'playlist';
        const isShort = item.type === 'shorts';
        const safeTitle = decodeText(item.title || '');
        const safeShortDesc = decodeText(item.shortDesc || '');
        const safeDesc = decodeText(item.desc || '');
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Content Type">
                <div class="dash908-video-cell">
                    <img class="dash908-thumb-mini media-trigger" data-id="${item.id}" data-type="${item.type}">
                    <span>
                        ${isPl ? `<span class="playlist-label">Playlist</span>` : ''}
                        ${isShort ? `<span class="shorts-label">Shorts</span>` : ''}
                        ${safeTitle}
                    </span>
                </div>
            </td>
            <td data-label="Short Desc"><div class="dash908-desc-text">${safeShortDesc || '--'}</div></td>
            <td data-label="Detailed Desc"><div class="dash908-desc-text">${isPl ? 'Grouped content' : (safeDesc || '--')}</div></td>
            <td data-label="Date">${item.date}</td>
            <td data-label="Views">${item.views}</td>
            <td data-label="Actions">
                <div class="dash908-action-group">
                    <button class="dash908-btn-action dash908-btn-edit edit-trigger"
                        data-id="${item.id}"
                        data-type="${item.type}"
                        data-title="${safeTitle.replace(/"/g, '&quot;')}"
                        data-shortdesc="${safeShortDesc.replace(/"/g, '&quot;')}"
                            data-desc="${safeDesc.replace(/"/g, '&quot;')}"
                            data-thumb="${(item.thumb || '').replace(/"/g, '&quot;')}">
                        <i class="fas fa-edit js-save-changes"></i>
                    </button>
                    <button class="dash908-btn-action dash908-btn-delete delete-trigger" data-id="${item.id}" data-type="${item.type}"><i class="fas fa-trash"></i></button>
                </div>
            </td>`;

        // Set image src safely via DOM property to avoid innerHTML escaping issues
        const img = row.querySelector('.media-trigger');
        const thumbSrc = item.thumb || '';
        try {
            img.src = thumbSrc;
        } catch (e) {
            img.setAttribute('src', thumbSrc);
        }
        // store Cloudinary video URL on the element for playback
        img.setAttribute('data-video', item.video || '');
        img.onerror = () => { img.src = 'https://placehold.co/120x68?text=No+Image'; };

        tableBody.appendChild(row);
    });

    document.querySelectorAll('.media-trigger').forEach(img => {
        img.addEventListener('click', () => {
            const id = img.dataset.id;
            const videoUrl = img.getAttribute('data-video') || '';
            if (img.dataset.type === 'playlist') {
                viewPlaylist(id);
            } else {
                playVideo(id, videoUrl);
            }
        });
    });

    document.querySelectorAll('.edit-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const type = btn.dataset.type;
            if (type === 'playlist') {
                editPlaylist(id);
            } else {
                editContent(id, type, btn.dataset.title || '', btn.dataset.shortdesc || '', btn.dataset.desc || '');
            }
        });
    });

    document.querySelectorAll('.edit-trigger').forEach(btn => {
        const icon = btn.querySelector('.js-save-changes');
        if (!icon) return; // only wire up buttons that have the js-save-changes icon
        btn.setAttribute('data-api-video', 'true');
    });

    document.querySelectorAll('.delete-trigger').forEach(btn => {
        btn.addEventListener('click', () => deleteVideo(btn.dataset.id, btn.dataset.type));
    });
}

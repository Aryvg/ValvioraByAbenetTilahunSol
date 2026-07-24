import { buildSharePopupMarkup, setupSharePopup } from './sharePopup.js';
import { setupDownloadButton } from './downloadButton.js';
import { setupSubscribe } from './subscribeButton.js';
import { initializeVideoViewTracker } from './viewTracker.js';
import { decodeText } from '../general/decodeText.js';

let storedAccessToken = null;

function resolveVideoSrc(rawUrl) {
    if (!rawUrl) return '';
    const marker = '/media/file/';
    const idx = rawUrl.indexOf(marker);
    if (idx === -1) return rawUrl;
    const encodedPart = rawUrl.slice(idx + marker.length);
    try {
        let decoded = decodeURIComponent(encodedPart);
        decoded = decoded
            .replace(/&#x2F;/gi, '/')
            .replace(/&#x5C;/gi, '/')
            .replace(/&/gi, '&');
        if (/^https?:\/\//i.test(decoded)) return decoded;
    } catch (e) {
        console.warn('resolveVideoSrc: could not decode URL', e);
    }
    return rawUrl;
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

async function toggleSubscribe(button, videoId, token, delta) {
  if (!button || !videoId || !token) return;
  const response = await fetch(`https://valviorabackend2.onrender.com/videoSummaryApi/${encodeURIComponent(videoId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ subscribeDelta: delta })
  });

  if (!response.ok) throw new Error(`subscribe update failed (${response.status})`);
}

export async function renderVideoById(explicitVideoId) {
  try {
    const container = document.querySelector('.video-container');
    if (!container) return;

    container.innerHTML = '<div class="video-loading">Loading video…</div>';

    const params = new URLSearchParams(window.location.search);
    const videoId = explicitVideoId || params.get('videoId') || params.get('id');

    if (!videoId) {
      const playlistId = params.get('playlistId');
      if (playlistId) {
        return;
      }
      container.innerHTML = '<div class="video-not-found">No video ID found in the URL.</div>';
      return;
    }

    const token = await getAuthToken();
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

    const response = await fetch(
      `https://valviorabackend2.onrender.com/youtubeSecondpageapi/${encodeURIComponent(videoId)}`,
      { headers }
    );

    if (response.status === 401 || response.status === 403) {
      container.innerHTML = '<div class="video-not-found">You are not authorized. Please log in.</div>';
      return;
    }
    if (response.status === 204) {
      container.innerHTML = '<div class="video-not-found">Video not found.</div>';
      return;
    }
    if (!response.ok) {
      container.innerHTML = `<div class="video-not-found">Failed to load video (server error ${response.status}). Please try again.</div>`;
      return;
    }

    let data = await response.json();

    // Defensive: if the backend returned an array, find the matching video
    if (Array.isArray(data)) {
      data = data.find(v => v.videoId === videoId) || null;
    }

    if (!data || typeof data !== 'object') {
      container.innerHTML = '<div class="video-not-found">Video not found.</div>';
      return;
    }

    const src              = resolveVideoSrc(data.videoFile           || '');
    const videoTitle       = decodeText(data.title || '');
    const rawChannelName   = data.channelInfo?.channelName            || data.channelId || '';
    const formatChannelName = (name) => {
      const text = (name || '').trim();
      if (!text) return '';

      const maxChars = typeof window !== 'undefined' && window.innerWidth <= 480
        ? 12
        : typeof window !== 'undefined' && window.innerWidth <= 768
          ? 16
          : 20;

      if (text.length <= maxChars) return text;

      const sliceLimit = Math.max(4, maxChars - 3);
      let shortened = text.slice(0, sliceLimit).trimEnd();
      const lastSpace = shortened.lastIndexOf(' ');
      if (lastSpace > 4) {
        shortened = shortened.slice(0, lastSpace).trimEnd();
      }

      return `${shortened}...`;
    };
    const channelName      = formatChannelName(rawChannelName);
    const channelProfile   = data.channelInfo?.channelProfile         || 'images/wwe.png';
    const views            = data.views != null ? data.views : null;
    const videoExplanation = decodeText(data.videoDescription || '');
    const videoDescription = decodeText(data.detailedDescription || '');
    const likes            = data.Likes != null ? String(data.Likes)    : '0';
    const dislikes         = data.Dislikes != null ? String(data.Dislikes) : '0';
    const time             = data.time != null ? String(data.time)      : '0:00';
    const shareUrl         = `${window.location.origin}/VelvioraWatch?videoId=${encodeURIComponent(videoId)}`;
    const subscribeCount      = data.subscribe != null ? String(data.subscribe) : 'unsubscribed yet';

    const labelViews = (value) => {
      if (value === null || value === undefined) return 'No views data';
      const num = Number(value);
      if (!Number.isNaN(num)) {
        return num === 1 ? '1 view' : `${value} views`;
      }
      return `${String(value)} views`;
    };

    const parseNumber = (v) => {
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
    };
    const fmt = (n) => {
      if (n == null || Number.isNaN(n)) return '0';
      const abs = Math.abs(n);
      if (abs >= 1e12) return `${+(n / 1e12).toFixed(2).replace(/\.00$/, '')}T`;
      if (abs >= 1e9) return `${+(n / 1e9).toFixed(2).replace(/\.00$/, '')}B`;
      if (abs >= 1e6) return `${+(n / 1e6).toFixed(2).replace(/\.00$/, '')}M`;
      if (abs >= 1e3) return `${+(n / 1e3).toFixed(2).replace(/\.00$/, '')}k`;
      return String(n);
    };

    const videoContainer = `
        <video class="main-video"
                src="${src}" controls autoplay playsinline
                width="1000"></video>
            <div class="video-title">${videoTitle}</div>
            <div class="vid-bottom">
                <div class="wider-vid-container">
                    <div class="channel-profile">
                        <img class="vid-image" src="${channelProfile}"/>
                    </div>
                    <div class="na">
                        <div class="vid-channel-name">${channelName}</div>
                        <div class="vid-view">${subscribeCount} subscribers</div>
                    </div>
                    <div class="subscribe-button">
                        <button class="subscribe">Subscribe</button>
                    </div>
                </div>
                <div class="right-vid">
                    <button class="like-button" aria-pressed="false" title="Like">
                        <span class="like-icon"></span>
                        <span class="like-text">Like</span>
                        <span class="like-count">${likes}</span>
                    </button>
                    <button class="dislike-button" aria-pressed="false" title="Dislike">
                        <span class="dislike-icon"></span>
                        <span class="dislike-text">Dislike</span>
                        <span class="dislike-count">${dislikes}</span>
                    </button>
                    <div class="share-button" role="button" title="Share">share</div>
                    <div class="download-button" role="button" title="Download">Download</div>

                </div>
            </div>
            <div class="description-section">
                <div class="description-title">${labelViews(views)} ${time}</div>
                <div class="description-text">
                    <div class="video-explanation">${videoExplanation}</div>
                    <div class="video-description" style="display:none">${videoDescription}</div>
                    <button class="show-more-button" aria-expanded="false">...more</button>
                </div>

            </div>
            ${buildSharePopupMarkup(shareUrl)}
            <div class="comment-section">
                <div class="comment-description">
                    <div class="how-much">0 Comments</div>
                    <div>
                        <div class="sort">Sort by</div>
                    </div>
                </div>
                <div class="comment-input">
                    <div class="comment-profile-picture">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23303030'/%3E%3C/svg%3E" class="comment-image" />
                    </div>
                    <input class="comment-box js-comment-box" placeholder="Add a comment" />
                </div>
                <div class="comments">
                    <!-- comments will be rendered here from localStorage -->
                </div>
            </div>
    `;

    container.innerHTML = videoContainer;
    document.dispatchEvent(new CustomEvent('video-rendered', { bubbles: false }));

    setupSharePopup(container);

    setupDownloadButton(container, src, videoTitle);

    // Initialize subscribe UI/logic from module (keeps same behavior)
    try {
      setupSubscribe(container, data.channelId || videoId, subscribeCount);
    } catch (e) {
      console.warn('Failed to initialize subscribe module', e);
    }

    // Helpers: parse formatted counts and format numbers (defined earlier)

    // Like/dislike toggle logic
    const likeBtn = container.querySelector('.like-button');
    const dislikeBtn = container.querySelector('.dislike-button');
    const likeCountEl = container.querySelector('.like-count');
    const dislikeCountEl = container.querySelector('.dislike-count');
    const likeTextEl = container.querySelector('.like-text');
    const dislikeTextEl = container.querySelector('.dislike-text');
    const storageKey = (type) => `${type}:${videoId}`;

    const setReactionState = (button, textEl, activeText, defaultText, isActive) => {
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (textEl) textEl.textContent = isActive ? activeText : defaultText;
    };

    const sendUpdate = async (body) => {
      const token = await getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;
      try {
        await fetch('https://valviorabackend2.onrender.com/videoSummaryApi', {
          method: 'PUT', headers, body: JSON.stringify(body)
        });
      } catch (e) {
        console.warn('Failed to send update', e);
      }
    };

    if (likeBtn && dislikeBtn && likeCountEl && dislikeCountEl) {
      if (localStorage.getItem(storageKey('liked')) === '1') {
        setReactionState(likeBtn, likeTextEl, 'Liked', 'Like', true);
      } else {
        setReactionState(likeBtn, likeTextEl, 'Liked', 'Like', false);
      }

      if (localStorage.getItem(storageKey('disliked')) === '1') {
        setReactionState(dislikeBtn, dislikeTextEl, 'Disliked', 'Dislike', true);
      } else {
        setReactionState(dislikeBtn, dislikeTextEl, 'Disliked', 'Dislike', false);
      }

      likeBtn.addEventListener('click', async () => {
        const liked = localStorage.getItem(storageKey('liked')) === '1';
        const disliked = localStorage.getItem(storageKey('disliked')) === '1';
        let likes = parseNumber(likeCountEl.textContent);
        let dislikes = parseNumber(dislikeCountEl.textContent);
        if (!liked) {
          likes += 1;
          localStorage.setItem(storageKey('liked'),'1');
          setReactionState(likeBtn, likeTextEl, 'Liked', 'Like', true);
          if (disliked) { dislikes = Math.max(0, dislikes - 1); localStorage.removeItem(storageKey('disliked')); setReactionState(dislikeBtn, dislikeTextEl, 'Disliked', 'Dislike', false); }
        } else {
          likes = Math.max(0, likes - 1);
          localStorage.removeItem(storageKey('liked'));
          setReactionState(likeBtn, likeTextEl, 'Liked', 'Like', false);
        }
        likeCountEl.textContent = fmt(likes);
        dislikeCountEl.textContent = fmt(dislikes);
        sendUpdate({ videoId, Likes: likes, Dislikes: dislikes });
      });

      dislikeBtn.addEventListener('click', async () => {
        const disliked = localStorage.getItem(storageKey('disliked')) === '1';
        const liked = localStorage.getItem(storageKey('liked')) === '1';
        let likes = parseNumber(likeCountEl.textContent);
        let dislikes = parseNumber(dislikeCountEl.textContent);
        if (!disliked) {
          dislikes += 1;
          localStorage.setItem(storageKey('disliked'),'1');
          setReactionState(dislikeBtn, dislikeTextEl, 'Disliked', 'Dislike', true);
          if (liked) { likes = Math.max(0, likes - 1); localStorage.removeItem(storageKey('liked')); setReactionState(likeBtn, likeTextEl, 'Liked', 'Like', false); }
        } else {
          dislikes = Math.max(0, dislikes - 1);
          localStorage.removeItem(storageKey('disliked'));
          setReactionState(dislikeBtn, dislikeTextEl, 'Disliked', 'Dislike', false);
        }
        likeCountEl.textContent = fmt(likes);
        dislikeCountEl.textContent = fmt(dislikes);
        sendUpdate({ videoId, Likes: likes, Dislikes: dislikes });
      });
    }

    const videoCountLabelEl = container.querySelector('.description-title');
    const currentTimeText = time || '';
    const updateViewsLabel = (nextViews) => {
      if (!videoCountLabelEl) return;
      const num = Number(nextViews);
      const formattedViews = Number.isFinite(num)
        ? num === 1 ? '1 view' : `${num} views`
        : String(nextViews);
      const suffix = currentTimeText ? ` ${currentTimeText}` : '';
      videoCountLabelEl.textContent = `${formattedViews}${suffix}`.trim();
    };

    const mainVideoEl = container.querySelector('.main-video');
    if (mainVideoEl) {
      mainVideoEl.muted = false;
      const playPromise = mainVideoEl.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((err) => {
          console.warn('Autoplay blocked or failed:', err);
        });
      }

      const playlistId = params.get('playlistId');
      initializeVideoViewTracker(mainVideoEl, videoId, updateViewsLabel, playlistId);

      mainVideoEl.addEventListener('ended', () => {
        const currentId = new URLSearchParams(window.location.search).get('videoId') || videoId;

        const playlistContainer = document.querySelector('.playlist-container .js-sidebar-component-containers');
        const sidebarContainer = document.querySelector('.js-sidebar-component-container');
        if (!sidebarContainer) return;

        const playlistImages = playlistContainer ? Array.from(playlistContainer.querySelectorAll('.side-image')) : [];
        const sidebarImages = Array.from(sidebarContainer.querySelectorAll('.side-image'));
        if (sidebarImages.length === 0) return;

        const isLastPlaylistVideo = playlistImages.length > 0 && playlistImages[playlistImages.length - 1].dataset.id === currentId;
        const nextImage = isLastPlaylistVideo
          ? sidebarImages[0]
          : sidebarImages.find((img) => img.dataset.id === currentId)
            ? sidebarImages[(sidebarImages.findIndex((img) => img.dataset.id === currentId) + 1) % sidebarImages.length]
            : sidebarImages[0];

        if (nextImage) nextImage.click();
      });
    }
  } catch (err) {
    console.error('renderVideoById error:', err);
    const container = document.querySelector('.video-container');
    if (container) {
      container.innerHTML = '<div class="video-not-found">Failed to load video. Please try again.</div>';
    }
  }
}

if (document.querySelector('.video-container')) {
  renderVideoById().catch((err) => {
    console.error('Initial renderVideoById failed:', err);
    const c = document.querySelector('.video-container');
    if (c) c.innerHTML = '<div class="video-not-found">Failed to load video.</div>';
  });
}

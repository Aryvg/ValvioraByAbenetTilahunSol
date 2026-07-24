import { getAccessToken, clearAccessToken } from '../auth.js';

const VIEW_SECONDS = 30;

function parseJwtUsername(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = atob(payload);
    const data = JSON.parse(decoded);
    return data?.UserInfo?.username || data?.userInfo?.username || null;
  } catch (err) {
    return null;
  }
}

export function initializeVideoViewTracker(videoElement, videoId, onViewRecorded, playlistId) {
  if (!videoElement || (!videoId && !playlistId)) return;

  let viewSent = false;
  let videoViewSent = false;
  let playlistViewSent = false;

  const buildBody = (isPlaylist) => isPlaylist
    ? { playlistId, views: 1 }
    : { videoId, Views: 1 };

  const buildUrl = (isPlaylist) => isPlaylist
    ? 'https://valviorabackend2.onrender.com/playlistHomeApi'
    : 'https://valviorabackend2.onrender.com/videoSummaryApi';

  const fetchView = async (url, body, accessToken) => {
    try {
      return await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.warn('Failed to send view count update', err);
      return null;
    }
  };

  const sendView = async () => {
    if (viewSent) return;

    const token = await getAccessToken();
    if (!token) return;

    const viewRequests = [];
    if (videoId && !videoViewSent) {
      viewRequests.push({ url: buildUrl(false), body: buildBody(false), type: 'video' });
    }
    if (playlistId && !playlistViewSent) {
      viewRequests.push({ url: buildUrl(true), body: buildBody(true), type: 'playlist' });
    }
    if (viewRequests.length === 0) return;

    const executeRequests = async (accessToken) => {
      return Promise.all(viewRequests.map((req) => fetchView(req.url, req.body, accessToken).then((res) => ({ ...req, response: res }))));
    };

    let results = await executeRequests(token);
    const needsRefresh = results.some(r => r.response && (r.response.status === 401 || r.response.status === 403));
    if (needsRefresh) {
      clearAccessToken();
      const refreshedToken = await getAccessToken();
      if (refreshedToken && refreshedToken !== token) {
        results = await executeRequests(refreshedToken);
      }
    }

    for (const result of results) {
      const { response, type } = result;
      if (!response) continue;
      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        console.warn(`${type === 'playlist' ? 'Playlist' : 'Video'} view update failed:`, response.status, bodyText);
        continue;
      }
      if (type === 'video') {
        videoViewSent = true;
        const json = await response.json().catch(() => null);
        if (typeof onViewRecorded === 'function') {
          onViewRecorded(json?.Views ?? 1);
        }
      } else if (type === 'playlist') {
        playlistViewSent = true;
      }
    }

    viewSent = true;
  };

  const onTimeUpdate = () => {
    if (viewSent) {
      videoElement.removeEventListener('timeupdate', onTimeUpdate);
      return;
    }
    if (videoElement.currentTime >= VIEW_SECONDS) {
      sendView();
      videoElement.removeEventListener('timeupdate', onTimeUpdate);
    }
  };

  videoElement.addEventListener('timeupdate', onTimeUpdate);
}

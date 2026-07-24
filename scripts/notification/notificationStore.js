import { getAccessToken } from '../auth.js';

const NOTIFICATION_API_URL = 'https://valviorabackend2.onrender.com/notificationApi';

let cachedNotifications = [];
let cachedVideoCount = 0;
const notificationChannelMap = new Map(); // videoId -> channelId, for quick lookup

let inFlightFetch = null;

async function requestNotifications() {
    const token = await getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(NOTIFICATION_API_URL, {
        credentials: 'include',
        headers
    });

    if (response.status === 204) {
        return { notifications: [], videoCount: 0 };
    }

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
        notifications: Array.isArray(data?.notifications) ? data.notifications : [],
        videoCount: Number(data?.videoCount) || 0
    };
}

// Fetches + caches notifications. If a fetch is already in flight (e.g. the
// badge and the dropdown both ask around the same time), every caller
// shares the one request instead of firing duplicate GETs.
export async function fetchNotifications() {
    if (inFlightFetch) return inFlightFetch;

    inFlightFetch = requestNotifications()
        .then((result) => {
            cachedNotifications = result.notifications;
            cachedVideoCount = result.videoCount;

            notificationChannelMap.clear();
            cachedNotifications.forEach((item) => {
                if (item?.videoId && item?.channelId) {
                    notificationChannelMap.set(item.videoId, item.channelId);
                }
            });

            return { notifications: cachedNotifications, videoCount: cachedVideoCount };
        })
        .catch((error) => {
            console.warn('Failed to load notifications', error);
            return { notifications: cachedNotifications, videoCount: cachedVideoCount };
        })
        .finally(() => {
            inFlightFetch = null;
        });

    return inFlightFetch;
}

// Returns the channelId for a videoId if that video is one of the cached
// notifications, otherwise null. Used by the homepage thumbnail click handler.
export function getChannelIdForVideo(videoId) {
    return notificationChannelMap.get(videoId) || null;
}

// POSTs the read-state update. Callers should call this without awaiting it
// (use .catch() instead) so a slow/failed request never blocks navigation.
export async function markNotificationRead(videoId, channelId) {
    if (!videoId || !channelId) return;

    const token = await getAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await fetch(NOTIFICATION_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ videoId, channelId, isRead: false })
    });

    if (!response.ok && response.status !== 204) {
        throw new Error(`Request failed with status ${response.status}`);
    }
}

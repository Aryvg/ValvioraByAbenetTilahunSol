
        import { fetchNotifications, markNotificationRead } from './notificationStore.js';
        import { getAccessToken } from '../auth.js';
        import { postNotInterested, getNotInterestedIds } from '../general/notInterestedStore.js';

        function formatRelativeTime(createdAt) {
            if (!createdAt) return '';
            const ms = new Date(createdAt).getTime();
            if (Number.isNaN(ms)) return '';

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
        }

        function truncateNotificationTitle(title) {
            if (typeof title !== 'string') return '';

            const trimmed = title.trim();
            if (!trimmed) return '';

            const maxLength = 45;
            if (trimmed.length <= maxLength) return trimmed;

            return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
        }

        async function renderNotifications() {
            const list = document.getElementById('notificationList');
            if (!list) return;

            const { notifications } = await fetchNotifications();
            const notInterestedIds = await getNotInterestedIds();
            const visibleNotifications = notifications.filter(n => !notInterestedIds.has(n.videoId));

            list.innerHTML = '';

            if (!visibleNotifications.length) {
                const empty = document.createElement('div');
                empty.className = 'noti896g-section-label';
                empty.innerText = 'No notifications yet';
                list.appendChild(empty);
                return;
            }

            const newestFirst = [...visibleNotifications].reverse();

            newestFirst.forEach((item) => {
                const notiItem = document.createElement('div');
                notiItem.className = `noti896g-item ${item.isRead ? '' : 'noti896g-is-unread'}`;
                notiItem.dataset.videoId = item.videoId;
                notiItem.dataset.channelId = item.channelId;

                notiItem.innerHTML = `
                    <div class="noti896g-unread-dot"></div>
                    <div class="noti896g-avatar-container">
                        <img src="${item.profilePicture}" class="noti896g-avatar" alt="logo">
                    </div>
                    <div class="noti896g-text-box">
                        <span class="noti896g-message">${truncateNotificationTitle(item.title)}</span>
                        <span class="noti896g-timestamp">${formatRelativeTime(item.createdAt)}</span>
                    </div>
                    <div class="noti896g-right-assets">
                        <img src="${item.image}" class="noti896g-thumbnail" alt="thumb">
                        <div class="noti896g-menu-wrapper">
                            <div class="noti896g-menu-btn" role="button" tabindex="0" aria-label="More notification options">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                            </div>
                            <div class="noti896g-menu-popup" role="menu" aria-label="Notification options">
                                <button type="button" class="noti896g-menu-action" role="menuitem">
                                    <span class="noti896g-menu-icon" aria-hidden="true">🙅</span>
                                    <span>Not interested</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                list.appendChild(notiItem);
            });
        }

        document.getElementById('notificationList')?.addEventListener('click', async (e) => {
            const menuBtn = e.target.closest('.noti896g-menu-btn');
            const actionBtn = e.target.closest('.noti896g-menu-action');

            if (menuBtn) {
                e.stopPropagation();
                const wrapper = menuBtn.closest('.noti896g-menu-wrapper');
                const popup = wrapper?.querySelector('.noti896g-menu-popup');
                if (popup) {
                    const isOpen = popup.style.display === 'flex';
                    document.querySelectorAll('.noti896g-menu-popup').forEach((openPopup) => {
                        openPopup.style.display = 'none';
                    });
                    popup.style.display = isOpen ? 'none' : 'flex';
                }
                return;
            }

            if (actionBtn) {
                e.stopPropagation();
                const popup = actionBtn.closest('.noti896g-menu-popup');
                if (popup) popup.style.display = 'none';
                const item = actionBtn.closest('.noti896g-item');
                if (!item) return;
                const videoId = item.dataset.videoId;
                const channelId = item.dataset.channelId;
                if (!videoId || !channelId) return;

                item.style.display = 'none';

                const badge = document.querySelector('.notification-number');
                if (badge) {
                    const currentText = badge.textContent?.trim() || '';
                    const currentCount = Number(currentText.replace(/\D/g, '')) || 0;
                    const nextCount = Math.max(0, currentCount - 1);
                    if (nextCount > 0) {
                        badge.style.display = '';
                        badge.textContent = nextCount > 9 ? '+9' : String(nextCount);
                    } else {
                        badge.style.display = 'none';
                        badge.textContent = '';
                    }
                }

                const token = await getAccessToken();
                void postNotInterested(videoId, token).catch(() => {});
                void markNotificationRead(videoId, channelId).catch((err) => {
                    console.warn('Failed to send notification action', err);
                });
                return;
            }

            const item = e.target.closest('.noti896g-item');
            if (!item) return;

            const { videoId, channelId } = item.dataset;
            if (!videoId || !channelId) return;

            item.style.display = 'none';

            const badge = document.querySelector('.notification-number');
            if (badge) {
                const currentText = badge.textContent?.trim() || '';
                const currentCount = Number(currentText.replace(/\D/g, '')) || 0;
                const nextCount = Math.max(0, currentCount - 1);
                if (nextCount > 0) {
                    badge.style.display = '';
                    badge.textContent = nextCount > 9 ? '+9' : String(nextCount);
                } else {
                    badge.style.display = 'none';
                    badge.textContent = '';
                }
            }

            markNotificationRead(videoId, channelId).catch((err) => {
                console.warn('Failed to mark notification as read', err);
            });

            window.location.href = `VelvioraWatch?videoId=${encodeURIComponent(videoId)}`;
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.noti896g-menu-popup').forEach((popup) => {
                popup.style.display = 'none';
            });
        });

        renderNotifications();
    
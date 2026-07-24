import { renderVideoById } from './Video-container.js';
import { headerComponent, headerComponents, youtubeHeader, populateNotificationBadge, populateProfileButton } from '../general/Header.js';
import { middleSection } from './middleSection.js';
import { menuesContainerComponent } from '../general/menues-container.js';
import { showConfetti } from './showConfetti.js';
import { expandDescription } from './expandDescription.js';
import { collapseDescription } from './collapseDescription.js';
import { getSidebarList, initSidebarLazyLoading } from './sidebarListComponent.js';
import { setupNotificationDropdown } from '../notification/notificationDropdown.js';
import { setupProfileDropdown } from '../account/profileDropdown.js';
import { getAccessToken, applyAdminNavVisibility } from '../auth.js';
import { initPresence } from '../presence.js';
import { setupCreateButton } from '../general/setupCreateButton.js';
import { setupSidebarPopupTriggers } from '../general/sidebarSharedContent.js';

// If this page is restored from the browser's back/forward cache (e.g. the
// user clicked Back after reading a notification), no script re-runs on its
// own — the DOM is restored exactly as it was, badge and all. Re-fetch just
// the notification badge in that case so it reflects any read-state change
// made while the user was away.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        populateNotificationBadge();
        populateProfileButton();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.menues-main-container').innerHTML = menuesContainerComponent;
    document.querySelector('.sidebar-second-page').innerHTML = menuesContainerComponent;
    setupSidebarPopupTriggers();
    document.querySelector('.middle-sections').innerHTML = middleSection;
    document.querySelector('.youtube-header').innerHTML = headerComponents;
    applyAdminNavVisibility();
    initPresence();
    // Call after header is rendered so .notification-container exists
    populateNotificationBadge();
    populateProfileButton();
    setupNotificationDropdown();
    setupProfileDropdown();
    setupCreateButton();
    let bigContainer = document.querySelector('.menues-main-container');

    // Hide bigContainer when clicking menues-main-container, but NOT when clicking menues-container
    bigContainer.addEventListener('click', function (e) {
        // If the click is directly on menues-main-container and NOT inside menues-container
        if (e.target === bigContainer) {
            bigContainer.style.display = 'none';
        }
    });

    // Prevent hiding when clicking inside menues-container
    const menuesContainer = bigContainer.querySelector('.menues-container');
    if (menuesContainer) {
        menuesContainer.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent event from bubbling to menues-main-container
        });
    }

    document.querySelector('.menu').addEventListener('click', () => {
        bigContainer.style.display = 'block';
    });
    // Attach menu-lfs event listener after DOM update
    const menuLfs = bigContainer.querySelector('.menu-lfs');
    if (menuLfs) {
        menuLfs.addEventListener('click', () => {
            bigContainer.style.display = 'none';
        });
    }

    // Re-wire sidebar/menu event listeners after header update
    const menuSecond = document.querySelector('.js-menu-second');
    if (menuSecond) {
        menuSecond.addEventListener('click', () => {
            document.querySelector('.sidebar-second-page').style.display = 'block';
        });
    }

    //  const menuLfs = document.querySelector('.menu-lfs');
    //     if (menuLfs) {
    //         menuLfs.addEventListener('click', () => {
    //             document.querySelector('.sidebar-second-page').style.display = 'none';
    //         });
    //     }
    // Sidebar selection logic
    function setupSidebarSelection() {
        const allSidebarItems = bigContainer.querySelectorAll('.moving-sidebar-container');
        allSidebarItems.forEach(item => {
            item.addEventListener('click', function () {
                // Remove selected class from all
                allSidebarItems.forEach(i => i.classList.remove('sidebar-selected'));
                // Add selected class to this
                item.classList.add('sidebar-selected');
            });
        });
    }
    setupSidebarSelection();
    // ...existing code...
});

let dayjsLoaded = false;
let dayjsIntervalId = null;
let refreshCommentsForCurrentVideo = null;
let currentUserAvatarUrl = null;
let currentPlaylistVideos = [];
let currentPlaylistTotalCount = 0;

function isUsableAvatarUrl(url) {
    if (typeof url !== 'string') return false;
    const v = url.trim();
    if (!v) return false;
    if (/^[a-zA-Z]:\\/.test(v)) return false;
    return /^https?:\/\//i.test(v) || v.startsWith('images/');
}

function applyCurrentUserAvatar(url) {
    if (!isUsableAvatarUrl(url)) return;
    currentUserAvatarUrl = url;
    const topAvatar = document.querySelector('.comment-input .comment-image');
    if (topAvatar) topAvatar.src = url;
    document.querySelectorAll('.sub-comment .comment-image').forEach(img => {
        img.src = url;
    });
}

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23303030'/%3E%3C/svg%3E";

async function loadSidebar() {
    const sidebarList = await getSidebarList();
    const sidebarContainer = document.querySelector('.js-sidebar-component-container');
    const currentVideoId = new URLSearchParams(window.location.search).get('videoId');

    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarList;
        initSidebarLazyLoading(sidebarContainer, () => updateNowPlayingIndicator(currentVideoId));
    }

    updateNowPlayingIndicator(currentVideoId);
}

loadSidebar();

async function loadPlaylistSidebar() {
    const params = new URLSearchParams(window.location.search);
    const playlistId = params.get('playlistId');
    if (!playlistId) return; // no playlist context — leave the container hidden, skip the fetch entirely

    const playlistContainerEl = document.querySelector('.playlist-container');
    const listEl = document.querySelector('.js-sidebar-component-containers');
    const titleEl = document.querySelector('.playlist-title');
    if (!playlistContainerEl || !listEl) return;

    try {
        const token = await getAccessToken();
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const response = await fetch(
            `https://valviorabackend2.onrender.com/playlistVideoApi?playlistId=${encodeURIComponent(playlistId)}`,
            { headers, credentials: 'include' }
        );
        if (!response.ok) return; // 404 = playlist not found, anything else also bails out safely

        const matched = await response.json();
        if (!matched || !Array.isArray(matched.videos) || matched.videos.length === 0) return;

        if (matched.isBanned === true) {
            const playlistContainerEl = document.querySelector('.playlist-container');
            const listEl = document.querySelector('.js-sidebar-component-containers');
            const titleEl = document.querySelector('.playlist-title');
            const numgEl = document.querySelector('.numg');
            if (playlistContainerEl) playlistContainerEl.style.display = 'none';
            if (listEl) listEl.innerHTML = '';
            if (titleEl) titleEl.textContent = '';
            if (numgEl) numgEl.textContent = '';
            return;
        }

        // Keep playlist data around so the "X out of Y" counter and the now-playing
        // badge logic can look videos up by id as the user navigates between them.
        currentPlaylistVideos = matched.videos;
        currentPlaylistTotalCount = matched.videoCount || matched.videos.length;

        if (titleEl) titleEl.textContent = matched.playlistTitle || '';

        listEl.innerHTML = matched.videos.map((video) => {
            const isBanned = video.isBanned === true || video.isBanned === 'true';
            return `
            <div class="sidebar-item-container${isBanned ? ' banned-thumbnail' : ''}" data-banned="${isBanned ? '1' : '0'}">
                <div class="image-text">
                    <div class="image-container-side">
                        <img src="${video.image || ''}" class="side-image" data-id="${video.videoId || ''}" data-banned="${isBanned ? '1' : '0'}" role="button" tabindex="${isBanned ? '-1' : '0'}" ${isBanned ? 'aria-disabled="true"' : ''} />
                    </div>
                    <div class="texts-container">
                        <div class="text-stack">
                            <div class="title">${video.title || ''}</div>
                            <div class="channel-name">${video.timer || ''}</div>
                        </div>
                        <div class="three-dots-sidebar" role="button" tabindex="0" aria-label="More options">
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        playlistContainerEl.style.display = 'flex';
        setupPlaylistCollapseToggle();

        // Figure out which video is actually playing right now. If we arrived here
        // without a videoId (the homepage lookup failed before navigating), fall back
        // to the first video in the playlist and update the URL to match.
        let activeVideoId = params.get('videoId');
        if (!activeVideoId) {
            const firstVideoId = matched.videos[0].videoId;
            if (firstVideoId) {
                const u = new URL(window.location.href);
                u.searchParams.set('videoId', firstVideoId);
                history.replaceState(null, '', u.toString());
                renderVideoById(firstVideoId);
                activeVideoId = firstVideoId;
            }
        }

        if (activeVideoId) updateNowPlayingIndicator(activeVideoId);
    } catch (err) {
        console.warn('Failed to load playlist sidebar', err);
    }
}

loadPlaylistSidebar();

function updatePlaylistPositionText(videoId) {
    const numgEl = document.querySelector('.numg');
    if (!numgEl || !currentPlaylistVideos.length) return;

    const idx = currentPlaylistVideos.findIndex((v) => v.videoId === videoId);
    if (idx === -1) return; // the video currently playing isn't part of the loaded playlist

    numgEl.textContent = `${idx + 1} out of ${currentPlaylistTotalCount || currentPlaylistVideos.length}`;
}

function updateNowPlayingIndicator(videoId) {
    document.querySelectorAll('.sidebar-item-container.is-now-playing').forEach((el) => {
        el.classList.remove('is-now-playing', 'is-now-playing--playlist');
        el.removeAttribute('aria-current');
        el.querySelector('.now-playing-badge')?.remove();
    });

    if (!videoId) return;

    // "Up Next" sidebar — unchanged existing small badge.
    const upNextContainer = document.querySelector('.js-sidebar-component-container');
    if (upNextContainer) {
        upNextContainer.querySelectorAll(`.side-image[data-id="${CSS.escape(videoId)}"]`).forEach((img) => {
            applyNowPlayingBadge(img, false);
        });
    }

    // Playlist sidebar — extra-noticeable animated badge (Task 2).
    const playlistListEl = document.querySelector('.js-sidebar-component-containers');
    if (playlistListEl) {
        playlistListEl.querySelectorAll(`.side-image[data-id="${CSS.escape(videoId)}"]`).forEach((img) => {
            applyNowPlayingBadge(img, true);
        });
    }

    updatePlaylistPositionText(videoId);
}

function applyNowPlayingBadge(img, isPlaylist) {
    const container = img.closest('.sidebar-item-container');
    const imageWrap = img.closest('.image-container-side');
    if (!container || !imageWrap) return;

    container.classList.add('is-now-playing');
    if (isPlaylist) container.classList.add('is-now-playing--playlist');
    container.setAttribute('aria-current', 'true');

    const badge = document.createElement('div');
    badge.className = 'now-playing-badge' + (isPlaylist ? ' now-playing-badge--playlist' : '');
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = isPlaylist
        ? '<span class="now-playing-eq"><i></i><i></i><i></i></span><span class="now-playing-label">Now Playing</span>'
        : '<span></span><span></span><span></span>';
    imageWrap.appendChild(badge);
}

function setupPlaylistCollapseToggle() {
    const toggleBtn = document.querySelector('.js-playlist-toggle-btn');
    const playlistContainerEl = document.querySelector('.playlist-container');
    if (!toggleBtn || !playlistContainerEl) return;
    if (toggleBtn.dataset.bound === '1') return; // guard against duplicate listeners on re-render
    toggleBtn.dataset.bound = '1';

    toggleBtn.addEventListener('click', () => {
        const isCollapsed = playlistContainerEl.classList.toggle('playlist-collapsed');
        toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        toggleBtn.setAttribute('aria-label', isCollapsed ? 'Expand playlist' : 'Collapse playlist');
        toggleBtn.setAttribute('title', isCollapsed ? 'Expand playlist' : 'Collapse playlist');
    });

    toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleBtn.click();
        }
    });
}

function showVideoNotFoundPopup() {
    const popup = document.createElement('div');
    popup.className = 'video-not-found-popup';
    popup.textContent = 'Video not found';
    popup.setAttribute('role', 'alert');
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2200);
}

function handleSideImageActivate(img, e) {
    if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    if (e) e.preventDefault();

    const container = img.closest('.sidebar-item-container');
    if (container?.dataset.banned === '1' || img.dataset.banned === '1') return;

    const id = img.dataset.id;
    if (!id) {
        showVideoNotFoundPopup();
        return;
    }

    const u = new URL(window.location.href);
    u.searchParams.set('videoId', id);
    history.replaceState(null, '', u.toString());

    renderVideoById(id);
    updateNowPlayingIndicator(id);
    if (refreshCommentsForCurrentVideo) refreshCommentsForCurrentVideo();

    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
}

let sidebarDelegationBound = false;
function bindSidebarThumbnailHandlers() {
    if (sidebarDelegationBound) return;
    sidebarDelegationBound = true;

    document.addEventListener('click', (e) => {
        const img = e.target.closest('.side-image');
        if (!img) return;
        handleSideImageActivate(img, e);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const img = e.target.closest('.side-image');
        if (!img) return;
        e.preventDefault();
        handleSideImageActivate(img, null);
    });
}
bindSidebarThumbnailHandlers();

function setupVideoPageInteractivity() {
    const subscribeBtn = document.querySelector('.subscribe');
    // Guard: if video HTML not yet rendered, do nothing
    if (!subscribeBtn) return;
    // Guard: prevent attaching duplicate listeners on re-render
    if (subscribeBtn.dataset.initialized === 'true') return;
    subscribeBtn.dataset.initialized = 'true';

    // Accessibility: allow Enter/Space to activate the button
    subscribeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            subscribeBtn.click();
        }
    });

    subscribeBtn.addEventListener('click', () => {
        const isSubscribed = subscribeBtn.classList.contains('subscribed');
        if (!isSubscribed) {
            subscribeBtn.classList.add('subscribed');
            subscribeBtn.textContent = 'Subscribed';
            subscribeBtn.setAttribute('aria-pressed', 'true');
            showConfetti(subscribeBtn);
        } else {
            // Toggle back to unsubscribed
            subscribeBtn.classList.remove('subscribed');
            subscribeBtn.textContent = 'Subscribe';
            subscribeBtn.setAttribute('aria-pressed', 'false');
        }
    });

    // --- Description expand/collapse (show more / show less) ---
    document.querySelectorAll('.show-more-button').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Show more');

        btn.addEventListener('click', () => {
            const isExpanded = btn.getAttribute('data-expanded') === 'true';
            if (isExpanded) {
                const section = btn.closest('.description-section');
                const explanation = section?.querySelector('.video-explanation');
                collapseDescription(btn, explanation);
            } else {
                expandDescription(btn, collapseDescription);
            }
        });

        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // --- Comment box interactivity (emoji + cancel/comment buttons) ---
    function setupCommentControls() {
        const commentInputRow = document.querySelector('.comment-input');
        const commentBox = document.querySelector('.js-comment-box');
        const commentsContainer = document.querySelector('.comments');
        if (!commentInputRow || !commentBox) return;

        let totalTopLevelComments = 0;

        // Create emoji button (left side)
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-button';
        emojiBtn.type = 'button';
        emojiBtn.setAttribute('aria-label', 'Add emoji');
        emojiBtn.innerText = '😊';

        // Create emoji picker (hidden)
        const emojiPicker = document.createElement('div');
        emojiPicker.className = 'emoji-picker';
        emojiPicker.style.display = 'none';
        const emojis = ['😀', '😂', '😍', '😊', '😅', '👍', '🎉', '🙌', '🤔', '👏', '🔥', '😎'];
        // remember last caret position so we can insert even after the input loses focus
        let caretStart = 0, caretEnd = 0;
        function updateCaret() {
            if (typeof commentBox.selectionStart === 'number') {
                caretStart = commentBox.selectionStart;
                caretEnd = commentBox.selectionEnd;
            }
        }
        ['input', 'click', 'keyup', 'mouseup', 'select', 'focus'].forEach(ev => commentBox.addEventListener(ev, updateCaret));
        // initialize caret on load
        updateCaret();
        emojis.forEach(e => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = e;
            b.addEventListener('click', () => {
                // insert emoji at last known caret (works even if input lost focus)
                const start = (typeof caretStart === 'number') ? caretStart : (commentBox.selectionStart || 0);
                const end = (typeof caretEnd === 'number') ? caretEnd : (commentBox.selectionEnd || 0);
                const val = commentBox.value || '';
                commentBox.value = val.slice(0, start) + e + val.slice(end);
                // move caret after emoji
                const pos = start + e.length;
                caretStart = caretEnd = pos;
                commentBox.focus();
                commentBox.setSelectionRange(pos, pos);
                updateSubmitState();
                // hide picker
                emojiPicker.style.display = 'none';
            });
            emojiPicker.appendChild(b);
        });

        // Create actions container (right side)
        const actions = document.createElement('div');
        actions.className = 'comment-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'comment-cancel';
        cancelBtn.textContent = 'Cancel';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'comment-submit';
        submitBtn.textContent = 'Comment';
        submitBtn.disabled = true;

        actions.appendChild(cancelBtn);
        actions.appendChild(submitBtn);

        // Insert emoji button before the comment box and actions after
        commentInputRow.insertBefore(emojiBtn, commentBox);
        commentInputRow.appendChild(actions);
        commentInputRow.appendChild(emojiPicker);

        // Show controls when comment box gains focus
        commentBox.addEventListener('focus', () => {
            commentInputRow.classList.add('active');
            updateSubmitState();
        });

        // Keep controls visible while interacting inside row
        commentInputRow.addEventListener('focusin', () => {
            commentInputRow.classList.add('active');
        });

        // Hide when clicking outside any comment-input row (global handler added once)
        if (!document._commentInputOutsideHandlerAdded) {
            document._commentInputOutsideHandlerAdded = true;
            document.addEventListener('click', (e) => {
                document.querySelectorAll('.comment-input.active').forEach(row => {
                    if (!row.contains(e.target)) {
                        row.classList.remove('active');
                        const picker = row.querySelector('.emoji-picker');
                        if (picker) picker.style.display = 'none';
                    }
                });
            });
        }

        // Toggle emoji picker via button
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const showing = emojiPicker.style.display === 'block';
            emojiPicker.style.display = showing ? 'none' : 'block';
        });

        // Cancel clears input & hides controls
        cancelBtn.addEventListener('click', () => {
            commentBox.value = '';
            commentInputRow.classList.remove('active');
            emojiPicker.style.display = 'none';
            updateSubmitState();
        });

        async function postCommentToServer({ text, parentCommentId }) {
            const contentId = new URLSearchParams(window.location.search).get('videoId');
            if (!contentId) {
                alert('Could not determine which video this belongs to.');
                return null;
            }
            const token = await getAccessToken();
            if (!token) {
                alert('Please log in to comment.');
                return null;
            }
            try {
                const response = await fetch('https://valviorabackend2.onrender.com/commentApi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ contentId, contentType: 'video', text, parentCommentId })
                });
                if (!response.ok) {
                    let msg = 'Failed to post comment.';
                    try { const errData = await response.json(); if (errData?.message) msg = errData.message; } catch {}
                    alert(msg);
                    return null;
                }
                return await response.json();
            } catch (err) {
                console.error('Error posting comment:', err);
                alert('An error occurred while posting your comment.');
                return null;
            }
        }

        async function deleteCommentOnServer(commentId) {
            const token = await getAccessToken();
            if (!token) {
                alert('Please log in.');
                return false;
            }
            try {
                const response = await fetch(`https://valviorabackend2.onrender.com/commentApi/${encodeURIComponent(commentId)}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (!response.ok) {
                    let msg = 'Failed to delete comment.';
                    try { const errData = await response.json(); if (errData?.message) msg = errData.message; } catch {}
                    alert(msg);
                    return false;
                }
                return true;
            } catch (err) {
                console.error('Error deleting comment:', err);
                alert('An error occurred while deleting the comment.');
                return false;
            }
        }

        async function updateCommentOnServer(commentId, text) {
            const token = await getAccessToken();
            if (!token) {
                alert('Please log in.');
                return null;
            }
            try {
                const response = await fetch(`https://valviorabackend2.onrender.com/commentApi/${encodeURIComponent(commentId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ text })
                });
                if (!response.ok) {
                    let msg = 'Failed to update comment.';
                    try { const errData = await response.json(); if (errData?.message) msg = errData.message; } catch {}
                    alert(msg);
                    return null;
                }
                return await response.json();
            } catch (err) {
                console.error('Error updating comment:', err);
                alert('An error occurred while updating the comment.');
                return null;
            }
        }

        async function reactToCommentOnServer(commentId, reaction, mode = 'add') {
            const token = await getAccessToken();
            if (!token) {
                alert('Please log in.');
                return null;
            }
            try {
                const response = await fetch(`https://valviorabackend2.onrender.com/commentApi/${encodeURIComponent(commentId)}/${reaction}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ mode })
                });
                if (!response.ok) return null;
                return await response.json();
            } catch (err) {
                console.error(`Error reacting (${reaction}) to comment:`, err);
                return null;
            }
        }

        // Submit (comment) - send to backend, render the created comment, and update count
        submitBtn.addEventListener('click', async () => {
            const text = commentBox.value.trim();
            if (!text) return;

            const contentId = new URLSearchParams(window.location.search).get('videoId');
            if (!contentId) {
                alert('Could not determine which video this comment belongs to.');
                return;
            }

            const token = await getAccessToken();
            if (!token) {
                alert('Please log in to comment.');
                return;
            }

            submitBtn.disabled = true;

            try {
                const data = await postCommentToServer({ text, parentCommentId: null });
                if (!data) {
                    submitBtn.disabled = false;
                    return;
                }

                applyCurrentUserAvatar(data.userInfo?.ProfilePicture);
                const commentObj = {
                    id: data.commentId,
                    author: data.userInfo && data.userInfo.email ? data.userInfo.email : '@You',
                    displayName: data.userInfo && data.userInfo.email ? data.userInfo.email : '@You',
                    avatar: isUsableAvatarUrl(data.userInfo?.ProfilePicture) ? data.userInfo.ProfilePicture : DEFAULT_AVATAR,
                    text: data.text,
                    time: data.time,
                    likes: data.likes || 0,
                    dislikes: data.dislikes || 0,
                    isOwn: true
                };

                const el = createCommentElement(commentObj);
                const emptyState = commentsContainer.querySelector('.comments-loading');
                if (emptyState) emptyState.remove();
                commentsContainer.insertBefore(el, commentsContainer.firstChild);
                totalTopLevelComments += 1;
                updateCommentCount();

                commentBox.value = '';
                commentInputRow.classList.remove('active');
                emojiPicker.style.display = 'none';
                updateSubmitState();
            } catch (err) {
                console.error('Error posting comment:', err);
                alert('An error occurred while posting your comment' + (err && err.message ? ': ' + err.message : '.'));
            } finally {
                submitBtn.disabled = false;
            }
        });

        // --- helpers for comments persistence + rendering ---
        async function getCurrentUserIdentityValuesFromToken() {
            try {
                const token = await getAccessToken();
                if (!token) return [];
                const parts = token.split('.');
                if (parts.length < 2) return [];
                const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
                const decoded = JSON.parse(atob(normalized));
                const candidates = [
                    decoded?.userId,
                    decoded?.UserId,
                    decoded?.id,
                    decoded?.Id,
                    decoded?.sub,
                    decoded?.username,
                    decoded?.email,
                    decoded?.UserInfo?.userId,
                    decoded?.UserInfo?.UserId,
                    decoded?.UserInfo?.id,
                    decoded?.UserInfo?.Id,
                    decoded?.UserInfo?.email,
                    decoded?.UserInfo?.username
                ];
                return [...new Set(candidates.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim().toLowerCase()))];
            } catch (error) {
                return [];
            }
        }

        async function getCurrentUsernameFromToken() {
            try {
                const token = await getAccessToken();
                if (!token) return null;
                const parts = token.split('.');
                if (parts.length < 2) return null;
                const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
                const decoded = JSON.parse(atob(normalized));
                return decoded?.UserInfo?.username || decoded?.username || null;
            } catch (error) {
                return null;
            }
        }

        function normalizeIdentity(value) {
            return typeof value === 'string' ? value.trim().toLowerCase().replace(/^@/, '') : '';
        }

        function isOwnCommentEntry(entry, identityValues) {
            if (!entry || !Array.isArray(identityValues) || identityValues.length === 0) return false;
            const values = [
                entry.userId,
                entry.userInfo?._id,
                entry.userInfo?.id,
                entry.userInfo?.email,
                entry.userInfo?.username,
                entry.userInfo?.UserName,
                entry.user?.id,
                entry.user?.email,
                entry.user?.username,
                entry.user?.UserName
            ];
            return values.some((value) => identityValues.includes(normalizeIdentity(value)));
        }

        async function fetchCurrentUserAvatarGlobally() {
            if (isUsableAvatarUrl(currentUserAvatarUrl)) return;

            // Primary source: the user's own account record (works with zero comment history)
            try {
                const username = await getCurrentUsernameFromToken();
                if (username) {
                    const response = await fetch('https://valviorabackend2.onrender.com/registered');
                    if (response.ok) {
                        const allRegistered = await response.json();
                        if (Array.isArray(allRegistered)) {
                            const me = allRegistered.find(
                                r => typeof r.username === 'string' && r.username.toLowerCase() === username.toLowerCase()
                            );
                            if (me?.profilePicture && isUsableAvatarUrl(me.profilePicture)) {
                                applyCurrentUserAvatar(me.profilePicture);
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('Could not resolve avatar from account record', err);
            }

            // Fallback: infer from an existing comment, in case account lookup failed
            try {
                const identityValues = await getCurrentUserIdentityValuesFromToken();
                if (!identityValues.length) return;
                const response = await fetch('https://valviorabackend2.onrender.com/commentApi');
                if (!response.ok) return;
                const allComments = await response.json();
                if (!Array.isArray(allComments)) return;
                const flatEntries = allComments.flatMap(c => [c, ...(c.replies || [])]);
                const ownEntry = flatEntries.find(entry => isOwnCommentEntry(entry, identityValues));
                if (ownEntry?.userInfo?.ProfilePicture) {
                    applyCurrentUserAvatar(ownEntry.userInfo.ProfilePicture);
                }
            } catch (err) {
                console.warn('Could not resolve current user avatar globally', err);
            }
        }

        function mapApiCommentToCommentObj(apiComment, currentUserIdentityValues) {
            return {
                id: apiComment.commentId,
                author: apiComment.userInfo?.email || '@unknown',
                displayName: apiComment.userInfo?.email || '@unknown',
                avatar: apiComment.userInfo?.ProfilePicture || '',
                text: apiComment.text,
                time: apiComment.time,
                likes: apiComment.likes || 0,
                dislikes: apiComment.dislikes || 0,
                isOwn: isOwnCommentEntry(apiComment, currentUserIdentityValues),
                subComments: Array.isArray(apiComment.replies)
                    ? apiComment.replies.map((reply) => ({
                        id: reply.commentId,
                        author: reply.userInfo?.email || '@unknown',
                        displayName: reply.userInfo?.email || '@unknown',
                        avatar: reply.userInfo?.ProfilePicture || '',
                        text: reply.text,
                        time: reply.time,
                        likes: reply.likes || 0,
                        dislikes: reply.dislikes || 0,
                        isOwn: isOwnCommentEntry(reply, currentUserIdentityValues)
                    }))
                    : []
            };
        }

        async function fetchAndRenderComments() {
            const contentId = new URLSearchParams(window.location.search).get('videoId');
            if (!contentId) {
                totalTopLevelComments = 0;
                if (commentsContainer) {
                    commentsContainer.innerHTML = '<div class="comments-loading">Could not determine which video this is.</div>';
                }
                updateCommentCount();
                return;
            }

            if (commentsContainer) {
                commentsContainer.innerHTML = '<div class="comments-loading">Loading comments…</div>';
            }

            try {
                const currentUserIdentityValues = await getCurrentUserIdentityValuesFromToken();
                const response = await fetch(`https://valviorabackend2.onrender.com/commentApi?contentId=${encodeURIComponent(contentId)}`);
                if (!response.ok) {
                    totalTopLevelComments = 0;
                    console.error('Failed to load comments', response.status);
                    if (commentsContainer) {
                        commentsContainer.innerHTML = '<div class="comments-loading">Failed to load comments.</div>';
                    }
                    updateCommentCount();
                    return;
                }

                const data = await response.json();
                if (!Array.isArray(data) || data.length === 0) {
                    totalTopLevelComments = 0;
                    if (commentsContainer) {
                        commentsContainer.innerHTML = '<div class="comments-loading">No comments yet. Be the first to comment!</div>';
                    }
                    updateCommentCount();
                    return;
                }

                const ownEntry = data.find(c => isOwnCommentEntry(c, currentUserIdentityValues))
                    || data.flatMap(c => c.replies || []).find(r => isOwnCommentEntry(r, currentUserIdentityValues));
                if (ownEntry?.userInfo?.ProfilePicture) {
                    applyCurrentUserAvatar(ownEntry.userInfo.ProfilePicture);
                }

                totalTopLevelComments = data.length;

                if (commentsContainer) {
                    commentsContainer.innerHTML = '';
                    const reversed = data.slice().reverse();
                    const COMMENTS_PAGE_SIZE = 5;
                    let renderedCount = 0;
                    let loadMoreBtn = null;

                    const renderNextCommentsPage = () => {
                        const nextBatch = reversed.slice(renderedCount, renderedCount + COMMENTS_PAGE_SIZE);
                        nextBatch.forEach((apiComment) => {
                            const el = createCommentElement(mapApiCommentToCommentObj(apiComment, currentUserIdentityValues));
                            commentsContainer.insertBefore(el, loadMoreBtn);
                        });
                        renderedCount += nextBatch.length;

                        if (renderedCount < reversed.length) {
                            if (!loadMoreBtn) {
                                loadMoreBtn = document.createElement('button');
                                loadMoreBtn.type = 'button';
                                loadMoreBtn.className = 'comments-load-more';
                                loadMoreBtn.textContent = 'Load more comments';
                                loadMoreBtn.addEventListener('click', renderNextCommentsPage);
                            }
                            commentsContainer.appendChild(loadMoreBtn);
                        } else if (loadMoreBtn) {
                            loadMoreBtn.remove();
                        }
                    };

                    renderNextCommentsPage();
                }
            } catch (error) {
                totalTopLevelComments = 0;
                console.error('Error loading comments:', error);
                if (commentsContainer) {
                    commentsContainer.innerHTML = '<div class="comments-loading">Failed to load comments.</div>';
                }
            } finally {
                updateCommentCount();
            }
        }

        refreshCommentsForCurrentVideo = fetchAndRenderComments;

        function createCommentElement(obj) {
            const wrapper = document.createElement('div');
            wrapper.className = 'goes-comment';

            obj.isOwn = obj.isOwn === true || obj.author === '@You';
            const displayName = obj.displayName || obj.author || '@You';
            const avatar = isUsableAvatarUrl(obj.avatar) ? obj.avatar : DEFAULT_AVATAR;
            const timeValue = obj.time;
            const timeText = getCommentTimeText(timeValue);
            const timeDataAttr = getCommentTimeDataAttr(timeValue);

            wrapper.innerHTML = `
              <div class="image-and-right">
                <div class="commenter-profile-picture"><img src="${escapeHtml(avatar)}" class="comment-image" /></div>
                <div class="right-commenter-info">
                    <div class="commenter-name-and-text">
                        <div class="commenter-info">
                            <div class="commenter-email">${escapeHtml(displayName)}</div>
                            <div class="comment-time"${timeDataAttr ? ` data-ts="${escapeHtml(timeDataAttr)}"` : ''}>${timeText}</div>
                        </div>
                        <div class="comment-text">${escapeHtml(obj.text)}</div>
                    </div>
                    <div class="like-dislike">
                        <div class="like" data-count="${obj.likes}">
                            <img src="images/like.png" class="ld-image"/>
                            <div class="like-count">${obj.likes}</div>
                        </div>
                        <div class="dislike" data-count="${obj.dislikes}">
                            <img src="images/dont-like.png" class="ld-image"/>
                            <div class="like-count">${obj.dislikes}</div>
                        </div>
                        <div class="reply">Reply</div>
                    </div>
                    <div class="sub-comment">
                        <div class="commenter-profile-picture"><img src="${escapeHtml(isUsableAvatarUrl(currentUserAvatarUrl) ? currentUserAvatarUrl : DEFAULT_AVATAR)}" class="comment-image" /></div>
                        <input class="sub-comment-box" />
                    </div>
                    <div class="bottom-part">
                        <button type="button" class="sub-emoji-btn" aria-label="Open emoji picker">😊</button>
                        <div class="sub-comment-actions">
                            <div class="sub-comment-cancel">Cancel</div>
                            <div class="sub-comment-reply">Reply</div>
                        </div>
                    </div>

                    <div class="sub-comment-list"></div>

                    <div class="replies" role="button" tabindex="0">
                       <div class="replies-text">0 replies</div>
                       <div>
                         <img src="images/down-arrow.png" class="down-arrow"/>
                       </div>
                    </div> 
                </div>
            </div>
                <div class="three-dots-comment">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
            `;

            const avatarImg = wrapper.querySelector('.commenter-profile-picture img');
            if (avatarImg) {
                avatarImg.addEventListener('error', function onAvatarError() {
                    this.removeEventListener('error', onAvatarError);
                    this.src = DEFAULT_AVATAR;
                });
            }

            // setup like/dislike handlers with toggle behavior
            const likeBtn = wrapper.querySelector('.like');
            const dislikeBtn = wrapper.querySelector('.dislike');
            const likeCountEl = wrapper.querySelector('.like-count');
            const dislikeCountEl = dislikeBtn.querySelector('.like-count');

            const storageKey = `comment-reaction:${obj.id}`;
            let liked = localStorage.getItem(storageKey) === 'liked';
            let disliked = localStorage.getItem(storageKey) === 'disliked';
            let likes = obj.likes ?? 0;
            let dislikes = obj.dislikes ?? 0;

            const syncCommentReactionUi = () => {
                likeBtn.classList.toggle('active', liked);
                likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
                dislikeBtn.classList.toggle('active', disliked);
                dislikeBtn.setAttribute('aria-pressed', disliked ? 'true' : 'false');
                likeCountEl.textContent = likes;
                dislikeCountEl.textContent = dislikes;
            };

            syncCommentReactionUi();

            likeBtn.addEventListener('click', async () => {
                if (likeBtn.disabled || dislikeBtn.disabled) return;
                likeBtn.disabled = true;
                dislikeBtn.disabled = true;
                const mode = liked ? 'remove' : (disliked ? 'switch' : 'add');
                const result = await reactToCommentOnServer(obj.id, 'like', mode);
                if (!result) {
                    likeBtn.disabled = false;
                    dislikeBtn.disabled = false;
                    return;
                }
                likes = result.likes ?? likes;
                dislikes = result.dislikes ?? dislikes;
                liked = mode !== 'remove';
                disliked = mode === 'switch' ? false : disliked;
                localStorage.setItem(storageKey, liked ? 'liked' : '');
                if (disliked) localStorage.setItem(storageKey, 'disliked');
                obj.liked = liked;
                obj.disliked = disliked;
                obj.likes = likes;
                obj.dislikes = dislikes;
                syncCommentReactionUi();
                likeBtn.disabled = false;
                dislikeBtn.disabled = false;
            });

            dislikeBtn.addEventListener('click', async () => {
                if (likeBtn.disabled || dislikeBtn.disabled) return;
                likeBtn.disabled = true;
                dislikeBtn.disabled = true;
                const mode = disliked ? 'remove' : (liked ? 'switch' : 'add');
                const result = await reactToCommentOnServer(obj.id, 'dislike', mode);
                if (!result) {
                    likeBtn.disabled = false;
                    dislikeBtn.disabled = false;
                    return;
                }
                likes = result.likes ?? likes;
                dislikes = result.dislikes ?? dislikes;
                disliked = mode !== 'remove';
                liked = mode === 'switch' ? false : liked;
                localStorage.setItem(storageKey, disliked ? 'disliked' : '');
                if (liked) localStorage.setItem(storageKey, 'liked');
                obj.disliked = disliked;
                obj.liked = liked;
                obj.dislikes = dislikes;
                obj.likes = likes;
                syncCommentReactionUi();
                likeBtn.disabled = false;
                dislikeBtn.disabled = false;
            });

            // --- three-dots menu ---
            const dots = wrapper.querySelector('.three-dots-comment');
            if (dots) {
                dots.setAttribute('tabindex', '0');
                dots.setAttribute('role', 'button');
                dots.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeOpenMenus();
                    showCommentMenu(wrapper, obj, dots);
                });
                dots.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dots.click(); }
                });
            }

            // --- Reply / sub-comment handlers ---
            const replyBtn = wrapper.querySelector('.reply');
            const subComment = wrapper.querySelector('.sub-comment');
            const bottomPart = wrapper.querySelector('.bottom-part');
            const cancelBtn = wrapper.querySelector('.sub-comment-cancel');
            const subCommentBox = wrapper.querySelector('.sub-comment-box');

            // When user clicks "Reply", show the sub-comment input area and controls
            if (replyBtn) {
                replyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (subComment) subComment.style.display = 'flex';
                    if (bottomPart) bottomPart.style.display = 'flex';
                    if (subCommentBox) {
                        subCommentBox.focus();
                    }
                });
            }

            // When user clicks "Cancel" in the sub-comment controls, hide the UI and reset state
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (subComment) { subComment.style.display = 'none'; }
                    if (bottomPart) { bottomPart.style.display = 'none'; }
                    if (subCommentBox) { subCommentBox.value = ''; subCommentBox.blur(); }
                    // close any open emoji pickers
                    document.querySelectorAll('.emoji-picker').forEach(p => p.remove());
                });
            }

            // --- Emoji picker implementation ---
            const emojiBtn = wrapper.querySelector('.sub-emoji-btn');
            const EMOJIS = ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '👍', '🎉', '🔥', '😢', '😡', '🤔', '😅', '🤝'];
            let emojiPickerEl = null;

            function closeEmojiPicker() {
                if (emojiPickerEl) { emojiPickerEl.remove(); emojiPickerEl = null; document.removeEventListener('click', emojiOutsideClick); }
            }

            function emojiOutsideClick(e) {
                if (!emojiPickerEl) return;
                if (!emojiPickerEl.contains(e.target) && e.target !== emojiBtn) {
                    closeEmojiPicker();
                }
            }

            if (emojiBtn) {
                emojiBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // toggle
                    if (emojiPickerEl) { closeEmojiPicker(); return; }
                    // remove other pickers
                    document.querySelectorAll('.emoji-picker').forEach(p => p.remove());
                    emojiPickerEl = document.createElement('div');
                    emojiPickerEl.className = 'emoji-picker';
                    EMOJIS.forEach(emoji => {
                        const b = document.createElement('button');
                        b.type = 'button';
                        b.className = 'emoji-btn';
                        b.textContent = emoji;
                        b.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            if (subCommentBox) {
                                const start = subCommentBox.selectionStart || 0;
                                const end = subCommentBox.selectionEnd || 0;
                                const val = subCommentBox.value || '';
                                const newVal = val.slice(0, start) + emoji + val.slice(end);
                                subCommentBox.value = newVal;
                                const pos = start + emoji.length;
                                subCommentBox.setSelectionRange(pos, pos);
                                subCommentBox.focus();
                            }
                            closeEmojiPicker();
                        });
                        emojiPickerEl.appendChild(b);
                    });
                    document.body.appendChild(emojiPickerEl);
                    // position picker just above the button
                    const rect = emojiBtn.getBoundingClientRect();
                    emojiPickerEl.style.position = 'absolute';
                    emojiPickerEl.style.left = (rect.left + window.scrollX) + 'px';
                    emojiPickerEl.style.top = (rect.top + window.scrollY - emojiPickerEl.offsetHeight - 8) + 'px';
                    setTimeout(() => document.addEventListener('click', emojiOutsideClick), 0);
                });
            }

            // --- Sub-comment creation (adds entries to .sub-comment-list) ---
            const subReplyBtn = wrapper.querySelector('.sub-comment-reply');
            const subCommentList = wrapper.querySelector('.sub-comment-list');
            // ensure it's hidden by default; we'll show it only when the replies control is toggled
            if (subCommentList) subCommentList.style.display = 'none';

            // helper to create a sub-comment DOM element from data and wire behavior
            function createSubCommentEl(subObj, parentObj) {
                const c = document.createElement('div');
                c.className = 'sub-comment-list-container';
                c.dataset.subId = subObj.id;
                subObj.isOwn = subObj.isOwn === true || subObj.author === '@You';
                const subDisplayName = subObj.displayName || subObj.author || '@You';
                const subAvatar = isUsableAvatarUrl(subObj.avatar) ? subObj.avatar : DEFAULT_AVATAR;
                const subTimeValue = subObj.time;
                const subTimeText = getCommentTimeText(subTimeValue);
                const subTimeDataAttr = getCommentTimeDataAttr(subTimeValue);
                c.innerHTML = `
                    <div class="s-container">
                    <div class="commenter-profile-picture"><img src="${escapeHtml(subAvatar)}" class="comment-image" /></div>
                    <div class="right-sub">
                        <div class="commenter-name-and-text">
                            <div class="commenter-info">
                                <div class="commenter-email">${escapeHtml(subDisplayName)}</div>
                                <div class="comment-time"${subTimeDataAttr ? ` data-ts="${escapeHtml(subTimeDataAttr)}"` : ''}>${subTimeText}</div>
                            </div>
                            <div class="comment-text">${escapeHtml(subObj.text)}</div>
                        </div>
                        <div class="like-dislike">
                            <div class="like" data-count="${subObj.likes || 0}">
                                <img src="images/like.png" class="ld-image"/>
                                <div class="like-count">${subObj.likes || 0}</div>
                            </div>
                            <div class="dislike" data-count="${subObj.dislikes || 0}">
                                <img src="images/dont-like.png" class="ld-image"/>
                                <div class="like-count">${subObj.dislikes || 0}</div>
                            </div>
                        </div>
                    </div>
                    </div>
                    <div class="sub-three-dots" role="button" tabindex="0">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                `;

                const subAvatarImg = c.querySelector('.commenter-profile-picture img');
                if (subAvatarImg) {
                    subAvatarImg.addEventListener('error', function onSubAvatarError() {
                        this.removeEventListener('error', onSubAvatarError);
                        this.src = DEFAULT_AVATAR;
                    });
                }

                // like/dislike for sub-comment
                const likeBtn = c.querySelector('.like');
                const dislikeBtn = c.querySelector('.dislike');
                const likeCountEl = likeBtn ? likeBtn.querySelector('.like-count') : null;
                const dislikeCountEl = dislikeBtn ? dislikeBtn.querySelector('.like-count') : null;
                const storageKey = `comment-reaction:${subObj.id}`;
                const storedReaction = localStorage.getItem(storageKey);
                let liked = storedReaction === 'liked' || (storedReaction === null && !!subObj.liked);
                let disliked = storedReaction === 'disliked' || (storedReaction === null && !!subObj.disliked);
                let likes = subObj.likes ?? 0;
                let dislikes = subObj.dislikes ?? 0;

                const syncSubCommentReactionUi = () => {
                    if (likeBtn) {
                        likeBtn.classList.toggle('active', liked);
                        likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
                    }
                    if (dislikeBtn) {
                        dislikeBtn.classList.toggle('active', disliked);
                        dislikeBtn.setAttribute('aria-pressed', disliked ? 'true' : 'false');
                    }
                    if (likeCountEl) likeCountEl.textContent = likes;
                    if (dislikeCountEl) dislikeCountEl.textContent = dislikes;
                };

                const persistSubReaction = () => {
                    if (liked) {
                        localStorage.setItem(storageKey, 'liked');
                    } else if (disliked) {
                        localStorage.setItem(storageKey, 'disliked');
                    } else {
                        localStorage.removeItem(storageKey);
                    }
                };

                syncSubCommentReactionUi();

                if (likeBtn) {
                    likeBtn.addEventListener('click', async () => {
                        if (likeBtn.disabled || dislikeBtn.disabled) return;
                        likeBtn.disabled = true;
                        dislikeBtn.disabled = true;
                        const mode = liked ? 'remove' : (disliked ? 'switch' : 'add');
                        const result = await reactToCommentOnServer(subObj.id, 'like', mode);
                        if (!result) {
                            likeBtn.disabled = false;
                            dislikeBtn.disabled = false;
                            return;
                        }
                        likes = result.likes ?? likes;
                        dislikes = result.dislikes ?? dislikes;
                        liked = mode !== 'remove';
                        disliked = mode === 'switch' ? false : disliked;
                        persistSubReaction();
                        subObj.liked = liked;
                        subObj.disliked = disliked;
                        subObj.likes = likes;
                        subObj.dislikes = dislikes;
                        syncSubCommentReactionUi();
                        likeBtn.disabled = false;
                        dislikeBtn.disabled = false;
                    });
                }
                if (dislikeBtn) {
                    dislikeBtn.addEventListener('click', async () => {
                        if (likeBtn.disabled || dislikeBtn.disabled) return;
                        likeBtn.disabled = true;
                        dislikeBtn.disabled = true;
                        const mode = disliked ? 'remove' : (liked ? 'switch' : 'add');
                        const result = await reactToCommentOnServer(subObj.id, 'dislike', mode);
                        if (!result) {
                            likeBtn.disabled = false;
                            dislikeBtn.disabled = false;
                            return;
                        }
                        likes = result.likes ?? likes;
                        dislikes = result.dislikes ?? dislikes;
                        disliked = mode !== 'remove';
                        liked = mode === 'switch' ? false : liked;
                        persistSubReaction();
                        subObj.disliked = disliked;
                        subObj.liked = liked;
                        subObj.dislikes = dislikes;
                        subObj.likes = likes;
                        syncSubCommentReactionUi();
                        likeBtn.disabled = false;
                        dislikeBtn.disabled = false;
                    });
                }

                // three-dot menu for sub-comment: edit/delete if mine, report otherwise
                const three = c.querySelector('.sub-three-dots');
                if (three) {
                    three.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        // remove any existing sub-comment-menus
                        document.querySelectorAll('.sub-comment-menu').forEach(m => m.remove());
                        const menu = document.createElement('div');
                        menu.className = 'sub-comment-menu';

                        if (subObj.isOwn === true) {
                            menu.innerHTML = `
                                <div class="sub-comment-menu-item" data-action="edit" tabindex="0"><span class="icon">✏️</span><div class="label">Edit</div></div>
                                <div class="sub-comment-menu-item" data-action="delete" tabindex="0"><span class="icon">🗑️</span><div class="label">Delete</div></div>
                            `;
                        } else {
                            menu.innerHTML = `
                                <div class="sub-comment-menu-item" data-action="report" tabindex="0"><span class="icon">⚑</span><div class="label">Report</div></div>
                            `;
                        }

                        document.body.appendChild(menu);
                        const r = three.getBoundingClientRect();
                        // use fixed so the menu stays in place during window resizing and scrolling
                        menu.style.position = 'fixed';
                        menu.style.zIndex = '1000';
                        // prefer showing to the right; if it would overflow, flip to the left
                        const menuRect = menu.getBoundingClientRect();
                        const vw = document.documentElement.clientWidth;
                        let left = r.right + 8;
                        if (r.right + menuRect.width > vw) {
                            left = r.left - menuRect.width - 8;
                            if (left < 8) left = 8;
                        }
                        menu.style.left = left + 'px';
                        // ensure menu is vertically visible (clamp to viewport)
                        let top = r.top - 4;
                        const vh = document.documentElement.clientHeight;
                        if (top + menuRect.height > vh) {
                            top = Math.max(8, vh - menuRect.height - 8);
                        }
                        menu.style.top = top + 'px';

                        // keep menu still during resize, but recompute placement when resize ends
                        let resizeTimeout = null;
                        function onSubMenuResize() {
                            if (resizeTimeout) clearTimeout(resizeTimeout);
                            resizeTimeout = setTimeout(() => {
                                // if menu no longer exists, cleanup listeners
                                if (!menu || !document.body.contains(menu)) {
                                    window.removeEventListener('resize', onSubMenuResize);
                                    window.removeEventListener('orientationchange', onSubMenuResize);
                                    return;
                                }
                                const r2 = three.getBoundingClientRect();
                                const mr2 = menu.getBoundingClientRect();
                                const vw2 = document.documentElement.clientWidth;
                                let left2 = r2.right + 8;
                                if (r2.right + mr2.width > vw2) {
                                    left2 = r2.left - mr2.width - 8;
                                    if (left2 < 8) left2 = 8;
                                }
                                let top2 = r2.top - 4;
                                const vh2 = document.documentElement.clientHeight;
                                if (top2 + mr2.height > vh2) top2 = Math.max(8, vh2 - mr2.height - 8);
                                menu.style.left = left2 + 'px';
                                menu.style.top = top2 + 'px';
                            }, 180);
                        }
                        window.addEventListener('resize', onSubMenuResize);
                        window.addEventListener('orientationchange', onSubMenuResize);

                        // menu actions
                        menu.querySelectorAll('.sub-comment-menu-item').forEach(item => {
                            item.addEventListener('click', (e) => {
                                const action = item.getAttribute('data-action');
                                if (action === 'edit') {
                                    // start edit inline
                                    const textEl = c.querySelector('.comment-text');
                                    if (!textEl) return;
                                    // prevent multiple editors
                                    if (c.querySelector('.sub-edit-area')) return;
                                    const orig = subObj.text;
                                    const editArea = document.createElement('div');
                                    editArea.className = 'sub-edit-area';
                                    editArea.innerHTML = `<textarea class="sub-edit-text">${escapeHtml(orig)}</textarea><div class="sub-edit-controls"><button class="sub-edit-save">Save</button><button class="sub-edit-cancel">Cancel</button></div>`;
                                    textEl.style.display = 'none';
                                    textEl.parentNode.appendChild(editArea);

                                    const saveBtn = editArea.querySelector('.sub-edit-save');
                                    const cancelBtn = editArea.querySelector('.sub-edit-cancel');
                                    const ta = editArea.querySelector('.sub-edit-text');
                                    saveBtn.addEventListener('click', async () => {
                                        const newText = ta.value.trim();
                                        if (!newText) return;
                                        saveBtn.disabled = true;
                                        const result = await updateCommentOnServer(subObj.id, newText);
                                        saveBtn.disabled = false;
                                        if (!result) return;
                                        subObj.text = result.text || newText;
                                        textEl.innerHTML = escapeHtml(subObj.text);
                                        editArea.remove();
                                        textEl.style.display = '';
                                        updateRepliesCount();
                                    });
                                    cancelBtn.addEventListener('click', () => {
                                        editArea.remove();
                                        textEl.style.display = '';
                                    });
                                }
                                if (action === 'delete') {
                                    if (subObj.isOwn !== true) { menu.remove(); return; }
                                    deleteCommentOnServer(subObj.id).then((ok) => {
                                        if (!ok) return;
                                        const idx = (parentObj.subComments || []).findIndex(s => s.id === subObj.id);
                                        if (idx !== -1) parentObj.subComments.splice(idx, 1);
                                        if (c && c.parentNode) c.parentNode.removeChild(c);
                                        updateRepliesCount();
                                    });
                                }
                                if (action === 'report') {
                                    alert('Thanks — this sub-comment has been reported.');
                                }
                                menu.remove();
                            });
                            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
                        });

                        // close when clicking elsewhere
                        setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
                    });
                }

                return c;
            }

            // render any stored sub-comments
            if (subCommentList && obj.subComments && obj.subComments.length) {
                obj.subComments.forEach(s => {
                    const el = createSubCommentEl(s, obj);
                    subCommentList.appendChild(el);
                });
            }

            // replies control (shows count and toggles the list)
            const repliesControl = wrapper.querySelector('.replies');
            const repliesText = repliesControl ? repliesControl.querySelector('.replies-text') : null;
            const repliesArrow = repliesControl ? repliesControl.querySelector('.down-arrow') : null;

            function updateRepliesCount() {
                const cnt = subCommentList ? subCommentList.children.length : 0;
                if (repliesText) repliesText.textContent = `${cnt} ${cnt === 1 ? 'reply' : 'replies'}`;
            }

            if (repliesControl) {
                repliesControl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!subCommentList) return;
                    const isHidden = (subCommentList.style.display === 'none' || subCommentList.style.display === '');
                    subCommentList.style.display = isHidden ? 'flex' : 'none';
                    if (repliesArrow) {
                        if (isHidden) repliesArrow.classList.add('open'); else repliesArrow.classList.remove('open');
                    }
                });
                repliesControl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); repliesControl.click(); }
                });
            }

            // initialize count
            updateRepliesCount();

            if (subReplyBtn) {
                subReplyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!subCommentBox) return;
                    const text = (subCommentBox.value || '').trim();
                    if (!text) return;

                    subReplyBtn.disabled = true;
                    const data = await postCommentToServer({ text, parentCommentId: obj.id });
                    subReplyBtn.disabled = false;
                    if (!data) return;

                    applyCurrentUserAvatar(data.userInfo?.ProfilePicture);
                    const subObj = {
                        id: data.commentId,
                        author: data.userInfo?.email || '@unknown',
                        displayName: data.userInfo?.email || '@unknown',
                        avatar: isUsableAvatarUrl(data.userInfo?.ProfilePicture) ? data.userInfo.ProfilePicture : DEFAULT_AVATAR,
                        text: data.text,
                        time: data.time,
                        likes: data.likes || 0,
                        dislikes: data.dislikes || 0,
                        isOwn: true
                    };
                    if (!obj.subComments) obj.subComments = [];
                    obj.subComments.push(subObj);

                    const c = createSubCommentEl(subObj, obj);
                    if (subCommentList) {
                        subCommentList.appendChild(c);
                    } else if (bottomPart) {
                        bottomPart.insertAdjacentElement('afterend', c);
                    }

                    if (typeof updateRepliesCount === 'function') updateRepliesCount();

                    subCommentBox.value = '';
                    subCommentBox.focus();
                });
            }

            // keyboard shortcuts for sub-comment box
            // Enter (without Shift) => reply; Escape => cancel/hide the sub-comment UI
            if (subCommentBox) {
                subCommentBox.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (subReplyBtn) subReplyBtn.click();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        if (cancelBtn) cancelBtn.click();
                    }
                });
            }

            return wrapper;
        }

        // Close any open menus
        function closeOpenMenus() {
            document.querySelectorAll('.comment-menu').forEach(m => m.remove());
            document.removeEventListener('click', closeOpenMenus);
            // cleanup any scroll/resize handlers related to comment menus
            if (document._commentMenuScrollHandler) {
                window.removeEventListener('scroll', document._commentMenuScrollHandler, true);
                delete document._commentMenuScrollHandler;
            }
            if (document._commentMenuResizeHandler) {
                window.removeEventListener('resize', document._commentMenuResizeHandler);
                window.removeEventListener('orientationchange', document._commentMenuResizeHandler);
                delete document._commentMenuResizeHandler;
            }
        }

        // Show contextual menu next to the three-dot button
        function showCommentMenu(wrapper, obj, anchor) {
            const menu = document.createElement('div');
            menu.className = 'comment-menu';
            menu.setAttribute('role', 'menu');

            const menuAnchorRect = anchor.getBoundingClientRect();

            if (obj.isOwn === true) {
                menu.innerHTML = `
                    <div class="comment-menu-item" data-action="edit" role="menuitem" tabindex="0">
                        <span class="icon">✏️</span>
                        <div class="menu-label">Edit</div>
                    </div>
                    <div class="comment-menu-item" data-action="delete" role="menuitem" tabindex="0">
                        <span class="icon">🗑️</span>
                        <div class="menu-label">Delete</div>
                    </div>
                `;
            } else {
                menu.innerHTML = `
                    <div class="comment-menu-item" data-action="report" role="menuitem" tabindex="0">
                        <span class="icon">⚑</span>
                        <div class="menu-label">Report</div>
                    </div>
                `;
            }

            // append and position menu relative to the anchor (fixed so it doesn't drift during resize)
            document.body.appendChild(menu);
            // use fixed positioning - compute using client rect (viewport coords)
            menu.style.position = 'fixed';
            menu.style.zIndex = '1000';
            const menuRect = menu.getBoundingClientRect();
            const vw = document.documentElement.clientWidth;
            let left = menuAnchorRect.right + 8;
            if (menuAnchorRect.right + menuRect.width > vw) {
                left = menuAnchorRect.left - menuRect.width - 8;
                if (left < 8) left = 8;
            }
            menu.style.left = left + 'px';
            // clamp vertically within viewport
            let top = menuAnchorRect.top - 8;
            const vh = document.documentElement.clientHeight;
            if (top + menuRect.height > vh) {
                top = Math.max(8, vh - menuRect.height - 8);
            }
            menu.style.top = top + 'px';

            // hide menu on scroll or resize so it doesn't drift while the page moves
            function hideOnScrollOrResize() {
                // simply close menus; cleanup is handled by closeOpenMenus
                closeOpenMenus();
            }
            // keep references on document so we can remove them when menus close
            document._commentMenuScrollHandler = hideOnScrollOrResize;
            document._commentMenuResizeHandler = hideOnScrollOrResize;
            window.addEventListener('scroll', document._commentMenuScrollHandler, true);
            window.addEventListener('resize', document._commentMenuResizeHandler);
            window.addEventListener('orientationchange', document._commentMenuResizeHandler);

            // handle click/keyboard on menu items
            menu.querySelectorAll('.comment-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = item.getAttribute('data-action');
                    if (action === 'edit') startEditComment(wrapper, obj);
                    if (action === 'delete') deleteComment(wrapper, obj);
                    if (action === 'report') reportComment(wrapper, obj);
                    closeOpenMenus();
                });
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
                });
            });

            // close menu when clicking outside
            setTimeout(() => document.addEventListener('click', closeOpenMenus), 0);
        }

        function startEditComment(wrapper, obj) {
            // find text element
            const textEl = wrapper.querySelector('.comment-text');
            if (!textEl) return;
            // prevent multiple editors
            if (wrapper.querySelector('.comment-edit-area')) return;

            const orig = obj.text;
            const editArea = document.createElement('div');
            editArea.className = 'comment-edit-area';
            editArea.innerHTML = `
                <textarea class="comment-edit-text">${escapeHtml(orig)}</textarea>
                <div class="comment-edit-controls">
                    <button class="comment-edit-cancel" type="button">Cancel</button>
                    <button class="comment-edit-save" type="button">Save</button>
                </div>
            `;

            // replace text element with edit area
            textEl.style.display = 'none';
            textEl.parentNode.insertBefore(editArea, textEl.nextSibling);

            const ta = editArea.querySelector('.comment-edit-text');
            const btnCancel = editArea.querySelector('.comment-edit-cancel');
            const btnSave = editArea.querySelector('.comment-edit-save');

            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);

            btnCancel.addEventListener('click', () => {
                // remove edit area and show original
                editArea.remove();
                textEl.style.display = '';
            });

            // enable/disable save depending on content
            function updateSaveState() {
                btnSave.disabled = ta.value.trim().length === 0;
            }
            ta.addEventListener('input', updateSaveState);
            updateSaveState();

            btnSave.addEventListener('click', async () => {
                const newText = ta.value.trim();
                if (!newText) {
                    btnSave.disabled = true;
                    return;
                }
                btnSave.disabled = true;
                const result = await updateCommentOnServer(obj.id, newText);
                btnSave.disabled = false;
                if (!result) return;
                obj.text = result.text || newText;
                textEl.innerHTML = escapeHtml(obj.text);
                editArea.remove();
                textEl.style.display = '';
            });
        }

        async function deleteComment(wrapper, obj) {
            if (obj.isOwn !== true) return;
            const ok = await deleteCommentOnServer(obj.id);
            if (!ok) return;
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            totalTopLevelComments = Math.max(0, totalTopLevelComments - 1);
            updateCommentCount();
        }

        function reportComment(wrapper, obj) {
            // simple report acknowledgement
            // you could extend this to persist a report flag or open a modal
            alert('Thanks — this comment has been reported.');
        }

        // set up dayjs for relative times
        function loadDayjs() {
            if (window.dayjs) {
                dayjsLoaded = true;
                dayjs.extend(window.dayjs_plugin_relativeTime);
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js';
                s.onload = () => {
                    const p = document.createElement('script');
                    p.src = 'https://cdn.jsdelivr.net/npm/dayjs@1/plugin/relativeTime.js';
                    p.onload = () => {
                        // attach plugin to window so we can reference later
                        window.dayjs_plugin_relativeTime = dayjs_plugin_relativeTime;
                        dayjs.extend(dayjs_plugin_relativeTime);
                        dayjsLoaded = true;
                        resolve();
                    };
                    p.onerror = reject;
                    document.head.appendChild(p);
                };
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }

        function updateRelativeTimes() {
            if (!dayjsLoaded) return;
            document.querySelectorAll('.comment-time[data-ts]').forEach(el => {
                const tsRaw = el.getAttribute('data-ts');
                if (!tsRaw) return;
                const ts = Number(tsRaw);
                if (!Number.isFinite(ts)) return;
                el.textContent = dayjs(ts).fromNow();
            });
        }

        // initialize
        loadDayjs().then(() => {
            fetchAndRenderComments();
            fetchCurrentUserAvatarGlobally();
            updateRelativeTimes();
            if (!dayjsIntervalId) dayjsIntervalId = setInterval(updateRelativeTimes, 15000);
        }).catch(() => {
            // fallback: render without relative times
            fetchAndRenderComments();
            fetchCurrentUserAvatarGlobally();
        });

        // Enter to submit
        commentBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!submitBtn.disabled) submitBtn.click();
            }
        });

        // enable/disable submit based on content
        function updateSubmitState() {
            const hasText = commentBox.value.trim().length > 0;
            submitBtn.disabled = !hasText;
        }

        // enable submit when typing (previously missing)
        commentBox.addEventListener('input', updateSubmitState);

        function updateCommentCount() {
            const countEl = document.querySelector('.how-much');
            if (!countEl) return;
            const n = totalTopLevelComments;
            countEl.textContent = n + (n === 1 ? ' Comment' : ' Comments');
        }

        function getCommentTimeText(timeValue) {
            if (timeValue === undefined || timeValue === null || timeValue === '') return 'just now';
            const raw = String(timeValue).trim();
            if (!raw) return 'just now';
            if (/^-?\d+(\.\d+)?$/.test(raw)) {
                return dayjsLoaded ? escapeHtml(dayjs(Number(raw)).fromNow()) : 'just now';
            }
            if (dayjsLoaded && dayjs(raw).isValid() && !/^(a few|few|seconds?|minutes?|hours?|days?|weeks?|months?|years?)\b/i.test(raw)) {
                return escapeHtml(dayjs(raw).fromNow());
            }
            return escapeHtml(raw);
        }

        function getCommentTimeDataAttr(timeValue) {
            if (timeValue === undefined || timeValue === null || timeValue === '') return '';
            const raw = String(timeValue).trim();
            if (!raw) return '';
            if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
            if (dayjsLoaded && dayjs(raw).isValid() && !/^(a few|few|seconds?|minutes?|hours?|days?|weeks?|months?|years?)\b/i.test(raw)) {
                return String(Date.parse(raw));
            }
            return '';
        }

        // simple HTML escape to avoid injection in this demo
        function escapeHtml(str) {
            return str.replace(/[&<>"']/g, function (m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
            });
        }

    }

    // initialize comments for the first loaded video
    setupCommentControls();

    // --- Search on second page: redirect to homepage carrying the query ---
    function redirectToHomeSearch(q) {
        const query = (q || '').trim();
        if (!query) return;

        // Hand the search term to the homepage through sessionStorage
        // instead of a URL query string. A URL query string would still be
        // sitting in the address bar if the homepage is later refreshed,
        // which would wrongly re-run the search instead of showing the
        // normal homepage. sessionStorage lets the homepage read this
        // value exactly once and then forget it.
        try {
            sessionStorage.setItem('pendingHomeSearch', query);
        } catch (e) {
            console.warn('Could not store pending search', e);
        }

        window.location.href = 'Velviora.html';
    }

    const headerSearchInput = document.querySelector('.js-search-input');
    const headerSearchButton = document.querySelector('.search-container .search-button');
    if (headerSearchButton && headerSearchInput) {
        headerSearchButton.addEventListener('click', () => redirectToHomeSearch(headerSearchInput.value));
        headerSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') redirectToHomeSearch(headerSearchInput.value); });
    }

    const fullSearchInput = document.querySelector('.js-full-search');
    const fullSearchButton = document.querySelector('.search-full-button');
    // helper to restore headers/layout
    function closeCompactHeader() {
        const header1 = document.querySelector('.youtube-header');
        const header2 = document.querySelector('.middle-sections');
        if (header1) header1.style.display = 'flex';
        if (header2) {
            header2.style.display = 'none';
            header2.style.position = '';
            header2.style.top = '';
            header2.style.left = '';
            header2.style.right = '';
            header2.style.zIndex = '';
        }
        const fullWrapper = document.querySelector('.search-containers');
        if (fullWrapper) fullWrapper.classList.remove('search-active');
    }

    if (fullSearchButton && fullSearchInput) {
        fullSearchButton.addEventListener('click', () => { redirectToHomeSearch(fullSearchInput.value); closeCompactHeader(); });
        fullSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { redirectToHomeSearch(fullSearchInput.value); closeCompactHeader(); } });
    }
    // also wire the visible compact search-button so clicks trigger the same redirect
    const compactSearchBtn = document.querySelector('.middle-sections .search-button');
    if (compactSearchBtn && fullSearchInput) {
        compactSearchBtn.addEventListener('click', () => { redirectToHomeSearch(fullSearchInput.value); closeCompactHeader(); });
    }

    // --- Voice search recorder (second page) ---
    (function () {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        function createRecorder(onDone) {
            if (!SpeechRec) { alert('Voice search not supported'); return null; }
            const overlay = document.createElement('div');
            overlay.className = 'voice-record-overlay';
            overlay.innerHTML = `
                <div class="voice-record-card" role="dialog" aria-modal="true">
                    <div class="voice-header">Listening… <span class="voice-dot"></span></div>
                    <div class="voice-transcript" aria-live="polite"></div>
                    <div class="voice-controls">
                        <button class="voice-cancel">Cancel</button>
                        <button class="voice-done" style="display:none">Done</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const transcriptEl = overlay.querySelector('.voice-transcript');
            const doneBtn = overlay.querySelector('.voice-done');
            const cancelBtn = overlay.querySelector('.voice-cancel');
            const rec = new SpeechRec(); rec.interimResults = true; rec.continuous = true;
            let finalText = ''; let lastResultAt = Date.now(); let silenceTimer = null;
            function startSilenceWatcher() { if (silenceTimer) clearInterval(silenceTimer); silenceTimer = setInterval(() => { if (Date.now() - lastResultAt >= 3000) { doneBtn.style.display = 'inline-flex'; overlay.querySelector('.voice-header').textContent = 'Paused — click Done or speak more'; try { rec.stop() } catch (e) { } clearInterval(silenceTimer); } }, 400); }
            rec.onresult = (ev) => { lastResultAt = Date.now(); let interim = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; } transcriptEl.textContent = (finalText + ' ' + interim).trim(); startSilenceWatcher(); };
            rec.onerror = () => { overlay.remove(); };
            rec.onend = () => { doneBtn.style.display = 'inline-flex'; overlay.querySelector('.voice-header').textContent = 'Paused — click Done or speak more'; };
            cancelBtn.addEventListener('click', () => { rec.stop(); overlay.remove(); });
            doneBtn.addEventListener('click', () => { rec.stop(); overlay.remove(); onDone((finalText + ' ' + transcriptEl.textContent).trim()); });
            try { rec.start(); } catch (e) { }
            return overlay;
        }
        function handleVoiceClick(e) { e.stopPropagation(); const field = document.querySelector('.js-search-input') || document.querySelector('.js-full-search'); if (!field) return; createRecorder((text) => { if (!text) return; field.value = text; const ev = new KeyboardEvent('keydown', { key: 'Enter' }); field.dispatchEvent(ev); }); }
        document.querySelectorAll('.voice-search-button').forEach(btn => btn.addEventListener('click', handleVoiceClick));
    })();
}

// Primary: run setup as soon as video HTML is injected by renderVideoById
document.addEventListener('video-rendered', () => {
    const videoId = new URLSearchParams(window.location.search).get('videoId');
    updateNowPlayingIndicator(videoId);
});
document.addEventListener('video-rendered', setupVideoPageInteractivity);

// Fallback: in case video was rendered before this listener was attached
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupVideoPageInteractivity, 150);
});

// Utility to truncate a string to a max number of characters, adding ... if needed
function truncateTitle(str, maxChars) {
    if (typeof str !== 'string') return '';
    if (str.length <= maxChars) return str;
    return str.slice(0, maxChars).replace(/\s+\S*$/, '') + '...';
}

// Only apply truncation for screens above 1232px
function applySidebarTitleTruncation() {
    if (window.innerWidth > 1232) {
        document.querySelectorAll('.sidebar-item-container .title').forEach(el => {
            const original = el.getAttribute('data-original-title') || el.textContent;
            el.setAttribute('data-original-title', original);
            el.textContent = truncateTitle(original, 38); // Adjust 38 as needed for your design
        });
    } else {
        document.querySelectorAll('.sidebar-item-container .title').forEach(el => {
            const original = el.getAttribute('data-original-title');
            if (original) el.textContent = original;
        });
    }
}

window.addEventListener('resize', applySidebarTitleTruncation);
document.addEventListener('DOMContentLoaded', applySidebarTitleTruncation);


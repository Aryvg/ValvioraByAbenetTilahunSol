import { getAccessToken } from '../auth.js';

// Get overlay and close button (single overlay for all shorts)
const overlay = document.querySelector('.co67g-overlay');
const closeBtn = document.querySelector('.co67g-close-x');
const listContainer = document.getElementById('co67g-list');
const mainCount = document.getElementById('co67g-main-count');
const mainInput = document.getElementById('co67g-main-input');
const mainActions = document.getElementById('co67g-main-actions');
const mainPost = document.getElementById('co67g-main-post');
const mainCancel = document.getElementById('co67g-main-cancel');

let activeShortId = null;
let activeContentType = 'short';
const SHORTS_COMMENTS_BATCH_SIZE = 5;
let shortsCommentsFullList = [];
let shortsCommentsRenderedCount = 0;
let shortsCommentsObserver = null;

function formatRelativeTime(isoString) {
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    const units = [
        ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]
    ];
    for (const [label, secs] of units) {
        const count = Math.floor(seconds / secs);
        if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
}

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

let cachedAvatarStyle = null;

async function fetchCurrentUserAvatarStyle() {
    if (cachedAvatarStyle !== null) return cachedAvatarStyle;
    const token = await getAccessToken();
    if (!token) return '';
    try {
        const res = await fetch('https://valviorabackend2.onrender.com/commentApi/me/profile', {
            headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) return '';
        const data = await res.json();
        cachedAvatarStyle = data.profilePicture
            ? `background-image:url('${data.profilePicture}');background-size:cover;`
            : '';
        return cachedAvatarStyle;
    } catch (e) {
        return '';
    }
}

function applyMainInputAvatar() {
    if (!cachedAvatarStyle) return;
    const avatarEls = document.querySelectorAll('.co67g-input-container .co67g-user-img');
    avatarEls.forEach((avatarEl) => {
        avatarEl.style.cssText += cachedAvatarStyle;
        avatarEl.textContent = '';
    });
}

function decodeUsernameFromToken(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(
            decodeURIComponent(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join('')
            )
        );
        return payload?.UserInfo?.username || payload?.userInfo?.username || null;
    } catch (e) {
        return null;
    }
}

function bumpFeedCommentCount(shortId, delta) {
    const el = document.querySelector(`[data-short-id="${shortId}"] .js-comment-count`);
    if (el) el.textContent = Math.max(0, Number(el.textContent || 0) + delta);
}

function attachCommentEvents(el, comment) {
    const likeBtn = el.querySelector('.co67g-like-action');
    const dislikeBtn = el.querySelector('.co67g-dislike-action');
    const replyToggle = el.querySelector('.co67g-reply-toggle-btn');
    const optionsBtn = el.querySelector('.co67g-options-trigger');
    const reportMenu = el.querySelector('.co67g-report-popup');
    const replyForm = el.querySelector('.co67g-reply-form');
    const replyInput = el.querySelector('.co67g-reply-input');
    const replyPost = el.querySelector('.co67g-reply-post');
    const replyCancel = el.querySelector('.co67g-reply-cancel');
    const viewTrigger = el.querySelector('.co67g-view-replies-trigger');

    async function sendReaction(reaction) {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(`https://valviorabackend2.onrender.com/commentApi/${comment.commentId}/${reaction}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return;
        const data = await res.json();

        const likeAction = el.querySelector('.co67g-like-action');
        const dislikeAction = el.querySelector('.co67g-dislike-action');
        likeAction.querySelector('span').textContent = data.likes;
        dislikeAction.querySelector('span').textContent = data.dislikes;
        likeAction.classList.toggle('co67g-active', data.userReaction === 'like');
        dislikeAction.classList.toggle('co67g-active', data.userReaction === 'dislike');
        likeAction.querySelector('i').className = data.userReaction === 'like' ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
        dislikeAction.querySelector('i').className = data.userReaction === 'dislike' ? 'fas fa-thumbs-down' : 'far fa-thumbs-down';
    }

    likeBtn?.addEventListener('click', () => sendReaction('like'));
    dislikeBtn?.addEventListener('click', () => sendReaction('dislike'));

    optionsBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        document.querySelectorAll('.co67g-report-popup').forEach(m => { if (m !== reportMenu) m.style.display = 'none'; });

        const token = await getAccessToken();
        const currentUsername = decodeUsernameFromToken(token);
        const isOwnComment = currentUsername && comment.userInfo?.email === `@${currentUsername}`;

        reportMenu.innerHTML = isOwnComment
            ? `<div class="co67g-report-item co67g-edit-item"><i class="far fa-edit"></i> Edit</div>
               <div class="co67g-report-item co67g-delete-item"><i class="far fa-trash-alt"></i> Delete</div>`
            : `<div class="co67g-report-item co67g-report-only-item"><i class="far fa-flag"></i> Report</div>`;

        reportMenu.style.display = reportMenu.style.display === 'block' ? 'none' : 'block';

        reportMenu.querySelector('.co67g-edit-item')?.addEventListener('click', () => startEdit(el, comment));
        reportMenu.querySelector('.co67g-delete-item')?.addEventListener('click', () => deleteComment(el, comment));
        reportMenu.querySelector('.co67g-report-only-item')?.addEventListener('click', () => {
            reportMenu.style.display = 'none';
            alert('Comment reported.');
        });
    });

    replyToggle?.addEventListener('click', () => {
        replyForm.style.display = 'block';
        replyInput.focus();
    });

    replyInput?.addEventListener('input', () => {
        replyPost.classList.toggle('co67g-active', replyInput.value.trim() !== '');
    });

    replyInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && replyInput.value.trim() !== '') {
            submitReply(el, replyInput);
        }
    });

    replyPost?.addEventListener('click', () => submitReply(el, replyInput));
    replyCancel?.addEventListener('click', () => {
        replyInput.value = '';
        replyForm.style.display = 'none';
    });

    if (viewTrigger) {
        viewTrigger.addEventListener('click', () => {
            const list = el.querySelector('.co67g-nested-list');
            const icon = viewTrigger.querySelector('i');
            const isOpening = list.style.display === 'none' || list.style.display === '';
            list.style.display = isOpening ? 'block' : 'none';
            icon.className = isOpening ? 'fas fa-caret-up' : 'fas fa-caret-down';
        });
    }
}

function renderComment(comment, isReply = false) {
    const div = document.createElement('div');
    div.className = 'co67g-comment-box';
    div.dataset.commentId = comment.commentId;

    const avatarStyle = comment.userInfo?.ProfilePicture
        ? `background-image:url('${comment.userInfo.ProfilePicture}');background-size:cover;`
        : '';

    div.innerHTML = `
        <div class="co67g-user-img" style="${isReply ? 'width:24px;height:24px;font-size:10px;' : ''}${avatarStyle}"></div>
        <div class="co67g-main-content">
            <div class="co67g-user-meta">
                <span class="co67g-handle">${comment.userInfo?.email || '@unknown'}</span>
                <span class="co67g-timestamp">${formatRelativeTime(comment.time)}</span>
            </div>
            <div class="co67g-comment-text">${escapeHtml(comment.text)}</div>
            <div class="co67g-interact-row">
                <div class="co67g-icon-btn co67g-like-action ${comment.userReaction === 'like' ? 'co67g-active' : ''}">
                    <i class="${comment.userReaction === 'like' ? 'fas' : 'far'} fa-thumbs-up"></i> <span>${comment.likes}</span>
                </div>
                <div class="co67g-icon-btn co67g-dislike-action ${comment.userReaction === 'dislike' ? 'co67g-active' : ''}">
                    <i class="${comment.userReaction === 'dislike' ? 'fas' : 'far'} fa-thumbs-down"></i> <span>${comment.dislikes}</span>
                </div>
                ${!isReply ? '<div class="co67g-reply-toggle-btn">Reply</div>' : ''}
            </div>

            ${!isReply ? `
            <div class="co67g-replies-wrapper">
                <div class="co67g-view-replies-trigger" style="display:${comment.replies?.length ? 'flex' : 'none'}">
                    <i class="fas fa-caret-down"></i> <span class="co67g-reply-count-txt">${comment.replies?.length || 0} replies</span>
                </div>
                <div class="co67g-nested-list" style="display:none"></div>
            </div>` : ''}

            <div class="co67g-reply-form" style="display:none">
                <div class="co67g-input-container" style="margin-top:10px">
                    <div class="co67g-user-img" style="width:24px;height:24px;font-size:10px;${cachedAvatarStyle || ''}"></div>
                    <div style="flex:1">
                        <input type="text" class="co67g-field co67g-reply-input" placeholder="Add a reply...">
                        <div class="co67g-actions-group" style="display:flex">
                            <button class="co67g-btn-base co67g-cancel co67g-reply-cancel">Cancel</button>
                            <button class="co67g-btn-base co67g-submit co67g-reply-post">Reply</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="co67g-options-trigger"><i class="fas fa-ellipsis-v"></i></div>
        <div class="co67g-report-popup"></div>
    `;

    attachCommentEvents(div, comment);
    if (!isReply && comment.replies?.length) {
        const nestedList = div.querySelector('.co67g-nested-list');
        comment.replies.forEach(r => nestedList.appendChild(renderComment(r, true)));
    }
    return div;
}

async function loadComments(shortId) {
    listContainer.innerHTML = '<div class="co67g-empty-state">Loading comments...</div>';
    const token = await getAccessToken();
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch(`https://valviorabackend2.onrender.com/commentApi?contentId=${encodeURIComponent(shortId)}`, { headers });
    const comments = res.ok ? await res.json() : [];

    listContainer.innerHTML = '';

    if (shortsCommentsObserver) {
        shortsCommentsObserver.disconnect();
        shortsCommentsObserver = null;
    }
    shortsCommentsFullList = comments;
    shortsCommentsRenderedCount = 0;

    if (comments.length === 0) {
        listContainer.innerHTML = '<div class="co67g-empty-state">No comments yet. Be the first to share your thoughts!</div>';
    } else {
        renderNextShortsCommentsBatch();
    }

    const total = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    mainCount.textContent = total;
}

// Renders the next SHORTS_COMMENTS_BATCH_SIZE top-level comments (data is
// already in memory from loadComments — nothing is re-fetched here) and,
// if there's more left, places a sentinel at the bottom that triggers the
// next batch once the user scrolls near it.
function renderNextShortsCommentsBatch() {
    const nextBatch = shortsCommentsFullList.slice(
        shortsCommentsRenderedCount,
        shortsCommentsRenderedCount + SHORTS_COMMENTS_BATCH_SIZE
    );
    nextBatch.forEach(c => listContainer.appendChild(renderComment(c)));
    shortsCommentsRenderedCount += nextBatch.length;

    const existingSentinel = listContainer.querySelector('.co67g-scroll-sentinel');
    if (existingSentinel) existingSentinel.remove();

    if (shortsCommentsRenderedCount < shortsCommentsFullList.length) {
        const sentinel = document.createElement('div');
        sentinel.className = 'co67g-scroll-sentinel';
        listContainer.appendChild(sentinel);

        if (!shortsCommentsObserver) {
            shortsCommentsObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) renderNextShortsCommentsBatch();
                });
            }, { root: listContainer, rootMargin: '150px', threshold: 0 });
        }
        shortsCommentsObserver.observe(sentinel);
    }
}

async function handleNewComment() {
    const text = mainInput.value.trim();
    if (!text || !activeShortId) return;
    const token = await getAccessToken();
    if (!token) { console.warn('Must be logged in to comment'); return; }

    const res = await fetch('https://valviorabackend2.onrender.com/commentApi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
            contentId: activeShortId,
            contentType: 'short',
            text,
            parentCommentId: null
        })
    });
    if (!res.ok) { console.error('Failed to post comment', await res.text()); return; }
    const newComment = await res.json();

    if (listContainer.querySelector('.co67g-empty-state')) listContainer.innerHTML = '';
    listContainer.prepend(renderComment({ ...newComment, replies: [] }));

    mainInput.value = '';
    mainActions.style.display = 'none';
    mainPost.classList.remove('co67g-active');
    mainCount.textContent = Number(mainCount.textContent || 0) + 1;
    bumpFeedCommentCount(activeShortId, 1);
}

async function submitReply(parentEl, input) {
    const text = input.value.trim();
    if (!text || !activeShortId) return;
    const parentCommentId = parentEl.dataset.commentId;
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch('https://valviorabackend2.onrender.com/commentApi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
            contentId: activeShortId,
            contentType: 'short',
            text,
            parentCommentId
        })
    });
    if (!res.ok) { console.error('Failed to post reply', await res.text()); return; }
    const newReply = await res.json();

    const nestedList = parentEl.querySelector('.co67g-nested-list');
    const viewTrigger = parentEl.querySelector('.co67g-view-replies-trigger');
    const countTxt = parentEl.querySelector('.co67g-reply-count-txt');

    nestedList.appendChild(renderComment(newReply, true));
    nestedList.style.display = 'block';
    viewTrigger.style.display = 'flex';
    const currentReplies = parseInt(countTxt.textContent) || 0;
    countTxt.textContent = `${currentReplies + 1} replies`;
    viewTrigger.querySelector('i').className = 'fas fa-caret-up';

    input.value = '';
    parentEl.querySelector('.co67g-reply-form').style.display = 'none';
    mainCount.textContent = Number(mainCount.textContent || 0) + 1;
    bumpFeedCommentCount(activeShortId, 1);
}

function startEdit(el, comment) {
    const textEl = el.querySelector('.co67g-comment-text');
    const original = textEl.textContent;
    textEl.innerHTML = `
        <input type="text" class="co67g-field co67g-edit-input" value="${original.replace(/"/g, '&quot;')}">
        <div class="co67g-actions-group" style="display:flex;margin-top:6px">
            <button class="co67g-btn-base co67g-cancel co67g-edit-cancel">Cancel</button>
            <button class="co67g-btn-base co67g-submit co67g-active co67g-edit-save">Save</button>
        </div>
    `;
    textEl.querySelector('.co67g-edit-cancel').addEventListener('click', () => {
        textEl.textContent = original;
    });
    textEl.querySelector('.co67g-edit-save').addEventListener('click', async () => {
        const newText = textEl.querySelector('.co67g-edit-input').value.trim();
        if (!newText) return;
        const token = await getAccessToken();
        const res = await fetch(`https://valviorabackend2.onrender.com/commentApi/${comment.commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ text: newText })
        });
        if (!res.ok) { console.error('Edit failed', await res.text()); return; }
        comment.text = newText;
        textEl.textContent = newText;
    });
}

async function deleteComment(el, comment) {
    if (!confirm('Delete this comment?')) return;
    const token = await getAccessToken();
    const res = await fetch(`https://valviorabackend2.onrender.com/commentApi/${comment.commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) { console.error('Delete failed', await res.text()); return; }
    const removedCount = 1 + (el.querySelectorAll('.co67g-comment-box').length);
    el.remove();
    mainCount.textContent = Math.max(0, Number(mainCount.textContent || 0) - removedCount);
    bumpFeedCommentCount(activeShortId, -removedCount);
}

export function initShortsComments() {
    fetchCurrentUserAvatarStyle().then(applyMainInputAvatar);

    if (closeBtn && overlay) {
        closeBtn.addEventListener('click', () => overlay.style.display = 'none');
    }

    if (overlay) {
        overlay.addEventListener('click', function (e) {
            const modal = overlay.querySelector('.co67g-modal');
            const header = modal ? modal.querySelector('.co67g-header') : null;
            const scrollArea = modal ? modal.querySelector('.co67g-scroll-area') : null;
            const footer = modal ? modal.querySelector('.co67g-footer') : null;
            if (e.target === overlay) {
                overlay.style.display = 'none';
                return;
            }
            if (modal && modal.contains(e.target)) {
                if (header && header.contains(e.target) || scrollArea && scrollArea.contains(e.target) || footer && footer.contains(e.target)) {
                    return;
                }
                overlay.style.display = 'none';
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.co67g-options-trigger')) {
            document.querySelectorAll('.co67g-report-popup').forEach(m => m.style.display = 'none');
        }
    });

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.co67g-open-btn');
        if (!btn) return;
        const shortContainer = btn.closest('[data-short-id]');
        if (!shortContainer) return;
        activeShortId = shortContainer.dataset.shortId;
        activeContentType = 'short';
        overlay.style.display = 'flex';
        await loadComments(activeShortId);
    });

    mainInput.addEventListener('focus', () => mainActions.style.display = 'flex');
    mainInput.addEventListener('input', () => {
        mainPost.classList.toggle('co67g-active', mainInput.value.trim() !== '');
    });
    mainInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && mainInput.value.trim() !== '') {
            handleNewComment();
        }
    });
    mainPost.addEventListener('click', handleNewComment);
    mainCancel.addEventListener('click', () => {
        mainInput.value = '';
        mainActions.style.display = 'none';
        mainPost.classList.remove('co67g-active');
    });
}

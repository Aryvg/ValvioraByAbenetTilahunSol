import { sidebar } from './playlistData.js';
import { renderVideoById } from './Video-container.js';
import { headerComponent, headerComponents, youtubeHeader } from '../general/Header.js';
import { middleSection } from './middleSection.js';
import { menuesContainerComponent } from '../general/menues-container.js';
import { showConfetti } from './showConfetti.js';
import { expandDescription } from './expandDescription.js';
import { collapseDescription } from './collapseDescription.js';
import { getSidebarList } from './sidebarListComponent.js';
import { setupNotificationDropdown } from '../notification/notificationDropdown.js';
import { setupProfileDropdown } from '../account/profileDropdown.js';
import { applyAdminNavVisibility } from '../auth.js';

// import { setupProfileDropdown } from '../account/profileDropdown.js';
// setupProfileDropdown();


document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.menues-main-container').innerHTML = menuesContainerComponent;
    document.querySelector('.sidebar-second-page').innerHTML = menuesContainerComponent;
    document.querySelector('.middle-sections').innerHTML = middleSection;
    document.querySelector('.youtube-header').innerHTML = headerComponents;
    applyAdminNavVisibility();
    // Call after header is rendered so .notification-container and .profile-button exist
    setupProfileDropdown();
    setupNotificationDropdown();
    let bigContainer = document.querySelector('.menues-main-container');

    // Hide bigContainer when clicking menues-main-container, but NOT when clicking menues-container
    bigContainer.addEventListener('click', function(e) {
        // If the click is directly on menues-main-container and NOT inside menues-container
        if (e.target === bigContainer) {
            bigContainer.style.display = 'none';
        }
    });

    // Prevent hiding when clicking inside menues-container
    const menuesContainer = bigContainer.querySelector('.menues-container');
    if (menuesContainer) {
        menuesContainer.addEventListener('click', function(e) {
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
                item.addEventListener('click', function() {
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

const sidebarList = getSidebarList(sidebar);
document.querySelector('.js-sidebar-component-containers').innerHTML = sidebarList;
document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.querySelector('.subscribe');
    if (!subscribeBtn) return;

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

    let currentOpenId = null;
    let dayjsLoaded = false;
    let dayjsIntervalId = null;

    // If there's an id in the URL that matches a video, hide matching sidebar items on load
    const initialParams = new URLSearchParams(window.location.search);
    const initialId = initialParams.get('id');
    if (initialId && videos && videos.some(v => v.id === initialId)) {
        document.querySelectorAll(`.side-image[data-id="${initialId}"]`).forEach(i => {
            const container = i.closest('.sidebar-item-container');
            if (container) container.classList.add('hidden-by-video');
        });
        currentOpenId = initialId;
    }

    // --- Description expand/collapse (show more / show less) ---
    document.querySelectorAll('.show-more-button').forEach((btn, idx) => {
        btn.setAttribute('aria-expanded', 'false');

        btn.addEventListener('click', () => expandDescription(btn, collapseDescription));
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                expandDescription(btn, collapseDescription);
            }
        });
    });

    // --- Sidebar thumbnail click handlers: open matching video by id or show popup ---
    document.querySelectorAll('.side-image').forEach((img) => {
        img.addEventListener('click', () => {
            const id = img.dataset.id;
            if (!id) return;
            if (videos && videos.some(v => v.id === id)) {
                // restore previous hidden items (if any and different)
                if (currentOpenId && currentOpenId !== id) {
                    document.querySelectorAll(`.side-image[data-id="${currentOpenId}"]`).forEach(prev => {
                        const prevContainer = prev.closest('.sidebar-item-container');
                        if (prevContainer) prevContainer.classList.remove('hidden-by-video');
                    });
                }
                // hide all sidebar items that match the newly opened video id
                document.querySelectorAll(`.side-image[data-id="${id}"]`).forEach(i2 => {
                    const container = i2.closest('.sidebar-item-container');
                    if (container) container.classList.add('hidden-by-video');
                });
                currentOpenId = id;

                renderVideoById(id);
                // Reinitialize comment controls for the newly rendered video
                setupCommentControls();
                const u = new URL(window.location.href);
                u.searchParams.set('id', id);
                history.replaceState(null, '', u.toString());
            } else {
                // transient popup
                const popup = document.createElement('div');
                popup.className = 'video-not-found-popup';
                popup.textContent = 'Video not found';
                popup.style.position = 'fixed';
                popup.style.right = '20px';
                popup.style.bottom = '20px';
                popup.style.padding = '10px 14px';
                popup.style.background = 'rgba(0,0,0,0.85)';
                popup.style.color = '#fff';
                popup.style.borderRadius = '6px';
                popup.style.zIndex = '10000';
                popup.setAttribute('role', 'alert');
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 2200);
            }
        });
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); img.click(); }
        });
        img.style.cursor = 'pointer';
    });

    function collapseDescription(btn, desc, showLess) {
        if (!desc) return;
        // animate close
        desc.style.maxHeight = desc.scrollHeight + 'px';
        requestAnimationFrame(() => {
            desc.style.maxHeight = '0px';
        });

        const handler = function () {
            desc.removeEventListener('transitionend', handler);
            desc.style.display = 'none';
            desc.style.maxHeight = '';
            desc.style.overflow = '';
            desc.setAttribute('data-expanded', 'false');
            btn.style.display = '';
            btn.setAttribute('aria-expanded', 'false');
            if (showLess && showLess.parentNode) showLess.parentNode.removeChild(showLess);
            btn.focus();
        };

        desc.addEventListener('transitionend', handler);
    }

    // --- Comment box interactivity (emoji + cancel/comment buttons) ---
    function setupCommentControls() {
        const commentInputRow = document.querySelector('.comment-input');
        const commentBox = document.querySelector('.js-comment-box');
        const commentsContainer = document.querySelector('.comments');
        if (!commentInputRow || !commentBox) return;

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

        // Submit (comment) - append to comments list, persist to localStorage, and render with likes/dislikes
        submitBtn.addEventListener('click', () => {
            const text = commentBox.value.trim();
            if (!text) return;

            const commentObj = {
                id: 'c_' + Date.now(),
                author: '@You',
                text: text,
                time: new Date().toISOString(),
                likes: 0,
                dislikes: 0
            };

            // persist
            const stored = JSON.parse(localStorage.getItem('yt_comments_v1') || '[]');
            stored.unshift(commentObj);
            localStorage.setItem('yt_comments_v1', JSON.stringify(stored));

            // render
            const el = createCommentElement(commentObj);
            commentsContainer.insertBefore(el, commentsContainer.firstChild);

            // update count
            updateCommentCount();

            // reset
            commentBox.value = '';
            commentInputRow.classList.remove('active');
            emojiPicker.style.display = 'none';
            updateSubmitState();
        });

        // --- helpers for comments persistence + rendering ---
        function createCommentElement(obj) {
            const wrapper = document.createElement('div');
            wrapper.className = 'goes-comment';

            wrapper.innerHTML = `
              <div class="image-and-right">
                <div class="commenter-profile-picture"><img src="images/images (2).jpeg" class="comment-image" /></div>
                <div class="right-commenter-info">
                    <div class="commenter-name-and-text">
                        <div class="commenter-info">
                            <div class="commenter-email">${escapeHtml(obj.author)}</div>
                            <div class="comment-time" data-ts="${obj.time}">${dayjsLoaded ? escapeHtml(dayjs(obj.time).fromNow()) : 'just now'}</div>
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
                        <div class="commenter-profile-picture"><img src="images/images (2).jpeg" class="comment-image" /></div>
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

            // setup like/dislike handlers with toggle behavior
            const likeBtn = wrapper.querySelector('.like');
            const dislikeBtn = wrapper.querySelector('.dislike');
            const likeCountEl = wrapper.querySelector('.like-count');
            const dislikeCountEl = dislikeBtn.querySelector('.like-count');

            // ensure booleans exist on object
            obj.liked = !!obj.liked;
            obj.disliked = !!obj.disliked;

            // reflect initial state
            if (obj.liked) { likeBtn.classList.add('active'); likeBtn.setAttribute('aria-pressed', 'true'); }
            if (obj.disliked) { dislikeBtn.classList.add('active'); dislikeBtn.setAttribute('aria-pressed', 'true'); }

            likeBtn.addEventListener('click', () => {
                if (obj.liked) {
                    // toggle off
                    obj.liked = false;
                    obj.likes = Math.max(0, (obj.likes || 0) - 1);
                    likeBtn.classList.remove('active');
                    likeBtn.setAttribute('aria-pressed', 'false');
                } else {
                    // turn on like
                    obj.liked = true;
                    obj.likes = (obj.likes || 0) + 1;
                    likeBtn.classList.add('active');
                    likeBtn.setAttribute('aria-pressed', 'true');
                    // if disliked, remove dislike
                    if (obj.disliked) {
                        obj.disliked = false;
                        obj.dislikes = Math.max(0, (obj.dislikes || 0) - 1);
                        dislikeBtn.classList.remove('active');
                        dislikeBtn.setAttribute('aria-pressed', 'false');
                        dislikeCountEl.textContent = obj.dislikes;
                    }
                }
                likeCountEl.textContent = obj.likes;
                persistCommentUpdate(obj);
            });

            dislikeBtn.addEventListener('click', () => {
                if (obj.disliked) {
                    // toggle off dislike
                    obj.disliked = false;
                    obj.dislikes = Math.max(0, (obj.dislikes || 0) - 1);
                    dislikeBtn.classList.remove('active');
                    dislikeBtn.setAttribute('aria-pressed', 'false');
                } else {
                    // turn on dislike
                    obj.disliked = true;
                    obj.dislikes = (obj.dislikes || 0) + 1;
                    dislikeBtn.classList.add('active');
                    dislikeBtn.setAttribute('aria-pressed', 'true');
                    // if liked, remove like
                    if (obj.liked) {
                        obj.liked = false;
                        obj.likes = Math.max(0, (obj.likes || 0) - 1);
                        likeBtn.classList.remove('active');
                        likeBtn.setAttribute('aria-pressed', 'false');
                        likeCountEl.textContent = obj.likes;
                    }
                }
                dislikeCountEl.textContent = obj.dislikes;
                persistCommentUpdate(obj);
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
                c.innerHTML = `
                    <div class="s-container">
                    <div class="commenter-profile-picture"><img src="images/images (2).jpeg" class="comment-image" /></div>
                    <div class="right-sub">
                        <div class="commenter-name-and-text">
                            <div class="commenter-info">
                                <div class="commenter-email">${escapeHtml(subObj.author)}</div>
                                <div class="comment-time" data-ts="${subObj.time}">${dayjsLoaded ? escapeHtml(dayjs(subObj.time).fromNow()) : 'just now'}</div>
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

                // like/dislike for sub-comment
                const likeBtn = c.querySelector('.like');
                const dislikeBtn = c.querySelector('.dislike');
                const likeCountEl = c.querySelector('.like-count');
                const dislikeCountEl = dislikeBtn ? dislikeBtn.querySelector('.like-count') : null;
                let liked = !!subObj.liked; let disliked = !!subObj.disliked; let likes = subObj.likes || 0; let dislikes = subObj.dislikes || 0;

                if (likeBtn) {
                    if (liked) likeBtn.classList.add('active');
                    likeBtn.addEventListener('click', () => {
                        if (liked) { liked = false; likes = Math.max(0, likes - 1); likeBtn.classList.remove('active'); }
                        else { liked = true; likes = likes + 1; likeBtn.classList.add('active'); if (disliked) { disliked = false; dislikes = Math.max(0, dislikes - 1); dislikeBtn.classList.remove('active'); } }
                        if (likeCountEl) likeCountEl.textContent = likes;
                        if (dislikeCountEl) dislikeCountEl.textContent = dislikes;
                        // persist to parent object
                        subObj.liked = liked; subObj.disliked = disliked; subObj.likes = likes; subObj.dislikes = dislikes; persistCommentUpdate(parentObj);
                    });
                }
                if (dislikeBtn) {
                    if (disliked) dislikeBtn.classList.add('active');
                    dislikeBtn.addEventListener('click', () => {
                        if (disliked) { disliked = false; dislikes = Math.max(0, dislikes - 1); dislikeBtn.classList.remove('active'); }
                        else { disliked = true; dislikes = dislikes + 1; dislikeBtn.classList.add('active'); if (liked) { liked = false; likes = Math.max(0, likes - 1); likeBtn.classList.remove('active'); } }
                        if (likeCountEl) likeCountEl.textContent = likes;
                        if (dislikeCountEl) dislikeCountEl.textContent = dislikes;
                        subObj.liked = liked; subObj.disliked = disliked; subObj.likes = likes; subObj.dislikes = dislikes; persistCommentUpdate(parentObj);
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

                        if (subObj.author === '@You') {
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
                                    saveBtn.addEventListener('click', () => {
                                        const newText = ta.value.trim();
                                        if (!newText) return;
                                        subObj.text = newText;
                                        textEl.innerHTML = escapeHtml(newText);
                                        editArea.remove();
                                        textEl.style.display = '';
                                        persistCommentUpdate(parentObj);
                                        updateRepliesCount();
                                    });
                                    cancelBtn.addEventListener('click', () => {
                                        editArea.remove();
                                        textEl.style.display = '';
                                    });
                                }
                                if (action === 'delete') {
                                    // remove sub from parentObj and DOM
                                    const idx = (parentObj.subComments || []).findIndex(s => s.id === subObj.id);
                                    if (idx !== -1) { parentObj.subComments.splice(idx, 1); persistCommentUpdate(parentObj); }
                                    if (c && c.parentNode) c.parentNode.removeChild(c);
                                    updateRepliesCount();
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
                subReplyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!subCommentBox) return;
                    const text = (subCommentBox.value || '').trim();
                    if (!text) return;

                    // create sub-comment data and persist in parent comment
                    const subObj = { id: 'sub-' + Date.now() + '-' + Math.floor(Math.random() * 1000), author: '@You', text: text, time: Date.now(), likes: 0, dislikes: 0 };
                    if (!obj.subComments) obj.subComments = [];
                    obj.subComments.push(subObj);
                    persistCommentUpdate(obj);

                    // create DOM from helper and append
                    const c = createSubCommentEl(subObj, obj);
                    if (subCommentList) {
                        subCommentList.appendChild(c);
                    } else if (bottomPart) {
                        bottomPart.insertAdjacentElement('afterend', c);
                    }

                    // update replies counter (do not auto-expand the list)
                    if (typeof updateRepliesCount === 'function') updateRepliesCount();

                    // clear input but keep the reply UI open
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

            if (obj.author === '@You') {
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

            btnSave.addEventListener('click', () => {
                const newText = ta.value.trim();
                if (!newText) {
                    // disallow empty
                    btnSave.disabled = true;
                    return;
                }
                obj.text = newText;
                textEl.innerHTML = escapeHtml(newText);
                editArea.remove();
                textEl.style.display = '';
                persistCommentUpdate(obj);
            });
        }

        function deleteComment(wrapper, obj) {
            if (obj.author !== '@You') return;
            const stored = JSON.parse(localStorage.getItem('yt_comments_v1') || '[]');
            const idx = stored.findIndex(c => c.id === obj.id);
            if (idx !== -1) {
                stored.splice(idx, 1);
                localStorage.setItem('yt_comments_v1', JSON.stringify(stored));
            }
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            updateCommentCount();
        }

        function reportComment(wrapper, obj) {
            // simple report acknowledgement
            // you could extend this to persist a report flag or open a modal
            alert('Thanks — this comment has been reported.');
        }

        function persistCommentUpdate(obj) {
            const stored = JSON.parse(localStorage.getItem('yt_comments_v1') || '[]');
            const idx = stored.findIndex(c => c.id === obj.id);
            if (idx !== -1) {
                stored[idx] = obj;
                localStorage.setItem('yt_comments_v1', JSON.stringify(stored));
            }
        }

        // render comments from storage on load
        function renderStoredComments() {
            const stored = JSON.parse(localStorage.getItem('yt_comments_v1') || '[]');
            stored.forEach(c => {
                const el = createCommentElement(c);
                commentsContainer.insertBefore(el, commentsContainer.firstChild);
            });
            updateCommentCount();
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
            renderStoredComments();
            updateRelativeTimes();
            if (!dayjsIntervalId) dayjsIntervalId = setInterval(updateRelativeTimes, 60000); // refresh every minute, only once
        }).catch(() => {
            // fallback: render without relative times
            renderStoredComments();
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
            const stored = JSON.parse(localStorage.getItem('yt_comments_v1') || '[]');
            const n = stored.length;
            countEl.textContent = n + (n === 1 ? ' Comment' : ' Comments');
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
        const href = 'Velviora.html?search=' + encodeURIComponent(query);
        // navigate to homepage with search param
        window.location.href = href;
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
});

// Utility to truncate a string to a max number of characters, adding ... if needed
function truncateTitle(str, maxChars) {
    if (typeof str !== 'string') return '';
    if (str.length <= maxChars) return str;
    return str.slice(0, maxChars).replace(/\s+\S*$/, '') + '...';
}

// Only apply truncation for screens above 1232px
function applySidebarTitleTruncation() {
    if (window.innerWidth > 0) {
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






// --- Dot-menu popup logic ---
document.addEventListener('click', function (e) {
    // Hide all popups if clicking outside any dot-menu
    document.querySelectorAll('.not-interested-popup').forEach(popup => {
        popup.style.display = 'none';
    });
});

document.addEventListener('click', function (e) {
    const dotMenu = e.target.closest('.dot-menu');
    if (dotMenu) {
        // Hide other popups
        document.querySelectorAll('.not-interested-popup').forEach(popup => {
            if (!dotMenu.contains(popup)) popup.style.display = 'none';
        });
        // Toggle this popup
        const popup = dotMenu.querySelector('.not-interested-popup');
        if (popup) {
            popup.style.display = (popup.style.display === 'none' || popup.style.display === '') ? 'flex' : 'none';
        }
        e.stopPropagation();
    }
});

// Optional: Hide popup on resize for safety
window.addEventListener('resize', () => {
    document.querySelectorAll('.not-interested-popup').forEach(popup => {
        popup.style.display = 'none';
    });
});
import { setupSearchInputHandlers } from './searchInputHandlers.js';
import { setupVoiceSearchButtons } from './voiceSearchRecorder.js';
import './handlebackforward.js';

import { headerComponent, populateVideoSummarySuggestions, populateNotificationBadge, populateProfileButton } from '../general/Header.js';
import { getChannelIdForVideo, markNotificationRead } from '../notification/notificationStore.js';
import { sidebarComponent } from '../general/sidebar.js';
import { movingSidebarComponent} from '../general/moving-sidebar.js';
import { menuesContainerComponent } from '../general/menues-container.js';
import { renderThumbnails, fetchAndRenderHomepage } from './renderThumbnails.js';
import { showSearchNotFoundCenter } from './searchNotfound.js';
import { performHomeSearch } from './performHomeSearch.js';
import { closeCompactHeader } from './closeCompactHeader.js';
import { updateArrowVisibility } from './updateArrowVisibility.js';
import { moveContainer } from './moveContainer.js';

import { setupNotificationDropdown } from '../notification/notificationDropdown.js';
import { setupProfileDropdown } from '../account/profileDropdown.js';
import { setupYouSidebarDropdown } from '../general/youSidebarDropdown.js';
import { userHasChannelBool } from '../channelApi.js';
import { getAccessToken, applyAdminNavVisibility } from '../auth.js';
import { initPresence } from '../presence.js';
import { postNotInterested } from '../general/notInterestedStore.js';

document.querySelector('.large-header').innerHTML=headerComponent;
populateVideoSummarySuggestions();
populateNotificationBadge();
populateProfileButton();

// If this page is restored from the browser's back/forward cache (e.g. the
// user clicked Back after reading a notification on the second page), no
// script re-runs on its own — the DOM is restored exactly as it was, badge
// and all. Re-fetch the notification badge and profile picture in that case
// so they reflect any changes made while the user was away. This also
// silently refreshes the videoId -> channelId map that the thumbnail click
// handler below uses, since populateNotificationBadge() re-fetches through
// the same notificationStore.js cache.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        populateNotificationBadge();
        populateProfileButton();
    }
});

applyAdminNavVisibility();
document.querySelector('.down-bar-container').innerHTML=sidebarComponent;
initPresence();
document.querySelector('.moving-sidebar').innerHTML=movingSidebarComponent;
document.querySelector('.menues-main-container').innerHTML=menuesContainerComponent;

// Attach a safe handler to the header Sign-in button (if present).
// This records a post-login target so the auth page can return the user
// to this page after they successfully authenticate. We avoid setting
// a target that points to `index.html` to prevent index->index loops.
try {
    const signInBtn = document.querySelector('.sign-in-button');
    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            try {
                sessionStorage.setItem('postLoginRedirect', 'Velviora.html');
            } catch (e) {}
            window.location.href = 'index.html';
        });
    }
} catch (e) {}

// renderThumbnails() will be called by fetchAndRenderHomepage via renderThumbnails.js
setupSearchInputHandlers();

// --- Search functionality (homepage): search by video title, show centered 'not found' and support history navigation ---
const searchBtnHome = document.querySelector('.search-buttons');
const searchField = document.querySelector('.js-search-input');
export function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
}

const headerSearchButton = document.querySelector('.search-container .search-button');

if (searchBtnHome) searchBtnHome.addEventListener('click', () => performHomeSearch());
// Also wire the header's explicit search button so clicking it behaves like pressing Enter
if (headerSearchButton) headerSearchButton.addEventListener('click', () => performHomeSearch());
if (searchField) searchField.addEventListener('keydown', (e) => { if (e.key === 'Enter') performHomeSearch(); });

// Wire the compact/full search input and button to the same search behavior
const fullSearchBtn = document.querySelector('.search-full-button');
const fullSearchField = document.querySelector('.js-full-search');
const fullWrapper = document.querySelector('.search-containers');
const header1El = document.querySelector('.youtube-header');
const header2El = document.querySelector('.middle-sections');

closeCompactHeader(fullWrapper, header1El, header2El);

if (fullSearchBtn && fullSearchField) {
    fullSearchBtn.addEventListener('click', () => { performHomeSearch(fullSearchField.value); closeCompactHeader(); });
    fullSearchField.addEventListener('keydown', (e) => { if (e.key === 'Enter') { performHomeSearch(fullSearchField.value); closeCompactHeader(); } });
}
// Also make the adjacent compact search-button behave the same (click triggers search)
const compactSearchButton = document.querySelector('.middle-sections .search-button');
if (compactSearchButton && fullSearchField) {
    compactSearchButton.addEventListener('click', () => { performHomeSearch(fullSearchField.value); closeCompactHeader(); });
}
// Check whether we were just sent here from the second page's search (see
// YouTubeSecondPage.js — it stores the search term in sessionStorage right
// before navigating here) BEFORE loading the homepage feed. Knowing this
// up front lets us skip the normal full-grid render (and the Shorts fetch
// that comes with it) when a search is about to replace it immediately —
// that race is what previously made the search results flash and then get
// replaced a moment later by the Shorts row.
//
// We deliberately do NOT look at a "?search=" URL parameter here. If we
// did, refreshing the page would keep re-running the last search forever
// instead of resetting to the normal full homepage (with Shorts), which is
// what a refresh should do.
(async function initHomepageAndHandleSearchParam() {
    let pendingSearch = null;
    try {
        pendingSearch = sessionStorage.getItem('pendingHomeSearch');
        sessionStorage.removeItem('pendingHomeSearch'); // one-shot: read once, then forget
    } catch (e) {
        console.warn('Could not read pending search', e);
    }

    await fetchAndRenderHomepage(Boolean(pendingSearch));

    // Always start from a clean address bar. Any leftover "?search=" from
    // an earlier visit should not affect a fresh load or a refresh.
    history.replaceState(null, '', window.location.pathname);

    if (pendingSearch) {
        performHomeSearch(pendingSearch, false);
    }
})();

// Select the elements
const nextImageLeft = document.querySelector('.next-image-left');
const nextImageRight = document.querySelector('.next-image-right');
const nextContainer = document.querySelector('.next-container');
const parentContainer = nextContainer.parentElement; // Assuming the parent contains the arrows and the container

// Initialize the current position
let currentPosition = 0;
const currentPositionObj = { value: 0 };

// Add event listeners
nextImageLeft.addEventListener('click', () => moveContainer('left', parentContainer, nextContainer, currentPositionObj, nextImageLeft, nextImageRight));
nextImageRight.addEventListener('click', () => moveContainer('right', parentContainer, nextContainer, currentPositionObj, nextImageLeft, nextImageRight));

// Initial arrow visibility
updateArrowVisibility(parentContainer, nextContainer, currentPositionObj.value, nextImageLeft, nextImageRight);

// Select elements
const header1 = document.querySelector('.youtube-header');
const header2 = document.querySelector('.middle-sections');
const nextContainers = document.querySelector('.next-container');
const searchIcon = document.querySelector('.search-icons');
const suggestButtons = document.querySelectorAll('.suggest');
 const nextImages = document.querySelectorAll('.next-image');
// Show header2 and hide header1 when clicking on search-icons
searchIcon.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent the document click event from firing
    header1.style.display = 'none'; // Hide header1
    header2.style.display = 'flex'; // Show header2
    nextContainers.style.marginTop = '13px'; // Adjust margin
   
    // If viewport is 425px or below, push .next-image by margin-bottom:300px and suggest margin-top:5px
    if (window.innerWidth <= 425) {
        nextImages.forEach(img => {
            img.style.marginBottom = '300px';
        });
        suggestButtons.forEach((button) => {
            button.style.marginTop = '5px'; // Adjust margin for suggest buttons
        });
    }
    
});

// Prevent header2 from disappearing when clicking inside it
header2.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent the document click event from firing
});

// Hide header2 and show header1 when clicking outside of header2
document.addEventListener('click', () => {
    header1.style.display = 'flex'; // Show header1
    header2.style.display = 'none'; // Hide header2
    nextContainers.style.marginTop = '15px'; // Reset margin
    // Revert .next-image and .suggest margin changes for <=425px
    if (window.innerWidth <= 425) {
        nextImages.forEach(img => {
            img.style.marginBottom = '';
        });
        suggestButtons.forEach((button) => {
            button.style.marginTop = '';
        });
    }
});
const nextContainerElement = document.querySelector('.next-container');
if (nextContainerElement) {
    nextContainerElement.addEventListener('click', (event) => {
        const button = event.target.closest('.suggest');
        if (!button) return;

        nextContainerElement.querySelectorAll('.suggest').forEach((btn) => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const suggestText = (button.textContent || '').trim();
        if (!suggestText) return;

        const compactSearchInput = document.querySelector('.js-search-input');
        const fullSearchInput = document.querySelector('.js-full-search');

        if (suggestText.toLowerCase() === 'all') {
            // "All" means "show everything, like a fresh homepage load".
            // Clear the search boxes instead of putting the word "All" into
            // them — leaving the old text in the box was the bug: it made
            // performHomeSearch('') fall back to searching for "All"
            // literally, instead of showing every video.
            if (compactSearchInput) compactSearchInput.value = '';
            if (fullSearchInput) fullSearchInput.value = '';
            performHomeSearch('');
        } else {
            if (compactSearchInput) compactSearchInput.value = suggestText;
            if (fullSearchInput) fullSearchInput.value = suggestText;
            performHomeSearch(suggestText);
        }
    });

    const buttons = nextContainerElement.querySelectorAll('.suggest');
    if (buttons.length > 0) {
        buttons[0].classList.add('active');
    }
}

const sidebar = document.querySelector('.moving-sidebar');
const thumbnailContainer = document.querySelector('.js-thumbnail-container');
const upperContainer = document.querySelector('.next-container');
const leftImage = document.querySelector('.next-image-left');
const leftContained = document.querySelector('.left-contained');
const menu = document.querySelector('.menu');
const menus = document.querySelector('.menus');
const gshoshorts = document.querySelector('.gsho-layout-wrapper');

if (menu && menus && sidebar && thumbnailContainer && upperContainer && leftImage && leftContained) {
    menu.addEventListener('click', () => {
        sidebar.style.display = 'block';
        menu.style.display = 'none';
        menus.style.display = 'block';
        thumbnailContainer.style.marginLeft = '230px';
        upperContainer.style.marginLeft = '255px';
        leftImage.style.marginLeft = '170px';
        leftContained.style.marginLeft = '170px';
        if (gshoshorts) {
            gshoshorts.style.marginLeft = '0px';
            gshoshorts.style.width = 'auto';
        }
    });

    menus.addEventListener('click', () => {
        sidebar.style.display = 'none';
        menu.style.display = 'block';
        menus.style.display = 'none';
        thumbnailContainer.style.marginLeft = '80px';
        upperContainer.style.marginLeft = '105px';
        leftImage.style.marginLeft = '0px';
        leftContained.style.marginLeft = '0px';
        if (gshoshorts) {
            gshoshorts.style.marginLeft = '0px';
            gshoshorts.style.width = 'auto';
        }
    });
}

const move = document.querySelectorAll('.moving-sidebar-container');
if (move.length > 0) {
    move[0].classList.add('active');
    move.forEach((moving) => {
        moving.addEventListener('click', () => {
            move.forEach((btn) => {
                btn.classList.remove('active');
            });
            moving.classList.add('active');
        });
    });
}

const moves = document.querySelectorAll('.ms');
if (moves.length > 0) {
    moves[0].classList.add('active');
    moves.forEach((moving) => {
        moving.addEventListener('click', () => {
            moves.forEach((btn) => {
                btn.classList.remove('active');
            });
            moving.classList.add('active');
        });
    });
}
const menues = document.querySelector('.menues');
const menuesContainer = document.querySelector('.menues-main-Container');
const menuLfs = document.querySelector('.menu-lfs');
const newSidebar = document.querySelector('.menues-main-container');

if (menues && newSidebar) {
    menues.addEventListener('click', () => {
        newSidebar.style.display = 'block';
    });
}

if (menuLfs && newSidebar) {
    menuLfs.addEventListener('click', () => {
        newSidebar.style.display = 'none';
    });
}

if (newSidebar) {
    newSidebar.addEventListener('click', (e) => {
        if (e.target === newSidebar) {
            newSidebar.style.display = 'none';
        }
    });
}

const mediaQueries = window.matchMedia("(min-width:1233px)");
function hands(e) {
    if (e.matches) {
        if (menu) menu.style.display = 'block';
        if (menues) menues.style.display = 'none';
        if (menuLfs) menuLfs.click();
    }
}
hands(mediaQueries);
mediaQueries.addEventListener('change', hands);

const mediaQuery = window.matchMedia("(max-width:1233px)");
function hand(e) {
    if (e.matches) {
        if (menus) menus.click();
        if (menu) menu.style.display = 'none';
        if (menues) menues.style.display = 'block';
    }
}
hand(mediaQuery);
mediaQuery.addEventListener('change', hand);

const Right = document.querySelector('.next-image-right');
const Left = document.querySelector('.next-image-left');
const contained = document.querySelector('.contained');
const containeds = document.querySelector('.left-contained');
const mediaQuer = window.matchMedia("(max-width:540px)");
function handc(e) {
    if (e.matches) {
        if (thumbnailContainer) thumbnailContainer.style.marginLeft = '0px';
        if (nextContainer) nextContainer.style.marginLeft = '30px';
        if (Right) Right.style.marginRight = '-25px';
        if (contained) contained.style.marginRight = '-25px';
        if (Left) Left.style.marginLeft = '7px';
        if (containeds) containeds.style.marginLeft = '7px';
    }
}
handc(mediaQuer);
mediaQuer.addEventListener('change', handc);

const mediaQue = window.matchMedia("(min-width:540px)");
function handcs(e) {
    if (e.matches) {
        if (thumbnailContainer) thumbnailContainer.style.marginLeft = '80px';
        if (nextContainer) nextContainer.style.marginLeft = '105px';
        if (Right) Right.style.marginRight = '8px';
        if (contained) contained.style.marginRight = '0px';
        if (Left) Left.style.marginLeft = '0px';
        if (containeds) containeds.style.marginLeft = '0px';
    }
}
handcs(mediaQue);
mediaQue.addEventListener('change', handcs);

// --- Thumbnail click handling: navigate to second page if video exists; otherwise show a popup ---
const thumbnailContainerEl = document.querySelector('.js-thumbnail-container');
if (thumbnailContainerEl) {
thumbnailContainerEl.addEventListener('click', async (e) => {
    const notInterestedBtn = e.target.closest('.not-interested-popup');
    if (notInterestedBtn) {
        e.stopPropagation();
        const card = notInterestedBtn.closest('.thumbnail-container');
        if (!card) return;
        const contentId = card.dataset.playlistId || card.dataset.videoId;
        if (!contentId) return;
        const token = await getAccessToken();
        const ok = await postNotInterested(contentId, token);
        if (ok) card.style.display = 'none';
        return;
    }

    if (e.target.closest('.dot-menu')) return;
    const card = e.target.closest('.thumbnail-container');
    if (!card) return;
    if (card.dataset.banned === '1') return; // banned content isn't clickable

    const playlistId = card.dataset.playlistId;
    if (playlistId) {
        // Prevent duplicate navigation attempts if the card is double-clicked
        // while the lookup below is still in flight.
        if (card.dataset.playlistLoading === '1') return;
        card.dataset.playlistLoading = '1';

        try {
            const token = await getAccessToken();
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const response = await fetch(
                `https://valviorabackend2.onrender.com/playlistVideoApi?playlistId=${encodeURIComponent(playlistId)}`,
                { headers, credentials: 'include' }
            );

            let firstVideoId = null;
            if (response.ok) {
                const playlist = await response.json();
                firstVideoId = playlist?.videos?.[0]?.videoId || null;
            }

            if (firstVideoId) {
                sessionStorage.setItem('pendingVideoId', firstVideoId);
                window.location.href = `VelvioraWatch?type=playlist&playlistId=${encodeURIComponent(playlistId)}&videoId=${encodeURIComponent(firstVideoId)}`;
            } else {
                // Couldn't resolve the first video here — still navigate with the
                // playlistId so the second page can try to resolve it itself.
                window.location.href = `VelvioraWatch?type=playlist&playlistId=${encodeURIComponent(playlistId)}`;
            }
        } catch (err) {
            console.warn('Failed to resolve first video for playlist', err);
            window.location.href = `VelvioraWatch?type=playlist&playlistId=${encodeURIComponent(playlistId)}`;
        } finally {
            card.dataset.playlistLoading = '0';
        }
        return;
    }

    const videoId = card.dataset.videoId
        || card.querySelector('.thumbnail-image')?.getAttribute('data-video-id');
    if (!videoId) return;

    const notificationChannelId = getChannelIdForVideo(videoId);
    if (notificationChannelId) {
        markNotificationRead(videoId, notificationChannelId).catch((err) => {
            console.warn('Failed to mark notification as read', err);
        });
    }

    sessionStorage.setItem('pendingVideoId', videoId);
    window.location.href = 'VelvioraWatch?videoId=' + encodeURIComponent(videoId);
});
}

setupVoiceSearchButtons();
setupNotificationDropdown();
setupProfileDropdown();
setupYouSidebarDropdown();

// Add event listener for create button to navigate to createchannel.html
// document.addEventListener('DOMContentLoaded', function() {
//     const createBtn = document.querySelector('.create-button');
//     if (createBtn) {
//         window.location.href = 'createchannel.html';
//         createBtn.addEventListener('click', async function() {
//             try {
//                 const has = await userHasChannelBool();
//                 window.location.href = has ? 'dashboard.html' : 'createchannel.html';
//             } catch (e) {
//                 window.location.href = 'createchannel.html';
//             }
//         });
//     }
// });
const createBtnEl = document.querySelector('.create-button');
if (createBtnEl) {
    createBtnEl.addEventListener('click', async (e) => {
        // prevent duplicate clicks
        if (createBtnEl.dataset.processing === '1') return;
        createBtnEl.dataset.processing = '1';

        // replace the create text with a spinner so layout doesn't shift
        const textEl = createBtnEl.querySelector('.create-text');
        if (textEl) {
            // store original text so we can restore later
            if (typeof textEl.dataset.orig === 'undefined') textEl.dataset.orig = textEl.textContent || '';
            textEl.innerHTML = '<span class="create-spinner" style="margin-left:0"><span class="create-spinner-dot" aria-hidden="true"></span></span>';
        } else {
            // fallback: append spinner if .create-text not found
            let spinner = createBtnEl.querySelector('.create-spinner');
            if (!spinner) {
                spinner = document.createElement('span');
                spinner.className = 'create-spinner';
                spinner.innerHTML = '<span class="create-spinner-dot" aria-hidden="true"></span>';
                createBtnEl.appendChild(spinner);
            }
        }
        createBtnEl.classList.add('loading');

        try {
            const has = await userHasChannelBool();
            window.location.href = has ? 'dashboard.html' : 'createchannel.html';
        } catch (err) {
            window.location.href = 'createchannel.html';
        } finally {
            // cleanup in case navigation doesn't happen immediately
            setTimeout(() => {
                createBtnEl.dataset.processing = '0';
                createBtnEl.classList.remove('loading');
                const textEl = createBtnEl.querySelector('.create-text');
                if (textEl && typeof textEl.dataset.orig !== 'undefined') {
                    textEl.textContent = textEl.dataset.orig;
                    delete textEl.dataset.orig;
                } else {
                    const sp = createBtnEl.querySelector('.create-spinner');
                    if (sp) sp.remove();
                }
            }, 1500);
        }
    });
}
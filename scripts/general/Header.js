import { getAccessToken } from '../auth.js';
import { fetchNotifications } from '../notification/notificationStore.js';
import { fetchMyRegistered } from '../account/registeredStore.js';
import { decodeText } from './decodeText.js';

async function loadVideoSummarySuggestions() {
    const container = document.querySelector('.next-container');
    if (!container) return;

    try {
        const token = await getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch('https://valviorabackend2.onrender.com/videoSummaryApi', {
            credentials: 'include',
            headers
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        if (response.status === 204) return;

        const data = await response.json();
        const titles = Array.isArray(data)
            ? data.map((item) => decodeText(item?.title)).filter((title) => typeof title === 'string' && title.trim())
            : [];

        const items = ['All', ...titles].filter(Boolean);
        const existingItems = Array.from(container.querySelectorAll('.suggest'));

        items.forEach((item, index) => {
            let element = existingItems[index];
            if (!element) {
                element = document.createElement('div');
                element.className = 'suggest';
                container.appendChild(element);
            } else {
                element.className = 'suggest';
            }

            element.textContent = decodeText(item);
            element.classList.toggle('active', index === 0);
        });

        existingItems.slice(items.length).forEach((element) => element.remove());
    } catch (error) {
        console.warn('Failed to load video summary suggestions', error);
    }
}

export async function populateVideoSummarySuggestions() {
    await loadVideoSummarySuggestions();
}

export async function populateNotificationBadge() {
    const badge = document.querySelector('.notification-number');
    if (!badge) return;

    const { videoCount } = await fetchNotifications();

    if (!videoCount) {
        badge.style.display = 'none';
        return;
    }

    badge.style.display = '';
    badge.textContent = videoCount > 9 ? '+9' : String(videoCount);
}

export async function populateProfileButton() {
    const btn = document.querySelector('.profile-button');
    if (!btn) return;

    const profile = await fetchMyRegistered();
    if (!profile || !profile.profilePicture) return;

    btn.innerHTML = `<img src="${profile.profilePicture}" alt="Profile" class="profile-button-image">`;
}

export const headerComponent=`
 <div class="youtube-header">
            <div class="left-section">
                <div class="menu">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="menus">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="menues">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <a href="Velviora.html" style="text-decoration:none; color:inherit;" class="youtube-logo-container">
                    <img src="images/velviora-3.png" class="youtube-logo">
                    <div class="youtube">Velviora</div>
                </a>
            </div>
            <div class="middle-section">
                <div class="search-container" style="position:relative">
                    <button class="search-buttons">
                        <img src="images/149852.png" class="search-icon">
                    </button>
                    <input placeholder="Search" class="search-input js-search-input">
                    <button class="search-button" title="Search">
                        <img src="images/149852.png" class="search-icon">
                    </button>
                </div>
                <div class="voice-search-container">
                    <button class="voice-search-button">
                        <img src="images/709950.png" class="voice">
                    </button>
                    <div class="voice-search-text">Search with your voice</div>
                </div>
            </div>
            <div class="right-section">
                <div class="search-with-image good">
                    <div class="search-con">
                        <img src="images/149852.png" class="search-icons">
                    </div>
                    <img src="images/709950.png" class="voices">
                </div>
                <button class="create-button">
                    <span class="plus">+</span>
                    <span class="create-text">Create</span>
                </button>
                <div class="notification-tooltip">
                    <div class="notification-container">
                        <img class="notification-image" src="images/2529521.png">
                        <div class="notification-number"></div>
                    </div>
                    <div class="notification-text">Notifications</div>
                </div>
                <div class="profile-button">
                    A
                </div>
            </div>
        </div>

        <div class="middle-sections">
            <div class="search-containers">
                <button class="search-full-button">
                    <img src="images/149852.png" class="search-icon">
                </button>
                <input placeholder="Search" class="search-inputs2 js-full-search">
                <button class="search-button">
                    <img src="images/149852.png" class="search-icon">
                </button>
            </div>
            <button class="voice-search-button">
                <img src="images/709950.png" class="voice">
            </button>
        </div>

        <div class="sidebar-container">
            <div class="sidebar">
                <a href="Velviora.html" class="sidebarLink">
                    <div>
                        <img src="images/1946436.png" class="sidebar-image">
                    </div>
                    <div class="sidebar-text">Home</div>
                </a>
                <a href="shorts.html" class="sidebarLink">
                    <div>
                        <img src="images/images.jpeg" class="sidebar-image">
                    </div>
                    <div class="sidebar-text">Shorts</div>
                </a>
                <a href="http://localhost:3000/adminDashboard" class="sidebarLink is-admin-only" id="adminSidebarLink">
                    <div>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sidebar-image">
                            <path d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5l7-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="sidebar-text">Admin</div>
                </a>
                <a href="#" class="sidebarLink js-you">
                    <div>
                        <img src="images/1144760.png" class="sidebar-image">
                    </div>
                    <div class="sidebar-text">You</div>
                </a>
            </div>
        </div>
        <div class="left-contained">
        </div>
        <div class="next-image-left">
            <img src="images/130884.png" class="next-image">
        </div>
       <div class="next-container">
            <div class="suggest">All</div>
            <div class="suggest">Podcasts</div>
            <div class="suggest">News</div>
            <div class="suggest">Contemporary worship music</div>
            <div class="suggest">AI Algorithm Lessons</div>
            <div class="suggest">Web Development</div>
            <div class="suggest">Live</div>
            <div class="suggest">Gaming</div>
            <div class="suggest">Array</div>
            <div class="suggest">Computer Hardware</div>
            <div class="suggest">Thrillers</div>
            <div class="suggest">Derivatives</div>
            <div class="suggest">Sketch commedy</div>
            <div class="suggest">Blessings</div>
            <div class="suggest">Watched</div>
            <div class="suggest">New to you</div>
            <div class="suggest">Righteoousness</div>
            <div class="suggest">Jimmy swaggart ministries</div>
            <div class="suggest">Benny hin ministries</div>
            <div class="suggest">WWE update</div>
            <div class="suggest">Christiano ronaldo</div>
            <div class="suggest">Return of Brock Lesnar</div>
            <div class="suggest">The end of the world</div>
            <div class="suggest">The death of charlie kirk</div>
            <div class="suggest">messy</div>
        </div>
        <div class="contained">
        </div>
        <div class="next-image-right">
            <img src="images/14090533.png" class="next-image">
        </div>
`;


export const youtubeHeader = `
   <div class="left-section">
            <div class="menu js-menu-second">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="menus">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="menues">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <a href="Velviora.html" style="text-decoration:none; color:inherit;" class="youtube-logo-container">
                <img src="images/velviora-3.png" class="youtube-logo">
                <div class="youtube">Velviora</div>
            </a>
        </div>
        <div class="middle-section">
            <div class="search-container" style="position:relative">
                <button class="search-buttons">
                    <img src="images/149852.png" class="search-icon">
                </button>
                <input placeholder="Search" class="search-input js-search-input">
                <button class="search-button" title="Search">
                    <img src="images/149852.png" class="search-icon">
                </button>
            </div>
            <div class="voice-search-container">
                <button class="voice-search-button">
                    <img src="images/709950.png" class="voice">
                </button>
                <div class="voice-search-text">Search with your voice</div>
            </div>
        </div>
        <div class="right-section">
            <div class="search-with-image good">
                <div class="search-con">
                    <img src="images/149852.png" class="search-icons">
                </div>
                <img src="images/709950.png" class="voices">
            </div>
            <div class="dot-sign">
                <div class="dotm">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <button class="sign-in-button" aria-label="Sign in">
                    <span class="signin-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" fill="#065fd4" />
                            <path d="M12 8v8M8 12h8" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </span>
                    <span class="signin-text">Sign in</span>
                </button>
            </div>
        </div>
`;

export const headerComponents=`
 <div class="youtube-header">
            <div class="left-section">
                <div class="menu">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="menus">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="menues">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <a href="Velviora.html" style="text-decoration:none; color:inherit;" class="youtube-logo-container">
                    <img src="images/velviora-3.png" class="youtube-logo">
                    <div class="youtube">Velviora</div>
                </a>
            </div>
            <div class="middle-section">
                <div class="search-container" style="position:relative">
                    <button class="search-buttons">
                        <img src="images/149852.png" class="search-icon">
                    </button>
                    <input placeholder="Search" class="search-input js-search-input">
                    <button class="search-button" title="Search">
                        <img src="images/149852.png" class="search-icon">
                    </button>
                </div>
                <div class="voice-search-container">
                    <button class="voice-search-button">
                        <img src="images/709950.png" class="voice">
                    </button>
                    <div class="voice-search-text">Search with your voice</div>
                </div>
            </div>
            <div class="right-section" >
                <div class="search-with-image good">
                    <div class="search-con">
                        <img src="images/149852.png" class="search-icons">
                    </div>
                    <img src="images/709950.png" class="voices">
                </div>
                <button class="create-button">
                    <span class="plus">+</span>
                    <span class="create-text">Create</span>
                </button>
                <div class="notification-tooltip">
                    <div class="notification-container">
                        <img class="notification-image" src="images/2529521.png">
                        <div class="notification-number">9+</div>
                    </div>
                    <div class="notification-text">Notifications</div>
                </div>
                <div class="profile-button">
                    A
                </div>
            </div>
        </div>

        <div class="middle-sections">
            <div class="search-containers">
                <button class="search-full-button">
                    <img src="images/149852.png" class="search-icon">
                </button>
                <input placeholder="Search" class="search-inputs2 js-full-search">
                <button class="search-button">
                    <img src="images/149852.png" class="search-icon">
                </button>
            </div>
            <button class="voice-search-button">
                <img src="images/709950.png" class="voice">
            </button>
        </div>

        
`;
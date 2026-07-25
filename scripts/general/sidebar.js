import { setupAccouWrapperToggle } from './accouWrapperToggle.js';
import { userHasChannelBool } from '../channelApi.js';

setupAccouWrapperToggle();

export function setupSidebarChannelLink() {
    const link = document.querySelector('.js-sidebar-channel-link');
    if (!link || link.dataset.bound === '1') return;
    link.dataset.bound = '1';

    const label = link.querySelector('.sidebar-text');
    const resetState = () => {
        link.dataset.processing = '0';
        link.classList.remove('loading');
        if (label) label.textContent = 'Your Channel';
    };

    link.addEventListener('click', async (event) => {
        event.preventDefault();
        if (link.dataset.processing === '1') return;
        link.dataset.processing = '1';
        link.classList.add('loading');
        if (label) label.textContent = 'Loading...';

        try {
            const has = await userHasChannelBool();
            window.location.href = has ? 'dashboard.html' : 'createchannel.html';
        } catch (err) {
            window.location.href = 'createchannel.html';
        }

        setTimeout(resetState, 1400);
    });

    window.addEventListener('pageshow', () => {
        resetState();
    });
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSidebarChannelLink, { once: true });
    } else {
        setupSidebarChannelLink();
    }
}

export const sidebarComponent = `
<div class="Downbar">
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
            <a href="#" class="sidebarLink js-sidebar-channel-link">
                <div>
                    <svg viewBox="0 0 24 24" class="sidebar-image" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="sidebar-text">Your Channel</div>
            </a>
            <a href="#" class="sidebarLink js-you">
                <div>
                    <img src="images/1144760.png" class="sidebar-image">
                </div>
                <div class="sidebar-text">You</div>
            </a>
        </div>
`;

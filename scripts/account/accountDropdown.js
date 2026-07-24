import { fetchMyRegistered } from './registeredStore.js';
import { userHasChannelBool } from '../channelApi.js';

const accountDropdownMarkup = `
    <div class="accou786-wrapper">
        <div class="accou786-header">
            <div class="accou786-avatar-big">A</div>
            <div class="accou786-meta-data">
                <span class="accou786-user-name"></span>
                <span class="accou786-user-handle"></span>
                <a class="accou786-view-link" href="#">View your channel</a>
            </div>
        </div>
        <hr class="accou786-divider">
        <div id="accou786-menu-container"></div>
    </div>
`;

export function renderAccountDropdown(rootSelector = '#accou786-root') {
    const host = document.querySelector(rootSelector);
    if (!host) return null;

    host.innerHTML = accountDropdownMarkup;
    const wrapper = host.querySelector('.accou786-wrapper');

    populateAccountHeader(wrapper);
    wireViewChannelLink(wrapper);

    return wrapper;
}

async function populateAccountHeader(wrapper) {
    if (!wrapper) return;
    const profile = await fetchMyRegistered();
    if (!profile) return;

    const avatarEl = wrapper.querySelector('.accou786-avatar-big');
    const nameEl = wrapper.querySelector('.accou786-user-name');
    const handleEl = wrapper.querySelector('.accou786-user-handle');

    if (avatarEl && profile.profilePicture) {
        avatarEl.innerHTML = `<img src="${profile.profilePicture}" alt="Profile" class="accou786-avatar-big-image">`;
    }
    if (nameEl) {
        const firstName = profile.firstname || '';
        const secondName = profile.lastname || '';
        const fullName = [firstName, secondName].filter(Boolean).join(' ');
        nameEl.textContent = fullName || profile.username || '';
    }
    if (handleEl && profile.username) {
        const handleBase = String(profile.username).split('@')[0];
        handleEl.textContent = handleBase ? `@${handleBase}` : '';
    }
}

function wireViewChannelLink(wrapper) {
    const viewLink = wrapper?.querySelector('.accou786-view-link');
    if (!viewLink) return;

    viewLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (viewLink.dataset.processing === '1') return;
        viewLink.dataset.processing = '1';

        const origText = viewLink.textContent;
        viewLink.textContent = 'Loading...';

        try {
            const has = await userHasChannelBool();
            window.location.href = has ? 'dashboard.html' : 'createchannel.html';
        } catch (err) {
            window.location.href = 'createchannel.html';
        } finally {
            setTimeout(() => {
                viewLink.dataset.processing = '0';
                viewLink.textContent = origText;
            }, 1500);
        }
    });
}

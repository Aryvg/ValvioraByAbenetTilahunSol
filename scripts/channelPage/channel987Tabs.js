// Handles channel987 tab switching logic for Videos and Shorts

export function setupChannel987Tabs() {
    const tabs = document.querySelectorAll('.channel987-tab-item');
    const videosContainer = document.getElementById('channel987-videos-container');
    const shortsContainer = document.getElementById('channel987-shorts-container');
    const featuredSection = document.querySelector('.channel987-featured-section');
    const trendingShelf = shortsContainer?.closest('.channel987-shelf');
    const videosShelf = videosContainer?.closest('.channel987-shelf');
    const playlistGrid = document.getElementById('playlistGrid');
    // Home and Playlists shelf selectors
    const shelves = document.querySelectorAll('.channel987-shelf');
    const navTabs = document.querySelectorAll('.channel987-tab-item');

    function showOnlyGrids(type) {
        // Hide all channel shelves and featured
        shelves.forEach(shelf => shelf.style.display = 'none');
        if (featuredSection) featuredSection.style.display = 'none';
        if (playlistGrid) playlistGrid.style.display = 'none';
        if (type === 'videos') {
            if (videosShelf) videosShelf.style.display = '';
        } else if (type === 'shorts') {
            if (trendingShelf) trendingShelf.style.display = '';
        } else if (type === 'playlists') {
            if (playlistGrid) playlistGrid.style.display = '';
        }
        navTabs.forEach(tab => tab.classList.remove('channel987-tab-active'));
        if (type === 'videos') {
            navTabs.forEach(tab => {
                if (tab.textContent.trim() === 'Videos') tab.classList.add('channel987-tab-active');
            });
        } else if (type === 'shorts') {
            navTabs.forEach(tab => {
                if (tab.textContent.trim() === 'Shorts') tab.classList.add('channel987-tab-active');
            });
        } else if (type === 'playlists') {
            navTabs.forEach(tab => {
                if (tab.textContent.trim() === 'Playlists') tab.classList.add('channel987-tab-active');
            });
        }
    }

    function showHome() {
        shelves.forEach(shelf => shelf.style.display = '');
        if (featuredSection) featuredSection.style.display = '';
        if (playlistGrid) playlistGrid.style.display = 'none';
        navTabs.forEach(tab => tab.classList.remove('channel987-tab-active'));
        navTabs.forEach(tab => {
            if (tab.textContent.trim() === 'Home') tab.classList.add('channel987-tab-active');
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const text = tab.textContent.trim();
            if (text === 'Videos') {
                showOnlyGrids('videos');
            } else if (text === 'Shorts') {
                showOnlyGrids('shorts');
            } else if (text === 'Playlists') {
                showOnlyGrids('playlists');
            } else if (text === 'Home') {
                showHome();
            } else {
                showHome();
            }
        });
    });
}

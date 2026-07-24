// Responsive and UI logic for channel page
import { menuesContainerComponent } from "../general/menues-container.js";
import { setupSearchInputFocus } from "./searchInputFocus.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Responsive adjustments for channel page at 1482px breakpoint ---
    const mq1482 = window.matchMedia('(max-width:1482px)');
    function handleChannelMq(e) {
        const mainContent = document.querySelector('.channel987-main-content');
        const grid = document.querySelector('.channel987-grid');
        const banner = document.querySelector('.channel987-banner');
        if (e.matches) {
            if (mainContent) mainContent.style.marginLeft = '0';
            if (grid) grid.style.marginRight = '0';
            // if (banner) banner.style.width = '96%';
             if (banner) banner.style.width = '96%';
        } else {
            if (mainContent) mainContent.style.marginLeft = '190px';
            if (grid) grid.style.marginRight = '180px';
            if (banner) banner.style.width = '85%';
        }
    }
    if (mq1482) {
        mq1482.addEventListener('change', handleChannelMq);
        handleChannelMq(mq1482); // initialize on load
    }

    // --- Responsive adjustment for channel banner at 728px and below ---
    const mq728 = window.matchMedia('(max-width:728px)');
    function handleBanner728(e) {
        const banner = document.querySelector('.channel987-banner');
        if (!banner) return;
        if (e.matches) {
            banner.style.width = '90%';
        } else {
            // Remove the 86% width if present
            if (banner.style.width === '90%') {
                banner.style.removeProperty('width');
            }
            // Re-apply the correct width for the current breakpoint
            // Check if 1482px breakpoint is active
            if (window.matchMedia('(max-width:1482px)').matches) {
                banner.style.width = '96%';
            } else {
                banner.style.width = '85%';
            }
        }
    }
    if (mq728) {
        mq728.addEventListener('change', handleBanner728);
        handleBanner728(mq728); // initialize on load
    }
    document.querySelector('.menues-main-container').innerHTML = menuesContainerComponent;
    const sidebar = document.querySelector('.moving-sidebar');
    const menu = document.querySelector('.menu');

   

    // --- Search input focus effect ---
    setupSearchInputFocus();

    // ...existing code...  channel987-main-content, .channel987-grid,  width:95%;
    // media query for 1456px breakpoint – hide sidebar when width is 1456px or less
    const mq1456 = window.matchMedia('(max-width:1482px)');
    function handleMq(e) {
        if (!sidebar) return;
        const his5container = document.querySelector('.his5container');
        const menuEl = document.querySelector('.menu');
        const menusEl = document.querySelector('.menus');
        if (e.matches) {
            sidebar.style.display = 'none';
            if (his5container) his5container.style.marginLeft = '0px';
            if (menuEl) menuEl.style.display = 'none';
            if (menusEl) menusEl.style.display = 'block';
        } else {
            sidebar.style.display = 'block';
            if (his5container) his5container.style.marginLeft = '100px';
            if (menuEl) menuEl.style.display = 'block';
            if (menusEl) menusEl.style.display = 'none';
        }
    }
    if (mq1456) {
        mq1456.addEventListener('change', handleMq);
        handleMq(mq1456); // initialise on load
    }

    // clicking the menu button toggles the sidebar
    if (menu && sidebar) {
        menu.addEventListener('click', () => {
            const his5container = document.querySelector('.his5container');
            const mainContent = document.querySelector('.channel987-main-content');
            const grid = document.querySelector('.channel987-grid');
            const banner = document.querySelector('.channel987-banner');
            if (sidebar.style.display === 'block') {
                sidebar.style.display = 'none';
                if (his5container) his5container.style.marginLeft = '-290px';
                // Set channel page styles as requested
                if (mainContent) mainContent.style.marginLeft = '0';
                if (grid) grid.style.marginRight = '20px';
                grid.style.margin='0 -8px';
                if (banner) banner.style.width = '96%';
            } else {
                sidebar.style.display = 'block';
                if (his5container) his5container.style.marginLeft = '100px';
                // Revert channel page styles to original
                if (mainContent) mainContent.style.marginLeft = '190px';
                if (grid) grid.style.marginRight = '180px';
                if (banner) banner.style.width = '83%';
            }
        });
    }
    document.querySelector('.menus').addEventListener('click', () => {
        document.querySelector('.menues-main-container').style.display = 'block';
    });
    document.querySelector('.menu-lfs').addEventListener('click', () => {
        document.querySelector('.menues-main-container').style.display = 'none';
    });
    document.querySelector('.menues-main-container').addEventListener('click', (e) => {
        // Only hide if clicking the container itself, not its children
        if (e.target === e.currentTarget) {
            document.querySelector('.menues-main-container').style.display = 'none';
        }
    });
    // Show search overlay on search-con click
    const searchCon = document.querySelector('.search-con');
    const searchOverlay = document.querySelector('.search-containers');
    const youtubeHeader = document.querySelector('.youtube-header');
    if (searchCon && searchOverlay && youtubeHeader) {
        searchCon.addEventListener('click', () => {
            searchOverlay.style.display = 'flex';
            youtubeHeader.style.display = 'none';
        });
        const closeBtn = searchOverlay.querySelector('.close-search-overlay');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                searchOverlay.style.display = 'none';
                youtubeHeader.style.display = '';
            });
        }
    }
});

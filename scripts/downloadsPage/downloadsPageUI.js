import { menuesContainerComponent } from "../general/menues-container.js";
import { setupSearchInputFocus } from "./searchInputFocus.js";

export function initializeDownloadsPageUI() {
    const menuesMainContainer = document.querySelector('.menues-main-container');
    if (menuesMainContainer) {
        menuesMainContainer.innerHTML = menuesContainerComponent;
    }

    const sidebar = document.querySelector('.moving-sidebar');
    const menu = document.querySelector('.menu');
    const menus = document.querySelector('.menus');
    const his5container = document.querySelector('.his5container');
    const menuLfs = document.querySelector('.menu-lfs');
    const dowloMainView = document.querySelector('.donwlo-76-main-view');

    // --- Search input focus effect ---
    setupSearchInputFocus();

    // media query for 1456px breakpoint – hide sidebar when width is 1482px or less
    const mq1456 = window.matchMedia('(max-width:1482px)');
    function handleMq(e) {
        if (!sidebar) return;

        const hideSidebar = e.matches;
        sidebar.style.display = hideSidebar ? 'none' : 'block';

        if (his5container) {
            his5container.style.marginLeft = hideSidebar ? '0px' : '100px';
        }
        if (dowloMainView) {
            dowloMainView.style.marginLeft = hideSidebar ? '-10px' : '';
        }
        if (menu) {
            menu.style.display = hideSidebar ? 'none' : 'block';
        }
        if (menus) {
            menus.style.display = hideSidebar ? 'block' : 'none';
        }
    }

    if (mq1456) {
        mq1456.addEventListener('change', handleMq);
        handleMq(mq1456); // initialise on load
    }

    // clicking the menu button toggles the sidebar
    if (menu && sidebar) {
        menu.addEventListener('click', () => {
            const isVisible = sidebar.style.display === 'block';
            sidebar.style.display = isVisible ? 'none' : 'block';
            if (his5container) {
                his5container.style.marginLeft = isVisible ? '-290px' : '100px';
            }
            if (dowloMainView) {
                dowloMainView.style.marginLeft = isVisible ? '-10px' : '200px';
            }
        });
    }

    if (menus && menuesMainContainer) {
        menus.addEventListener('click', () => {
            menuesMainContainer.style.display = 'block';
        });
    }

    if (menuLfs && menuesMainContainer) {
        menuLfs.addEventListener('click', () => {
            menuesMainContainer.style.display = 'none';
        });
    }

    if (menuesMainContainer) {
        menuesMainContainer.addEventListener('click', (e) => {
            // Only hide if clicking the container itself, not its children
            if (e.target === e.currentTarget) {
                menuesMainContainer.style.display = 'none';
            }
        });
    }

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
}

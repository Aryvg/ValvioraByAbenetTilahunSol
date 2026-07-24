
import { updateGfh7ContentMargin } from './gfh7ContentMargin.js';
import { menuesContainerComponent } from "../general/menues-container.js";
import { setupNotificationDropdown } from '../notification/notificationDropdown.js';
import { setupProfileDropdown } from '../account/profileDropdown.js';

setupNotificationDropdown();
window.addEventListener('resize', updateGfh7ContentMargin);
document.addEventListener('DOMContentLoaded', updateGfh7ContentMargin);
document.querySelector('.menues-main-container').innerHTML = menuesContainerComponent;
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

// Setup account/profile dropdown
document.addEventListener('DOMContentLoaded', () => {
    setupProfileDropdown();
});

export { updateGfh7ContentMargin };

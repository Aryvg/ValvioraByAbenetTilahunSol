import { initializeDownloadsPageUI } from "./downloadsPageUI.js";
import { renderDownloadCards } from "./downloadCards.js";
import { setupNotificationDropdown } from '../notification/notificationDropdown.js';
import { setupProfileDropdown } from '../account/profileDropdown.js';
setupProfileDropdown();
setupNotificationDropdown();
document.addEventListener('DOMContentLoaded', () => {
    initializeDownloadsPageUI();
    renderDownloadCards();
});

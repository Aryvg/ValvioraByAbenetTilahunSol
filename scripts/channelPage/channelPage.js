import "./channelPageUI.js";
import "./channelPageData.js";
import { setupChannel987Tabs } from "./channel987Tabs.js";
import { setupNotificationDropdown } from '../notification/notificationDropdown.js';
import { setupProfileDropdown } from '../account/profileDropdown.js';
setupProfileDropdown();
setupNotificationDropdown();
document.addEventListener('DOMContentLoaded', () => {
	setupChannel987Tabs();
});
 // Data to clone the layout exactly
        const playlists = [
            
            { title: "Season 4", count: "343 videos", updated: "Updated today", isFull: false, img: "images/dave.png" },
           
           
            { title: "Season 3", count: "471 videos", updated: "Updated today", isFull: false, img: "images/hello.png" },
            { title: "Best of 'Friends' on 'Ellen'", count: "52 videos", updated: "Updated today", isFull: false, img: "images/astro.png" },
            // { title: "Season 1 - Never Before Streamed!", count: "23 videos", updated: "Updated today", isFull: true, season: "Season 1" },
            // { title: "Season 2 - Never Before Streamed!", count: "165 videos", updated: "Updated today", isFull: true, season: "Season 2" },
            { title: "Season 2", count: "483 videos", updated: "Updated today", isFull: false, img: "images/simon.png" },
            { title: "Most Viewed Halloween Clips of All Time", count: "30 videos", updated: "Updated today", isFull: false, img: "images/smart.png" }
        ];

        const grid = document.getElementById('playlistGrid');

        playlists.forEach(pl => {
            const card = document.createElement('div');
            card.className = 'playgf-71-playlist-card';

            let thumbnailContent = '';
            if(pl.isFull) {
                thumbnailContent = `
                    <div class="playgf-71-episodes-overlay" style="background-color: #00b4ff;">
                        <span>Full Episodes</span>
                        <h2>${pl.season}</h2>
                    </div>
                `;
            } else {
                thumbnailContent = `<img src="${pl.img}" class="playgf-71-main-img">`;
            }

            card.innerHTML = `
                <div class="playgf-71-thumbnail-wrapper">
                    ${thumbnailContent}
                    <div class="playgf-71-video-count">
                        <i class="fas fa-list"></i> ${pl.count}
                    </div>
                </div>
                <div class="playgf-71-playlist-info">
                    <h3>${pl.title}</h3>
                    <div class="playgf-71-meta">
                        <span>${pl.updated}</span>
                        <span class="playgf-71-view-full">View full playlist</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    
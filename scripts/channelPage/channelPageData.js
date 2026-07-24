// Data and rendering logic for channel page shorts and videos

const shortData = [
    { title: "The_Beast_is_unleashed_upon_Roman_Reigns_in_absolute_melee__SmackDown,_Oct._22,_2021", views: "500K views", img: "images/brock.png" },
    { title: "Scaring Celebrities: Best Of", views: "1.2M views", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80" },
    { title: "When kids say the funniest things", views: "890K views", img: "images/astro.png" },
    { title: "Classic Dance Break!", views: "2M views", img: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=300&q=80" },
    { title: "Behind the Scenes Fun", views: "340K views", img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80" },
    { title: "Guest Gifts: Huge Surprise", views: "1.5M views", img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80" },
     { title: "The_Beast_is_unleashed_upon_Roman_Reigns_in_absolute_melee__SmackDown,_Oct._22,_2021", views: "500K views", img: "images/brock.png" },
    { title: "Scaring Celebrities: Best Of", views: "1.2M views", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80" },
    { title: "When kids say the funniest things", views: "890K views", img: "images/astro.png" },
    { title: "Classic Dance Break!", views: "2M views", img: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=300&q=80" },
    { title: "Behind the Scenes Fun", views: "340K views", img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80" },
    { title: "Guest Gifts: Huge Surprise", views: "1.5M views", img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80" }
];

const videoData = [
    { title: "Unexpected Kisses We're Still Processing", views: "118K views", time: "3 weeks ago", dur: "17:11", img: "images/brock.png" },
    { title: "Best of 'Scream 4' Cast", views: "86K views", time: "12 days ago", dur: "3:54", img: "images/simon.png" },
    { title: "11 Times Justin Bieber Was Impossible Not to Love", views: "6.9K views", time: "9 days ago", dur: "39:26", img: "images/dave.png" },
    { title: "Steve Harvey Reacts to Daughter's News", views: "271K views", time: "1 month ago", dur: "4:29", img: "images/astro.png" },
     { title: "Unexpected Kisses We're Still Processing", views: "118K views", time: "3 weeks ago", dur: "17:11", img: "images/brock.png" },
    { title: "Best of 'Scream 4' Cast", views: "86K views", time: "12 days ago", dur: "3:54", img: "images/simon.png" },
    { title: "11 Times Justin Bieber Was Impossible Not to Love", views: "6.9K views", time: "9 days ago", dur: "39:26", img: "images/dave.png" },
    { title: "Steve Harvey Reacts to Daughter's News", views: "271K views", time: "1 month ago", dur: "4:29", img: "images/astro.png" }
];

document.addEventListener('DOMContentLoaded', () => {
    const shortsContainer = document.getElementById('channel987-shorts-container');
    if (shortsContainer) {
        shortData.forEach(s => {
            const div = document.createElement('div');
            div.className = 'channel987-short-card';
            div.innerHTML = `
                <div class="channel987-short-thumb"><img src="${s.img}" alt="short"></div>
                <div class="channel987-short-title">${s.title}</div>
                <div style="font-size:12px; color:#606060;">${s.views}</div>
            `;
            shortsContainer.appendChild(div);
        });
    }

    const videosContainer = document.getElementById('channel987-videos-container');
    if (videosContainer) {
        videoData.forEach(v => {
            const div = document.createElement('div');
            div.className = 'channel987-video-card';
            div.innerHTML = `
                <div class="channel987-video-thumb">
                    <img src="${v.img}" alt="video">
                    <div class="channel987-duration">${v.dur}</div>
                </div>
                <div style="font-size:14px; font-weight:500; margin-bottom:4px;">${v.title}</div>
                <div style="font-size:12px; color:#606060;">TheEllenShow ✔️</div>
                <div style="font-size:12px; color:#606060;">${v.views} • ${v.time}</div>
            `;
            videosContainer.appendChild(div);
        });
    }
});

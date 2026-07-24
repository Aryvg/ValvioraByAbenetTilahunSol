const videoList = [
    {
        title: "The_Beast_is_unleashed_upon_Roman_Reigns_in_absolute_melee__SmackDown,_Oct._22,_2021",
        channel: "WWE",
        views: "500M views",
        time: "3 years ago",
        duration: "8:32",
        img: "images/brock.png"
    },
    {
        title: "React_Full_Course_-_Beginner_to_Pro__React_19,_2025",
        channel: "Supersimple dev",
        views: "768K views",
        time: "5 days ago",
        duration: "3:24",
        img: "images/simon.png"
    },
    {
        title: "FULL MATCH: Cody Rhodes reclaims the Championship",
        channel: "WWE",
        views: "1.6M views",
        time: "4 days ago",
        duration: "22:20",
        img: "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=400&q=80"
    },
    {
        title: "Sia, unstoppable-OFFICIAL",
        channel: "sia official channel",
        views: "200K views",
        time: "3 weeks ago",
        duration: "5:53",
        img: "images/photo_2026-01-30_16-15-27.jpg"
    },
    {
        title: "The_Beast_is_unleashed_upon_Roman_Reigns_in_absolute_melee__SmackDown,_Oct._22,_2021",
        channel: "Design Academy",
        views: "150K views",
        time: "2 weeks ago",
        duration: "43:21",
        img: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=400&q=80"
    },
    {
        title: "Marsil Podcast - Episode 1: The Future of AI",
        channel: "Marsil Media",
        views: "1.1M views",
        time: "1 year ago",
        duration: "1:10:13",
        img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80"
    }
];

export function renderDownloadCards(containerId = 'donwlo-76-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    videoList.forEach(v => {
        const card = document.createElement('div');
        card.className = 'donwlo-76-card';
        card.innerHTML = `
            <div class="donwlo-76-thumb-wrapper">
                <img class="donwlo-76-thumb-img" src="${v.img}" alt="thumbnail">
                <div class="donwlo-76-timestamp">${v.duration}</div>
            </div>
            <div class="donwlo-76-details">
                <div class="donwlo-76-text-info">
                    <div class="donwlo-76-video-title">${v.title}</div>
                    <div class="donwlo-76-meta-line">${v.channel}</div>
                    <div class="donwlo-76-meta-line">${v.views} • ${v.time}</div>
                    <div class="donwlo-76-badge">Downloaded</div>
                </div>
                <div class="donwlo-76-more-btn" role="button" tabindex="0" aria-label="More options">⋮</div>
            </div>
        `;
        container.appendChild(card);
    });
}

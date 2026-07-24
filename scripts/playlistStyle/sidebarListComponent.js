export function getSidebarList(sidebar) {
    let sidebarList = '';
    sidebar.forEach((sidebars) => {
        sidebarList += `
 <div class="sidebar-item-container">
    <div class="image-text">
                <div class="image-container-side">
                    <img src="${sidebars.image}" class="side-image" data-id="${sidebars.id}" role="button" tabindex="0" />
                </div>
                <div class="texts-container">
                    <div class="title">${sidebars.title}
                    </div>
                    <div class="channel-name">${sidebars.channelName}</div>
                    <div class="channel-name">${sidebars.subscriber}</div>
                </div>
    </div>
    <div class="three-dots-sidebar" role="button" tabindex="0" aria-label="More options">
        <div></div>
        <div></div>
        <div></div>
    </div>
    </div>
   `
    });
    return sidebarList;
}

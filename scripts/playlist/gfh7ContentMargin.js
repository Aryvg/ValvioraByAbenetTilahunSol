// Ensure gfh7-content doesn't move past left edge at 1075px
export function updateGfh7ContentMargin() {
    const content = document.querySelector('.gfh7-content');
    if (!content) return;
    const minWidth = 1075;
    if (window.innerWidth > minWidth) {
        content.style.marginLeft = '-350px';
    } else {
        content.style.marginLeft = '0px';
    }
}

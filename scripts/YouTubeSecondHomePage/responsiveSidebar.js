// Ensure .texts-container and .three-dots-sidebar are side by side at <=846px
function updateSidebarLayout() {
  const isSmall = window.innerWidth <= 846;
  document.querySelectorAll('.sidebar-item-container .image-text').forEach(imageText => {
    const texts = imageText.querySelector('.texts-container');
    const dots = imageText.querySelector('.three-dots-sidebar');
    if (!texts || !dots) return;
    if (isSmall) {
      // Move dots inside texts-container as last child
      if (dots.parentElement !== texts) {
        texts.appendChild(dots);
      }
    } else {
      // Move dots back outside texts-container if needed
      if (dots.parentElement === texts) {
        imageText.appendChild(dots);
      }
    }
  });
}
window.addEventListener('resize', updateSidebarLayout);
window.addEventListener('DOMContentLoaded', updateSidebarLayout);

// Observe DOM changes to handle dynamically rendered sidebar
const sidebarObserver = new MutationObserver(updateSidebarLayout);
sidebarObserver.observe(document.body, { childList: true, subtree: true });

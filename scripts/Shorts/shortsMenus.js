// Handles menu open/close for Shorts page
export function setupShortsMenus() {
  const menusBtn = document.querySelector('.menus');
  const menuLfsBtn = document.querySelector('.menu-lfs');
  const menuesMainContainer = document.querySelector('.menues-main-container');

  if (menusBtn && menuesMainContainer) {
    menusBtn.addEventListener('click', () => {
      menuesMainContainer.style.display = 'block';
    });
  }
  if (menuLfsBtn && menuesMainContainer) {
    menuLfsBtn.addEventListener('click', () => {
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
}


// Controls visibility of moving-sidebar responsively
export function updateSidebarVisibility() {
  const sidebar = document.querySelector('.moving-sidebar');
  if (!sidebar) return;
  if (window.innerWidth <= 1080) {
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = 'block';
  }
}

export function setupSidebarVisibility() {
  document.addEventListener('DOMContentLoaded', updateSidebarVisibility);
  window.addEventListener('resize', updateSidebarVisibility);
}

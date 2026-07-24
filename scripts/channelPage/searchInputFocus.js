export function setupSearchInputFocus() {
    const searchContainer = document.querySelector('.his5search-container');
    const searchInput = searchContainer && searchContainer.querySelector('input[type="text"][placeholder="Search watch history"]');
    if (searchInput && searchContainer) {
        searchInput.addEventListener('focus', () => {
            searchContainer.classList.add('focused');
        });
        searchInput.addEventListener('blur', () => {
            searchContainer.classList.remove('focused');
        });
        // Remove focus if clicking anywhere else
        document.addEventListener('mousedown', (e) => {
            if (e.target !== searchInput) {
                searchContainer.classList.remove('focused');
            }
        });
    }
}

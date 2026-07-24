// Handles sidebar 'You' button dropdown logic
export function setupYouSidebarDropdown() {
    const youBtn = document.querySelector('.js-you');
    const accouWrapper = document.querySelector('.accou786-wrapper');
    if (youBtn && accouWrapper) {
        let isOpen = false;
        function showWrapper() {
            accouWrapper.style.display = 'block';
            isOpen = true;
        }
        function hideWrapper() {
            accouWrapper.style.display = 'none';
            isOpen = false;
        }
        youBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isOpen) {
                hideWrapper();
            } else {
                showWrapper();
            }
        });
        accouWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        document.addEventListener('click', () => {
            if (isOpen) hideWrapper();
        });
    }
}

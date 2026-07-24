// Handles toggling and hiding of accou786-wrapper when .js-you is clicked
export function setupAccouWrapperToggle() {
    document.addEventListener('click', function(event) {
        const accouWrapper = document.querySelector('.accou786-wrapper');
        const isYouBtn = event.target.closest('.js-you');
        const isAccouWrapper = event.target.closest('.accou786-wrapper');
        if (isYouBtn) {
            if (accouWrapper) {
                if (accouWrapper.style.display === 'block') {
                    accouWrapper.style.display = 'none';
                } else {
                    accouWrapper.style.display = 'block';
                }
            }
        } else if (!isAccouWrapper) {
            if (accouWrapper) accouWrapper.style.display = 'none';
        }
    });
}

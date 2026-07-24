// Handles notification dropdown show/hide logic
export function setupNotificationDropdown() {
    const notificationContainer = document.querySelector('.notification-container');
    const notiWrapper = document.querySelector('.noti896g-wrapper');
    if (notificationContainer && notiWrapper) {
        // Hide initially
        notiWrapper.style.display = 'none';
        let isOpen = false;

        function showWrapper() {
            notiWrapper.style.display = 'block';
            isOpen = true;
        }
        function hideWrapper() {
            notiWrapper.style.display = 'none';
            isOpen = false;
        }


        notificationContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            // Hide the profile dropdown if open
            const accouWrapper = document.querySelector('.accou786-wrapper');
            if (accouWrapper && accouWrapper.style.display !== 'none') {
                accouWrapper.style.display = 'none';
            }
            if (isOpen) {
                hideWrapper();
            } else {
                showWrapper();
            }
        });

        // Prevent clicks inside the wrapper from closing it
        notiWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (isOpen) {
                hideWrapper();
            }
        });
    }
}

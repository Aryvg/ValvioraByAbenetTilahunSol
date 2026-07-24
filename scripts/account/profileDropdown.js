// Handles profile dropdown show/hide logic

export function setupProfileDropdown() {
    const profileButton = document.querySelector('.profile-button');
    const accouWrapper = document.querySelector('.accou786-wrapper');
    if (profileButton && accouWrapper) {
        // Hide initially
        accouWrapper.style.display = 'none';
        let isOpen = false;

        function showWrapper() {
            accouWrapper.style.display = 'block';
            isOpen = true;
        }
        function hideWrapper() {
            accouWrapper.style.display = 'none';
            isOpen = false;
        }


        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Hide the notification dropdown if open
            const notiWrapper = document.querySelector('.noti896g-wrapper');
            if (notiWrapper && notiWrapper.style.display !== 'none') {
                notiWrapper.style.display = 'none';
            }
            if (isOpen) {
                hideWrapper();
            } else {
                showWrapper();
            }
        });

        // Prevent clicks inside the wrapper from closing it
        accouWrapper.addEventListener('click', (e) => {
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

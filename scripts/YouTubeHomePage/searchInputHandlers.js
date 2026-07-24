export function setupSearchInputHandlers() {
    const input = document.querySelector('.js-search-input');
    const button = document.querySelector('.search-buttons');
    const searchInput = document.querySelector('.search-input');
    if (input && button && searchInput) {
        input.addEventListener('click', () => {
            button.style.display = 'block';
            searchInput.style.marginRight = '0px';
        });
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target)) {
                button.style.display = 'none';
                searchInput.style.marginRight = '-1px';
            }
        });
    }

    const input2 = document.querySelector('.js-full-search');
    const searchInputs2 = document.querySelector('.search-inputs2');
    if (input2 && searchInputs2) {
        input2.addEventListener('click', () => {
            document.querySelector('.search-full-button').style.display = "block";
            searchInputs2.style.marginRight = '0px';
        });
        document.addEventListener('click', (e) => {
            if (!input2.contains(e.target)) {
                document.querySelector('.search-full-button').style.display = "none";
                searchInputs2.style.marginRight = '-1px';
            }
        });
    }
}



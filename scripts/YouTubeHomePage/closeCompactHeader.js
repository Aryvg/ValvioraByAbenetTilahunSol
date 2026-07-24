export function closeCompactHeader(fullWrapper, header1El, header2El) {
    if (header1El) header1El.style.display = 'flex';
    if (header2El) header2El.style.display = 'none';
    const nextContainers = document.querySelector('.next-container');
    if (nextContainers) nextContainers.style.marginTop = '15px';
    if (fullWrapper) fullWrapper.classList.remove('search-active');
}
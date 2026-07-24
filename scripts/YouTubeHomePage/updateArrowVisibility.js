export function updateArrowVisibility(parentContainer, nextContainer, currentPosition, nextImageLeft, nextImageRight) {
    const parentWidth = parentContainer.offsetWidth; // Width of the parent container
    const containerWidth = nextContainer.scrollWidth; // Total width of the next-container

    // Hide or show the left arrow
    if (currentPosition >= 0) {
        nextImageLeft.style.display = 'none';
    } else {
        nextImageLeft.style.display = 'block';
    }

    // Hide or show the right arrow
    if (Math.abs(currentPosition) >= containerWidth - parentWidth) {
        nextImageRight.style.display = 'none';
    } else {
        nextImageRight.style.display = 'block';
    }
}

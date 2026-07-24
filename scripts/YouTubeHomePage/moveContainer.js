import { updateArrowVisibility } from './updateArrowVisibility.js';

export function moveContainer(direction, parentContainer, nextContainer, currentPositionObj, nextImageLeft, nextImageRight) {
    const step = 100; // Adjust the step size as needed
    const parentWidth = parentContainer.offsetWidth; // Width of the parent container
    const containerWidth = nextContainer.scrollWidth; // Total width of the next-container

    if (direction === 'left') {
        // Prevent moving beyond the left boundary
        if (currentPositionObj.value + step <= 0) {
            currentPositionObj.value += step;
        }
    } else if (direction === 'right') {
        // Prevent moving beyond the right boundary
        if (Math.abs(currentPositionObj.value - step) <= containerWidth - parentWidth) {
            currentPositionObj.value -= step;
        }
    }

    nextContainer.style.transform = `translateX(${currentPositionObj.value}px)`;
    updateArrowVisibility(parentContainer, nextContainer, currentPositionObj.value, nextImageLeft, nextImageRight); // Update arrow visibility after moving
}

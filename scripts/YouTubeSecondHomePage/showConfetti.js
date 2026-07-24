export function showConfetti(buttonEl) {
    // Remove existing confetti (if any)
    const old = document.querySelector('.confetti-container');
    if (old) old.remove();

    const rect = buttonEl.getBoundingClientRect();
    const container = document.createElement('div');
    container.className = 'confetti-container';
    // position container at the top-left of the button so pieces originate there
    container.style.left = rect.left + 'px';
    container.style.top = rect.top + 'px';
    container.style.width = rect.width + 'px';
    document.body.appendChild(container);

    const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#5856d6'];
    const count = 28;

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        // place piece at a random horizontal position within the button width
        piece.style.left = Math.round(Math.random() * rect.width) + 'px';
        // slight vertical offset so pieces look like they burst out
        piece.style.top = (Math.random() * 6 - 6) + 'px';
        // random horizontal travel
        const tx = Math.round(Math.random() * 300 - 150) + 'px';
        piece.style.setProperty('--tx', tx);
        // random animation duration and delay for variety (longer so confetti lingers)
        piece.style.animationDuration = (1300 + Math.random() * 900) + 'ms'; // ~1.3s - 2.2s
        piece.style.animationDelay = (80 + Math.random() * 220) + 'ms';
        container.appendChild(piece);
    }

    // Remove confetti container after animation finishes (allow for longer durations)
    setTimeout(() => {
        container.remove();
    }, 2600);
}

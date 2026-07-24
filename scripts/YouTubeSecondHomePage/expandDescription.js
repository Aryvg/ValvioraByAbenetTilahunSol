export function expandDescription(btn, collapseDescription) {
    const section = btn.closest('.description-section');
    if (!section) return;
    const explanation = section.querySelector('.video-explanation');
    const description = section.querySelector('.video-description');
    if (!explanation) return;

    // already expanded?
    if (btn.getAttribute('data-expanded') === 'true') return;

    // Capture original truncated height before expanding
    const truncatedHeight = explanation.scrollHeight;
    explanation.setAttribute('data-original-height', truncatedHeight + 'px');
    
    explanation.style.overflow = 'hidden';
    explanation.style.transition = 'max-height 300ms ease';
    explanation.style.maxHeight = truncatedHeight + 'px';
    explanation.classList.add('expanded');

    // Show video-description
    if (description) {
        description.style.display = 'block';
    }

    // Change button text to "Show less"
    btn.textContent = 'Show less';
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Show less');
    btn.setAttribute('data-expanded', 'true');

    // animate to full height
    requestAnimationFrame(() => {
        explanation.style.maxHeight = explanation.scrollHeight + 'px';
    });

    btn.focus();
}

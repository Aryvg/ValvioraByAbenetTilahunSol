export function collapseDescription(btn, explanation) {
    if (!explanation) return;

    const section = explanation.closest('.description-section');
    const description = section?.querySelector('.video-description');
    const originalHeight = explanation.getAttribute('data-original-height') || '34px';
    
    // animate close
    explanation.style.maxHeight = explanation.scrollHeight + 'px';
    requestAnimationFrame(() => {
        explanation.style.maxHeight = originalHeight;
    });

    const handler = function () {
        explanation.removeEventListener('transitionend', handler);
        clearTimeout(timeoutId);
        explanation.classList.remove('expanded');
        explanation.style.maxHeight = '';
        explanation.style.overflow = '';
        explanation.style.transition = '';
        
        // Hide video-description
        if (description) {
            description.style.display = 'none';
        }
        
        btn.textContent = '...more';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Show more');
        btn.setAttribute('data-expanded', 'false');
        btn.focus();
    };

    explanation.addEventListener('transitionend', handler);
    
    // Fallback for short descriptions where transition doesn't fire
    const timeoutId = setTimeout(handler, 350);
}

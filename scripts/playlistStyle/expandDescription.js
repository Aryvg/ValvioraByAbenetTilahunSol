export function expandDescription(btn, collapseDescription) {
    const section = btn.closest('.description-section');
    if (!section) return;
    const textContainer = section.querySelector('.description-text');
    if (!textContainer) return;
    const desc = textContainer.querySelector('.video-description');
    if (!desc) return;

    // already expanded?
    if (desc.getAttribute('data-expanded') === 'true') return;

    // prepare animation and show
    desc.style.display = 'block';
    desc.style.overflow = 'hidden';
    desc.style.maxHeight = '0px';
    desc.style.transition = 'max-height 320ms ease';
    desc.style.marginTop = '6px';

    // hide original '...more' button while expanded
    btn.style.display = 'none';
    btn.setAttribute('aria-expanded', 'true');

    // create show-less button after description
    const showLess = document.createElement('button');
    showLess.className = 'show-less-button';
    showLess.textContent = 'Show less';
    showLess.setAttribute('aria-label', 'Show less');
    showLess.addEventListener('click', () => collapseDescription(btn, desc, showLess));
    showLess.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            collapseDescription(btn, desc, showLess);
        }
    });

    textContainer.insertBefore(showLess, btn.nextSibling);

    // animate open
    requestAnimationFrame(() => {
        desc.style.maxHeight = desc.scrollHeight + 'px';
    });

    desc.setAttribute('data-expanded', 'true');
    showLess.focus();
}

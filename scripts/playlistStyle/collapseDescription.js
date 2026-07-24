export function collapseDescription(btn, desc, showLess) {
    if (!desc) return;
    // animate close
    desc.style.maxHeight = desc.scrollHeight + 'px';
    requestAnimationFrame(() => {
        desc.style.maxHeight = '0px';
    });

    const handler = function () {
        desc.removeEventListener('transitionend', handler);
        desc.style.display = 'none';
        desc.style.maxHeight = '';
        desc.style.overflow = '';
        desc.setAttribute('data-expanded', 'false');
        btn.style.display = '';
        btn.setAttribute('aria-expanded', 'false');
        if (showLess && showLess.parentNode) showLess.parentNode.removeChild(showLess);
        btn.focus();
    };

    desc.addEventListener('transitionend', handler);
}

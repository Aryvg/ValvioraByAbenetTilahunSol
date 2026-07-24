export function buildSharePopupMarkup(shareUrl) {
  return `
    <div class="share-popup-overlay" hidden>
      <div class="share-popup" role="dialog" aria-modal="true" aria-label="Share video">
        <button class="share-popup-close" type="button" aria-label="Close share popup">&times;</button>
        <h3>Share this video</h3>
        <p class="share-popup-link-label">Copy this link:</p>
        <div class="share-popup-row">
          <a class="share-popup-link" href="${shareUrl}" target="_blank" rel="noopener noreferrer">${shareUrl}</a>
          <button class="share-popup-copy" type="button" aria-label="Copy video link">📋</button>
        </div>
      </div>
    </div>
  `;
}

export function setupSharePopup(container) {
  const shareButton = container.querySelector('.share-button');
  const shareOverlay = container.querySelector('.share-popup-overlay');
  const shareCloseButton = container.querySelector('.share-popup-close');
  const shareCopyButton = container.querySelector('.share-popup-copy');
  const shareLink = container.querySelector('.share-popup-link');

  const closeSharePopup = () => {
    if (shareOverlay) shareOverlay.hidden = true;
  };

  const openSharePopup = (event) => {
    if (event) event.stopPropagation();
    if (shareOverlay) shareOverlay.hidden = false;
  };

  if (shareOverlay) {
    shareOverlay.hidden = true;
  }

  if (shareButton && shareOverlay) {
    shareButton.addEventListener('click', openSharePopup);
  }

  if (shareCloseButton) {
    shareCloseButton.addEventListener('click', closeSharePopup);
  }

  if (shareOverlay) {
    shareOverlay.addEventListener('click', (event) => {
      if (event.target === shareOverlay) closeSharePopup();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSharePopup();
    });
  }

  if (shareCopyButton && shareLink) {
    shareCopyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareLink.href);
        shareCopyButton.textContent = '✓';
        shareCopyButton.setAttribute('title', 'Copied');
        setTimeout(() => {
          shareCopyButton.textContent = '📋';
          shareCopyButton.setAttribute('title', 'Copy video link');
        }, 1200);
      } catch (error) {
        console.warn('Copy failed', error);
      }
    });
  }
}

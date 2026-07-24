export function setupDownloadButton(container, src, videoTitle) {
  const downloadBtn = container.querySelector('.download-button');
  if (!downloadBtn || !src) return;

  downloadBtn.addEventListener('click', async () => {
    if (downloadBtn.dataset.state === 'downloading' || downloadBtn.dataset.state === 'downloaded') return;

    downloadBtn.dataset.state = 'downloading';
    downloadBtn.textContent = 'Downloading...';

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${(videoTitle || 'video').replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'video'}.mp4`;
      link.click();
      URL.revokeObjectURL(link.href);

      downloadBtn.dataset.state = 'downloaded';
      downloadBtn.textContent = 'Downloaded';
    } catch (error) {
      console.warn('Download failed', error);
      downloadBtn.dataset.state = '';
      downloadBtn.textContent = 'Download';
    }
  });
}

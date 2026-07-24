import { userHasChannelBool } from '../channelApi.js';

export function setupCreateButton() {
  const createBtn = document.querySelector('.create-button');
  if (!createBtn || createBtn.dataset.bound === '1') return;

  createBtn.dataset.bound = '1';

  createBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (createBtn.dataset.processing === '1') return;

    createBtn.dataset.processing = '1';
    createBtn.classList.add('loading');

    const textEl = createBtn.querySelector('.create-text');
    if (textEl) {
      if (typeof textEl.dataset.orig === 'undefined') {
        textEl.dataset.orig = textEl.textContent || '';
      }
      textEl.innerHTML = '<span class="create-spinner" style="margin-left:0"><span class="create-spinner-dot" aria-hidden="true"></span></span>';
    } else {
      let spinner = createBtn.querySelector('.create-spinner');
      if (!spinner) {
        spinner = document.createElement('span');
        spinner.className = 'create-spinner';
        spinner.innerHTML = '<span class="create-spinner-dot" aria-hidden="true"></span>';
        createBtn.appendChild(spinner);
      }
    }

    try {
      const has = await userHasChannelBool();
      window.location.href = has ? 'dashboard.html' : 'createchannel.html';
    } catch (err) {
      window.location.href = 'createchannel.html';
    } finally {
      setTimeout(() => {
        createBtn.dataset.processing = '0';
        createBtn.classList.remove('loading');

        const currentTextEl = createBtn.querySelector('.create-text');
        if (currentTextEl && typeof currentTextEl.dataset.orig !== 'undefined') {
          currentTextEl.textContent = currentTextEl.dataset.orig;
          delete currentTextEl.dataset.orig;
        } else {
          const spinnerEl = createBtn.querySelector('.create-spinner');
          if (spinnerEl) spinnerEl.remove();
        }
      }, 600);
    }
  });
}

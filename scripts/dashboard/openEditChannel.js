// Register the open-edit-channel button listener
import { getAccessToken } from '../auth.js';
import {
  showError,
  fetchCurrentChannel,
  buildChannelFormData,
  updateChannelOnServer,
  updateLocalCacheAndUI,
  clearFieldError,
  validateChannelForm
} from './editChannelHelpers.js';

export function setupOpenEditChannel(toggleModal) {
  const btn = document.getElementById('openEditChanBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const data = JSON.parse(localStorage.getItem('myChannel')) || { name: '', desc: '', contact: '' };
      const nameEl = document.getElementById('editChanName');
      const descEl = document.getElementById('editChanDesc');
      const emailEl = document.getElementById('editChanEmail');
      if (nameEl) nameEl.value = data.name || '';
      if (descEl) descEl.value = data.desc || '';
      if (emailEl) emailEl.value = data.contact || '';
      toggleModal('editChannelModal', true);
    });
  }

  // When saving channel changes, send them to backend (uploads included)
  const saveBtn = document.getElementById('saveChanBtn');
  if (!saveBtn) return;

  // Wire up live validation clearing on input so messages disappear as user types
  const nameInput = document.getElementById('editChanName');
  if (nameInput) nameInput.addEventListener('input', () => clearFieldError('editChanName'));
  const typeInput = document.getElementById('editChanType');
  if (typeInput) typeInput.addEventListener('input', () => clearFieldError('editChanType'));
  const descInput = document.getElementById('editChanDesc');
  if (descInput) descInput.addEventListener('input', () => clearFieldError('editChanDesc'));
  const emailInput = document.getElementById('editChanEmail');
  if (emailInput) emailInput.addEventListener('input', () => clearFieldError('editChanEmail'));
  const pfpInput = document.getElementById('editChanPfp');
  if (pfpInput) pfpInput.addEventListener('change', () => clearFieldError('editChanPfp'));
  const bannerInput = document.getElementById('editChanBanner');
  if (bannerInput) bannerInput.addEventListener('change', () => clearFieldError('editChanBanner'));
  saveBtn.addEventListener('click', async () => {
    const originalBtnHTML = saveBtn.innerHTML;

    // Validate before doing any network activity
    const valid = validateChannelForm();
    if (!valid) {
      // do not proceed if invalid; user-facing messages are shown per-field
      return;
    }

    // NOTE: .loading CSS class should be defined in stylesheet to show a spinner
    try {
      saveBtn.disabled = true;
      saveBtn.classList.add('loading');
      saveBtn.innerText = ' Saving...';

      const token = await getAccessToken();
      if (!token) {
        showError('You must be logged in to update the channel.');
        return;
      }

      const channel = await fetchCurrentChannel(token);
      if (!channel || !channel.channelId) {
        showError('No channel found to update.');
        return;
      }

      const channelId = channel.channelId;
      const formData = buildChannelFormData(channelId);

      const updated = await updateChannelOnServer(token, channelId, formData);
      if (!updated) return;

      updateLocalCacheAndUI(updated);
      toggleModal('editChannelModal', false);
    } catch (e) {
      console.error('Failed to update channel:', e);
      showError('An unexpected error occurred while updating channel.');
    } finally {
      try {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        saveBtn.innerHTML = originalBtnHTML;
      } catch (err) {
        // ignore if button was removed from DOM
      }
    }
  });
}

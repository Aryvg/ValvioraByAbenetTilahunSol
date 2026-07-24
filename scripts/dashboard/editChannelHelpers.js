// Helper utilities for edit channel flow

const API_BASE = 'https://valviorabackend2.onrender.com';

/**
 * Show an error message to the user.
 * Tries to set the text of an element with id 'editChanError', falls back to alert().
 * @param {string} msg - The error message to display
 */
export function showError(msg) {
  const el = document.getElementById('editChanError');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  } else {
    alert(msg);
  }
}

/**
 * Fetch the current channel for the authenticated user.
 * @param {string} token - Access token string
 * @returns {Promise<Object|null>} Channel object or null on failure
 */
export async function fetchCurrentChannel(token) {
  try {
    const res = await fetch(`${API_BASE}/channelApi`, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      showError('Unable to retrieve current channel.');
      return null;
    }
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    console.error('fetchCurrentChannel error', err);
    showError('Network error while fetching channel.');
    return null;
  }
}

/**
 * Build FormData for updating a channel from form fields.
 * @param {string} channelId - The channelId to include
 * @returns {FormData}
 */
export function buildChannelFormData(channelId) {
  const formData = new FormData();
  formData.append('channelId', channelId);
  const name = document.getElementById('editChanName')?.value || '';
  const desc = document.getElementById('editChanDesc')?.value || '';
  const email = document.getElementById('editChanEmail')?.value || '';
  formData.append('channelname', name);
  formData.append('Description', desc);
  formData.append('contactEmail', email);
  const pfp = document.getElementById('editChanPfp')?.files?.[0];
  const banner = document.getElementById('editChanBanner')?.files?.[0];
  if (pfp) formData.append('profilePicture', pfp);
  if (banner) formData.append('channelBanner', banner);
  return formData;
}

/**
 * Send the update request to the server for a specific channelId.
 * @param {string} token - Access token
 * @param {string} channelId - Channel identifier
 * @param {FormData} formData - Payload
 * @returns {Promise<Object|null>} Parsed JSON response or null on failure
 */
export async function updateChannelOnServer(token, channelId, formData) {
  try {
    const res = await fetch(`${API_BASE}/channelApi/${encodeURIComponent(channelId)}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token },
      body: formData
    });
    if (!res.ok) {
      showError('Failed to update channel on server.');
      console.error('updateChannelOnServer status', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('updateChannelOnServer error', err);
    showError('Network error while updating channel.');
    return null;
  }
}

/**
 * Update localStorage and UI elements with the refreshed channel data.
 * @param {Object} updated - Server-returned channel object
 */
export function updateLocalCacheAndUI(updated) {
  try {
    const name = updated.channelname || document.getElementById('editChanName')?.value || '';
    const desc = updated.Description || document.getElementById('editChanDesc')?.value || '';
    const contact = updated.contactEmail || document.getElementById('editChanEmail')?.value || '';
    const payload = {
      name,
      desc,
      contact,
      pfp: updated.profilePicture || null,
      banner: updated.channelBanner || null,
      channelId: updated.channelId || null,
      id: updated.channelId || null
    };
    localStorage.setItem('myChannel', JSON.stringify(payload));

    const nameEl = document.getElementById('dashName'); if (nameEl) nameEl.innerText = payload.name || 'Channel Name';
    const descEl = document.getElementById('dashDesc'); if (descEl) descEl.innerText = payload.desc || '';
    const contactEl = document.getElementById('dashContact'); if (contactEl) contactEl.innerText = payload.contact || '';
    if (payload.pfp) {
      const pfpEl = document.getElementById('dashPfp'); if (pfpEl) pfpEl.style.backgroundImage = `url(${payload.pfp})`;
      const headerPfp = document.getElementById('headerPfp'); if (headerPfp) headerPfp.style.backgroundImage = `url(${payload.pfp})`;
    }
    if (payload.banner) {
      const bannerEl = document.getElementById('dashBanner'); if (bannerEl) bannerEl.style.backgroundImage = `url(${payload.banner})`;
    }
  } catch (err) {
    console.warn('updateLocalCacheAndUI failed', err);
  }
}

/**
 * Display a validation error message for a specific input field.
 * @param {string} fieldId - The input id (e.g. 'editChanName')
 * @param {string} message - The validation message to show
 */
export function setFieldError(fieldId, message) {
  try {
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = 'block';
    }
    const input = document.getElementById(fieldId);
    if (input) input.setAttribute('aria-invalid', 'true');
  } catch (e) {
    /* ignore */
  }
}

/**
 * Clear validation message for a specific input field.
 * @param {string} fieldId
 */
export function clearFieldError(fieldId) {
  try {
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) {
      errEl.textContent = '';
      errEl.style.display = 'none';
    }
    const input = document.getElementById(fieldId);
    if (input) input.removeAttribute('aria-invalid');
  } catch (e) {
    /* ignore */
  }
}

/**
 * Validate channel edit form fields according to length constraints.
 * - channelname: max 50
 * - channelType (optional): max 50
 * - Description: max 200
 * - contactEmail: max 70
 * Shows per-field messages and returns boolean.
 * @returns {boolean} true if valid
 */
export function validateChannelForm() {
  let valid = true;
  // clear prior
  clearFieldError('editChanName');
  clearFieldError('editChanType');
  clearFieldError('editChanDesc');
  clearFieldError('editChanEmail');
  clearFieldError('editChanPfp');
  clearFieldError('editChanBanner');

  const name = (document.getElementById('editChanName')?.value || '');
  if (name.length > 50) {
    setFieldError('editChanName', 'Channel name must not exceed 50 characters.');
    valid = false;
  }

  const typeEl = document.getElementById('editChanType');
  if (typeEl) {
    const typeVal = (typeEl.value || '');
    if (typeVal.length > 50) {
      setFieldError('editChanType', 'Channel type must not exceed 50 characters.');
      valid = false;
    }
  }

  const desc = (document.getElementById('editChanDesc')?.value || '');
  if (desc.length > 200) {
    setFieldError('editChanDesc', 'Description must not exceed 200 characters.');
    valid = false;
  }

  const email = (document.getElementById('editChanEmail')?.value || '');
  if (email.length > 70) {
    setFieldError('editChanEmail', 'Contact email must not exceed 70 characters.');
    valid = false;
  }

  // Validate image files if provided: type and size
  try {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const pfp = document.getElementById('editChanPfp')?.files?.[0];
    const banner = document.getElementById('editChanBanner')?.files?.[0];
    if (pfp) {
      if (!allowed.includes((pfp.type || '').toLowerCase())) {
        setFieldError('editChanPfp', 'We only support jpg, jpeg and png.');
        valid = false;
      } else if (pfp.size > maxSize) {
        setFieldError('editChanPfp', 'File size must not exceed 2 MB.');
        valid = false;
      }
    }
    if (banner) {
      if (!allowed.includes((banner.type || '').toLowerCase())) {
        setFieldError('editChanBanner', 'We only support jpg, jpeg and png.');
        valid = false;
      } else if (banner.size > maxSize) {
        setFieldError('editChanBanner', 'File size must not exceed 2 MB.');
        valid = false;
      }
    }
  } catch (e) {
    // ignore unexpected issues reading files
  }

  return valid;
}

export default {
  API_BASE,
  showError,
  fetchCurrentChannel,
  buildChannelFormData,
  updateChannelOnServer,
  updateLocalCacheAndUI,
  setFieldError,
  clearFieldError,
  validateChannelForm
};

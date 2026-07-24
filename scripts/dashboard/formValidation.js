// Form validation helpers for dashboard upload modal
function showFieldError(inputEl, message) {
    if (!inputEl) return;
    let err = inputEl.parentElement.querySelector('.field-error');
    if (!err) {
        err = document.createElement('div');
        err.className = 'field-error';
        err.style.cssText = 'color:#9b1c1c;margin-top:6px;font-size:13px;';
        inputEl.parentElement.appendChild(err);
    }
    err.textContent = message;
}

function clearFieldError(inputEl) {
    if (!inputEl) return;
    const err = inputEl.parentElement.querySelector('.field-error');
    if (err) err.remove();
}

function getSaveButton() {
    return document.getElementById('saveBtn') || document.querySelector('.js-publish-video');
}

export function validateFormFields() {
    const titleEl = document.getElementById('titleInput');
    const imageEl = document.getElementById('thumbInput');
    const videoEl = document.getElementById('videoInput');
    const shortDescEl = document.getElementById('shortDesc');
    const detailedDescEl = document.getElementById('desc');

    let valid = true;
    // Title length
    if (titleEl && titleEl.value && titleEl.value.length > 50) {
        showFieldError(titleEl, 'Title must be 50 characters or fewer.');
        valid = false;
    } else if (titleEl) {
        clearFieldError(titleEl);
    }

    // Thumbnail type: only png, jpg, jpeg allowed
    if (imageEl && imageEl.files && imageEl.files[0]) {
        const name = imageEl.files[0].name || '';
        const ok = /\.(png|jpe?g)$/i.test(name);
        if (!ok) {
            showFieldError(imageEl, 'Thumbnail must be a PNG or JPG/JPEG image.');
            valid = false;
        } else {
            clearFieldError(imageEl);
        }
    } else if (imageEl) {
        clearFieldError(imageEl);
    }

    // Video file size limit (95 MB)
    if (videoEl && videoEl.files && videoEl.files[0]) {
        const file = videoEl.files[0];
        const MAX_BYTES = 95 * 1024 * 1024;
        if (file.size > MAX_BYTES) {
            showFieldError(videoEl, 'Video must be 95 MB or smaller. Please choose a smaller file.');
            valid = false;
        } else {
            clearFieldError(videoEl);
        }
    } else if (videoEl) {
        clearFieldError(videoEl);
    }

    // Short description length
    if (shortDescEl && shortDescEl.value && shortDescEl.value.length > 200) {
        showFieldError(shortDescEl, 'Short description must be 200 characters or fewer.');
        valid = false;
    } else if (shortDescEl) {
        clearFieldError(shortDescEl);
    }

    // Detailed description length
    if (detailedDescEl && detailedDescEl.value && detailedDescEl.value.length > 1000) {
        showFieldError(detailedDescEl, 'Detailed description must be 1000 characters or fewer.');
        valid = false;
    } else if (detailedDescEl) {
        clearFieldError(detailedDescEl);
    }

    const btn = getSaveButton();
    if (btn) btn.disabled = !valid;
    return valid;
}

// Attach listeners early so UI updates dynamically
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const titleEl = document.getElementById('titleInput');
        const imageEl = document.getElementById('thumbInput');
        const videoEl = document.getElementById('videoInput');
        const shortDescEl = document.getElementById('shortDesc');
        const detailedDescEl = document.getElementById('desc');
        [titleEl, shortDescEl, detailedDescEl].forEach(el => {
            if (!el) return;
            el.addEventListener('input', () => validateFormFields());
        });
        if (videoEl) videoEl.addEventListener('change', () => validateFormFields());
        if (imageEl) imageEl.addEventListener('change', () => validateFormFields());
        // initial validation state
        setTimeout(() => validateFormFields(), 50);
    });
}

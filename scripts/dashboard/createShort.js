import { getAccessToken } from '../auth.js';
import { showSuccessPopup } from './successPopup.js';

let isUploading = false;
const MIN_TIMEOUT = 3 * 60 * 1000;
const BYTES_PER_SEC_FLOOR = 200 * 1024;

function guardUnload(e) {
    if (!isUploading) return;
    e.preventDefault();
    e.returnValue = '';
}
window.addEventListener('beforeunload', guardUnload);

function setUploadBlocking(blocked) {
    const selectors = ['.modal-close-trigger', '.dash908-cancel-btn'];
    document.querySelectorAll(selectors.join(',')).forEach((el) => {
        if (blocked) {
            if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) el.disabled = true;
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.6';
        } else {
            if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) el.disabled = false;
            el.style.pointerEvents = '';
            el.style.opacity = '';
        }
    });
}

function getVideoDuration(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            const total = Math.floor(video.duration);
            const minutes = Math.floor(total / 60);
            const seconds = total % 60;
            resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };
        video.onerror = () => { URL.revokeObjectURL(url); resolve('0:00'); };
    });
}

async function uploadShort() {
    const titleEl = document.getElementById('titleInput');
    const videoEl = document.getElementById('videoInput');
    const imageEl = document.getElementById('thumbInput');

    if (!titleEl || !videoEl || !imageEl) {
        alert('Missing required form fields.');
        return;
    }

    if (!titleEl.value.trim()) return alert('Title is required.');
    if (!videoEl.files[0]) return alert('Please select a video file.');
    if (!imageEl.files[0]) return alert('Please select a thumbnail image.');

    const formData = new FormData();
    formData.append('title', titleEl.value.trim());

    const rawVideo = videoEl.files[0];
    formData.append('timer', await getVideoDuration(rawVideo));
    formData.append('video', rawVideo, rawVideo.name);

    const allowedImageTypes = ['image/jpeg', 'image/png'];
    const imageFile = imageEl.files[0];
    if (!allowedImageTypes.includes(imageFile.type) && !imageFile.name.match(/\.(jpg|jpeg|png)$/i)) {
        alert('Please select a valid thumbnail image.');
        return;
    }
    formData.append('image', imageFile);

    const token = await getAccessToken();
    try {
        isUploading = true;
        setUploadBlocking(true);
        await uploadWithProgress(formData, token, rawVideo.size);
        showSuccessPopup('Short published successfully!');
    } catch (error) {
        console.error('Upload error:', error);
        alert(error.message || 'An error occurred during upload.');
    } finally {
        isUploading = false;
        setUploadBlocking(false);
    }
}

// Upload with XHR to provide upload progress, timeout, and retries
async function uploadWithProgress(formData, token, fileSize, attempt = 1, lastProgress = 0) {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 3000;
    const UPLOAD_STALL_LIMIT_MS = 10 * 60 * 1000;
    const PROCESSING_GRACE_MS = 60 * 60 * 1000;
    const ABSOLUTE_CEILING_MS = 20 * 60 * 1000;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://valviorabackend2.onrender.com/aggregatedShortsApi');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.timeout = ABSOLUTE_CEILING_MS;

        let watchdog = null;
        const arm = (ms) => { clearTimeout(watchdog); watchdog = setTimeout(() => xhr.abort(), ms); };

        if (attempt === 1) showCompressionProgress('Uploading video... 0%');
        else updateCompressionProgress(lastProgress, `Retry ${attempt}/${MAX_ATTEMPTS} — Uploading video`);

        xhr.upload.onprogress = (e) => {
            arm(UPLOAD_STALL_LIMIT_MS);
            if (e.lengthComputable) {
                const pct = Math.max(Math.round((e.loaded / e.total) * 100), lastProgress);
                lastProgress = pct;
                updateCompressionProgress(pct, `Uploading video${attempt > 1 ? ` (retry ${attempt})` : ''}`);
            }
        };

        xhr.upload.onload = () => {
            arm(PROCESSING_GRACE_MS);
            updateCompressionProgress(99, 'Finishing up on the server...');
        };

        const retry = () => {
            clearTimeout(watchdog);
            if (attempt < MAX_ATTEMPTS) {
                updateCompressionProgress(lastProgress, `Retry ${attempt + 1}/${MAX_ATTEMPTS} — Uploading video`);
                setTimeout(() => uploadWithProgress(formData, token, fileSize, attempt + 1, lastProgress).then(resolve).catch(reject), RETRY_DELAY_MS * attempt);
            } else {
                hideCompressionProgress();
                reject(new Error('Upload stalled after 3 attempts. Please check your connection and try again.'));
            }
        };

        xhr.onload = () => {
            clearTimeout(watchdog);
            if (xhr.status >= 200 && xhr.status < 300) {
                hideCompressionProgress();
                try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
            } else if ([502, 503, 504].includes(xhr.status) && attempt < MAX_ATTEMPTS) {
                retry();
            } else {
                hideCompressionProgress();
                let msg = 'Upload failed.';
                try { const d = JSON.parse(xhr.responseText); if (d?.message) msg = d.message; } catch {}
                reject(new Error(msg));
            }
        };

        xhr.onabort = retry;
        xhr.ontimeout = retry;
        xhr.onerror = retry;

        xhr.send(formData);
        arm(UPLOAD_STALL_LIMIT_MS);
    });
}

// Compress video using MediaRecorder. Returns a Blob (video/webm) or null if too large.
// Progress overlay helpers
function showCompressionProgress(labelText = 'Compressing video... 0%') {
    const existing = document.getElementById('compressionOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'compressionOverlay';
    overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.6); display:flex; flex-direction:column;
        align-items:center; justify-content:center; z-index:99999;
    `;
    overlay.innerHTML = `
        <p id="compressionLabel" style="color:#fff; font-size:16px; margin-bottom:12px; font-family:sans-serif;">
            ${labelText}
        </p>
        <div style="width:300px; height:12px; background:#444; border-radius:6px; overflow:hidden;">
            <div id="compressionBar" style="height:100%; width:0%; background:#e63946; border-radius:6px; transition:width 0.3s ease;"></div>
        </div>
        <p style="color:#aaa; font-size:12px; margin-top:10px; font-family:sans-serif;">Please wait, do not close this tab.</p>
    `;
    document.body.appendChild(overlay);
}

function updateCompressionProgress(percent, action = 'Compressing video') {
    const bar = document.getElementById('compressionBar');
    const label = document.getElementById('compressionLabel');
    if (bar) bar.style.width = percent + '%';
    if (label) label.textContent = `${action}... ${percent}%`;
}

function hideCompressionProgress() {
    const overlay = document.getElementById('compressionOverlay');
    if (overlay) overlay.remove();
}

export { uploadShort };

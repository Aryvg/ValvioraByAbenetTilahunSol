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

// Copied helpers from createvideo.js
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

async function uploadVideoWithProgress(formData, token, onProgress, fileSize, attempt = 1, lastProgress = 0) {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 3000;
    const UPLOAD_STALL_LIMIT_MS = 100 * 60 * 1000;
    const PROCESSING_GRACE_MS = 100 * 60 * 1000;
    const ABSOLUTE_CEILING_MS = 20 * 60 * 1000;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://valviorabackend2.onrender.com/aggregatedApi');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.timeout = ABSOLUTE_CEILING_MS;

        let watchdog = null;
        const arm = (ms) => { clearTimeout(watchdog); watchdog = setTimeout(() => xhr.abort(), ms); };

        if (attempt === 1) showCompressionProgress('Uploading video... 0%');
        else updateCompressionProgress(lastProgress, `Retry ${attempt}/${MAX_ATTEMPTS} — Uploading playlist video`);

        xhr.upload.onprogress = (e) => {
            arm(UPLOAD_STALL_LIMIT_MS);
            if (e.lengthComputable && onProgress) {
                let fraction = e.loaded / e.total;
                if (fraction < lastProgress / 100) fraction = lastProgress / 100;
                lastProgress = Math.round(fraction * 100);
                onProgress(fraction);
            }
        };

        xhr.upload.onload = () => {
            arm(PROCESSING_GRACE_MS);
            updateCompressionProgress(99, 'Finishing up on the server...');
        };

        const retry = (nextToken) => {
            clearTimeout(watchdog);
            if (attempt < MAX_ATTEMPTS) {
                updateCompressionProgress(lastProgress, `Retry ${attempt + 1}/${MAX_ATTEMPTS} — Uploading playlist video`);
                setTimeout(() => uploadVideoWithProgress(formData, nextToken || token, onProgress, fileSize, attempt + 1, lastProgress).then(resolve).catch(reject), RETRY_DELAY_MS * attempt);
            } else {
                reject(new Error('Upload stalled after 3 attempts.'));
            }
        };

        xhr.onload = () => {
            clearTimeout(watchdog);
            if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
            } else if (xhr.status === 401 && attempt < MAX_ATTEMPTS) {
                // token likely expired; refresh once and retry
                getAccessToken().then((newToken) => retry(newToken)).catch(() => retry());
            } else if ([502, 503, 504].includes(xhr.status) && attempt < MAX_ATTEMPTS) {
                retry();
            } else {
                let msg = 'Upload failed.';
                try { const d = JSON.parse(xhr.responseText); if (d?.message) msg = d.message; } catch {}
                reject(new Error(msg));
            }
        };

        xhr.onabort = () => retry();
        xhr.ontimeout = () => retry();
        xhr.onerror = () => retry();

        xhr.send(formData);
        arm(UPLOAD_STALL_LIMIT_MS);
    });
}

// Helper: convert base64 data URL to Blob
async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
}

export async function uploadPlaylistVideos(plName, videosArray) {
    const total = videosArray.length;
    if (total === 0) throw new Error('No videos to upload.');

    try {
        const token = await getAccessToken();
        const authHeader = 'Bearer ' + token;
        isUploading = true;
        setUploadBlocking(true);

        // Show ONE progress bar for the entire playlist upload
        showCompressionProgress(`Uploading playlist... 0%`);

        // Step 1: Create the playlist entry
        const plRes = await fetch('https://valviorabackend2.onrender.com/playlistHomeApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
            body: JSON.stringify({ 
                playlistTitle: plName,
                thumbnail: videosArray[0]?.thumb || ''
            })
        });
        if (!plRes.ok) {
            const err = await plRes.json().catch(() => ({}));
            throw new Error(err?.message || 'Failed to create playlist.');
        }
        const plData = await plRes.json();
        const playlistId = plData.playlistId;
        if (!playlistId) throw new Error('Playlist created but no playlistId returned.');

        // Step 2: Upload each video — each contributes an equal share of the total 100%
        let firstVideoId = null;
        const failed = [];
        let completed = 0;
        const queue = videosArray.map((video, index) => ({ video, index }));
        const CONCURRENCY = 1;

        async function uploadOneVideo(videoItem) {
            const { video: v, index } = videoItem;
            const segmentStart = index / total;
            const segmentEnd = (index + 1) / total;
            const duration = await getVideoDuration(v.file);
            const formData = new FormData();
            formData.append('title', v.title);
            formData.append('shortDescription', v.shortDesc || v.title);
            formData.append('DetailedDescription', v.desc || v.title);
            formData.append('timer', duration || '0:00');
            formData.append('playlistId', playlistId);
            formData.append('video', v.file, v.file.name);
            formData.append('image', await dataUrlToBlob(v.thumb), 'thumbnail.jpg');

            const onProgress = (fraction) => {
                const overall = segmentStart + fraction * (segmentEnd - segmentStart);
                updateCompressionProgress(Math.round(overall * 100), `Uploading video ${index + 1} of ${total}`);
            };

            // get a fresh token per video to avoid expiry during long batches
            const freshToken = await getAccessToken();
            const uploadResult = await uploadVideoWithProgress(formData, freshToken, onProgress, v.file.size, 1);
            if (index === 0 && uploadResult?.videoId) {
                firstVideoId = uploadResult.videoId;
            }
        }

        async function worker() {
            while (queue.length) {
                const videoItem = queue.shift();
                try {
                    await uploadOneVideo(videoItem);
                } catch (err) {
                    failed.push({ title: videoItem.video.title, error: err.message || String(err) });
                }
                completed += 1;
                updateCompressionProgress(Math.round((completed / total) * 100), `Uploaded ${completed}/${total} videos`);
            }
        }

        try {
            await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()));
        } finally {
            isUploading = false;
            setUploadBlocking(false);
        }

        updateCompressionProgress(100, 'Finalising playlist...');

        // Step 3: Fetch the first video's cloudinary thumbnail and attach it to the playlist
        if (firstVideoId) {
            try {
                const thumbRes = await fetch(`https://valviorabackend2.onrender.com/thumbnailApi/${firstVideoId}`, {
                    headers: { 'Authorization': authHeader }
                });
                if (thumbRes.ok) {
                    const thumbData = await thumbRes.json();
                    const thumbnailUrl = thumbData?.image || '';
                    if (thumbnailUrl) {
                        await fetch('https://valviorabackend2.onrender.com/playlistHomeApi', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                            body: JSON.stringify({ playlistId, thumbnail: thumbnailUrl })
                        });
                    }
                }
            } catch (e) {
                // Thumbnail attach is best-effort; don't fail the whole upload
                console.warn('Could not attach thumbnail to playlist:', e?.message || e);
            }
        }

        hideCompressionProgress();
        if (failed.length === 0) {
            showSuccessPopup(`Playlist "${plName}" published successfully!`);
        } else {
            alert(
                `Playlist "${plName}" uploaded with ${total - failed.length}/${total} videos.\n` +
                `Failed: ${failed.map(f => f.title).join(', ')}\n` +
                `Please retry the failed video(s).`
            );
        }

    } catch (err) {
        hideCompressionProgress();
        throw err;
    }
}

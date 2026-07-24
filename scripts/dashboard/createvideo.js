


import { getAccessToken } from '../auth.js';
import { showSuccessPopup } from './successPopup.js';
import { validateFormFields } from './formValidation.js';
export { validateFormFields };

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

export async function uploadEmployee() {
    const titleEl = document.getElementById('titleInput');
    const videoEl = document.getElementById('videoInput');
    const imageEl = document.getElementById('thumbInput');
    const shortDescEl = document.getElementById('shortDesc');
    const detailedDescEl = document.getElementById('desc');

    if (!titleEl || !videoEl || !imageEl || !shortDescEl || !detailedDescEl) {
        alert('Missing required form fields.');
        return;
    }

    // Run inline validations (lengths, thumbnail type). If invalid, stop and show errors.
    if (!validateFormFields()) return;

    if (!titleEl.value.trim()) return alert('Title is required.');
    if (!videoEl.files[0]) return alert('Please select a video file.');
    if (!imageEl.files[0]) return alert('Please select a thumbnail image.');
    if (!shortDescEl.value.trim()) return alert('Short description is required.');
    if (!detailedDescEl.value.trim()) return alert('Detailed description is required.');

    const formData = new FormData();
    formData.append('title', titleEl.value.trim());
    formData.append('shortDescription', shortDescEl.value.trim());
    formData.append('DetailedDescription', detailedDescEl.value.trim());
    // Video handling: compress if over size limit
    const rawVideo = videoEl.files[0];
    formData.append('timer', await getVideoDuration(rawVideo));
    formData.append('video', rawVideo, rawVideo.name);
    // Validate image type before appending
    const allowedImageTypes = ['image/jpeg', 'image/png'];
    const imageFile = imageEl.files[0];
    if (!allowedImageTypes.includes(imageFile.type) && !imageFile.name.match(/\.(jpg|jpeg|png)$/i)) {
        // run the shared validator which will show the inline error
        validateFormFields();
        return;
    }
    formData.append('image', imageFile);

    const token = await getAccessToken();
    try {
        isUploading = true;
        setUploadBlocking(true);
        await uploadWithProgress(formData, token, rawVideo.size);
        showSuccessPopup('Video published successfully!');
    } catch (error) {
        console.error('Upload error:', error);
        alert(error.message || 'An error occurred during upload.');
    } finally {
        isUploading = false;
        setUploadBlocking(false);
    }
}

// Upload with XHR to provide upload progress, watchdog for stalls, and retries
async function uploadWithProgress(formData, token, fileSize, attempt = 1, lastProgress = 0) {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 3000;
    const UPLOAD_STALL_LIMIT_MS = 30 * 60 * 1000    // no bytes moving for 30s = dead connection
    const PROCESSING_GRACE_MS = 60 * 60 * 1000;  // server relaying to Cloudinary after we hit 100%
    const ABSOLUTE_CEILING_MS = 20 * 60 * 1000; // safety net

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://valviorabackend2.onrender.com/aggregatedApi');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        // xhr.timeout = ABSOLUTE_CEILING_MS;
        const ABSOLUTE_CEILING_MS = 60 * 60 * 1000; // 1 hour

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
            // Browser finished sending bytes — allow server extra time to process/relay
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

        xhr.onabort = retry; // watchdog fired
        xhr.ontimeout = retry; // absolute ceiling
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
export async function compressVideo(file) {
    return new Promise((resolve) => {
        try {
            showCompressionProgress();

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                ? 'video/webm;codecs=vp8'
                : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : null;

            if (!mimeType) {
                console.warn('MediaRecorder not supported in this browser.');
                hideCompressionProgress();
                resolve(null);
                return;
            }

            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.playsInline = true;

            video.onerror = () => {
                console.error('Video element failed to load file.');
                URL.revokeObjectURL(url);
                hideCompressionProgress();
                resolve(null);
            };

            video.onloadedmetadata = () => {
                const duration = video.duration;
                if (!duration || !isFinite(duration) || duration <= 0) {
                    console.error('Could not read video duration.');
                    URL.revokeObjectURL(url);
                    hideCompressionProgress();
                    resolve(null);
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1280;
                canvas.height = video.videoHeight || 720;
                const ctx = canvas.getContext('2d');

                const stream = canvas.captureStream(25);

                // Add audio track if present
                try {
                    const audioCtx = new AudioContext();
                    const source = audioCtx.createMediaElementSource(video);
                    const dest = audioCtx.createMediaStreamDestination();
                    source.connect(dest);
                    source.connect(audioCtx.destination);
                    dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
                } catch (audioErr) {
                    console.warn('Audio capture skipped:', audioErr.message);
                }

                const chunks = [];
                let mediaRecorder;

                try {
                    mediaRecorder = new MediaRecorder(stream, {
                        mimeType,
                        videoBitsPerSecond: 4_000_000,
                        audioBitsPerSecond: 128_000
                    });
                } catch (recErr) {
                    console.error('MediaRecorder init failed:', recErr);
                    URL.revokeObjectURL(url);
                    hideCompressionProgress();
                    resolve(null);
                    return;
                }

                // Safety timeout: 6 minutes max
                const hardTimeout = setTimeout(() => {
                    console.warn('Compression timed out.');
                    try { mediaRecorder.stop(); } catch {}
                    URL.revokeObjectURL(url);
                    clearInterval(progressInterval);
                    hideCompressionProgress();
                    resolve(null);
                }, 6 * 60 * 1000);

                let elapsed = 0;
                const progressInterval = setInterval(() => {
                    elapsed += 1;
                    const pct = Math.min(Math.round((elapsed / duration) * 90), 90);
                    updateCompressionProgress(pct);
                }, 1000);

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                };

                mediaRecorder.onerror = (e) => {
                    console.error('MediaRecorder error:', e.error);
                    clearTimeout(hardTimeout);
                    clearInterval(progressInterval);
                    URL.revokeObjectURL(url);
                    hideCompressionProgress();
                    resolve(null);
                };

                mediaRecorder.onstop = () => {
                    clearTimeout(hardTimeout);
                    clearInterval(progressInterval);

                    try {
                        video.pause();
                        URL.revokeObjectURL(url);
                    } catch {}

                    if (chunks.length === 0) {
                        console.error('MediaRecorder produced no chunks.');
                        hideCompressionProgress();
                        resolve(null);
                        return;
                    }

                    const blob = new Blob(chunks, { type: mimeType });

                    if (!blob || blob.size === 0) {
                        console.error('Compressed blob is empty.');
                        hideCompressionProgress();
                        resolve(null);
                        return;
                    }

                    updateCompressionProgress(100);
                    setTimeout(() => {
                        hideCompressionProgress();
                        resolve(blob);
                    }, 400);
                };

                // Draw video frames to canvas while playing
                const drawFrame = () => {
                    if (video.paused || video.ended) return;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(drawFrame);
                };

                mediaRecorder.start(1000); // collect chunks every 1 second
                video.play().then(() => {
                    drawFrame();
                }).catch((playErr) => {
                    console.error('Video play failed:', playErr);
                    clearTimeout(hardTimeout);
                    clearInterval(progressInterval);
                    try { mediaRecorder.stop(); } catch {}
                    URL.revokeObjectURL(url);
                    hideCompressionProgress();
                    resolve(null);
                });

                video.onended = () => {
                    try { mediaRecorder.stop(); } catch {}
                };
            };

            video.load();

        } catch (outerErr) {
            console.error('compressVideo outer error:', outerErr);
            hideCompressionProgress();
            resolve(null);
        }
    });
}


// // Define the async function separately
// import { getAccessToken } from '../auth.js';

// export async function uploadEmployee() {
//     const formData = new FormData();// formData is a box or a container that holds the data that we want to send
//     const title = document.getElementById('titleInput');
//     const video = document.getElementById('videoInput');
//     const image = document.getElementById('thumbInput');
//     const shortDescription = document.getElementById('shortDesc');
//     const DetailedDescription = document.getElementById('desc');

//     if (!title || !video || !image || !shortDescription || !DetailedDescription) {
//         alert('Missing required form fields.');
//         return;
//     }

//     formData.append('title', title.value);
//     formData.append('video', video.files[0]);
//     formData.append('image', image.files[0]);
//     formData.append('shortDescription', shortDescription.value);
//     formData.append('DetailedDescription', DetailedDescription.value);

//     if (image && image.files[0]) formData.append('image', image.files[0]);// if user selected an image which is a file
//     if (video && video.files[0]) formData.append('video', video.files[0]);

    

//     const token = await getAccessToken();

//     try {
//         const response = await fetch('https://valviorabackend2.onrender.com/aggregatedApi', {
//             method: 'POST',
//             headers: {
//                 'Authorization': 'Bearer ' + token
//             },// send the token
//             body: formData// send the container
//         });

//         if (!response.ok) {
//             let errorMsg = 'Failed to create employee';
//             try {
//                 const errData = await response.json();
//                 if (errData && errData.message) errorMsg = errData.message;
//             } catch {}
//             alert(errorMsg);
//             return;
//         }

//         alert('Employee created!');
//     } catch (error) {
//         console.error('Error uploading employee:', error);
//         alert('An error occurred while creating employee: ' + error.message);
//     }
// }

// // Call the function on button click



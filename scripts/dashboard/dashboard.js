
        import { getAccessToken } from '../auth.js';
        import { initPresence } from '../presence.js';
        import { loadChannel } from './getChannelIdentity.js';
        import { setupOpenEditChannel } from './openEditChannel.js';
        import { uploadEmployee, validateFormFields } from './createvideo.js';
        import { uploadShort } from './createShort.js';
        import { uploadPlaylistVideos } from './uploadPlaylistVideos.js';
        import { renderVideos } from './renderVideos.js';
        import { updateVideoAllApis } from './updateVideoApi.js';
        import { mountPlaylistModal } from './playlistModal.js';
        mountPlaylistModal();
        initPresence();
        const DB_NAME = "NileMarketDB";
        const STORE_NAME = "VideosBlob";
        let db;
        let tempPlaylistVideos = [];
        let currentChannelId = null;
        let videos = JSON.parse(localStorage.getItem('nile_market_videos')) || [];
        let editingId = null;
        let activeUploadType = 'video'; // Track if uploading regular video or shorts
        let tempThumbURL = "";
        let currentFile = null;
        let currentEditingPlId = null;

        // Field limits (must match backend constraints)
        const PL_TITLE_MAX = 100;
        const VIDEO_TITLE_MAX = 50;
        const SHORT_DESC_MAX = 200;
        const LONG_DESC_MAX = 1000;

        function setFieldError(id, msg) {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerText = msg || '';
            el.style.display = msg ? 'block' : 'none';
        }

        function validatePlaylistItemForm(showErrors = true) {
            const titleEl = document.getElementById('plVideoTitle');
            const videoFileEl = document.getElementById('plVideoFile');
            const thumbFileEl = document.getElementById('plVideoThumb');
            const shortEl = document.getElementById('plVideoShort');
            const longEl = document.getElementById('plVideoLong');
            const addBtn = document.getElementById('addVideoToTempBtn');

            const title = (titleEl?.value || '').trim();
            const short = (shortEl?.value || '').trim();
            const long = (longEl?.value || '').trim();
            const videoFile = videoFileEl?.files?.[0] || null;
            const thumbFile = thumbFileEl?.files?.[0] || null;
            const maxVideoSize = 95 * 1024 * 1024;
            const maxThumbSize = 40 * 1024 * 1024;

            let valid = true;
            let titleMsg = '';
            let videoMsg = '';
            let thumbMsg = '';
            let shortMsg = '';
            let longMsg = '';

            if (!title) {
                titleMsg = 'Title is required.';
                valid = false;
            } else if (title.length > VIDEO_TITLE_MAX) {
                titleMsg = `Title must be ${VIDEO_TITLE_MAX} characters or fewer.`;
                valid = false;
            }

            if (!videoFile) {
                videoMsg = 'Please choose a video file.';
                valid = false;
            } else if (videoFile.size > maxVideoSize) {
                videoMsg = 'Video file must be 95 MB or smaller.';
                valid = false;
            }

            if (!thumbFile) {
                thumbMsg = 'Please choose a thumbnail image.';
                valid = false;
            } else if (thumbFile.size > maxThumbSize) {
                thumbMsg = 'Thumbnail must be 40 MB or smaller.';
                valid = false;
            }

            if (short.length > SHORT_DESC_MAX) {
                shortMsg = `Short description must be ${SHORT_DESC_MAX} characters or fewer.`;
                valid = false;
            }

            if (long.length > LONG_DESC_MAX) {
                longMsg = `Detailed description must be ${LONG_DESC_MAX} characters or fewer.`;
                valid = false;
            }

            if (showErrors) {
                setFieldError('plVideoTitleError', titleMsg);
                setFieldError('plVideoShortError', shortMsg);
                setFieldError('plVideoLongError', longMsg);
                setFieldError('plVideoFileError', videoMsg);
                setFieldError('plVideoThumbError', thumbMsg);
            }

            if (addBtn) {
                addBtn.disabled = !valid;
            }
            return valid;
        }

        // IndexedDB Initialization
        document.querySelector('.js-publish-video').addEventListener('click', async () => {
            // If editing an existing video, the publish button should not trigger the upload flow.
            if (editingId) return;
            if (activeUploadType === 'shorts') {
                await uploadShort();
            } else {
                await uploadEmployee();
            }
            try { await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem }); } catch (e) { console.error('renderVideos after upload failed:', e); }
        });
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => { e.target.result.createObjectStore(STORE_NAME); };
        request.onsuccess = (e) => { db = e.target.result; initApp(); };

        async function storeVideoBlob(id, blob) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const req = store.put(blob, id.toString());
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }

        async function getVideoBlob(id) {
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const req = tx.objectStore(STORE_NAME).get(id.toString());
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        }

        async function deleteVideoBlob(id) {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).delete(id.toString());
        }

        // App Logic
        async function initApp() {
            currentChannelId = loadChannel();
            await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem });
            setupEventListeners();
            try {
                const token = await getAccessToken();
                if (!token) return;
                const res = await fetch('https://valviorabackend2.onrender.com/channelApi', { headers: { Authorization: 'Bearer ' + token } });
                if (!res.ok) return;
                const data = await res.json();
                const countEl = document.getElementById('dashSubscribersCount');
                if (countEl && Array.isArray(data)) {
                    const channel = data[0] || null;
                    const subscribers = channel?.subscribe ?? channel?.subscribers?.length ?? 0;
                    countEl.textContent = Number(subscribers).toLocaleString();
                }
            } catch (e) {
                console.error('Failed to load subscribers', e);
            }
        }

        function toggleModal(id, show) {
            document.getElementById(id).style.display = show ? "flex" : "none";
            if (!show && id === 'uploadModal') resetForm();
        }

        function resetForm() {
            editingId = null; // ADD THIS LINE at the top
            document.getElementById("titleInput").value = "";
            document.getElementById("shortDesc").value = "";
            document.getElementById("desc").value = "";
            document.getElementById("videoInput").value = "";
            document.getElementById("thumbInput").value = "";
            document.getElementById('videoFileGroup').style.display = 'block'; // restore for next upload
            tempThumbURL = ""; currentFile = null;
            document.getElementById('saveBtn').disabled = false;
            document.getElementById('saveBtn').innerText = 'Publish Video';
            // Restore description fields visibility in case they were hidden for shorts
            const shortDescGroup = document.getElementById('shortDesc')?.closest('.dash908-form-group');
            const descGroup = document.getElementById('desc')?.closest('.dash908-form-group');
            if (shortDescGroup) shortDescGroup.style.display = '';
            if (descGroup) descGroup.style.display = '';
        }

        // Event Listeners Configuration
        function setupEventListeners() {
            document.getElementById('menuBtn').addEventListener('click', () => {
                if (window.innerWidth > 992) { document.body.classList.toggle('dash908-sidebar-hidden'); }
                else { document.getElementById('sidebar').classList.add('dash908-open'); document.getElementById('overlay').style.display = "block"; }
            });

            document.getElementById('overlay').addEventListener('click', () => {
                document.getElementById('sidebar').classList.remove('dash908-open');
                document.getElementById('overlay').style.display = "none";
            });

            document.getElementById('openCreateBtn').addEventListener('click', () => {
                editingId = null;
                activeUploadType = 'video';
                document.getElementById('modalTitle').innerText = "Upload Video";
                document.getElementById('saveBtn').innerText = "Publish Video";
                document.getElementById('videoFileGroup').style.display = "block";
                toggleModal('uploadModal', true);
            });

            document.getElementById('openShortsBtn').addEventListener('click', () => {
                editingId = null;
                activeUploadType = 'shorts';
                document.getElementById('modalTitle').innerHTML = '<i class="fas fa-bolt" style="color:red"></i> Upload Shorts';
                document.getElementById('saveBtn').innerText = "Publish Shorts";
                document.getElementById('videoFileGroup').style.display = "block";
                toggleModal('uploadModal', true);
            });

            document.getElementById('openPlaylistBtn').addEventListener('click', () => {
                tempPlaylistVideos = [];
                document.getElementById('plNameInput').value = "";
                // clear any previous errors
                setFieldError('plNameError','');
                setFieldError('plVideoTitleError','');
                setFieldError('plVideoShortError','');
                setFieldError('plVideoLongError','');
                setFieldError('plVideoFileError','');
                setFieldError('plVideoThumbError','');
                renderPlaylistStaging();
                toggleModal('playlistModal', true);
                validatePlaylistItemForm(false);
            });

            // open-edit-channel listener moved to its own module
            setupOpenEditChannel(toggleModal);

            document.getElementById('videoInput').addEventListener('change', e => { currentFile = e.target.files[0]; });

            document.getElementById('thumbInput').addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => { tempThumbURL = event.target.result; };
                    reader.readAsDataURL(file);
                }
            });

            // Live validation for playlist modal fields
            const plNameEl = document.getElementById('plNameInput');
            if (plNameEl) plNameEl.addEventListener('input', () => {
                setFieldError('plNameError', '');
                if (plNameEl.value && plNameEl.value.length > PL_TITLE_MAX) setFieldError('plNameError', `Playlist name must be ${PL_TITLE_MAX} characters or fewer.`);
            });
            const plVidTitleEl = document.getElementById('plVideoTitle');
            if (plVidTitleEl) plVidTitleEl.addEventListener('input', () => validatePlaylistItemForm());
            const plShortEl = document.getElementById('plVideoShort');
            if (plShortEl) plShortEl.addEventListener('input', () => validatePlaylistItemForm());
            const plLongEl = document.getElementById('plVideoLong');
            if (plLongEl) plLongEl.addEventListener('input', () => validatePlaylistItemForm());
            const plVideoFileEl = document.getElementById('plVideoFile');
            if (plVideoFileEl) plVideoFileEl.addEventListener('change', () => validatePlaylistItemForm());
            const plThumbFileEl = document.getElementById('plVideoThumb');
            if (plThumbFileEl) plThumbFileEl.addEventListener('change', () => validatePlaylistItemForm());

            document.getElementById('saveBtn').addEventListener('click', async () => {
                if (editingId) {
                    await saveEditedVideo();
                } else {
                    await saveVideo();
                }
            });
            document.getElementById('addVideoToTempBtn').addEventListener('click', addVideoToTempList);
            document.getElementById('uploadPlaylistBtn').addEventListener('click', savePlaylist);
            document.getElementById('closePlaylistModalBtn').addEventListener('click', () => { tempPlaylistVideos = []; toggleModal('playlistModal', false); });
            document.getElementById('savePlEditsBtn').addEventListener('click', savePlaylistEdits);
            document.getElementById('closePlayerBtn').addEventListener('click', closePlayer);

            document.querySelectorAll('.modal-close-trigger').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.dash908-modal-overlay');
                    toggleModal(modal.id, false);
                });
            });
        }

        async function saveVideo() {
            const title = document.getElementById("titleInput").value;
            const sD = document.getElementById("shortDesc").value;
            const lD = document.getElementById("desc").value;
            const btn = document.getElementById('saveBtn');

            if (!validateFormFields()) {
                btn.disabled = true;
                return;
            }

            if (!title) return alert("Title is required");

            // Require a thumbnail image for new uploads (either a selected file or a tempThumbURL)
            const imageEl = document.getElementById('thumbInput');
            const hasImageFile = imageEl && imageEl.files && imageEl.files[0];
            if (!hasImageFile && !tempThumbURL) {
                btn.disabled = false;
                btn.innerText = activeUploadType === 'shorts' ? "Publish Shorts" : "Publish Video";
                return alert("Please select a thumbnail image");
            }

            btn.disabled = true;
            btn.innerText = "Processing...";

            try {
                if (!currentFile) {
                    btn.disabled = false;
                    btn.innerText = activeUploadType === 'shorts' ? "Publish Shorts" : "Publish Video";
                    return alert("Please select a file");
                }
                await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem });
                toggleModal('uploadModal', false);
            } catch (err) {
                alert("Action failed: " + err);
                btn.disabled = false;
                btn.innerText = "Try Again";
            }
        }

        async function saveEditedVideo() {
            const title = document.getElementById("titleInput").value.trim();
            const sD = document.getElementById("shortDesc").value.trim();
            const lD = document.getElementById("desc").value.trim();
            const btn = document.getElementById('saveBtn');

            // Allow partial updates: if an input is left empty, keep the original value
            const editBtnAny = document.querySelector(`.edit-trigger[data-id="${editingId}"]`);
            const origTitle = editBtnAny?.dataset?.title || '';
            const origShort = editBtnAny?.dataset?.shortdesc || '';
            const origDesc = editBtnAny?.dataset?.desc || '';

            const finalTitle = title || origTitle;
            const finalShort = sD || origShort;
            const finalDesc = lD || origDesc;

            btn.disabled = true;
            btn.innerText = "Saving...";

            try {
                // Detect whether this is an API video (edit-trigger had js-save-changes icon)
                const editBtn = document.querySelector(`.edit-trigger[data-api-video="true"][data-id="${editingId}"]`);
                const isApiVideo = !!editBtn;

                const thumbEl = document.getElementById('thumbInput');
                const newImageFile = thumbEl?.files?.[0] || null;

                // Shorts update path: send PUT to aggregatedShortsApi (supports JSON or multipart when replacing thumbnail)
                if (activeUploadType === 'shorts') {
                    const token = await getAccessToken();
                    if (newImageFile) {
                        const fd = new FormData();
                        fd.append('shortId', editingId);
                        fd.append('title', finalTitle);
                        // Read old thumbnail URL from the edit button's data-thumb attribute
                        const editBtnForThumb = document.querySelector(`.edit-trigger[data-id="${editingId}"]`);
                        const oldThumbnailUrl = editBtnForThumb?.dataset?.thumb || '';
                        if (oldThumbnailUrl) fd.append('oldThumbnailUrl', oldThumbnailUrl);
                        // append image file under 'image' to match backend expectation
                        fd.append('image', newImageFile, newImageFile.name);
                        const res = await fetch('https://valviorabackend2.onrender.com/aggregatedShortsApi', {
                            method: 'PUT',
                            headers: { 'Authorization': 'Bearer ' + token },
                            body: fd
                        });
                        if (!res.ok) {
                            const errData = await res.json().catch(() => ({}));
                            throw new Error(errData?.message || 'Short update failed.');
                        }
                    } else {
                        const token = await getAccessToken();
                        const res = await fetch('https://valviorabackend2.onrender.com/aggregatedShortsApi', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                            body: JSON.stringify({ shortId: editingId, title: finalTitle })
                        });
                        if (!res.ok) {
                            const errData = await res.json().catch(() => ({}));
                            throw new Error(errData?.message || 'Short update failed.');
                        }
                    }
                } else if (isApiVideo) {
                    // Use the fan-out updater for API videos
                    await updateVideoAllApis({
                        videoId: editingId,
                        title: finalTitle,
                        shortDesc: finalShort,
                        detailedDesc: finalDesc,
                        newImageFile
                    });
                } else {
                    // Existing local/playlist video update path — keep exactly as before
                    const token = await getAccessToken();
                    const response = await fetch('https://valviorabackend2.onrender.com/aggregatedApi', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ videoId: editingId, title: finalTitle, shortDescription: finalShort, DetailedDescription: finalDesc })
                    });
                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData?.message || 'Update failed.');
                    }
                }

                editingId = null;
                await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem });
                toggleModal('uploadModal', false);
            } catch (err) {
                alert('Save failed: ' + (err.message || err));
            } finally {
                btn.disabled = false;
                btn.innerText = 'Save Changes';
            }
        }

        async function addVideoToTempList() {
            if (!validatePlaylistItemForm()) return;

            const titleEl = document.getElementById('plVideoTitle');
            const title = (titleEl.value || '').trim();
            const videoFile = document.getElementById('plVideoFile').files[0];
            const thumbFile = document.getElementById('plVideoThumb').files[0];
            const short = (document.getElementById('plVideoShort').value || '').trim();
            const long = (document.getElementById('plVideoLong').value || '').trim();
            const addBtn = document.getElementById('addVideoToTempBtn');

            addBtn.disabled = true;
            addBtn.innerText = "Adding...";

            const vId = Date.now() + Math.floor(Math.random() * 1000);
            const thumbUrl = thumbFile ? await new Promise(res => {
                const r = new FileReader();
                r.onload = e => res(e.target.result);
                r.readAsDataURL(thumbFile);
            }) : "https://picsum.photos/seed/" + vId + "/120/68";

            tempPlaylistVideos.push({
                id: vId,
                title,
                shortDesc: short,
                desc: long,
                thumb: thumbUrl,
                file: videoFile
            });

            document.getElementById('plVideoTitle').value = "";
            document.getElementById('plVideoShort').value = "";
            document.getElementById('plVideoLong').value = "";
            document.getElementById('plVideoFile').value = "";
            document.getElementById('plVideoThumb').value = "";

            setFieldError('plVideoTitleError','');
            setFieldError('plVideoShortError','');
            setFieldError('plVideoLongError','');
            setFieldError('plVideoFileError','');
            setFieldError('plVideoThumbError','');

            addBtn.disabled = true;
            addBtn.innerText = "Add to List";

            renderPlaylistStaging();
            validatePlaylistItemForm(false);
        }

        function renderPlaylistStaging() {
            const list = document.getElementById('playlistItemsList');
            list.innerHTML = "";
            tempPlaylistVideos.forEach((v, idx) => {
                const item = document.createElement('div');
                item.className = "dash908-playlist-item";
                item.innerHTML = `
                    <div class="dash908-playlist-item-num">${idx + 1}</div>
                    <img src="${v.thumb}" style="width:60px; height:34px; border-radius:4px; object-fit:fill;">
                    <div class="dash908-playlist-item-info"><strong>${v.title}</strong><br><small>${v.shortDesc || 'No description'}</small></div>
                `;
                list.appendChild(item);
            });
            document.getElementById('uploadPlaylistBtn').disabled = tempPlaylistVideos.length < 2;
        }

        async function savePlaylist() {
            const plName = document.getElementById('plNameInput').value;
            const btn = document.getElementById('uploadPlaylistBtn');
            if (!plName) return alert("Please enter a playlist name");

            // Validate playlist name length
            setFieldError('plNameError','');
            if (plName.length > PL_TITLE_MAX) {
                setFieldError('plNameError', `Playlist name must be ${PL_TITLE_MAX} characters or fewer.`);
                return;
            }

            btn.disabled = true;
            btn.innerText = "Publishing Playlist...";

            try {
                // Use the API-based upload instead of localStorage
                await uploadPlaylistVideos(plName, tempPlaylistVideos);
                await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem });
                toggleModal('playlistModal', false);
                tempPlaylistVideos = [];
            } catch (err) {
                alert('Playlist save failed: ' + (err?.message || err));
                btn.disabled = false;
                btn.innerText = 'Publish Playlist';
            }
        }

        

        async function viewPlaylist(id) {
            // First try localStorage (local playlists)
            let pl = videos.find(v => v.id === id);

            // If not found locally, fetch from playlistVideoApi
            if (!pl) {
                try {
                    const token = await getAccessToken();
                    const res = await fetch(`https://valviorabackend2.onrender.com/playlistVideoApi/${id}`, {
                        headers: token ? { 'Authorization': 'Bearer ' + token } : {}
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Shape API response to match what the modal expects
                        pl = {
                            id:     data.playlistId,
                            title:  data.playlistTitle,
                            videos: (data.videos || []).map(v => ({
                                id:        v.videoId,
                                thumb:     v.image,
                                title:     v.title,
                                shortDesc: v.shortDescription,
                                desc:      v.detailedDescription,
                                video:     v.video
                            }))
                        };
                    }
                } catch (e) {
                    console.error('viewPlaylist API fetch failed:', e?.message || e);
                }
            }

            if (!pl) return alert('Playlist not found.');

            document.getElementById('viewPlTitle').innerText = 'Playlist: ' + pl.title;
            const body = document.getElementById('playlistViewBody');
            body.innerHTML = '';
            pl.videos.forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Video"><div class="dash908-video-cell"><img src="${v.thumb}" class="dash908-thumb-mini pl-play-trigger" data-id="${v.id}" data-video="${v.video || ''}"><span>${v.title}</span></div></td>
                    <td data-label="Short Desc">${v.shortDesc || '--'}</td>
                    <td data-label="Detailed Desc"><div class="dash908-desc-text">${v.desc || '--'}</div></td>
                    <td data-label="Actions"><button class="dash908-btn-action dash908-btn-edit pl-play-trigger" data-id="${v.id}" data-video="${v.video || ''}" style="width:auto; padding:0 10px; border-radius:4px;">PLAY</button></td>
                `;
                body.appendChild(tr);
            });
            document.querySelectorAll('.pl-play-trigger').forEach(el => {
                el.addEventListener('click', () => {
                    const vid = el.getAttribute('data-video') || '';
                    playVideo(el.dataset.id, vid);
                });
            });
            toggleModal('viewPlaylistModal', true);
        }

        async function playVideo(id, videoUrl) {
            // If a Cloudinary URL was passed, play it directly
            if (videoUrl && String(videoUrl).startsWith('http')) {
                const player = document.getElementById('mainPlayer');
                player.src = videoUrl;
                // Prefer title from the rendered row (DOM), fallback to localStorage
                let title = '';
                const thumbEl = document.querySelector(`.media-trigger[data-id="${id}"]`);
                if (thumbEl) {
                    title = thumbEl.closest('tr')?.querySelector('span')?.textContent?.trim() || '';
                }
                if (!title) {
                    const allVideos = JSON.parse(localStorage.getItem('nile_market_videos')) || [];
                    const found = allVideos.find(v => String(v.id) === String(id));
                    if (found) title = found.title;
                }
                document.getElementById('playingTitle').innerText = title || 'Video';
                document.getElementById('playerModal').style.display = 'flex';
                return;
            }

            // Fallback for locally stored playlist blobs
            let videoData = videos.find(v => String(v.id) === String(id));
            if (!videoData) {
                videos.filter(v => v.type === 'playlist').forEach(pl => {
                    const sub = pl.videos?.find(s => String(s.id) === String(id));
                    if (sub) videoData = sub;
                });
            }
            const blob = await getVideoBlob(id);
            if (videoData && blob) {
                const player = document.getElementById('mainPlayer');
                player.src = URL.createObjectURL(blob);
                document.getElementById('playingTitle').innerText = videoData.title || 'Video';
                document.getElementById('playerModal').style.display = 'flex';
            } else {
                alert('Video not available. Please refresh the page.');
            }
        }

        function closePlayer() {
            const player = document.getElementById('mainPlayer');
            player.pause();
            if (player.src) URL.revokeObjectURL(player.src);
            player.src = "";
            document.getElementById('playerModal').style.display = "none";
        }

        async function deleteItem(id) {
            if (confirm("Delete item forever?")) {
                const item = videos.find(v => v.id === id);
                if (item && item.type === 'playlist') {
                    for (let v of item.videos) await deleteVideoBlob(v.id);
                } else {
                    await deleteVideoBlob(id);
                }
                videos = videos.filter(v => v.id !== id);
                localStorage.setItem('nile_market_videos', JSON.stringify(videos));
                await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem });
            }
        }

        function editContent(id, type, title = '', shortDesc = '', desc = '') {
            editingId = id;
            activeUploadType = type;
            document.getElementById('titleInput').value = title;
            document.getElementById('shortDesc').value = shortDesc;
            document.getElementById('desc').value = desc;
            document.getElementById('modalTitle').innerHTML = type === 'shorts'
                ? '<i class="fas fa-bolt" style="color:red"></i> Edit Shorts'
                : 'Edit Video Details';
            document.getElementById('saveBtn').innerText = 'Save Changes';
            // Hide description fields for shorts — shorts backend does not accept them
            const shortDescGroup = document.getElementById('shortDesc')?.closest('.dash908-form-group');
            const descGroup = document.getElementById('desc')?.closest('.dash908-form-group');
            if (type === 'shorts') {
                if (shortDescGroup) shortDescGroup.style.display = 'none';
                if (descGroup) descGroup.style.display = 'none';
            } else {
                if (shortDescGroup) shortDescGroup.style.display = '';
                if (descGroup) descGroup.style.display = '';
            }
            document.getElementById('videoFileGroup').style.display = 'none';
            toggleModal('uploadModal', true);
        }

        function editPlaylist(id) {
            currentEditingPlId = id;
            const pl = videos.find(v => v.id === id);
            const container = document.getElementById('editPlaylistContent');
            container.innerHTML = `
                <div class="dash908-form-group"><label>Playlist Name</label><input type="text" id="editPlName" value="${pl.title}"></div>
                <hr style="margin:20px 0;">
                <h4>Edit Content</h4>
                <div id="editPlVideosList"></div>
            `;

            pl.videos.forEach((v, idx) => {
                const vidBox = document.createElement('div');
                vidBox.className = "edit-pl-item-box";
                vidBox.style = "background:#f9f9f9; padding:15px; border-radius:8px; margin-top:10px; border:1px solid #ddd;";
                vidBox.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
                        <img src="${v.thumb}" style="width:80px; height:45px; border-radius:4px; object-fit:fill;">
                        <div class="dash908-form-group" style="flex:1; min-width:150px; margin:0;">
                            <label>Title</label>
                            <input type="text" class="edit-pl-v-title" data-idx="${idx}" value="${v.title}">
                        </div>
                    </div>
                    <div class="dash908-form-group">
                        <label>Change Thumbnail</label>
                        <input type="file" class="edit-pl-v-thumb" data-idx="${idx}" accept="image/*">
                    </div>
                    <div class="dash908-form-group">
                        <label>Short Desc</label>
                        <input type="text" class="edit-pl-v-short" data-idx="${idx}" value="${v.shortDesc || ''}">
                    </div>
                    <div class="dash908-form-group">
                        <label>Detailed Desc</label>
                        <textarea rows="2" class="edit-pl-v-desc" data-idx="${idx}">${v.desc || ''}</textarea>
                    </div>`;
                document.getElementById('editPlVideosList').appendChild(vidBox);
            });
            toggleModal('editPlaylistModal', true);
        }

        async function savePlaylistEdits() {
            const pl = videos.find(v => v.id === currentEditingPlId);
            pl.title = document.getElementById('editPlName').value;
            const titles = document.querySelectorAll('.edit-pl-v-title');
            const shorts_inputs = document.querySelectorAll('.edit-pl-v-short');
            const longs = document.querySelectorAll('.edit-pl-v-desc');
            const thumbs = document.querySelectorAll('.edit-pl-v-thumb');

            for (let i = 0; i < titles.length; i++) {
                const idx = parseInt(titles[i].getAttribute('data-idx'));
                pl.videos[idx].title = titles[i].value;
                pl.videos[idx].shortDesc = shorts_inputs[i].value;
                pl.videos[idx].desc = longs[i].value;

                const newThumbFile = thumbs[i].files[0];
                if (newThumbFile) {
                    pl.videos[idx].thumb = await new Promise(res => {
                        const r = new FileReader();
                        r.onload = (e) => res(e.target.result);
                        r.readAsDataURL(newThumbFile);
                    });
                }
            }
            localStorage.setItem('nile_market_videos', JSON.stringify(videos));
            await renderVideos({ currentChannelId, viewPlaylist, playVideo, editPlaylist, editContent, deleteItem });
            toggleModal('editPlaylistModal', false);
        }

        async function saveChannelChanges() {
            const data = JSON.parse(localStorage.getItem('myChannel')) || {};
            const btn = document.getElementById('saveChanBtn');
            data.id = currentChannelId;
            const newPfp = document.getElementById('editChanPfp').files[0];
            const newBanner = document.getElementById('editChanBanner').files[0];

            btn.disabled = true;
            btn.innerText = "Saving...";

            data.name = document.getElementById('editChanName').value;
            data.desc = document.getElementById('editChanDesc').value;
            data.contact = document.getElementById('editChanEmail').value;

            if (newPfp) data.pfp = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(newPfp); });
            if (newBanner) data.banner = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(newBanner); });

            localStorage.setItem('myChannel', JSON.stringify(data));
            currentChannelId = loadChannel();
            btn.disabled = false;
            btn.innerText = "Save Changes";
            toggleModal('editChannelModal', false);
        }
    
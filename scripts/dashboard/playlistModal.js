export function mountPlaylistModal() {
    if (document.getElementById('playlistModal')) return;
    const html = `
    <div class="dash908-modal-overlay" id="playlistModal">
        <div class="dash908-modal">
            <h3 style="margin-bottom:15px;">Create New Playlist</h3>
            <div class="dash908-modal-content">
                <div class="dash908-form-group"><label>Playlist Name</label><input id="plNameInput"><div class="input-error" id="plNameError" style="display:none;color:#c00;font-size:12px;margin-top:4px"></div></div>
                <hr style="margin:20px 0; border:0; border-top:1px solid #ddd;">
                <h4 style="margin-bottom:10px;">Add Video</h4>
                <div style="background:#f9f9f9; padding:15px; border-radius:8px; border:1px solid #eee;">
                    <div class="dash908-form-group"><label>Video Title</label><input id="plVideoTitle"><div class="input-error" id="plVideoTitleError" style="display:none;color:#c00;font-size:12px;margin-top:4px"></div></div>
                    <div class="dash908-form-group"><label>Video File</label><input type="file" id="plVideoFile" accept="video/*"><div class="input-error" id="plVideoFileError" style="display:none;color:#c00;font-size:12px;margin-top:4px"></div></div>
                    <div class="dash908-form-group"><label>Thumbnail</label><input type="file" id="plVideoThumb" accept="image/*"><div class="input-error" id="plVideoThumbError" style="display:none;color:#c00;font-size:12px;margin-top:4px"></div></div>
                    <div class="dash908-form-group"><label>Short Description</label><input id="plVideoShort"><div class="input-error" id="plVideoShortError" style="display:none;color:#c00;font-size:12px;margin-top:4px"></div></div>
                    <div class="dash908-form-group"><label>Detailed Description</label><textarea id="plVideoLong" rows="2"></textarea><div class="input-error" id="plVideoLongError" style="display:none;color:#c00;font-size:12px;margin-top:4px"></div></div>
                    <button class="dash908-publish-btn" style="width:100%;" id="addVideoToTempBtn">Add to List</button>
                </div>
                <div id="playlistStagingArea" style="margin-top:20px;">
                    <h4 style="margin-bottom:10px;">Queue (Needs 2+ videos to publish):</h4>
                    <div id="playlistItemsList"></div>
                </div>
            </div>
            <div style="text-align:right; margin-top:15px; border-top:1px solid #eee; padding-top:15px; display: flex; justify-content: flex-end;">
                <button class="dash908-publish-btn" id="uploadPlaylistBtn" disabled>Publish Playlist</button>
                <button class="dash908-cancel-btn" id="closePlaylistModalBtn">Cancel</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

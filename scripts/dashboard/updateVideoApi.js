import { getAccessToken } from '../auth.js';

export async function updateVideoAllApis({ videoId, title, shortDesc, detailedDesc, newImageFile }) {
    try {
        const token = await getAccessToken();
        const authHeader = { 'Authorization': 'Bearer ' + token };

        let oldImageUrl = '';
        if (newImageFile) {
            // Fetch current aggregatedApi entries to find old image URL
            const currentRes = await fetch(`https://valviorabackend2.onrender.com/aggregatedApi`, {
                method: 'GET',
                headers: authHeader
            });
            if (currentRes.ok && currentRes.status !== 204) {
                const arr = await currentRes.json().catch(() => []);
                if (Array.isArray(arr)) {
                    const match = arr.find(e => String(e.videoId) === String(videoId));
                    if (match && match.image) oldImageUrl = match.image;
                }
            }

            // Step 1: Send image only to aggregatedApi first to get Cloudinary URL back
            const formData = new FormData();
            formData.append('videoId', videoId);
            formData.append('title', title);
            formData.append('shortDescription', shortDesc);
            formData.append('DetailedDescription', detailedDesc);
            formData.append('image', newImageFile);
            if (oldImageUrl) formData.append('oldImageUrl', oldImageUrl);

            const aggRes = await fetch('https://valviorabackend2.onrender.com/aggregatedApi', {
                method: 'PUT',
                headers: authHeader,
                body: formData
            });
            if (!aggRes.ok) {
                const errData = await aggRes.json().catch(() => ({}));
                throw new Error(errData?.message || 'aggregatedApi update failed.');
            }
            const aggData = await aggRes.json().catch(() => ({}));
            const newCloudinaryUrl = aggData?.image || '';

            // Step 2: Run remaining PUTs in parallel (videoSummaryApi, videoContentApi, thumbnailApi as JSON)
            const promises = [
                fetch('https://valviorabackend2.onrender.com/videoSummaryApi', {
                    method: 'PUT',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
                    body: JSON.stringify({ videoId, title })
                }),
                fetch('https://valviorabackend2.onrender.com/videoContentApi', {
                    method: 'PUT',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
                    body: JSON.stringify({ videoId, shortDescription: shortDesc, DetailedDescription: detailedDesc })
                }),
                fetch('https://valviorabackend2.onrender.com/thumbnailApi', {
                    method: 'PUT',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
                    body: JSON.stringify({ videoId, image: newCloudinaryUrl, oldImageUrl: oldImageUrl || '' })
                })
            ];

            const responses = await Promise.all(promises);
            for (let res of responses) {
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody?.message || `Request failed with status ${res.status}`);
                }
            }

        } else {
            // No new image: run aggregatedApi, videoSummaryApi, videoContentApi in parallel as JSON; skip thumbnailApi
            const requests = [
                fetch('https://valviorabackend2.onrender.com/aggregatedApi', {
                    method: 'PUT',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
                    body: JSON.stringify({ videoId, title, shortDescription: shortDesc, DetailedDescription: detailedDesc })
                }),
                fetch('https://valviorabackend2.onrender.com/videoSummaryApi', {
                    method: 'PUT',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
                    body: JSON.stringify({ videoId, title })
                }),
                fetch('https://valviorabackend2.onrender.com/videoContentApi', {
                    method: 'PUT',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
                    body: JSON.stringify({ videoId, shortDescription: shortDesc, DetailedDescription: detailedDesc })
                })
            ];

            const responses = await Promise.all(requests);
            for (let res of responses) {
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody?.message || `Request failed with status ${res.status}`);
                }
            }
        }

        return true;
    } catch (err) {
        throw err;
    }
}

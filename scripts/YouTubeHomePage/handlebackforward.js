import { renderThumbnails, getCachedThumbnails } from './renderThumbnails.js';
import { showSearchNotFoundCenter } from './searchNotfound.js';
window.addEventListener('popstate', (e) => {
    const s = e.state;
    if (!s) {
        // restore initial full list
        renderThumbnails(getCachedThumbnails());
        return;
    }
    if (s.searchNotFound) {
        showSearchNotFoundCenter(s.q, false);
        return;
    }
    if (s.found && Array.isArray(s.ids)) {
        const all = getCachedThumbnails();
        const matches = s.ids.map(id => (all || []).find(t => t.id === id)).filter(Boolean);
        if (matches.length) renderThumbnails(matches);
        else renderThumbnails(getCachedThumbnails());
        return;
    }
});
import { renderThumbnails, getCachedThumbnails } from './renderThumbnails.js';
import { showSearchNotFoundCenter } from './searchNotfound.js';
export function performHomeSearch(q, push = true) {
    const searchField = document.querySelector('.js-search-input');
    const query = (q || (searchField && searchField.value) || '').trim();
    const container = document.querySelector('.js-thumbnail-container');
    if (!query) {
        renderThumbnails(getCachedThumbnails());
        if (push) history.pushState(null, '', window.location.pathname);
        return;
    }
    const all = getCachedThumbnails();
    const matches = (all || []).filter(t => (t.title || '').toLowerCase().includes(query.toLowerCase()));
    if (matches.length) {
        renderThumbnails(matches, true);
        if (push) history.pushState({ q: query, found: true, ids: matches.map(m=>m.id) }, '', '?search=' + encodeURIComponent(query));
    } else {
        showSearchNotFoundCenter(query, push);
    }
}
import { escapeHtml } from './YoutubeHomePage.js';

export function showSearchNotFoundCenter(q, push = true) {
    const container = document.querySelector('.js-thumbnail-container');
    if (!container) return;

    // Hide the Shorts row(s) here too, same as a successful search does,
    // so they don't show up next to a "no results" message.
    document.querySelectorAll('.shortsgh, .gsho-layout-wrapper').forEach((el) => {
        el.style.display = 'none';
    });

    container.innerHTML = `<div class="search-not-found-center">No results found for "${escapeHtml(q)}"</div>`;
    if (push) history.pushState({ searchNotFound: true, q: q }, '', '?search=' + encodeURIComponent(q));
}
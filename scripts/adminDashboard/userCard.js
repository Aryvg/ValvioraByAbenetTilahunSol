function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, function (char) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];
  });
}

function hashHue(str) {
  let hash = 0;
  const value = String(str || "x");
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

function gradientFor(seed) {
  const hue = hashHue(seed);
  return `linear-gradient(135deg, hsl(${hue} 68% 42%), hsl(${(hue + 42) % 360} 70% 26%))`;
}

function initialsOf(firstName, lastName) {
  const initials = ((firstName || "").charAt(0) + (lastName || "").charAt(0)).toUpperCase();
  return initials || "?";
}

function isLikelyUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function avatarHTML(seed, label, url, extraClass) {
  const gradient = gradientFor(seed);
  const img = isLikelyUrl(url) ? `<img src="${escapeHtml(url)}" alt="" onerror="this.remove()">` : "";
  return `<span class="avatar ${extraClass || ""}" style="background:${gradient}">${img}<span class="avatar-fallback">${escapeHtml(label)}</span></span>`;
}

export function createUserCardMarkup(user, formatRelative) {
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || user.username || "User";
  const isAdmin = Boolean(user.roles && Number(user.roles.Admin) === 5150);
  const roleChips = Object.entries(user.roles || {})
    .filter(([, value]) => value)
    .map(([key]) => `<span class="role-chip role-${key.toLowerCase() === "admin" ? "admin" : "user"}">${escapeHtml(key)}</span>`)
    .join("");

  const statusHTML = user.isOnline
    ? '<span class="status-dot online"></span><span class="status-text online">Online now</span>'
    : '<span class="status-dot offline"></span><span class="status-text offline">Offline</span>'
      + '<span class="status-sep">·</span>'
      + `<span class="status-text offline" data-lastseen="${user.lastActiveAt || Date.now()}">${formatRelative(user.lastActiveAt || Date.now())}</span>`;

  return (
    `<article class="user-card${user.isOnline ? " is-online" : ""}" data-user-id="${escapeHtml(user.id || user.UserId || "")}">`
    + `<div class="user-card-top">`
    + avatarHTML(user.id || user.UserId || user.username, initialsOf(user.firstname, user.lastname), user.profilePicture, "")
    + `<div class="user-id-block">`
    + `<div class="user-name">${escapeHtml(fullName)}</div>`
    + `<div class="user-username">${escapeHtml(user.username || "")}</div>`
    + `</div>`
    + `</div>`
    + `<div class="status-line">${statusHTML}</div>`
    + `<div class="meta-row">`
    + `<span class="meta-chip">${escapeHtml(user.country || "—")}</span>`
    + `<span class="meta-chip">${escapeHtml(user.age || "—")} years old</span>`
    + roleChips
    + `</div>`
    + `<div class="card-actions">`
    + `<button class="btn btn-danger" type="button" data-action="delete-user" data-id="${escapeHtml(user.id || user.UserId || "")}">`
    + `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0v13a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    + `Delete user`
    + `</button>`
    + `<button class="btn btn-warn" type="button" data-action="toggle-admin" data-id="${escapeHtml(user.id || user.UserId || "")}">`
    + `${isAdmin ? "Make User" : "Make Admin"}`
    + `</button>`
    + `</div>`
    + `</article>`
  );
}

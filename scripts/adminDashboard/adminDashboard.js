import { createUserCardMarkup } from "./userCard.js";
import { getAccessToken } from "../auth.js";
import { initPresence } from "../presence.js";

(function(){
"use strict";

/* ============================================================
   MOCK DATA
   (matches the real API document shapes; profilePicture / thumbnail
   fields fall back to generated placeholders when a URL is missing
   or fails to load, so real Cloudinary/localhost URLs drop in cleanly.)
============================================================ */
const now = Date.now();
const MIN = 60*1000, HOUR = 60*MIN, DAY = 24*HOUR, YEAR = 365*DAY;

const state = {
  query:"",
  searchMode:"users",
  activeTab:{},
  users:[
    {
      id:"fd78bfae-d133-448b-8e03-3f1cbf4ffb78",
      username:"next52285@gmail.com",
      roles:{ user:true, admin:false },
      password:"$2b$10$SV01Z5Zz0XpO7U4ByqzLS.a9wjl5SR/SQFLyal7Itnm9iXEM7Fr8y",
      firstname:"Abenet", lastname:"Tilahun", age:"21", country:"Ethiopia",
      profilePicture:"C:\\fakepath\\photo_2026-07-11_13-58-13.jpg",
      isOnline:true, lastActiveAt: now - 15*1000
    },
    {
      id:"b6e1a2c4-9f3d-4a11-8c2e-7d4f5a6b1c90",
      username:"selam.bekele@gmail.com",
      roles:{ user:true, admin:false },
      password:"$2b$10$q7Lm2Xz8Kp0Rn4TdYw1uPeVh3sJc6BgAoNfDzMx9Iq5rZtLk2WbCa",
      firstname:"Selam", lastname:"Bekele", age:"24", country:"Ethiopia",
      profilePicture:"",
      isOnline:false, lastActiveAt: now - 3*HOUR
    },
    {
      id:"7a2f9e10-3c4b-4d5e-9f0a-1b2c3d4e5f60",
      username:"m.chen@outlook.com",
      roles:{ user:true, admin:false },
      password:"$2b$10$Tz6Vb1Nq8Yc3Ee7Fg2Hj9Kl0Mn4Oo5Pp1Qr2St3Uv4Wx5Yz6AaBb7",
      firstname:"Michael", lastname:"Chen", age:"29", country:"Canada",
      profilePicture:"",
      isOnline:false, lastActiveAt: now - 90*1000
    },
    {
      id:"c3d4e5f6-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
      username:"sara.ahmed94@gmail.com",
      roles:{ user:true, admin:false },
      password:"$2b$10$Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0Kk1Ll2Mm3Nn4Oo5Pp6Qq7Rr",
      firstname:"Sara", lastname:"Ahmed", age:"19", country:"Sudan",
      profilePicture:"",
      isOnline:true, lastActiveAt: now - 4*1000
    },
    {
      id:"e5f6a7b8-2c3d-4e5f-9a0b-1c2d3e4f5a6b",
      username:"daniel.okafor@yahoo.com",
      roles:{ user:true, admin:false },
      password:"$2b$10$Ss8Tt9Uu0Vv1Ww2Xx3Yy4Zz5Aa6Bb7Cc8Dd9Ee0Ff1Gg2Hh3Ii4Jj",
      firstname:"Daniel", lastname:"Okafor", age:"34", country:"Nigeria",
      profilePicture:"",
      isOnline:false, lastActiveAt: now - 3*YEAR - 40*DAY
    },
    {
      id:"a1b2c3d4-5e6f-4a1b-9c2d-3e4f5a6b7c8d",
      username:"hana.girma@admintube.com",
      roles:{ user:true, admin:true },
      password:"$2b$10$Kk3Ll4Mm5Nn6Oo7Pp8Qq9Rr0Ss1Tt2Uu3Vv4Ww5Xx6Yy7Zz8Aa9Bb",
      firstname:"Hana", lastname:"Girma", age:"27", country:"Ethiopia",
      profilePicture:"",
      isOnline:false, lastActiveAt: now - 5*DAY - 3*HOUR
    }
  ],
  channels:[],
  channelsLoading:false,
  channelsError:"",
};

/* ============================================================
   HELPERS
============================================================ */
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
  });
}
function hashHue(str){
  var h = 0;
  str = String(str||"x");
  for(var i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h % 360;
}
function gradientFor(seed){
  var hue = hashHue(seed);
  return "linear-gradient(135deg, hsl("+hue+" 68% 42%), hsl("+((hue+42)%360)+" 70% 26%))";
}
function initialsOf(a,b){
  var s = ((a||"").charAt(0) + (b||"").charAt(0)).toUpperCase();
  return s || "?";
}
function isLikelyUrl(str){
  return typeof str === "string" && /^https?:\/\//i.test(str);
}
function formatRelative(ts){
  var diff = Math.max(0, Date.now() - ts);
  var sec = Math.floor(diff/1000);
  if(sec < 45) return "just now";
  var min = Math.floor(sec/60);
  if(min < 60) return min===1 ? "1 minute ago" : min+" minutes ago";
  var hr = Math.floor(min/60);
  if(hr < 24) return hr===1 ? "1 hour ago" : hr+" hours ago";
  var day = Math.floor(hr/24);
  if(day < 30) return day===1 ? "1 day ago" : day+" days ago";
  var mon = Math.floor(day/30);
  if(mon < 12) return mon===1 ? "1 month ago" : mon+" months ago";
  var yr = Math.floor(day/365);
  return yr===1 ? "1 year ago" : yr+" years ago";
}
function formatCount(n){
  n = Number(n)||0;
  if(n >= 1000000) return (n/1000000).toFixed(1).replace(/\.0$/,"")+"M";
  if(n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,"")+"K";
  return String(n);
}

function normalizeChannel(ch){
  return {
    id: ch.channelId || "",
    channelname: ch.channelname || "",
    channelType: ch.channelType || "",
    description: ch.Description || "",
    profilePicture: ch.profilePicture || "",
    channelBanner: ch.channelBanner || "",
    contactEmail: ch.contactEmail || "",
    createdBy: ch.createdBy || "",
    subscribers: Number(ch.subscribe) || 0,
    videos: [],
    shorts: [],
    playlists: []
  };
}

function normalizeVideo(v){
  return {
    videoId: v.videoId || "",
    title: v.title || "",
    views: Number(v.Views ?? v.views ?? v.viewCount ?? v.totalViews ?? 0),
    videoFile: v.video || "",
    thumbnail: v.image || "",
    videoDescription: v.shortDescription || "",
    detailedDescription: v.DetailedDescription || "",
    status: v.isBanned ? "banned" : "active"
  };
}

function normalizeShort(s){
  return {
    shortId: s.shortId || "",
    title: s.title || "",
    views: Number(s.views ?? s.Views ?? s.viewCount ?? s.totalViews ?? 0),
    thumbnail: s.thumbnail || "",
    videoUrl: s.videoUrl || "",
    createdBy: s.createdBy || "",
    channelId: s.channelId || "",
    status: s.isBanned ? "banned" : "active"
  };
}

function normalizePlaylist(p){
  return {
    playlistId: p.playlistId || "",
    playlistTitle: p.playlistTitle || "",
    thumbnail: p.thumbnail || "",
    videoCount: Number(p.videoCount) || (Array.isArray(p.videos) ? p.videos.length : 0),
    views: Number(p.views ?? p.Views ?? p.viewCount ?? p.totalViews ?? 0),
    status: p.isBanned ? "banned" : "active",
    videos: Array.isArray(p.videos) ? p.videos.map(function(v){
      return {
        videoId: v.videoId || "",
        image: v.image || "",
        title: v.title || "",
        shortDescription: v.shortDescription || "",
        detailedDescription: v.detailedDescription || "",
        video: v.video || "",
        timer: v.timer || ""
      };
    }) : []
  };
}

/* ============================================================
   AVATAR / THUMB MARKUP
============================================================ */
function avatarHTML(seed, label, url, extraClass){
  var grad = gradientFor(seed);
  var img = isLikelyUrl(url) ? '<img src="'+escapeHtml(url)+'" alt="" onerror="this.remove()">' : "";
  return '<span class="avatar '+(extraClass||"")+'" style="background:'+grad+'">'+img+
         '<span class="avatar-fallback">'+escapeHtml(label)+'</span></span>';
}
function thumbFallbackHTML(title, kind){
  var icon = kind === "playlist"
    ? '<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="6" width="14" height="3" rx="1" fill="rgba(255,255,255,.85)"/><rect x="3" y="11" width="14" height="3" rx="1" fill="rgba(255,255,255,.85)"/><rect x="3" y="16" width="10" height="3" rx="1" fill="rgba(255,255,255,.85)"/></svg>'
    : '<span class="play-glyph"><svg viewBox="0 0 12 12" fill="none"><path d="M2 1.5l8 4.5-8 4.5v-9z" fill="currentColor"/></svg></span>';
  return '<span class="thumb-fallback">'+icon+'<span>'+escapeHtml(title)+'</span></span>';
}
function thumbHTML(seed, title, url, kind){
  var grad = gradientFor(seed);
  var img = isLikelyUrl(url) ? '<img src="'+escapeHtml(url)+'" alt="" onerror="this.remove()">' : "";
  return '<span class="thumb-media" style="position:absolute;inset:0;background:'+grad+'">'+img+
         thumbFallbackHTML(title, kind)+'</span>';
}

/* ============================================================
   RENDER: USERS
============================================================ */
function normalizeRegisteredUser(user){
  var userId = user.UserId || user.id || user._id || user.userId || "";
  var firstName = user.firstname || user.firstName || user.first_name || "";
  var lastName = user.lastname || user.lastName || user.last_name || "";
  var username = user.username || user.email || user.emailAddress || "";
  var lastActiveAt = Number(user.lastActiveAt) || (user.isOnline ? Date.now() - 15*1000 : Date.now() - 3*60*60*1000);

  return {
    id: userId,
    username: username,
    firstname: firstName,
    lastname: lastName,
    age: user.age ?? "",
    country: user.country || "",
    profilePicture: user.profilePicture || user.avatar || "",
    roles: user.roles || {},
    isOnline: Boolean(user.isOnline),
    lastActiveAt: lastActiveAt
  };
}

async function loadRegisteredUsers(silent){
  if(!silent){
    state.usersLoading = true;
    state.usersError = "";
    renderUsers();
  }

  try {
    var token = await getAccessToken();
    var headers = { Accept: "application/json" };
    if(token){ headers.Authorization = "Bearer " + token; }

    var response = await fetch("https://valviorabackend2.onrender.com/registered", {
      credentials: "include",
      headers: headers
    });

    if(!response.ok){
      throw new Error("Request failed with status " + response.status);
    }

    var data = await response.json();
    var list = Array.isArray(data) ? data.map(normalizeRegisteredUser) : [];
    state.users = list;
  } catch (error) {
    console.error("Failed to load registered users", error);
    if(!silent){
      state.users = [];
      state.usersError = "Unable to load registered users";
    }
  } finally {
    if(!silent){ state.usersLoading = false; }
    renderUsers();
    updateStats();
  }
}

async function loadVideosForChannel(channel){
  try {
    var response = await fetch("https://valviorabackend2.onrender.com/aggregatedApi/channel/" + encodeURIComponent(channel.id), {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    if(!response.ok){ throw new Error("Request failed with status " + response.status); }
    var data = await response.json();
    channel.videos = Array.isArray(data) ? data.map(normalizeVideo) : [];
  } catch (error) {
    console.error("Failed to load videos for channel " + channel.id, error);
    channel.videos = [];
  }
}

async function loadPlaylistsForChannel(channel){
  try {
    var response = await fetch("https://valviorabackend2.onrender.com/playlistVideoApi/channel/" + encodeURIComponent(channel.id), {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    if(!response.ok){ throw new Error("Request failed with status " + response.status); }
    var data = await response.json();
    channel.playlists = Array.isArray(data) ? data.map(normalizePlaylist) : [];
  } catch (error) {
    console.error("Failed to load playlists for channel " + channel.id, error);
    channel.playlists = [];
  }
}

async function loadAllShorts(){
  try {
    var token = await getAccessToken();
    var headers = { Accept: "application/json" };
    if(token){ headers.Authorization = "Bearer " + token; }

    var response = await fetch("https://valviorabackend2.onrender.com/aggregatedShortsApi", {
      credentials: "include",
      headers: headers
    });

    var shortsList = [];
    if(response.status === 204){
      shortsList = [];
    } else if(response.ok){
      var data = await response.json();
      shortsList = Array.isArray(data) ? data : [];
    } else {
      throw new Error("Request failed with status " + response.status);
    }

    var normalized = shortsList.map(normalizeShort);
    state.channels.forEach(function(channel){
      channel.shorts = normalized.filter(function(s){ return s.channelId === channel.id; });
    });
  } catch (error) {
    console.error("Failed to load shorts", error);
    state.channels.forEach(function(channel){ channel.shorts = []; });
  }
}

async function loadChannels(){
  state.channelsLoading = true;
  state.channelsError = "";
  renderChannels();

  try {
    var urls = [
      "https://valviorabackend2.onrender.com/channelApi?public=1"
    ];
    var response = null;
    var data = [];

    for (var i = 0; i < urls.length; i++) {
      response = await fetch(urls[i], {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (response.ok || response.status === 204) {
        break;
      }
    }

    if (!response || (!response.ok && response.status !== 204)) {
      throw new Error("Channel fetch failed with status " + (response ? response.status : 'no response'));
    }

    if (response.status === 204) {
      data = [];
    } else {
      data = await response.json();
    }

    var list = Array.isArray(data) ? data.map(normalizeChannel) : [];
    state.channels = list;

    await Promise.all([
      loadAllShorts(),
      ...list.map(function(channel){
        return Promise.all([
          loadVideosForChannel(channel),
          loadPlaylistsForChannel(channel)
        ]);
      })
    ]);
  } catch (error) {
    console.error("Failed to load channels", error);
    state.channels = [];
    state.channelsError = "Unable to load channels";
  } finally {
    state.channelsLoading = false;
    renderChannels();
    updateStats();
  }
}

async function deleteRegisteredUser(userId){
  var token = await getAccessToken();
  var headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if(token){ headers.Authorization = "Bearer " + token; }

  var response = await fetch("https://valviorabackend2.onrender.com/registered", {
    method: "DELETE",
    credentials: "include",
    headers: headers,
    body: JSON.stringify({ UserId: userId })
  });

  if(!response.ok){
    throw new Error("Delete failed with status " + response.status);
  }

  return response;
}

async function setUserAdminRole(userId, makeAdmin){
  var token = await getAccessToken();
  var headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if(token){ headers.Authorization = "Bearer " + token; }

  var response = await fetch("https://valviorabackend2.onrender.com/registered/" + encodeURIComponent(userId) + "/role", {
    method: "PATCH",
    credentials: "include",
    headers: headers,
    body: JSON.stringify({ makeAdmin: makeAdmin })
  });

  if(!response.ok){
    var errBody = null;
    try { errBody = await response.json(); } catch(e) {}
    throw new Error((errBody && errBody.message) || ("Role update failed with status " + response.status));
  }

  return response.json();
}

const CONTENT_API = {
  video:    { url: "https://valviorabackend2.onrender.com/aggregatedApi",       idKey: "videoId" },
  short:    { url: "https://valviorabackend2.onrender.com/aggregatedShortsApi", idKey: "shortId" },
  playlist: { url: "https://valviorabackend2.onrender.com/playlistVideoApi",    idKey: "playlistId" }
};

async function setContentBanned(kind, id, isBanned){
  var cfg = CONTENT_API[kind];
  if(!cfg) throw new Error("Unknown content kind: " + kind);
  var token = await getAccessToken();
  var headers = { Accept: "application/json", "Content-Type": "application/json" };
  if(token){ headers.Authorization = "Bearer " + token; }
  var body = {}; body[cfg.idKey] = id; body.isBanned = isBanned;
  var response = await fetch(cfg.url, { method: "PUT", credentials: "include", headers: headers, body: JSON.stringify(body) });
  if(!response.ok){ throw new Error("Ban update failed with status " + response.status); }
  return response.json();
}

async function deleteContentItem(kind, id){
  var cfg = CONTENT_API[kind];
  if(!cfg) throw new Error("Unknown content kind: " + kind);
  var token = await getAccessToken();
  var headers = { Accept: "application/json", "Content-Type": "application/json" };
  if(token){ headers.Authorization = "Bearer " + token; }
  var body = {}; body[cfg.idKey] = id;
  var response = await fetch(cfg.url, { method: "DELETE", credentials: "include", headers: headers, body: JSON.stringify(body) });
  if(!response.ok){ throw new Error("Delete failed with status " + response.status); }
  return response;
}

function renderUsers(){
  var grid = document.getElementById("usersGrid");
  var empty = document.getElementById("usersEmpty");
  var q = state.searchMode === "users" ? state.query : "";
  var list = state.users.filter(function(u){
    if(!q) return true;
    var hay = (u.firstname+" "+u.lastname+" "+u.username+" "+u.country).toLowerCase();
    return hay.indexOf(q) !== -1;
  });

  document.getElementById("usersCount").textContent = state.users.length;

  if(state.usersLoading){
    grid.innerHTML = '<p class="empty-state">Loading registered users…</p>';
    empty.hidden = true;
    return;
  }

  if(list.length === 0){
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = state.usersError || "No registered users found.";
    return;
  }
  empty.hidden = true;

  grid.innerHTML = list.map(function(u){
    return createUserCardMarkup(u, formatRelative);
  }).join("");
}

/* ============================================================
   RENDER: CONTENT CARD (video / short / playlist)
============================================================ */
function renderContentCard(item, kind, channelId){
  var id = item.videoId || item.shortId || item.playlistId;
  var title = item.title || item.playlistTitle;
  var isBanned = item.status === "banned";
  var thumbUrl = item.thumbnail || "";
  var thumbAction = kind === "playlist" ? "open-playlist" : "open-video";

  var metaHTML = "";
  if(kind === "playlist"){
    metaHTML = '<span>'+item.videoCount+' video'+(item.videoCount===1?"":"s")+' · '+formatCount(item.views)+' views</span>';
  } else {
    metaHTML = '<span>'+formatCount(item.views)+' views</span>';
  }

  var tagHTML = "";
  if(kind === "short") tagHTML += '<span class="thumb-tag tag-short">SHORT</span>';
  if(kind === "playlist") tagHTML += '<span class="thumb-tag tag-count">'+item.videoCount+' videos</span>';
  if(isBanned) tagHTML += '<span class="thumb-tag tag-banned">BANNED</span>';

  return (
    '<div class="content-card kind-'+kind+(isBanned?" is-banned":"")+'" data-item-id="'+id+'">'
      +'<button class="thumb-btn" type="button" data-action="'+thumbAction+'" data-kind="'+kind+'" data-channel="'+channelId+'" data-id="'+id+'" aria-label="'+(kind==="playlist"?"Open playlist ":"Play ")+escapeHtml(title)+'">'
        + thumbHTML(id, title, thumbUrl, kind)
        + tagHTML
      +'</button>'
      +'<div class="content-title">'+escapeHtml(title)+'</div>'
      +'<div class="content-meta">'+metaHTML+'</div>'
      +'<div class="content-actions">'
        +'<button class="btn btn-warn" type="button" data-action="toggle-ban" data-kind="'+kind+'" data-channel="'+channelId+'" data-id="'+id+'">'
          + (isBanned ? "Unban" : "Ban")
        +'</button>'
        +'<button class="btn btn-danger" type="button" data-action="delete-item" data-kind="'+kind+'" data-channel="'+channelId+'" data-id="'+id+'">'
          +'Delete permanently'
        +'</button>'
      +'</div>'
    +'</div>'
  );
}

/* ============================================================
   RENDER: CHANNELS
============================================================ */
function renderChannels(){
  var grid = document.getElementById("channelsGrid");
  var empty = document.getElementById("channelsEmpty");
  var q = state.searchMode === "channels" ? state.query : "";
  var list = state.channels.filter(function(c){
    if(!q) return true;
    var hay = (c.channelname+" "+c.contactEmail+" "+c.createdBy+" "+c.description).toLowerCase();
    return hay.indexOf(q) !== -1;
  });

  document.getElementById("channelsCount").textContent = state.channels.length;

  if(state.channelsLoading){
    grid.innerHTML = '<p class="empty-state">Loading channels…</p>';
    empty.hidden = true;
    return;
  }

  if(list.length === 0){
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = state.channelsError || "No channels match your search.";
    return;
  }
  empty.hidden = true;

  grid.innerHTML = list.map(function(c){
    var tab = state.activeTab[c.id] || "videos";
    var counts = { videos:c.videos.length, shorts:c.shorts.length, playlists:c.playlists.length };

    var tabsHTML = ["videos","shorts","playlists"].map(function(t){
      var label = t.charAt(0).toUpperCase()+t.slice(1);
      return '<button type="button" class="tab-btn'+(tab===t?" is-active":"")+'" data-action="switch-tab" data-channel="'+c.id+'" data-tab="'+t+'" role="tab" aria-selected="'+(tab===t)+'">'
        + label + ' ('+counts[t]+')</button>';
    }).join("");

    var items = c[tab];
    var kindSingular = tab === "videos" ? "video" : (tab === "shorts" ? "short" : "playlist");
    var contentHTML = items.length
      ? '<div class="content-grid">' + items.map(function(it){ return renderContentCard(it, kindSingular, c.id); }).join("") + '</div>'
      : '<p class="empty-state">No '+tab+' uploaded yet.</p>';

    return (
      '<article class="channel-card" data-channel-id="'+c.id+'">'
        +'<div class="channel-banner">'
          + (isLikelyUrl(c.channelBanner) ? '<img src="'+escapeHtml(c.channelBanner)+'" alt="" onerror="this.remove()">' : "")
          +'<span class="channel-banner-fallback" style="position:absolute;inset:0;background:'+gradientFor(c.id+"banner")+'"></span>'
        +'</div>'
        +'<div class="channel-head">'
          + avatarHTML(c.id, initialsOf(c.channelname,""), c.profilePicture, "channel-avatar")
          +'<div class="channel-info">'
            +'<div class="channel-name-row">'
              +'<span class="channel-name">'+escapeHtml(c.channelname)+'</span>'
              +'<span class="channel-type">'+escapeHtml(c.channelType)+'</span>'
            +'</div>'
            +'<p class="channel-desc">'+escapeHtml(c.description)+'</p>'
            +'<div class="channel-contacts">'
              +'<span>contact · <span class="v">'+escapeHtml(c.contactEmail)+'</span></span>'
              +'<span>owner · <span class="v">'+escapeHtml(c.createdBy)+'</span></span>'
            //   +'<span>rev · <span class="v">'+c.v+'</span></span>'
            +'</div>'
          +'</div>'
          +'<div class="channel-stats-row">'
            +'<span class="meta-chip">'+formatCount(c.subscribers)+' subscribers</span>'
            +'<span class="meta-chip">id '+c.id.slice(0,8)+'…</span>'
          +'</div>'
        +'</div>'
        +'<div class="tabs" role="tablist">'+tabsHTML+'</div>'
        +'<div class="tab-panel">'+contentHTML+'</div>'
      +'</article>'
    );
  }).join("");
}

function renderAll(){
  renderUsers();
  renderChannels();
  updateStats();
}

function updateStats(){
  document.getElementById("statOnline").textContent = state.users.filter(function(u){return u.isOnline;}).length;
  document.getElementById("statUsers").textContent = state.users.length;
  document.getElementById("statChannels").textContent = state.channels.length;
  var totalContent = state.channels.reduce(function(acc,c){
    return acc + c.videos.length + c.shorts.length + c.playlists.length;
  }, 0);
  document.getElementById("statContent").textContent = totalContent;
}

/* ============================================================
   COLLAPSE PANELS
============================================================ */
function setupCollapse(btnId, bodyId){
  var btn = document.getElementById(btnId);
  var body = document.getElementById(bodyId);
  btn.addEventListener("click", function(){
    var collapsed = body.classList.toggle("is-collapsed");
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.querySelector(".sr-only").textContent = collapsed ? "Expand section" : "Collapse section";
  });
}

/* ============================================================
   SEARCH
============================================================ */
var searchModeBtn = document.getElementById("searchModeBtn");
var searchModeMenu = document.getElementById("searchModeMenu");
var searchModeLabel = document.getElementById("searchModeLabel");
var searchInput = document.getElementById("searchInput");

function openSearchMenu(){
  searchModeMenu.classList.add("is-open");
  searchModeBtn.setAttribute("aria-expanded","true");
}
function closeSearchMenu(){
  searchModeMenu.classList.remove("is-open");
  searchModeBtn.setAttribute("aria-expanded","false");
}
searchModeBtn.addEventListener("click", function(e){
  e.stopPropagation();
  if(searchModeMenu.classList.contains("is-open")) closeSearchMenu(); else openSearchMenu();
});
searchInput.addEventListener("focus", openSearchMenu);
document.addEventListener("click", function(e){
  if(!searchModeMenu.contains(e.target) && e.target !== searchModeBtn) closeSearchMenu();
});
searchModeMenu.querySelectorAll("button[data-mode]").forEach(function(b){
  b.addEventListener("click", function(){
    state.searchMode = b.dataset.mode;
    searchModeLabel.textContent = b.dataset.mode === "users" ? "Users" : "Channels";
    searchInput.placeholder = b.dataset.mode === "users" ? "Search registered users…" : "Search channels…";
    searchModeMenu.querySelectorAll("button[data-mode]").forEach(function(x){
      x.classList.toggle("is-active", x===b);
      x.setAttribute("aria-selected", String(x===b));
    });
    closeSearchMenu();
    searchInput.focus();
    applySearch();
  });
});
searchInput.addEventListener("input", applySearch);

function applySearch(){
  state.query = searchInput.value.trim().toLowerCase();
  renderUsers();
  renderChannels();
  if(state.query){
    var bodyId = state.searchMode === "users" ? "usersBody" : "channelsBody";
    var panelId = state.searchMode === "users" ? "usersPanel" : "channelsPanel";
    var btnId = state.searchMode === "users" ? "usersCollapseBtn" : "channelsCollapseBtn";
    var body = document.getElementById(bodyId);
    if(body.classList.contains("is-collapsed")){
      body.classList.remove("is-collapsed");
      var btn = document.getElementById(btnId);
      btn.setAttribute("aria-expanded","true");
      btn.querySelector(".sr-only").textContent = "Collapse section";
    }
  }
}

/* ============================================================
   MODALS: generic show/hide
============================================================ */
function showOverlay(el){ el.hidden = false; document.body.style.overflow = "hidden"; }
function hideOverlay(el){ el.hidden = true; document.body.style.overflow = ""; }

document.querySelectorAll(".modal-overlay").forEach(function(ov){
  ov.addEventListener("click", function(e){ if(e.target === ov) closeAllModals(); });
});
document.addEventListener("keydown", function(e){
  if(e.key === "Escape") closeAllModals();
});
function closeAllModals(){
  [confirmOverlay, playerOverlay, playlistOverlay].forEach(function(ov){
    if(!ov.hidden){
      hideOverlay(ov);
      if(ov === playerOverlay){
        var v = playerMedia.querySelector("video");
        if(v){ v.pause(); }
      }
    }
  });
}

/* ---- confirm modal ---- */
var confirmOverlay = document.getElementById("confirmOverlay");
var confirmTitle = document.getElementById("confirmTitle");
var confirmMessage = document.getElementById("confirmMessage");
var confirmYes = document.getElementById("confirmYes");
var confirmNo = document.getElementById("confirmNo");
var pendingAction = null;

function openConfirm(title, message, onConfirm){
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  pendingAction = onConfirm;
  showOverlay(confirmOverlay);
  confirmYes.focus();
}
confirmYes.addEventListener("click", function(){
  var action = pendingAction;
  pendingAction = null;
  hideOverlay(confirmOverlay);
  if(action) action();
});
confirmNo.addEventListener("click", function(){
  pendingAction = null;
  hideOverlay(confirmOverlay);
});

/* ---- player modal ---- */
var playerOverlay = document.getElementById("playerOverlay");
var playerModal = document.getElementById("playerModal");
var playerMedia = document.getElementById("playerMedia");
var playerTitle = document.getElementById("playerTitle");
var playerMeta = document.getElementById("playerMeta");
var playerDesc = document.getElementById("playerDesc");
var playerClose = document.getElementById("playerClose");

function openPlayer(opts){
  playerTitle.textContent = opts.title || "Untitled";
  playerMeta.textContent = opts.meta || "";
  playerDesc.textContent = opts.desc || "";
  playerModal.classList.toggle("is-short", !!opts.isShort);

  var existingVideo = playerMedia.querySelector("video");
  if(existingVideo) existingVideo.remove();

  var fallback = document.getElementById("mediaFallback");
  fallback.classList.remove("is-visible");

  var video = document.createElement("video");
  video.controls = true;
  video.playsInline = true;
  video.setAttribute("preload","metadata");
  video.addEventListener("error", function(){ fallback.classList.add("is-visible"); });
  playerMedia.insertBefore(video, fallback);

  if(opts.src){
    video.src = opts.src;
  } else {
    fallback.classList.add("is-visible");
  }

  showOverlay(playerOverlay);
  if(opts.src){
    video.play().catch(function(){ /* autoplay may be blocked, controls remain available */ });
  }
}
playerClose.addEventListener("click", closeAllModals);

/* ---- playlist modal ---- */
var playlistOverlay = document.getElementById("playlistOverlay");
var playlistTitleEl = document.getElementById("playlistTitleEl");
var playlistSub = document.getElementById("playlistSub");
var playlistItemsEl = document.getElementById("playlistItemsEl");
var playlistClose = document.getElementById("playlistClose");

function openPlaylist(playlist){
  playlistTitleEl.textContent = playlist.playlistTitle;
  playlistSub.textContent = playlist.videoCount + " video" + (playlist.videoCount===1?"":"s") + " in this playlist";
  playlistItemsEl.innerHTML = playlist.videos.map(function(v, idx){
    var img = isLikelyUrl(v.image) ? '<img src="'+escapeHtml(v.image)+'" alt="" onerror="this.remove()">' : "";
    return (
      '<button type="button" class="playlist-item" data-playlist-video-index="'+idx+'">'
        +'<span class="pi-thumb" style="background:'+gradientFor(v.videoId)+'">'+img
          +'<span class="play-glyph" style="position:absolute;inset:0;margin:auto;width:22px;height:22px;"><svg viewBox="0 0 12 12" fill="none"><path d="M2 1.5l8 4.5-8 4.5v-9z" fill="currentColor"/></svg></span>'
        +'</span>'
        +'<span class="pi-info">'
          +'<span class="pi-title">'+escapeHtml(v.title)+'</span>'
          +'<span class="pi-timer">'+escapeHtml(v.timer||"")+'</span>'
        +'</span>'
      +'</button>'
    );
  }).join("");

  playlistItemsEl.querySelectorAll("[data-playlist-video-index]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var v = playlist.videos[Number(btn.dataset.playlistVideoIndex)];
      hideOverlay(playlistOverlay);
      openPlayer({
        title:v.title,
        meta:(v.timer ? v.timer + " · " : "") + "from “" + playlist.playlistTitle + "”",
        desc:v.detailedDescription || v.shortDescription || "",
        src:v.video,
        isShort:false
      });
    });
  });

  showOverlay(playlistOverlay);
}
playlistClose.addEventListener("click", closeAllModals);

/* ============================================================
   EVENT DELEGATION: cards & actions
============================================================ */
function findChannel(id){ return state.channels.find(function(c){ return c.id === id; }); }
function findItem(channel, kind, id){
  var arr = kind === "video" ? channel.videos : (kind === "short" ? channel.shorts : channel.playlists);
  var key = kind === "video" ? "videoId" : (kind === "short" ? "shortId" : "playlistId");
  return arr.find(function(it){ return it[key] === id; });
}
function removeItem(channel, kind, id){
  var key = kind === "video" ? "videoId" : (kind === "short" ? "shortId" : "playlistId");
  if(kind === "video") channel.videos = channel.videos.filter(function(it){ return it[key] !== id; });
  else if(kind === "short") channel.shorts = channel.shorts.filter(function(it){ return it[key] !== id; });
  else channel.playlists = channel.playlists.filter(function(it){ return it[key] !== id; });
}

document.addEventListener("click", function(e){
  var el = e.target.closest("[data-action]");
  if(!el) return;
  var action = el.dataset.action;

  if(action === "delete-user"){
    var user = state.users.find(function(u){ return u.id === el.dataset.id; });
    if(!user) return;
    openConfirm(
      "Delete user",
      "Delete " + user.firstname + " " + user.lastname + "? Their account will be permanently removed. This can't be undone.",
      async function(){
        try {
          await deleteRegisteredUser(user.id);
          state.users = state.users.filter(function(u){ return u.id !== user.id; });
          renderUsers();
          updateStats();
          toast("User deleted");
        } catch (error) {
          console.error("Failed to delete user", error);
          toast("Unable to delete user");
        }
      }
    );
    return;
  }

  if(action === "toggle-admin"){
    var targetUser = state.users.find(function(u){ return u.id === el.dataset.id; });
    if(!targetUser) return;
    var isCurrentlyAdmin = targetUser.roles && Number(targetUser.roles.Admin) === 5150;
    var makeAdmin = !isCurrentlyAdmin;
    var fullName = ((targetUser.firstname + " " + targetUser.lastname).trim() || targetUser.username || "this user");
    openConfirm(
      makeAdmin ? "Make admin" : "Remove admin access",
      makeAdmin
        ? 'Make ' + fullName + ' an admin? They will get full access to the admin dashboard.'
        : 'Remove admin access from ' + fullName + '? They will no longer be able to open the admin dashboard.',
      async function(){
        try {
          var result = await setUserAdminRole(targetUser.id, makeAdmin);
          targetUser.roles = result.roles;
          renderUsers();
          toast(result.isAdmin ? "User promoted to admin" : "Admin access removed");
        } catch (error) {
          console.error("Failed to update role", error);
          toast(error.message || "Unable to update role");
        }
      }
    );
    return;
  }

  if(action === "toggle-ban"){
    var channel = findChannel(el.dataset.channel);
    var item = channel && findItem(channel, el.dataset.kind, el.dataset.id);
    if(!item) return;
    var willBan = item.status !== "banned";
    var title = item.title || item.playlistTitle;
    openConfirm(
      willBan ? "Ban " + el.dataset.kind : "Unban " + el.dataset.kind,
      willBan
        ? 'Ban "' + title + '"? It will be hidden from viewers immediately, but kept on record.'
        : 'Unban "' + title + '"? It will become visible to viewers again.',
      async function(){
        try {
          await setContentBanned(el.dataset.kind, el.dataset.id, willBan);
          item.status = willBan ? "banned" : "active";
          renderChannels();
          toast(willBan ? "Content banned" : "Content unbanned");
        } catch (error) {
          console.error("Failed to update ban status", error);
          toast("Unable to update ban status");
        }
      }
    );
    return;
  }

  if(action === "delete-item"){
    var channel2 = findChannel(el.dataset.channel);
    var item2 = channel2 && findItem(channel2, el.dataset.kind, el.dataset.id);
    if(!item2) return;
    var title2 = item2.title || item2.playlistTitle;
    openConfirm(
      "Delete permanently",
      'Delete "' + title2 + '"? This removes it from storage and can\'t be undone.',
      async function(){
        try {
          await deleteContentItem(el.dataset.kind, el.dataset.id);
          removeItem(channel2, el.dataset.kind, el.dataset.id);
          renderChannels();
          updateStats();
          toast("Deleted permanently");
        } catch (error) {
          console.error("Failed to delete item", error);
          toast("Unable to delete item");
        }
      }
    );
    return;
  }

  if(action === "switch-tab"){
    state.activeTab[el.dataset.channel] = el.dataset.tab;
    renderChannels();
    return;
  }

  if(action === "open-video"){
    var channel3 = findChannel(el.dataset.channel);
    var kind = el.dataset.kind;
    var item3 = channel3 && findItem(channel3, kind, el.dataset.id);
    if(!item3) return;
    if(kind === "video"){
      openPlayer({
        title:item3.title,
        meta:formatCount(item3.views) + " views",
        desc:item3.detailedDescription || item3.videoDescription || "",
        src:item3.videoFile,
        isShort:false
      });
    } else if(kind === "short"){
      openPlayer({
        title:item3.title,
        meta:formatCount(item3.views) + " views · Short",
        desc:"Uploaded by " + (item3.createdBy || channel3.createdBy),
        src:item3.videoUrl,
        isShort:true
      });
    }
    return;
  }

  if(action === "open-playlist"){
    var channel4 = findChannel(el.dataset.channel);
    var item4 = channel4 && findItem(channel4, "playlist", el.dataset.id);
    if(!item4) return;
    openPlaylist(item4);
    return;
  }
});

/* ============================================================
   TOAST
============================================================ */
var toastEl = document.getElementById("toast");
var toastMsg = document.getElementById("toastMsg");
var toastTimer = null;
function toast(msg){
  toastMsg.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toastEl.hidden = true; }, 2600);
}

/* ============================================================
   LIVE "TIME AGO" REFRESH
============================================================ */
setInterval(function(){
  document.querySelectorAll("[data-lastseen]").forEach(function(el){
    el.textContent = formatRelative(Number(el.dataset.lastseen));
  });
}, 30000);

async function guardAdminAccess(){
  try {
    var token = await getAccessToken();
    if(!token){ window.location.replace("Velviora.html"); return false; }
    var response = await fetch("https://valviorabackend2.onrender.com/registered", {
      credentials: "include",
      headers: { Accept: "application/json", Authorization: "Bearer " + token }
    });
    if(!response.ok){ window.location.replace("Velviora.html"); return false; }
    return true;
  } catch (err) {
    window.location.replace("Velviora.html");
    return false;
  }
}

// UX-level gate only; the real boundary is the server-side admin check on /registered.
(async function(){
  var ok = await guardAdminAccess();
  if(!ok) return;
  setupCollapse("usersCollapseBtn", "usersBody");
  setupCollapse("channelsCollapseBtn", "channelsBody");
  renderAll();
  loadRegisteredUsers();
  loadChannels();
  initPresence();
  setInterval(function(){ loadRegisteredUsers(true); }, 8000);
})();
})();

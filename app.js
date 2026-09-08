const app = document.querySelector("#app");
// Keep the chooser mounted while SSE updates re-render the workspace.
const fileInput = document.createElement('input');
fileInput.type = 'file'; fileInput.hidden = true;
document.body.append(fileInput);
fileInput.setAttribute('aria-label', 'Upload local file');
// Dialogs stay mounted across live data refreshes, preserving focus and confirmation state.
const confirmation = document.createElement('dialog');
confirmation.className = 'confirm-sheet';
confirmation.setAttribute('aria-labelledby', 'confirm-title');
document.body.append(confirmation);
function confirmAction(title, description, onConfirm) {
  confirmation.innerHTML = `<form method="dialog"><h2 id="confirm-title">${esc(title)}</h2><p>${esc(description)}</p><div class="actions"><button class="secondary-button" value="cancel" autofocus>Cancel</button><button class="primary-button" value="confirm">Continue</button></div></form>`;
  confirmation.onclose = async () => { if (confirmation.returnValue === 'confirm') try { await onConfirm(); } catch (error) { showToast(error.message); } };
  confirmation.returnValue = ''; confirmation.showModal();
}

const icons = {
  clip: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8.2 12.8 6.7-6.7a3.2 3.2 0 1 1 4.5 4.5l-9.2 9.2a5.1 5.1 0 0 1-7.2-7.2l9.4-9.4"/></svg>`,
  devices: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M10.5 5h3M11.2 18.5h1.6"/></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5.5H5.5V21h13V5.5H16"/><rect x="8" y="2.5" width="8" height="5" rx="1.5"/><path d="M8.5 12h7M8.5 16h5"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 2.5h7l4 4V21H7z"/><path d="M14 2.5v4h4"/></svg>`,
  message: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4v-14Z"/><path d="M8.5 10.5h.1m3.4 0h.1m3.4 0h.1"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5zM10 20h4"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v6M12 7.5h.01"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.8 19 6v5.2c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z"/><path d="m8.7 12.2 2.1 2.1 4.5-4.7"/></svg>`,
  laptop: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5.5h14v9.5H5zM3 18.5h18M8 15l-1.2 3.5M16 15l1.2 3.5"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9Z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6.5 5.5 5.5L9 17.5"/></svg>`,
  dots: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/></svg>`,
};

const defaults = {
  view: "devices",
  theme: "system",
  connected: false,
  archive: true,
  compact: false,
  toast: "",
  clips: [], transfers: [], devices: [], pairing: [], activity: [], notifications: [], messages: [],
  permissions: { clipboard: true, files: true }, loading: true, backendError: '', query: '', showArchive: false,
};

let state = loadState();
let toastTimer;
let renderedView;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("clippy-ui") || "{}");
    return { ...defaults, view: saved.view || 'devices' };
  } catch {
    return { ...defaults };
  }
}

function saveState() {
  try { localStorage.setItem('clippy-ui', JSON.stringify({ view: state.view })); } catch { /* UI remains usable without storage. */ }
}

function resolvedTheme() {
  return state.theme === "system"
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : state.theme;
}

function setTheme() {
  document.documentElement.dataset.theme = resolvedTheme();
  document.documentElement.dataset.density = state.compact ? "compact" : "comfortable";
}

function esc(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function navButton(id, label, icon, optional = false) {
  return `<button class="rail-item ${state.view === id ? "is-active" : ""} ${optional ? "desktop-only" : ""}" data-view="${id}" aria-label="${label}" title="${label}" aria-current="${state.view === id ? "page" : "false"}">${icons[icon]}<span>${label}</span></button>`;
}

function sidebar() {
  return `<aside class="sidebar">
    <div class="window-lights" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="brand-lockup"><span class="brand-icon">${icons.clip}</span><span><strong>Clippy</strong><small>by Venturis Labs</small></span></div>
    <nav class="rail" aria-label="Primary navigation">
      ${navButton("devices", "Devices", "devices")}
      ${navButton("clipboard", "Clipboard", "clipboard")}
      ${navButton("files", "Files", "file")}
      ${navButton("activity", "Activity", "bell", true)}
      ${navButton("messages", "Messages", "message", true)}
      ${navButton("notifications", "Notifications", "bell", true)}
      ${navButton("settings", "Settings", "settings")}
      ${navButton("about", "About", "info", true)}
    </nav>
    <div class="privacy-note"><span>${icons.shield}</span><div><strong>Your workspace, local</strong><p>Clipboard sync with a trusted Android companion. Files stay on this server.</p></div></div>
    <div class="sidebar-footer"><button class="icon-button" data-cycle-theme aria-label="Change appearance">◐</button><span>${resolvedTheme() === 'dark' ? 'Venturis Calm' : 'Frosted Suite'}</span></div>
  </aside>`;
}

function titlebar() {
  return `<div class="titlebar"><span>Clippy by Venturis Labs</span>${statusPill(state.backendError ? 'Backend unavailable' : state.loading ? 'Connecting' : `${nativeDevices().length} Android online`, state.backendError ? 'danger' : 'positive')}</div>`;
}

function nativeDevices() { return state.backendError ? [] : state.devices.filter(d => d.native && d.trusted && d.status === 'connected' && d.capabilities.clipboard?.status === 'supported'); }
function deviceMeta(d) { return d.id === 'local' ? 'Browser-to-server storage' : d.native ? `Android companion · ${d.trusted ? 'Trust approved' : 'Not yet trusted'}` : d.development ? 'Development example · not a physical connection' : `${d.host} · Saved host; not contacted`; }

function androidSyncPanel() {
  const devices = state.devices.filter(d => d.native && d.trusted);
  if (!devices.length) return '';
  return `<section class="glass android-sync" data-android-sync><div class="section-heading"><div><h2>Android connection</h2><p>Your companion, with clear boundaries.</p></div><button class="secondary-button" data-refresh>Check connection</button></div>${devices.map(d => {
    const sync = d.sync || {};
    const live = !state.backendError && d.status === 'connected';
    const label = !live ? 'Sync unavailable' : sync.state === 'permission_required' ? 'Permission required' : sync.state === 'disabled' || sync.state === 'paused' ? 'Sync paused' : sync.serviceRunning ? 'Sync active' : 'Service status unavailable';
    return `<article class="android-sync-device"><span class="row-icon">${icons.devices}</span><div><strong>${esc(d.name)}</strong><div class="pill-row">${statusPill(label, sync.serviceRunning && live ? 'positive' : 'danger')}${statusPill(sync.clipboardAccess === 'locked' ? 'Screen locked · receipt pending' : sync.clipboardAccess === 'restricted' ? 'Background reads restricted' : 'Clipboard access while visible')}</div><small>Foreground service: ${live && sync.serviceRunning ? 'running' : 'not confirmed running'} · Last sync: ${sync.lastSyncAt ? esc(new Date(sync.lastSyncAt).toLocaleString()) : 'not yet acknowledged'}</small><small>${sync.updatedAt ? `Last service report: ${esc(new Date(sync.updatedAt).toLocaleTimeString())}` : 'Open Clippy on Android and enable clipboard sync.'}</small></div></article>`;
  }).join('')}<p class="platform-note">Receiving can continue with the Android activity closed while its foreground service runs. Android 10+ restricts reading other apps’ clipboard changes in the background. Open Clippy on Android to enable or retry sync; a web reconnect cannot start that service. Locked-screen receipts wait for unlock. Android 15+ may pause this service at its background time limit.</p></section>`;
}

function pageHeader(title, subtitle, action = "") {
  return `<header class="page-header"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</header>`;
}

function statusPill(label, tone = "neutral") {
  return `<span class="status ${tone}"><i></i>${label}</span>`;
}

function manualPairing(compact = false) {
  return `<section class="glass manual-pairing ${compact ? "mobile-manual" : ""}">
    <div class="section-copy"><h2>Add Device Manually</h2><p>Save an IP address or hostname. Native connection is unavailable.</p></div>
    <form class="pair-form" data-pair-form><label class="sr-only" for="host-${compact ? "mobile" : "desktop"}">IP address or host</label><input id="host-${compact ? "mobile" : "desktop"}" name="host" autocomplete="off" placeholder="192.168.1.42" required><button class="primary-button" type="submit">Save host</button></form>
    <small>No physical device will be contacted.</small>
  </section>`;
}

function quickAction(title, copy, icon, action) {
  return `<button class="glass quick-card" data-action="${action}"><span class="quick-icon">${icons[icon]}</span><span><strong>${title}</strong><small>${copy}</small></span><span class="chevron">${icons.chevron}</span></button>`;
}

function devicesView() {
  return `<div class="view devices-view content-view">
    ${pageHeader('Device overview', 'Everything nearby, useful together. Your local workspace.', `<button class="primary-button" data-focus-pair>${icons.plus}<span>Add Device</span></button>`)}
    <div class="summary-grid"><section class="glass summary-tile">${icons.shield}<strong>${nativeDevices().length}</strong><span>Android companions online</span></section><section class="glass summary-tile">${icons.clipboard}<strong>${state.clips.length}</strong><span>Clips in your notebook</span></section><section class="glass summary-tile">${icons.file}<strong>${state.transfers.filter(t => t.status === 'uploaded_locally').length}</strong><span>Files stored locally</span></section></div>
    ${androidSyncPanel()}
    <section class="glass device-section"><h2>Your devices</h2>${state.devices.map(d => `<article class="device-row" data-device="${d.id}"><span class="row-icon">${icons[d.kind] || icons.devices}</span><div class="row-copy"><strong>${esc(d.name)}</strong><small>${esc(deviceMeta(d))}</small><div class="actions"><button class="text-button" data-capabilities="${d.id}">Details & capabilities</button>${!d.trusted && !d.native ? `<button class="text-button" data-pair-device="${d.id}">Local trust request</button>` : d.trusted ? `<button class="text-button danger-text" data-revoke="${d.id}">Revoke trust</button>` : ''}</div></div><div class="row-meta">${statusPill(state.backendError ? 'Disconnected' : d.status, !state.backendError && d.status === 'connected' ? 'positive' : ['connecting','pairing'].includes(d.status) ? 'neutral' : 'danger')}${d.id === 'local' ? `<button class="secondary-button" data-connection="${d.status === 'connected' ? 'disconnect' : 'connect'}">${d.status === 'connected' ? 'Disconnect' : 'Reconnect'}</button>` : ''}</div></article>`).join('') || '<div class="empty-state">No saved devices. Add a host or pair your Android companion.</div>'}</section>
    <div class="quick-grid">${quickAction('Clipboard', 'Your local notebook.', 'clipboard', 'clipboard')}${quickAction('Upload file', 'Store files on this server.', 'file', 'pick-file')}</div>
    <div class="pair-grid">${manualPairing()}<section class="glass discovery"><h2>Development discovery</h2><p>No network scan is available. Browse seeded examples only.</p><button class="secondary-button" data-discover>Show development examples</button></section></div>
    ${pairingPanel()}${capabilityPanel()}
  </div>`;
}

function clipboardView() {
  return `<div class="view content-view">${pageHeader("Clipboard", "Your searchable notebook, stored on this server.", `<button class="primary-button" data-add-clip>${icons.plus}<span>New Clip</span></button>`)}
    ${androidSyncPanel()}
    <div class="toolbar"><label class="search-field">${icons.search}<input id="clip-search" type="search" aria-label="Search clipboard history" placeholder="Search clipboard history" value="${esc(state.query)}" data-clip-search></label><button class="secondary-button" data-export="json">Export file</button><button class="secondary-button" data-export="print">Export PDF</button></div>
    <section class="glass sync-notice">${statusPill(nativeDevices().length ? 'Android clipboard available' : 'Android clipboard unavailable', nativeDevices().length ? 'positive' : 'neutral')}<p>${nativeDevices().length ? 'New clips queue for connected companions. Sent means offered, not received. Only an acknowledgement confirms Android receipt.' : 'Pair and open the Android companion to enable device sync. Your local notebook remains available.'}</p>${!state.permissions.clipboard ? '<p class="danger-text">Permission required: enable clipboard in Settings.</p><button class="secondary-button" data-view="settings">Open Settings</button>' : ''}</section>
    <form class="glass clip-editor" data-new-clip><label for="clip-draft">Write a clip</label><textarea id="clip-draft" name="text" maxlength="65536" required></textarea><button class="primary-button" ${!state.permissions.clipboard || state.backendError ? 'disabled' : ''}>Save clip</button></form>
    <section class="glass list-panel"><div class="panel-title"><div><h2>Recent Clips</h2><p>${state.clips.length} items on this server</p></div><button class="secondary-button" data-show-archive>${state.showArchive ? 'Recent' : 'Archive'}</button></div><div data-clip-list>${clipRows(filteredClips())}</div></section>
  </div>`;
}

function clipRows(clips) {
  if (!clips.length) return `<div class="empty-state">No clips match your search.</div>`;
  return clips.map(clip => `<article class="clip-row" data-clip="${clip.id}"><span class="row-icon">${icons.clipboard}</span><div><strong>${esc(clip.text)}</strong><small>${esc(clip.source)} · ${esc(new Date(clip.createdAt).toLocaleString())}</small>${clipReceipts(clip)}<div class="actions"><button class="text-button" data-pin="${clip.id}">${clip.pinned ? 'Unpin' : 'Pin'}</button><button class="text-button" data-archive="${clip.id}">${clip.archived ? 'Restore' : 'Archive'}</button><button class="text-button danger-text" data-delete-clip="${clip.id}">Delete</button>${nativeDevices().filter(d => d.id !== clip.deviceId && !clip.sync?.deliveries?.[d.id]).map(d => `<button class="text-button" data-push="${clip.id}" data-destination="${d.id}" ${!state.permissions.clipboard ? 'disabled' : ''}>Push to ${esc(d.name)}</button>`).join('')}</div></div><button class="icon-button" data-copy="${esc(clip.text)}" aria-label="Copy clip">${icons.clipboard}</button></article>`).join("");
}

function clipReceipts(clip) { return Object.entries(clip.sync?.deliveries || {}).map(([id, delivery]) => `<small class="receipt ${delivery.status === 'acknowledged' ? 'receipt-confirmed' : ''}">${delivery.status === 'acknowledged' ? 'Acknowledged by Android · received' : delivery.offeredAt ? 'Sent to Android · awaiting receipt' : 'Waiting for Android'} · ${esc(state.devices.find(d => d.id === id)?.name || 'Companion')}${delivery.acknowledgedAt ? ` · ${esc(new Date(delivery.acknowledgedAt).toLocaleTimeString())}` : ''}</small>`).join(''); }

function filesView() {
  return `<div class="view content-view">${pageHeader('Files', 'Upload to this server. Native device delivery is unavailable.', `<button class="primary-button" data-pick-file>${icons.plus}<span>Upload file</span></button>`)}
    <section class="glass drop-zone" data-drop-zone><span>${icons.share}</span><h2>Drop a file to upload locally</h2><p>Destination: Local workspace · Maximum ${Math.round((state.maxUploadBytes || 104857600) / 1048576)} MiB</p><button class="secondary-button" data-pick-file>Choose File</button></section>
    <section class="glass list-panel"><div class="panel-title"><h2>Transfers</h2></div>${state.transfers.map(t => `<article class="file-row"><span class="row-icon">${icons.file}</span><div><strong>${esc(t.name)}</strong><small>${t.size} bytes ${t.development ? '· Development example' : ''}</small>${t.error ? `<small class="danger-text">${esc(t.error)}</small>` : ''}${t.status === 'uploading' ? `<progress max="100" value="${uploadProgress.get(t.id) || 0}" aria-label="Upload progress" data-progress="${t.id}"></progress><small>Uploading, then verifying on server</small>` : ''}${t.checksum ? `<small class="checksum">SHA-256: ${esc(t.checksum)}</small>` : ''}<div class="actions">${t.status === 'uploaded_locally' ? `<a class="text-button" href="/api/transfers/${t.id}/download">Download</a>` : ''}${['failed', 'queued'].includes(t.status) ? `<button class="text-button" data-retry="${t.id}">${t.status === 'failed' ? 'Retry' : 'Select file'}</button>` : ''}${['queued', 'uploading'].includes(t.status) ? `<button class="text-button danger-text" data-cancel="${t.id}">Cancel</button>` : ''}</div></div>${statusPill(t.status === 'uploaded_locally' ? 'Uploaded locally' : t.status, t.status === 'uploaded_locally' ? 'positive' : t.status === 'failed' ? 'danger' : 'neutral')}</article>`).join('') || '<p>No uploads yet.</p>'}</section>
  </div>`;
}

function settingsView() {
  return `<div class="view content-view">${pageHeader("Settings", "Plugins, appearance, privacy, and capability controls.")}
    ${androidSyncPanel()}
    <section class="settings-grid">
      <div class="glass settings-card"><h2>Appearance</h2><p>Follow your device or choose a Clippy theme.</p><div class="segmented">${["system", "dark", "light"].map(theme => `<button class="${state.theme === theme ? "is-active" : ""}" data-theme="${theme}">${theme === "dark" ? "Venturis Calm" : theme === "light" ? "Frosted Suite" : "System"}</button>`).join("")}</div></div>
      <div class="glass settings-card"><div class="setting-line"><span><h2>Local archive</h2><p>Allow archiving clips on this server. Existing history is retained.</p></span><button class="toggle ${state.archive ? "is-on" : ""}" data-toggle="archive" role="switch" aria-label="Local archive" aria-checked="${state.archive}"><i></i></button></div><div class="setting-line"><span><h2>Compact layout</h2><p>Show more content on desktop.</p></span><button class="toggle ${state.compact ? "is-on" : ""}" data-toggle="compact" role="switch" aria-label="Compact layout" aria-checked="${state.compact}"><i></i></button></div></div>
      <div class="glass settings-card"><h2>Local permissions</h2><p>Controls access to local backend actions.</p>${['clipboard', 'files'].map(key => `<div class="setting-line"><span>${key}</span><button class="toggle ${state.permissions[key] ? 'is-on' : ''}" role="switch" aria-label="Allow ${key}" aria-checked="${state.permissions[key]}" data-permission="${key}"><i></i></button></div>`).join('')}</div>
      <div class="glass settings-card"><h2>Companions & capabilities</h2><p>Android: receive with the foreground service active; Android 10+ needs Clippy focused to read clipboard changes. iPhone: the web notebook can be added to the Home Screen; native sync is unavailable. File delivery, notification mirroring and SMS are not implemented.</p><button class="secondary-button" data-view="devices">Device capabilities</button></div>
    </section><div class="actions mobile-links">${['activity', 'notifications', 'messages'].map(v => `<button class="secondary-button" data-view="${v}">${v}</button>`).join('')}</div>
  </div>`;
}

function placeholderView(title, message) {
  return `<div class="view content-view">${pageHeader(title, message)}<section class="glass empty-feature"><span>${icons.info}</span><h2>Designed for the next iteration</h2><p>This capability remains intentionally disabled until its transport and privacy behavior are implemented.</p></section></div>`;
}

function currentView() {
  if (state.view === "devices") return devicesView();
  if (state.view === "clipboard") return clipboardView();
  if (state.view === "files") return filesView();
  if (state.view === "settings") return settingsView();
  if (['messages', 'notifications', 'activity'].includes(state.view)) return activityView(state.view);
  return `<div class="view content-view">${pageHeader('About Clippy', 'By Venturis Labs')}<section class="glass settings-card"><h2>Local web v1</h2><p>A local notebook, verified file uploads, and an Android clipboard companion. Development device records are explicitly labeled.</p><p>Pairing uses browser-approved device credentials. Clipboard contents pass through this server; this is not end-to-end encryption. Native discovery, SMS, notification mirroring and file delivery are unavailable. Use only on a trusted development network; workspace authentication is not implemented.</p></section></div>`;
}

function bottomNav() {
  return `<nav class="bottom-nav" aria-label="Primary navigation">${[
    ["devices", "Devices", "devices"], ["clipboard", "Clipboard", "clipboard"], ["files", "Files", "file"], ["settings", "Settings", "settings"],
  ].map(([id, label, icon]) => `<button class="${state.view === id ? "is-active" : ""}" data-view="${id}" aria-label="${label}" aria-current="${state.view === id ? "page" : "false"}">${icons[icon]}<span>${label}</span></button>`).join("")}</nav>`;
}

function render() {
  app.classList.toggle('live-update', renderedView === state.view); renderedView = state.view;
  const previousScroll = app.querySelector('.workspace-scroll')?.scrollTop || 0;
  const focused = document.activeElement;
  const focusId = focused?.id;
  const focusAttributes = focused?.tagName === 'BUTTON' ? [...focused.attributes].filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value]) : [];
  const selection = focused && ['TEXTAREA', 'INPUT'].includes(focused.tagName) ? [focused.selectionStart, focused.selectionEnd] : null;
  const drafts = [...app.querySelectorAll('input:not([type=file]), textarea')].map(el => ({ id: el.id, name: el.name, value: el.value }));
  setTheme();
  app.innerHTML = `<main class="app-shell">${sidebar()}<section class="workspace">${titlebar()}<div class="workspace-scroll">${state.loading ? '<div class="backend-banner" role="status">Loading local backend…</div>' : ''}${state.backendError ? `<div class="backend-banner danger-text" role="alert">Disconnected — ${esc(state.backendError)} <button class="secondary-button" data-refresh>Retry</button></div>` : ''}${currentView()}</div>${bottomNav()}</section></main><div class="toast ${state.toast ? "is-visible" : ""}" role="status">${esc(state.toast)}</div>`;
  for (const draft of drafts) { const el = draft.id ? document.getElementById(draft.id) : [...app.querySelectorAll('input')].find(el => el.name === draft.name && draft.name); if (el) el.value = draft.value; }
  const nextFocus = focusId ? document.getElementById(focusId) : focusAttributes.length ? [...app.querySelectorAll('button')].find(b => focusAttributes.every(([key, value]) => b.getAttribute(key) === value)) : null;
  if (nextFocus) { nextFocus.focus({ preventScroll: true }); if (selection && selection[0] !== null && nextFocus.setSelectionRange) nextFocus.setSelectionRange(...selection); }
  app.querySelector('.workspace-scroll').scrollTop = previousScroll;
  for (const button of app.querySelectorAll('.page-header button')) if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.textContent.trim());
  saveState();
}

function showToast(message) {
  state.toast = message;
  const toast = app.querySelector('.toast'); if (toast) { toast.textContent = message; toast.classList.add('is-visible'); }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = ""; app.querySelector('.toast')?.classList.remove('is-visible'); }, 5000);
}

function openFilePicker(id = null) {
  retryId = id;
  fileInput.value = '';
  fileInput.click();
}

app.addEventListener("submit", async event => {
  const form = event.target.closest("[data-pair-form]");
  event.preventDefault();
  try {
    if (form) { await api('/devices/manual', 'POST', { host: new FormData(form).get('host')?.trim() }); app.querySelector('[data-pair-form]')?.reset(); await refresh(); showToast('Host saved. No device was contacted.'); }
    if (event.target.matches('[data-new-clip]')) { await api('/clipboard', 'POST', { text: new FormData(event.target).get('text') }); const draft = document.getElementById('clip-draft'); if (draft) draft.value = ''; await refresh(); showToast('Clip saved on this server.'); }
  } catch (error) { showToast(error.message); }
});

app.addEventListener("input", event => {
  if (!event.target.matches("[data-clip-search]")) return;
  state.query = event.target.value.toLowerCase();
  app.querySelector("[data-clip-list]").innerHTML = clipRows(filteredClips());
});

fileInput.addEventListener("change", async event => {
  if (!event.target.files.length) return;
  const file = event.target.files[0];
  const id = retryId; retryId = null;
  try { await uploadFile(file, id); } catch (error) { showToast(error.message); }
});

app.addEventListener("click", async event => {
  try {
  const view = event.target.closest("[data-view]");
  if (view) { state.view = view.dataset.view; render(); return; }
  const theme = event.target.closest("button[data-theme]");
  if (theme) { await api('/settings', 'PATCH', { theme: theme.dataset.theme }); await refresh(); return; }
  const toggle = event.target.closest("[data-toggle]");
  if (toggle) { await api('/settings', 'PATCH', { [toggle.dataset.toggle]: !state[toggle.dataset.toggle] }); await refresh(); return; }
  if (event.target.closest("[data-focus-pair]")) { app.querySelector("[data-pair-form] input")?.focus(); return; }
  if (event.target.closest("[data-pick-file], [data-action='pick-file']")) { openFilePicker(); return; }
  if (event.target.closest("[data-action='clipboard']")) { state.view = "clipboard"; render(); return; }
  const toast = event.target.closest("[data-toast]");
  if (toast) { showToast(toast.dataset.toast); return; }
  if (event.target.closest("[data-add-clip]")) { document.getElementById('clip-draft')?.focus(); return; }
  const copy = event.target.closest("[data-copy]");
  if (copy) { if (!navigator.clipboard) throw new Error('Clipboard access is unavailable. Use a secure browser context.'); await navigator.clipboard.writeText(copy.dataset.copy); showToast("Copied to this device."); return; }
  const exportButton = event.target.closest("[data-export]");
  if (exportButton?.dataset.export === "print") { window.print(); return; }
  if (exportButton) {
    const response = await fetch('/api/clipboard/export'); if (!response.ok) throw new Error('Export failed.'); const blob = await response.blob();
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "clippy-clipboard.json" });
    link.click(); URL.revokeObjectURL(link.href); showToast("Clipboard archive exported."); return;
  }
  if (event.target.closest("[data-cycle-theme]")) { await api('/settings', 'PATCH', { theme: state.theme === 'system' ? 'dark' : state.theme === 'dark' ? 'light' : 'system' }); await refresh(); }
  if (event.target.closest('[data-refresh]')) await refresh();
  if (event.target.closest('[data-discover]')) { const response = await api('/devices/discover', 'POST', {}); showToast(response.message); }
  if (event.target.closest('[data-show-archive]')) { state.showArchive = !state.showArchive; render(); }
  const button = event.target.closest('button');
  if (!button) return;
  const d = button.dataset;
  if (d.capabilities) { state.selectedDevice = d.capabilities; state.capabilities = (await api(`/devices/${d.capabilities}/capabilities`)).data; render(); document.getElementById('capability-panel')?.scrollIntoView({ block: 'nearest' }); }
  if (d.connection) { await api(`/devices/local/${d.connection}`, 'POST', {}); await refresh(); }
  if (d.revoke) confirmAction('Revoke trust?', 'This device will lose authorization and must pair again.', async () => { await api(`/devices/${d.revoke}/revoke-trust`, 'POST', {}); await refresh(); showToast('Trust revoked.'); });
  if (d.pairDevice) { await api('/pairing/requests', 'POST', { deviceId: d.pairDevice }); await refresh(); }
  if (d.approve) { const code = document.getElementById(`code-${d.approve}`).value; await api(`/pairing/${d.approve}/approve`, 'POST', { code }); await refresh(); showToast('Trust approved for this workspace.'); }
  if (d.reject) { await api(`/pairing/${d.reject}/reject`, 'POST', {}); await refresh(); }
  for (const [key, field] of [['pin', 'pinned'], ['archive', 'archived']]) if (d[key]) { const clip = state.clips.find(c => c.id === d[key]); await api(`/clipboard/${clip.id}`, 'PATCH', { [field]: !clip[field] }); await refresh(); }
  if (d.deleteClip) confirmAction('Delete this clip?', 'This removes the notebook item from this server. It does not erase copies already on other devices.', async () => { await api(`/clipboard/${d.deleteClip}`, 'DELETE'); await refresh(); showToast('Clip deleted.'); });
  if (d.push) { await api(`/clipboard/${d.push}/push`, 'POST', { deviceId: d.destination }); await refresh(); showToast('Queued for Android. Waiting for acknowledgement.'); }
  if (d.retry) { openFilePicker(d.retry); }
  if (d.cancel) { await api(`/transfers/${d.cancel}/cancel`, 'POST', {}); activeUploads.get(d.cancel)?.abort(); await refresh(); }
  if (d.read) { await api(`/activity/${d.read}/read`, 'POST', {}); await refresh(); }
  if ('readAll' in d) { await api('/activity/mark-all-read', 'POST', {}); await refresh(); }
  if (d.permission) { await api('/settings', 'PATCH', { permissions: { [d.permission]: !state.permissions[d.permission] } }); await refresh(); }
  } catch (error) { showToast(error.message); }
});

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (state.theme === "system") { setTheme(); render(); } });

if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
const activeUploads = new Map();
const uploadProgress = new Map();
let retryId = null;
let refreshing = null;
async function api(path, method = 'GET', body) {
  const response = await fetch(`/api${path}`, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 204) return {};
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Backend request failed.');
  return result;
}
async function refresh() {
  if (refreshing) { await refreshing; return refresh(); }
  refreshing = (async () => {
    try {
      const paths = ['devices', 'pairing/requests', 'clipboard', 'transfers', 'activity', 'notifications', 'messages', 'settings'];
      const values = await Promise.all(paths.map(path => api(`/${path}`)));
      ['devices', 'pairing', 'clips', 'transfers', 'activity', 'notifications', 'messages'].forEach((key, i) => state[key] = values[i].data);
      Object.assign(state, values[7].data);
      if (state.selectedDevice) state.capabilities = (await api(`/devices/${state.selectedDevice}/capabilities`)).data;
      state.connected = state.devices.find(d => d.id === 'local')?.status === 'connected'; state.backendError = '';
    } catch { state.backendError = 'Local backend unavailable. Your last loaded data may be stale.'; state.connected = false; }
    finally { state.loading = false; render(); }
  })();
  try { await refreshing; } finally { refreshing = null; }
}
function filteredClips() { return state.clips.filter(c => c.archived === state.showArchive && `${c.text} ${c.source}`.toLowerCase().includes(state.query)).sort((a, b) => Number(b.pinned) - Number(a.pinned)); }
function pairingPanel() {
  return `<section class="glass device-section"><h2>Pairing & trust</h2><p>Approve only devices you recognize. Enter the code shown by your Android companion. Seeded requests remain development examples.</p>${state.pairing.map(p => `<div class="pair-request" data-pairing="${p.id}"><strong>${esc(state.devices.find(d => d.id === p.deviceId)?.name || p.deviceId)}</strong> ${statusPill(p.status)}${p.development ? '<small>Development example · no physical-device verification</small>' : '<small>Android companion · browser approval required</small>'}${p.status === 'pending' ? `<p>${p.development ? `Example code: <b>${esc(p.code)}</b> · ` : ''}Expires ${esc(new Date(p.expiresAt).toLocaleTimeString())}</p><label for="code-${p.id}">${p.development ? 'Enter the example code' : 'Code shown on Android'}</label><input id="code-${p.id}" maxlength="4" inputmode="numeric" autocomplete="off"><div class="actions"><button class="primary-button" data-approve="${p.id}">Approve and trust</button><button class="secondary-button" data-reject="${p.id}">Reject</button></div>` : ''}</div>`).join('') || '<div class="empty-state">No pairing requests. Enter this server’s full URL in the Android companion to begin.</div>'}</section>`;
}
function capabilityPanel() {
  if (!state.capabilities) return '';
  const device = state.devices.find(d => d.id === state.selectedDevice);
  return `<section class="glass device-section" id="capability-panel"><h2>Device detail · ${esc(device?.name || '')}</h2><p>${device ? esc(deviceMeta(device)) : ''}</p>${device?.lastSeenAt ? `<p>Last contact: ${esc(new Date(device.lastSeenAt).toLocaleString())}</p>` : ''}<h3>Capabilities</h3>${Object.entries(state.capabilities).map(([key, cap]) => `<div class="setting-line"><span><strong>${esc(key)}</strong><small>${esc(cap.reason)}</small></span>${statusPill(cap.status === 'permissionRequired' ? 'Permission required' : cap.status, cap.status === 'supported' ? 'positive' : 'neutral')}</div>`).join('')}</section>`;
}
function activityView(view) {
  return `<div class="view content-view">${pageHeader(view === 'activity' ? 'Activity center' : view === 'messages' ? 'Messages' : 'Notifications', 'Local records. Native notification capture and SMS delivery are unavailable.')}<div class="actions">${['activity', 'notifications', 'messages'].map(v => `<button class="secondary-button" data-view="${v}">${v}</button>`).join('')}${view === 'activity' ? '<button class="secondary-button" data-read-all>Mark all read</button>' : ''}</div><section class="glass list-panel">${state[view].map(item => `<article class="clip-row"><span class="row-icon">${icons[view === 'messages' ? 'message' : 'bell']}</span><div><strong>${esc(item.text)}</strong><small>${esc(new Date(item.createdAt).toLocaleString())}</small></div>${view === 'activity' && !item.read ? `<button class="secondary-button" data-read="${item.id}">Mark read</button>` : ''}</article>`).join('') || '<div class="empty-state">Nothing here yet.</div>'}</section></div>`;
}
async function uploadFile(file, id) {
  let transfer;
  if (id) {
    transfer = (await api(`/transfers/${id}`)).data;
    if (file.size !== transfer.size || file.name !== transfer.name) throw new Error('Reselect the original file with the same name and size, or start a new upload.');
    if (transfer.status === 'failed') transfer = (await api(`/transfers/${id}/retry`, 'POST', {})).data;
  } else transfer = (await api('/transfers', 'POST', { name: file.name, size: file.size, deviceId: 'local' })).data;
  state.view = 'files'; await refresh();
  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(); activeUploads.set(transfer.id, xhr);
      xhr.open('POST', `/api/transfers/${transfer.id}/upload`);
      xhr.upload.onprogress = event => { const percent = event.lengthComputable ? Math.round(event.loaded / event.total * 100) : 0; uploadProgress.set(transfer.id, percent); const progress = app.querySelector(`[data-progress="${transfer.id}"]`); if (progress) progress.value = percent; };
      xhr.onload = () => { let result; try { result = JSON.parse(xhr.responseText); } catch { reject(new Error('Invalid upload response.')); return; } if (xhr.status >= 200 && xhr.status < 300) resolve(result); else reject(new Error(result.error?.message || 'Upload failed.')); };
      xhr.onerror = () => reject(new Error('Upload interrupted. Retry when the backend is available.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));
      const form = new FormData(); form.append('file', file); xhr.send(form);
    });
    showToast('Uploaded locally. No device delivery occurred.');
  } finally { activeUploads.delete(transfer.id); uploadProgress.delete(transfer.id); await refresh(); }
}
app.addEventListener('dragover', event => { if (event.target.closest('[data-drop-zone]')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } });
app.addEventListener('drop', async event => { if (!event.target.closest('[data-drop-zone]')) return; event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) try { await uploadFile(file); } catch (error) { showToast(error.message); } });
window.addEventListener('offline', () => { state.backendError = 'Browser is offline.'; state.connected = false; render(); });
window.addEventListener('online', () => refresh());
render(); refresh();
api('/health').then(result => state.maxUploadBytes = result.maxUploadBytes).catch(() => {});
const events = new EventSource('/api/events');
let eventTimer;
for (const type of ['device.updated', 'pairing.updated', 'clipboard.updated', 'transfer.updated', 'activity.created', 'permission.updated']) events.addEventListener(type, () => { clearTimeout(eventTimer); eventTimer = setTimeout(refresh, 80); });
events.onopen = () => refresh();
events.onerror = () => { state.backendError = 'Live connection interrupted. Reconnecting…'; state.connected = false; render(); };
// Expire stale device/service presence even if a companion silently loses its network.
setInterval(() => { if (!document.hidden) refresh(); }, 15000);

const app = document.querySelector("#app");

const state = {
  theme: "system",
  tab: "devices",
  connected: true,
  discovery: true,
  relay: true,
  archive: true,
  selectedDevice: "macbook",
  manualHost: "192.168.1.42",
  manualPort: "1716",
  note: "Keep this note visible across devices.",
};

const devices = [
  { id: "macbook", name: "MacBook Air", status: "Connected", detail: "Local LAN · Verified" },
  { id: "iphone", name: "iPhone 15 Pro", status: "Manual IP", detail: "192.168.1.42" },
  { id: "tablet", name: "iPad mini", status: "Relay", detail: "Fallback ready" },
];

const clipboard = [
  { text: "Venturis Lab launch notes", meta: "Project note" },
  { text: "https://clippy.venturis.app/join/MTK7", meta: "Link" },
  { text: "OTP ••••••", meta: "Sensitive" },
];

const tabs = [
  { key: "devices", label: "Devices", icon: "devices" },
  { key: "clipboard", label: "Clipboard", icon: "clipboard" },
  { key: "settings", label: "Settings", icon: "settings" },
];

const iconPaths = {
  devices: '<path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/>',
  clipboard: '<path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/>',
  settings: '<path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0-5v2M12 18.5v2M5.2 6.2l1.4 1.4M17.4 18.4l1.4 1.4M3.5 12h2M18.5 12h2M5.2 17.8l1.4-1.4M17.4 5.6l1.4-1.4"/>',
  search: '<circle cx="11" cy="11" r="5.5"/><path d="M15.5 15.5 19 19"/>',
  chevron: '<path d="M9 6.5 14.5 12 9 17.5"/>',
  wifi: '<path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.5a7 7 0 0 1 9 0"/><path d="M10.5 15.5a3 3 0 0 1 3 0"/><circle cx="12" cy="18" r="1"/>',
  warning: '<path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/>',
  check: '<path d="M5.5 11.5 9.5 15.5 18.5 6.5"/>',
  note: '<path d="M7 5.5h7l3 3V18H7z"/><path d="M10 10.5h4M10 13.5h4"/>',
  export: '<path d="M12 6v8"/><path d="m8.5 9.5 3.5-3.5 3.5 3.5"/><path d="M6.5 15.5h11"/>',
  puzzle: '<path d="M8.5 6h2a2 2 0 1 1 3 0h2.5v3a2 2 0 1 1 0 3V15H13a2 2 0 1 1-4 0H6V12.5a2 2 0 1 1 0-3V6Z"/>',
  shield: '<path d="M12 4.5 18 7v5c0 4-2.8 6.8-6 8.5C8.8 18.8 6 16 6 12V7Z"/><path d="M9.5 12.2 11.4 14 14.8 10.2"/>',
  device: '<path d="M8 5.5h8a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 16 18.5H8A1.5 1.5 0 0 1 6.5 17V7A1.5 1.5 0 0 1 8 5.5Z"/><path d="M10 16h4"/>',
  link: '<path d="M10 14 14 10"/><path d="M8 6.8H6.5a3.5 3.5 0 0 0 0 7H8"/><path d="M16 17.2h1.5a3.5 3.5 0 0 0 0-7H16"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
}

function themeLabel() {
  if (state.theme === "light") return "Frosted Suite";
  if (state.theme === "dark") return "Venturis Calm";
  return "System";
}

function statusText() {
  if (!state.connected) return "Disconnected";
  return state.relay ? "Connected" : "Connected";
}

function statusTone() {
  if (!state.connected) return "danger";
  return "success";
}

function deviceTone(device) {
  if (device.id === "macbook") return "success";
  if (device.id === "iphone") return "info";
  return "warning";
}

function renderHeader() {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">${icon("devices")}</div>
        <div>
          <p>Venturis Lab</p>
          <strong>Clippy</strong>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="theme-switch ${state.theme === "system" ? "active" : ""}" data-theme="system">System</button>
        <button class="theme-switch ${state.theme === "dark" ? "active" : ""}" data-theme="dark">Calm</button>
        <button class="theme-switch ${state.theme === "light" ? "active" : ""}" data-theme="light">Frosted</button>
      </div>
    </header>
  `;
}

function renderStatus() {
  return `
    <div class="status-row">
      <span class="status-pill ${statusTone()}">${statusText()}</span>
      <span class="status-pill">${state.discovery ? "Discovery on" : "Discovery off"}</span>
      <span class="status-pill">${state.relay ? "Relay ready" : "Relay off"}</span>
      <span class="status-pill">${themeLabel()}</span>
    </div>
  `;
}

function renderDevices() {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Devices</p>
          <h2>Small list. Clear states. Calm spacing.</h2>
        </div>
        <span class="mini-pill ${statusTone()}">${statusText()}</span>
      </div>
      <div class="search-row">
        ${icon("search")}
        <input class="search" placeholder="Search a device or setting" />
      </div>
      <div class="device-list">
        ${devices
          .map(
            (device) => `
              <button class="device-row ${state.selectedDevice === device.id ? "active" : ""}" data-device="${device.id}">
                <div class="device-icon ${deviceTone(device)}">${icon(device.id === "iphone" ? "link" : device.id === "tablet" ? "warning" : "check")}</div>
                <div class="device-copy">
                  <strong>${device.name}</strong>
                  <span>${device.detail}</span>
                </div>
                <span class="mini-pill ${deviceTone(device)}">${device.status}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderConnection() {
  const connected = devices.find((device) => device.id === state.selectedDevice) || devices[0];
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Connection</p>
          <h2>${state.connected ? "Connected" : "Disconnected"}</h2>
        </div>
        <span class="mini-pill ${state.connected ? "success" : "danger"}">${state.connected ? "Live" : "Red state"}</span>
      </div>
      <p class="section-copy">
        ${state.connected ? "The app stays simple: one visible connection, one manual fallback, and no clutter." : "Disconnected is explicit so the state is never hidden."}
      </p>
      <div class="split-actions">
        <button class="sheet-button">Ping</button>
        <button class="sheet-button">Push clipboard</button>
        <button class="sheet-button">Send file</button>
      </div>
      <div class="meta-grid">
        <div><span>Device</span><strong>${connected.name}</strong></div>
        <div><span>Manual host</span><strong>${state.manualHost}</strong></div>
        <div><span>Transport</span><strong>${state.discovery ? "LAN first" : "Manual first"}</strong></div>
      </div>
    </section>
  `;
}

function renderManualAdd() {
  return `
    <section class="section-card soft">
      <div class="section-head">
        <div>
          <p class="section-kicker">Manual IP</p>
          <h2>When discovery fails, add the host simply.</h2>
        </div>
        <span class="mini-pill info">Fallback</span>
      </div>
      <div class="manual-grid">
        <input class="field" data-field="host" value="${state.manualHost}" />
        <input class="field short" data-field="port" value="${state.manualPort}" />
        <button class="primary" data-action="manual-pair">Add host</button>
      </div>
    </section>
  `;
}

function renderClipboard() {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Clipboard</p>
          <h2>A quiet notebook for your clips.</h2>
        </div>
        <span class="mini-pill ${state.archive ? "success" : "warning"}">${state.archive ? "Stored locally" : "Archive off"}</span>
      </div>
      <textarea class="note-field" data-field="note">${state.note}</textarea>
      <div class="sheet-actions">
        <button class="ghost" data-action="toggle-archive">${state.archive ? "Local archive on" : "Store locally"}</button>
        <button class="ghost">Export file</button>
        <button class="primary">Export PDF</button>
      </div>
      <div class="clip-list">
        ${clipboard
          .map(
            (item) => `
              <article class="clip-row">
                <strong>${item.text}</strong>
                <span>${item.meta}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Settings</p>
          <h2>Plugins, preferences, and permissions.</h2>
        </div>
        <span class="mini-pill">Hub</span>
      </div>
      <div class="settings-list">
        <div class="setting-row"><span>${icon("puzzle")}Plugins</span><small>Clipboard, ping, files, remote input</small></div>
        <div class="setting-row"><span>${icon("shield")}Permissions</span><small>Local network, clipboard, foreground actions</small></div>
        <div class="setting-row"><span>${icon("device")}Distribution</span><small>AltStore, SideStore, Xcode, web companion</small></div>
      </div>
    </section>
  `;
}

function renderTabs() {
  return `
    <nav class="dock" aria-label="Main navigation">
      ${tabs
        .map(
          (tab) => `
            <button class="dock-item ${state.tab === tab.key ? "active" : ""}" data-tab="${tab.key}">
              ${icon(tab.icon)}
              <span>${tab.label}</span>
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderMain() {
  const devicePane = `
    <section class="hero-card ${state.connected ? "" : "danger"}">
      <div class="hero-copy">
        <p class="eyebrow">Clippy by Venturis Lab</p>
        <h1>${state.connected ? "Simple, calm, and device-first." : "Disconnected in red."}</h1>
        <p>
          A quieter product direction with generous spacing, clear states, and iOS-style structure for both desktop and phone.
        </p>
      </div>
      <div class="hero-badge">${icon(state.connected ? "wifi" : "warning")} <span>${state.connected ? "Connected" : "Disconnected"}</span></div>
    </section>
    ${renderConnection()}
    ${renderManualAdd()}
  `;

  const clipboardPane = `
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Clipboard</p>
        <h1>Notebook, not clutter.</h1>
        <p>Store clips locally, export them, and keep the surface calm.</p>
      </div>
    </section>
    ${renderClipboard()}
  `;

  const settingsPane = `
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Settings</p>
        <h1>One hub for the app.</h1>
        <p>Plugins, preferences, themes, and platform notes stay together.</p>
      </div>
    </section>
    ${renderSettings()}
  `;

  const content =
    state.tab === "clipboard" ? clipboardPane : state.tab === "settings" ? settingsPane : devicePane;

  return `
    <main class="layout">
      <aside class="panel sidebar">
        ${renderDevices()}
      </aside>
      <section class="panel detail">
        ${content}
      </section>
    </main>
  `;
}

function root() {
  return `
    <div class="canvas">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>
      <div class="shell">
        ${renderHeader()}
        ${renderStatus()}
        ${renderMain()}
        ${renderTabs()}
      </div>
    </div>
  `;
}

function setTheme() {
  const resolved = state.theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : state.theme;
  document.documentElement.dataset.theme = resolved;
}

function persist() {
  try {
    localStorage.setItem("clippy-state", JSON.stringify(state));
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem("clippy-state");
    if (!raw) return;
    Object.assign(state, JSON.parse(raw));
  } catch {}
}

function render() {
  setTheme();
  app.innerHTML = root();
  persist();
}

restore();
render();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") setTheme();
});

app.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) {
    state.tab = tab.dataset.tab;
    render();
    return;
  }

  const theme = event.target.closest("[data-theme]");
  if (theme) {
    state.theme = theme.dataset.theme;
    render();
    return;
  }

  const device = event.target.closest("[data-device]");
  if (device) {
    state.selectedDevice = device.dataset.device;
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "toggle-archive") {
    state.archive = !state.archive;
    render();
  }
  if (action?.dataset.action === "manual-pair") {
    state.connected = true;
    state.tab = "devices";
    render();
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (target.dataset.field === "host") state.manualHost = target.value.trim() || state.manualHost;
  if (target.dataset.field === "port") state.manualPort = target.value.trim() || state.manualPort;
  if (target.dataset.field === "note") state.note = target.value;
});


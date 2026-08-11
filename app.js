const app = document.querySelector("#app");

const state = {
  theme: "system",
  tab: "devices",
  connected: true,
  connectedMode: "local",
  manualHost: "192.168.1.42",
  manualPort: "1716",
  note: "Keep this note visible across devices.",
};

const tabs = [
  { key: "devices", label: "Devices", icon: "devices" },
  { key: "clipboard", label: "Clipboard", icon: "clipboard" },
  { key: "settings", label: "Settings", icon: "settings" },
];

const deviceRows = [
  { name: "Venturis-MacBook", status: "Local LAN", tone: "success" },
  { name: "Pixel 7", status: "Relay fallback", tone: "warning" },
  { name: "Clipboard inbox", status: "Recent clips", tone: "neutral" },
];

const clipRows = [
  { name: "Venturis Lab launch notes", meta: "Project note" },
  { name: "https://clippy.venturis.app/join/MTK7", meta: "Link" },
  { name: "OTP ••••••", meta: "Sensitive" },
];

function icon(name) {
  const map = {
    devices: '<path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/>',
    clipboard: '<path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/>',
    settings: '<path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0-5v2M12 18.5v2M5.2 6.2l1.4 1.4M17.4 18.4l1.4 1.4M3.5 12h2M18.5 12h2M5.2 17.8l1.4-1.4M17.4 5.6l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="5.5"/><path d="M15.5 15.5 19 19"/>',
    chevron: '<path d="M9 6.5 14.5 12 9 17.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wifi: '<path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.5a7 7 0 0 1 9 0"/><path d="M10.5 15.5a3 3 0 0 1 3 0"/><circle cx="12" cy="18" r="1"/>',
    warning: '<path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/>',
    check: '<path d="M5.5 11.5 9.5 15.5 18.5 6.5"/>',
    note: '<path d="M7 5.5h7l3 3V18H7z"/><path d="M10 10.5h4M10 13.5h4"/>',
    export: '<path d="M12 6v8"/><path d="m8.5 9.5 3.5-3.5 3.5 3.5"/><path d="M6.5 15.5h11"/>',
    lock: '<rect x="6.5" y="10" width="11" height="8" rx="2"/><path d="M9 10V8a3 3 0 0 1 6 0v2"/>',
    link: '<path d="M10 14 14 10"/><path d="M8 6.8H6.5a3.5 3.5 0 0 0 0 7H8"/><path d="M16 17.2h1.5a3.5 3.5 0 0 0 0-7H16"/>',
    puzzle: '<path d="M8.5 6h2a2 2 0 1 1 3 0h2.5v3a2 2 0 1 1 0 3V15H13a2 2 0 1 1-4 0H6V12.5a2 2 0 1 1 0-3V6Z"/>',
    shield: '<path d="M12 4.5 18 7v5c0 4-2.8 6.8-6 8.5C8.8 18.8 6 16 6 12V7Z"/><path d="M9.5 12.2 11.4 14 14.8 10.2"/>',
    device: '<path d="M8 5.5h8a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 16 18.5H8A1.5 1.5 0 0 1 6.5 17V7A1.5 1.5 0 0 1 8 5.5Z"/><path d="M10 16h4"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${map[name]}</svg>`;
}

function themeLabel() {
  return state.theme === "system" ? "System" : state.theme === "dark" ? "Venturis Calm" : "Frosted Suite";
}

function themeResolved() {
  if (state.theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return state.theme;
}

function applyTheme() {
  document.documentElement.dataset.theme = themeResolved();
}

function statusLabel() {
  return state.connected ? "Connected" : "Disconnected";
}

function statusTone() {
  return state.connected ? "success" : "danger";
}

function renderTopBar() {
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

function renderDeviceScreen() {
  return `
    <section class="phone-card">
      <div class="phone-top">
        <h1>Devices</h1>
        <button class="pill-button" aria-label="Add device">${icon("plus")}</button>
      </div>
      <p class="subtitle">The app should collapse cleanly into a single-column device view with sticky actions and no hidden controls.</p>

      <div class="manual-card">
        <div>
          <strong>Add device manually</strong>
          <span>Enter the IP shown on the other device.</span>
        </div>
        <button class="connect-button" data-action="manual-connect">Connect</button>
      </div>

      <div class="device-list">
        ${deviceRows
          .map(
            (row) => `
              <button class="device-item ${row.tone}" data-row="${row.name}">
                <strong>${row.name}</strong>
                <span>${row.status}</span>
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="bottom-tabbar">
        ${tabs
          .map(
            (tab) => `
              <button class="tab-item ${state.tab === tab.key ? "active" : ""}" data-tab="${tab.key}">
                ${icon(tab.icon)}
                <span>${tab.label}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderClipboardScreen() {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Clipboard</p>
          <h2>Notebook-style clips.</h2>
        </div>
        <span class="mini-pill success">Stored locally</span>
      </div>
      <textarea class="note-field" data-field="note">${state.note}</textarea>
      <div class="sheet-actions">
        <button class="ghost" data-action="archive">${state.connected ? "Archive on" : "Archive off"}</button>
        <button class="ghost">Export file</button>
        <button class="primary">Export PDF</button>
      </div>
      <div class="clip-list">
        ${clipRows
          .map(
            (item) => `
              <article class="clip-item">
                <strong>${item.name}</strong>
                <span>${item.meta}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSettingsScreen() {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Settings</p>
          <h2>One hub for the app.</h2>
        </div>
        <span class="mini-pill">${themeLabel()}</span>
      </div>

      <div class="settings-list">
        <div class="setting-row">
          <span>${icon("puzzle")}Plugins</span>
          <small>Clipboard, ping, files, remote input.</small>
        </div>
        <div class="setting-row">
          <span>${icon("shield")}Permissions</span>
          <small>Local network, clipboard, foreground actions.</small>
        </div>
        <div class="setting-row">
          <span>${icon("device")}Distribution</span>
          <small>AltStore, SideStore, Xcode, web companion.</small>
        </div>
      </div>
    </section>
  `;
}

function renderContent() {
  if (state.tab === "clipboard") return renderClipboardScreen();
  if (state.tab === "settings") return renderSettingsScreen();
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Devices</p>
          <h2>Single-column device view.</h2>
        </div>
        <span class="mini-pill ${statusTone()}">${statusLabel()}</span>
      </div>
      <p class="section-copy">Keep the layout simple enough that the user always knows where they are.</p>
      ${renderDeviceScreen()}
    </section>
  `;
}

function root() {
  return `
    <div class="canvas">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>
      <div class="shell">
        ${renderTopBar()}
        <div class="status-row">
          <span class="status-pill ${statusTone()}">${statusLabel()}</span>
          <span class="status-pill">${state.connectedMode === "local" ? "Local LAN" : "Manual IP"}</span>
          <span class="status-pill">${themeLabel()}</span>
        </div>
        <main class="stage">
          ${renderContent()}
        </main>
      </div>
    </div>
  `;
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
  applyTheme();
  app.innerHTML = root();
  persist();
}

restore();
render();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
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

  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "manual-connect") {
    state.connected = true;
    state.connectedMode = "manual";
    render();
  }

  if (action?.dataset.action === "archive") {
    state.connected = !state.connected;
    render();
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (target.dataset.field === "note") state.note = target.value;
});


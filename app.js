const app = document.querySelector("#app");

const tabs = [
  { key: "devices", label: "Devices", icon: "devices" },
  { key: "clipboard", label: "Clipboard", icon: "clipboard" },
  { key: "files", label: "Files", icon: "files" },
  { key: "settings", label: "Settings", icon: "settings" },
];

const devices = [
  {
    id: "macbook",
    name: "MacBook Air",
    detail: "Connected · Local LAN · 192.168.1.71",
    note: "Clipboard, files, ping, and remote input are live.",
    tone: "success",
    badge: "Connected",
  },
  {
    id: "iphone",
    name: "iPhone 15 Pro",
    detail: "Manual host · 192.168.1.42",
    note: "Foreground-only clipboard and file actions.",
    tone: "info",
    badge: "Manual IP",
  },
  {
    id: "tablet",
    name: "iPad mini",
    detail: "Remembered · Relay fallback ready",
    note: "Encrypted fallback path when LAN discovery is blocked.",
    tone: "warning",
    badge: "Relay",
  },
];

const clipboardHistory = [
  {
    content: "Venturis Lab launch notes — tighten spacing, soften corners, keep large titles.",
    source: "MacBook Air",
    time: "18s ago",
    tag: "Project note",
  },
  {
    content: "https://clippy.venturis.app/join/MTK7",
    source: "iPhone 15 Pro",
    time: "3m ago",
    tag: "Link",
  },
  {
    content: "OTP ••••••",
    source: "iPad mini",
    time: "12m ago",
    tag: "Sensitive",
  },
];

const transfers = [
  {
    title: "Quarterly deck.pdf",
    meta: "52 MB · 84% complete",
    status: "Sending to iPhone 15 Pro",
    tone: "success",
  },
  {
    title: "IMG_8291.heic",
    meta: "13 MB · queued",
    status: "Waiting for foreground return",
    tone: "warning",
  },
  {
    title: "release-build.zip",
    meta: "218 MB · relay fallback",
    status: "Delivered to MacBook Air",
    tone: "neutral",
  },
];

const settingsRows = [
  {
    title: "Plugins",
    subtitle: "Clipboard, ping, files, find device, and remote input.",
    icon: "puzzle",
  },
  {
    title: "Style modes",
    subtitle: "Venturis Calm for dark, Frosted Suite for light, or System.",
    icon: "paint",
  },
  {
    title: "Permissions",
    subtitle: "Location, local network, clipboard, and foreground actions.",
    icon: "shield",
  },
  {
    title: "Distribution",
    subtitle: "AltStore, SideStore, direct Xcode install, and web companion.",
    icon: "device",
  },
];

const state = {
  activeTab: "devices",
  connection: "connected",
  discovery: true,
  relay: true,
  archive: true,
  theme: "system",
  manualHost: "192.168.1.42",
  manualPort: "1716",
  clipboardNote: "Keep this note visible across devices.",
  selectedDevice: "macbook",
};

function readStoredState() {
  try {
    const raw = localStorage.getItem("clippy-state");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch {}
}

function persistState() {
  try {
    localStorage.setItem("clippy-state", JSON.stringify({
      activeTab: state.activeTab,
      connection: state.connection,
      discovery: state.discovery,
      relay: state.relay,
      archive: state.archive,
      theme: state.theme,
      manualHost: state.manualHost,
      manualPort: state.manualPort,
      clipboardNote: state.clipboardNote,
      selectedDevice: state.selectedDevice,
    }));
  } catch {}
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolvedTheme() {
  return state.theme === "system" ? systemTheme() : state.theme;
}

function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme();
  document.documentElement.dataset.style = resolvedTheme() === "dark" ? "venturis" : "frosted";
}

function icon(name) {
  const icons = {
    devices: '<path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/>',
    clipboard: '<path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/>',
    files: '<path d="M5.5 6.5h7l2 2.5h4V18h-13z"/><path d="M8 11h6M8 14h6"/>',
    settings: '<path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0-5v2M12 18.5v2M5.2 6.2l1.4 1.4M17.4 18.4l1.4 1.4M3.5 12h2M18.5 12h2M5.2 17.8l1.4-1.4M17.4 5.6l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="5.5"/><path d="M15.5 15.5 19 19"/>',
    wifi: '<path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.5a7 7 0 0 1 9 0"/><path d="M10.5 15.5a3 3 0 0 1 3 0"/><circle cx="12" cy="18" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="M9 6.5 14.5 12 9 17.5"/>',
    check: '<path d="M5.5 11.5 9.5 15.5 18.5 6.5"/>',
    warning: '<path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/>',
    cloud: '<path d="M9 18h7a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 6 11.7 3 3 0 0 0 9 18Z"/>',
    lock: '<rect x="6.5" y="10" width="11" height="8" rx="2"/><path d="M9 10V8a3 3 0 0 1 6 0v2"/>',
    link: '<path d="M10 14 14 10"/><path d="M8 6.8H6.5a3.5 3.5 0 0 0 0 7H8"/><path d="M16 17.2h1.5a3.5 3.5 0 0 0 0-7H16"/>',
    puzzle: '<path d="M8.5 6h2a2 2 0 1 1 3 0h2.5v3a2 2 0 1 1 0 3V15H13a2 2 0 1 1-4 0H6V12.5a2 2 0 1 1 0-3V6Z"/>',
    paint: '<path d="M13 5a7 7 0 1 1-7 7c0-1.8 1.2-2.5 2.6-2.5h2.1A2.3 2.3 0 0 0 13 7.2V5Z"/><path d="M9 12.5a1 1 0 1 0 0 .1"/>',
    shield: '<path d="M12 4.5 18 7v5c0 4-2.8 6.8-6 8.5C8.8 18.8 6 16 6 12V7Z"/><path d="M9.5 12.2 11.4 14 14.8 10.2"/>',
    device: '<path d="M8 5.5h8a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 16 18.5H8A1.5 1.5 0 0 1 6.5 17V7A1.5 1.5 0 0 1 8 5.5Z"/><path d="M10 16h4"/>',
    note: '<path d="M7 5.5h7l3 3V18H7z"/><path d="M10 10.5h4M10 13.5h4"/>',
    export: '<path d="M12 6v8"/><path d="m8.5 9.5 3.5-3.5 3.5 3.5"/><path d="M6.5 15.5h11"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.devices}</svg>`;
}

function toneClass(tone) {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "danger";
  return "neutral";
}

function connectionLabel() {
  if (state.connection === "connected") return "Connected";
  if (state.connection === "manual") return "Manual IP";
  if (state.connection === "relay") return "Relay fallback";
  return "Disconnected";
}

function connectionTone() {
  if (state.connection === "connected") return "success";
  if (state.connection === "manual") return "info";
  if (state.connection === "relay") return "warning";
  return "danger";
}

function tabButton(tab) {
  const active = state.activeTab === tab.key ? "is-active" : "";
  return `
    <button class="seg-button ${active}" data-tab="${tab.key}">
      ${icon(tab.icon)}
      <span>${tab.label}</span>
    </button>
  `;
}

function smallStatusPills() {
  return `
    <div class="status-row">
      <span class="status-pill ${connectionTone()}">${connectionLabel()}</span>
      <span class="status-pill">${state.discovery ? "Discovery on" : "Discovery off"}</span>
      <span class="status-pill">${state.relay ? "Relay ready" : "Relay off"}</span>
      <span class="status-pill">${resolvedTheme() === "dark" ? "Venturis Calm" : "Frosted Suite"}</span>
    </div>
  `;
}

function deviceRows() {
  return devices
    .filter((device) => device.name.toLowerCase().includes((state.activeTab === "devices" ? "" : "").toLowerCase()))
    .map((device) => {
      const active = state.selectedDevice === device.id ? "is-active" : "";
      return `
        <button class="cell ${active}" data-device="${device.id}">
          <div class="cell-icon ${toneClass(device.tone)}">${icon(device.tone === "success" ? "check" : device.tone === "warning" ? "warning" : device.tone === "info" ? "link" : "devices")}</div>
          <div class="cell-copy">
            <strong>${device.name}</strong>
            <span>${device.detail}</span>
            <small>${device.note}</small>
          </div>
          <div class="cell-meta">
            <span class="mini-pill ${toneClass(device.tone)}">${device.badge}</span>
            ${icon("chevron")}
          </div>
        </button>
      `;
    })
    .join("");
}

function connectedDevice() {
  const device = devices.find((item) => item.id === state.selectedDevice) || devices[0];
  const tone = state.connection === "connected" ? "success" : state.connection === "manual" ? "info" : state.connection === "relay" ? "warning" : "danger";
  return `
    <section class="surface-card">
      <div class="surface-head">
        <div>
          <p class="section-kicker">Connected device</p>
          <h2>${device.name}</h2>
        </div>
        <span class="mini-pill ${tone}">${connectionLabel()}</span>
      </div>
      <p class="surface-copy">${device.note}</p>
      <div class="action-grid">
        <button class="sheet-button" data-action="ping">${icon("devices")} Ping</button>
        <button class="sheet-button" data-action="clipboard">${icon("clipboard")} Push clipboard</button>
        <button class="sheet-button" data-action="send-file">${icon("files")} Send files</button>
        <button class="sheet-button" data-action="remote-input">${icon("settings")} Remote input</button>
      </div>
      <div class="device-meta">
        <div><span>Battery</span><strong>87%</strong></div>
        <div><span>Signal</span><strong>${state.connection === "disconnected" ? "No link" : "Strong"}</strong></div>
        <div><span>Transport</span><strong>${state.connection === "relay" ? "Relay fallback" : state.connection === "manual" ? "Manual host" : "Local LAN"}</strong></div>
      </div>
    </section>
  `;
}

function discoveryPanel() {
  return `
    <section class="group">
      <div class="group-head">
        <div>
          <p class="section-kicker">Discovery & pairing</p>
          <h3>When discovery fails, add the host manually.</h3>
        </div>
        <span class="mini-pill ${state.discovery ? "success" : "danger"}">${state.discovery ? "Discovery on" : "Discovery off"}</span>
      </div>
      <div class="list">
        <label class="row">
          <div class="row-main">
            <strong>Local discovery</strong>
            <span>Default first path on trusted networks.</span>
          </div>
          <button class="toggle ${state.discovery ? "is-on" : ""}" data-toggle="discovery" aria-label="Toggle discovery">${state.discovery ? "On" : "Off"}</button>
        </label>
        <div class="row stack">
          <div class="row-main">
            <strong>Manual IP / host</strong>
            <span>Use a trusted address when multicast is blocked.</span>
          </div>
          <div class="inline-fields">
            <input class="field" data-field="manualHost" value="${state.manualHost}" placeholder="192.168.1.42" />
            <input class="field short" data-field="manualPort" value="${state.manualPort}" placeholder="1716" />
            <button class="primary" data-action="manual-pair">${icon("plus")} Add trusted host</button>
          </div>
        </div>
        <label class="row">
          <div class="row-main">
            <strong>Relay fallback</strong>
            <span>Encrypted fallback path when LAN is unavailable.</span>
          </div>
          <button class="toggle ${state.relay ? "is-on" : ""}" data-toggle="relay" aria-label="Toggle relay">${state.relay ? "On" : "Off"}</button>
        </label>
      </div>
    </section>
  `;
}

function clipboardPanel() {
  return `
    <section class="group">
      <div class="group-head">
        <div>
          <p class="section-kicker">Clipboard notebook</p>
          <h3>Every clip is saved as a note you can revisit.</h3>
        </div>
        <span class="mini-pill ${state.archive ? "success" : "warning"}">${state.archive ? "Stored locally" : "Archive off"}</span>
      </div>
      <div class="note-card">
        <div class="note-head">
          ${icon("note")}
          <strong>Notebook note</strong>
        </div>
        <textarea class="note-field" data-field="clipboardNote" rows="4" placeholder="Add a note for this clip...">${state.clipboardNote}</textarea>
        <div class="sheet-actions">
          <button class="ghost" data-toggle="archive">${state.archive ? "Keep local archive" : "Store locally"}</button>
          <button class="ghost" data-action="export-file">${icon("export")} Export as file</button>
          <button class="primary" data-action="export-pdf">${icon("export")} Export PDF</button>
        </div>
      </div>
      <div class="list">
        ${clipboardHistory
          .map(
            (item) => `
              <article class="row clip-row">
                <div class="row-main">
                  <strong>${item.content}</strong>
                  <span>${item.source} · ${item.time}</span>
                  <small>${item.tag}</small>
                </div>
                <div class="clip-actions">
                  <button class="mini-action">${icon("clipboard")} Save</button>
                  <button class="mini-action">${icon("export")} PDF</button>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function filesPanel() {
  return `
    <section class="group">
      <div class="group-head">
        <div>
          <p class="section-kicker">File transfers</p>
          <h3>Receiving, sending, and errors stay visible.</h3>
        </div>
        <div class="segmented compact">
          <button class="seg-button is-active">Receiving</button>
          <button class="seg-button">Sending</button>
          <button class="seg-button">Errored</button>
        </div>
      </div>
      <div class="list">
        ${transfers
          .map(
            (item) => `
              <article class="row transfer-row">
                <div class="transfer-icon ${toneClass(item.tone)}">${icon(item.tone === "warning" ? "warning" : item.tone === "success" ? "files" : "cloud")}</div>
                <div class="row-main">
                  <strong>${item.title}</strong>
                  <span>${item.meta}</span>
                  <small>${item.status}</small>
                </div>
                <button class="mini-action">${icon("chevron")}</button>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function settingsPanel() {
  return `
    <section class="group">
      <div class="group-head">
        <div>
          <p class="section-kicker">Settings hub</p>
          <h3>Plugins, style modes, and permissions all live here.</h3>
        </div>
        <span class="mini-pill">Settings</span>
      </div>
      <div class="list">
        ${settingsRows
          .map(
            (row) => `
              <article class="row">
                <div class="row-icon">${icon(row.icon)}</div>
                <div class="row-main">
                  <strong>${row.title}</strong>
                  <span>${row.subtitle}</span>
                </div>
                <button class="mini-action">${icon("chevron")}</button>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="theme-stack">
        <button class="theme-card ${state.theme === "system" ? "is-active" : ""}" data-theme="system">
          <strong>System</strong>
          <span>Follow the OS theme automatically.</span>
        </button>
        <button class="theme-card ${state.theme === "dark" ? "is-active" : ""}" data-theme="dark">
          <strong>Venturis Calm</strong>
          <span>Dark, polished, soft glass surfaces.</span>
        </button>
        <button class="theme-card ${state.theme === "light" ? "is-active" : ""}" data-theme="light">
          <strong>Frosted Suite</strong>
          <span>Light, friendly, and mobile-first.</span>
        </button>
      </div>
    </section>
  `;
}

function detailPanel() {
  const disconnected = state.connection === "disconnected";
  return `
    <section class="hero-card ${disconnected ? "danger" : ""}">
      <div class="hero-copy">
        <p class="eyebrow">Clippy by Venturis Lab</p>
        <h1>${connectionLabel()}</h1>
        <p>${disconnected ? "Disconnected is shown in red so there is no ambiguity. Manual IP and relay fallback stay visible right away." : "Large titles, grouped lists, sheet-style actions, and a notebook clipboard now feel closer to iOS kit behavior."}</p>
      </div>
      <div class="hero-badge">
        ${icon(disconnected ? "warning" : "wifi")}
        <span>${state.discovery ? "LAN discovery ready" : "Manual IP required"}</span>
      </div>
    </section>
    ${connectedDevice()}
    ${state.activeTab === "devices" ? discoveryPanel() : ""}
    ${state.activeTab === "clipboard" ? clipboardPanel() : ""}
    ${state.activeTab === "files" ? filesPanel() : ""}
    ${state.activeTab === "settings" ? settingsPanel() : ""}
  `;
}

function sidebarPanel() {
  return `
    <section class="group nav-group">
      <div class="group-head">
        <div>
          <p class="section-kicker">Navigation</p>
          <h3>Mobile-first layout, desktop-friendly split view.</h3>
        </div>
      </div>
      <div class="segmented tabs">${tabs.map(tabButton).join("")}</div>
    </section>
    <section class="group">
      <div class="group-head">
        <div>
          <p class="section-kicker">Search</p>
          <h3>Find a device, clip, or setting.</h3>
        </div>
      </div>
      <div class="search-wrap">
        ${icon("search")}
        <input class="search" placeholder="Search..." />
      </div>
    </section>
    <section class="group">
      <div class="group-head">
        <div>
          <p class="section-kicker">Devices</p>
          <h3>Connected, manual, and remembered.</h3>
        </div>
      </div>
      <div class="list">${deviceRows()}</div>
    </section>
  `;
}

function root() {
  return `
    <div class="canvas">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>
      <div class="shell">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">${icon("devices")}</div>
            <div>
              <p>Venturis Lab</p>
              <strong>Clippy</strong>
            </div>
          </div>
          <div class="topbar-actions">
            <button class="theme-switch ${state.theme === "system" ? "is-active" : ""}" data-theme="system">System</button>
            <button class="theme-switch ${state.theme === "dark" ? "is-active" : ""}" data-theme="dark">Calm</button>
            <button class="theme-switch ${state.theme === "light" ? "is-active" : ""}" data-theme="light">Frosted</button>
          </div>
        </header>

        ${smallStatusPills()}

        <main class="layout">
          <aside class="panel sidebar">
            ${sidebarPanel()}
          </aside>
          <section class="panel detail">
            ${detailPanel()}
          </section>
        </main>

        <nav class="dock" aria-label="Main navigation">
          ${tabs
            .map(
              (tab) => `
                <button class="dock-item ${state.activeTab === tab.key ? "is-active" : ""}" data-tab="${tab.key}">
                  ${icon(tab.icon)}
                  <span>${tab.label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
      </div>
    </div>
  `;
}

function syncFields() {
  document.querySelectorAll("[data-field='manualHost']").forEach((el) => {
    if (el instanceof HTMLInputElement) el.value = state.manualHost;
  });
  document.querySelectorAll("[data-field='manualPort']").forEach((el) => {
    if (el instanceof HTMLInputElement) el.value = state.manualPort;
  });
  document.querySelectorAll("[data-field='clipboardNote']").forEach((el) => {
    if (el instanceof HTMLTextAreaElement) el.value = state.clipboardNote;
  });
}

function render() {
  applyTheme();
  app.innerHTML = root();
  syncFields();
  persistState();
}

readStoredState();
applyTheme();
render();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
});

app.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    state.activeTab = tabButton.dataset.tab;
    render();
    return;
  }

  const themeButton = event.target.closest("[data-theme]");
  if (themeButton) {
    state.theme = themeButton.dataset.theme;
    render();
    return;
  }

  const deviceButton = event.target.closest("[data-device]");
  if (deviceButton) {
    state.selectedDevice = deviceButton.dataset.device;
    state.activeTab = "devices";
    render();
    return;
  }

  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    const key = toggle.dataset.toggle;
    if (key === "discovery") state.discovery = !state.discovery;
    if (key === "relay") state.relay = !state.relay;
    if (key === "archive") state.archive = !state.archive;
    if (state.connection === "connected" && key === "relay" && !state.discovery) {
      state.connection = "relay";
    }
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    const key = action.dataset.action;
    if (key === "manual-pair") {
      state.connection = "manual";
      state.activeTab = "devices";
      render();
    }
    if (key === "export-file" || key === "export-pdf" || key === "ping" || key === "clipboard" || key === "send-file" || key === "remote-input") {
      state.activeTab = key === "clipboard" ? "clipboard" : key === "send-file" ? "files" : state.activeTab;
      render();
    }
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (target.dataset.field === "manualHost") state.manualHost = target.value.trim() || state.manualHost;
  if (target.dataset.field === "manualPort") state.manualPort = target.value.trim() || state.manualPort;
  if (target.dataset.field === "clipboardNote") state.clipboardNote = target.value;
  persistState();
});


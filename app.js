const app = document.querySelector("#app");

const state = {
  phoneTab: "devices",
  desktopTab: "devices",
  connectionMode: "manual",
  connectionOnline: true,
  manualHost: "192.168.1.42",
  manualPort: "1716",
  discoveryEnabled: true,
  relayEnabled: true,
  clipboardLocalArchive: true,
  layoutMode: "balanced",
};

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("desktopTab")) state.desktopTab = params.get("desktopTab");
  if (params.get("phoneTab")) state.phoneTab = params.get("phoneTab");
  if (params.get("connectionOnline") === "false") state.connectionOnline = false;
  if (params.get("layoutMode")) state.layoutMode = params.get("layoutMode");
}

const devices = [
  {
    name: "Venturis-MacBook Air",
    detail: "macOS 15 · 192.168.1.71",
    status: ["Connected", "Local LAN", "Verified"],
    battery: "87%",
    signal: "Strong",
    selected: true,
    type: "laptop",
    blurb: "Primary desktop for transfers, clipboard, and remote input.",
  },
  {
    name: "iPhone 15 Pro",
    detail: "iOS 18 · 192.168.1.42",
    status: ["Manual IP", "Verified"],
    battery: "74%",
    signal: "Good",
    selected: false,
    type: "phone",
    blurb: "Foreground-enabled inbox with explicit clipboard copy actions.",
  },
  {
    name: "Pixel 7",
    detail: "Last seen 2h ago · relay fallback",
    status: ["Relay fallback", "Online earlier"],
    battery: "61%",
    signal: "Delayed",
    selected: false,
    type: "cloud",
    blurb: "Cross-network device reachable through encrypted relay only.",
  },
];

const quickActions = [
  {
    title: "Clipboard",
    body: "Share clipboard between devices with explicit iOS copy actions and loop protection.",
    icon: "clipboard",
  },
  {
    title: "Send file",
    body: "Send files securely with retry, cancel, and integrity verification.",
    icon: "file",
  },
  {
    title: "Remote input",
    body: "Touchpad and keyboard control are permission-scoped and easy to revoke.",
    icon: "cursor",
  },
];

const transfers = [
  {
    title: "Presentation_notes.pdf",
    meta: "52 MB · 84% · resume safe",
    status: "Sending to iPhone 15 Pro",
    tone: "good",
  },
  {
    title: "IMG_8291.heic",
    meta: "13 MB · queued · verified hash pending",
    status: "Waiting for foreground return",
    tone: "warn",
  },
  {
    title: "release-build.zip",
    meta: "218 MB · relay fallback · encrypted",
    status: "Delivered to Venturis-MacBook Air",
    tone: "good",
  },
];

const clipboardItems = [
  {
    content: "Quarterly planning draft — please review the notes in the shared folder.",
    age: "12s ago",
    source: "Venturis-MacBook Air",
    note: "Project note",
  },
  {
    content: "OTP ••••••",
    age: "3m ago",
    source: "iPhone 15 Pro",
    sensitive: true,
    note: "Sensitive",
  },
  {
    content: "https://files.venturis.local/share/board/14",
    age: "8m ago",
    source: "Pixel 7",
    note: "Link",
  },
];

const supportModes = [
  {
    title: "Local LAN",
    detail: "Bonjour/mDNS when available, with direct encrypted transport by default.",
  },
  {
    title: "Manual IP",
    detail: "If discovery is blocked, users can add host and port directly.",
  },
  {
    title: "Relay fallback",
    detail: "Ciphertext-only fallback when devices cannot reach each other on LAN.",
  },
  {
    title: "Self-hosted later",
    detail: "Optional relay infrastructure can be self-hosted in a future milestone.",
  },
];

const desktopPages = {
  devices: {
    title: "Devices",
    subtitle: "Trust is explicit. Connectivity is honest. If discovery fails, the app offers manual IP and relay fallback instead of pretending everything is local.",
  },
  clipboard: {
    title: "Clipboard",
    subtitle: "Send and receive text through a visible inbox, with masking for sensitive categories and one-tap copy on iPhone.",
  },
  files: {
    title: "Files",
    subtitle: "Transfers are resumable where supported, verified on completion, and always clear about the current path.",
  },
  settings: {
    title: "Settings",
    subtitle: "Plugins, preferences, motion, icons, and style mobility live here so the app stays powerful without becoming invasive.",
  },
};

const phonePages = {
  devices: {
    title: "Devices",
    subtitle: "Add by QR, discovery, or manual IP when local discovery is blocked.",
  },
  clipboard: {
    title: "Clipboard",
    subtitle: "Recent items appear here with masking for sensitive content and one-tap copy actions.",
  },
  files: {
    title: "Files",
    subtitle: "Receive with visible progress and save destinations that respect iOS constraints.",
  },
  settings: {
    title: "Settings",
    subtitle: "Only the capabilities you allow are enabled for this device, with style modes and plugin controls in one place.",
  },
};

function icon(name) {
  const common = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const map = {
    app: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M6 7h12M6 12h12M6 17h12"/><rect ${common} x="3.5" y="3.5" width="17" height="17" rx="5"/></svg>`,
    device: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="7" y="2.5" width="10" height="19" rx="2.6"/><path ${common} d="M11 18h2"/></svg>`,
    clipboard: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="8" y="4" width="8" height="3" rx="1.3"/><path ${common} d="M8 6.5H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1"/><path ${common} d="M9.5 12h5M9.5 15h4"/></svg>`,
    file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z"/><path ${common} d="M13 3.5V8h4"/></svg>`,
    cursor: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="m4.5 4.5 7.1 17.1 2.3-6.3 6.3-2.3Z"/><path ${common} d="M12 11l5 5"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="7" y="2.5" width="10" height="19" rx="2.6"/><path ${common} d="M11 18h2"/></svg>`,
    laptop: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V15H5z"/><path ${common} d="M3.5 17.5h17"/></svg>`,
    cloud: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7.5 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.7-1.6A3.5 3.5 0 1 1 19 18Z"/></svg>`,
    wifi: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M4.5 8.5a13 13 0 0 1 15 0"/><path ${common} d="M7.5 12a8.5 8.5 0 0 1 9 0"/><path ${common} d="M10.5 15.5a4 4 0 0 1 3 0"/><path ${common} d="M12 19h0"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 3.5 18.5 6v5.2c0 4.1-2.8 7.8-6.5 9.3-3.7-1.5-6.5-5.2-6.5-9.3V6Z"/><path ${common} d="m9.5 12.2 1.7 1.7 3.3-3.4"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 5v14M5 12h14"/></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle ${common} cx="10.5" cy="10.5" r="6.5"/><path ${common} d="m16 16 4 4"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M10.3 3.8h3.4l.8 2.7 2.5 1.1 2.4-1.1 1.7 1.7-1.1 2.4 1.1 2.5 2.7.8v3.4l-2.7.8-1.1 2.5 1.1 2.4-1.7 1.7-2.4-1.1-2.5 1.1-.8 2.7h-3.4l-.8-2.7-2.5-1.1-2.4 1.1-1.7-1.7 1.1-2.4-1.1-2.5-2.7-.8v-3.4l2.7-.8 1.1-2.5-1.1-2.4 1.7-1.7 2.4 1.1 2.5-1.1z"/><circle ${common} cx="12" cy="12" r="3.1"/></svg>`,
    info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle ${common} cx="12" cy="12" r="9"/><path ${common} d="M12 10.5v5"/><path ${common} d="M12 7.5h0"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="m9 6 6 6-6 6"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M20 12a8 8 0 1 1-2.4-5.7"/><path ${common} d="M20 4v4h-4"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="5.5" y="10.5" width="13" height="9" rx="2.2"/><path ${common} d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>`,
    ping: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M5 12h4l2-5 3 11 2-6h3"/><path ${common} d="M4 19h16"/></svg>`,
    send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M21 3 11 13"/><path ${common} d="M21 3 14 21l-3-8-8-3Z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="m12 3 10 18H2z"/><path ${common} d="M12 9v4"/><path ${common} d="M12 16h0"/></svg>`,
    battery: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect ${common} x="4.5" y="7" width="15" height="10" rx="2"/><path ${common} d="M20 10v4"/><path ${common} d="M7 12.5h5.5"/></svg>`,
  };
  return map[name] ?? map.info;
}

function chip(label, tone = "default") {
  return `<span class="tag ${tone}">${label}</span>`;
}

function connectionTag() {
  if (!state.connectionOnline) return chip("Disconnected", "danger");
  if (state.connectionMode === "relay") return chip("Relay fallback", "warn");
  if (state.connectionMode === "manual") return chip("Manual IP", "info");
  return chip("Local LAN", "good");
}

function connectionLabel() {
  if (!state.connectionOnline) return "Disconnected";
  if (state.connectionMode === "relay") return "Relay fallback";
  if (state.connectionMode === "manual") return "Manual IP";
  return "Connected";
}

function connectionTone() {
  if (!state.connectionOnline) return "danger";
  if (state.connectionMode === "relay") return "warn";
  if (state.connectionMode === "manual") return "info";
  return "good";
}

function desktopClipboardPanel() {
  return `
    <section class="card">
      <div class="section-title">
        <div>
          <h4>Clipboard notes</h4>
          <small>See every clip moved between devices, keep a local archive, and export it when needed.</small>
        </div>
        <div class="toolbar">
          <span class="pill">${icon("lock")} <strong>${state.clipboardLocalArchive ? "Local archive" : "Archive off"}</strong></span>
          <button class="button compact inline" data-action="toggle-clipboard-archive">${state.clipboardLocalArchive ? "Stored locally" : "Store locally"}</button>
        </div>
      </div>
      <div class="card-grid">
        <div class="card soft">
          <div class="section-title">
            <div>
              <h4>Notebook</h4>
              <small>A running log of clips shared across devices.</small>
            </div>
            ${chip("Notes mode", "info")}
          </div>
          <div class="list">
            ${clipboardItems
              .map(
                (entry) => `
                  <div class="log-row">
                    <div class="dot ${entry.sensitive ? "warn" : "good"}"></div>
                    <div>
                      <strong>${entry.note}</strong>
                      <p>${entry.sensitive ? "Sensitive content masked" : entry.content}</p>
                    </div>
                    <span class="muted">${entry.source}</span>
                  </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="card soft">
          <div class="section-title">
            <div>
              <h4>Export</h4>
              <small>Save notes to PDF or a local file.</small>
            </div>
            ${chip("Portable", "good")}
          </div>
          <div class="list">
            <div class="log-row">
              <div class="dot good"></div>
              <div>
                <strong>Export as PDF</strong>
                <p>Open a print-friendly note sheet that can be saved as PDF.</p>
              </div>
              <button class="button compact" data-action="export-notes-pdf">PDF</button>
            </div>
            <div class="log-row">
              <div class="dot good"></div>
              <div>
                <strong>Export as file</strong>
                <p>Download a markdown file with timestamps and source devices.</p>
              </div>
              <button class="button compact" data-action="export-notes-file">File</button>
            </div>
            <div class="log-row">
              <div class="dot info"></div>
              <div>
                <strong>Quick note</strong>
                <p>Write a local note before you push it to another device.</p>
              </div>
              <span class="muted">Draft</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function desktopSettingsPanel() {
  return `
    <section class="card">
      <div class="section-title">
        <div>
          <h4>Settings hub</h4>
          <small>Everything that isn’t device-specific lives here: plugins, preferences, motion, icons, and layout mobility.</small>
        </div>
        ${chip("Implementable", "good")}
      </div>
      <div class="card-grid">
        <div class="card soft">
          <div class="section-title">
            <div>
              <h4>Style mobility</h4>
              <small>Switch density without redesigning the app.</small>
            </div>
            ${chip(state.layoutMode, "info")}
          </div>
          <div class="phone-tabs" style="grid-template-columns:repeat(3,1fr);padding:0;">
            ${styleModeButton("compact", "Compact")}
            ${styleModeButton("balanced", "Balanced")}
            ${styleModeButton("spacious", "Spacious")}
          </div>
          <p class="muted" style="margin:12px 0 0;">These modes are meant to map cleanly to responsive implementations in React, SwiftUI, and Figma components.</p>
        </div>

        <div class="card soft">
          <div class="section-title">
            <div>
              <h4>Plugin center</h4>
              <small>Plugins and preferences share one settings surface.</small>
            </div>
            ${chip("Scoped", "info")}
          </div>
          <div class="list">
            <div class="log-row">
              <div class="dot good"></div>
              <div>
                <strong>Clipboard plugin</strong>
                <p>History, local archive, sensitivity masking, and export.</p>
              </div>
              <span class="muted">Enabled</span>
            </div>
            <div class="log-row">
              <div class="dot info"></div>
              <div>
                <strong>Files plugin</strong>
                <p>Transfer progress, resume, save destinations, and hash checks.</p>
              </div>
              <span class="muted">Enabled</span>
            </div>
            <div class="log-row">
              <div class="dot warn"></div>
              <div>
                <strong>Remote input plugin</strong>
                <p>Explicit permission, local audit trail, revoke anytime.</p>
              </div>
              <span class="muted">Optional</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card-grid" style="margin-top:14px;">
        <div class="card soft">
          <div class="section-title">
            <div>
              <h4>Icon pack</h4>
              <small>SVG-based, scalable, and consistent with the system.</small>
            </div>
            ${chip("Vector", "good")}
          </div>
          ${iconGrid()}
        </div>

        <div class="card soft">
          <div class="section-title">
            <div>
              <h4>Motion and Figma handoff</h4>
              <small>Concrete tokens and animation intent for implementation.</small>
            </div>
            ${chip("Handoff-ready", "info")}
          </div>
          <div class="list">
            <div class="log-row">
              <div class="dot good"></div>
              <div>
                <strong>Motion</strong>
                <p>Use short easing on hover, selection, and connection-state transitions.</p>
              </div>
              <span class="muted">180ms</span>
            </div>
            <div class="log-row">
              <div class="dot info"></div>
              <div>
                <strong>Figma mapping</strong>
                <p>Cards, pills, lists, and icon tiles are designed to become reusable components.</p>
              </div>
              <span class="muted">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function iconGrid() {
  const pack = [
    ["Clipboard", "clipboard"],
    ["Transfer", "file"],
    ["Pairing", "shield"],
    ["Ping", "ping"],
    ["Remote input", "cursor"],
    ["Settings", "settings"],
  ];
  return `
    <div class="icon-pack">
      ${pack
        .map(
          ([label, name]) => `
            <div class="icon-pack-item">
              <span class="icon-pack-glyph">${icon(name)}</span>
              <strong>${label}</strong>
            </div>`,
        )
        .join("")}
    </div>
  `;
}

function styleModeButton(mode, label) {
  const active = state.layoutMode === mode ? "active" : "";
  return `<button class="phone-tab ${active}" data-style-mode="${mode}">${label}</button>`;
}

function clipboardArchiveText() {
  return clipboardItems
    .map((entry) => `- [${entry.age}] ${entry.note} — ${entry.source}${entry.sensitive ? " (sensitive)" : ""}`)
    .join("\n");
}

function exportClipboardFile() {
  const blob = new Blob(
    [
      `Clippy clipboard archive\n\n${clipboardItems
        .map((entry) => `${entry.age} | ${entry.note} | ${entry.source} | ${entry.content}`)
        .join("\n")}\n`,
    ],
    { type: "text/markdown;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clippy-clipboard-archive.md";
  link.click();
  URL.revokeObjectURL(url);
}

function exportClipboardPdfPreview() {
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>Clippy clipboard archive</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; padding: 32px; color: #111; }
          h1 { margin: 0 0 12px; }
          p, li { line-height: 1.5; }
          .note { padding: 12px 0; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Clippy clipboard archive</h1>
        <p>This preview is ready to print to PDF.</p>
        ${clipboardItems
          .map(
            (entry) => `
              <div class="note">
                <strong>${entry.note}</strong><br />
                ${entry.content}<br />
                <small>${entry.source} · ${entry.age}${entry.sensitive ? " · sensitive" : ""}</small>
              </div>`,
          )
          .join("")}
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

function renderDevice(device) {
  const toneClass = device.selected ? "selected" : "";
  const iconName = device.type === "laptop" ? "laptop" : device.type === "cloud" ? "cloud" : "phone";
  const currentModeLabel = !state.connectionOnline
    ? "Disconnected"
    : state.connectionMode === "relay"
      ? "Relay fallback"
      : state.connectionMode === "manual"
        ? "Manual IP"
        : "Local LAN";
  const statusList = device.selected ? [connectionLabel(), currentModeLabel, "Verified"] : device.status;
  return `
    <div class="device-row ${toneClass}">
      <div class="device-icon">${icon(iconName)}</div>
      <div class="device-meta">
        <h5>${device.name}</h5>
        <p>${device.detail}</p>
        <div class="device-status">
          ${statusList
            .map((s) =>
              chip(
                s,
                s === "Verified" ? "good" : s === "Relay fallback" || s === "Disconnected" ? "warn" : s === "Manual IP" ? "info" : "good",
              ),
            )
            .join("")}
        </div>
      </div>
      <div class="device-side">
        <div class="battery">${icon("battery")} ${device.battery}</div>
        <button class="button compact inline" data-action="open-device">Open</button>
      </div>
    </div>
  `;
}

function desktopContent() {
  const page = desktopPages[state.desktopTab];
  const selected = devices.find((device) => device.selected);
  const heroBlurb = state.connectionOnline
    ? selected.blurb
    : "Disconnected right now. The UI keeps the fallback paths visible so users can reconnect without guessing.";

  return `
    <div class="window">
      <div class="window-bar">
        <div class="traffic" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="window-title">Clippy by Venturis Lab</div>
        <div style="width:58px"></div>
      </div>
      <div class="window-layout">
        <aside class="sidebar">
          <div class="sidebar-head">
            <div class="device-icon">${icon("app")}</div>
            <div class="brand-copy">
              <h1>Clippy</h1>
              <p>Venturis Lab</p>
            </div>
          </div>
          <nav class="sidebar-nav">
            ${navItem("devices", "Devices", icon("device"))}
            ${navItem("clipboard", "Clipboard", icon("clipboard"))}
            ${navItem("files", "Files", icon("file"))}
            ${navItem("settings", "Settings", icon("settings"))}
            ${navItem("about", "About", icon("info"), true)}
          </nav>
          <div class="sidebar-foot">
            <strong>${icon("shield")} Privacy-first</strong>
            <p>All content stays encrypted device-to-device. The relay never sees plaintext.</p>
          </div>
        </aside>

        <main class="main">
          <div class="main-head">
            <div>
                <div class="tag-row">
                  ${connectionTag()}
                  ${chip("Verified trust", "good")}
                  ${chip("iOS limits respected", "warn")}
                </div>
                <h3>${page.title}</h3>
                <p>${page.subtitle}</p>
            </div>
            <div class="toolbar">
              <button class="button ghost compact" data-action="toggle-discovery">${state.discoveryEnabled ? "Discovery on" : "Discovery off"}</button>
              <button class="button ghost compact" data-action="toggle-relay">${state.relayEnabled ? "Relay on" : "Relay off"}</button>
              <button class="button ghost compact" data-action="toggle-connection">${state.connectionOnline ? "Disconnect" : "Reconnect"}</button>
              <button class="button primary compact" data-action="pair-qr">Pair by QR</button>
            </div>
          </div>

          <section class="hero">
            <div class="hero-top">
              <div class="hero-copy">
                <div class="tag-row">
                  ${chip("Local LAN first", "good")}
                  ${chip("Manual host fallback", "info")}
                  ${chip("Ciphertext-only relay", "warn")}
                </div>
                <h3>${selected.name}</h3>
                <p>${heroBlurb}</p>
              </div>
              <div class="toolbar">
                <button class="button compact" data-action="device-action">Send ping</button>
                <button class="button compact" data-action="device-action">Send file</button>
                <button class="button compact primary" data-action="device-action">Push clipboard</button>
              </div>
            </div>

            <div class="card-grid">
              ${quickActions
                .map(
                  (action) => `
                    <div class="mini-action">
                      <div>${icon(action.icon)}</div>
                      <strong>${action.title}</strong>
                      <p>${action.body}</p>
                    </div>`,
                )
                .join("")}
            </div>
          </section>

          <section class="card">
            <div class="section-title">
              <div>
                <h4>Connected and remembered devices</h4>
                <small>Truthful connection state, path, and trust are always visible.</small>
              </div>
              <button class="button compact inline" data-action="refresh-devices">${icon("refresh")} Refresh</button>
            </div>
            <div class="device-list">
              ${devices.map(renderDevice).join("")}
            </div>
          </section>

          <section class="card-grid">
            <div class="card soft">
              <div class="section-title">
                <div>
                  <h4>Add device manually</h4>
                  <small>If discovery is blocked, enter a host directly.</small>
                </div>
                ${chip("IPv4 / IPv6 / hostname", "info")}
              </div>
              <div class="field-grid">
                <input class="field" id="manual-host" value="${state.manualHost}" placeholder="192.168.1.42" />
                <input class="field" id="manual-port" value="${state.manualPort}" placeholder="1716" />
                <button class="button primary" data-action="connect-manual">Connect</button>
              </div>
              <div class="helper-row">
                <span>Validated before trust is granted.</span>
                <span>Example: 192.168.1.42:1716</span>
              </div>
            </div>

            <div class="card soft">
              <div class="section-title">
                <div>
                  <h4>Connection ladder</h4>
                  <small>We degrade honestly rather than disappearing.</small>
                </div>
                ${chip("Failover aware", "good")}
              </div>
              <div class="list">
                ${supportModes
                  .map((item) => {
                    const tone =
                      item.title === "Local LAN" ? "good" : item.title === "Manual IP" ? "info" : item.title === "Relay fallback" ? "warn" : "";
                    return `
                      <div class="log-row">
                        <div class="dot ${tone === "good" ? "good" : tone === "warn" ? "warn" : ""}"></div>
                        <div>
                          <strong>${item.title}</strong>
                          <p>${item.detail}</p>
                        </div>
                        <span class="muted">${item.title === "Relay fallback" ? "enabled" : "ready"}</span>
                      </div>`;
                  })
                  .join("")}
              </div>
            </div>
          </section>

          <section class="card-grid">
            <div class="card">
              <div class="section-title">
                <div>
                  <h4>Transfer activity</h4>
                  <small>Resume, cancel, or verify; no fake progress states.</small>
                </div>
                <span class="muted">3 items</span>
              </div>
              <div class="list">
                ${transfers
                  .map(
                    (transfer) => `
                      <div class="log-row">
                        <div class="dot ${transfer.tone}"></div>
                        <div>
                          <strong>${transfer.title}</strong>
                          <p>${transfer.meta}</p>
                        </div>
                        <span class="muted">${transfer.status}</span>
                      </div>`,
                  )
                  .join("")}
              </div>
            </div>

            <div class="card">
              <div class="section-title">
                <div>
                  <h4>Clipboard inbox</h4>
                  <small>Masked previews keep sensitive content honest.</small>
                </div>
                ${chip("One-tap copy", "good")}
              </div>
              <div class="list">
                ${clipboardItems
                  .map(
                    (entry) => `
                      <div class="log-row">
                        <div class="dot ${entry.sensitive ? "warn" : "good"}"></div>
                        <div>
                          <strong>${entry.sensitive ? "Sensitive content masked" : entry.content}</strong>
                          <p>${entry.source} · ${entry.age}</p>
                        </div>
                        <span class="muted">${entry.sensitive ? "Confirm" : "Copy"}</span>
                      </div>`,
                  )
                  .join("")}
              </div>
            </div>
          </section>

          ${state.desktopTab === "clipboard" ? desktopClipboardPanel() : ""}
          ${state.desktopTab === "settings" ? desktopSettingsPanel() : ""}
        </main>
      </div>
    </div>
  `;
}

function navItem(key, label, svg, muted = false) {
  const active = state.desktopTab === key ? "active" : "";
  const hidden = key === "about" ? "muted" : "";
  return `
    <div class="nav-item ${active}">
      ${svg}
      <span>${label}</span>
      <span style="margin-left:auto" class="${hidden}">${key === "about" ? "" : ""}</span>
    </div>
  `;
}

function phoneContent() {
  const page = phonePages[state.phoneTab];

  const connected = devices[0];
  const remembered = devices[2];
  return `
    <div class="phone-frame">
      <div class="phone">
        <div class="phone-top">
          <div>
            <div class="brand-copy">
              <h1>Clippy</h1>
              <p>Venturis Lab</p>
            </div>
          </div>
          <button class="button compact ghost" data-action="add-device">+</button>
        </div>

        <div class="phone-main">
          <div class="tag-row">
            ${chip("Foreground-safe", "info")}
            ${chip("Manual IP", "good")}
            ${chip("Relay fallback", "warn")}
          </div>
          <div class="phone-card">
            <h4>${page.title}</h4>
            <p>${page.subtitle}</p>
          </div>

          ${state.phoneTab === "devices" ? devicesTab(connected, remembered) : ""}
          ${state.phoneTab === "clipboard" ? clipboardTab() : ""}
          ${state.phoneTab === "files" ? filesTab() : ""}
          ${state.phoneTab === "settings" ? settingsTab() : ""}
        </div>

        <nav class="bottom-nav">
          ${bottomTab("devices", "Devices", icon("device"))}
          ${bottomTab("clipboard", "Clipboard", icon("clipboard"), true)}
          ${bottomTab("files", "Files", icon("file"))}
          ${bottomTab("settings", "Settings", icon("settings"))}
        </nav>
      </div>
    </div>
  `;
}

function bottomTab(key, label, svg, dim = false) {
  const active = state.phoneTab === key ? "active" : "";
  return `
    <button class="${active}" data-phone-tab="${key}">
      ${svg}
      <span>${label}</span>
    </button>
  `;
}

function devicesTab(connected, remembered) {
  const connectionToneLabel = state.connectionOnline ? "good" : "danger";
  return `
    <div class="phone-card">
      <h4>Add device manually</h4>
      <p>Enter the host if discovery is unavailable.</p>
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:12px;">
        <input class="field" id="mobile-manual-host" value="${state.manualHost}" placeholder="192.168.1.42" />
        <button class="button primary" data-action="connect-manual-mobile">Connect</button>
      </div>
      <p class="subtle" style="margin-top:10px;">Supports hostnames, IPv4, and IPv6.</p>
    </div>

    <div class="phone-card">
      <h4 style="color:${state.connectionOnline ? "var(--text)" : "var(--danger)"}">${state.connectionOnline ? "Connected" : "Disconnected"}</h4>
      <p>${state.connectionOnline ? "Live on the local network or a verified fallback path." : "No live link right now. The app will keep showing fallback paths and reconnection options."}</p>
      <div class="phone-list">
        <div class="phone-row">
          <div class="device-icon">${icon("phone")}</div>
          <div>
            <h5>${connected.name}</h5>
            <p>${connected.detail}</p>
            <div class="device-status" style="margin-top:8px;">
              ${chip(state.connectionOnline ? "Local LAN" : "Disconnected", connectionToneLabel)}
              ${chip("Verified", "good")}
            </div>
          </div>
          <button class="button compact">${state.connectionOnline ? "Open" : "Retry"}</button>
        </div>
      </div>
    </div>

    <div class="phone-card">
      <h4>Discovered</h4>
      <div class="phone-list">
        <div class="phone-row">
          <div class="device-icon">${icon("laptop")}</div>
          <div>
            <h5>Venturis-MacBook</h5>
            <p>192.168.1.71 · ready for pairing</p>
            <div class="device-status" style="margin-top:8px;">
              ${chip("Discovered", "info")}
              ${chip("Verified", "good")}
            </div>
          </div>
          <button class="button compact primary">Connect</button>
        </div>
      </div>
    </div>

    <div class="phone-card">
      <h4>Remembered</h4>
      <div class="phone-list">
        <div class="phone-row">
          <div class="device-icon">${icon("cloud")}</div>
          <div>
            <h5>${remembered.name}</h5>
            <p>${remembered.detail}</p>
            <div class="device-status" style="margin-top:8px;">
              ${chip("Relay fallback", "warn")}
              ${chip("Encrypted", "good")}
            </div>
          </div>
          <button class="button compact">Review</button>
        </div>
      </div>
    </div>

    <div class="phone-card">
      <h4>Quick actions</h4>
      <div class="phone-list">
        <div class="phone-row">
          <div class="device-icon">${icon("clipboard")}</div>
          <div>
            <h5>Clipboard inbox</h5>
            <p>Copy recent items with a single tap.</p>
          </div>
          <button class="button compact">Open</button>
        </div>
        <div class="phone-row">
          <div class="device-icon">${icon("file")}</div>
          <div>
            <h5>Send file</h5>
            <p>Choose a file and send it securely.</p>
          </div>
          <button class="button compact primary">Send</button>
        </div>
      </div>
    </div>
  `;
}

function filesTab() {
  return `
    <div class="phone-card">
      <h4>Receiving</h4>
      <div class="phone-list">
        <div class="phone-row">
          <div class="device-icon">${icon("file")}</div>
          <div>
            <h5>Design-review.mp4</h5>
            <p>72% · paused by iOS background limits</p>
            <div class="device-status" style="margin-top:8px;">
              ${chip("Resume safe", "info")}
              ${chip("Integrity checked", "good")}
            </div>
          </div>
          <button class="button compact">Resume</button>
        </div>
      </div>
    </div>

    <div class="phone-card">
      <h4>Send from iPhone</h4>
      <p>Use the Share Sheet or a visible send action; no silent background transfer claims.</p>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
        <button class="button primary">Send photo</button>
        <button class="button">Send text</button>
      </div>
    </div>
  `;
}

function clipboardTab() {
  return `
    <div class="phone-card">
      <div class="section-title" style="margin-bottom:10px;">
        <div>
          <h4 style="margin-bottom:4px;">Clipboard notebook</h4>
          <small>Every shared clip can be stored locally and exported later.</small>
        </div>
        ${chip(state.clipboardLocalArchive ? "Stored locally" : "Archive off", state.clipboardLocalArchive ? "good" : "warn")}
      </div>
      <div class="phone-list">
        ${clipboardItems
          .map(
            (entry) => `
              <div class="phone-row">
                <div class="device-icon">${icon("clipboard")}</div>
                <div>
                  <h5>${entry.note}</h5>
                  <p>${entry.source} · ${entry.age}</p>
                  <div class="device-status" style="margin-top:8px;">
                    ${chip(entry.sensitive ? "Sensitive" : "Ready", entry.sensitive ? "warn" : "good")}
                    ${chip("Copy", "info")}
                  </div>
                </div>
                <button class="button compact">${entry.sensitive ? "Review" : "Copy"}</button>
              </div>`,
          )
          .join("")}
      </div>
    </div>

    <div class="phone-card">
      <div class="section-title" style="margin-bottom:10px;">
        <div>
          <h4 style="margin-bottom:4px;">Export and note</h4>
          <small>Write a note, then export the archive as a file or PDF.</small>
        </div>
      </div>
      <div style="display:grid;gap:10px;margin-top:12px;">
        <textarea class="field" rows="4" placeholder="Add a local note about a clip or a transfer"></textarea>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="button primary" data-action="export-notes-file">Export file</button>
          <button class="button" data-action="export-notes-pdf">Export PDF</button>
          <button class="button" data-action="toggle-clipboard-archive">${state.clipboardLocalArchive ? "Store locally" : "Keep local off"}</button>
        </div>
      </div>
    </div>
  `;
}

function settingsTab() {
  return `
    <div class="phone-card">
      <div class="section-title" style="margin-bottom:10px;">
        <div>
          <h4 style="margin-bottom:4px;">Settings</h4>
          <small>Plugins, preferences, styles, and device policies.</small>
        </div>
        ${chip("All in one place", "info")}
      </div>
      <div class="phone-tabs" style="grid-template-columns:repeat(3,1fr);padding:0 0 12px;">
        ${styleModeButton("compact", "Compact")}
        ${styleModeButton("balanced", "Balanced")}
        ${styleModeButton("spacious", "Spacious")}
      </div>
      <div class="phone-list">
        <div class="phone-row">
          <div class="device-icon">${icon("clipboard")}</div>
          <div>
            <h5>Clipboard push & receive</h5>
            <p>Enabled with explicit copy actions.</p>
          </div>
          ${chip("On", "good")}
        </div>
        <div class="phone-row">
          <div class="device-icon">${icon("cursor")}</div>
          <div>
            <h5>Remote input</h5>
            <p>Permission-scoped and easy to revoke.</p>
          </div>
          ${chip("On", "info")}
        </div>
        <div class="phone-row">
          <div class="device-icon">${icon("warning")}</div>
          <div>
            <h5>Background sync</h5>
            <p>Limited by iOS policies; uses foreground refresh and approved background APIs only.</p>
          </div>
          ${chip("Limited", "warn")}
        </div>
        <div class="phone-row">
          <div class="device-icon">${icon("settings")}</div>
          <div>
            <h5>Plugins</h5>
            <p>Clipboard, files, and remote input live under the Settings hub.</p>
          </div>
          ${chip("Manage", "info")}
        </div>
        <div class="phone-row">
          <div class="device-icon">${icon("shield")}</div>
          <div>
            <h5>Style mobility</h5>
            <p>Switch between compact, balanced, and spacious modes for different layouts.</p>
          </div>
          ${chip(state.layoutMode, "good")}
        </div>
      </div>
    </div>
  `;
}

function supportSection() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Connection options and honest fallbacks</h2>
          <p>Designed around what stays available when multicast, discovery, or third-party background permissions are constrained.</p>
        </div>
        <div class="toolbar">
          <span class="pill"><strong>Manual</strong> host entry</span>
          <span class="pill"><strong>Relay</strong> encrypted fallback</span>
        </div>
      </div>
      <div class="content">
        <div class="support-grid">
          ${supportModes
            .map(
              (mode) => `
                <div class="support-card">
                  <strong>${mode.title}</strong>
                  <p>${mode.detail}</p>
                </div>`,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function root() {
  return `
    <div class="shell density-${state.layoutMode}">
      <div class="brandbar">
        <div class="brand">
          <div class="brand-mark">${icon("app")}</div>
          <div class="brand-copy">
            <h1>Clippy by Venturis Lab</h1>
            <p>Modern, privacy-first device linking for desktop and iPhone.</p>
          </div>
        </div>
        <div class="global-status">
          <span class="pill ${state.connectionOnline ? "" : "danger"}">${icon("wifi")} <strong>${state.connectionOnline ? "Connected" : "Disconnected"}</strong> ${state.connectionOnline ? "via LAN first" : "retrying and showing fallbacks"}</span>
          <span class="pill">${icon("shield")} <strong>Encrypted</strong> transport</span>
          <span class="pill">${icon("warning")} iOS stays honest about limits</span>
        </div>
      </div>

      <div class="grid">
        ${desktopContent()}
        ${phoneContent()}
      </div>

      <div style="margin-top:18px;">${supportSection()}</div>
      <div class="footer-note">
        Clippy is a new implementation inspired by the KDE Connect experience, reworked for a calmer Venturis Lab identity and more honest platform behavior.
      </div>
    </div>
  `;
}

function syncInputs() {
  const hostInput = document.querySelector("#manual-host");
  if (hostInput) hostInput.value = state.manualHost;
  const mobileHost = document.querySelector("#mobile-manual-host");
  if (mobileHost) mobileHost.value = state.manualHost;
  const portInput = document.querySelector("#manual-port");
  if (portInput) portInput.value = state.manualPort;
}

function bind() {
  app.querySelectorAll("[data-phone-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.phoneTab = button.dataset.phoneTab;
      render();
    });
  });

  app.querySelectorAll("[data-style-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.layoutMode = button.dataset.styleMode;
      render();
    });
  });

  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "toggle-discovery") state.discoveryEnabled = !state.discoveryEnabled;
      if (action === "toggle-relay") state.relayEnabled = !state.relayEnabled;
      if (action === "toggle-connection") state.connectionOnline = !state.connectionOnline;
      if (action === "toggle-clipboard-archive") state.clipboardLocalArchive = !state.clipboardLocalArchive;
      if (action === "connect-manual" || action === "connect-manual-mobile") {
        const host = document.querySelector(action === "connect-manual" ? "#manual-host" : "#mobile-manual-host");
        const port = document.querySelector("#manual-port");
        if (host instanceof HTMLInputElement) state.manualHost = host.value.trim() || state.manualHost;
        if (port instanceof HTMLInputElement) state.manualPort = port.value.trim() || state.manualPort;
        state.connectionMode = "manual";
        devices[1].detail = `iOS 18 · ${state.manualHost}`;
      }
      if (action === "pair-qr") state.connectionMode = "local";
      if (action === "toggle-relay" && state.relayEnabled) state.connectionMode = "relay";
      if (action === "toggle-discovery" && state.discoveryEnabled && state.connectionMode !== "relay") state.connectionMode = "local";
      if (action === "refresh-devices") {
        devices[2].detail = "Last seen just now · relay fallback";
      }
      if (action === "export-notes-file") exportClipboardFile();
      if (action === "export-notes-pdf") exportClipboardPdfPreview();
      render();
    });
  });

  app.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const label = item.querySelector("span")?.textContent;
      if (label === "Devices") state.desktopTab = "devices";
      if (label === "Clipboard") state.desktopTab = "clipboard";
      if (label === "Files") state.desktopTab = "files";
      if (label === "Settings") state.desktopTab = "settings";
      render();
    });
  });

  syncInputs();
}

function render() {
  app.innerHTML = root();
  bind();
}

applyUrlState();
render();

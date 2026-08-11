export default {
  async fetch() {
    const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>Clippy by Venturis Lab</title>
  <style>
    :root {
      color-scheme: dark light;
      --bg: #07111d;
      --bg-2: #0c1724;
      --panel: rgba(13, 21, 33, 0.82);
      --surface: rgba(18, 28, 42, 0.68);
      --line: rgba(149, 173, 204, 0.15);
      --text: #f5f8fc;
      --muted: #96a7bc;
      --accent: #67a1ff;
      --accent-2: #91d8ff;
      --success: #3ee58f;
      --warning: #f4bb4f;
      --danger: #ff6b78;
      --shadow: 0 32px 90px rgba(0, 0, 0, 0.32);
      --radius-xl: 34px;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f4f7fc;
        --bg-2: #e9eff8;
        --panel: rgba(255, 255, 255, 0.78);
        --surface: rgba(255, 255, 255, 0.92);
        --line: rgba(95, 118, 144, 0.14);
        --text: #111827;
        --muted: #64748b;
        --shadow: 0 26px 70px rgba(34, 51, 76, 0.12);
      }
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at top left, rgba(103, 161, 255, 0.16), transparent 28%),
        radial-gradient(circle at 90% 10%, rgba(145, 216, 255, 0.12), transparent 20%),
        linear-gradient(180deg, var(--bg), var(--bg-2));
      color: var(--text);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    body { min-height: 100vh; }
    svg { display: block; width: 1em; height: 1em; }
    .canvas { position: relative; min-height: 100vh; overflow: hidden; }
    .ambient { position: absolute; inset: auto; filter: blur(64px); pointer-events: none; opacity: 0.75; }
    .ambient-a { width: 460px; height: 460px; left: -120px; top: 10px; background: radial-gradient(circle, rgba(103, 161, 255, 0.28), transparent 70%); }
    .ambient-b { width: 540px; height: 540px; right: -140px; bottom: -150px; background: radial-gradient(circle, rgba(62, 229, 143, 0.12), transparent 72%); }
    .shell { position: relative; width: min(1500px, calc(100vw - 24px)); margin: 0 auto; padding: 18px 0 26px; }
    .topbar, .panel, .hero-card, .section-card, .note-field, .dock { border: 1px solid var(--line); background: var(--panel); backdrop-filter: blur(22px); box-shadow: var(--shadow); }
    .topbar { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:16px 18px; border-radius:var(--radius-xl); }
    .brand { display:flex; align-items:center; gap:14px; }
    .brand-mark { width:42px; height:42px; border-radius:15px; display:grid; place-items:center; border:1px solid rgba(103,161,255,.3); background:linear-gradient(180deg, rgba(103,161,255,.2), rgba(103,161,255,.08)); color:var(--accent-2); }
    .brand p, .brand strong { margin:0; line-height:1.1; }
    .brand p { color:var(--muted); font-size:12px; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px; }
    .brand strong { font-size:22px; font-weight:700; letter-spacing:-.04em; }
    .topbar-actions, .status-row, .sheet-actions, .clip-list { display:flex; gap:10px; flex-wrap:wrap; }
    .theme-switch, .mini-pill, .status-pill, .ghost, .primary, .sheet-button, .dock-item { display:inline-flex; align-items:center; justify-content:center; gap:8px; }
    .theme-switch, .status-pill, .mini-pill { min-height:38px; padding:0 14px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--muted); }
    .theme-switch.active, .mini-pill.success, .status-pill.success { background:rgba(62,229,143,.12); color:var(--success); border-color:rgba(62,229,143,.22); }
    .mini-pill.warning, .status-pill.warning { background:rgba(244,187,79,.12); color:var(--warning); border-color:rgba(244,187,79,.22); }
    .mini-pill.danger, .status-pill.danger { background:rgba(255,107,120,.12); color:var(--danger); border-color:rgba(255,107,120,.24); }
    .mini-pill.info { background:rgba(103,161,255,.12); color:var(--accent); border-color:rgba(103,161,255,.24); }
    .status-row { padding:14px 2px 20px; }
    .layout { display:grid; grid-template-columns:minmax(330px,.88fr) minmax(500px,1.12fr); gap:18px; align-items:start; }
    .panel { border-radius:var(--radius-xl); overflow:hidden; }
    .sidebar, .detail { padding:20px; }
    .section-card { border-radius:28px; padding:18px; background:var(--surface); }
    .hero-card { border-radius:28px; padding:24px; background:var(--surface); margin-bottom:14px; }
    .hero-card.danger { border-color:rgba(255,107,120,.24); }
    .hero-copy h1, .section-head h2 { margin:0; line-height:1.04; letter-spacing:-.05em; }
    .hero-copy h1 { font-size:clamp(34px, 4.1vw, 56px); }
    .section-head h2 { font-size:24px; }
    .hero-copy p, .section-copy, .device-copy span, .setting-row small { color:var(--muted); }
    .hero-copy p, .section-copy { margin:10px 0 0; line-height:1.7; font-size:15px; max-width:58ch; }
    .hero-badge { display:inline-flex; align-items:center; gap:8px; padding:12px 14px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,.04); color:var(--muted); white-space:nowrap; }
    .hero-badge svg { color:var(--accent-2); }
    .section-head { display:flex; justify-content:space-between; align-items:start; gap:14px; }
    .section-kicker { margin:0 0 8px; color:var(--muted); font-size:11px; letter-spacing:.16em; text-transform:uppercase; }
    .search-row { display:flex; align-items:center; gap:10px; margin-top:16px; padding:0 14px; min-height:50px; border-radius:18px; border:1px solid var(--line); background:rgba(255,255,255,.04); }
    .search-row svg { color:var(--muted); }
    .search { width:100%; background:transparent; color:var(--text); border:0; outline:0; }
    .search::placeholder { color:var(--muted); }
    .device-list { display:grid; gap:10px; margin-top:16px; }
    .device-row { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; padding:16px; border-radius:22px; border:1px solid var(--line); background:rgba(255,255,255,.03); color:inherit; text-align:left; }
    .device-row.active { background:linear-gradient(180deg, rgba(103,161,255,.12), rgba(103,161,255,.06)); }
    .device-icon { width:42px; height:42px; border-radius:14px; display:grid; place-items:center; border:1px solid var(--line); background:rgba(255,255,255,.05); color:var(--muted); flex:0 0 auto; }
    .device-icon.success { color:var(--success); }
    .device-icon.info { color:var(--accent); }
    .device-icon.warning { color:var(--warning); }
    .device-copy { display:grid; gap:4px; flex:1 1 auto; min-width:0; }
    .device-copy strong { font-size:16px; font-weight:600; }
    .device-copy span { font-size:13px; }
    .manual-grid, .split-actions, .meta-grid, .settings-list { display:grid; gap:12px; }
    .manual-grid { grid-template-columns:minmax(0,1fr) 110px auto; margin-top:18px; }
    .field { min-height:48px; padding:0 14px; border-radius:16px; border:1px solid var(--line); background:rgba(255,255,255,.04); color:var(--text); }
    .field.short { text-align:center; }
    .primary, .ghost, .sheet-button { min-height:48px; padding:0 16px; border-radius:16px; border:1px solid var(--line); color:var(--text); background:rgba(255,255,255,.04); }
    .primary { border-color:rgba(103,161,255,.34); background:linear-gradient(180deg, rgba(103,161,255,.18), rgba(103,161,255,.08)); }
    .section-card.soft { margin-top:14px; }
    .split-actions { grid-template-columns:repeat(3, minmax(0, 1fr)); margin-top:16px; }
    .meta-grid { grid-template-columns:repeat(3, minmax(0, 1fr)); margin-top:16px; }
    .meta-grid div { padding:14px; border-radius:18px; border:1px solid var(--line); background:rgba(255,255,255,.03); }
    .meta-grid span, .meta-grid strong { display:block; }
    .meta-grid span { color:var(--muted); font-size:12px; margin-bottom:4px; }
    .note-field { width:100%; min-height:120px; margin-top:16px; padding:16px; border-radius:22px; border:1px solid var(--line); background:rgba(255,255,255,.04); color:var(--text); resize:vertical; }
    .clip-list { display:grid; gap:10px; margin-top:14px; }
    .clip-row { padding:16px; border-radius:20px; border:1px solid var(--line); background:rgba(255,255,255,.03); display:grid; gap:6px; }
    .clip-row strong { font-size:15px; line-height:1.45; }
    .clip-row span { color:var(--muted); font-size:13px; }
    .settings-list { margin-top:16px; }
    .setting-row { padding:16px; border-radius:20px; border:1px solid var(--line); background:rgba(255,255,255,.03); display:grid; gap:4px; }
    .setting-row span { display:inline-flex; align-items:center; gap:8px; font-weight:600; }
    .dock { display:none; }
    @media (max-width:1100px) { .layout { grid-template-columns:1fr; } }
    @media (max-width:860px) {
      .shell { width:min(100vw - 14px, 100%); padding-top:10px; }
      .topbar { flex-direction:column; align-items:start; padding:14px; }
      .topbar-actions { width:100%; }
      .topbar-actions > * { flex:1 1 0; }
      .sidebar, .detail { padding:14px; }
      .manual-grid, .split-actions, .meta-grid { grid-template-columns:1fr; }
      .dock { position:sticky; bottom:12px; z-index:10; display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; margin-top:14px; padding:8px; border-radius:28px; border:1px solid var(--line); background:rgba(16,22,34,.82); backdrop-filter:blur(24px); box-shadow:var(--shadow); }
      :root[data-theme="light"] .dock { background:rgba(255,255,255,.8); }
      .dock-item { min-height:62px; display:grid; place-items:center; gap:4px; border-radius:18px; border:1px solid transparent; color:var(--muted); background:transparent; }
      .dock-item.active { background:linear-gradient(180deg, rgba(103,161,255,.18), rgba(103,161,255,.08)); color:var(--text); }
    }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg></div>
          <div><p>Venturis Lab</p><strong>Clippy</strong></div>
        </div>
        <div class="topbar-actions">
          <span class="theme-switch active">System</span>
          <span class="theme-switch">Calm</span>
          <span class="theme-switch">Frosted</span>
        </div>
      </header>

      <div class="status-row">
        <span class="status-pill success">Connected</span>
        <span class="status-pill danger">Disconnected</span>
        <span class="status-pill">Discovery on</span>
        <span class="status-pill">Relay ready</span>
        <span class="status-pill">Venturis simplicity</span>
      </div>

      <main class="layout">
        <aside class="panel sidebar">
          <section class="section-card">
            <div class="section-head">
              <div>
                <p class="section-kicker">Devices</p>
                <h2>Small list. Clear states. Calm spacing.</h2>
              </div>
              <span class="mini-pill success">Connected</span>
            </div>
            <div class="search-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="5.5"/><path d="M15.5 15.5 19 19"/></svg>
              <input class="search" placeholder="Search a device or setting" />
            </div>
            <div class="device-list">
              <button class="device-row active">
                <div class="device-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 11.5 9.5 15.5 18.5 6.5"/></svg></div>
                <div class="device-copy"><strong>MacBook Air</strong><span>Local LAN · Verified</span></div>
                <span class="mini-pill success">Connected</span>
              </button>
              <button class="device-row">
                <div class="device-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14 14 10"/><path d="M8 6.8H6.5a3.5 3.5 0 0 0 0 7H8"/><path d="M16 17.2h1.5a3.5 3.5 0 0 0 0-7H16"/></svg></div>
                <div class="device-copy"><strong>iPhone 15 Pro</strong><span>192.168.1.42</span></div>
                <span class="mini-pill info">Manual IP</span>
              </button>
              <button class="device-row">
                <div class="device-icon warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/></svg></div>
                <div class="device-copy"><strong>iPad mini</strong><span>Fallback ready</span></div>
                <span class="mini-pill warning">Relay</span>
              </button>
            </div>
          </section>

          <section class="section-card soft">
            <div class="section-head">
              <div>
                <p class="section-kicker">Manual IP</p>
                <h2>Use a host when discovery fails.</h2>
              </div>
              <span class="mini-pill info">Fallback</span>
            </div>
            <div class="manual-grid">
              <input class="field" value="192.168.1.42" />
              <input class="field short" value="1716" />
              <button class="primary">Add host</button>
            </div>
          </section>
        </aside>

        <section class="panel detail">
          <section class="hero-card">
            <div class="hero-copy">
              <p class="section-kicker">Clippy by Venturis Lab</p>
              <h1>Simple, calm, and device-first.</h1>
              <p>A quieter product direction with generous spacing, clear states, and iOS-style structure for both desktop and phone.</p>
            </div>
            <div class="hero-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.5a7 7 0 0 1 9 0"/><path d="M10.5 15.5a3 3 0 0 1 3 0"/><circle cx="12" cy="18" r="1"/></svg> <span>Connected</span></div>
          </section>

          <section class="section-card">
            <div class="section-head">
              <div>
                <p class="section-kicker">Connection</p>
                <h2>Connected, without clutter.</h2>
              </div>
              <span class="mini-pill success">Live</span>
            </div>
            <p class="section-copy">One visible connection, one manual fallback, and no unnecessary surfaces fighting for attention.</p>
            <div class="split-actions">
              <button class="sheet-button">Ping</button>
              <button class="sheet-button">Push clipboard</button>
              <button class="sheet-button">Send file</button>
            </div>
            <div class="meta-grid">
              <div><span>Device</span><strong>MacBook Air</strong></div>
              <div><span>Manual host</span><strong>192.168.1.42</strong></div>
              <div><span>Transport</span><strong>LAN first</strong></div>
            </div>
          </section>

          <section class="section-card soft">
            <div class="section-head">
              <div>
                <p class="section-kicker">Clipboard</p>
                <h2>A quiet notebook for your clips.</h2>
              </div>
              <span class="mini-pill success">Stored locally</span>
            </div>
            <textarea class="note-field">Keep this note visible across devices.</textarea>
            <div class="sheet-actions" style="margin-top:12px;">
              <button class="ghost">Local archive on</button>
              <button class="ghost">Export file</button>
              <button class="primary">Export PDF</button>
            </div>
            <div class="clip-list">
              <article class="clip-row"><strong>Venturis Lab launch notes</strong><span>Project note</span></article>
              <article class="clip-row"><strong>https://clippy.venturis.app/join/MTK7</strong><span>Link</span></article>
              <article class="clip-row"><strong>OTP ••••••</strong><span>Sensitive</span></article>
            </div>
          </section>

          <section class="section-card soft">
            <div class="section-head">
              <div>
                <p class="section-kicker">Settings</p>
                <h2>Plugins, preferences, and permissions.</h2>
              </div>
              <span class="mini-pill">Hub</span>
            </div>
            <div class="settings-list">
              <div class="setting-row"><span>Plugins</span><small>Clipboard, ping, files, remote input</small></div>
              <div class="setting-row"><span>Permissions</span><small>Local network, clipboard, foreground actions</small></div>
              <div class="setting-row"><span>Distribution</span><small>AltStore, SideStore, Xcode, web companion</small></div>
            </div>
          </section>
        </section>
      </main>

      <nav class="dock" aria-label="Main navigation">
        <div class="dock-item active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg><span>Devices</span></div>
        <div class="dock-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/></svg><span>Clipboard</span></div>
        <div class="dock-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5h6a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1Z"/><path d="M8 8h8v10H8z"/><path d="M10 12h4"/></svg><span>Settings</span></div>
      </nav>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};

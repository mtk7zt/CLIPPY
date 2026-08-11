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
      --bg: #f4f7fc;
      --bg-2: #e9eff8;
      --panel: rgba(255, 255, 255, 0.82);
      --surface: rgba(255, 255, 255, 0.92);
      --surface-dark: rgba(17, 24, 39, 0.96);
      --line: rgba(95, 118, 144, 0.14);
      --line-dark: rgba(61, 74, 97, 0.95);
      --text: #111827;
      --muted: #66758b;
      --muted-dark: #adb8c9;
      --accent: #478fff;
      --accent-2: #6bd1ff;
      --success: #3ee58f;
      --warning: #f4bb4f;
      --danger: #ff6b78;
      --shadow: 0 26px 70px rgba(34, 51, 76, 0.12);
      --shadow-dark: 0 30px 80px rgba(0, 0, 0, 0.35);
      --radius-xl: 34px;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #07111d;
        --bg-2: #0c1622;
        --panel: rgba(13, 21, 33, 0.82);
        --surface: rgba(18, 28, 42, 0.68);
        --line: rgba(149, 173, 204, 0.15);
        --text: #f5f8fc;
        --muted: #96a7bc;
        --shadow: var(--shadow-dark);
      }
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at top left, rgba(103, 161, 255, 0.14), transparent 28%),
        radial-gradient(circle at 88% 12%, rgba(107, 209, 255, 0.1), transparent 18%),
        linear-gradient(180deg, var(--bg), var(--bg-2));
      color: var(--text);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    body { min-height: 100vh; }
    svg { display: block; width: 1em; height: 1em; }
    .canvas { position: relative; min-height: 100vh; overflow: hidden; }
    .ambient { position: absolute; inset: auto; pointer-events: none; filter: blur(64px); opacity: 0.8; }
    .ambient-a { width: 420px; height: 420px; left: -100px; top: 10px; background: radial-gradient(circle, rgba(103, 161, 255, 0.22), transparent 72%); }
    .ambient-b { width: 520px; height: 520px; right: -140px; bottom: -140px; background: radial-gradient(circle, rgba(62, 229, 143, 0.12), transparent 72%); }
    .shell { position: relative; width: min(1120px, calc(100vw - 20px)); margin: 0 auto; padding: 18px 0 26px; }
    .topbar, .section-card, .phone-card, .manual-card, .device-item, .bottom-tabbar, .note-field, .setting-row {
      border: 1px solid var(--line); background: var(--panel); backdrop-filter: blur(22px); box-shadow: var(--shadow);
    }
    .topbar { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:16px 18px; border-radius:var(--radius-xl); }
    .brand { display:flex; align-items:center; gap:14px; }
    .brand-mark { width:42px; height:42px; border-radius:15px; display:grid; place-items:center; border:1px solid rgba(71,143,255,.28); background:linear-gradient(180deg, rgba(71,143,255,.2), rgba(71,143,255,.08)); color:var(--accent-2); }
    .brand p, .brand strong { margin:0; line-height:1.1; }
    .brand p { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
    .brand strong { font-size:22px; font-weight:700; letter-spacing:-.04em; }
    .topbar-actions, .status-row, .sheet-actions, .clip-list, .settings-list { display:flex; gap:10px; flex-wrap:wrap; }
    .theme-switch, .status-pill, .mini-pill, .pill-button, .connect-button, .ghost, .primary, .tab-item { display:inline-flex; align-items:center; justify-content:center; gap:8px; }
    .theme-switch, .status-pill, .mini-pill { min-height:38px; padding:0 14px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--muted); }
    .theme-switch.active, .mini-pill.success, .status-pill.success { border-color:rgba(62,229,143,.24); background:rgba(62,229,143,.12); color:var(--success); }
    .mini-pill.warning, .status-pill.warning { border-color:rgba(244,187,79,.24); background:rgba(244,187,79,.12); color:var(--warning); }
    .mini-pill.danger, .status-pill.danger { border-color:rgba(255,107,120,.24); background:rgba(255,107,120,.12); color:var(--danger); }
    .mini-pill { font-size:13px; }
    .status-row { padding:14px 2px 18px; }
    .stage { display:flex; justify-content:center; }
    .section-card { width:100%; border-radius:var(--radius-xl); padding:20px; background:var(--surface); }
    .section-head { display:flex; align-items:start; justify-content:space-between; gap:14px; }
    .section-kicker { margin:0 0 8px; color:var(--muted); font-size:11px; letter-spacing:.16em; text-transform:uppercase; }
    .section-head h2, .phone-top h1 { margin:0; line-height:1.05; letter-spacing:-.05em; }
    .section-head h2 { font-size:24px; }
    .section-copy, .subtitle, .device-item span, .setting-row small { color:var(--muted); }
    .section-copy, .subtitle { margin:10px 0 0; line-height:1.65; max-width:60ch; }
    .phone-card { width:min(334px, 100%); margin:18px auto 0; padding:18px 18px 14px; border-radius:30px; background:var(--surface-dark); border-color:var(--line-dark); box-shadow:var(--shadow-dark); }
    .phone-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .phone-top h1 { font-size:18px; color:#f5f7fc; }
    .pill-button { width:72px; height:34px; border-radius:999px; background:var(--accent); color:#fff; }
    .subtitle { margin-bottom:12px; color:#b5c0d0; font-size:12px; max-width:280px; }
    .manual-card { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-radius:18px; background:#1a1f2e; border-color:#3d4a61; }
    .manual-card strong { display:block; font-size:14px; color:#f5f7fc; }
    .manual-card span { display:block; color:var(--muted-dark); font-size:12px; margin-top:4px; line-height:1.35; max-width:210px; }
    .connect-button { min-width:72px; min-height:34px; padding:0 14px; border-radius:999px; background:var(--accent); color:#fff; }
    .device-list { display:grid; gap:10px; margin-top:10px; }
    .device-item { display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:30px; padding:8px 12px; border-radius:14px; background:#243045; border-color:#3d4a61; color:#f5f7fc; text-align:left; }
    .device-item.warning, .device-item.neutral { background:#171c29; }
    .device-item strong { font-size:12px; font-weight:600; }
    .device-item span { font-size:12px; color:#adb8c9; }
    .bottom-tabbar { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; margin-top:12px; padding:6px; border-radius:20px; background:#171c29; border-color:#3d4a61; }
    .tab-item { min-height:52px; flex-direction:column; gap:3px; border-radius:16px; background:transparent; color:#b9c4d3; }
    .tab-item.active { background:rgba(71,143,255,.18); color:#6bd1ff; }
    .tab-item svg { width:18px; height:18px; }
    .note-field { width:100%; min-height:120px; margin-top:14px; padding:16px; border-radius:22px; background:rgba(255,255,255,.04); color:var(--text); resize:vertical; }
    .ghost, .primary { min-height:40px; padding:0 14px; border-radius:14px; border:1px solid var(--line); color:var(--text); background:rgba(255,255,255,.04); }
    .primary { border-color:rgba(71,143,255,.34); background:linear-gradient(180deg, rgba(71,143,255,.2), rgba(71,143,255,.08)); }
    .clip-list { display:grid; gap:10px; margin-top:14px; }
    .clip-item, .setting-row { padding:14px; border-radius:20px; border:1px solid var(--line); background:rgba(255,255,255,.03); }
    .clip-item { display:grid; gap:4px; }
    .clip-item strong { font-size:15px; line-height:1.4; }
    .clip-item span { color:var(--muted); font-size:13px; }
    .settings-list { display:grid; gap:10px; margin-top:14px; }
    .setting-row { display:grid; gap:4px; }
    .setting-row span { display:inline-flex; align-items:center; gap:8px; font-weight:600; }
    @media (min-width:900px) { .stage { padding-top:6px; } .section-card { width:min(880px, 100%); } }
    @media (max-width:700px) {
      .shell { width:min(100vw - 12px, 100%); padding-top:10px; }
      .topbar { flex-direction:column; align-items:start; padding:14px; }
      .topbar-actions > * { flex:1 1 0; }
      .section-card { padding:16px; }
      .status-row { padding-bottom:14px; }
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
          <div class="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>
          </div>
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
        <span class="status-pill">Local LAN</span>
        <span class="status-pill">System</span>
      </div>

      <main class="stage">
        <section class="section-card">
          <div class="section-head">
            <div>
              <p class="section-kicker">Devices</p>
              <h2>Single-column device view.</h2>
            </div>
            <span class="mini-pill success">Connected</span>
          </div>
          <p class="section-copy">Keep the layout simple enough that the user always knows where they are.</p>

          <section class="phone-card">
            <div class="phone-top">
              <h1>Devices</h1>
              <button class="pill-button" aria-label="Add device">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <p class="subtitle">The app should collapse cleanly into a single-column device view with sticky actions and no hidden controls.</p>
            <div class="manual-card">
              <div><strong>Add device manually</strong><span>Enter the IP shown on the other device.</span></div>
              <button class="connect-button">Connect</button>
            </div>
            <div class="device-list">
              <button class="device-item"><strong>Venturis-MacBook</strong><span>Local LAN</span></button>
              <button class="device-item warning"><strong>Pixel 7</strong><span>Relay fallback</span></button>
              <button class="device-item neutral"><strong>Clipboard inbox</strong><span>Recent clips</span></button>
            </div>
            <div class="bottom-tabbar">
              <button class="tab-item active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>
                <span>Devices</span>
              </button>
              <button class="tab-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/></svg>
                <span>Clipboard</span>
              </button>
              <button class="tab-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5h6a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1Z"/><path d="M8 8h8v10H8z"/><path d="M10 12h4"/></svg>
                <span>Settings</span>
              </button>
            </div>
          </section>
        </section>
      </main>
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

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
      --panel: rgba(13, 21, 33, 0.84);
      --surface: rgba(18, 28, 42, 0.72);
      --line: rgba(149, 173, 204, 0.16);
      --text: #f5f8fc;
      --muted: #9aabbe;
      --accent: #67a1ff;
      --accent-2: #91d8ff;
      --success: #3ee58f;
      --warning: #f4bb4f;
      --danger: #ff6b78;
      --shadow: 0 32px 90px rgba(0, 0, 0, 0.34);
      --radius-xl: 34px;
      --radius-lg: 26px;
      --radius-md: 18px;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f4f7fc;
        --bg-2: #e9eff8;
        --panel: rgba(255, 255, 255, 0.76);
        --surface: rgba(255, 255, 255, 0.9);
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
        radial-gradient(circle at top left, rgba(103, 161, 255, 0.18), transparent 28%),
        radial-gradient(circle at 88% 10%, rgba(145, 216, 255, 0.16), transparent 20%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
      color: var(--text);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    body { min-height: 100vh; }
    svg { display: block; width: 1em; height: 1em; }

    .canvas {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
      padding: 18px 0 24px;
    }

    .ambient {
      position: absolute;
      inset: auto;
      filter: blur(60px);
      opacity: 0.8;
      pointer-events: none;
    }
    .ambient-a {
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(103, 161, 255, 0.3), transparent 70%);
      left: -80px; top: 18px;
    }
    .ambient-b {
      width: 520px; height: 520px;
      background: radial-gradient(circle, rgba(62, 229, 143, 0.16), transparent 72%);
      right: -120px; bottom: -120px;
    }

    .shell {
      position: relative;
      width: min(1540px, calc(100vw - 24px));
      margin: 0 auto;
    }

    .topbar, .panel, .hero-card, .surface-card, .note-card, .theme-card {
      border: 1px solid var(--line);
      background: var(--panel);
      backdrop-filter: blur(24px);
      box-shadow: var(--shadow);
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border-radius: calc(var(--radius-xl) - 4px);
    }

    .brand {
      display: flex; align-items: center; gap: 14px; min-width: 0;
    }
    .brand-mark {
      width: 42px; height: 42px; border-radius: 15px;
      display: grid; place-items: center;
      border: 1px solid rgba(103, 161, 255, 0.35);
      background: linear-gradient(180deg, rgba(103, 161, 255, 0.2), rgba(103, 161, 255, 0.08));
      color: var(--accent-2);
    }
    .brand-mark svg { width: 20px; height: 20px; }
    .brand p, .brand strong { margin: 0; line-height: 1.1; }
    .brand p {
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .brand strong { font-size: 22px; font-weight: 700; letter-spacing: -0.04em; }
    .topbar-actions, .status-row, .sheet-actions, .clip-actions {
      display: flex; gap: 8px; flex-wrap: wrap;
    }

    .chip, .theme-switch, .seg-button, .toggle, .ghost, .primary, .sheet-button, .mini-action, .dock-item, .theme-card {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      transition: transform 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease;
    }
    .theme-switch, .seg-button, .toggle, .chip {
      min-height: 38px; padding: 0 14px; border-radius: 999px;
      border: 1px solid var(--line); background: rgba(255,255,255,0.03); color: var(--muted);
    }
    .theme-switch.active, .seg-button.active, .toggle.on {
      border-color: rgba(103,161,255,0.4);
      background: linear-gradient(180deg, rgba(103,161,255,0.18), rgba(103,161,255,0.08));
      color: var(--text);
    }
    .chip.success, .mini-pill.success { color: var(--success); border-color: rgba(62,229,143,0.25); background: rgba(62,229,143,0.12); }
    .chip.warning, .mini-pill.warning { color: var(--warning); border-color: rgba(244,187,79,0.25); background: rgba(244,187,79,0.12); }
    .chip.danger, .mini-pill.danger { color: var(--danger); border-color: rgba(255,107,120,0.25); background: rgba(255,107,120,0.12); }
    .chip.info, .mini-pill.info { color: var(--accent); border-color: rgba(103,161,255,0.25); background: rgba(103,161,255,0.12); }

    .status-row { padding: 14px 2px 18px; }
    .status-pill, .mini-pill {
      display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
      border-radius: 999px; border: 1px solid var(--line); padding: 0 12px; min-height: 34px;
      background: rgba(255,255,255,0.03); color: var(--muted); font-size: 13px;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(360px, 0.95fr) minmax(460px, 1.05fr);
      gap: 16px;
      align-items: start;
    }
    .panel { border-radius: var(--radius-xl); overflow: hidden; }
    .sidebar, .detail { padding: 18px; }

    .group { margin-bottom: 14px; }
    .group-head, .surface-head, .note-head {
      display: flex; align-items: start; justify-content: space-between; gap: 14px;
    }
    .section-kicker, .eyebrow {
      margin: 0 0 8px; color: var(--muted); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    }
    .group-head h3, .surface-head h2, .hero-copy h1 {
      margin: 0; letter-spacing: -0.05em; line-height: 1.02;
    }
    .group-head h3 { font-size: 18px; }
    .hero-copy h1 { font-size: clamp(34px, 4.4vw, 56px); }
    .hero-copy p, .surface-copy, .row-main span, .cell-copy span, .row-main small, .cell-copy small {
      color: var(--muted);
    }
    .hero-copy p, .surface-copy { margin: 10px 0 0; line-height: 1.7; font-size: 15px; }

    .search-wrap {
      display: flex; align-items: center; gap: 10px;
      margin-top: 12px; padding: 0 14px; min-height: 46px;
      border-radius: 16px; border: 1px solid var(--line); background: rgba(255,255,255,0.05);
    }
    .search-wrap svg { color: var(--muted); flex: 0 0 auto; }
    .search { width: 100%; background: transparent; color: var(--text); }
    .search::placeholder { color: var(--muted); }

    .segmented {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px; padding: 8px;
      border-radius: 22px; border: 1px solid var(--line); background: rgba(255,255,255,0.04);
    }
    .segmented.compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .seg-button { width: 100%; min-height: 44px; border-radius: 16px; font-size: 14px; }

    .list {
      margin-top: 12px;
      border-radius: 22px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.04);
      overflow: hidden;
    }
    .row, .cell {
      display: flex; align-items: center; gap: 12px; width: 100%;
      padding: 15px 16px;
    }
    .row + .row, .cell + .cell { border-top: 1px solid var(--line); }
    .row.stack { align-items: start; flex-direction: column; }
    .row-main, .cell-copy { display: grid; gap: 4px; flex: 1 1 auto; min-width: 0; }
    .row-main strong, .cell-copy strong { font-size: 16px; font-weight: 600; }

    .row-icon, .cell-icon, .transfer-icon {
      flex: 0 0 auto; width: 38px; height: 38px; border-radius: 13px;
      display: grid; place-items: center; border: 1px solid var(--line); background: rgba(255,255,255,0.06); color: var(--muted);
    }
    .cell { text-align: left; justify-content: space-between; color: inherit; background: transparent; }
    .cell.active { background: linear-gradient(180deg, rgba(103,161,255,0.14), rgba(103,161,255,0.06)); }
    .cell-meta { display: flex; align-items: center; gap: 10px; color: var(--muted); }
    .mini-pill { min-height: 28px; padding: 0 10px; font-size: 12px; }

    .hero-card, .surface-card, .note-card, .theme-card {
      border-radius: 28px;
      border: 1px solid var(--line);
      background: var(--surface);
      backdrop-filter: blur(18px);
    }
    .hero-card {
      display: flex; align-items: start; justify-content: space-between; gap: 20px;
      margin-bottom: 14px; padding: 20px;
    }
    .hero-card.danger { border-color: rgba(255,107,120,0.28); background: linear-gradient(180deg, rgba(255,107,120,0.1), rgba(255,255,255,0.04)); }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 14px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255,255,255,0.04);
      color: var(--muted); white-space: nowrap;
    }
    .hero-badge svg { color: var(--accent-2); }

    .surface-card { padding: 18px; margin-bottom: 14px; }
    .surface-head h2 { font-size: 24px; }
    .action-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
    }
    .sheet-button, .ghost, .primary, .mini-action {
      min-height: 40px; padding: 0 14px; border-radius: 14px;
      border: 1px solid var(--line); color: var(--text); background: rgba(255,255,255,0.04);
    }
    .primary { border-color: rgba(103,161,255,0.36); background: linear-gradient(180deg, rgba(103,161,255,0.22), rgba(103,161,255,0.1)); }
    .ghost { color: var(--muted); }
    .mini-action { min-height: 34px; padding: 0 10px; color: var(--muted); }
    .device-meta {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 14px;
    }
    .device-meta div {
      padding: 12px; border-radius: 16px; border: 1px solid var(--line); background: rgba(255,255,255,0.03);
    }
    .device-meta span, .device-meta strong { display: block; }
    .device-meta span { color: var(--muted); font-size: 12px; margin-bottom: 5px; }

    .note-card { padding: 16px; margin-bottom: 14px; }
    .note-head { align-items: center; margin-bottom: 12px; }
    .note-field {
      width: 100%; min-height: 104px; padding: 14px 14px 12px; border-radius: 18px;
      border: 1px solid var(--line); background: rgba(255,255,255,0.05); color: var(--text); resize: vertical;
    }

    .clip-row { align-items: start; }
    .clip-actions { flex: 0 0 auto; }
    .transfer-icon.success { color: var(--success); }
    .transfer-icon.warning { color: var(--warning); }
    .transfer-icon.neutral { color: var(--accent); }
    .theme-stack { display: grid; gap: 10px; margin-top: 14px; }
    .theme-card {
      width: 100%; padding: 16px; text-align: left; color: var(--text);
    }
    .theme-card strong, .theme-card span { display: block; }
    .theme-card strong { font-size: 15px; margin-bottom: 4px; }
    .theme-card span { color: var(--muted); }
    .theme-card.active { border-color: rgba(103,161,255,0.38); background: linear-gradient(180deg, rgba(103,161,255,0.16), rgba(103,161,255,0.08)); }

    .inline-fields {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 110px auto;
      gap: 10px;
      width: 100%;
    }
    .field {
      min-width: 0; width: 100%; min-height: 42px; padding: 0 14px;
      border-radius: 14px; border: 1px solid var(--line); background: rgba(255,255,255,0.05); color: var(--text);
    }
    .field.short { text-align: center; }

    .dock { display: none; }

    @media (max-width: 1100px) {
      .layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 860px) {
      .shell { width: min(100vw - 14px, 100%); padding-top: 10px; }
      .topbar { padding: 12px 14px; border-radius: 28px; align-items: start; flex-direction: column; }
      .topbar-actions { width: 100%; }
      .topbar-actions > * { flex: 1 1 0; }
      .sidebar, .detail { padding: 14px; }
      .segmented, .action-grid, .device-meta, .inline-fields { grid-template-columns: 1fr; }
      .dock {
        position: sticky; bottom: 12px; z-index: 10;
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;
        margin-top: 14px; padding: 8px; border-radius: 28px; border: 1px solid var(--line);
        background: rgba(16,22,34,0.82); backdrop-filter: blur(24px); box-shadow: var(--shadow);
      }
      .dock-item {
        display: grid; place-items: center; gap: 4px; min-height: 62px; border-radius: 18px;
        color: var(--muted); background: transparent; border: 1px solid transparent;
      }
      .dock-item.active { background: linear-gradient(180deg, rgba(103,161,255,0.2), rgba(103,161,255,0.08)); color: var(--text); }
      .dock-item svg { width: 20px; height: 20px; }
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/>
            </svg>
          </div>
          <div>
            <p>Venturis Lab</p>
            <strong>Clippy</strong>
          </div>
        </div>
        <div class="topbar-actions">
          <span class="chip success">Connected</span>
          <span class="chip danger">Disconnected</span>
          <span class="chip info">Manual IP</span>
          <span class="chip">System theme</span>
        </div>
      </header>

      <div class="status-row">
        <span class="status-pill success">Connected</span>
        <span class="status-pill danger">Disconnected</span>
        <span class="status-pill">Discovery on</span>
        <span class="status-pill">Relay fallback</span>
        <span class="status-pill">Venturis Calm / Frosted Suite</span>
      </div>

      <main class="layout">
        <aside class="panel sidebar">
          <section class="group">
            <div class="group-head">
              <div>
                <p class="section-kicker">Navigation</p>
                <h3>Mobile-first layout, desktop-friendly split view.</h3>
              </div>
            </div>
            <div class="segmented">
              <button class="seg-button active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>
                <span>Devices</span>
              </button>
              <button class="seg-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/></svg>
                <span>Clipboard</span>
              </button>
              <button class="seg-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 6.5h7l2 2.5h4V18h-13z"/><path d="M8 11h6M8 14h6"/></svg>
                <span>Files</span>
              </button>
              <button class="seg-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5.5h6a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1Z"/><path d="M8 8h8v10H8z"/><path d="M10 12h4"/></svg>
                <span>Settings</span>
              </button>
            </div>
          </section>

          <section class="group">
            <div class="group-head">
              <div>
                <p class="section-kicker">Search</p>
                <h3>Find a device, clip, or setting.</h3>
              </div>
            </div>
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="5.5"/><path d="M15.5 15.5 19 19"/></svg>
              <input class="search" value="" placeholder="Search..." />
            </div>
          </section>

          <section class="group">
            <div class="group-head">
              <div>
                <p class="section-kicker">Devices</p>
                <h3>Connected, manual, and remembered.</h3>
              </div>
            </div>
            <div class="list">
              <button class="cell active">
                <div class="cell-icon success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 11.5 9.5 15.5 18.5 6.5"/></svg>
                </div>
                <div class="cell-copy">
                  <strong>MacBook Air</strong>
                  <span>Connected · Local LAN · 192.168.1.71</span>
                  <small>Clipboard, files, ping, and remote input are live.</small>
                </div>
                <div class="cell-meta">
                  <span class="mini-pill success">Connected</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5 14.5 12 9 17.5"/></svg>
                </div>
              </button>
              <button class="cell">
                <div class="cell-icon info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6.5h8M9 5h6a1 1 0 0 1 1 1v1H8V6a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/></svg>
                </div>
                <div class="cell-copy">
                  <strong>iPhone 15 Pro</strong>
                  <span>Manual host · 192.168.1.42</span>
                  <small>Foreground-only clipboard and file actions.</small>
                </div>
                <div class="cell-meta">
                  <span class="mini-pill info">Manual IP</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5 14.5 12 9 17.5"/></svg>
                </div>
              </button>
              <button class="cell">
                <div class="cell-icon warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/></svg>
                </div>
                <div class="cell-copy">
                  <strong>iPad mini</strong>
                  <span>Remembered · Relay fallback ready</span>
                  <small>Encrypted fallback path when LAN discovery is blocked.</small>
                </div>
                <div class="cell-meta">
                  <span class="mini-pill warning">Relay</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5 14.5 12 9 17.5"/></svg>
                </div>
              </button>
            </div>
          </section>

          <section class="group">
            <div class="group-head">
              <div>
                <p class="section-kicker">Discovery & pairing</p>
                <h3>When discovery fails, add the host manually.</h3>
              </div>
              <span class="mini-pill danger">Disconnected turns red</span>
            </div>
            <div class="list">
              <label class="row">
                <div class="row-main">
                  <strong>Local discovery</strong>
                  <span>Default first path on trusted networks.</span>
                </div>
                <span class="toggle on">On</span>
              </label>
              <div class="row stack">
                <div class="row-main">
                  <strong>Manual IP / host</strong>
                  <span>Use a trusted address when multicast is blocked.</span>
                </div>
                <div class="inline-fields">
                  <input class="field" value="192.168.1.42" />
                  <input class="field short" value="1716" />
                  <button class="primary">Add trusted host</button>
                </div>
              </div>
              <label class="row">
                <div class="row-main">
                  <strong>Relay fallback</strong>
                  <span>Encrypted fallback path when LAN is unavailable.</span>
                </div>
                <span class="toggle on">On</span>
              </label>
            </div>
          </section>
        </aside>

        <section class="panel detail">
          <section class="hero-card danger">
            <div class="hero-copy">
              <p class="eyebrow">Clippy by Venturis Lab</p>
              <h1>Connected / Disconnected / Manual IP — all visible at a glance</h1>
              <p>Large titles, grouped lists, sheet-style actions, and a notebook clipboard now feel closer to iOS kit behavior. The disconnected state is red and explicit, not hidden.</p>
            </div>
            <div class="hero-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/></svg>
              <span>Manual IP required</span>
            </div>
          </section>

          <section class="surface-card">
            <div class="surface-head">
              <div>
                <p class="section-kicker">Connected device</p>
                <h2>MacBook Air</h2>
              </div>
              <span class="mini-pill success">Connected</span>
            </div>
            <p class="surface-copy">Primary desktop for transfers, clipboard, and remote input. The live UI keeps connection state honest and readable.</p>
            <div class="action-grid">
              <button class="sheet-button">Ping</button>
              <button class="sheet-button">Push clipboard</button>
              <button class="sheet-button">Send files</button>
              <button class="sheet-button">Remote input</button>
            </div>
            <div class="device-meta">
              <div><span>Battery</span><strong>87%</strong></div>
              <div><span>Signal</span><strong>Strong</strong></div>
              <div><span>Transport</span><strong>Local LAN</strong></div>
            </div>
          </section>

          <section class="note-card">
            <div class="note-head">
              <div>
                <p class="section-kicker">Clipboard notebook</p>
                <h3>Every clip becomes a note you can keep, export, or archive locally.</h3>
              </div>
              <span class="mini-pill success">Stored locally</span>
            </div>
            <textarea class="note-field">Keep this note visible across devices.</textarea>
            <div class="sheet-actions" style="margin-top:12px;">
              <button class="ghost">Keep local archive</button>
              <button class="ghost">Export as file</button>
              <button class="primary">Export PDF</button>
            </div>
            <div class="list" style="margin-top:14px;">
              <article class="row clip-row">
                <div class="row-main">
                  <strong>Venturis Lab launch notes — tighten spacing, soften corners, keep large titles.</strong>
                  <span>MacBook Air · 18s ago</span>
                  <small>Project note</small>
                </div>
                <div class="clip-actions">
                  <button class="mini-action">Save</button>
                  <button class="mini-action">PDF</button>
                </div>
              </article>
              <article class="row clip-row">
                <div class="row-main">
                  <strong>https://clippy.venturis.app/join/MTK7</strong>
                  <span>iPhone 15 Pro · 3m ago</span>
                  <small>Link</small>
                </div>
                <div class="clip-actions">
                  <button class="mini-action">Save</button>
                  <button class="mini-action">PDF</button>
                </div>
              </article>
              <article class="row clip-row">
                <div class="row-main">
                  <strong>OTP ••••••</strong>
                  <span>iPad mini · 12m ago</span>
                  <small>Sensitive</small>
                </div>
                <div class="clip-actions">
                  <button class="mini-action">Save</button>
                  <button class="mini-action">PDF</button>
                </div>
              </article>
            </div>
          </section>

          <section class="surface-card">
            <div class="surface-head">
              <div>
                <p class="section-kicker">Settings hub</p>
                <h2>Plugins, style modes, and permissions live here.</h2>
              </div>
              <span class="mini-pill">Settings</span>
            </div>
            <div class="list">
              <div class="row">
                <div class="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 6h2a2 2 0 1 1 3 0h2.5v3a2 2 0 1 1 0 3V15H13a2 2 0 1 1-4 0H6V12.5a2 2 0 1 1 0-3V6Z"/></svg>
                </div>
                <div class="row-main">
                  <strong>Plugins</strong>
                  <span>Clipboard, ping, files, find device, and remote input.</span>
                </div>
                <button class="mini-action">›</button>
              </div>
              <div class="row">
                <div class="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 5a7 7 0 1 1-7 7c0-1.8 1.2-2.5 2.6-2.5h2.1A2.3 2.3 0 0 0 13 7.2V5Z"/></svg>
                </div>
                <div class="row-main">
                  <strong>Style modes</strong>
                  <span>Venturis Calm for dark, Frosted Suite for light, or System.</span>
                </div>
                <button class="mini-action">›</button>
              </div>
              <div class="row">
                <div class="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5 18 7v5c0 4-2.8 6.8-6 8.5C8.8 18.8 6 16 6 12V7Z"/><path d="M9.5 12.2 11.4 14 14.8 10.2"/></svg>
                </div>
                <div class="row-main">
                  <strong>Permissions</strong>
                  <span>Location, local network, clipboard, and foreground actions.</span>
                </div>
                <button class="mini-action">›</button>
              </div>
              <div class="row">
                <div class="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6.5h8a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 16 19.5H8A1.5 1.5 0 0 1 6.5 18V8A1.5 1.5 0 0 1 8 6.5Z"/><path d="M10 16h4"/></svg>
                </div>
                <div class="row-main">
                  <strong>Distribution</strong>
                  <span>AltStore, SideStore, direct Xcode install, and web companion.</span>
                </div>
                <button class="mini-action">›</button>
              </div>
            </div>
            <div class="theme-stack">
              <div class="theme-card active">
                <strong>System</strong>
                <span>Follow the OS theme automatically.</span>
              </div>
              <div class="theme-card">
                <strong>Venturis Calm</strong>
                <span>Dark, polished, soft glass surfaces.</span>
              </div>
              <div class="theme-card">
                <strong>Frosted Suite</strong>
                <span>Light, friendly, and mobile-first.</span>
              </div>
            </div>
          </section>

          <section class="surface-card">
            <div class="surface-head">
              <div>
                <p class="section-kicker">File transfers</p>
                <h2>Receiving, sending, and errors stay visible.</h2>
              </div>
              <div class="segmented compact">
                <button class="seg-button active">Receiving</button>
                <button class="seg-button">Sending</button>
                <button class="seg-button">Errored</button>
              </div>
            </div>
            <div class="list" style="margin-top:14px;">
              <article class="row transfer-row">
                <div class="transfer-icon success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 11.5 9.5 15.5 18.5 6.5"/></svg>
                </div>
                <div class="row-main">
                  <strong>Quarterly deck.pdf</strong>
                  <span>52 MB · 84% complete</span>
                  <small>Sending to iPhone 15 Pro</small>
                </div>
                <button class="mini-action">›</button>
              </article>
              <article class="row transfer-row">
                <div class="transfer-icon warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.8 20 18H4z"/><path d="M12 9v4.5M12 15.8h.01"/></svg>
                </div>
                <div class="row-main">
                  <strong>IMG_8291.heic</strong>
                  <span>13 MB · queued</span>
                  <small>Waiting for foreground return</small>
                </div>
                <button class="mini-action">›</button>
              </article>
              <article class="row transfer-row">
                <div class="transfer-icon neutral">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h7a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 6 11.7 3 3 0 0 0 9 18Z"/></svg>
                </div>
                <div class="row-main">
                  <strong>release-build.zip</strong>
                  <span>218 MB · relay fallback</span>
                  <small>Delivered to MacBook Air</small>
                </div>
                <button class="mini-action">›</button>
              </article>
            </div>
          </section>
        </section>
      </main>

      <nav class="dock" aria-label="Main navigation">
        <div class="dock-item active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>
          <span>Devices</span>
        </div>
        <div class="dock-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/></svg>
          <span>Clipboard</span>
        </div>
        <div class="dock-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 6.5h7l2 2.5h4V18h-13z"/><path d="M8 11h6M8 14h6"/></svg>
          <span>Files</span>
        </div>
        <div class="dock-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5.5h6a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1Z"/><path d="M8 8h8v10H8z"/><path d="M10 12h4"/></svg>
          <span>Settings</span>
        </div>
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

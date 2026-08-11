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
      color-scheme: light dark;
      --page-bg: #ffffff;
      --page-text: #171c29;
      --page-muted: #697385;
      --chip-border: #d6dbe8;
      --chip-bg: #ffffff;
      --accent: #478fff;
      --accent-2: #6bd1ff;
      --shadow: 0 20px 50px rgba(14, 20, 35, 0.08);
      --phone-bg: #0f141f;
      --phone-border: #333b4d;
      --phone-surface: #1a1f2e;
      --phone-row-a: #243045;
      --phone-row-b: #171c29;
      --phone-text: #f5f7fc;
      --phone-subtext: #adb8c9;
      --phone-line: #3d4a61;
      --radius-xl: 30px;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    :root[data-theme="dark"] {
      --page-bg: #0b101a;
      --page-text: #f5f7fc;
      --page-muted: #adb8c9;
      --chip-border: #3d4a61;
      --chip-bg: #131827;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background: var(--page-bg);
      color: var(--page-text);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    body { min-height: 100vh; }
    button, input, textarea { font: inherit; }
    button { border: 0; cursor: pointer; }
    svg { display: block; width: 1em; height: 1em; }
    #app { min-height: 100vh; }
    .page {
      width: min(100vw - 32px, 1840px);
      margin: 0 auto;
      padding: 0 0 28px;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 18px 0 14px;
    }
    .brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .brand-mark {
      width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center;
      border: 1px solid var(--chip-border); background: var(--chip-bg); color: var(--page-text); box-shadow: var(--shadow);
    }
    .brand p, .brand strong { margin: 0; line-height: 1.1; }
    .brand p { color: var(--page-muted); font-size: 12px; letter-spacing: 0.02em; margin-bottom: 6px; }
    .brand strong { font-size: 18px; font-weight: 600; letter-spacing: -0.03em; }
    .theme-pills { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .theme-pill {
      min-height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--chip-border);
      background: var(--chip-bg); color: var(--page-text); font-size: 13px; font-weight: 500;
    }
    .theme-pill.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .copy-block { padding: 10px 0 20px; max-width: 860px; }
    .kicker { margin: 0 0 12px; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; line-height: 1.1; }
    .copy-block h1 {
      margin: 0; font-size: clamp(17px, 2.3vw, 18px); line-height: 1.45; font-weight: 400; color: var(--page-muted); max-width: 760px;
    }
    .phone-mock {
      width: min(334px, 100%);
      min-height: 256px;
      margin: 0;
      padding: 16px 17px 14px;
      border-radius: 30px;
      background: var(--phone-bg);
      border: 1px solid var(--phone-border);
      overflow: hidden;
    }
    .phone-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .phone-header h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.04em; color: var(--phone-text); }
    .plus-pill, .connect-pill {
      display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--accent); color: #fff;
      box-shadow: 0 8px 18px rgba(71, 143, 255, 0.24);
    }
    .plus-pill { width: 72px; height: 34px; }
    .plus-pill svg { width: 14px; height: 14px; }
    .phone-subtitle { margin: 10px 0 12px; color: #b5c0d0; font-size: 12px; line-height: 1.35; max-width: 280px; }
    .manual-card {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 70px;
      padding: 12px 12px 12px 13px; border-radius: 18px; border: 1px solid var(--phone-line); background: var(--phone-surface);
    }
    .manual-copy { min-width: 0; }
    .manual-copy strong { display: block; color: var(--phone-text); font-size: 14px; line-height: 1.2; font-weight: 600; }
    .manual-copy span { display: block; margin-top: 4px; color: var(--phone-subtext); font-size: 12px; line-height: 1.35; max-width: 220px; }
    .connect-pill { min-width: 72px; min-height: 34px; padding: 0 12px; font-size: 13px; font-weight: 600; }
    .device-stack { display: grid; gap: 12px; margin-top: 12px; }
    .device-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 30px; padding: 6px 12px;
      border-radius: 14px; border: 1px solid var(--phone-line); color: var(--phone-text);
    }
    .device-row strong { font-size: 12px; font-weight: 600; letter-spacing: -0.02em; }
    .device-row span { color: var(--phone-subtext); font-size: 12px; }
    .device-row.local { background: var(--phone-row-a); }
    .device-row.relay, .device-row.inbox { background: var(--phone-row-b); }
    .bottom-nav {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; margin-top: 10px; padding: 0; height: 26px; align-items: center;
    }
    .nav-item {
      display: flex; align-items: center; justify-content: center; gap: 4px; padding: 0; height: 26px; background: transparent;
      color: #5fa7ff; font-size: 12px; font-weight: 700; letter-spacing: -0.02em;
    }
    .nav-item svg { width: 11px; height: 11px; }
    @media (max-width: 700px) {
      .page { width: min(100vw - 16px, 100%); }
      .topbar { align-items: start; flex-direction: column; padding-bottom: 10px; }
      .theme-pills { width: 100%; justify-content: stretch; }
      .theme-pill { flex: 1 1 0; }
      .copy-block { padding-bottom: 16px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>
        </div>
        <div>
          <p>Clippy by Venturis Lab</p>
          <strong>Cross-platform device link</strong>
        </div>
      </div>
      <div class="theme-pills">
        <button class="theme-pill active" data-theme="system">System theme</button>
        <button class="theme-pill" data-theme="dark">Dark</button>
        <button class="theme-pill" data-theme="light">Light</button>
      </div>
    </div>

    <section class="copy-block">
      <p class="kicker">Mobile friendliness</p>
      <h1>The app should collapse cleanly into a single-column device view with sticky actions and no hidden controls.</h1>
    </section>

    <section class="phone-mock" aria-label="Clippy mobile reference mock">
      <header class="phone-header">
        <h2>Devices</h2>
        <button class="plus-pill" type="button" aria-label="Add device">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </header>

      <p class="phone-subtitle">The app should collapse cleanly into a single-column device view with sticky actions and no hidden controls.</p>

      <section class="manual-card">
        <div class="manual-copy">
          <strong>Add device manually</strong>
          <span>Enter the IP shown on the other device.</span>
        </div>
        <button class="connect-pill" type="button">Connect</button>
      </section>

      <div class="device-stack">
        <article class="device-row local">
          <strong>Venturis-MacBook</strong>
          <span>Local LAN</span>
        </article>
        <article class="device-row relay">
          <strong>Pixel 7</strong>
          <span>Relay fallback</span>
        </article>
        <article class="device-row inbox">
          <strong>Clipboard inbox</strong>
          <span>Recent clips</span>
        </article>
      </div>

      <footer class="bottom-nav" aria-label="Navigation">
        <button class="nav-item active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>
          <span>Devices</span>
        </button>
        <button class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/></svg>
          <span>Clipboard</span>
        </button>
        <button class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 6.5h7l2 2.5h4V18h-13z"/><path d="M8 11h6M8 14h6"/></svg>
          <span>Files</span>
        </button>
        <button class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5h6a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1Z"/><path d="M8 8h8v10H8z"/><path d="M10 12h4"/></svg>
          <span>Settings</span>
        </button>
      </footer>
    </section>
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

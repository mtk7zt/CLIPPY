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
      --bg: #08111b;
      --bg2: #0c1622;
      --surface: rgba(13, 21, 32, 0.86);
      --surface-strong: rgba(18, 28, 40, 0.96);
      --line: rgba(146, 170, 202, 0.16);
      --line-strong: rgba(146, 170, 202, 0.26);
      --text: #f6f8fc;
      --muted: #9dadbf;
      --accent: #4f8dff;
      --accent-2: #69d4ff;
      --green: #31d38d;
      --yellow: #f3b84f;
      --shadow: 0 28px 80px rgba(0, 0, 0, .34);
      --radius-xl: 28px;
      --radius-lg: 22px;
      --radius-md: 16px;
      --radius-sm: 12px;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f4f7fc;
        --bg2: #edf2f8;
        --surface: rgba(255, 255, 255, 0.9);
        --surface-strong: rgba(255, 255, 255, 0.98);
        --line: rgba(132, 151, 177, 0.18);
        --line-strong: rgba(132, 151, 177, 0.28);
        --text: #101620;
        --muted: #566072;
        --shadow: 0 24px 70px rgba(30, 43, 63, .12);
      }
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      font-family: var(--font);
      background:
        radial-gradient(circle at 12% 10%, rgba(79, 141, 255, .18), transparent 24%),
        radial-gradient(circle at 88% 12%, rgba(105, 212, 255, .16), transparent 18%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%);
      color: var(--text);
    }
    a { color: inherit; text-decoration: none; }
    .shell {
      width: min(1540px, calc(100vw - 28px));
      margin: 0 auto;
      padding: 22px 0 30px;
    }
    .topbar, .hero, .grid, .footer {
      border: 1px solid var(--line);
      background: var(--surface);
      backdrop-filter: blur(22px);
      box-shadow: var(--shadow);
      border-radius: var(--radius-xl);
    }
    .topbar {
      display:flex; justify-content:space-between; align-items:center; gap:16px;
      padding: 18px 22px; margin-bottom: 18px;
    }
    .brand { display:flex; align-items:center; gap:14px; }
    .mark {
      width: 38px; height: 38px; border-radius: 14px;
      background: linear-gradient(180deg, rgba(79,141,255,.22), rgba(79,141,255,.08));
      border: 1px solid rgba(79,141,255,.35);
      display:grid; place-items:center; font-weight:700; color: var(--accent-2);
    }
    .brand h1 { margin:0; font-size: 18px; letter-spacing:-.03em; }
    .brand p, .hero p, .card p, .small { margin:0; color: var(--muted); }
    .chips { display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; }
    .chip {
      padding: 9px 12px; border-radius:999px; border:1px solid var(--line);
      background: rgba(255,255,255,.02); font-size: 12px; color: var(--muted);
    }
    .chip strong { color: var(--text); font-weight: 600; }
    .hero { padding: 26px; margin-bottom: 18px; }
    .hero-grid { display:grid; grid-template-columns: 1.2fr .8fr; gap: 18px; align-items:start; }
    h2 {
      margin:0; font-size: clamp(34px, 4vw, 58px); line-height: .98; letter-spacing: -.05em;
    }
    .lead { margin-top: 14px; max-width: 62ch; font-size: 15px; line-height: 1.7; }
    .hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top: 18px; }
    .btn {
      display:inline-flex; align-items:center; gap:8px; padding: 12px 16px;
      border-radius: 14px; border: 1px solid var(--line); background: rgba(255,255,255,.03);
      color: var(--text); font-weight:600; font-size: 14px;
    }
    .btn.primary {
      background: linear-gradient(180deg, rgba(79,141,255,.98), rgba(58,119,246,.98));
      border-color: rgba(79,141,255,.25);
    }
    .stack { display:grid; gap: 14px; }
    .card {
      border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface-strong);
      padding: 18px;
    }
    .card h3 { margin:0 0 8px; font-size: 18px; letter-spacing:-.03em; }
    .theme-grid, .two-col, .mini-grid { display:grid; gap: 14px; }
    .theme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .swatches { display:flex; gap:10px; flex-wrap:wrap; margin-top: 14px; }
    .sw { width: 44px; height: 44px; border-radius: 14px; border: 1px solid var(--line); }
    .sw.big { width: 100%; height: 84px; border-radius: 20px; }
    .soft-row { display:flex; flex-wrap:wrap; gap: 10px; margin-top: 14px; }
    .soft-pill {
      padding: 9px 12px; border-radius: 999px; border:1px solid var(--line);
      color: var(--muted); background: rgba(255,255,255,.02); font-size: 12px;
    }
    .mini-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .icon-tile {
      border: 1px solid var(--line); border-radius: 18px; padding: 14px;
      background: rgba(255,255,255,.02); min-height: 110px;
    }
    .glyph {
      width: 42px; height: 42px; border-radius: 14px;
      background: linear-gradient(180deg, rgba(79,141,255,.16), rgba(79,141,255,.06));
      border: 1px solid rgba(79,141,255,.24);
      margin-bottom: 10px;
      position: relative;
    }
    .glyph::before {
      content: '';
      position:absolute; inset: 12px 11px 12px 11px;
      border: 2px solid currentColor; border-radius: 8px;
      color: var(--accent-2);
      opacity: .85;
    }
    .icon-tile strong { display:block; font-size: 14px; margin-bottom: 4px; }
    .icon-tile span { color: var(--muted); font-size: 12px; line-height:1.45; }
    .mobile-frame {
      border-radius: 34px; padding: 12px; border:1px solid var(--line); background: rgba(6,10,16,.88);
      box-shadow: var(--shadow);
      max-width: 380px;
    }
    .phone {
      border-radius: 28px; overflow:hidden; background: linear-gradient(180deg, rgba(9,14,22,.98), rgba(7,12,18,.98));
      border: 1px solid rgba(148,170,197,.14);
    }
    .phone-head, .phone-foot { padding: 16px; }
    .phone-head { display:flex; justify-content:space-between; align-items:center; }
    .phone-body { padding: 0 16px 16px; display:grid; gap: 12px; }
    .phone-card { border:1px solid var(--line); border-radius: 20px; padding: 14px; background: rgba(255,255,255,.03); }
    .phone-row {
      display:grid; grid-template-columns: 40px minmax(0,1fr) auto; gap: 10px; align-items:center;
      padding: 12px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,.03);
    }
    .dot {
      width: 40px; height: 40px; border-radius: 14px; border:1px solid rgba(79,141,255,.24);
      background: rgba(79,141,255,.12);
    }
    .phone-row h4 { margin:0; font-size: 14px; }
    .phone-row p { font-size: 12px; line-height:1.45; margin-top: 3px; }
    .bottomnav {
      display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 14px 16px 18px;
      border-top: 1px solid var(--line);
    }
    .tab {
      padding: 10px 6px; border-radius: 16px; border:1px solid transparent; text-align:center;
      font-size: 12px; color: var(--muted); background: rgba(255,255,255,.02);
    }
    .tab.active {
      color: var(--text);
      background: rgba(79,141,255,.12);
      border-color: rgba(79,141,255,.22);
    }
    .grid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      padding: 18px;
      margin-bottom: 18px;
    }
    .footer {
      padding: 18px 22px;
      color: var(--muted);
      font-size: 13px;
      text-align:center;
    }
    @media (max-width: 1100px) {
      .hero-grid, .grid { grid-template-columns: 1fr; }
      .mobile-frame { max-width: 100%; }
    }
    @media (max-width: 720px) {
      .shell { width: min(100vw - 18px, 100%); }
      .topbar { align-items:flex-start; flex-direction:column; }
      .theme-grid, .mini-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="topbar">
      <div class="brand">
        <div class="mark">C</div>
        <div>
          <h1>Clippy by Venturis Lab</h1>
          <p>iOS-first by default · Venturis Calm in dark mode · Frosted Suite in light mode</p>
        </div>
      </div>
      <div class="chips">
        <div class="chip"><strong>Connected</strong> goes red when offline</div>
        <div class="chip"><strong>Manual IP</strong> when discovery fails</div>
        <div class="chip"><strong>iOS</strong> stays honest about limits</div>
      </div>
    </section>

    <section class="hero">
      <div class="hero-grid">
        <div>
          <h2>Large titles, Liquid Glass depth, and honest connection states.</h2>
          <p class="lead">This site packages the Clippy direction into one place: the product UI, the reusable design system, icon packs, Figma kits, and iOS-friendly patterns that follow the device theme automatically.</p>
          <div class="hero-actions">
            <a class="btn primary" href="#">View the app</a>
            <a class="btn" href="#">Open design kit</a>
            <a class="btn" href="#">See iOS patterns</a>
          </div>
        </div>
        <div class="stack">
          <div class="card">
            <h3>System theme behavior</h3>
            <p>Default to the OS appearance, keep manual overrides available, and preserve the same hierarchy in both modes.</p>
            <div class="soft-row">
              <div class="soft-pill">Dark · Venturis Calm</div>
              <div class="soft-pill">Light · Frosted Suite</div>
              <div class="soft-pill">Auto · follows system</div>
            </div>
          </div>
          <div class="card">
            <h3>iPhone distribution options</h3>
            <p>AltStore / SideStore sideloading, direct Xcode builds with a free Apple ID, and a web companion fallback while signing is in progress.</p>
          </div>
          <div class="card">
            <h3>Reference stack</h3>
            <p>Material 3 for structure, wireframes for discipline, iOS liquid glass for mobile depth, iOS views for screen-level layout logic, Apple Pay cues for confirmation flows, iOS component libraries for controls, native iOS wireframes for layout logic, widgets for information surfaces, website wireframes for layout, and Big Sur chrome for desktop framing.</p>
            <div class="soft-row">
              <div class="soft-pill">Material 3</div>
              <div class="soft-pill">Mobile wireframes</div>
              <div class="soft-pill">iOS 26 liquid glass</div>
              <div class="soft-pill">iOS views</div>
              <div class="soft-pill">Apple Pay cues</div>
              <div class="soft-pill">iOS controls</div>
              <div class="soft-pill">iOS widgets</div>
              <div class="soft-pill">Native wireframes</div>
              <div class="soft-pill">Website wireframes</div>
              <div class="soft-pill">Big Sur chrome</div>
              <div class="soft-pill">Scrollbar kit</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid">
      <div class="stack">
        <div class="card">
          <h3>Venturis Calm</h3>
          <p>Dark, premium, minimal. Soft glass surfaces and precise hierarchy.</p>
          <div class="swatches">
            <div class="sw big" style="background:#0f1621"></div>
            <div class="sw" style="background:#1d2738"></div>
            <div class="sw" style="background:#4c8fff"></div>
            <div class="sw" style="background:#69d4ff"></div>
          </div>
          <div class="soft-row">
            <div class="soft-pill">Connected</div>
            <div class="soft-pill">Manual IP</div>
            <div class="soft-pill">Relay fallback</div>
          </div>
        </div>

        <div class="card">
          <h3>Frosted Suite</h3>
          <p>Lighter, friendlier, and more consumer-app focused with softer mobile surfaces.</p>
          <div class="swatches">
            <div class="sw big" style="background:#f4f7fc"></div>
            <div class="sw" style="background:#ffffff"></div>
            <div class="sw" style="background:#4c8fff"></div>
            <div class="sw" style="background:#48d99b"></div>
          </div>
          <div class="soft-row">
            <div class="soft-pill">Devices</div>
            <div class="soft-pill">Clipboard</div>
            <div class="soft-pill">Files</div>
            <div class="soft-pill">Settings</div>
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h3>Icon pack</h3>
          <p>Reusable glyph language for clipboard, files, devices, ping, settings, and theme controls.</p>
          <div class="mini-grid" style="margin-top:14px;">
            <div class="icon-tile"><div class="glyph"></div><strong>Clipboard</strong><span>History, notes, and export.</span></div>
            <div class="icon-tile"><div class="glyph"></div><strong>Files</strong><span>Send, receive, and retry.</span></div>
            <div class="icon-tile"><div class="glyph"></div><strong>Devices</strong><span>Discovery and pairing.</span></div>
            <div class="icon-tile"><div class="glyph"></div><strong>Ping</strong><span>Find the device fast.</span></div>
            <div class="icon-tile"><div class="glyph"></div><strong>Settings</strong><span>Plugins and capabilities.</span></div>
            <div class="icon-tile"><div class="glyph"></div><strong>Theme</strong><span>System / dark / light.</span></div>
          </div>
        </div>

        <div class="card">
          <h3>Mobile behavior</h3>
          <p>Stacked cards, sticky actions, readable status, and no hidden controls.</p>
          <div style="display:flex; gap:14px; margin-top:14px; align-items:flex-start; flex-wrap:wrap;">
            <div class="mobile-frame">
              <div class="phone">
                <div class="phone-head">
                  <strong>Devices</strong>
                  <div class="chip">+</div>
                </div>
                <div class="phone-body">
                  <div class="phone-card">Manual IP connect · visible when discovery is blocked</div>
                  <div class="phone-row">
                    <div class="dot"></div>
                    <div><h4>Venturis-MacBook</h4><p>Local LAN · verified</p></div>
                    <div class="chip">Open</div>
                  </div>
                  <div class="phone-row">
                    <div class="dot"></div>
                    <div><h4>Pixel 7</h4><p>Relay fallback · encrypted</p></div>
                    <div class="chip">Retry</div>
                  </div>
                </div>
                <div class="bottomnav">
                  <div class="tab active">Devices</div>
                  <div class="tab">Clipboard</div>
                  <div class="tab">Files</div>
                  <div class="tab">Settings</div>
                </div>
              </div>
            </div>
            <div style="flex:1; min-width: 240px;">
              <div class="phone-card" style="margin-bottom: 12px;">Connected becomes red immediately if the link drops.</div>
              <div class="phone-card" style="margin-bottom: 12px;">Clipboard keeps a local note trail and exports cleanly.</div>
              <div class="phone-card">Settings holds plugins, styles, and style mobility in one place.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="footer">
      When you’re ready, I can turn this into a working production site and keep iterating on the app itself.
    </section>
  </main>
</body>
</html>`;
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};


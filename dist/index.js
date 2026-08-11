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
      --bg-2: #0b1420;
      --surface: rgba(15, 23, 35, 0.82);
      --surface-strong: rgba(19, 29, 43, 0.96);
      --surface-light: rgba(255, 255, 255, 0.95);
      --line: rgba(147, 169, 198, 0.16);
      --line-strong: rgba(147, 169, 198, 0.28);
      --text: #f6f8fc;
      --muted: #a1afc1;
      --muted-2: #7b899d;
      --accent: #4c8fff;
      --accent-2: #6bd1ff;
      --green: #38d987;
      --yellow: #f0b44e;
      --red: #ff6471;
      --shadow: 0 30px 90px rgba(0, 0, 0, 0.38);
      --radius-xl: 34px;
      --radius-lg: 26px;
      --radius-md: 18px;
      --radius-sm: 14px;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f4f7fc;
        --bg-2: #eef3f9;
        --surface: rgba(255, 255, 255, 0.9);
        --surface-strong: rgba(255, 255, 255, 0.98);
        --line: rgba(129, 149, 177, 0.18);
        --line-strong: rgba(129, 149, 177, 0.3);
        --text: #101722;
        --muted: #5a6578;
        --muted-2: #748095;
        --shadow: 0 24px 70px rgba(28, 41, 59, 0.12);
      }
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      font-family: var(--font);
      color: var(--text);
      background:
        radial-gradient(circle at 12% 12%, rgba(76, 143, 255, 0.18), transparent 28%),
        radial-gradient(circle at 88% 14%, rgba(107, 209, 255, 0.14), transparent 18%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    a { color: inherit; text-decoration: none; }
    .shell {
      width: min(1560px, calc(100vw - 28px));
      margin: 0 auto;
      padding: 20px 0 28px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
      padding: 0 4px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .mark {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font-weight: 800;
      color: var(--accent-2);
      border: 1px solid rgba(76, 143, 255, 0.32);
      background: linear-gradient(180deg, rgba(76, 143, 255, 0.22), rgba(76, 143, 255, 0.08));
    }
    .brand h1 {
      margin: 0;
      font-size: 18px;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
    .brand p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
      color: var(--muted);
      font-size: 12px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .chip strong { color: var(--text); font-weight: 700; }
    .chip.danger {
      color: #ffc3ca;
      border-color: rgba(255, 100, 113, 0.22);
      background: rgba(255, 100, 113, 0.08);
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
      gap: 18px;
      padding: 22px;
      margin-bottom: 18px;
      border-radius: var(--radius-xl);
      border: 1px solid rgba(145, 167, 196, 0.16);
      background:
        radial-gradient(circle at top right, rgba(76, 143, 255, 0.16), transparent 36%),
        linear-gradient(180deg, rgba(19, 29, 43, 0.98), rgba(13, 21, 32, 0.96));
      backdrop-filter: blur(24px);
      box-shadow: var(--shadow);
    }
    .eyebrow {
      margin: 0 0 10px;
      color: var(--accent-2);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-size: 11px;
      font-weight: 800;
    }
    .hero h2 {
      margin: 0;
      font-size: clamp(34px, 4.1vw, 58px);
      line-height: 0.97;
      letter-spacing: -0.07em;
      max-width: 11ch;
    }
    .lead {
      margin: 14px 0 0;
      max-width: 62ch;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.75;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
      font-weight: 700;
      font-size: 14px;
    }
    .btn.primary {
      background: linear-gradient(180deg, rgba(76, 143, 255, 1), rgba(59, 118, 245, 1));
      border-color: rgba(76, 143, 255, 0.24);
    }

    .phone-frame {
      width: 100%;
      max-width: 480px;
      margin-left: auto;
      padding: 12px;
      border-radius: 48px;
      border: 1px solid rgba(147, 169, 198, 0.14);
      background: linear-gradient(180deg, rgba(17, 26, 39, 0.96), rgba(10, 17, 26, 0.98));
      box-shadow: var(--shadow);
    }
    .phone {
      overflow: hidden;
      min-height: 920px;
      border-radius: 38px;
      border: 1px solid rgba(147, 169, 198, 0.14);
      background: linear-gradient(180deg, #08111a 0%, #060c14 100%);
    }
    .phone-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 18px 10px;
    }
    .phone-title {
      margin: 0;
      font-size: 29px;
      line-height: 0.95;
      letter-spacing: -0.06em;
    }
    .phone-subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .ghost {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
      font-size: 20px;
      line-height: 1;
    }
    .phone-body {
      padding: 0 16px 16px;
      display: grid;
      gap: 12px;
    }
    .phone-card {
      padding: 16px;
      border-radius: 24px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
    }
    .phone-card h3 {
      margin: 0 0 6px;
      font-size: 16px;
      letter-spacing: -0.03em;
    }
    .phone-card p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }
    .status-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 11px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
      color: var(--muted);
      font-size: 12px;
    }
    .status.good {
      color: #a2f2ca;
      border-color: rgba(56, 217, 135, 0.24);
      background: rgba(56, 217, 135, 0.08);
    }
    .status.warn {
      color: #ffd786;
      border-color: rgba(240, 180, 78, 0.24);
      background: rgba(240, 180, 78, 0.08);
    }
    .status.danger {
      color: #ffb0b8;
      border-color: rgba(255, 100, 113, 0.24);
      background: rgba(255, 100, 113, 0.08);
    }
    .device-row {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 12px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
    }
    .device-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(76, 143, 255, 0.22);
      background: linear-gradient(180deg, rgba(76, 143, 255, 0.16), rgba(76, 143, 255, 0.06));
      color: var(--accent-2);
      font-size: 18px;
    }
    .device-row h4 {
      margin: 0;
      font-size: 15px;
    }
    .device-row p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .bottom-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      padding: 16px;
      margin-top: auto;
      border-top: 1px solid rgba(147, 169, 198, 0.12);
      background: rgba(8, 13, 20, 0.96);
    }
    .tab {
      display: grid;
      gap: 5px;
      place-items: center;
      padding: 11px 8px;
      border-radius: 18px;
      border: 1px solid transparent;
      color: var(--muted);
      background: transparent;
      font-size: 12px;
    }
    .tab.active {
      color: var(--text);
      background: rgba(76, 143, 255, 0.12);
      border-color: rgba(76, 143, 255, 0.22);
    }

    .content {
      display: grid;
      gap: 18px;
    }
    .panel-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .card {
      padding: 18px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--line);
      background: var(--surface);
      backdrop-filter: blur(20px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
    }
    .card h3 {
      margin: 0 0 8px;
      font-size: 18px;
      letter-spacing: -0.03em;
    }
    .card p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
    }
    .stack {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }
    .list-row {
      display: grid;
      grid-template-columns: 14px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      padding: 12px 14px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
    }
    .dot {
      width: 10px;
      height: 10px;
      margin-top: 5px;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 4px rgba(76, 143, 255, 0.12);
    }
    .dot.good { background: var(--green); box-shadow: 0 0 0 4px rgba(56, 217, 135, 0.10); }
    .dot.warn { background: var(--yellow); box-shadow: 0 0 0 4px rgba(240, 180, 78, 0.10); }
    .dot.danger { background: var(--red); box-shadow: 0 0 0 4px rgba(255, 100, 113, 0.10); }
    .list-row strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .list-row p {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .wide {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 16px;
    }
    .theme-tiles {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .tile {
      min-height: 120px;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
    }
    .tile strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .swatches {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .sw {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      border: 1px solid var(--line);
    }
    .sw.big {
      width: 100%;
      height: 78px;
      border-radius: 18px;
    }

    .footer {
      margin-top: 18px;
      padding: 18px 20px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.03);
      color: var(--muted);
      text-align: center;
      font-size: 13px;
      line-height: 1.5;
    }

    @media (max-width: 1260px) {
      .hero,
      .wide,
      .panel-grid {
        grid-template-columns: 1fr;
      }
      .phone-frame {
        margin: 0;
        max-width: 100%;
      }
    }

    @media (max-width: 920px) {
      .shell {
        width: min(100vw - 18px, 100%);
        padding-top: 12px;
      }
      .topbar {
        flex-direction: column;
        align-items: stretch;
      }
      .chips {
        justify-content: flex-start;
      }
      .hero {
        padding: 18px;
      }
      .theme-tiles {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .card,
      .phone-card,
      .list-row {
        border-radius: 18px;
      }
      .actions,
      .chips {
        width: 100%;
      }
      .btn,
      .chip {
        width: 100%;
        justify-content: center;
      }
      .phone {
        min-height: auto;
      }
      .bottom-nav {
        gap: 8px;
        padding: 14px;
      }
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
          <p>iOS-first by default · system-aware · Venturis Calm / Frosted Suite</p>
        </div>
      </div>
      <div class="chips">
        <div class="chip"><strong>Connected</strong> stays positive</div>
        <div class="chip danger"><strong>Disconnected</strong> turns red</div>
        <div class="chip"><strong>Manual IP</strong> when discovery fails</div>
      </div>
    </section>

    <section class="hero">
      <div>
        <p class="eyebrow">Clippy iOS-first redesign</p>
        <h2>Large titles, Liquid Glass depth, and a notebook for every clip.</h2>
        <p class="lead">
          The new Clippy direction follows the iOS kits directly: sheet-like confirmations, widget-style surfaces,
          a clipboard notebook with local archive and export, and a settings hub that keeps plugins and styles in one place.
        </p>
        <div class="actions">
          <a class="btn primary" href="#">View the app</a>
          <a class="btn" href="#">Open design kit</a>
          <a class="btn" href="#">See iOS patterns</a>
        </div>
        <div class="status-strip">
          <span class="status good">Venturis Calm</span>
          <span class="status">Frosted Suite</span>
          <span class="status warn">Apple Pay-style confirmation sheets</span>
          <span class="status">System theme follows OS</span>
        </div>
      </div>

      <div class="phone-frame">
        <div class="phone">
          <div class="phone-head">
            <div>
              <p class="phone-title">Devices</p>
              <p class="phone-subtitle">Native-feeling layout, direct status, no hidden paths.</p>
            </div>
            <div class="ghost">+</div>
          </div>
          <div class="phone-body">
            <div class="phone-card">
              <h3>Connected device</h3>
              <p>Venturis-MacBook Air · local LAN · verified</p>
              <div class="status-strip">
                <span class="status good">Connected</span>
                <span class="status">Encrypted</span>
                <span class="status">Battery 87%</span>
              </div>
            </div>
            <div class="phone-card">
              <h3>Manual IP connect</h3>
              <p>Visible when discovery is blocked or multicast is unavailable.</p>
              <div class="status-strip">
                <span class="status warn">192.168.1.42</span>
                <span class="status">Port 1716</span>
              </div>
            </div>
            <div class="phone-card">
              <h3>Clipboard notebook</h3>
              <p>Recent clips, local archive, PDF export, and file export.</p>
              <div class="status-strip">
                <span class="status">History</span>
                <span class="status">Export PDF</span>
                <span class="status">Export file</span>
              </div>
            </div>
          </div>
          <nav class="bottom-nav">
            <div class="tab active">Devices</div>
            <div class="tab">Clipboard</div>
            <div class="tab">Files</div>
            <div class="tab">Settings</div>
          </nav>
        </div>
      </div>
    </section>

    <section class="content">
      <div class="panel-grid">
        <article class="card">
          <h3>Connection states</h3>
          <p>Always show the honest state. If the link drops, connected becomes red immediately and says disconnected plainly.</p>
          <div class="stack">
            <div class="list-row">
              <div class="dot good"></div>
              <div>
                <strong>Connected</strong>
                <p>Local LAN and verified transport paths are front and center.</p>
              </div>
              <span class="chip">Good</span>
            </div>
            <div class="list-row">
              <div class="dot warn"></div>
              <div>
                <strong>Manual IP</strong>
                <p>Enter a host directly when discovery cannot find the device.</p>
              </div>
              <span class="chip">Fallback</span>
            </div>
            <div class="list-row">
              <div class="dot danger"></div>
              <div>
                <strong>Disconnected</strong>
                <p>Nothing is hidden; the app shows the failure and the next action.</p>
              </div>
              <span class="chip danger">Red</span>
            </div>
          </div>
        </article>

        <article class="card">
          <h3>Clipboard notebook</h3>
          <p>Every copied item can be viewed, stored locally, and exported later.</p>
          <div class="stack">
            <div class="list-row">
              <div class="dot good"></div>
              <div>
                <strong>Quarterly planning draft</strong>
                <p>12 seconds ago · from Venturis-MacBook Air</p>
              </div>
              <span class="chip">Note</span>
            </div>
            <div class="list-row">
              <div class="dot warn"></div>
              <div>
                <strong>OTP masked</strong>
                <p>3 minutes ago · sensitivity kept local</p>
              </div>
              <span class="chip">Secure</span>
            </div>
            <div class="list-row">
              <div class="dot"></div>
              <div>
                <strong>Export controls</strong>
                <p>PDF or file export stays visible instead of buried in settings.</p>
              </div>
              <span class="chip">Export</span>
            </div>
          </div>
        </article>

        <article class="card">
          <h3>Settings hub</h3>
          <p>Settings is the control room for plugins, preferences, styles, and policy.</p>
          <div class="stack">
            <div class="list-row">
              <div class="dot good"></div>
              <div>
                <strong>Clipboard plugin</strong>
                <p>History, archive, masking, and export.</p>
              </div>
              <span class="chip">On</span>
            </div>
            <div class="list-row">
              <div class="dot"></div>
              <div>
                <strong>Files plugin</strong>
                <p>Progress, retry, resume, and transfer verification.</p>
              </div>
              <span class="chip">On</span>
            </div>
            <div class="list-row">
              <div class="dot warn"></div>
              <div>
                <strong>Remote input</strong>
                <p>Permission-scoped, explicit, and easy to revoke.</p>
              </div>
              <span class="chip">Optional</span>
            </div>
          </div>
        </article>
      </div>

      <div class="wide">
        <article class="card">
          <h3>Venturis Calm / Frosted Suite</h3>
          <p>Two surfaces, one system. Dark mode stays premium and minimal; light mode stays soft and consumer-friendly.</p>
          <div class="theme-tiles">
            <div class="tile">
              <strong>Venturis Calm</strong>
              <p>Dark, glassy, high contrast, and focused on clear hierarchy.</p>
              <div class="swatches">
                <div class="sw big" style="background:#0f1621"></div>
                <div class="sw" style="background:#1d2738"></div>
                <div class="sw" style="background:#4c8fff"></div>
                <div class="sw" style="background:#6bd1ff"></div>
              </div>
            </div>
            <div class="tile">
              <strong>Frosted Suite</strong>
              <p>Lighter, friendlier, and more mobile-first with the same layout language.</p>
              <div class="swatches">
                <div class="sw big" style="background:#f4f7fc"></div>
                <div class="sw" style="background:#ffffff"></div>
                <div class="sw" style="background:#4c8fff"></div>
                <div class="sw" style="background:#48d99b"></div>
              </div>
            </div>
          </div>
        </article>

        <article class="card">
          <h3>Distribution paths</h3>
          <p>No paid Apple Developer account is assumed for the first pass. The UX stays honest about sideloading and companion options.</p>
          <div class="stack">
            <div class="list-row">
              <div class="dot good"></div>
              <div>
                <strong>Local development</strong>
                <p>Best for fast iteration on your own device.</p>
              </div>
              <span class="chip">Free</span>
            </div>
            <div class="list-row">
              <div class="dot"></div>
              <div>
                <strong>AltStore / SideStore</strong>
                <p>Sideload-friendly paths that do not depend on a paid account.</p>
              </div>
              <span class="chip">Ready</span>
            </div>
            <div class="list-row">
              <div class="dot warn"></div>
              <div>
                <strong>App Store later</strong>
                <p>Keep it visible as a future milestone, not as a current promise.</p>
              </div>
              <span class="chip">Later</span>
            </div>
          </div>
        </article>
      </div>

      <div class="card">
        <h3>Reference stack</h3>
        <p>Material 3 for structure, iOS Liquid Glass for depth, iOS views for screen rhythm, Apple Pay cues for confirmations, and Big Sur chrome for desktop framing.</p>
        <div class="status-strip" style="margin-top:14px;">
          <span class="status">Material 3</span>
          <span class="status">Mobile wireframes</span>
          <span class="status">iOS liquid glass</span>
          <span class="status">iOS views</span>
          <span class="status">Apple Pay cues</span>
          <span class="status">Native wireframes</span>
          <span class="status">Scrollbar kit</span>
          <span class="status">Big Sur chrome</span>
        </div>
      </div>
    </section>

    <section class="footer">
      Clippy is reworked to feel like an iPhone-first product with a desktop companion, not a desktop app wearing mobile colors.
    </section>
  </main>
</body>
</html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};

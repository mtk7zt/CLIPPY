const app = document.querySelector("#app");

const state = {
  theme: "system",
};

const themeOptions = [
  { key: "system", label: "System theme" },
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
];

function themeResolved() {
  if (state.theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return state.theme;
}

function applyTheme() {
  document.documentElement.dataset.theme = themeResolved();
}

function iconPlus() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
}

function iconChevron() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5 14.5 12 9 17.5"/></svg>';
}

function iconDevices() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 7.5h15v8h-15zM8 18h8M10 4.5h4"/></svg>';
}

function iconClipboard() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5h8M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 4h12v11H6z"/><path d="M9 9.5h6M9 12.5h6M9 15.5h4"/></svg>';
}

function iconFiles() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 6.5h7l2 2.5h4V18h-13z"/><path d="M8 11h6M8 14h6"/></svg>';
}

function iconSettings() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5.5h6a1 1 0 0 1 1 1v1h-8v-1a1 1 0 0 1 1-1Z"/><path d="M8 8h8v10H8z"/><path d="M10 12h4"/></svg>';
}

function root() {
  return `
    <div class="page">
      <div class="topbar">
        <div class="brand">
          <div class="brand-mark">${iconDevices()}</div>
          <div>
            <p>Clippy by Venturis Lab</p>
            <strong>Cross-platform device link</strong>
          </div>
        </div>
        <div class="theme-pills" aria-label="Theme options">
          ${themeOptions
            .map(
              (option) => `
                <button class="theme-pill ${state.theme === option.key ? "active" : ""}" data-theme="${option.key}">
                  ${option.label}
                </button>
              `,
            )
            .join("")}
        </div>
      </div>

      <section class="copy-block">
        <p class="kicker">Mobile friendliness</p>
        <h1>The app should collapse cleanly into a single-column device view with sticky actions and no hidden controls.</h1>
      </section>

      <section class="phone-mock" aria-label="Clippy mobile reference mock">
        <header class="phone-header">
          <h2>Devices</h2>
          <button class="plus-pill" type="button" aria-label="Add device">${iconPlus()}</button>
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
          <button class="nav-item active">${iconDevices()}<span>Devices</span></button>
          <button class="nav-item">${iconClipboard()}<span>Clipboard</span></button>
          <button class="nav-item">${iconFiles()}<span>Files</span></button>
          <button class="nav-item">${iconSettings()}<span>Settings</span></button>
        </footer>
      </section>
    </div>
  `;
}

function render() {
  applyTheme();
  app.innerHTML = root();
  try {
    localStorage.setItem("clippy-theme", state.theme);
  } catch {}
}

try {
  const stored = localStorage.getItem("clippy-theme");
  if (stored) state.theme = stored;
} catch {}

render();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
});

app.addEventListener("click", (event) => {
  const themeButton = event.target.closest("[data-theme]");
  if (!themeButton) return;
  state.theme = themeButton.dataset.theme;
  render();
});


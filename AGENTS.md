# Clippy by Venturis Lab — design and implementation rules

## Stack and source of truth

- This repo is plain HTML, CSS, and JavaScript.
- Local preview lives in `index.html`, `app.js`, and `styles.css`.
- The Sites deployment artifact is `dist/index.js`; keep it aligned with the local preview.
- Do not introduce a framework or extra icon package unless the user explicitly asks.

## Figma workflow

- For any Figma-driven UI change, fetch design context and a screenshot first.
- Use the current Clippy Figma board as the visual reference source.
- Translate the Figma output into this repo’s plain HTML/CSS/JS patterns instead of copying framework-specific code literally.
- Prefer direct iOS cues for spacing, hierarchy, sheets, translucency, and controls, but keep the result branded as Clippy by Venturis Lab.

## Design system rules

- Default to the iOS-first direction:
  - large titles
  - card-based surfaces
  - bottom navigation
  - sheet-style confirmations
  - widget-like summary tiles
  - Liquid Glass-inspired depth
- Venturis Calm is the dark/system-dark mode.
- Frosted Suite is the light/system-light mode.
- Theme changes must follow system appearance by default and still allow explicit overrides for power users.
- “Connected” must remain positive, and “Disconnected” must turn red immediately when offline.
- Settings is the hub for plugins, preferences, and capability controls. Do not rename it to Preferences.
- Clipboard must behave like a notebook:
  - visible history
  - local archive option
  - export to file and PDF
- Keep manual IP / host entry visible whenever discovery is unavailable.

## Styling rules

- Use CSS variables for color, spacing, radii, and motion.
- Prefer high-contrast, calm, frosted surfaces over utility-dashboard chrome.
- Keep tap targets generous and status language explicit.
- Keep copy honest about iOS limits and distribution paths; do not imply paid Apple Developer access is required unless it truly is.

## Implementation habits

- Reuse existing structure when possible; refine it instead of rewriting everything unnecessarily.
- Keep desktop and mobile visually related, but let mobile lead the product language.
- Update both the local preview and the deployment artifact when visual behavior changes.
- Validate the result against the Figma board before treating the pass as complete.

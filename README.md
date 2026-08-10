# Clippy by Venturis Lab

Clippy is a privacy-first device-linking app inspired by the KDE Connect experience, reworked with a calmer Venturis Lab brand and more honest platform behavior.

This repository is currently a polished front-end prototype and product scaffold. It demonstrates:

- a modern desktop shell
- an iPhone-style companion UI
- manual host / IP pairing
- local discovery first
- relay fallback as an explicit state
- encrypted clipboard and file-transfer concepts
- honest iOS limitation language

## What’s included

- `index.html` — app entry point
- `styles.css` — the Venturis-style design system
- `app.js` — stateful UI prototype
- `docs/` — feasibility, architecture, threat, privacy, protocol, and iOS limitation notes

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server.

Example with Python:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Product direction

- Desktop: local-first device dashboard with clipboard, files, and manual host pairing.
- iPhone: visible devices list, manual add flow, clipboard inbox, and file transfer with user-driven actions.
- Transport: LAN first, manual host second, encrypted relay third, self-hosted relay later.
- iOS: no fake background guarantees; user-facing fallbacks only.

## Notes

This repo is intentionally dependency-free for now so it can run inside the current workspace without network installation.


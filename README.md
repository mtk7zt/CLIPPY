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
- iPhone install paths that do not require a paid Apple Developer account

## iPhone distribution options

Because there is no Apple Developer Program account in this phase, the app should be treated as a sideloadable or locally built iPhone app, not an App Store submission yet. The recommended paths are:

- AltStore or SideStore sideloading for test devices
- direct Xcode install with a free Apple ID for local development
- a web companion fallback while the native build is being signed

TestFlight and App Store release are later milestones once paid signing and review are available.

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
- Settings: one hub for plugins, preferences, motion, icons, layout modes, and platform distribution notes.

## Notes

This repo is intentionally dependency-free for now so it can run inside the current workspace without network installation.


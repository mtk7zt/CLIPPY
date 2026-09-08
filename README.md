# Clippy by Venturis Lab

Clippy by Venturis Labs is a device-linking product inspired by KDE Connect. This milestone preserves the plain HTML/CSS/JavaScript frontend and adds a working local Express backend.

This repository provides:

- a modern desktop shell
- an iPhone-style companion UI
- manual host / IP pairing
- explicitly labeled development discovery records (no network scanning)
- persisted local pairing/trust records and capability controls
- a server-backed clipboard notebook and streaming local file uploads
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
- `app.js` — backend-connected plain-JavaScript workspace
- `docs/` — feasibility, architecture, threat, privacy, protocol, and iOS limitation notes

## Run locally

Install dependencies with npm and run the frontend and backend together:

```powershell
npm install
npm run dev
```

Then open `http://127.0.0.1:4173`.

`npm start` starts the same Express application without a separate frontend process. `PORT` overrides 4173. `HOST` overrides the bind address; hosted environments (`PORT`, CI, production, Render, Railway, or Replit) bind to `0.0.0.0` by default. Frontend API URLs are relative to the current origin. `MAX_UPLOAD_BYTES` defaults to 104857600 (100 MiB).

The server has no authentication or multi-user isolation. Use a trusted development environment; do not expose private data through an unrestricted public deployment. File and clipboard contents are stored locally on the server without application-level encryption. HTTPS is the responsibility of the hosting environment.

The ignored development store is initialized at `server/store/data.json`; uploaded bytes live under `server/store/uploads/`. Seed examples are created only when the store is absent. Corrupt data stops startup rather than being silently reset. Back up both the JSON and uploads directory together.

Discovery returns seeded records only. Saved hosts are not contacted. The Android companion registers against a full server URL and waits for browser approval before it can sync clipboard text. Native SMS, notification capture, file delivery, remote control, and network discovery remain unavailable. This is not end-to-end encryption.

For Android Emulator or BlueStacks testing, make the backend reachable on your trusted LAN:

```powershell
$env:HOST = '0.0.0.0'
npm run dev
```

Enter an absolute URL in Android: usually `http://10.0.2.2:4173` for Android Emulator, or your computer's LAN IP for BlueStacks. Android's `127.0.0.1` points to Android itself. Do not expose this unauthenticated development workspace to the public internet. Release Android builds require HTTPS. See [Android companion](docs/android-companion.md).

Uploads use streaming multipart parsing with busboy. A file is `uploaded_locally` only after byte-count verification, SHA-256 calculation, local storage, and metadata persistence. Downloads serve those stored bytes. Failed uploads can be retried by selecting the original file. Queued and uploading transfers can be cancelled. `delivered` is reserved and never produced by this version.

## Install on Windows and iPhone

- Windows: open the hosted app in Edge or Chrome, then choose **Install Clippy** from the browser app menu.
- iPhone: open the hosted app in Safari, choose **Share**, then **Add to Home Screen**.
- The responsive app uses a desktop sidebar on PC and native-style bottom navigation on iPhone.
- The service worker caches the core shell for offline startup after the first hosted visit.

## Iterate and deploy

- Edit `index.html`, `styles.css`, and `app.js` as the source of truth.
- Run `npm run check` for syntax validation.
- Run `npm test` for API, persistence, SSE, upload, and cancellation integration tests.
- Run `npm run test:browser` for Playwright workflows and desktop/tablet/mobile checks using installed Chrome.
- Run `npm run build` to regenerate the aligned `dist/index.js` deployment artifact.
- Figma generation remains in `figma-plugin/` for future design-to-code comparison passes.

The generated `dist/index.js` remains a frontend-only deployment artifact; it cannot execute Express. Run the Node server for the working same-origin app. The standalone artifact returns an explicit API-unavailable response instead of returning HTML for API calls. `npm run preview:legacy` retains the old static-only preview command.

## Product direction

- Desktop: local-first device dashboard with clipboard, files, and manual host pairing.
- iPhone: visible devices list, manual add flow, clipboard inbox, and file transfer with user-driven actions.
- Transport: LAN first, manual host second, encrypted relay third, self-hosted relay later.
- iOS: no fake background guarantees; user-facing fallbacks only.
- Settings: one hub for plugins, preferences, motion, icons, layout modes, and platform distribution notes.

## Notes

The frontend remains framework-free. Runtime npm dependencies are confined to the backend; Playwright is a development-only test dependency. Existing browser `clippy-state` data is left untouched; the connected app uses backend records and stores only its navigation selection under `clippy-ui`.

Firestore has not been provisioned or linked. For this single-user LAN milestone, local storage avoids a cloud round trip and keeps clipboard history on your machine. A future cloud workspace would need a chosen Firebase project/region, authentication, access controls, billing review, and an explicit data migration; Firestore alone does not fix Android clipboard-access or worker-scheduling limits.


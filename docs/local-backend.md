# Local backend v1

This document describes implemented behavior. Native transport, ciphertext relays, OS key storage, and end-to-end device verification in the architecture/threat documents are future requirements, not properties of this local development server.

## HTTP contracts

Successful resource responses use `{ data }`. Health returns `{ status: "ok", version: 1, maxUploadBytes }`. Errors use `{ error: { code, message, details: {} } }`; validation is 400, missing resources 404, unavailable capabilities/state conflicts 409, permission rejection 403, byte/checksum mismatch 422, and oversized bodies 413. Deleting a clip returns 204. Unknown API paths return JSON 404.

| Group | Endpoints |
| --- | --- |
| Health | GET `/api/health`, GET `/api/healthz` (same response) |
| Devices | GET `/api/devices`, POST `/api/devices/discover`, POST `/api/devices/manual`, GET `/api/devices/:id`, POST `/api/devices/:id/connect`, POST `/api/devices/:id/disconnect`, POST `/api/devices/:id/revoke-trust`, GET `/api/devices/:id/capabilities` |
| Pairing | GET and POST `/api/pairing/requests`, POST `/api/pairing/:id/approve`, POST `/api/pairing/:id/reject` |
| Clipboard | GET and POST `/api/clipboard`, PATCH and DELETE `/api/clipboard/:id`, POST `/api/clipboard/:id/push`, GET `/api/clipboard/export` |
| Transfers | GET and POST `/api/transfers`, GET `/api/transfers/:id`, POST `/api/transfers/:id/upload`, GET `/api/transfers/:id/download`, POST `/api/transfers/:id/retry`, POST `/api/transfers/:id/cancel` |
| Activity | GET `/api/activity`, POST `/api/activity/:id/read`, POST `/api/activity/mark-all-read` |
| Other | GET `/api/notifications`, GET `/api/messages`, GET and PATCH `/api/settings`, GET `/api/events` |

Manual devices accept `{ host, name? }`. Pairing requests accept `{ deviceId }`; approval requires `{ code }`. All trust is local development trust. Discovery returns only seed records with `development: true` and `networkDiscoveryPerformed: false`.

Clips accept `{ text, deviceId? }` (local only); updates accept `text`, `pinned`, `archived`. Text is limited to 65536 characters. Text already queued to a companion is immutable: create a new clip so receipts always refer to the correct contents. Export returns the server notebook as a JSON attachment. Clipboard push accepts `{ deviceId }` and queues text to a trusted, connected Android clipboard companion; unsupported, offline, unauthorized or source-device destinations are rejected. New clips automatically queue to currently connected companions. Browser Copy is a separate user-initiated clipboard action; the browser cannot continuously observe your OS clipboard.

Native routes and credential/receipt semantics are described in [Android companion](android-companion.md). Device credentials are hashed at rest on the server and excluded from device responses. Clipboard history is plaintext on the server. The workspace API itself is still unauthenticated; a paired-device bearer token does not make this a secure public deployment.

Settings accept `theme` (`system`, `dark`, `light`), `archive`, `compact`, and partial `permissions` (`clipboard`, `files`). These are local application controls, not native OS permissions. Archive controls moving clips into the server's archive; existing records are retained when it is switched off.

## Files

POST `/api/transfers` accepts `{ name, size, deviceId?, expectedChecksum? }`. The only supported destination is `local`. Optional expectedChecksum is a lowercase SHA-256 hex string. The returned id is used for a multipart POST with exactly one field named `file`.

Bytes stream to a generated `.part` file with backpressure. Size and SHA-256 are computed incrementally; bytes must match the declared size, and the checksum must match when supplied. The stream is never collected into a full-file memory buffer. A verified payload is renamed to its generated storage identifier before committing `uploaded_locally`. User filenames are display/download names only.

State transitions: `queued → uploading → uploaded_locally`; failed uploads enter `failed`, and retry changes `failed → queued`. Cancellation is allowed from queued or uploading. `delivered` is reserved. No timers simulate progress or completion. Browser progress measures the request upload; backend success confirms storage and verification.

On cancellation, interruption, invalid multipart content, or limit violation, streams stop and partial files are removed. Startup marks interrupted uploading records failed and cleans partial files. Concurrent uploads for the same id are rejected. Restart does not reset the notebook, settings, or completed uploads.

## Events and frontend

SSE emits `device.updated`, `pairing.updated`, `clipboard.updated`, `transfer.updated`, `activity.created`, and `permission.updated`. Payloads contain resource id and store revision. Events follow successful persistence; clients refetch on connection/reconnection, so no durable event replay is required. Read-status changes also invalidate activity through `activity.created`.

Only approved frontend files are served. `/api` responses are not cached by the service worker. Offline status shows stale-data feedback; actions do not fall back to mock success.

## Verification

`npm test` uses isolated temporary stores and real HTTP/multipart streams. It covers required route groups, restart persistence, corruption, capability and relationship validation, exact downloads/checksums, limits, cancellation, interrupted/concurrent uploads, SSE, and binding configuration. `npm run check` checks all JavaScript and seed state invariants; `npm run build` regenerates the existing distribution.

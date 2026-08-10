# Privacy model

Clippy is designed to move only what the user explicitly allows.

## Rules

- Clipboard history is opt-in.
- Clipboard previews are masked for sensitive content.
- Files transfer device-to-device without plaintext exposure to the relay.
- Diagnostics are redacted by default.
- Background behavior on iOS stays visible and user-approved.

## Data minimization

- Keep only what is needed for trust, reconnect, and transfer queues.
- Avoid collecting contact, notification, or app content unless the feature explicitly requires it and the platform permits it.
- Never sync private device keys through the backend.


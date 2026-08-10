# Threat model

## Assets

- Device identity keys
- Session keys
- Trusted-device records
- Clipboard items
- File payloads and metadata
- Relay tokens and queue state

## Threat actors

- Network MITM
- Malicious paired device
- Local malware on a desktop machine
- Abuse through clipboard or transfer metadata
- Relay operator with infrastructure access

## Entry points

- QR codes
- Manual host/IP entry
- Discovery packets
- Relay messages
- Clipboard text
- File names and file metadata
- Deep links and share-sheet payloads

## Invariants

- All device-to-device content is encrypted and authenticated.
- Pairing requires human verification on both devices.
- Remote actions are deny-by-default and permission-scoped.
- Logs must not expose clipboard contents or file names.

## Abuse cases to guard against

- Replay
- Device cloning
- Relay impersonation
- Path traversal
- Unsafe overwrite
- Command injection
- Malicious rich content


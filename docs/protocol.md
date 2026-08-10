# Protocol

## Versioning

The protocol is versioned and typed. Peers must negotiate capabilities before sending feature-specific messages.

## Message rules

- Use monotonic sequence numbers.
- Require acknowledgements for state-changing operations.
- Bound queue sizes and expiry windows.
- Reject oversized payloads early.
- Treat filenames, clipboard contents, and discovery packets as attacker-controlled.

## Compatibility

- New fields should be additive where possible.
- Breaking changes require a version bump and explicit negotiation.


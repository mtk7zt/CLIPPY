# Clipboard v1.1 verification log

## Baseline recovery — 2026-09-08, before production changes

Android Studio Pixel emulator (`emulator-5554`), endpoint `http://10.0.2.2:4173`.
The original pairing was retained. The temporary QA backend store was reused, not reset.

- Existing companion was paired/trusted and sync enabled when inspected.
- Disabled then re-enabled the foreground service: actual Android clipboard receipt, backend acknowledgement, outgoing Android clipboard publish, and absence of echo all passed.
- Repeated service stop/start: both directions and exactly one receipt passed again.
- Restarted the same backend. The baseline test encountered a connection failure during restart; it did not wait through that outage. Subsequent inspection showed no Clippy service running and the trusted record offline. Automatic recovery is not verified by this baseline.
- Code tracing identifies a recovery gap: startup intentionally marks native devices offline; polling requires a connected record but never reconnects it, and Activity status handling stops sync for an offline record.

The existing concurrency fix survives manual service restarts. Next: a regression for authenticated resume that preserves explicit disconnect/revocation, then resilient end-to-end restart verification. No UI or production transport changes preceded this record.

Test strings were synthetic; no clipboard contents or credentials are included in this log.

## Recovery fix verified before background/UI expansion

The rebuilt APK passed all three real-emulator recovery rounds: re-enable after shutdown, a second service restart, and an automatically coordinated same-store backend restart. Each round checked actual Android clipboard content, outgoing publish, one acknowledgement and no echo. Existing 22 JVM regressions and the new authenticated-resume backend regression passed. The recovery runner now waits through the deliberate outage.

# Android companion v1

The native Java companion supports browser-approved pairing and text clipboard sync. It does not implement the rest of KDE Connect. The web frontend remains plain JavaScript and uses the same Express backend.

## Connect and pair

1. On a trusted development network, run the backend with `HOST=0.0.0.0` (PowerShell: `$env:HOST = '0.0.0.0'`, then `npm run dev`). Port defaults to 4173; `PORT` and `HOST` override it.
2. Build from `android/` using `gradlew.bat :app:testDebugUnitTest :app:assembleDebug` or Android Studio. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
3. Enter the full server URL. Android Emulator usually uses `http://10.0.2.2:4173`. BlueStacks may need your computer's LAN IP, for example `http://192.168.1.42:4173`. Android's `127.0.0.1` refers to Android, not your PC. These are editable examples, not discovered endpoints.
4. Enter the Android-displayed code under Devices → Pairing & trust in the web workspace. The app remains untrusted until browser approval. Codes expire after five minutes; requests can be rejected or cancelled.
5. Enable sync and keep Clippy visible. The Clipboard screen offers text entry for a direct copy-and-sync check, plus last sent/received items and acknowledgement state.

One `ServerUrl` utility validates every request: trim whitespace/trailing slashes, require an absolute HTTP(S) host and optional valid port, reject paths/credentials/query/fragments, then append the API path. Invalid input remains editable. Release rejects HTTP; debug permits local HTTP. Redirects are not followed.

Connection, Clipboard and Settings use Clippy's navy surfaces, blue/teal accents, rounded cards and explicit states. Settings includes retry, sync toggle, local credential clearing, revocation, endpoint, version and capability limitations.

## Native API

| Route | Behavior |
| --- | --- |
| POST `/api/native/devices/register` | `{name, platform:"android", capabilities:["clipboard"]}` → device, pending pairing, one-time token |
| GET `/api/native/status` | Trust, connection, pairing and clipboard-permission state |
| POST `/api/native/pairing/approve` | `{pairingId, code}` confirms an already browser-approved request; cannot self-grant trust |
| POST `/api/native/pairing/cancel` | `{pairingId}` cancels this device's pending request |
| POST `/api/native/devices/connect`, `/disconnect`, `/revoke-trust` | Authenticated connection and authorization lifecycle |
| POST `/api/native/clipboard/publish` | `{text,eventId}` publishes text; `/api/native/clipboard` remains an alias |
| GET `/api/native/clipboard/pending` | Pending deliveries queued to this device, excluding its own clips |
| POST `/api/native/clipboard/:id/ack` | Receipt accepted only after the item was offered to this device |

Native authenticated requests carry `X-Clippy-Device-Id` and `Authorization: Bearer …`. The server stores token hashes, strips them from device responses and migrates legacy plaintext credentials. Android encrypts its token with Android Keystore AES-GCM; backup is disabled. Clipboard contents are not logged. The server still stores plaintext history; this is not end-to-end encryption. Workspace routes are unauthenticated and must not be exposed publicly.

New clips queue to connected companions. Older clips can be pushed from the notebook. The UI says “Waiting for Android” until acknowledgement. Native retries reuse an event ID; duplicate suppression persists on the backend and rejects reuse for different text. Acknowledgements are idempotent and validate the offered item/device relationship. Presence expires after 30 seconds without contact; restart marks devices offline until reconnected.

## Scheduling and platform limits

Polls, uploads and acknowledgements have independent single-thread scheduled executors. Each poll schedules its successor after completion; at most one poll runs. Upload/ack retries stop after five attempts, with delays of 1, 2, 4 and 8 seconds. Poll retry delay caps at 30 seconds. Later polls may retry unacknowledged items. Remote writes carry a marker; duplicate local values and up to 2048 received IDs per service run are suppressed.

Stopping removes listeners/main callbacks, cancels scheduled work, interrupts workers and disconnects active HTTP calls. The service does not restart automatically. After an exhausted outbound retry, restart sync and copy again; a durable Android outgoing queue remains deferred.

A foreground service does not grant unrestricted background clipboard access. Keep the Activity visible to share local changes. OS restrictions still apply. Native discovery, notification mirroring, SMS, remote input, media control, file delivery and iPhone native sync remain unavailable. Web files complete as “Uploaded locally”, never fabricated as delivered.

## Verification commands

`gradlew.bat :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest` builds both APKs. JVM regressions cover URL/HTTPS rules, independent workers, shutdown, bounded retries, stable retry event IDs and echo suppression.

Install the application and androidTest APKs into an **unpaired test instance**, then run:

```text
adb shell am instrument -w -e serverUrl http://YOUR_PC_LAN_IP:4173 dev.venturis.clippy.test/dev.venturis.clippy.ClipboardFlowTest
```

Use an isolated backend store. This runner creates test pairing/clipboard records and refuses to overwrite existing pairing credentials. It checks invalid drafts, registration, approval, the actual Android clipboard in both directions, acknowledgements, later uploads, echo suppression and shutdown. A compiled test APK is not evidence of a passing device run; inspect its PASS/FAIL output.

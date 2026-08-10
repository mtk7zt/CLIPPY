# iOS limitations

Clippy on iOS is designed to be honest about what the platform allows.

## Supported with limits

- Foreground clipboard actions
- File transfer via approved background mechanisms where available
- App Intents / Shortcuts integration
- Local discovery while the app can participate

## Not permitted as product promises

- Permanent always-on background execution
- Silent global clipboard monitoring
- Reading every other app’s notifications
- Background behavior after force quit

## Fallbacks

- Use explicit user actions for copy / send.
- Surface an inbox when background clipboard receive is delayed.
- Show suspended-by-OS and retrying states instead of pretending the app is still active.


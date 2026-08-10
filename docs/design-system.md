# Clippy design system

Clippy’s visual direction is calm, premium, and implementation-friendly.

## Core tokens

- Background: deep navy-black with subtle radial highlights.
- Surfaces: soft graphite cards with thin, low-contrast borders.
- Accent: cool blue for primary actions and verified states.
- Success: green for trusted and completed states.
- Warning: amber for relay fallback, sensitivity, or partial availability.
- Danger: red for disconnected or blocked states.

## Layout mobility

The UI supports three density modes:

- Compact: tighter spacing for power users and small laptops.
- Balanced: default desktop and mobile-friendly rhythm.
- Spacious: extra breathing room for accessibility or larger displays.

## Icon system

- Use a single SVG icon family with matching stroke weight and rounded joins.
- Keep icons simple, scalable, and never raster-only.
- Treat the icon pack as a reusable component set: clipboard, file, pairing, ping, remote input, settings, shield, wifi.

## Motion language

- 140–180ms transitions for hover and selection.
- Soft state changes for connected/disconnected/reconnect.
- Avoid decorative motion that hides status or trust information.

## Figma-ready component groups

- App shell
- Sidebar navigation
- Status pills
- Device cards
- Clipboard notebook rows
- Export actions
- Settings/plugin cards
- Icon pack tiles


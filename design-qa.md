# Clippy iOS Polish Design QA

- Product: responsive Clippy PWA and Figma builder
- Desktop evidence: `output/playwright/ios-polish-desktop.png`
- Mobile evidence: `output/playwright/ios-polish-mobile-validated.png`
- Pinterest asset manifest: `output/references/pinterest/manifest.json`
- Motion evidence: `output/references/pinterest/motion-frame.png`
- Keynote source: `C:\Users\esosa\.codex\generated_images\019ff2a2-2324-76b1-a460-44f85741a9b0\call_OhFDhQCTnbPW5UKGpgeEQrbd.png`
- Composition template: `C:\Users\esosa\.codex\skills\artifact-template-clippy-venturis-calm\assets\reference.png`

## Reference Synthesis

- Glass Toggle: spherical focus, soft refraction, and calm capsule geometry.
- Liquid Home: prismatic rim motion around a stable dark control.
- Floating Dock: compact dock, circular focus puck, and separate search/action affordance.
- Frosted Commerce: large type, nested translucent panes, and low-contrast light-mode glass.
- macOS/AirDrop: rounded desktop window, sidebar hierarchy, icon tiles, and grouped content.
- Dashboard references: retained disciplined hierarchy only; dense tables and finance styling were rejected.

## Verification

- Desktop shell is floating, rounded, layered, and retains every Devices task.
- Mobile layout switches to an iOS-specific composition rather than shrinking desktop.
- Bottom navigation is floating, safe-area-aware, and exposes Devices, Clipboard, Files, and Settings.
- Manual IP/host pairing remains visible on desktop and mobile.
- Connected is green, Disconnected is red, and relay fallback is amber.
- Settings keeps its required name.
- Liquid rim and focus-puck motion are subtle and disabled by reduced-motion preferences.
- Figma builder uses editable frames, components, variables, ambient auras, capsule controls, and a floating tab dock.

## Findings

No actionable P0, P1, or P2 visual mismatch remains in the captured Devices views.

- P3: Windows headless Chrome enforces a minimum narrow-window layout and can crop screenshots below roughly 500px. The validated 500px capture remains inside the mobile breakpoint and shows the complete responsive layout. Physical Safari testing is still required for exact iPhone safe-area and standalone-PWA behavior.
- P3: Pinterest videos were reviewed from downloaded public MP4 assets. Their motion principles were adapted, not copied as product artwork.

## Comparison History

- Pass 0: Figma generation blocked or blank.
- Pass 1: partial Figma shell; rectangle container failure identified.
- Pass 2: complete editable desktop and iPhone Figma composition.
- Pass 3: functional responsive PWA created; desktop retained dashboard-like edges.
- Pass 4: actual Pinterest images and MP4s downloaded and inspected; iOS liquid-glass system applied to app and Figma builder.

final result: pass

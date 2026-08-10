# ADR 0001 — Dependency-free prototype shell

## Status

Accepted for the current implementation pass.

## Context

The workspace does not contain the KDE Connect source tree, and external package installation is not available in this build environment.

## Decision

Build the first Clippy implementation as a dependency-free static prototype using HTML, CSS, and vanilla JavaScript.

## Consequences

- The app runs immediately in this workspace.
- The design system and interaction model are still real and testable.
- A later migration to Tauri / SwiftUI can reuse the product structure and interaction model.


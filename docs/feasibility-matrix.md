# Feasibility matrix

| Capability | Windows | macOS | Linux | iOS foreground | iOS background | App Store risk | Approved fallback |
|---|---|---:|---:|---:|---:|---|---|
| Local discovery / Bonjour | Supported | Supported | Supported | Supported with limits | Supported with limits | Low | Manual host entry if discovery fails |
| QR pairing + trust confirmation | Supported | Supported | Supported | Supported | Not permitted | Low | Foreground pairing only |
| Clipboard sync | Supported | Supported | Supported | Supported with limits | Not permitted | Medium | Explicit copy / paste inbox |
| File transfer | Supported | Supported | Supported | Supported with limits | Supported with limits | Low–Medium | Background URLSession where allowed, otherwise resume on return |
| Remote input | Supported | Supported | Supported | Supported as controller UI | Not permitted for continuous silent control | Medium–High | Permission-scoped controls only |
| Notification mirroring | Supported where legitimate OS APIs exist | Supported where legitimate OS APIs exist | Supported where legitimate OS APIs exist | Not generally available | Not permitted | High | Product-owned notifications and user-driven alternatives |
| Always-connected background presence | Supported | Supported | Supported | Not guaranteed | Not permitted | High | Honest states: offline, retrying, suspended-by-OS |
| Encrypted relay fallback | Supported | Supported | Supported | Supported with limits | Supported with limits | Low | Queue when unavailable |
| Self-hosted relay | Supported | Supported | Supported | Supported with limits | Supported with limits | Low | Later milestone |


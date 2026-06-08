# Make Wake Up Wednesday installable on phones

Goal: let visitors tap a button to add the site to their phone's home screen. It opens full-screen with the Wake Up Wednesday icon — looks and feels like an app. No offline mode (still needs internet to load).

## What changes

### 1. Verify/polish the web app manifest
The project already has `public/manifest.webmanifest` with the right basics (name, theme color, standalone display, icons). Confirm the icon files referenced (`/icon-192.png`, `/icon-512.png`) exist in `public/`. If missing, generate them from the Wake Up Hartford logo.

### 2. Add iOS-specific head tags
iOS Safari doesn't fully read the manifest. Add to `src/routes/__root.tsx` head:
- `apple-touch-icon` link (180x180)
- `apple-mobile-web-app-capable` = "yes"
- `apple-mobile-web-app-status-bar-style`
- `apple-mobile-web-app-title` = "Wake Up Wed"

### 3. Install prompt component
Create `src/components/InstallPrompt.tsx`:
- Listens for the browser's `beforeinstallprompt` event (Android/desktop Chrome)
- Detects iOS Safari separately (no event there — show manual "tap Share → Add to Home Screen" instructions)
- Hides itself if app is already installed (`display-mode: standalone` check) or user dismissed it (remembered in `localStorage`)
- Shows a small, friendly banner at the bottom of the screen with:
  - "Add Wake Up Wednesday to your home screen"
  - Install button (Android/desktop) OR short instructions (iOS)
  - Dismiss (×) button
- Styled to match the existing warm/civic design (gold/primary tokens, `shadow-soft`, rounded)

Mount it in `src/routes/__root.tsx` near `<ThemeToggle />` so it appears on every page.

### 4. No service worker
Per the request (home screen icon only, no offline), skip `vite-plugin-pwa` and service workers entirely. The manifest + iOS tags + install prompt are enough for "Add to Home Screen."

## Technical notes
- `beforeinstallprompt` only fires once per session and only on supported browsers (Chrome/Edge on Android & desktop). The component must capture and stash the event, then call `.prompt()` on click.
- iOS detection: `/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream`
- Already-installed detection: `window.matchMedia('(display-mode: standalone)').matches` OR `(navigator as any).standalone === true` (iOS)
- Dismissal persistence: `localStorage.setItem('wuw-install-dismissed', timestamp)` — re-show after 14 days
- The install prompt cannot work in the Lovable preview iframe; it only fires on the published site opened directly. Mention this to the user when delivering.

## Out of scope
- Offline caching / service worker
- App Store / Play Store native builds (separate Capacitor path)
- Push notifications
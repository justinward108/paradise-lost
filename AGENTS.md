# Agent Instructions — Paradise Lost

## Branch & Release Policy (R16)

1. **Single-branch workflow (`main` only)**:
   - All development, fixes, and content updates happen directly on `main`.
   - Do not create feature branches, staging branches, or release branches unless explicitly instructed by the user.
   - Always verify `npm run check` and `npm run validate-content` before committing to `main`.

2. **Publication status (owner updated 2026-10-31)**:
   - The owner explicitly lifted the publication hold in the playtest implementation chat. `[skip ci]` is no longer required for that hold.
   - Run the required checks before committing or releasing. Do not imply local changes are deployed; verify publication separately.

3. **Portal Analytics & Privacy (`G-7BQ8R81F1M`)**:
   - Keep `<meta name="poorcamp-analytics-id" content="G-7BQ8R81F1M" />` and `<script defer data-portal-analytics src="/portal-analytics.js"></script>` intact in `packages/client/index.html` and `public/portal-analytics.js` / `packages/client/public/portal-analytics.js`.
   - Never send player-typed notes, names, or query parameters to analytics.

4. **Mobile & Capacitor Packaging**:
   - `capacitor.config.json` targets `appId: "camp.poor.paradiselost"` with `webDir: "dist/client"`.
   - Keep `viewport-fit=cover`, `apple-mobile-web-app-capable`, `manifest.webmanifest`, and safe-area inset CSS (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) intact.

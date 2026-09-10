# TMA Family Office — iPhone Web Prototype

Experimental, mobile-first web prototype of **TMA Family Office**. This is
**not** the final product — the final version will be a standalone Windows
desktop application. This prototype exists only to test the idea, design,
navigation, data entry, and local persistence on iPhone before that build.

## Technology Stack

- **React 19 + TypeScript** — UI and app logic
- **Vite** — dev server / build tool
- **react-router-dom** (`HashRouter`) — client-side routing, safe for static
  hosting and offline/PWA use without server rewrite rules
- **idb** — small Promise wrapper around the native **IndexedDB** API
- **vite-plugin-pwa** — service worker + web app manifest, installable to
  the iPhone Home Screen
- No backend, no cloud database, no login — everything runs and persists
  entirely in the browser on-device.

## Project Structure

```
src/
  components/     Reusable UI building blocks (Header, EmptyState, ...)
  pages/          Route-level screens (DashboardPage, ...)
  features/       Future domain modules (family, vehicles, staff, ...) — empty for now
  storage/        IndexedDB setup and access (db.ts)
  services/       Future business/file logic (backup, file storage, ...) — empty for now
  hooks/          Shared React hooks (useLanguage, usePersistentSetting)
  localization/   ar/en dictionaries, language context, RTL/LTR mapping
  styles/         Global CSS: dark theme tokens + resets
  assets/         Static assets used by the app
  utils/          Shared helpers — empty for now
```

Feature domains (Family, Vehicles, Staff, Properties, Contracts, Tasks,
Education, Health, Notifications, Archive) are **intentionally not built
yet** in this step — only the app skeleton.

## Local Storage

All data lives in **IndexedDB**, via a single database
(`tma-family-office`, `src/storage/db.ts`). Right now it has one
`settings` object store (a generic key/value store), used to persist the
selected language. Future feature modules will add their own object
stores to the same database (bumping the schema version), instead of
inventing a new storage mechanism per feature.

`src/hooks/usePersistentSetting.ts` is a small reusable hook that reads a
key from `settings` on mount and writes it back on every change — this is
what the language switcher uses, and what future preference/data hooks
should build on to avoid duplicating persistence logic per screen.

Data survives closing the tab, reopening it, and adding the app to the
Home Screen, because IndexedDB is per-origin persistent browser storage,
not tied to the page's lifetime.

## Language / RTL / LTR

- Arabic (default) and English are supported, with full Unicode data
  entry (Arabic and Latin names, brand names, mixed text, etc.).
- Arabic renders **RTL**, English renders **LTR** — `<html dir>`/`lang`
  are updated live from `LanguageProvider` (`src/localization`).
- The chosen language persists in IndexedDB and is restored on next
  launch.

## Dark Mode

Dark mode only, no light theme. Colors, spacing and radii are defined as
CSS custom properties in `src/styles/theme.css` (deep charcoal background,
muted gold accent) and consumed by component-level CSS files. Controls use
a 48px minimum touch target and respect the iPhone safe-area insets.

## PWA

`vite-plugin-pwa` generates a web app manifest and service worker so the
app can be added to the iPhone Home Screen and launch full-screen
(`display: standalone`). Icons live in `public/icons/` and
`public/apple-touch-icon.png`.

## Running locally

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (tsc -b && vite build)
npm run lint      # oxlint
```

## Known limitations at this stage

- No feature screens yet (Family, Vehicles, Staff, Properties, Contracts,
  Tasks, Education, Health, Notifications, Archive) — only an empty
  Dashboard placeholder.
- No image/file picker or attachment storage yet.
- No Export/Import backup yet.
- Nothing here should be read as a decision for the future Windows
  architecture (no USB/SQLite/printer/scanner/hardware concerns apply to
  this prototype).

# TMA Family Office — iPhone/PWA Prototype

A mobile-first, installable web app (PWA) for managing a family office's
household records: family members, properties, vehicles, staff, contracts,
tasks, health and education records, plus an archive and a derived
notifications feed. Arabic (default, RTL) and English (LTR) are both fully
supported.

This is a **local-first prototype**: everything is created, stored, and
read entirely in the browser via IndexedDB. There is no backend, no cloud
sync, and no login. A separate, standalone **Windows desktop application**
is the intended long-term product; nothing in this codebase (architecture,
storage, or UI decisions) should be read as a commitment for that future
build — see [Relationship to the future Windows app](#relationship-to-the-future-windows-app).

**Repository**: `atalqahs/TMA-Family-Office-iOS`
**Application branch**: `claude/tma-family-office-prototype-1szgbc` (the
default branch, `main`, currently holds only this repository's very first
commit and no application code — see [Branches](#branches)).

## Implemented modules

| Module | What it covers |
| --- | --- |
| Family | Family members: identity fields, Civil ID/Passport (with expiry dates), photo, documents |
| Properties | Owned/rented real estate, with documents |
| Vehicles | Vehicles plus a maintenance history (service records, mileage-based or date-based due tracking) |
| Staff | Household staff, documents, and a salary schedule/payment history (weekly/monthly/yearly recurrence) |
| Contracts | Contracts optionally linked to a Family member/Property/Vehicle/Staff record |
| Tasks & Reminders | Task Groups containing recurring or one-off Tasks with an optional due date/time, and a calendar view |
| Health | One optional health profile per Family member (status/height/weight/allergies/notes) plus documents |
| Education | One optional education profile per Family member (stage/institution/grade/specialization/status) plus documents |
| Notifications | A derived (never stored) feed of expiring documents, upcoming/overdue maintenance, salary due dates, and task due dates — always computed fresh from the modules above |
| Archive | A visibility state (ACTIVE ↔ ARCHIVED) for records in every module above; archived records keep producing notifications and are only removed via an explicit, permanent delete |
| Settings | Language switch (Arabic/English), reachable from the header |

Every module follows the same layered shape: `types.ts` (the data model),
`*Repository.ts` (IndexedDB access), `*Service.ts` (business operations
built on the repository), `validation.ts`, `hooks/` (data-loading React
hooks), and `components/`+a page under `src/pages/` for the UI.

There is **no global search** and **no "Trash"/soft-delete state** — both
were deliberately removed. A record's lifecycle is
`ACTIVE ↔ ARCHIVED → PERMANENT DELETE`: archiving only changes visibility
(archived records still generate notifications and are fully intact),
and deleting is immediate, permanent, and always explicitly confirmed as
irreversible.

## Technology stack

- **React 19 + TypeScript**, built with **Vite**
- **react-router-dom** (`HashRouter`) — safe for static hosting (GitHub
  Pages) and offline/PWA use with no server-side rewrite rules
- **idb** — a small Promise wrapper around the native **IndexedDB** API
- **vite-plugin-pwa** — service worker + web app manifest (installable to
  the iOS Home Screen)
- **Vitest** + **fake-indexeddb** + **@testing-library/react** — the
  permanent regression suite (unit, service/repository, and UI-level
  tests)
- **oxlint** — linting
- A project-specific architecture gate (`scripts/check-architecture.mjs`)
  — see [Architecture gate](#architecture-gate)

## Runtime requirements

Node **22.22.2** (or `^24.15.0`/`>=26.0.0` — see `engines` in
`package.json`), matching what CI and the deploy workflow both use. A
`.nvmrc` is provided:

```bash
nvm use   # or: nvm install
```

An older Node 20 will fail to run the test suite (`vitest`/`jsdom`
require at least the versions above) even though the Vite build itself
may still work — always develop and verify against the pinned version.

## Getting started

```bash
npm install
npm run dev             # local dev server (Vite)
```

## Building

```bash
npm run build            # production build, served from "/"
npm run build:pages      # production build for GitHub Pages, served from "/TMA-Family-Office-iOS/"
npm run preview          # serve the last `build` output locally
```

`VITE_BASE_PATH` controls the base path baked into the build (asset URLs,
the PWA manifest, and the service worker scope) — `build:pages` sets it to
this repository's GitHub Pages sub-path; `build`/`dev` default to `/`.

## Testing and quality gates

```bash
npm run typecheck         # tsc, app + test suite
npm run lint               # oxlint
npm run test:run           # the permanent Vitest regression suite
npm run test:watch         # the same suite, watch mode
npm run test:coverage      # the same suite, with coverage
npm run test:architecture  # the project-specific architecture gate (see below)
npm run quality            # all of the above, plus both production builds — what CI runs
```

Run `npm run quality` before opening a PR; CI (`.github/workflows/quality.yml`)
runs the same checks on every push to the application branch and on every
pull request.

### Architecture gate

`scripts/check-architecture.mjs` is a small TypeScript-compiler-API-based
static checker (not a fragile text grep) enforcing invariants that are
easy to violate by accident as the app grows, including: no circular
imports, Tasks stays fully independent of every other domain module,
IndexedDB access stays confined to `storage/`/`*Repository.ts` files, no
destructive `deleteDatabase()`/store `.clear()` calls, no
`@ts-ignore`/`@ts-expect-error`, no runtime network calls
(`fetch`/`XMLHttpRequest`/`axios`/...), Notifications and Archive stay
derived aggregators (never a second persisted copy of domain data, never
imported *by* a domain module), and `DB_VERSION` always matches the
highest `if (oldVersion < N)` migration step actually present in
`storage/db.ts` (so a schema bump and its migration can never silently
drift apart).

## Local storage

Everything is stored in one IndexedDB database, `tma-family-office`
(`src/storage/db.ts`), currently at schema version 14. Each feature module
above has its own object store(s) (e.g. `familyMembers` +
`familyMemberDocuments`, `vehicles` + `vehicleDocuments` +
`vehicleMaintenanceRecords`, `staffSalarySchedules` +
`staffSalaryPayments`, ...). Schema changes are versioned, additive
migrations in `db.ts`'s `upgrade()` callback — a migration never destroys
or resets existing data; see that file's own comments for the documented
policy each past migration followed.

**Data lives only on the device/browser it was entered on.** It survives
closing the tab, reopening it, and reinstalling the PWA to the Home
Screen (IndexedDB is per-origin persistent browser storage), but:

- There is **no export/import or backup/restore feature yet**. Clearing
  Safari's site data, or moving to a different device/browser, loses
  everything with no way to recover it. This is the most significant
  release-readiness gap for real use.
- There is **no sync between devices** — a phone and a desktop browser
  each have their own independent copy of the data.
- Storage is subject to the browser's own IndexedDB quota; a quota or
  database-lifecycle error surfaces as a visible error state in the UI
  rather than silently discarding a write.

## Attachments

Every module with documents (Family, Properties, Vehicles, Staff,
Contracts, Health, Education) shares one validation/handling layer
(`src/utils/fileValidation.ts`, `src/utils/documentOpen.ts`):

- Accepted formats: PDF, JPEG/JPG, PNG, HEIC, WEBP, Word (`.doc`/`.docx`),
  Excel (`.xls`/`.xlsx`).
- Maximum file size: 20 MB.
- A file's MIME type is trusted first when it's specific and reliable; if
  it's missing or one of the generic/zip placeholders iOS sometimes
  reports for Office documents, the file's extension decides instead. A
  reliable MIME type that contradicts a clearly different, recognized
  extension is rejected. This is a **format/size gate only** — not a
  malware or content-safety scan.
- Files are stored as `Blob`s directly in IndexedDB. PDFs and images
  preview inline (via `URL.createObjectURL`, released on unmount/change
  through `useObjectUrl`); Word/Excel documents are handed off to the
  browser/OS's own viewer or another app (this app never renders Office
  documents itself).

## Language, RTL/LTR, and theme

- Arabic (default) and English are both fully supported; `<html
  dir>`/`lang` update live from `LanguageProvider`
  (`src/localization/`), and the chosen language persists in IndexedDB.
- Dark mode only (deep charcoal background, muted gold accent), defined
  as CSS custom properties in `src/styles/theme.css`. Controls use a
  48px minimum touch target and respect the iPhone safe-area insets.

## PWA install and offline behavior

`vite-plugin-pwa` (`registerType: 'autoUpdate'`) generates a web app
manifest and a precaching service worker, so the app can be added to the
iPhone Home Screen and launches full-screen (`display: standalone`). On
first successful load the app shell (HTML/JS/CSS/icons/manifest) is
precached; a subsequent load with no network connection still renders
the full app shell from that cache. `autoUpdate` means a new deployed
version is fetched in the background and takes over on the next reload,
without ever touching the IndexedDB data already stored on the device.

## Testing this app in a browser vs. on a real device

The permanent Vitest suite runs against `jsdom` (a simulated DOM), and
this project's own maintenance passes have additionally exercised the
built app in a real Chromium browser (desktop-class WebKit/Chromium
engine, not Mobile Safari) for a handful of realistic journeys — default
Arabic/RTL, switching to English/LTR, adding a record and seeing a
derived notification, a narrow mobile viewport, offline reload after
first load, and both the root-path and GitHub Pages sub-path builds.
**None of this substitutes for testing on a real iPhone in Mobile
Safari** — iOS-specific behavior (the Home Screen install prompt, Safari
file-picker MIME quirks, on-screen keyboard/viewport interactions,
Safari's own storage-eviction policy for infrequently-used sites) can
only be confirmed on an actual device.

## Known limitations

- **No backup/restore or export/import.** See [Local storage](#local-storage) above — this is the top release-readiness gap.
- **No multi-device sync.** Each browser/device has an independent copy of the data.
- **No real-device (iPhone/Safari) test coverage** has been automated — see the section above.
- **No authentication.** Anyone with access to the device/browser has full access to the data — acceptable for a single-owner household prototype, not for a shared or multi-user deployment.
- The production bundle is a single ~570 KB (~143 KB gzipped) JS chunk (no route-based code-splitting yet) — noted by Vite's own build output, not yet addressed.

## Relationship to the future Windows app

This repository is an experimental **iPhone/PWA prototype** used to test
the product idea, data model, and workflows before building the real,
standalone **Windows desktop application**. Nothing here — the use of
IndexedDB, the lack of a backend, the PWA packaging, the local-only
storage model — is a decision about how the Windows app will be built;
that app is expected to have its own storage (e.g. a local SQLite
database), its own installer, and potentially different integrations
(printers, scanners, USB, etc.) that do not apply to a browser-based
prototype at all.

## Branches

- `main` — the repository's default branch; contains only the initial
  commit (a one-line description), no application code.
- `claude/tma-family-office-prototype-1szgbc` — the application branch;
  all of the modules and history described in this README live here.

## Project structure

```
src/
  components/     Shared, generic UI building blocks (buttons, sheets, form fields, ...)
  pages/          Route-level screens (one per module, plus list/profile pairs)
  features/       One directory per domain module (family, properties, vehicles, staff,
                  contracts, tasks, health, education, notifications, archive, categories),
                  each with types.ts / *Repository.ts / *Service.ts / validation.ts /
                  hooks/ / components/
  storage/        IndexedDB setup, schema, and versioned migrations (db.ts)
  hooks/          Shared cross-feature React hooks (useAsyncResource, usePersistentSetting, ...)
  localization/   ar/en dictionaries, language context, RTL/LTR mapping
  styles/         Global CSS: dark theme tokens + resets
  utils/          Shared helpers (file validation, local-date math, expiry-status logic, ...)
tests/            The permanent Vitest regression suite, mirroring src/'s module layout
scripts/          check-architecture.mjs (the architecture gate)
```

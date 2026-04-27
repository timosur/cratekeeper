---
applyTo: "frontend/**"
---

# Frontend Instructions — `frontend/`

React 19 + Vite 8 + TypeScript 6 + Tailwind 4 SPA. The web UI is the primary
control surface for the cratekeeper backend (single operator, localhost).

Always check the design specs in [frontend-plan/](../../frontend-plan/) before
designing new screens — sections under `frontend-plan/sections/` and tokens
under `frontend-plan/design-system/` are the source of truth for layout and
visual language.

## Stack

- **React** 19 (function components + hooks; no class components).
- **Vite** 8 (`npm run dev` on `:5173`, with the API on `:8765`).
- **TypeScript** 6 in strict mode with `noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch`. Use `npm run build` to
  typecheck (`tsc -b && vite build`).
- **Tailwind** 4 via `@tailwindcss/vite`. Tokens are declared in
  [src/index.css](../../frontend/src/index.css) under `:root` /  `.dark`.
  Custom `dark` variant: `@custom-variant dark (&:where(.dark, .dark *));`.
- **Routing:** `react-router-dom` v7 (`BrowserRouter`, `Routes`, `Route`,
  `Navigate`).
- **Icons:** `lucide-react`. No other icon libraries.
- **State:** local `useState` / `useReducer` + small React contexts (e.g.
  `NewEventContext`). No Redux, Zustand, Jotai, or Tanstack Query unless a
  feature genuinely needs them — propose first.
- **Lint:** `npm run lint` (ESLint flat config in `eslint.config.js`).
- **No test runner is configured.** If a change demands tests, propose a
  minimal Vitest setup before adding one.

## Folder Layout

```
frontend/src/
├── App.tsx              # router + theme + global modals
├── main.tsx             # bootstraps <App />
├── index.css            # Tailwind import + design tokens (:root / .dark)
├── shell/               # AppShell (top bar + nav + layout chrome)
├── pages/               # one component per route (EventsPage, EventDetailPage, …)
├── sections/            # feature-scoped subtrees (events/, event-detail/, master-library/, settings/, audit-log/)
│   └── <section>/
│       ├── components/  # presentational pieces
│       ├── types.ts
│       └── sample-data.json   # placeholder data until wired to API
└── components/          # cross-section shared components (modals, contexts)
```

Page components stay thin — they pull data and dispatch navigation. The real
markup lives in `sections/<name>/components/`. Reuse `AppShell` for chrome.

## Conventions

- **Components:** named exports (`export function EventsPage() { … }`). Keep
  presentational components pure; do not call `fetch` from inside them.
- **Types:** colocate per-section types in `sections/<name>/types.ts`. Shared
  cross-section types belong at `src/types/` (create only when a second
  consumer exists).
- **Styling:** Tailwind utilities first; reach for CSS variables (`var(--color-surface-base)`)
  when a value must respond to the `dark` class. Do not add ad-hoc CSS files
  per component.
- **Theme:** the `dark` class is toggled on `<html>` from `App.tsx`
  (`THEME_STORAGE_KEY = "theme"`). Honour both light and dark when designing
  new surfaces — verify against the tokens block in `index.css`.
- **Routing:** add new routes in `App.tsx` and update `ROUTE_TITLES` so the
  top bar shows the right title. Use `useNavigate()` for programmatic nav.
- **Imports:** relative paths only (no path aliases configured). Order: React
  → third-party → local (`./` or `../`).
- **Accessibility:** every interactive element needs a keyboard path and an
  accessible name. Use semantic HTML (`<button>`, `<nav>`, `<dialog>`) over
  `div`+`onClick`.

## Talking to the API

- Backend base URL: `http://localhost:8765` in dev. Vite is **not** configured
  with a proxy yet — use absolute URLs or introduce a thin client at
  `src/api/client.ts` (preferred) before scattering `fetch` calls across pages.
- Auth: send `Authorization: Bearer <CRATEKEEPER_API_TOKEN>` on every call.
  Read the token from a single source (env / settings page) — never hard-code.
- Long-running pipeline steps stream over SSE at `/jobs/{id}/stream`. Use
  `EventSource` and clean up in a `useEffect` return.
- Today most pages render `sample-data.json` from `sections/<name>/`. When
  wiring to real endpoints, replace the import — keep the same TypeScript
  types so the rest of the section keeps compiling.

## Don'ts

- Don't introduce a new state management or data-fetching library without
  proposing it first.
- Don't add path aliases (`@/...`) — the project uses relative imports.
- Don't write CSS-in-JS or per-component `.css` files; use Tailwind utilities
  and the existing tokens.
- Don't ship hard-coded English strings in places marked for i18n in
  `frontend-plan/` without flagging it.
- Don't add icon libraries beyond `lucide-react`.
- Don't bypass `AppShell` for top-level routes — chrome should stay consistent.

## Verification before handing off

1. `cd frontend && npm run lint`
2. `cd frontend && npm run build` (also typechecks via `tsc -b`)
3. Manual sanity check in both light and dark mode.

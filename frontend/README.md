# Cratekeeper Frontend

Single-page React app for the Cratekeeper operator. Wired to the FastAPI
backend at `backend/` over a bearer-protected REST API.

## Tech

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS 4
- React Router v7
- TanStack Query v5 (cache + refetch-on-focus)
- `lucide-react` icons

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local      # then edit VITE_API_TOKEN
npm run dev                     # http://localhost:5173
```

## Environment variables

Read at build time by Vite. Define them in `.env.local` (gitignored).

| Variable             | Default                  | Purpose                                                                            |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`  | `http://localhost:8765`  | Base URL of the Cratekeeper API. No trailing slash.                                |
| `VITE_API_TOKEN`     | _(empty)_                | Bearer token. Must match the backend's `CRATEKEEPER_API_TOKEN`. Required for auth. |

The `apiFetch` client in [src/lib/api/client.ts](src/lib/api/client.ts)
injects `Authorization: Bearer <token>` on every request.

## Project layout

```
src/
├── App.tsx                # routes + QueryClientProvider
├── main.tsx
├── components/            # shared cross-page components (modals, contexts)
├── lib/
│   ├── api/               # typed HTTP client + response types + mappers
│   └── queries/           # TanStack Query hooks and the shared QueryClient
├── pages/                 # one component per top-level route
├── sections/              # design-system sections (Dashboard, EventDetail, …)
└── shell/                 # AppShell (sidebar + topbar) chrome
```

API plumbing always flows: `pages/` → `lib/queries/*` → `lib/api/*`. UI
components stay decoupled from the network layer — pages map backend
payloads to the existing UI props before passing them down.

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (use this to typecheck)
npm run lint      # ESLint
npm run preview   # preview the production build
```

There is no test runner configured yet; the `build` step is the
typecheck gate.

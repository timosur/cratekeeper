# Milestone 01 — Application Shell

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Stand up the **persistent left-sidebar shell** that frames every Cratekeeper view, and wire in the design tokens (colors + typography) the rest of the app depends on.

This milestone produces the chrome only — no section content. After it's done, every subsequent milestone drops its components into the shell's right-column work surface.

## Scope

1. Set up design tokens — Tailwind v4 palette + Google Fonts.
2. Mount the `AppShell` component as the layout wrapper for every route.
3. Wire navigation, the user menu, theme toggle, and the system-status block.

## 1. Design tokens

### Tailwind CSS v4

This project uses **Tailwind v4**. There is **no `tailwind.config.js`** — never reference or create one.

Use Tailwind's built-in palette only. The roles are:

| Role          | Scale     |
| ------------- | --------- |
| **Primary**   | `sky`     |
| **Secondary** | `emerald` |
| **Neutral**   | `neutral` |
| Warning       | `amber`   |
| Danger        | `red`     |

See [../../design-system/tailwind-colors.md](../../design-system/tailwind-colors.md) for the full usage guide.

### Google Fonts

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
>
```

Body uses **Inter**; identifiers, counts, paths, and timestamps use **JetBrains Mono** with `tabular-nums`. See [../../design-system/fonts.md](../../design-system/fonts.md).

### CSS custom properties (optional)

[../../design-system/tokens.css](../../design-system/tokens.css) provides CSS custom properties for surfaces, density, and dark-mode variables. Importing it into your global stylesheet is optional but recommended.

## 2. Mount the shell

Copy `shell/components/AppShell.tsx` into your codebase (suggested path: `src/shell/`). Wrap your route tree:

```tsx
import { AppShell, type NavigationItem } from "./shell/AppShell";

const navigationItems: NavigationItem[] = [
  { label: "Events",         href: "/",        icon: "event",    isActive: pathname === "/" },
  { label: "Master Library", href: "/library", icon: "library",  isActive: pathname === "/library" },
  { label: "Settings",       href: "/settings",icon: "settings", isActive: pathname === "/settings" },
  { label: "Audit Log",      href: "/audit",   icon: "audit",    isActive: pathname === "/audit" },
];

<AppShell
  navigationItems={navigationItems}
  jobActivity={{ running, queued }}
  connection={{ api, sse }}
  user={{ name, email }}
  version="v1.0.0"
  theme={theme}
  topBarTitle={routeTitle}
  onNavigate={(href) => router.push(href)}
  onNewEvent={() => openNewEventModal()}
  onJobsClick={() => router.push("/jobs")}
  onOpenDataFolder={() => api.openDataFolder()}
  onToggleTheme={toggleTheme}
  onLogout={logout}
>
  {children}
</AppShell>
```

> **Event Detail is not in `navigationItems`.** It's reached by clicking an event card on the dashboard; the shell's top bar will show the event name as the breadcrumb.

## 3. Behavior to wire

| Concern                     | What to do                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- |
| Routing                     | Map each `navigationItems[].href` to a route; `onNavigate(href)` calls `router.push`. |
| Active state                | Set `isActive: true` on the item matching the current route.                     |
| Theme                       | Persist the chosen theme (`localStorage` key `theme`); toggle the `dark` class on `<html>`. |
| Job activity                | Subscribe to a job stream (SSE/WebSocket); pass running + queued counts.         |
| Connection health           | Reflect API + SSE health as `"connected" | "idle" | "disconnected"`.             |
| New Event                   | Open a modal that captures name + date + Spotify URL; on submit, navigate to the new event's detail. |
| Open data folder            | Wire to your local API; e.g. `POST /api/system/open-data-folder`.                |
| Logout                      | Clear session, navigate to login.                                                |

## 4. Responsive behavior

This is a **desktop-first operator tool** designed for ≥ 1280px viewports.

- ≥ 1280px: full sidebar, two-column layout.
- 1024–1279px: sidebar collapses to a 64px icon rail with hover tooltips. User menu becomes an avatar-only button.
- < 1024px: render a "Open on a wider screen" notice. Layout is unsupported by design.

## 5. Visual conventions

- **Sidebar width:** 240px on desktop.
- **Active item:** sky-tinted background (`bg-sky-50 dark:bg-sky-950/40`), 2px sky-600 left border accent, sky-700 text.
- **Top bar:** sticky, 56px tall, with a title slot, breadcrumb, and a slot for per-page actions.
- **Content padding:** `px-8 py-6`, no `max-width` — sections like the audit log benefit from the full viewport.
- **Borders:** 1px neutral borders separate every block (nav groups, top bar, sidebar's right edge).
- **Shadows:** flat surfaces; only the user-menu dropdown gets a subtle elevation shadow.

## Done when

- [ ] Inter and JetBrains Mono are loaded and applied.
- [ ] Tailwind v4 is configured; sky / emerald / neutral are used as documented.
- [ ] `AppShell` wraps every route; navigating between sections updates `isActive` and the top-bar title.
- [ ] `+ New Event` opens the create-event modal.
- [ ] User-menu dropdown toggles theme, opens data folder, logs out.
- [ ] System-status block reflects live job counts and connection health.
- [ ] Dark mode works across every surface.
- [ ] Responsive behavior matches the spec at 1024px and below.

## Files to reference

- [shell/components/AppShell.tsx](../../shell/components/AppShell.tsx) — the component
- [design-system/tailwind-colors.md](../../design-system/tailwind-colors.md) — color usage
- [design-system/fonts.md](../../design-system/fonts.md) — font usage
- [design-system/tokens.css](../../design-system/tokens.css) — optional CSS custom properties

# Tailwind Colors

Cratekeeper uses **Tailwind CSS v4** (no `tailwind.config.js`). The palette draws from Tailwind's built-in scales — no custom hexes are introduced.

## Palette

| Role          | Tailwind scale | When to use                                                   |
| ------------- | -------------- | ------------------------------------------------------------- |
| **Primary**   | `sky`          | CTAs, links, focus rings, selected/active states              |
| **Secondary** | `emerald`      | "Healthy / ready / done" — succeeded jobs, matched tracks     |
| **Neutral**   | `neutral`      | Backgrounds, surfaces, text, borders, tables (everything else)|
| Warning       | `amber`        | Stale builds, drift warnings, override severity               |
| Danger        | `red`          | Failed jobs, missing files, destructive actions               |

## Usage examples

### Primary (sky)
```tsx
<button className="bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500">
  + New Event
</button>

// Active nav item
<a className="bg-sky-50 dark:bg-sky-950/40 border-l-2 border-sky-600 text-sky-700 dark:text-sky-300">

// Live job in progress
<span className="text-sky-600">running</span>
```

### Secondary (emerald)
```tsx
// Healthy status dot
<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

// Succeeded badge
<span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
  matched
</span>
```

### Neutral
```tsx
// Card surface
<div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">

// Body text
<p className="text-neutral-700 dark:text-neutral-300">

// Caption / muted
<span className="text-neutral-500">
```

### Warning + danger
```tsx
// Stale build banner
<div className="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">

// Failed job
<span className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
```

## Rules
- **One chromatic accent.** Sky is reserved for interactive elements; never use it decoratively.
- **Status colors are semantic.** Don't use emerald for "this product is healthy" marketing copy.
- **Always pair a `dark:` variant** for every color utility — dark mode coverage is mandatory.
- **Never define custom colors.** Use Tailwind's built-in scales.

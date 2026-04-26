# Fonts

Cratekeeper uses two Google Fonts. Inter for all UI text; JetBrains Mono for any identifier or measurement.

## Google Fonts import

Add to your `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
>
```

Or via CSS:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");
```

## When to use which

| Context                                         | Family          | Weight | Notes                              |
| ----------------------------------------------- | --------------- | ------ | ---------------------------------- |
| Headings, section titles, card titles           | Inter           | 600    | Tight tracking; 700 sparingly      |
| Body copy, labels, buttons                      | Inter           | 400    | 500–600 for emphasis               |
| **Identifiers** — track ids, ISRCs, slugs, IDs  | JetBrains Mono  | 400    | Always mono; truncate with title attr |
| **Measurements** — BPM, key, durations, sizes   | JetBrains Mono  | 400    | Use `tabular-nums` for alignment   |
| **Counts** in stat tiles ("482 masterpieces")   | JetBrains Mono  | 500    | Large display sizes                |
| **Timestamps**, log lines (SSE log)             | JetBrains Mono  | 400    | Subdued color for prefix           |
| File paths                                      | JetBrains Mono  | 400    | Middle-ellipsis truncation         |

## Tailwind utilities

Use these utility classes (available out of the box once fonts are loaded):

```tsx
// Inter (default)
<p className="font-sans">Body text</p>

// JetBrains Mono
<span className="font-mono tabular-nums">128 BPM</span>
<span className="font-mono">trk-0042</span>
```

If you prefer to bind the family explicitly via your `index.css`:

```css
@layer base {
  html { font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; }
  code, kbd, pre, samp,
  .font-mono { font-family: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace; }
}
```

## Conventions

- Numbers and identifiers are **first-class** — show counts, durations, and IDs in monospace.
- All numeric columns in tables get `tabular-nums` so values right-align cleanly.
- Sentence case throughout — avoid title case in UI labels.
- No exclamations.

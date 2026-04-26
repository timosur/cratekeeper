# Design System: Cratekeeper

> Generated on 2026-04-24
> Inspired by the Apple-aesthetic baseline in [DESIGN.md](../../DESIGN.md), adapted for a data-heavy operator tool.

## Colors

### Primary: `sky`
The single chromatic accent — used for primary CTAs, links, focus rings, and selected states. Reserved for interactive elements; never decorative.

### Secondary: `emerald`
Status accent for positive/ready signals — matched tracks, succeeded jobs, healthy quality checks. Pairs cleanly with sky without competing for attention.

### Neutral: `neutral`
Pure gray for backgrounds, surfaces, text, borders, and tables. Mirrors the binary `#f5f5f7` / `#1d1d1f` rhythm from DESIGN.md while reading flatly in dense table contexts.

---

## Typography

### Headings: Inter
Closest free analog to SF Pro. Use weight 600 for headlines and section titles, weight 700 sparingly for card titles. Apply tight tracking (negative letter-spacing) at all sizes per DESIGN.md §3.

### Body: Inter
Same family as headings, weight 400 for body, 500–600 for emphasis. Body sits at 14–17px depending on density.

### Monospace: JetBrains Mono
Used everywhere identifiers and measurements appear: file paths, ISRCs, Spotify IDs, BPM, key, durations, hash digests, audit `target_id`s. Critical for an operator tool where numbers carry meaning.

---

## Brand Personality

**Adjectives:** precise, calm, trustworthy, technical, minimal

**Mood:** A focused engineering workbench — quiet, deliberate, and deeply respectful of the user's library. The interface retreats so the work can take center stage.

---

## Brand Voice

**Tone:** Direct, technical, and reassuring. Speaks like a competent operator's tool — short labels, clear verbs, no marketing fluff.

**Key Characteristics:**
- Uses precise nouns from the domain (track, ISRC, bucket, checkpoint, build)
- Surfaces consequences before destructive actions and never sugarcoats them
- Prefers status verbs over adjectives ("matched", "stale", "queued")

**Writing Style:** Sentence case, minimal punctuation, no exclamations. Numbers and identifiers are first-class — show counts, durations, and IDs in monospace.

---

## UI Style Preferences

| Property      | Value         | Notes                                                                     |
| ------------- | ------------- | ------------------------------------------------------------------------- |
| Border Radius | `rounded-md`  | Standard for buttons, cards, inputs. Use `rounded-full` for status pills. |
| Shadows       | subtle        | Soft single shadow on elevated cards; flat surfaces elsewhere.            |
| Density       | compact       | Dense tables and step rails — this is a workbench, not a marketing page.  |

This is a deliberate departure from a strictly Apple-faithful treatment: the app is data-heavy (jobs, audit log, track lists) and benefits from visible borders on tables and tighter row heights.

---

## Logo Guidelines

No logo provided in v1.

---

_This design system informs all screen designs and the application shell. The `@04-design-shell` and `@07-design-screen` agents will reference these tokens and preferences._

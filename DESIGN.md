---
version: alpha
name: fde-portfolio-design
description: "Night-city engineering console. Near-black canvas, silver and steel text, one cyan signal accent with electric blue as its only partner. Cinematic full-bleed hero, then quiet technical cards. Everything reads like a live system, not a brochure."
colors:
  canvas: "#05070B"
  page: "#0B0C0E"
  surface-1: "#131417"
  panel: "rgba(8,12,20,0.55)"
  hairline: "rgba(255,255,255,0.08)"
  edge: "#26282E"
  text: "#E8EEF6"
  cream: "#ECE7DF"
  silver: "#C9D1DC"
  steel: "#8A94A6"
  muted: "#B5B1A9"
  primary: "#22D3EE"
  primary-soft: "#67E8F9"
  primary-dim: "#0E7490"
  electric: "#2F6BFF"
  on-primary: "#0B0C0E"
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: clamp(2.6rem, 7.5vw, 7.5rem)
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: -0.05em
  display-md:
    fontFamily: Space Grotesk
    fontSize: clamp(1.6rem, 2.6vw, 2.25rem)
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.03em
  heading:
    fontFamily: Space Grotesk
    fontSize: clamp(1.8rem, 3.5vw, 2.75rem)
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.02em
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.08em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  pill: 9999px
spacing:
  base: 8px
  scale: [8, 16, 24, 32, 48, 64, 96, 128]
  section-desktop: clamp(5rem, 10vw, 8.5rem)
  section-mobile: clamp(3.5rem, 8vw, 5rem)
  gutter-mobile: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 0 16px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: 0 16px
  hud-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: 24px
  nav:
    backgroundColor: "rgba(0,0,0,0.9)"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: 10px 36px
---

## Overview

A personal engineering portfolio for Thomas Gates III, Forward Deployed Engineer. The audience
is hiring managers and founders who want proof that AI ships to production. The brand idea is a
night-city engineering console: a cinematic city at the top, then working tools below. Density
is low in the hero and medium in the project grid.

The hero is the City Scroll: a pinned, full-bleed film that scrubs with scroll as Thomas's cyan
data signal leaves his rooftop, drops through the city in five stops, then flies through the orb and
the tower entrance into the lobby where the Projects section lives. It is the one signature
interaction on the site.

## Colors

- `primary` cyan `#22D3EE` is the signal: active rail dot, "See it live" links, primary buttons, hover
  states. Use it sparingly so it keeps meaning "live".
- `electric` `#2F6BFF` is the only partner color, for rare secondary emphasis. Never gradient it
  into anything outside the blue family.
- Text on dark: `text`/`cream` for primary copy, `silver` for HUD body copy, `steel` for meta.
- `panel` + `hairline` make the glass HUD cards over the film.
- Not allowed anywhere: purple, magenta, pink, purple-to-blue gradients, warm accent colors.

## Typography

| Role | Face | Size | Tracking |
|---|---|---|---|
| Name (h1) | Space Grotesk 500 | display-xl | -0.05em |
| Stage line (h2) | Space Grotesk 500 | display-md | -0.03em |
| Section heading | Space Grotesk 500 | heading | -0.02em |
| Body | Inter 400 | 1rem / 1.6, max 62ch | 0 |
| Nav (min 14px, 44px tap), buttons, links | JetBrains Mono 500, uppercase | 0.875rem | +0.08em (tighter on phones) |

One `<h1>` per page: the name. Stage lines are `<h2>`.

## Layout

8px scale. Sections use `container-x` (max-w-6xl, 24px gutter; 16px at phone width). The hero is
full-bleed edge to edge at every width, no side gaps. HUD cards sit bottom-left on desktop
(48px inset) and bottom-center on mobile (16px gutter).

## Elevation & Depth

Film (canvas/video) < bottom vignette < HUD cards < nav and progress rail. Depth comes from glass
(`backdrop-filter: blur(12px)`) and hairlines, not drop shadows. The only glow is `shadow-glow` on
the primary button and the active rail dot.

## Shapes

One radius system: 16px cards and HUD panels, 8px buttons and inner media, pill for the
LiquidButton and rail dots.

## Components

- **HUD card:** panel background, hairline border, 16px radius, 24px padding. An h2 and a silver
  body line, no stage number or label above it. Fades and lifts in (opacity 0 to 1, translateY
  12px to 0) over 6% of scroll.
- **Progress rail:** 1px vertical line on the right with six dots as buttons (the sixth jumps to
  `#gallery`). Active dot is cyan
  with a soft glow. Hidden under 768px.
- **Buttons:** solid cyan with dark text, or outline with hairline/edge border; 44px min height.
- **Lobby (Projects):** full-bleed lobby still (`/public/lobby`, AVIF/WebP/JPG), sticky behind the
  section. The hero holds its last frame for 0.6 of a screen (`HOLD`) while it cross-fades into the
  identical lobby image and a scrim comes in, so there is no seam. Then a slow push-in (scale 1 to
  1.04, -2% Y) that is off under reduced motion.
- **Project cards (glass):** `--cs-panel`, `blur(24px) saturate(1.5)`, hairline border, inset top
  highlight, cyan to electric-blue top hairline. Row 1 model badge (accent = Claude Haiku, edge =
  Gemini) plus "Live" / "External app". Title, silver value copy at 15px / 1.55, then a real
  "Try it" link in its own row (full width under 640px); the link's `::after` makes the whole card
  clickable. Hover/focus: cyan/40 border, cyan + electric glow, 2px lift, cyan focus ring. `id` equals
  the demo id so film links (`#doc-qa`, `#ops-copilot`, `#evals`) land on the card.

## Voice

Plain, specific, first person. Describe only what is live on the page. No invented metrics,
clients, testimonials, logos or prices. Banned: em dashes in visible copy, "elevate",
"seamless", "unleash", "dive into".

## Do's and Don'ts

- Do keep exactly one `<h1>` on the page.
- Do animate only `transform` and `opacity`, inside `@media (prefers-reduced-motion: no-preference)`.
- Do use `--ease-out: cubic-bezier(0.25,1,0.32,1)`; 140-180ms for hover, 200-260ms for panels.
- Do degrade to a static poster plus a stacked list under reduced motion and without JS.
- Don't add a second signature interaction: no custom cursors, particles or extra parallax.
- Don't use purple, magenta, or purple-to-blue gradients.
- Don't build fake product UI out of divs; use the real film frames and stills.
- Don't use three equal icon-in-circle feature columns or stock headshots.
- Don't put em dashes in visible copy.
- Don't label the film stops with numbers or names (`[02 SIGNAL]` style). The headline carries the stop.

## Responsive Behavior

- ≥768px: canvas scrub of 606 1920x1080 frames (adjacent frames cross-faded), 710vh section (650vh of film + 60vh hold), HUD bottom-left, rail visible.
- <768px: video scrub of the 1080x1920 crop, 585vh section (525vh + hold), HUD bottom-center, no rail.
- Save-Data or 2g/3g: video scrub at any width. Reduced motion: no pinning, poster + list.
- Touch targets 44px minimum.

## Iteration Guide

New sections reuse `container-x`, `SectionHeading`, `Card`, and the colors above. A new stage in
the film means a new entry in `content/city-scroll.ts` with its scroll range; the engine reads
ranges from `data-range` attributes, so no engine change is needed.

## Known Gaps

- Rest of the site still uses `cream` and `ink` (`#0B0C0E`). The hero uses `canvas`/`text`.
  Unifying them is a separate pass.
- `BOOK_INTRO_HREF` in `components/sections/Contact.tsx` is empty until Thomas adds a booking link.

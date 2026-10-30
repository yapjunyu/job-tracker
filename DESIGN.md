---
name: job-tracker
description: A dense operations console for one person's job search, where the Status vocabulary is the colour system and the table is the product.
colors:
  # Light theme — :root in packages/web/src/index.css is the normative source.
  background: "#f6f8fa"
  foreground: "#1a1f36"
  card: "#ffffff"
  card-foreground: "#1a1f36"
  popover: "#ffffff"
  popover-foreground: "#1a1f36"
  primary: "#635bff"
  primary-foreground: "#ffffff"
  secondary: "#eef1f6"
  secondary-foreground: "#3c4257"
  muted: "#f1f4f8"
  muted-foreground: "#5f6b7c"
  accent: "#e9edf3"
  accent-foreground: "#1a1f36"
  destructive: "#c0123c"
  destructive-foreground: "#ffffff"
  border: "#e3e8ee"
  border-strong: "#d2dae4"
  input: "#d8dee6"
  ring: "#635bff"
  sidebar: "#ffffff"
  sidebar-foreground: "#3c4257"
  sidebar-primary: "#635bff"
  sidebar-primary-foreground: "#ffffff"
  sidebar-accent: "#f0effe"
  sidebar-accent-foreground: "#4b44d6"
  sidebar-border: "#e3e8ee"
  sidebar-ring: "#635bff"
  badge-neutral: "#e3e8ee"
  badge-neutral-fg: "#4f566b"
  badge-blue: "#d6ecff"
  badge-blue-fg: "#0055bc"
  badge-teal: "#c4f2f0"
  badge-teal-fg: "#0b6e68"
  badge-purple: "#e6e6fc"
  badge-purple-fg: "#4b35b8"
  badge-green: "#cbf4c9"
  badge-green-fg: "#0e6245"
  badge-green-solid: "#0e6245"
  badge-green-solid-fg: "#ffffff"
  badge-red: "#fde2dd"
  badge-red-fg: "#a41c4e"
  badge-slate: "#ebeef1"
  badge-slate-fg: "#5f6b7c"
  selection: "#dedcff"
  backdrop: "rgb(16 20 30 / 0.38)"
  scrollbar-thumb: "#c7d0da"
  scrollbar-thumb-hover: "#aab6c4"
  chart-1: "#635bff"
  chart-2: "#8b85ff"
  chart-3: "#0b6e68"
  chart-4: "#0055bc"
  chart-5: "#a3acbc"
  # Dark theme — .dark in the same file. Neither theme is the "real" one.
  background-dark: "#11141c"
  foreground-dark: "#edeff3"
  card-dark: "#191d27"
  card-foreground-dark: "#edeff3"
  popover-dark: "#1c212c"
  popover-foreground-dark: "#edeff3"
  primary-dark: "#635bff"
  primary-foreground-dark: "#ffffff"
  secondary-dark: "#242a37"
  secondary-foreground-dark: "#d6dbe4"
  muted-dark: "#1e232e"
  muted-foreground-dark: "#9ba3b4"
  accent-dark: "#252b38"
  accent-foreground-dark: "#edeff3"
  destructive-dark: "#ff6692"
  destructive-foreground-dark: "#1a0410"
  border-dark: "#272d3a"
  border-strong-dark: "#38404f"
  input-dark: "#333b4d"
  ring-dark: "#8b85ff"
  sidebar-dark: "#141821"
  sidebar-foreground-dark: "#b2baca"
  sidebar-primary-dark: "#8b85ff"
  sidebar-primary-foreground-dark: "#11141c"
  sidebar-accent-dark: "#231f4d"
  sidebar-accent-foreground-dark: "#b5aaff"
  sidebar-border-dark: "#242a37"
  sidebar-ring-dark: "#8b85ff"
  badge-neutral-dark: "#272d3a"
  badge-neutral-fg-dark: "#b2baca"
  badge-blue-dark: "#16294c"
  badge-blue-fg-dark: "#8cbcff"
  badge-teal-dark: "#0d3330"
  badge-teal-fg-dark: "#4fc5bd"
  badge-purple-dark: "#241e52"
  badge-purple-fg-dark: "#b5aaff"
  badge-green-dark: "#0e3324"
  badge-green-fg-dark: "#4ecb8d"
  badge-green-solid-dark: "#22a06c"
  badge-green-solid-fg-dark: "#04150d"
  badge-red-dark: "#3d1420"
  badge-red-fg-dark: "#ff95a8"
  badge-slate-dark: "#232833"
  badge-slate-fg-dark: "#a3acbc"
  selection-dark: "#342f6b"
  backdrop-dark: "rgb(0 0 0 / 0.62)"
  scrollbar-thumb-dark: "#39414f"
  scrollbar-thumb-hover-dark: "#4b5565"
  chart-1-dark: "#8b85ff"
  chart-2-dark: "#635bff"
  chart-3-dark: "#6fdad3"
  chart-4-dark: "#8cbcff"
  chart-5-dark: "#5f6b7c"
typography:
  page-title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  dialog-title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  interface:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "normal"
  label-micro:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
  numeric:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "tabular-nums"
rounded:
  sm: "0.225rem"
  md: "0.3rem"
  lg: "0.375rem"
  xl: "0.525rem"
  2xl: "0.675rem"
  3xl: "0.825rem"
  4xl: "0.975rem"
  chip: "4px"
  pill: "999px"
spacing:
  "0.5": "0.125rem"
  "1": "0.25rem"
  "1.5": "0.375rem"
  "2": "0.5rem"
  "2.5": "0.625rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "14": "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, #635bff 90%, black)"
    textColor: "{colors.primary-foreground}"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-outline-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  button-ghost-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.foreground}"
  button-destructive:
    backgroundColor: "color-mix(in oklab, #c0123c 10%, transparent)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
  button-sm:
    rounded: "{rounded.md}"
    height: "1.75rem"
    padding: "0 0.625rem"
    typography: "{typography.interface}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
  select-trigger:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.5rem 0.5rem 0.625rem"
    height: "2rem"
  select-trigger-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
  page-header-band:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    padding: "1rem 1rem 1rem"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.sidebar-foreground}"
    typography: "{typography.interface}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.625rem"
  nav-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
  nav-item-soon-chip:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.chip}"
    padding: "1px 0.25rem"
    size: "0.625rem"
  counts-cut:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.interface}"
    padding: "0 0 0.625rem"
  counts-cut-current:
    textColor: "{colors.foreground}"
  status-badge-neutral:
    backgroundColor: "{colors.badge-neutral}"
    textColor: "{colors.badge-neutral-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-blue:
    backgroundColor: "{colors.badge-blue}"
    textColor: "{colors.badge-blue-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-teal:
    backgroundColor: "{colors.badge-teal}"
    textColor: "{colors.badge-teal-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-purple:
    backgroundColor: "{colors.badge-purple}"
    textColor: "{colors.badge-purple-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-green:
    backgroundColor: "{colors.badge-green}"
    textColor: "{colors.badge-green-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-green-solid:
    backgroundColor: "{colors.badge-green-solid}"
    textColor: "{colors.badge-green-solid-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-red:
    backgroundColor: "{colors.badge-red}"
    textColor: "{colors.badge-red-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  status-badge-slate:
    backgroundColor: "{colors.badge-slate}"
    textColor: "{colors.badge-slate-fg}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
  table-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    padding: "0.5rem 0.375rem"
  table-row-hover:
    backgroundColor: "color-mix(in oklab, #f1f4f8 70%, transparent)"
  table-row-keyboard:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.foreground}"
  table-head:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label-micro}"
    height: "2.25rem"
    padding: "0 0.375rem"
  dialog:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
    width: "24rem"
  dialog-footer:
    backgroundColor: "color-mix(in oklab, #f1f4f8 60%, transparent)"
    padding: "1.25rem"
  sheet-drawer:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-foreground}"
    width: "17rem"
  kbd-key:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-micro}"
    rounded: "{rounded.chip}"
    padding: "0 0.375rem"
    height: "1.25rem"
---

# Design System: job-tracker

## Overview

**Creative North Star: "The Operations Console"**

This is the category standard played straight at the craft level of the Stripe dashboard — the single reference product the owner named, chosen deliberately over every more expressive alternative. There is no irony here and no smuggled quirk. A 240px panel of navigation stands against a cool grey canvas; white panels sit on that canvas, divided by hairlines; ink is a navy (`#1A1F36`), never pure black; one violet accent (`#635BFF`) carries every primary action, every active nav state, the focus ring and the text caret. Everything else that carries meaning is a Status.

The identity has to come from type, colour, layout and motion that ship in code, because there is no logo asset, no licensed typeface and no illustration budget. So it does: the mark is a drawn SVG of two list rows with the lower one current, the typeface is one self-hosted variable face used at every size, and the colour system is the nine-value Status vocabulary rather than a decorative palette. The table is the product. Density is high and deliberate — 44px rows, 36px column heads, 11px uppercase column labels, tabular numerals wherever anything is compared down a column — and the hierarchy is bought with weight and colour rather than with size, so the whole working surface stays inside a narrow type ramp.

Both themes are first-class. The app follows the device by default, remembers an override, and applies the resolved theme before first paint so it never flashes the wrong one. Neither theme is a filter over the other: each has its own hand-picked hex for every token, including nine Status pairs tuned separately for a light canvas and a dark one. Depth is rationed: shadows mean "this floats above the page", and nothing on the canvas floats.

**Key Characteristics:**

- One accent, one typeface, nine semantic Status pairs — and nothing else carrying colour meaning.
- Hairlines, not shadows, divide the working surface.
- Small radii (6px base), 4px on chips and badges.
- Dense tables with tabular numerals and an 11px uppercase column label.
- Light and dark both authored by hand, system-followed, override persisted, no flash.
- Exactly one authored motion moment in the whole app.

## Colors

A cool, low-chroma grey-navy workspace holding one violet accent and a nine-pair semantic Status palette; every foreground/background pair in both themes measures at least 4.5:1.

### Primary

- **Accent Violet** (`{colors.primary}`): The app's single accent. It fills the `Add Application` button and every other default button, marks the current nav item (as a pale violet wash with a deepened violet text, `{colors.sidebar-accent}` / `{colors.sidebar-accent-foreground}`), underlines the current cut in the counts row, colours the text caret in every input, draws the focus ring, fills the brand mark, and is the first step of the chart ramp. In dark it lightens to `{colors.ring-dark}` for rings and nav text while the button fill stays the same violet.

### Secondary

- **Status Badge Palette** (eight pairs, `{colors.badge-neutral}` through `{colors.badge-slate}`): Not decoration — this _is_ the semantic colour system. Nine Statuses map onto eight pairs, grouped by what the Status means rather than how far along it is: nothing sent yet (neutral grey), waiting on the Company (blue), a live process in two shades (teal for Assessment, purple for Interviewing), a win pending (soft green), the win itself (the one solid-fill badge in the app), an ending you chose (slate, shared by Declined and Withdrawn), an ending they chose (red). Each pair is tuned independently per theme.

### Tertiary

- **Chart Ramp** (`{colors.chart-1}`–`{colors.chart-5}`): Defined and reserved. It walks the accent out towards the canvas, picking up the teal and blue already in the Status palette, so the first chart the app ever draws inherits the app's one colour instead of introducing a second. Nothing renders it yet.

### Neutral

- **Canvas Grey** (`{colors.background}` / `{colors.background-dark}`): The page beneath everything. Panels and bands sit on it; it is never the surface content sits directly on.
- **Panel White** (`{colors.card}` / `{colors.card-dark}`): Tables, detail blocks, the page header band, inputs and select triggers. In dark it is a lifted slate, one step above the canvas.
- **Overlay Surface** (`{colors.popover}` / `{colors.popover-dark}`): Dialogs and select popovers. In dark it is a further step lighter than the panel, because an overlay has to read as above the thing it covers.
- **Ink Navy** (`{colors.foreground}`): All primary text. Never pure black.
- **Quiet Ink** (`{colors.muted-foreground}`): Secondary columns (Company, Source, Last change), column labels, meta lines, the account email.
- **Hairline** (`{colors.border}`): The 1px rule that does all the dividing — panel edges, row rules, header-band bottom, sidebar edge.
- **Strong Hairline** (`{colors.border-strong}`): A deliberate step up, for keycap outlines in the shortcuts dialog and the inactive dots on the Status Change timeline.
- **Field Stroke** (`{colors.input}`): Input and select-trigger borders, a shade darker than the hairline so a field reads as interactive before it is touched.
- **Browser Surfaces** (`{colors.selection}`, `{colors.backdrop}`, `{colors.scrollbar-thumb}`): Themed rather than left at defaults — the selection, the caret, the scrollbar thumb and the modal backdrop are part of the design, and they are what look unfinished when skipped.

### Named Rules

**The One Accent Rule.** `#635BFF` is the only accent the app has. Primary action, current nav, current cut, focus ring, caret, brand mark, first chart step — all of it is this one violet. A new surface that needs to mean something uses a Status pair or a neutral step; it does not introduce a second accent hue.

**The Status Vocabulary Is The Palette Rule.** Semantic colour comes from the eight Status pairs and nowhere else. A new state that is not a Status does not get a new colour; it gets type weight, a neutral step, or a border.

**The 4.5 Floor Rule.** Every foreground/background pair in the system clears 4.5:1 in both themes, verified by computation over all 32 pairs. A visual effect that would push a pair under the floor loses to the floor — see the keyboard cursor row in Components.

## Typography

**Display Font:** none. The app has no display face.
**Body Font:** Geist Variable (falling back to `ui-sans-serif`, `system-ui`, `sans-serif`), self-hosted via `@fontsource-variable/geist`.
**Label/Mono Font:** none. There is no mono face; tabular numerals do that job instead.

**Character:** One self-hosted variable grotesque, used everywhere, antialiased, with a tight negative tracking on page titles and a wide positive tracking on micro labels. The voice comes from the ramp being narrow and the weights being used precisely, not from a second face. `--font-heading` exists but resolves to the same family — there is no costume change for headings.

### Hierarchy

- **Page Title** (`{typography.page-title}`): The one `h1` per page, in the white header band, and the empty state's heading. Set with `text-balance` so a long Company name breaks evenly.
- **Dialog Title** (`{typography.dialog-title}`): Overlay headings only. Medium weight, not semibold — a dialog announces itself by floating, not by shouting.
- **Body** (`{typography.body}`): Table cells, form fields, dialog copy, descriptions. The working size of the app.
- **Interface** (`{typography.interface}`): Nav items, counts-row cuts, back links. Slightly tighter than body and always medium weight, so navigation reads as chrome and content reads as content.
- **Meta** (`{typography.meta}`): The second line of a stacked mobile table row, the account email, count pills, the Status badge's own word.
- **Label Micro** (`{typography.label-micro}`, uppercase, `{colors.muted-foreground}`): Defined once as `.label-micro` and used for every small uppercase label in the app — table column heads, field labels, section labels — so tracking and weight can never drift between them.
- **Numeric** (`{typography.numeric}`): Not a separate size; a treatment. Tabular figures are forced on every `table` and anything marked `[data-numeric]`.

### Named Rules

**The One Face Rule.** Geist Variable is the only typeface. No second face, no mono costume, no system display font, and no webfont loaded from a third party.

**The Narrow Ramp Rule.** The whole app lives between 11px and 20px. Hierarchy is bought with weight (400 / 500 / 600) and colour (ink versus quiet ink), not with size. A new surface that wants emphasis reaches for 600 weight before it reaches for a bigger size.

**The Tabular Column Rule.** Anything compared down a column — counts, days-since, dates — is tabular. Use the `table` element or mark the element `[data-numeric]`; do not re-declare the font feature locally.

**The Glossary Word Rule.** Every Status, Source and filter is written with its GLOSSARY.md word, capitalised as a domain noun. Colour, position and iconography are all additions to the word, never replacements for it.

## Layout

The signed-in app is a two-column grid at `lg` and above: a 240px (`15rem`) sidebar column that is `sticky` at full viewport height, and a `minmax(0, 1fr)` content column. Below `lg` the sidebar column disappears and its contents move, unchanged, into a left-entering drawer behind a hamburger in a 56px (`h-14`) sticky header — the same `AppSidebar` component serves both, so navigation cannot drift between the two layouts. The sidebar's own top row is also 56px, so the wordmark sits at the same height on both layouts.

Each page is a white header band (`{components.page-header-band}`) bottom-edged with a hairline, sitting directly on the canvas; beneath it the working area pads `1rem` and widens to `1.5rem` from `sm` up. Inside the working area, a single `.panel` holds the table. Page gutters, header band and counts row all share the same `px-4 sm:px-6` so their left edges line up down the page.

Spacing rhythm is the 0.25rem scale, worked almost entirely in the first six steps: `0.125rem` between toggle segments, `0.25rem`–`0.375rem` inside chips and nav icon gaps, `0.5rem`–`0.75rem` between controls, `1rem`–`1.5rem` for gutters and panel padding, `3.5rem` for the two chrome bars. Vertical density: 36px column heads, 44px table rows (`py-2` on a 14px line), 32px default controls, 20px badges.

Responsive behaviour of the table is subtractive, not reflowing: the Company column hides below `sm`, Source and Last change below `md`, and everything they would have said moves into a 12px second line under the role title, so no Application loses information at any width. Role and Company share the table's slack (`30%` / `22%`) and both truncate, so neither column hoards it. The counts row and the filter bar each become one horizontally scrolling rail below `sm`, each masked with `.fade-end` — a right-edge fade that appears only below `40rem` and only when content actually overflows, so a thumb is told there is more.

### Named Rules

**The Shared Gutter Rule.** `px-4 sm:px-6`, everywhere on a page. Header band, counts row, working area and empty state all use it, so every left edge on the page is the same left edge.

**The No Information Loss Rule.** A narrow viewport may remove a _column_, never a _fact_. Whatever a hidden column would have said moves into the row's second line.

## Elevation & Depth

Hybrid, heavily rationed. The working surface is flat: panels are separated from the canvas and from each other by a single `{colors.border}` hairline and by the step from canvas grey to panel white (in dark, by a genuine lightness step: canvas `#11141C` → panel `#191D27` → overlay `#1C212C`). Shadows mean exactly one thing — _this element floats above the page_ — so they appear only on the select popover, the dialog, and the mobile drawer, plus a 1px-scale `shadow-xs` that reads as a field bevel on buttons, inputs and keycaps rather than as elevation. Every shadow is two stacked soft layers built from two theme-aware alpha tokens (`--shadow-near`, `--shadow-far`), which deepen substantially in dark where a shadow has less contrast to work with.

### Shadow Vocabulary

- **Bevel** (`box-shadow: 0 1px 1px var(--shadow-near), 0 1px 2px var(--shadow-far)`): Buttons, inputs, select triggers, keycaps. Not elevation — the faint edge that makes a control read as pressable.
- **Popover** (`box-shadow: 0 1px 2px var(--shadow-near), 0 2px 5px var(--shadow-far)`): The smallest true lift. Defined; used on the account panel only.
- **Menu** (`box-shadow: 0 4px 8px var(--shadow-near), 0 16px 32px var(--shadow-far)`): The select popover and the Company suggestion list.
- **Overlay** (`box-shadow: 0 6px 12px var(--shadow-near), 0 28px 56px var(--shadow-far)`): The dialog and the mobile drawer — the two things that cover the app.

Overlays also carry a `ring-1` hairline in `{colors.border}` and sit over a themed backdrop (`{colors.backdrop}`) with a 2px backdrop blur applied only where `backdrop-filter` is supported.

### Named Rules

**The Hairline Rule.** Panels on the canvas separate by a 1px hairline, never by a shadow. If a surface is not floating over the app, it has no shadow.

**The Float Earns The Shadow Rule.** A shadow is a claim that the element is above the page and the page is beneath it. Dialog, select popover, mobile drawer. Nothing else.

**The Two Soft Layers Rule.** Shadows are always two stacked soft layers off the `--shadow-near` / `--shadow-far` alpha tokens, so they re-tune per theme. No single-layer shadow, no hard offset shadow, no coloured shadow.

## Shapes

Everything derives from one base radius, `--radius: 0.375rem` (6px), scaled by fixed multipliers: `sm` 0.6×, `md` 0.8×, `lg` 1×, `xl` 1.4×, and larger steps that exist but are unused. The practical language is narrow and small: 6px (`lg`) on buttons, inputs, select triggers and panels; ~4.8px (`md`) on the compact `sm`/`xs` control sizes, clamped so they never out-round their full-size siblings; ~3.6px (`sm`) on inline link and header hit areas; and ~8.4px (`xl`) on the dialog, the only element rounded more than the things inside it.

A literal `4px` sits beside the scale for the smallest objects that must still read as objects: Status badges, keycaps, the `Soon` chip, count pills. Fully round shapes are rare and functional: the account avatar, the Status badge's leading dot, the scrollbar thumb, and skeleton bars.

Borders are 1px and almost always the hairline. Three exceptions are meaningful: the field stroke on inputs, the strong hairline on keycaps and inactive timeline dots, and the accent border a filter trigger takes when it is actually filtering. Focus is drawn as a 3px `ring/50` halo plus a border shift on form controls, and as a 2px inset ring on chrome where there is no room outside the element. The brand mark is the only drawn geometry in the app: a 22px rounded square (6.5px radius) holding two list rows, the upper pair at 50% opacity and the lower pair solid — the current row.

### Named Rules

**The Small Radius Rule.** 6px is the house radius and nothing on the working surface exceeds it except the dialog. Pills are for dots, avatars and scrollbars only; a pill-shaped button or badge is out of world.

## Components

### Buttons

- **Shape:** 6px corners (`{rounded.lg}`); the compact `sm`/`xs` sizes drop to ~4.8px (`{rounded.md}`), clamped at 12px/10px.
- **Primary (default):** Solid accent on white text (`{components.button-primary}`), 32px tall, with the bevel shadow. Hover darkens the accent by mixing 10% black in OKLab. Used for `Add Application` and nothing competes with it in the band.
- **Hover / Focus:** All transitions are on `transition-all`; focus-visible shifts the border to the ring colour and adds a 3px `ring/50` halo. Every button that is not a popup trigger translates down 1px on `:active` — the one tactile cue in the system.
- **Outline:** Panel-white fill, hairline border, bevel shadow, hover to `{colors.muted}`; also takes the muted fill when it owns an open popup. The workhorse secondary.
- **Secondary / Ghost:** Fill-only and fill-on-hover respectively, both landing on `{colors.accent}`. Ghost at `icon-sm` is the sidebar's control language (theme, shortcuts, sign out).
- **Destructive:** Tinted, never solid — 10% destructive over the surface with destructive text, deepening to 18% on hover. Destruction is marked, not celebrated.
- **Icon buttons:** Square at the row height (`size-6` / `size-7` / `size-8` / `size-9`), icons at 16px (14px at `sm`, 12px at `xs`), and always with an `aria-label`.

### Chips

- **Status badge** (the signature; see below) and three smaller chips: the `Soon` chip in the nav (10px uppercase, hairline border, no fill, `title` carrying what the view will hold), the count pill in the counts row (12px, muted fill from `sm` up, switching to the sidebar-accent fill when its cut is current), and the keycap in the shortcuts dialog (11px, strong hairline, panel fill, bevel).
- **Filter trigger as chip:** A select trigger that holds values takes an accent border, the pale violet fill and the deepened violet text, and its label becomes the value it is filtering for — so the bar reads as a sentence about what the table is showing.

### Cards / Containers

- **Corner Style:** 6px (`{rounded.lg}`).
- **Background:** Panel white / lifted slate (`{colors.card}`).
- **Shadow Strategy:** None. See The Hairline Rule.
- **Border:** 1px `{colors.border}`, all sides. This is the whole of `.panel`.
- **Internal Padding:** The panel itself has none — the table is flush to its edges and clipped by `overflow-hidden`. Content panels pad `1.25rem`, widening to `1.5rem` from `sm`.

### Inputs / Fields

- **Style:** 32px tall, panel-white fill, 1px field stroke, 6px corners, bevel shadow, `0.625rem` horizontal padding. In dark the fill is a 30% wash of the field stroke rather than the panel colour.
- **Font size:** 16px on small screens, 14px from `md` up — the larger mobile size is deliberate, to stop iOS zooming the viewport on focus.
- **Focus:** Border shifts to the ring colour, plus a 3px `ring/50` halo. The caret is always the accent.
- **Error / Disabled:** `aria-invalid` shifts the border to destructive with a 3px destructive halo; disabled drops to 50% opacity over a washed field fill with pointer events off.
- **Search field:** A 16px search icon absolutely positioned at `0.625rem` from the left with the text inset to `2rem`, reachable from anywhere on the page with `/`, and `Escape` blurs it while keeping what was typed.

### Navigation

- Four items — Applications, Board, Upcoming, Settings — at 13px medium with 16px lucide icons, `0.375rem`/`0.625rem` padding, 4.8px corners, 2px gap between them. Default is quiet ink on the sidebar fill; hover takes the accent-grey fill and full ink; the current item takes the pale violet wash with deepened violet text plus `aria-current="page"`.
- The three unbuilt views keep their place in the order rather than being hidden, are `aria-disabled`, and carry the `Soon` chip with a `title` naming what the view will hold. The navigation does not rearrange itself as each one lands.
- Below the nav, a hairline-topped account block: a 24px round initial avatar on the secondary fill, the truncated email at 12px quiet ink, then the theme toggle, the shortcuts button and sign out in a ghost icon row.
- The brand row is the drawn mark at 22px (20px on the mobile header) beside `job-tracker` in semibold with tight tracking, lowercase exactly as the product name ships.
- **Mobile:** The identical component inside a 272px (`17rem`, max `85vw`) left-entering drawer on the sidebar fill, with the overlay shadow, over the themed backdrop, sliding in over 200ms. Navigating closes the drawer behind the user.

### Status Badge (signature)

The app's one piece of real colour language. A 20px-tall inline chip at 4px radius, 12px medium type, `0.375rem` horizontal padding, carrying a 6px dot in `currentColor` _and_ the Status's glossary word. Nine Statuses, eight pairs, grouped by meaning rather than by progress — and Accepted is the only solid-filled badge in the app, because it is the Status the whole search is for. The badge is also the control: in the table it is a select trigger, so a Status changes in one action from the row, or with `s` from the keyboard.

**The Word And The Dot Rule.** A Status is always colour _plus_ its glossary word _plus_ a dot. Colour is never the only carrier of a Status — it is a hard accessibility floor, not a stylistic preference.

### Counts Row (signature)

Six cuts — Active, Assessment, Interviewing, Offer, Rejected, All — riding the bottom edge of the white header band as a `tablist`, each with a tabular count and each also the filter that shows it, so one click answers both "how am I doing" and "show me those". The current cut takes a 2px accent bottom border that meets the band's own hairline, full ink, and the violet-washed count pill. Counts are computed over every Application, not over the rows on screen, so they hold still as the table is narrowed. **The order ships as Active first and All last** — a deliberate, cited deviation from a plain Status-progression order: Active leads because it is the table's default view, and All closes the row as the widening-out, so the row reads in the order the job seeker actually moves through it.

### Applications Table (signature)

Role, Company, Status, Source, Last change. Column heads are `.label-micro` buttons at 36px with `aria-sort` and a 12px arrow on the sorted column, which also takes full ink. Rows are 44px with a hairline bottom rule (the last row has none), the role title at 14px medium and every other column in quiet ink, hovering to a 70% muted wash. The whole role cell is the link target, so a row is easy to hit with a thumb. Dates are rendered as an age in whole days ("Today", "Yesterday", "12 days") with the exact timestamp a hover away, because a search is read as "how long has this one been quiet".

The keyboard cursor row takes the pale violet fill plus a 1px inset accent-at-50% ring. **The rest of the row deliberately does not dim** — a second cited deviation: dimming the quiet-ink Company, Source and Last change columns would have put them under 4.5:1, and the contrast floor outranks the effect. One row at a time is in the tab order, so `Tab` passes the table by and `j`/`k`/arrows move within it.

### Table Skeleton

Seven rows of pulsing muted bars behind a 36px head rule, with the role bar's max-width varying down the column (62%, 45%, 71%, 52%, 67%, 40%, 58%) so it reads as a table loading rather than as a progress bar. A 20px badge-shaped block holds the Status column's space; the third bar appears only from `md`, matching the real table's column rules. The pulse is disabled under `prefers-reduced-motion`.

### Overlays

- **Dialog:** 8.4px corners, overlay surface, 1.25rem padding, max 24rem (`sm:max-w-sm`), overlay shadow plus a hairline ring, fading and zooming from 95% over 100ms. The footer is a full-bleed muted band with a top hairline, buttons right-aligned from `sm` and column-reversed below it. A ghost icon-sm close sits at the top-right corner.
- **Select popover:** Anchored to the trigger width, 6px corners, menu shadow plus a hairline ring, items at 6px corners taking the accent fill on focus with a trailing check indicator, separators as a 1px hairline. When aligned to the trigger item, the entrance animation is suppressed — a menu that opens _onto_ its own value should not appear to arrive from elsewhere.

### Motion

- **`status-set`** (0.45s, `cubic-bezier(0.16, 1, 0.3, 1)`): The one authored moment in the app. A Status badge that has _actually just changed_ arrives at 112% scale with a 2px blur and settles, like ink setting. It fires on change only — never on mount, never on the Statuses in an open list — and is off under `prefers-reduced-motion`.
- **`blur-in`** (0.5s ease-out): The empty state's heading resolves out of an 8px blur. The only decorative animation, on the one screen with nothing to do.
- Everything else is a 100–200ms colour or opacity transition, plus the 1px `:active` press on buttons.

**The One Authored Moment Rule.** The app has exactly one expressive animation, and it is attached to the single event the product is about: a Status changing. Adding a second expressive moment devalues it. Every animation, decorative or not, has a `prefers-reduced-motion` answer.

## Do's and Don'ts

### Do:

- **Do** take every colour from `packages/web/src/index.css`, and add new colours as a token in both `:root` and `.dark` before using them. The stylesheet is the single source of truth for the palette.
- **Do** give any new foreground/background pair a measured contrast ratio of at least 4.5:1 in both themes before it ships.
- **Do** separate panels on the canvas with a 1px `{colors.border}` hairline and the canvas-to-panel colour step.
- **Do** reserve shadows for the three things that float: dialog, select popover, mobile drawer.
- **Do** use `.label-micro` for every small uppercase label rather than re-declaring 11px uppercase tracking locally.
- **Do** write every Status, Source and filter with its GLOSSARY.md word, and pair any colour-coded state with that word and a shape (the dot).
- **Do** mark anything compared down a column `[data-numeric]`, or put it in a `table`, so it is tabular.
- **Do** keep the house radius at 6px and use the literal 4px only for badge-scale objects.
- **Do** give every new control a keyboard path and a visible `:focus-visible` treatment — 3px `ring/50` on form controls, a 2px inset ring where there is no room outside.
- **Do** keep an unbuilt view in the navigation with a `Soon` chip and a `title` naming what it will hold, rather than hiding it and letting the nav rearrange later.
- **Do** keep information when a column is dropped at a narrow width: move it into the row's second line.
- **Do** author light and dark as two first-class themes, and apply the resolved theme before first paint.

### Don't:

- **Don't** introduce a second accent hue. `{colors.primary}` carries every primary action, active state, ring and caret.
- **Don't** invent a colour for a state that is not a Status. Use a Status pair, a neutral step, type weight, or a border.
- **Don't** let colour be the only carrier of a Status, a filter state, or a Ghosted marker.
- **Don't** put a shadow on a panel that sits on the canvas.
- **Don't** use a single-layer, hard-offset, or coloured shadow; shadows are two soft layers off `--shadow-near` / `--shadow-far`.
- **Don't** add a second typeface — no display face, no mono, no system font stack as a deliberate choice, no third-party webfont.
- **Don't** exceed 20px type on a working surface, or reach for a bigger size where 600 weight would do.
- **Don't** use pill radii on buttons or badges. Pills are for dots, avatars, scrollbars and skeleton bars.
- **Don't** add a second expressive animation. `status-set` is the app's one authored moment.
- **Don't** ship an animation without a `prefers-reduced-motion` answer.
- **Don't** use glyph, emoji or icon-font icons; icons are inline lucide SVG at 12–16px with `aria-hidden`, and an icon-only control always carries an `aria-label`.
- **Don't** add an uppercase kicker or eyebrow line above a page title. `.label-micro` is for column heads, field labels and section labels; the page title stands alone above its meta line.
- **Don't** trade a contrast ratio for a visual effect. The 4.5 floor outranks the effect, every time.
- **Don't** leave the browser's own surfaces at their defaults: selection, caret, scrollbar and backdrop are themed here and new surfaces inherit them.

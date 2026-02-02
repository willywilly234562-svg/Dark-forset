# Layout Structure and Scroll Ownership Audit

## Scope

This report covers both the character selection screen and the main game screen rendered by [`App.tsx`](App.tsx:1083).

## Character Selection Screen Layout (player.class === NONE)

### Container structure

- Root screen container: a single full-screen wrapper with minimum viewport height.
  - Element: top-level `<div>` returned in the character selection branch [`App.tsx`](App.tsx:1085).
  - Classes: `min-h-[100dvh] ... flex items-center justify-center p-4 relative overflow-hidden`.
- Background image layer: absolute full-bleed background image.
  - Element: `<div className="absolute inset-0 ...">` [`App.tsx`](App.tsx:1087).
- Foreground content container: centered column with max width.
  - Element: `<div className="relative z-10 max-w-4xl w-full">` [`App.tsx`](App.tsx:1088).
- Cards grid: responsive two-column grid on medium screens.
  - Element: `<div className="grid grid-cols-1 md:grid-cols-2 gap-8">` [`App.tsx`](App.tsx:1090).

### Explicit height definitions

- Root container: `min-h-[100dvh]` explicitly sets the minimum height to the dynamic viewport height [`App.tsx`](App.tsx:1086).
- Several card sub-elements use fixed widths/heights (e.g., `w-24 h-24`) but these are local to the card layout, not the screen layout [`App.tsx`](App.tsx:1096).

### Content-driven height

- Foreground container (`max-w-4xl w-full`) and the grid rely on content height; no explicit height is defined for those containers [`App.tsx`](App.tsx:1088).

### Scroll ownership

- Root container has `overflow-hidden`, preventing document-level scrolling on this screen [`App.tsx`](App.tsx:1086).
- No child container defines `overflow-y-auto`/`scroll` with a constrained height. Therefore, the character selection screen is effectively non-scrollable by design.

## Main Game Screen Layout (player.class !== NONE)

### Top-level layout

- App root container: a min-viewport-height flex container that switches to a row layout at `md`.
  - Element: `<div className="min-h-[100dvh] ... flex flex-col md:flex-row overflow-hidden ...">` [`App.tsx`](App.tsx:1161).
  - This container blocks document-level scrolling with `overflow-hidden`.

### Modal overlays

- API Key modal: fixed, full-viewport overlay.
  - Element: `<div className="fixed inset-0 ...">` in [`ApiKeyModal.tsx`](components/ApiKeyModal.tsx:16).
  - Fixed layout with no scroll container; modal content relies on viewport height.
- Sword animation overlay: fixed, full-viewport overlay.
  - Element: `<div className="fixed inset-0 ...">` in [`SwordAnimation.tsx`](components/SwordAnimation.tsx:20).

### Sidebar (player stats)

- Sidebar container: `<aside>` rendered as the first flex child of the root layout.
  - Element: `<aside className="w-full md:w-72 ... flex flex-col ...">` [`App.tsx`](App.tsx:1178).
  - Width: `w-full` on mobile, `md:w-72` (fixed 18rem) on desktop.
  - Height: not explicitly set; it inherits the height of the root flex container (minimum viewport height). Content determines final height if it exceeds the viewport.

#### Sidebar explicit height elements

- Equipment list: `max-h-[30vh]` with `overflow-y-auto` creates a constrained scrollable region.
  - Element: `<div className="... overflow-y-auto flex-1 max-h-[30vh]">` [`App.tsx`](App.tsx:1225).
- Log list: fixed height `h-48` with `overflow-y-auto` creates another scrollable region.
  - Element: `<div className="... h-48 overflow-y-auto ...">` [`App.tsx`](App.tsx:1233).

#### Sidebar content-driven height

- Most stat blocks and header elements are content-driven; no explicit height on those wrappers [`App.tsx`](App.tsx:1189).

### Main content column

- Main container: `<main className="flex-1 flex flex-col h-full overflow-hidden ...">` [`App.tsx`](App.tsx:1249).
  - Height: `h-full` depends on the parent’s height; combined with the root `min-h-[100dvh]`, this effectively fills at least the viewport height.
  - `overflow-hidden` prevents page-level scrolling inside the main column.

#### Top navigation (header)

- Header element: `<nav>` inside `<main>`.
  - Element: `<nav className="h-16 ... flex-shrink-0 ...">` [`App.tsx`](App.tsx:1253).
  - Height: explicit fixed height `h-16` (64px). This is the main game header.

#### View content wrapper

- Background wrapper: `<div className="flex-1 overflow-hidden relative ...">` [`App.tsx`](App.tsx:1286).
  - Height: `flex-1` shares remaining vertical space in `<main>`.
  - `overflow-hidden` prevents any scrolling in this layer.
- Inner content wrapper: `<div className="relative z-10 flex-1 ... overflow-hidden">` [`App.tsx`](App.tsx:1291).
  - Height: `flex-1` within the view wrapper; no explicit pixel/vh height.
  - `overflow-hidden` again prevents scrolling at this level.

### Tab content areas

#### Adventure tab

- Adventure wrapper: `<div className="flex-1 ... h-full w-full">` [`App.tsx`](App.tsx:1295).
  - Height: `h-full` relies on parent height; no independent scroll.
- Combat card: `<div className="w-full h-full ... overflow-hidden ...">` [`App.tsx`](App.tsx:1332).
  - Height: `h-full` fills parent; `overflow-hidden` disables scrolling within the combat card.
- Combat arena: `<div className="flex-1 ... overflow-hidden ...">` [`App.tsx`](App.tsx:1370).
  - Height: `flex-1` within combat card; no scroll.

#### Inventory tab

- Inventory grid: `<div className="... grid ... overflow-y-auto">` [`App.tsx`](App.tsx:1602).
  - `overflow-y-auto` indicates intended scroll, but there is no explicit height (no `h-*`, `max-h-*`, or `flex-1`).
  - Actual scroll behavior depends on whether the parent constrains the height; the parent layers use `overflow-hidden`, so overflow may be clipped if the grid grows taller than the available space.

#### Shop tab

- Shop wrapper: `<div className="... flex flex-col h-full min-h-0">` [`App.tsx`](App.tsx:1621).
  - Height: `h-full` with `min-h-0`, enabling flex children to size and scroll correctly.
- Shop grid: `<div className="... flex-1 min-h-0 overflow-y-scroll ...">` [`App.tsx`](App.tsx:1623).
  - This is a true scroll container: `flex-1` plus `min-h-0` and `overflow-y-scroll` within a constrained parent.

#### Puzzle tab

- Puzzle container: `<div className="... flex flex-col ... h-full ...">` [`App.tsx`](App.tsx:1641).
  - Height: `h-full` relies on parent; no explicit scrolling.

## Explicit Height vs Content-Driven Height Summary

### Explicit height (fixed, viewport-based, or percentage)

- `min-h-[100dvh]` on the root containers for both screens [`App.tsx`](App.tsx:1086), [`App.tsx`](App.tsx:1161).
- Header height `h-16` on the main navigation bar [`App.tsx`](App.tsx:1253).
- Logs panel height `h-48` [`App.tsx`](App.tsx:1233).
- Equipment list max height `max-h-[30vh]` [`App.tsx`](App.tsx:1225).
- Various fixed-size UI elements (e.g., `w-24 h-24` avatar blocks) are local to component layout and do not define the overall page height [`App.tsx`](App.tsx:1181).

### Content-driven height

- Character selection grid and its cards are content-driven within a `min-h-[100dvh]` container [`App.tsx`](App.tsx:1090).
- Sidebar container height is determined by parent flex height; it does not set an explicit height itself [`App.tsx`](App.tsx:1178).
- Main content wrapper and tab containers mostly rely on `flex-1` or content size, rather than explicit heights [`App.tsx`](App.tsx:1286), [`App.tsx`](App.tsx:1291).

## Scroll Ownership

### Elements that set overflow and own scrolling

- Character selection screen: root container sets `overflow-hidden`, so no scrolling occurs [`App.tsx`](App.tsx:1086).
- Sidebar equipment list: `overflow-y-auto` with `max-h-[30vh]` creates a scrollable sub-region for equipment items [`App.tsx`](App.tsx:1225).
- Sidebar log list: `overflow-y-auto` with `h-48` creates a scrollable log region [`App.tsx`](App.tsx:1233).
- Inventory tab grid: `overflow-y-auto`, but lacks an explicit height; it may not scroll unless constrained by parent dimensions [`App.tsx`](App.tsx:1602).
- Shop tab grid: `overflow-y-scroll` inside a `flex-1 min-h-0` container, making it the intended scroll owner for shop items [`App.tsx`](App.tsx:1623).

### Elements that prevent scrolling

- App root (`overflow-hidden`) for the main game screen blocks document-level scrolling [`App.tsx`](App.tsx:1161).
- Main content wrapper layers use `overflow-hidden` to prevent scrolling within the main content area unless a child container explicitly scrolls [`App.tsx`](App.tsx:1286), [`App.tsx`](App.tsx:1291).
- Combat card and arena use `overflow-hidden`, so combat view never scrolls [`App.tsx`](App.tsx:1332), [`App.tsx`](App.tsx:1370).

### Which element scrolls when the user scrolls

- On the character selection screen, nothing scrolls because the root container is `overflow-hidden` and no scrollable child exists [`App.tsx`](App.tsx:1086).
- On the main game screen:
  - Scrolling occurs inside the equipment list when its content exceeds `max-h-[30vh]` [`App.tsx`](App.tsx:1225).
  - Scrolling occurs inside the logs panel when logs exceed `h-48` [`App.tsx`](App.tsx:1233).
  - Scrolling occurs inside the shop items grid when in the Shop tab [`App.tsx`](App.tsx:1623).
  - The inventory grid is configured for scrolling but may not actually scroll without explicit height constraints; if the browser constrains it via the flex parents, it can become the scroll owner for the Inventory tab; otherwise, content may be clipped by the `overflow-hidden` ancestors [`App.tsx`](App.tsx:1602), [`App.tsx`](App.tsx:1291).


# Performance & Rendering Audit (4K Freeze/Unfreeze)

## Scope & Context
- Observed issue: repeated short hitches (~100–300ms) during big combat waves on 4K displays.
- Goal: identify per-frame/tick work that scales with resolution, entity count, or React re-renders; highlight DOM/layout interactions.

## Key Findings (Likely Culprits)

### 1) Canvas terrain rendering scales with viewport resolution (per frame)
- The main loop draws the **entire terrain grid every frame**, with the number of tiles proportional to canvas pixel size.
- In [`App.tsx`](../App.tsx:489) [`drawTerrain()`](../App.tsx:489) uses canvas width/height to compute tiles:
  - `pxPerUnit = width / (100 / GAME_SCALE)`
  - `tilePixelSize = TILE_UNIT_SIZE * pxPerUnit`
  - `cols = ceil(width / tilePixelSize) + 2`
  - `rows = ceil(height / tilePixelSize) + 2`
  - Nested loops fill rectangles and draw decorations for **every tile**.
- Because `width`/`height` track **canvas pixel size**, 4K (≈3840×2160) multiplies both **cols** and **rows**, drastically increasing draw calls, fillRect/arc operations, and CPU/GPU workload.
- The terrain drawing includes extra decoration passes (trees, flowers) with **multiple draw calls per tile**, which further amplifies cost on high-resolution canvases.

Why this gets worse at 4K:
- Tile counts scale roughly with **pixel area**, so a 4K canvas can be ~4× the pixel area of 1080p. The nested loops and per-tile drawing work scale accordingly.
- Because terrain is redrawn **every frame**, any CPU/GPU stall becomes visible as repeated short hitches.

### 2) Game loop updates React state every frame (forcing re-render)
- The main combat loop ([`updateGame()`](../App.tsx:633)) calls `setCombat()` every frame to update positions, effects, etc.
- This triggers React re-renders at frame rate, causing:
  - re-evaluation of large JSX tree;
  - re-diffing of enemy lists and effects;
  - recalculation of inline styles for each enemy and indicator.
- On heavy waves, rendering hundreds of nodes per frame becomes expensive on top of the canvas work.

Why 4K makes this worse:
- The DOM work itself is not directly resolution-based, but **when the main thread is already taxed** by 4K canvas drawing, the extra React render cost increases the chance of frame hitches.

### 3) Per-enemy DOM nodes scale with entity count
- Every enemy produces multiple DOM nodes and styles:
  - Enemy sprite container with `left/top` percent and `transform` ([`enemy map` rendering](../App.tsx:1476))
  - HP bar
  - Optional off-screen indicators ([`combat.enemies.map` for indicators](../App.tsx:1380))
- With wave sizes up to 20+, each frame has to update many `style` attributes and produce React elements.
- Off-screen indicator logic computes `left/top`, `angle`, and `transform` for each enemy each render.

Why 4K makes this worse:
- Not directly resolution-dependent, but compounding with the heavier canvas draw cost increases total main-thread load, causing the **freeze/unfreeze cadence** described.

### 4) Layout measurements in the render loop
- Each frame checks canvas `offsetWidth/offsetHeight` and assigns `cvs.width/cvs.height` if different ([`updateGame()`](../App.tsx:683)).
- Reading `offsetWidth/offsetHeight` can trigger a **layout measurement**; setting `width/height` forces canvas resize (and implicit reallocation), which is costly.
- In steady state, the equality check prevents resizing, but the read itself is still a layout access on every frame.

Potential symptom:
- At high resolution, any layout read inside the frame loop is more expensive and increases the chance of contention with React rendering and canvas draw.

### 5) Combat state mutations inside enemy loop
- The loop (`state.enemies.map`) performs multiple operations per enemy: distance checks, movement, cooldown logic, and possibly `setPlayer()` when damage occurs.
- In combat-heavy scenes, **multiple `setPlayer()` calls** can occur in a single frame (each enemy attack), contributing to extra render work.

## What Runs Every Frame
- [`updateGame()`](../App.tsx:633) via `requestAnimationFrame`:
  - player movement and facing computation
  - canvas resize check and full terrain redraw
  - enemy logic (movement, attack timers)
  - effect cleanup
  - `setCombat()` dispatch (React state update)
- React render path for combat UI includes:
  - enemy sprites
  - off-screen indicators
  - visual effects
  - UI overlays and HP bars

## What Triggers React Re-renders
- `setCombat()` in the frame loop; nearly guaranteed once per frame while active.
- `setPlayer()` inside enemy attack checks (can occur multiple times per frame).
- `setLogs()` via `addLog()` in events (not every frame but frequent during combat).
- `setSkillCooldowns()` in skill usage (not per frame).

## DOM / Canvas / Layout Interactions
- Canvas drawing dominates frame time at high resolution: [`drawTerrain()`](../App.tsx:489).
- Layout measurement per frame: `cvs.offsetWidth/offsetHeight` read inside game loop.
- Numerous DOM nodes with animated classes and inline style changes (per enemy, per effect).

## Patterns That Could Cause Hitches
1. **Resolution-proportional work**: per-frame canvas terrain loops and decoration drawing scale with width/height.
2. **Excessive React re-renders**: `setCombat()` called every frame while combat active.
3. **Entity-proportional DOM**: enemy sprite + HP bar + off-screen indicator per enemy.
4. **Main-thread synchronous work**: expensive per-frame math + canvas operations + React reconciliation.

## Safe Candidates for Later Optimization / Isolation
These are high-impact areas that can be optimized without changing game behavior:

1. **Terrain rendering in canvas**
   - Cache terrain tiles or render to an offscreen canvas, updating only when player crosses tile boundaries.
   - Reduce decoration passes or cull low-visibility tiles.
   - Scale canvas to lower resolution and upscale (e.g., draw at half resolution).

2. **Decouple game loop from React state**
   - Keep frequently updated positions in refs and render DOM less frequently.
   - Batch updates or throttle `setCombat()` (e.g., 30fps UI updates while 60fps logic runs).

3. **Enemy DOM reduction**
   - Replace enemy DOM nodes with canvas rendering or sprite batching.
   - Skip off-screen indicator updates for enemies beyond a large radius.

4. **Layout read avoidance**
   - Cache canvas dimensions in a resize observer; avoid reading `offsetWidth/offsetHeight` every frame.

## Most Likely Freeze/Unfreeze Path
The hitching is most likely driven by **per-frame canvas terrain rendering at 4K resolution**, combined with **per-frame React re-renders** and **enemy-heavy DOM** updates. The work spikes during large waves because enemy logic and UI updates grow with entity count, while the canvas already consumes a large portion of the frame budget at 4K.

## Why 4K Exacerbates the Issue
- The canvas terrain draw path scales with pixel area, so **4K multiplies draw cost** significantly.
- The CPU must also handle per-enemy logic and React re-renders, which stacks on top of the heavy draw workload.
- Short hitches (100–300ms) are consistent with periodic overload of the main thread when frame budget is exceeded.


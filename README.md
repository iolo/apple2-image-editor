# apple2-image-editor

Simple image editor for Apple II lo-res, double lo-res, hi-res, and double hi-res graphics. No build step, no server—open `index.html` in a modern browser.

## Features
- Draw for lo-res, double lo-res, hi-res, double hi-res, pixmap (8-bit), and bitmap (1-bit) images.
- Open/save by Apple II sizes or file extensions (`.GR`, `.DGR`, `.HGR`, `.DHGR`, `.PIXMAP`, `.BITMAP`); size-based detection prevents mismatched extensions.
- Tools: pencil, line, rectangle outline, flood fill; foreground/background color swapping.
- Keyboard support: arrow keys move caret, `Shift`+arrow draws a pixel then moves, `D`/left click draws FG, `E`/right click draws BG, `S` swaps colors, `Ctrl+Z`/`Ctrl+Y` undo/redo, `+`/`-` zoom.
- Zoomed grid and caret overlay; drawing area scrolls independently when zoomed.

## Files
- `index.html`: UI layout and dialogs.
- `style.css`: layout and visual design.
- `app.js`: UI wiring, state, rendering, and interactions.
- `image-tools.js`: drawing helpers (line, rectangle, flood fill).
- `apple2-modes.js`: barrel that exports Apple II mode helpers and handlers.
- `apple2-common.js`: shared palettes, mode metadata, and file detection utilities.
- `apple2-gr.js`: lo-res mode handler.
- `apple2-dgr.js`: double lo-res mode handler.
- `apple2-hgr.js`: hi-res mode handler.
- `apple2-dhgr.js`: double hi-res mode handler.
- `pixmap.js`: generic pixmap handler.
- `bitmap.js`: generic bitmap handler.

## Testing
- E2E: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/google-chrome node e2e-test.mjs` (or `npm run test:e2e`).

---
May the **SOURCE** be with you...

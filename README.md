# apple2-image-editor

Simple image editor for Apple II GR (Lo-Res), DGR (Double Lo-Res), HGR (Hi-Res), and DHGR (Double Hi-Res) graphics. No build step, no server—open `index.html` in a modern browser.

## Features
- Draw for GR (Lo-Res), DGR (Double Lo-Res), HGR (Hi-Res), DHGR (Double Hi-Res), pixmap (8-bit indexed), and bitmap (1-bit) images.
- Open/save by Apple II sizes or file extensions (`.GR`, `.DGR`, `.HGR`, `.DHGR`, `.PIXMAP`, `.BITMAP`); size-based detection prevents mismatched extensions.
- Tools: pencil, line, rectangle outline, flood fill; foreground/background color swapping.
- Keyboard support: arrow keys move caret, `Shift`+arrow draws a pixel then moves, `D`/left click draws FG, `E`/right click draws BG, `S` swaps colors, `Ctrl+Z`/`Ctrl+Y` undo/redo, `+`/`-` zoom.
- Zoomed grid and caret overlay; drawing area scrolls independently when zoomed.

## Files
- `index.html`: UI layout and dialogs.
- `style.css`: layout and visual design.
- `app.mjs`: UI wiring, state, rendering, and interactions.
- `tools.mjs`: drawing helpers (line, rectangle, flood fill).
- `modes.mjs`: barrel that exports Apple II mode helpers and handlers.
- `common.mjs`: shared palettes, mode metadata, and file detection utilities.
- `gr.mjs`: GR (Lo-Res) mode handler.
- `dgr.mjs`: DGR (Double Lo-Res) mode handler.
- `hgr.mjs`: HGR (Hi-Res) mode handler.
- `dhgr.mjs`: DHGR (Double Hi-Res) mode handler.
- `pixmap.mjs`: generic pixmap handler.
- `bitmap.mjs`: generic bitmap handler.

## Testing
- E2E: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/google-chrome node e2e-test.mjs` (or `npm run test:e2e`).

---
May the **SOURCE** be with you...

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
- `script.js`: rendering, tools, file handling, mode encoders/decoders.

---
May the **SOURCE** be with you...

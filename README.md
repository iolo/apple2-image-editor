# apple2-image-editor

Simple image editor for Apple II.

## Features

- Draw for GR (Lo-Res), DGR (Double Lo-Res), HGR (Hi-Res), DHGR (Double Hi-Res), pixmap (8-bit indexed), and bitmap (1-bit) images.
- Open/save by Apple II sizes or file extensions (`.GR`, `.DGR`, `.HGR`, `.DHGR`, `.PIXMAP`, `.BITMAP`); size-based detection prevents mismatched extensions.
- Tools: pencil, line, rectangle outline, flood fill; foreground/background color swapping.
- Keyboard support: arrow keys move caret, `Shift`+arrow draws a pixel then moves, `D`/left click draws FG, `E`/right click draws BG, `S` swaps colors, `Ctrl+Z`/`Ctrl+Y` undo/redo, `+`/`-` zoom.
- Zoomed grid and caret overlay; drawing area scrolls independently when zoomed.
- TODO: save/load images to/from Apple II disk images (dsk, 2mg).
- TODO: compress and decompress images using lz4, zsa, zx02

---

May the **SOURCE** be with you...

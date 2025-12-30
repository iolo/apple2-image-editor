# apple2-image-editor

Simple image editor for Apple II.

# tech stack

- plain modern javascript
- html5 canvas(no webgl)
- css3
- no transpiler
- no bundler
- no server

# principles

- keep it simple, explicit, straightforward
- avoid additional dependencies if possible
- no polyfill for legacy browser

# terms

- GR: Lo-Res Graphics Mode
- DGR: Double Lo-Res Graphics Mode
- HGR: Hi-Res Graphics Mode
- DHGR: Double Hi-Res Graphics Mode

# implementation notes

## directory structure

- `index.html`: UI layout and dialogs.
- `style.css`: layout and visual design.
- `app.mjs`: UI wiring, state, rendering, and interactions.
- `tools.mjs`: drawing helpers (line, rectangle, flood fill).
- `modes.mjs`: barrel that exports Apple II mode helpers and handlers.
- `gr.mjs`: GR (Lo-Res) mode handler. 40x48 16 colors.
- `dgr.mjs`: DGR (Double Lo-Res) mode handler. 80x48 16 colors.
- `hgr.mjs`: HGR (Hi-Res) color mode handler. 140x192 6 colors.
- `hgr-mono.mjs`: HGR (Hi-Res) monochrome mode handler. 280x192 2 colors.
- `dhgr-color.mjs`: DHGR (Double Hi-Res) color mode handler. 140x192 16 colors.
- `dhgr-mono.mjs`: DHGR (Double Hi-Res) monochrome mode handler. 560x192 2 colors.
- `pixmap.mjs`: generic pixmap handler. 8 bits per pixel.
- `bitmap.mjs`: generic bitmap handler. 1 bits per pixel.

## user interfaces

- layout: holygrail with css grid
  - header
    - h1: `apple2-image-editor`
    - toolbar
      - new: select mode(and optional input width/height for pixmap/bitmap) and create blank image
      - open: load from local file system(respect file extension or length)
      - save: download to local file system(with proper extension)
      - settings: display modal dialog to set preferences
      - about: display modal dialog to show info about this app
  - main
    - toolbox
      - swap: `S` key. swap foreground and background colors.
      - pencil, line, rectangle outline, fill, ...
      - undo/redo: `Ctrl+Z`/`Ctrl+Y`
      - zoom in/out: `+`(or `=`)/`-` keys
      - toggle pixel grid
      - selected foreground and background colors
    - drawing area
      - arrow keys to move caret(keyboard cursor; focus rect around pixel)
      - shift+array keys to draw and move caret
      - display focus rect for keyboard control
      - mouse click(or `D` key) to draw single pixel with foreground color
      - mouse ctrl+click(or `E` key) to draw single pixel with background color
      - display pixel grid when zoom x4 or more
      - scrollable when image larger than drawing area
    - palette
      - display all available colors for current mode
      - click to select foreground color
      - ctrl+click to select background color
  - footer: copyright and links
    - home: https://iolo.kr
    - github: https://github.com/iolo/apple2-image-editor

## layout wireframe

```
+----------------------------------------+
| apple2-image-editor                    |
+----------------------------------------+
| [New] [Open] [Save] [Settings] [About] |
+--------+---------------------+---------+
|Toolbox | Drawing Area        | Palette |
|        |                     |         |
+--------+---------------------+---------+
| (c) 2025               [Home] [GitHub] |
+----------------------------------------+
```

## image handling

- editor manipulates pixels in a `Uint8Array` RGBA buffer
- editor render pixels from RGBA buffer to html5 canvas
- each mode handler provdes:
  - `COLORS`: array of mode specific colors in RGBA format
  - `init(buffer, width, height)`: initialize mode with given buffer and dimensions
  - `setPixel(x, y, color)`: set pixel at (x, y) to mode specific color
  - `getPixel(x, y)`: get mode specific color of pixel at (x, y)
- supported image formats:
  - GR (Lo-Res): 40x48 pixels, 16 colors
    - file length 0x400
    - file extension: `.GR`
  - DGR (Double Lo-Res): 80x48 pixels, 16 colors
    - file length 0x800(0x400 main + 0x400 aux)
    - file extension: `.DGR`
  - HGR (Hi-Res)
    - file extension: `.HGR`
    - file length 0x2000 (Apple II HGR memory layout)
    - editor modes: color 140x192 (6 colors), mono 280x192 (2 colors)
  - DHGR (Double Hi-Res)
    - file extension: `.DHGR`
    - file length 0x4000 (0x2000 main + 0x2000 aux)
    - editor modes: color 140x192 (16 colors), mono 560x192 (2 colors)
  - generic pixmap
    - 1 byte per pixel
    - file extension: `.PIXMAP`
    - width and height selectable
    - no header; length must be `width * height` bytes
  - generic bitmap
    - 1 bit per pixel; 2 colors
    - file extension: `.BITMAP`
    - width and height selectable
    - no header; length must be `(width / 8) * height` bytes
- file open: upload without server
- file save: download without server

# see also

- [Apple II graphics](https://en.wikipedia.org/wiki/Apple_II_graphics)
- [apple2-image-converter](https://github.com/iolo/apple2-image-converter)
- [apple2-disk-manager](https://github.com/iolo/apple2-disk-manager)

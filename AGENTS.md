# apple2-image-editor

simple image editor for Apple II GR (Lo-Res), DGR (Double Lo-Res), HGR (Hi-Res) and DHGR (Double Hi-Res) graphics modes


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


# features

- create and edit images for Apple II GR (Lo-Res), DGR (Double Lo-Res), HGR (Hi-Res), DHGR (Double Hi-Res), pixmap, and bitmap modes
- TODO: compress and decompress images using lz4, lzsa, zx02


# implementation notes

## directory structure

- `index.html`: the sole html file
- `style.css`: the sole css file
- `app.mjs`: main editor logic and UI wiring
- `tools.mjs`: drawing helpers (line, rectangle, flood fill)
- `modes.mjs`: mode registry and shared exports
- `common.mjs`: palettes and utility helpers
- `gr.mjs`, `dgr.mjs`, `hgr.mjs`, `dhgr.mjs`, `pixmap.mjs`, `bitmap.mjs`: mode codecs

## user interfaces

- layout: holygrail with css grid
  - header
    - h1: `apple2-image-editor`
    - toolbar
      - new, open, save, settings, about
  - main
    - drawing toolbox
    - drawing area
    - color palette
  - footer: copyright and links
    - home: https://iolo.kr
    - github: https://github.com/iolo/apple2-image-editor
- toolbar
  - new image: select mode(and input width/height for pixmap/bitmap) and create blank image
  - open image: load from local file system(respect file extension or length)
  - save image: download to local file system(with proper extension)
  - settings: display modal dialog to set preferences
  - about: display modal dialog to show info about this app
- drawing toolbox
  - swap foreground and background colors: 'S' key
  - zoom in/out: `+`(or `=`)/`-` keys
  - undo/redo: `Ctrl+Z`/`Ctrl+Y`
  - toggle pixel grid
  - move keyboard cursor(caret; focus rect around pixel) for keyboard: arrow keys
  - line, rectangle outline, fill
- drawing area: html5 canvas
  - mouse click(or `D` key) to draw single pixel with foreground color
  - mouse right click(or 'E' key) to draw single pixel with background color
  - display pixel grid when zoom x4 or more
  - display focus rect for keyboard control
  - scrollable when image larger than drawing area
- color palette: html elements with css
  - colors for each mode: click to select foreground color, right click to select background color
  - selected foreground/background colors
  - presets for Apple II GR (Lo-Res), DGR (Double Lo-Res), HGR (Hi-Res), DHGR (Double Hi-Res)

## layout example
```
+-----------------------------------------+
| apple2-image-editor                     |
+-----------------------------------------+
| [New] [Open] [Save] [Settings] [About]  |
+--------+----------------------+---------+
|Drawing | Drawing Area         | Color   |
|Toolbox |                      | Palette |
|        |                      |         |
|        |                      |         |
+--------+----------------------+---------+
| © 2025                   [Home] [GitHub] |
+-----------------------------------------+
```

## image handling

- editor stores pixels in a `Uint8ClampedArray` RGBA buffer
- supported image formats:
  - GR (Lo-Res): 40x48 pixels, 16 colors
    - start address 0x400, length 0x400
    - file extension: `.GR`
  - DGR (Double Lo-Res): 80x48 pixels, 16 colors
    - start address 0x400, length 0x800
    - file extension: `.DGR`
  - HGR (Hi-Res)
    - file extension: `.HGR`
    - editor modes: color 140x192 (6 colors), mono 280x192 (2 colors)
    - file length 0x2000 (Apple II HGR memory layout)
  - DHGR (Double Hi-Res)
    - file extension: `.DHGR`
    - editor modes: color 140x192 (16 colors), mono 560x192 (2 colors)
    - file length 0x4000 (0x2000 main + 0x2000 aux)
  - generic pixmap
    - 1 byte per pixel; palette length depends on the mode palette
    - file extension: `.PIXMAP`
    - width and height selectable
    - no header; length must be width * height bytes
  - generic bitmap
    - 1 bit per pixel; 2 colors
    - file extension: `.BITMAP`
    - width and height selectable
    - no header; length must be width * height / 8 bytes
- file open: upload without server
- file save: download without server


# see also

- [apple2-image-converter](https://github.com/iolo/apple2-image-converter)
- [apple2-disk-manager](https://github.com/iolo/apple2-disk-manager)

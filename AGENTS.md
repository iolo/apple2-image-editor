# apple2-image-editor

simple image editor for Apple II lo-res, double lo-res, hi-res and double hi-res graphics modes


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

- create and edit images for Apple II lo-res, double lo-res, hi-res and double hi-res graphics modes
- TODO: compress and decompress images using lz4, lzsa, zx02


# implementation notes

## directory structure

- `index.html`: the sole html file
- `style.css`: the sole css file
- `script.js`: the sole javascript file

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
  - zoom in/out: mouse wheel or `+`(or `=`)/`-` keys
  - undo/redo: `Ctrl+Z`/`Ctrl+Y`
  - toggle pixel grid
  - move keyboard cursor(caret; focus rect around pixel) for keyboard: arrow keys
  - TODO: rectangle, fill, line, circle, ...
- drawing area: html5 canvas
  - mouse click(or `D` key) to draw single pixel with foreground color
  - mouse right click(or 'E' key) to draw single pixel with background color
  - display pixel grid when zoom x4 or more
  - display focus rect for keyboard control
  - scrollable when image larger than drawing area
- color palette: html elements with css
  - colors for each mode: click to select foreground color, right click to select background color
  - selected foreground/background colors
  - presets for Apple II lo-res, double lo-res, hi-res, double hi-res

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

- `Uint8Array` for pixel data storage
- supported image formats:
  - lo-res: 40x48 pixels, 16 colors
    - start address 0x400, length 0x400
    - file extension: `.GR`
  - double lo-res: 80x48 pixels, 16 colors
    - start address 0x400, length 0x800
    - file extension: `.DGR`
  - hi-res 280x192 pixels, 6 colors
    - start address 0x2000, length 0x2000
    - file extension: `.HGR`
  - double hi-res 560x192 pixels, 16 colors
    - start address 0x2000, length 0x4000(0x2000 for main memory + 0x2000 for aux memory)
    - file extension: `.DHGR`
  - generic pixmap
    - 1 byte per pixel; 256 colors(indexed)
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

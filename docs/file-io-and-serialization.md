# File I/O And Serialization

This document explains how files are opened, interpreted, and saved.

## Supported Formats

- GR: 0x400 bytes, `.GR`
- DGR: 0x800 bytes, `.DGR`
- HGR: 0x2000 bytes, `.HGR`
- DHGR: 0x4000 bytes, `.DHGR`
- Pixmap: width \* height bytes, `.PIXMAP`
- Bitmap: (width \* height) / 8 bytes, `.BITMAP`
- Modern raster: `.png`, `.jpg`, `.jpeg`, `.webp`

## Open Flow

1. The user chooses a file.
2. The app reads the file into an ArrayBuffer.
3. The mode is detected by extension or file size (`detectMode`).
4. The default view for that mode is selected.
5. The framebuffer is initialized and loaded with file bytes.
6. The framebuffer is decoded into RGBA for display.

### Custom Dimensions

Pixmap and bitmap require explicit width/height. If the dimensions are not
known, the app prompts for them before initializing the framebuffer.

## Import Flow (Modern Raster)

1. The user selects a modern image file.
2. The image is loaded into a bitmap or `Image`.
3. The target mode is selected (and view uses the mode default).
4. The image is resized to target dimensions.
5. Colors are quantized (optional Floyd-Steinberg dithering).
6. The RGBA result is encoded to the framebuffer.

## Save Flow

- Apple II formats: bytes are taken directly from the framebuffer.
- Modern formats: RGBA pixels are encoded via `toBlob` on a canvas.

## Serialization Rules

- The framebuffer is the canonical representation.
- Views only affect how the framebuffer is decoded/encoded.
- View switching never alters saved output unless edits are made.

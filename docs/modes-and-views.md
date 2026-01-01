# Modes And Views

This editor separates framebuffer formats ("modes") from how they are shown and edited ("views").
Modes are immutable after New/Open. Views are switchable while editing.

## Modes

Each mode defines a framebuffer layout and file format:

- GR: Lo-Res, 40x48, 0x400 bytes, `.GR`
- DGR: Double Lo-Res, 80x48, 0x800 bytes, `.DGR`
- HGR: Hi-Res, 0x2000 bytes, `.HGR`
- DHGR: Double Hi-Res, 0x4000 bytes, `.DHGR`
- Pixmap: 8 bpp, size = width \* height, `.PIXMAP`
- Bitmap: 1 bpp, size = (width \* height) / 8, `.BITMAP`

The framebuffer is the source of truth. View switching re-decodes from the framebuffer.

## Views

Views define:

- `width`/`height`: logical pixel dimensions for editing and display.
- `palette`: color table for UI and quantization.
- `setPixel`/`getPixel`: how logical pixels map to framebuffer bits.
- Optional `scaleX`/`scaleY` for display aspect.

### GR Views

Same framebuffer encoding, different palettes:

- `color`: 16-color palette.
- `gray`: grayscale palette.
- `green`: green monochrome palette.
- `amber`: amber monochrome palette.

### DGR Views

Same framebuffer encoding, different palettes:

- `color`: 16-color palette.
- `gray`: grayscale palette.
- `green`: green monochrome palette.
- `amber`: amber monochrome palette.

### HGR Views

Different logical resolutions on the same framebuffer:

- `color`: 140x192, 6-color palette.
- `mono`: 280x192, 2-color palette.
- `green`: 280x192, 2-color palette.
- `amber`: 280x192, 2-color palette.

### DHGR Views

Different logical resolutions on the same framebuffer:

- `color`: 140x192, 16-color palette.
- `mono`: 560x192, 2-color palette.
- `green`: 560x192, 2-color palette.
- `amber`: 560x192, 2-color palette.

### Pixmap Views

- `color`: uses the 256-color palette.

### Bitmap Views

- `mono`: 2-color palette.

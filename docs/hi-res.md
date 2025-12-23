# Apple II Hi-Res (HGR) Technical Notes

This document describes how the editor stores, loads, and renders Apple II hi-res (HGR) graphics.

## Summary

- Hi-Res Color (HGR color): 140 x 192, 6 colors (black, white, purple, green, orange, blue)
- Hi-Res Mono (HGR mono): 280 x 192, 2 colors (black, white)
- File extension: `.HGR`
- File size: 0x2000 bytes (8 KB)
- Storage: main memory only

## Memory Layout

HGR uses a non-linear address scheme. Each scanline is split into 8-line groups and scattered across three 0x28-byte sections.

- Base page: 0x2000
- Each line uses 40 bytes (280 pixels / 7 pixels per byte)

Address calculation used by the editor:

```js
const byteX = Math.floor(x / 7);
const offset =
  (y & 0x07) * 0x400 +
  ((y >> 3) & 0x07) * 0x80 +
  (y >> 6) * 0x28 +
  byteX;
```

This produces the offset inside a 0x2000-byte buffer.

## Bit Layout

Each byte encodes 7 pixels and one phase bit:

- Bits 0..6: pixel bits (LSB is the leftmost pixel in that byte)
- Bit 7: phase bit (affects color on NTSC hardware)

Pixel index:

```
bit = (byte >> (x % 7)) & 1
```

## Color Mapping (Per-Pixel Approximation)

Real HGR color is a composite artifact. The editor uses a simplified mapping:

- bit = 0 -> black
- bit = 1 -> white, or a color based on phase and column parity:
  - phase 0:
    - even column: purple
    - odd column: green
  - phase 1:
    - even column: blue
    - odd column: orange

The editor uses this mapping in `apple2-hgr.js` for decoding and a reverse best-fit when setting pixels.

## Editor Modes

The editor exposes two HGR modes that share the same 0x2000-byte framebuffer:

- Hi-Res Color (140x192): Renders each pair of HGR pixels as a single color pixel.
- Hi-Res Mono (280x192): Renders each HGR bit as black or white.

Switching between these modes is purely representational; the underlying buffer and `.HGR` file format are unchanged.

## File Format

The `.HGR` file is a raw dump of 0x2000 bytes with the layout above. There is no header.

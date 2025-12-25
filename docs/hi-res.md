# Apple II HGR (Hi-Res) Technical Notes

This document describes how the editor stores, loads, and renders Apple II HGR (Hi-Res) graphics.

## Summary

- HGR Color (Hi-Res color): 140 x 192, 6 colors (black, white, purple, green, orange, blue)
- HGR Mono (Hi-Res mono): 280 x 192, 2 colors (black, white)
- File extension: `.HGR`
- File size: 0x2000 bytes (8 KB)
- Storage: main memory only

## Memory Layout

HGR (Hi-Res) uses a non-linear address scheme. Each scanline is split into 8-line groups and scattered across three 0x28-byte sections.

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

- 2 bytes represent 7 pixels.
- Each pixel is consist of 3 bits(2 bits + 1 shared MSB for palette).
- 3 bits determine the color of each pixel.
- Mono mode ignores color and renders any set bit as white.

|------------|--------------|--------------|-----|
|address     | $2000        | $2001        | ... |
|------------|--------------|--------------|-----|
|bit offset  | 7 6 54 32 10 | 7 65 43 21 0 | ... |
|pixel       | P D CC BB AA | P GG FF EE D | ... |
|pixel offset| 2 1 01 01 01 | 2 01 01 01 0 | ... |
|------------|--------------|--------------|-----|

- Pixel A: bit1 of $2000, bit0 of $2000, bit7 of $2000
- Pixel B: bit3 of $2000, bit2 of $2000, bit7 of $2000
- Pixel C: bit5 of $2000, bit4 of $2000, bit7 of $2000
- Pixel D: bit0 of $2001, bit6 of $2000, bit7 of $2001
- Pixel E: bit2 of $2001, bit1 of $2001, bit7 of $2001
- Pixel F: bit4 of $2001, bit3 of $2001, bit7 of $2001
- Pixel G: bit6 of $2001, bit5 of $2001, bit7 of $2001

## Editor Modes

The editor exposes two HGR (Hi-Res) modes that share the same 0x2000-byte framebuffer:

- HGR Color (140x192): Renders each pair of HGR pixels as a single color pixel.
- HGR Mono (280x192): Renders each HGR bit as black or white.

Switching between these modes is purely representational; the underlying buffer and `.HGR` file format are unchanged.

## File Format

The `.HGR` file is a raw dump of 0x2000 bytes with the layout above. There is no header.

# Apple II Double Hi-Res (DHGR) Technical Notes

This document describes how the editor stores, loads, and renders Apple II double hi-res (DHGR) graphics.

## Summary

- Double Hi-Res Color (DHGR color): 140 x 192, 16 colors (lo-res palette)
- Double Hi-Res Mono (DHGR mono): 560 x 192, 2 colors (black, white)
- File extension: `.DHGR`
- File size: 0x4000 bytes (16 KB)
- Storage: main + auxiliary memory (0x2000 each)

## Memory Layout

DHGR uses the same interleaved HGR address scheme, but the pixel stream is split between main and auxiliary memory.

- Main bank: 0x2000 bytes
- Aux bank: 0x2000 bytes
- Each bank stores 280 columns (half of the 560 columns)
- Each byte stores 7 pixels and one phase bit (bit 7)

The file layout is:

```
offset 0x0000 .. 0x1FFF: main bank
offset 0x2000 .. 0x3FFF: aux bank
```

## Column Interleave

On screen, even and odd columns are interleaved:

- Even x (0, 2, 4, ...) use the main bank
- Odd x (1, 3, 5, ...) use the aux bank

When computing the byte address, the editor uses `column = x >> 1` (0..279) and the standard HGR addressing:

```js
const column = x >> 1;
const byteX = Math.floor(column / 7);
const offset =
  (y & 0x07) * 0x400 +
  ((y >> 3) & 0x07) * 0x80 +
  (y >> 6) * 0x28 +
  byteX;
```

Each byte covers 7 pixels within that 280-column stream:

```
bit = (byte >> (column % 7)) & 1
```

## Phase Bits

Each byte still has a phase bit at bit 7 in both banks. The editor uses both main and aux phase bits during color selection.

## Color Mapping (Editor Approximation)

True DHGR artifact color is complex. The editor uses a simplified per-pixel mapping that selects a lo-res palette index based on:

- main bit
- aux bit
- main phase bit
- aux phase bit
- x parity (even or odd column)

This mapping is implemented in `apple2-dhgr.js` in `dhgrColorFromBits(...)`, with a reverse best-fit in `setPixel(...)`.

## File Format

The `.DHGR` file is a raw dump of both banks (main first, aux second). There is no header.

## Editor Modes

The editor exposes two DHGR modes that share the same 0x4000-byte framebuffer:

- Double Hi-Res Color (140x192): Renders each group of 4 DHGR bits as a 4-bit color index (0..15) without artifact blending.
- Double Hi-Res Mono (560x192): Renders any set bit as white on black.

Switching between these modes is purely representational; the underlying buffer and `.DHGR` file format are unchanged.

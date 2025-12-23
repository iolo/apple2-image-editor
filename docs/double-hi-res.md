# Apple II Double Hi-Res (DHGR) Technical Notes

This document describes how the editor stores, loads, and renders Apple II double hi-res (DHGR) graphics.

## Summary

- Resolution: 560 x 192
- Colors: 16 (lo-res palette)
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


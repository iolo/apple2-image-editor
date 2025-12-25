# Apple II DHGR (Double Hi-Res) Technical Notes

This document describes how the editor stores, loads, and renders Apple II DHGR (Double Hi-Res) graphics.

## Summary

- DHGR Color (Double Hi-Res color): 140 x 192, 16 colors (lo-res palette)
- DHGR Mono (Double Hi-Res mono): 560 x 192, 2 colors (black, white)
- File extension: `.DHGR`
- File size: 0x4000 bytes (16 KB)
- Storage: main + auxiliary memory (0x2000 each)

## Memory Layout

DHGR (Double Hi-Res) uses the same interleaved HGR address scheme, but the pixel stream is split between main and auxiliary memory.

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

- Even x (0, 2, 4, ...) use the aux bank
- Odd x (1, 3, 5, ...) use the main bank

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

## No Phase Bits

Unlike HGR Color mode, no phase bits in DHGR mode. All MSB bits are ignored.

## Color Mapping

True DHGR artifact color is complex. The editor uses a simplified per-pixel mapping that selects a lo-res palette index based on.

- 4 bytes(2 from each bank) represent 7 pixels.
- Each pixel consists of 4 bits.
- 4 bits determine the color of each pixel.
- Mono mode ignores color and renders any set bit as white.
- NOTE: no shared bit like HGR mode

|------------|------------|-------------+-------------|------------|---|
|bank        | AUX        |MAIN         | AUX         | MAIN       |   |
|------------|------------|-------------+-------------|------------|---|
|address     | $2000      |$2000        | $2001       | $2001      |...|
|------------|------------|-------------+-------------|------------|---|
|bit offset  | 7 654 3210 | 7 65 4321 0 | 7 6 5432 10 | 7 6543 210 |...|
|pixel       | - BBB AAAA | - DD CCCC B | - F EEEE DD | - GGGG FFF |...|
|pixel offset| - 123 0123 | - 23 0123 0 | - 3 0123 01 | - 0123 012 |...|
|------------|------------|-------------+-------------|------------|---|

- Pixel A: bit0 of AUX $2000, bit1 of AUX $2000, bit2 of AUX $2000, bit3 of AUX $2000
- Pixel B: bit4 of AUX $2000, bit5 of AUX $2000, bit6 of AUX $2000, bit0 of MAIN $2000
- Pixel C: bit1 of MAIN $2000, bit2 of MAIN $2000, bit3 of MAIN $2000, bit4 of MAIN $2000
- Pixel D: bit5 of MAIN $2000, bit6 of MAIN $2000, bit0 of AUX $2001, bit1 of AUX $2001
- Pixel E: bit2 of AUX $2001, bit3 of AUX $2001, bit4 of AUX $2001, bit5 of AUX $2001
- Pixel F: bit6 of AUX $2001, bit0 of MAIN $2001, bit1 of MAIN $2001, bit2 of MAIN $2001
- Pixel G: bit3 of MAIN $2001, bit4 of MAIN $2001, bit5 of MAIN $2001, bit6 of MAIN $2001

## File Format

The `.DHGR` file is a raw dump of both banks (aux first, main second). There is no header.

## Editor Modes

The editor exposes two DHGR (Double Hi-Res) modes that share the same 0x4000-byte framebuffer:

- DHGR Color (140x192): Renders each group of 4 DHGR bits as a 4-bit color index (0..15) without artifact blending.
- DHGR Mono (560x192): Renders any set bit as white on black.

Switching between these modes is purely representational; the underlying buffer and `.DHGR` file format are unchanged.

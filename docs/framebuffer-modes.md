# Framebuffer Modes (Technical)

This document explains how each mode maps logical pixels to the framebuffer.

## GR (Lo-Res, 40x48)

- Framebuffer size: 0x400 bytes.
- Each byte stores two vertical pixels (even/odd rows).
- Row addressing uses the Apple II text interleave table.

Layout:

- `y` ranges 0..47. Two pixel rows share the same byte row.
- `x` ranges 0..39.
- Byte offset: `TEXT_OFFSET[y >> 1] + x`
- Even row: low nibble (bits 0..3)
- Odd row: high nibble (bits 4..7)

This yields 16 color indices per pixel.

Byte/nibble layout (per column byte):

```
bit:   7 6 5 4 3 2 1 0
row y: o o o o e e e e
        odd row        even row
```

## DGR (Double Lo-Res, 80x48)

- Framebuffer size: 0x800 bytes (0x400 AUX + 0x400 MAIN).
- Each byte still holds two vertical pixels (nibbles), but columns are
  interleaved across AUX and MAIN banks.

Layout:

- `y` ranges 0..47.
- `x` ranges 0..79.
- Byte offset:
  - Base: `TEXT_OFFSET[y >> 1] + (x >> 1)`
  - Bank: AUX when `x` is even, MAIN when `x` is odd.

Each nibble is a color index. When reading, AUX values are remapped to match
MAIN color ordering.

Column/bank interleave (per 2 columns):

```
x:        0        1        2        3        ...
bank:     AUX      MAIN     AUX      MAIN     ...
byte:     b0       b0       b1       b1       ...
bit:     7..4     7..4     7..4     7..4     (odd rows)
bit:     3..0     3..0     3..0     3..0     (even rows)
```

## HGR (Hi-Res, 0x2000 bytes)

- Framebuffer size: 0x2000 bytes.
- Rows are interleaved in 8-line blocks across three 64-line sections.
- Color and mono are two views over the same 0x2000 bytes.

Row interleave:

```
offset = HGR_OFFSET[y]
```

### HGR Color (140x192)

- 7 color pixels are encoded across 2 bytes (14 useful bits plus palette MSB).
- Each color pixel is 2 bits plus a shared palette bit (MSB).
- Logical width is 140 because 7 color pixels fit per 2 bytes.

Pixel grouping (two bytes):

- Byte0: bits hold A, B, C, D (plus palette MSB).
- Byte1: bits hold D, E, F, G (plus palette MSB).

Bit layout (2 bytes):

```
byte:      0            1
bit:     7 6 54 32 10  7 65 43 21 0
pixel:   P D CC BB AA  P GG FF EE D
pixelbit:2 1 01 01 01  2 01 01 01 0
```

`P` is the palette bit (MSB). `A..G` are 2-bit color pixels. Pixel D spans
both bytes.

### HGR Mono (280x192)

- Each byte holds 7 mono pixels (bit 0..6). Bit 7 is ignored.
- Logical width is 280 because each byte maps to 7 pixels and there are
  40 bytes per row.

Mono view doubles horizontal resolution relative to color because color pixels
are grouped as 2-bit pairs.

Bit layout (per byte):

```
bit:   7 6 5 4 3 2 1 0
pixel: - 6 5 4 3 2 1 0
```

## DHGR (Double Hi-Res, 0x4000 bytes)

- Framebuffer size: 0x4000 bytes (0x2000 AUX + 0x2000 MAIN).
- Uses the same row interleave as HGR.
- Color and mono are views over the same combined memory.

### DHGR Color (140x192)

- 7 color pixels are encoded across 4 bytes:
  - AUX byte 0, MAIN byte 0, AUX byte 1, MAIN byte 1.
- Each pixel is 4 bits, spread across those 4 bytes.

Bit layout (4 bytes):

```
bank:     AUX        MAIN        AUX         MAIN
byte:      0           0           1           1
bit:     7 654 3210  7 65 4321 0  7 6 5432 10  7 6543 210
pixel:   - BBB AAAA  - DD CCCC B  - F EEEE DD  - GGGG FFF
pixbit:  - 123 0123  - 23 0123 0  - 3 0123 01  - 0123 012
```

### DHGR Mono (560x192)

- Each byte holds 7 mono pixels (bits 0..6).
- Columns alternate between AUX and MAIN banks:
  - Pixel groups 0..6 -> AUX byte
  - 7..13 -> MAIN byte
  - 14..20 -> AUX byte
  - 21..27 -> MAIN byte

Logical width is 560 because each byte contributes 7 pixels and there are
80 bytes (40 AUX + 40 MAIN) per row.

Bit layout (per byte):

```
bit:   7 6 5 4 3 2 1 0
pixel: - 6 5 4 3 2 1 0
```

## Pixmap

- 1 byte per pixel.
- Size = width \* height.
- No row interleaving or bank switching.

## Bitmap

- 1 bit per pixel.
- Size = ceil(width \* height / 8).
- Bits are packed left-to-right into bytes.

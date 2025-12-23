# Apple II Double Lo-Res (DGR) Technical Notes

This document describes how the editor stores, loads, and renders Apple II double lo-res (DGR) graphics.

## Summary

- Resolution: 80 x 48
- Colors: 16 (lo-res palette)
- File extension: `.DGR`
- File size: 0x800 bytes (2 KB)
- Storage: main + auxiliary memory (0x400 each)

## Memory Layout

Double lo-res uses the same lo-res addressing, but columns are split between main and auxiliary memory.

- Main bank: 0x400 bytes
- Aux bank: 0x400 bytes
- Each bank stores 40 columns (half of the 80 columns)
- Each byte stores two vertical pixels (4 bits each)

The file layout is:

```
offset 0x0000 .. 0x03FF: main bank
offset 0x0400 .. 0x07FF: aux bank
```

## Column Interleave

On screen, even and odd columns are interleaved:

- Even x (0, 2, 4, ...) use the main bank
- Odd x (1, 3, 5, ...) use the aux bank

When computing the byte address, the editor uses `column = x >> 1` and the standard lo-res addressing:

```js
const column = x >> 1;
const row24 = y >> 1;
const offset = (row24 & 0x07) * 0x80 + (row24 >> 3) * 0x28 + column;
```

The byte stores two vertical pixels:

```
color = (y & 1) ? (byte >> 4) & 0x0f : byte & 0x0f
```

## Color Mapping Difference (Main vs Aux)

Double lo-res uses different color decoding for main and aux columns. The 4-bit color index is remapped when the pixel comes from the aux bank.

Aux color remap (index -> displayed color):

```
0 -> 0
1 -> 8
2 -> 1
3 -> 9
4 -> 2
5 -> A
6 -> 3
7 -> B
8 -> 4
9 -> C
A -> 5
B -> D
C -> 6
D -> E
E -> 7
F -> F
```

This mapping is equivalent to a 4-bit rotate-right by 1 (ROR without carry).

## File Format

The `.DGR` file is a raw dump of both banks (main first, aux second). There is no header.

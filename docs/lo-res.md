# Apple II Lo-Res (GR) Technical Notes

This document describes how the editor stores, loads, and renders Apple II lo-res (GR) graphics.

## Summary

- Resolution: 40 x 48
- Colors: 16 (lo-res palette)
- File extension: `.GR`
- File size: 0x400 bytes (1 KB)
- Storage: main memory only

## Memory Layout

Lo-res uses the same interleaved addressing pattern as text mode, with 24 rows of memory and two vertical pixels per byte.

- Base page: 0x400
- Each row uses 40 bytes (40 columns)
- Memory rows are interleaved in 8-row blocks

Address calculation used by the editor:

```js
const row24 = y >> 1;
const offset = (row24 & 0x07) * 0x80 + (row24 >> 3) * 0x28 + x;
```

This produces the offset inside a 0x400-byte buffer.

## Byte Layout

Each byte stores two vertical pixels in a column:

- Bits 0..3: even y (top pixel of the pair)
- Bits 4..7: odd y (bottom pixel of the pair)

Pixel index:

```
color = (y & 1) ? (byte >> 4) & 0x0f : byte & 0x0f
```

## File Format

The `.GR` file is a raw dump of 0x400 bytes with the layout above. There is no header.

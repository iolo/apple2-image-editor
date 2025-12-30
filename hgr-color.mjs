// Apple II HGR support 6 colors with complex restrictions.
// for consistency & simplicity, make it 3 bits per pixel(MSB, even, odd)
// prettier-ignore
export const COLORS = [
    0x000000, // 000 BLACK
    0x38cb00, // 001 GREEN
    0xc734ff, // 010 PURPLE
    0xfffffe, // 011 WHITE2(pseudo)
    0x000001, // 100 BLACK2(pseudo)
    0xf25e00, // 101 ORANGE
    0x0da1ff, // 110 BLUE
    0xffffff, // 111 WHITE
];

// HGR memory layout:
//
// 40 bytes per row, 7 color-pixels per 2 bytes, total 140 color-pixels per row.
//
// |address    | $2000        | $2001        | ... | $2026        |$2027         |
// |-----------|--------------|--------------|-----|--------------|--------------|
// |byte offset| 0            | 1            | ... | 38           | 39           |
// |bit offset | 7 6 54 32 10 | 7 65 43 21 0 | ... | 7 6 54 32 10 | 7 65 43 21 0 |
// |pixel      | P D CC BB AA | P GG FF EE D | ... | P D CC BB AA | P GG FF EE D |
// |pixel bit  | 2 1 01 01 01 | 2 01 01 01 0 | ... | 2 1 01 01 01 | 2 01 01 01 0 |
// |x          |   3 2  1  0  |   6  5  4  3 | ... |136 135 134 133|139 138 137 136|

// Apple II hi-res base offset of each line(0..191)
// Apple II HGR interleaves 8-line blocks across 3 sections.
// ((y % 8) * 1024) % 8192 + ((y / 8) % 2) * 128
// prettier-ignore
export const HGR_OFFSET = [
  // section 0
  0x000, 0x400, 0x800, 0xc00, 0x1000, 0x1400, 0x1800, 0x1c00, // block 0
  0x080, 0x480, 0x880, 0xc80, 0x1080, 0x1480, 0x1880, 0x1c80, // block 1
  0x100, 0x500, 0x900, 0xd00, 0x1100, 0x1500, 0x1900, 0x1d00, // block 2
  0x180, 0x580, 0x980, 0xd80, 0x1180, 0x1580, 0x1980, 0x1d80, // block 3
  0x200, 0x600, 0xa00, 0xe00, 0x1200, 0x1600, 0x1a00, 0x1e00, // block 4
  0x280, 0x680, 0xa80, 0xe80, 0x1280, 0x1680, 0x1a80, 0x1e80, // block 5
  0x300, 0x700, 0xb00, 0xf00, 0x1300, 0x1700, 0x1b00, 0x1f00, // block 6
  0x380, 0x780, 0xb80, 0xf80, 0x1380, 0x1780, 0x1b80, 0x1f80, // block 7
  // section 1
  0x028, 0x428, 0x828, 0xc28, 0x1028, 0x1428, 0x1828, 0x1c28, // block 0
  0x0a8, 0x4a8, 0x8a8, 0xca8, 0x10a8, 0x14a8, 0x18a8, 0x1ca8, // block 1
  0x128, 0x528, 0x928, 0xd28, 0x1128, 0x1528, 0x1928, 0x1d28, // block 2
  0x1a8, 0x5a8, 0x9a8, 0xda8, 0x11a8, 0x15a8, 0x19a8, 0x1da8, // block 3
  0x228, 0x628, 0xa28, 0xe28, 0x1228, 0x1628, 0x1a28, 0x1e28, // block 4
  0x2a8, 0x6a8, 0xaa8, 0xea8, 0x12a8, 0x16a8, 0x1aa8, 0x1ea8, // block 5
  0x328, 0x728, 0xb28, 0xf28, 0x1328, 0x1728, 0x1b28, 0x1f28, // block 6
  0x3a8, 0x7a8, 0xba8, 0xfa8, 0x13a8, 0x17a8, 0x1ba8, 0x1fa8, // block 7
  // section 2
  0x050, 0x450, 0x850, 0xc50, 0x1050, 0x1450, 0x1850, 0x1c50, // block 0
  0x0d0, 0x4d0, 0x8d0, 0xcd0, 0x10d0, 0x14d0, 0x18d0, 0x1cd0, // block 1
  0x150, 0x550, 0x950, 0xd50, 0x1150, 0x1550, 0x1950, 0x1d50, // block 2
  0x1d0, 0x5d0, 0x9d0, 0xdd0, 0x11d0, 0x15d0, 0x19d0, 0x1dd0, // block 3
  0x250, 0x650, 0xa50, 0xe50, 0x1250, 0x1650, 0x1a50, 0x1e50, // block 4
  0x2d0, 0x6d0, 0xad0, 0xed0, 0x12d0, 0x16d0, 0x1ad0, 0x1ed0, // block 5
  0x350, 0x750, 0xb50, 0xf50, 0x1350, 0x1750, 0x1b50, 0x1f50, // block 6
  0x3d0, 0x7d0, 0xbd0, 0xfd0, 0x13d0, 0x17d0, 0x1bd0, 0x1fd0, // block 7
];

// pixel x -> byte x
// pixel 0..6 -> byte 0..1, pixel 17..13 -> byte 2..3, ... pixel 138..139 -> byte 38..39
// x / 2 / 7
// prettier-ignore
export const HGR_OFFSET_X = [
  0, 0, 0, 0, 0, 0, 0, // pixels 0..6
  2, 2, 2, 2, 2, 2, 2, // pixels 7..13
  4, 4, 4, 4, 4, 4, 4, // pixels 14..20
  6, 6, 6, 6, 6, 6, 6, // pixels 21..27
  8, 8, 8, 8, 8, 8, 8, // pixels 28..34
  10, 10, 10, 10, 10, 10, 10, // pixels 35..41
  12, 12, 12, 12, 12, 12, 12, // pixels 42..48
  14, 14, 14, 14, 14, 14, 14, // pixels 49..55
  16, 16, 16, 16, 16, 16, 16, // pixels 56..62
  18, 18, 18, 18, 18, 18, 18, // pixels 63..69
  20, 20, 20, 20, 20, 20, 20, // pixels 70..76
  22, 22, 22, 22, 22, 22, 22, // pixels 77..83
  24, 24, 24, 24, 24, 24, 24, // pixels 84..90
  26, 26, 26, 26, 26, 26, 26, // pixels 91..97
  28, 28, 28, 28, 28, 28, 28, // pixels 98..104
  30, 30, 30, 30, 30, 30, 30, // pixels 105..111
  32, 32, 32, 32, 32, 32, 32, // pixels 112..118
  34, 34, 34, 34, 34, 34, 34, // pixels 119..125
  36, 36, 36, 36, 36, 36, 36, // pixels 126..132
  38, 38, 38, 38, 38, 38, 38, // pixels 133..139
];

export function init() {
  return new Uint8Array(0x2000);
}

// 0..139 -> 0..39
function pixelOffset(x, y) {
  return HGR_OFFSET[y] + HGR_OFFSET_X[x];
}

export function setPixel(fb, x, y, color) {
  const offset = pixelOffset(x, y);
  const byte0 = fb[offset];
  const byte1 = fb[offset + 1];

  const b0 = color & 0b001;
  const b1 = (color & 0b010) >> 1;
  const b2 = (color & 0b100) >> 2;
  const pal = b2 << 7;

  switch (x % 7) {
    case 0: // A
      fb[offset] = (byte0 & ~0b10000011) | pal | (b0 << 1) | b1;
      break;
    case 1: // B
      fb[offset] = (byte0 & ~0b10001100) | pal | (b0 << 3) | (b1 << 2);
      break;
    case 2: // C
      fb[offset] = (byte0 & ~0b10110000) | pal | (b0 << 5) | (b1 << 4);
      break;
    case 3: // D
      fb[offset] = (byte0 & ~0b11000000) | pal | (b1 << 6);
      fb[offset + 1] = (byte1 & ~0b00000001) | b0;
      break;
    case 4: // E
      fb[offset + 1] = (byte1 & ~0b10000110) | pal | (b0 << 2) | (b1 << 1);
      break;
    case 5: // F
      fb[offset + 1] = (byte1 & ~0b10011000) | pal | (b0 << 4) | (b1 << 3);
      break;
    case 6: // G
      fb[offset + 1] = (byte1 & ~0b11100000) | pal | (b0 << 6) | (b1 << 5);
      break;
  }
}

export function getPixel(fb, x, y) {
  const offset = pixelOffset(x, y);
  const byte0 = fb[offset];
  const byte1 = fb[offset + 1];

  const pal0 = (byte0 & 0b10000000) >> 5;
  const pal1 = (byte1 & 0b10000000) >> 5;

  switch (x % 7) {
    case 0: // A
      return pal0 | ((byte0 & 0b00000001) << 1) | ((byte0 & 0b00000010) >> 1);
    case 1: // B
      return pal0 | ((byte0 & 0b00000100) >> 1) | ((byte0 & 0b00001000) >> 3);
    case 2: // C
      return pal0 | ((byte0 & 0b00010000) >> 3) | ((byte0 & 0b00100000) >> 5);
    case 3: // D
      return pal0 | ((byte0 & 0b01000000) >> 5) | (byte1 & 0b00000001);
    case 4: // E
      return pal1 | (byte1 & 0b0000010) | ((byte1 & 0b00000100) >> 2);
    case 5: // F
      return pal1 | ((byte1 & 0b00001000) >> 2) | ((byte1 & 0b00010000) >> 4);
    case 6: // G
      return pal1 | ((byte1 & 0b00100000) >> 4) | ((byte1 & 0b01000000) >> 6);
  }
}

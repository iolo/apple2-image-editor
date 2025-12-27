// Apple II HGR support 6 colors with complex restrictions.
// for consistency & simplicity, make it 3 bits per pixel(MSB, even, odd)
export const COLORS = [
  // 000 BLACK
  '#000000',
  // 001 PURPLE
  '#B000F0',
  // 010 GREEN
  '#00C000',
  // 011 WHITE2(pseudo)
  '#FFFFFF',
  // 100 BLACK2(pseudo)
  '#000000',
  // 101 ORANGE
  '#FF9900',
  // 110 BLUE
  '#0088FF',
  // 111 WHITE
  '#FFFFFF',
];

// Apple II hi-res base offset of each line(0..191)
// Apple II HGR interleaves 8-line blocks across 3 sections.
// (y % 8) * 0x400 + ((y >> 3) & 0x07) * 0x80 + (y >> 6) * 0x28
export const HGR_OFFSET = [
  0x000, 0x400, 0x800, 0xc00, 0x1000, 0x1400, 0x1800, 0x1c00, 0x080, 0x480,
  0x880, 0xc80, 0x1080, 0x1480, 0x1880, 0x1c80, 0x100, 0x500, 0x900, 0xd00,
  0x1100, 0x1500, 0x1900, 0x1d00, 0x180, 0x580, 0x980, 0xd80, 0x1180, 0x1580,
  0x1980, 0x1d80, 0x200, 0x600, 0xa00, 0xe00, 0x1200, 0x1600, 0x1a00, 0x1e00,
  0x280, 0x680, 0xa80, 0xe80, 0x1280, 0x1680, 0x1a80, 0x1e80, 0x300, 0x700,
  0xb00, 0xf00, 0x1300, 0x1700, 0x1b00, 0x1f00, 0x380, 0x780, 0xb80, 0xf80,
  0x1380, 0x1780, 0x1b80, 0x1f80, 0x028, 0x428, 0x828, 0xc28, 0x1028, 0x1428,
  0x1828, 0x1c28, 0x0a8, 0x4a8, 0x8a8, 0xca8, 0x10a8, 0x14a8, 0x18a8, 0x1ca8,
  0x128, 0x528, 0x928, 0xd28, 0x1128, 0x1528, 0x1928, 0x1d28, 0x1a8, 0x5a8,
  0x9a8, 0xda8, 0x11a8, 0x15a8, 0x19a8, 0x1da8, 0x228, 0x628, 0xa28, 0xe28,
  0x1228, 0x1628, 0x1a28, 0x1e28, 0x2a8, 0x6a8, 0xaa8, 0xea8, 0x12a8, 0x16a8,
  0x1aa8, 0x1ea8, 0x328, 0x728, 0xb28, 0xf28, 0x1328, 0x1728, 0x1b28, 0x1f28,
  0x3a8, 0x7a8, 0xba8, 0xfa8, 0x13a8, 0x17a8, 0x1ba8, 0x1fa8, 0x050, 0x450,
  0x850, 0xc50, 0x1050, 0x1450, 0x1850, 0x1c50, 0x0d0, 0x4d0, 0x8d0, 0xcd0,
  0x10d0, 0x14d0, 0x18d0, 0x1cd0, 0x150, 0x550, 0x950, 0xd50, 0x1150, 0x1550,
  0x1950, 0x1d50, 0x1d0, 0x5d0, 0x9d0, 0xdd0, 0x11d0, 0x15d0, 0x19d0, 0x1dd0,
  0x250, 0x650, 0xa50, 0xe50, 0x1250, 0x1650, 0x1a50, 0x1e50, 0x2d0, 0x6d0,
  0xad0, 0xed0, 0x12d0, 0x16d0, 0x1ad0, 0x1ed0, 0x350, 0x750, 0xb50, 0xf50,
  0x1350, 0x1750, 0x1b50, 0x1f50, 0x3d0, 0x7d0, 0xbd0, 0xfd0, 0x13d0, 0x17d0,
  0x1bd0, 0x1fd0,
];

// pixel x -> byte x
// pixel 0..6 -> byte 0..1, pixel 17..13 -> byte 2..3, ... pixel 138..139 -> byte 38..39
// Math.floor(x / 7) * 2
const HGR_OFFSET_X = [
  0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6,
  6, 6, 8, 8, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12,
  12, 14, 14, 14, 14, 14, 14, 14, 16, 16, 16, 16, 16, 16, 16, 18, 18, 18, 18,
  18, 18, 18, 20, 20, 20, 20, 20, 20, 20, 22, 22, 22, 22, 22, 22, 22, 24, 24,
  24, 24, 24, 24, 24, 26, 26, 26, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28,
  30, 30, 30, 30, 30, 30, 30, 32, 32, 32, 32, 32, 32, 32, 34, 34, 34, 34, 34,
  34, 34, 36, 36, 36, 36, 36, 36, 36, 38, 38, 38, 38, 38, 38, 38,
];

let framebuffer;

export function init(buffer) {
  framebuffer = new Uint8Array(buffer);
}

export function toBuffer() {
  return new Uint8Buffer(framebuffer);
}

function pixelOffset(x, y) {
  return HGR_OFFSET[y] + HGR_OFFSET_X[x];
}

// 40 bytes per row, 7 pixels per 2 bytes, total 140 pixels per row
//
// |address  | $2000        | $2001        | ... | $2026        |$2027         |
// |---------|--------------|--------------|-----|--------------|--------------|
// |offset   | 0            | 1            | ... | 38           | 39           |
// |byte bit | 7 6 54 32 10 | 7 65 43 21 0 | ... | 7 6 54 32 10 | 7 65 43 21 0 |
// |pixel    | P D CC BB AA | P GG FF EE D | ... | P D CC BB AA | P GG FF EE D |
// |pixel bit| 2 1 01 01 01 | 2 01 01 01 0 | ... | 2 1 01 01 01 | 2 01 01 01 0 |
// |x        |   3 2  1  0  |   6  5  4  3 | ... |136 135 134 133|139 138 137 136|

export function getPixel(x, y) {
  const offset = pixelOffset(x, y);
  const byte0 = framebuffer[offset];
  const byte1 = framebuffer[offset + 1];

  const palette0 = (byte0 & 0b10000000) >> 5;
  const palette1 = (byte1 & 0b10000000) >> 5;
  const group = x % 7;
  switch (group) {
    case 0:
      return palette0 | (byte0 & 0b00000011);
    case 1:
      return palette0 | ((byte0 & 0b00001100) >> 2);
    case 2:
      return palette0 | ((byte0 & 0b00110000) >> 4);
    case 3:
      return (
        palette0 | ((byte0 & 0b01000000) >> 6) | ((byte1 & 0b00000001) << 1)
      );
    case 4:
      return palette1 | ((byte1 & 0b00000110) >> 1);
    case 5:
      return palette1 | ((byte1 & 0b00011000) >> 3);
    case 6:
      return palette1 | ((byte1 & 0b01100000) >> 5);
  }
}

export function setPixel(x, y, color) {
  const offset = pixelOffset(x, y);
  const byte0 = framebuffer[offset];
  const byte1 = framebuffer[offset + 1];

  const group = x % 7;
  const palette = (color & 0b100) << 5;
  switch (group) {
    case 0: // A
      framebuffer[offset] = (byte0 & ~0b00000011) | palette | (color & 0b011);
      break;
    case 1: // B
      framebuffer[offset] =
        (byte0 & ~0b00001100) | palette | ((color & 0b011) << 2);
      break;
    case 2: // C
      framebuffer[offset] =
        (byte0 & ~0b00110000) | palette | ((color & 0b011) << 4);
      break;
    case 3: // D
      framebuffer[offset] =
        (byte0 & ~0b01000000) | palette | ((color & 0b010) << 6);
      framebuffer[offset + 1] = (byte1 & ~0b10000001) | (color & 0b001);
      break;
    case 4: // E
      framebuffer[offset + 1] =
        (byte1 & ~0b00000110) | palette | ((color & 0b011) << 1);
      break;
    case 5: // F
      framebuffer[offset + 1] =
        (byte1 & ~0b00011000) | palette | ((color & 0b011) << 3);
      break;
    case 6: // G
      framebuffer[offset + 1] =
        (byte1 & ~0b01100000) | palette | ((color & 0b011) << 5);
      break;
  }
}

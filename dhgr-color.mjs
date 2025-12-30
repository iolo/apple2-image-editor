import { HGR_OFFSET, HGR_OFFSET_X } from './hgr-color.mjs';

// prettier-ignore
export const COLORS = [
  0x000000, // 0000 black
  0x000783, // 0001 dkblue
  0x00832f, // 0010 dkgreen
  0x008ab5, // 0011 blue
  0x7a5f00, // 0100 brown
  0x78687f, // 0101 ltgray
  0x6fe62c, // 0110 green
  0x6ceeb2, // 0111 aqua
  0xac124c, // 1000 red
  0xc734ff, // 1001 purple/magenta
  0x808080, // 1010 dkgray
  0xaaaaff, // 1011 ltblue
  0xf25e00, // 1100 orange
  0xff89e5, // 1101 pink
  0xd5d51a, // 1110 yellow
  0xffffff, // 1111 white
];

// DHGR memory layout:
//
// 80 bytes per row(40 in AUX, 40 in MAIN), 7 color-pixels per 4 bytes, total 140 color-pixels per row.
//
// |bank      | AUX        |MAIN         | AUX         | MAIN       |   |
// |----------|------------|-------------+-------------|------------|---|
// |address   | $2000      |$2000        | $2001       | $2001      |...|
// |----------|------------|-------------+-------------|------------|---|
// |bit offset| 7 654 3210 | 7 65 4321 0 | 7 6 5432 10 | 7 6543 210 |...|
// |pixel     | - BBB AAAA | - DD CCCC B | - F EEEE DD | - GGGG FFF |...|
// |pixel bit | - 123 0123 | - 23 0123 0 | - 3 0123 01 | - 0123 012 |...|
// |x         |   1   0    |   3  2    1 |   5 4    3  |   6    5   |...|

const AUX_OFFSET = 0;
const MAIN_OFFSET = 0x2000;

export function init() {
  return new Uint8Array(0x2000 + 0x2000);
}

// 0..139 -> 0..39
function pixelOffset(x, y) {
  return HGR_OFFSET[y] + HGR_OFFSET_X[x];
}

export function setPixel(fb, x, y, color) {
  const offset = pixelOffset(x, y);

  let byte0 = fb[offset + AUX_OFFSET];
  let byte1 = fb[offset + MAIN_OFFSET];
  let byte2 = fb[offset + 1 + AUX_OFFSET];
  let byte3 = fb[offset + 1 + MAIN_OFFSET];

  switch (x % 7) {
    case 0: // A
      byte0 = (byte0 & ~0b00001111) | (color & 0b01111);
      break;
    case 1: // B
      byte0 = (byte0 & ~0b01110000) | ((color & 0b0111) << 4);
      byte1 = (byte1 & ~0b00000001) | ((color & 0b1000) >> 3);
      break;
    case 2: // C
      byte1 = (byte1 & ~0b00011110) | ((color & 0b1111) << 1);
      break;
    case 3: // D
      byte1 = (byte1 & ~0b01100000) | ((color & 0b0011) << 5);
      byte2 = (byte2 & ~0b00000011) | ((color & 0b1100) >> 2);
      break;
    case 4: // E
      byte2 = (byte2 & ~0b00111100) | ((color & 0b1111) << 2);
      break;
    case 5: // F
      byte2 = (byte2 & ~0b01000000) | ((color & 0b0001) << 6);
      byte3 = (byte3 & ~0b00000111) | ((color & 0b1110) >> 1);
      break;
    case 6: // G
      byte3 = (byte3 & ~0b01111000) | ((color & 0b1111) << 3);
      break;
  }

  fb[offset + AUX_OFFSET] = byte0;
  fb[offset + MAIN_OFFSET] = byte1;
  fb[offset + 1 + AUX_OFFSET] = byte2;
  fb[offset + 1 + MAIN_OFFSET] = byte3;
}

export function getPixel(fb, x, y) {
  const offset = pixelOffset(x, y);

  const byte0 = fb[offset + AUX_OFFSET];
  const byte1 = fb[offset + MAIN_OFFSET];
  const byte2 = fb[offset + 1 + AUX_OFFSET];
  const byte3 = fb[offset + 1 + MAIN_OFFSET];

  switch (x % 7) {
    case 0: // A
      return byte0 & 0b00001111;
    case 1: // B
      return ((byte0 & 0b01110000) >> 4) | ((byte1 & 0b00000001) << 3);
    case 2: // C
      return (byte1 & 0b00011110) >> 1;
    case 3: // D
      return ((byte1 & 0b01100000) >> 5) | ((byte2 & 0b00000011) << 2);
    case 4: // E
      return (byte2 & 0b00111100) >> 2;
    case 5: // F
      return ((byte2 & 0b01000000) >> 6) | ((byte3 & 0b00000111) << 1);
    case 6: // G
      return (byte3 & 0b01111000) >> 3;
  }
}

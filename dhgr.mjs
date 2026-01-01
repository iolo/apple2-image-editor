import { HGR_OFFSET, HGR_OFFSET_X } from './hgr.mjs';

// prettier-ignore
const DHGR_COLORS = [
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

const DHGR_MONO_COLORS = [
  0x000000, // black
  0xffffff, // white
];

const DHGR_GREEN_COLORS = [
  0x000000, // black
  0x38cb00, // green
];

const DHGR_AMBER_COLORS = [
  0x000000, // black
  0xf25e00, // amber
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
//
// DHGR mono layout:
//
// 80 bytes per row(40 in AUX, 40 in MAIN), 7 mono-pixels per byte, total 560 mono-pixels per row.
// all MSB(bit7)s are not used.
//
// |bank   |AUX     |MAIN    |AUX     |MAIN    |...|AUX     |MAIN    |
// |address|$2000   |$2000   |$2001   |$2001   |...|$2027   |$2027   |
// |-------|--------|--------|--------|--------|---|--------|--------|
// |offset |0       |0       |1       |1       |...|39      |39      |
// |bit    |76543210|76543210|76543210|76543210|...|76543210|76543210|
// |x      |    0..6|   7..13|  14..20|  21..27|...|546..552|553..559|

const AUX_OFFSET = 0;
const MAIN_OFFSET = 0x2000;

export function init() {
  return new Uint8Array(0x2000 + 0x2000);
}

// 0..139 -> 0..39
function pixelOffsetColor(x, y) {
  return HGR_OFFSET[y] + HGR_OFFSET_X[x];
}

function setColorPixel(fb, x, y, color) {
  const offset = pixelOffsetColor(x, y);

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

function getColorPixel(fb, x, y) {
  const offset = pixelOffsetColor(x, y);

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

// 0..559 -> 0..39
function pixelOffsetMono(x, y) {
  return HGR_OFFSET[y] + Math.floor(x / 7 / 2);
}

// aux bank from $0000
// main bank from $2000
// 0..6, 14..20, ... -> aux bank
// 7..13, 21..27, ... -> main bank
function bankOffset(x) {
  return (x / 7) & 1 ? MAIN_OFFSET : AUX_OFFSET;
}

function pixelBitMask(x) {
  return 1 << (x % 7);
}

function setMonoPixel(fb, x, y, color) {
  const offset = pixelOffsetMono(x, y) + bankOffset(x);
  const mask = pixelBitMask(x);
  if (color) {
    fb[offset] |= mask;
  } else {
    fb[offset] &= ~mask;
  }
}

function getMonoPixel(fb, x, y) {
  const offset = pixelOffsetMono(x, y) + bankOffset(x);
  const mask = pixelBitMask(x);
  return fb[offset] & mask ? 1 : 0;
}

export const dhgrColor = {
  name: 'Color',
  width: 140,
  height: 192,
  scaleX: 2,
  palette: DHGR_COLORS,
  setPixel: setColorPixel,
  getPixel: getColorPixel,
};

const monoView = {
  width: 560,
  height: 192,
  scaleY: 2,
  setPixel: setMonoPixel,
  getPixel: getMonoPixel,
};

export const dhgrMono = {
  name: 'Mono',
  palette: DHGR_MONO_COLORS,
  ...monoView,
};

export const dhgrGreen = {
  name: 'Green',
  palette: DHGR_GREEN_COLORS,
  ...monoView,
};

export const dhgrAmber = {
  name: 'Amber',
  palette: DHGR_AMBER_COLORS,
  ...monoView,
};

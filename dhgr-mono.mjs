import { HGR_OFFSET } from './hgr-color.mjs';

export const COLORS = [
  0x000000, // black
  0xffffff, // white
];

// DHGR memory layout:
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

// 0..559 -> 0..39
function pixelOffset(x, y) {
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

export function setPixel(fb, x, y, color) {
  const offset = pixelOffset(x, y) + bankOffset(x);
  const mask = pixelBitMask(x);
  if (color) {
    fb[offset] |= mask;
  } else {
    fb[offset] &= ~mask;
  }
}

export function getPixel(fb, x, y) {
  const offset = pixelOffset(x, y) + bankOffset(x);
  const mask = pixelBitMask(x);
  return fb[offset] & mask ? 1 : 0;
}

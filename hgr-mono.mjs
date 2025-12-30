import { HGR_OFFSET } from './hgr-color.mjs';

export const COLORS = [
  0x000000, // black
  0xffffff, // white
];

// HGR memory layout:
//
// 40 bytes per row, 7 mono-pixels per byte, total 280 mono-pixels per row.
// all MSB(bit7)s are not used(in real machine, it makes half dot shift but ignored here).
//
// |addr  |$2000   |$2001   |...|$2027   |
// |------|--------|--------|---|--------|
// |offset|0       |1       |...|39      |
// |bit   |76543210|76543210|...|76543210|
// |x     |P   0..6|P  7..13|...|273..279|

export function init() {
  return new Uint8Array(0x2000);
}

// 0..279 -> 0..39
function pixelOffset(x, y) {
  return HGR_OFFSET[y] + Math.floor(x / 7);
}

function pixelBitMask(x) {
  return 1 << (x % 7);
}

export function setPixel(fb, x, y, color) {
  const offset = pixelOffset(x, y);
  const mask = pixelBitMask(x);
  if (color & 1) {
    fb[offset] |= mask;
  } else {
    fb[offset] &= ~mask;
  }
}

export function getPixel(fb, x, y) {
  const offset = pixelOffset(x, y);
  const mask = pixelBitMask(x);
  return fb[offset] & mask ? 1 : 0;
}

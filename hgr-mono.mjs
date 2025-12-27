import { HGR_OFFSET } from './hgr-color.mjs';

export const COLORS = ['#000000', '#FFFFFF'];

// all MSB(bit7)s are not used
// (in real machine, it makes half dot shift but ignored here)
//
// |addr  |$2000   |$2001   |...|$2027   |
// |------|--------|--------|---|--------|
// |offset|0       |1       |...|39      |
// |bit   |76543210|76543210|...|76543210|
// |x     |    0..6|   7..13|...|273..279|

let framebuffer;

export function init(buffer) {
  framebuffer = new Uint8Array(buffer);
}

export function toBuffer() {
  return new Uint8Buffer(framebuffer);
}

function pixelOffset(x, y) {
  return HGR_OFFSET[y] + Math.floor(x / 7);
}

function pixelBitMask(x) {
  return 1 << (x % 7);
}

export function setPixel(x, y, color) {
  const offset = pixelOffset(x, y);
  const mask = pixelBitMask(x);
  if (color) {
    framebuffer[offset] |= mask;
  } else {
    framebuffer[offset] &= ~mask;
  }
}

export function getPixel(x, y) {
  const offset = pixelOffset(x, y);
  const mask = pixelBitMask(x);
  return framebuffer[offset] & mask ? 1 : 0;
}

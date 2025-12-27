export { COLORS } from './hgr-mono.mjs';

import { HGR_OFFSET } from './hgr-color.mjs';

// all MSB(bit7)s are not used
//
// |bank   |AUX     |MAIN    |AUX     |MAIN    |...|AUX     |MAIN    |
// |address|$2000   |$2000   |$2001   |$2001   |...|$2027   |$2027   |
// |-------|--------|--------|--------|--------|---|--------|--------|
// |offset |0       |0       |1       |1       |...|39      |39      |
// |bit    |76543210|76543210|76543210|76543210|...|76543210|76543210|
// |x      |    0..6|   7..13|  14..20|  21..27|...|546..552|553..559|

export const framebuffer = new Uint8Array(0x2000 + 0x2000);

export function init(buffer) {
  framebuffer = new Uint8Array(buffer);
}

export function toBuffer() {
  return new Uint8Buffer(framebuffer);
}

const MAIN_OFFSET = 0x0000;
const AUX_OFFSET = 0x2000;

function pixelOffset(x, y) {
  return HGR_OFFSET[y] + Math.floor(x / 4);
}

function pixelBitMask(x) {
  return 1 << (x % 7);
}

export function setPixel(x, y, color) {
  const aux = (x / 7) & 1;
  const offset = pixelOffset(x, y) + (aux ? AUX_OFFSET : MAIN_OFFSET);
  const mask = pixelBitMask(x);
  if (color) {
    framebuffer[offset] |= mask;
  } else {
    framebuffer[offset] &= ~mask;
  }
}

export function getPixel(x, y) {
  const offset = pixelOffset(x, y) + (aux ? AUX_OFFSET : MAIN_OFFSET);
  const mask = pixelBitMask(x);
  return framebuffer[offset] & mask ? 1 : 0;
}

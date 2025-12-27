export { COLORS } from './gr.mjs';

import { TEXT_OFFSET } from './gr.mjs';

// ((color << 1) & 0x0f) | (color >> 3);
export const MAIN_TO_AUX_COLORS = [
  0x0, 0x8, 0x1, 0x9, 0x2, 0xa, 0x3, 0xb,
  0x4, 0xc, 0x5, 0xd, 0x6, 0xe, 0x7, 0xf,
];

// ((color & 1) << 3) | (value >> 1);
export const AUX_TO_MAIN_COLORS = [
  0x0, 0x2, 0x4, 0x6, 0x8, 0xa, 0xc, 0xe,
  0x1, 0x3, 0x5, 0x7, 0x9, 0xb, 0xd, 0xf,
];

let main;
let aux;

export function init(buffer) {
  main = new Uint8Array(buffer.slice(0, 0x400));
  aux = new Uint8Array(buffer.slice(0x400));
}

export function toBuffer() {
  const buffer = new Uint8Buffer();
  buffer.set(aux);
  buffer.set(main);
  return buffer;
}

// y: 0..48 -> 0..23
// x: 0..79 -> 0..39
function pixelOffset(x, y) {
  return TEXT_OFFSET[y >> 1] + (x >> 1);
}

export function getPixel(x, y) {
  const offset = pixelOffset(x, y);
  const bank = x & 1 ? aux : main;
  const byte = bank[offset];
  const color = y & 1 ? (byte >> 4) & 0x0f : (byte & 0x0f);
  return x & 1 ? color : AUX_TO_MAIN_COLORS[color];
}

export function setPixel(x, y, color) {
  const offset = pixelOffset(x, y);
  const bank = x & 1 ? main : aux;
  const byte = bank[offset];
  const stored = x & 1 ? (color & 0x0f) : MAIN_TO_AUX_COLORS[color & 0x0f];
  if (y & 1) {
    bank[offset] = (byte & 0x0f) | (stored << 4);
  } else {
    bank[offset] = (byte & 0xf0) | stored;
  }
}

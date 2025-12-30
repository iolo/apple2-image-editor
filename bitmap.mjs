// Bitmap format:
//
// just a continuous bit stream.
// no byte alignment; no per-row padding.
//
// size = Math.ceil((width * height) / 8)
//
// ex. 4x6 bitmap = 4 * 6 = 24 bits = 3 bytes
// ex. 3x5 bitmap = 3 * 5 = 15 bits = 2 bytes (1 bit unused)

export const COLORS = [0x000000, 0xffffff];

let fbWidth;
let fbHeight;

export function init(width, height) {
  fbWidth = width;
  fbHeight = height;
  console.log(`Initialized bitmap framebuffer: ${width}x${height}`);
  return new Uint8Array(Math.ceil((width * height) / 8));
}

export function setPixel(fb, x, y, color) {
  const index = y * fbWidth + x;
  const offset = index >> 3;
  const mask = 1 << (index & 7);
  if (color) {
    fb[offset] |= mask;
  } else {
    fb[offset] &= ~mask;
  }
}

export function getPixel(fb, x, y) {
  const index = y * fbWidth + x;
  const offset = index >> 3;
  const mask = 1 << (index & 7);
  return fb[offset] & mask ? 1 : 0;
}

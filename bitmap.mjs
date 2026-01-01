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

// ex.
// 000111000
// 001000100
// 010000010
// 100000001
// 100000001
// 100000001
// 010000010
// 001000100
// 000111000
// -> 000111000 001000100 010000010 100000001 100000001 100000001 010000010 001000100 000111000
// -> 00011100 00010001 00010000 01010000 00011000 00001100 00000101 00000100 01000100 00011100 0
// -> 0x1C, 0x11, 0x10, 0x50, 0x18, 0x0C, 0x05, 0x04, 0x44, 0x1C, 0x00
// w=9,h=9
// x=3,y=0 -> index=3 -> byte 0, bit 4 -> bitmask 0x10
export function setPixel(fb, x, y, color) {
  const index = y * fbWidth + x;
  const offset = index >> 3;
  const mask = 1 << (7 - (index % 8));
  //const mask = 1 << (index & 7);
  if (color) {
    fb[offset] |= mask;
  } else {
    fb[offset] &= ~mask;
  }
}

export function getPixel(fb, x, y) {
  const index = y * fbWidth + x;
  const offset = index >> 3;
  const mask = 1 << (7 - (index % 8));
  //const mask = 1 << (index & 7);
  return fb[offset] & mask ? 1 : 0;
}

export const bitmapView = {
  name: 'Mono',
  palette: COLORS,
  setPixel,
  getPixel,
};

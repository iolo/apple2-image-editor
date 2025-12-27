export const COLORS = ['#000000', '#FFFFFF'];

let framebuffer;
let framebuffer_width;
let framebuffer_height;

export function init(width, height) {
  framebuffer = new Uint8ClampedArray((width * height) / 8);
  framebuffer_width = width;
  framebuffer_height = height;
}

export function toBuffer() {
  return new Uint8Array(framebuffer);
}

function pixelOffset(x, y) {
  return y * framebuffer_width + (x >> 8);
}

function pixelBitMask(x) {
  return 1 << (x & 7);
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

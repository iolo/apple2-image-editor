export const COLORS = [
  '#000000',
  '#111111',
  '#222222',
  '#333333',
  '#444444',
  '#555555',
  '#666666',
  '#777777',
  '#888888',
  '#999999',
  '#AAAAAA',
  '#BBBBBB',
  '#CCCCCC',
  '#DDDDDD',
  '#EEEEEE',
  '#FFFFFF',
];

export function init(width, height) {
  framebuffer = new Uint8ClampedArray(width * height);
  framebuffer_width = width;
  framebuffer_height = height;
}

export function toBuffer() {
  return new Uint8Array(framebuffer);
}

export function setPixel(x, y, color) {
  framebuffer[y * framebuffer_width + x] = color;
}

export function getPixel(x, y) {
  return framebuffer[y * framebuffer_width + x];
}

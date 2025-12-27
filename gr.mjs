
export const COLORS = [
  '#000000', '#DD0033', '#0000AA', '#DD00CC',
  '#006600', '#777777', '#0000FF', '#33CCFF',
  '#885500', '#FF6600', '#AAAAAA', '#FF9999',
  '#00AA00', '#FFFF00', '#00FF00', '#FFFFFF',
];

export const TEXT_OFFSET = [
	0x0000,0x0080,0x0100,0x0180,0x0200,0x0280,0x0300,0x0380,
	0x0028,0x00A8,0x0128,0x01A8,0x0228,0x02A8,0x0328,0x03A8,
	0x0050,0x00D0,0x0150,0x01D0,0x0250,0x02D0,0x0350,0x03D0,
];

let framebuffer;

export function init(buffer) {
  framebuffer = new Uint8Array(buffer);
}

export function toBuffer() {
  return new Uint8Buffer(framebuffer);
}

function pixelOffset(x, y) {
  return TEXT_OFFSET[y >> 1] + x;
}

export function getPixel(x, y) {
  const offset = pixelOffset(x, y);
  const byte = framebuffer[offset];
  if (y & 1) {
    // odd row -> high nibble
    return (byte >> 4) & 0x0f;
  }
  // even row -> low nibble
  return byte & 0x0f;
}

export function setPixel(x, y, color) {
  const offset = pixelOffset(x, y);
  const byte = framebuffer[offset];
  if (y & 1) {
    framebuffer[offset] = (byte & 0x0f) | ((color & 0x0f) << 4);
  } else {
    framebuffer[offset] = (byte & 0xf0) | (color & 0x0f);
  }
}

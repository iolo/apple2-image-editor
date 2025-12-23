export const bitmapHandler = {
  create({ width, height }) {
    const size = Math.ceil((width * height) / 8);
    return { bits: new Uint8Array(size), width, height };
  },
  clone(data) {
    return { bits: new Uint8Array(data.bits), width: data.width, height: data.height };
  },
  getPixel(data, x, y) {
    const idx = y * data.width + x;
    const byte = data.bits[idx >> 3];
    const mask = 1 << (idx & 7);
    return (byte & mask) ? 1 : 0;
  },
  setPixel(data, x, y, color) {
    const idx = y * data.width + x;
    const mask = 1 << (idx & 7);
    const offset = idx >> 3;
    if (color) {
      data.bits[offset] |= mask;
    } else {
      data.bits[offset] &= ~mask;
    }
  },
  toFile(data) {
    return new Uint8Array(data.bits);
  },
  fromFile(buffer, opts) {
    const expected = Math.ceil((opts.width * opts.height) / 8);
    if (buffer.byteLength !== expected) {
      throw new Error(`Expected ${expected} bytes for ${opts.width}x${opts.height} bitmap`);
    }
    return { bits: new Uint8Array(buffer), width: opts.width, height: opts.height };
  },
};

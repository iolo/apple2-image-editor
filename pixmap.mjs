export const pixmapHandler = {
  create({ width, height }) {
    return { pixels: new Uint8Array(width * height), width, height };
  },
  clone(data) {
    return { pixels: new Uint8Array(data.pixels), width: data.width, height: data.height };
  },
  getPixel(data, x, y) {
    return data.pixels[y * data.width + x];
  },
  setPixel(data, x, y, color) {
    data.pixels[y * data.width + x] = color & 0xff;
  },
  toFile(data) {
    return new Uint8Array(data.pixels);
  },
  fromFile(buffer, opts) {
    const expected = opts.width * opts.height;
    if (buffer.byteLength !== expected) {
      throw new Error(`Expected ${expected} bytes for ${opts.width}x${opts.height} pixmap`);
    }
    return { pixels: new Uint8Array(buffer), width: opts.width, height: opts.height };
  },
};

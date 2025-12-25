import { paletteToIndexMap, paletteToRGBA, rgbaToKey } from "./common.mjs";

const getPixel = (data, x, y) => {
  const idx = y * data.width + x;
  const byte = data.bits[idx >> 3];
  const mask = 1 << (idx & 7);
  return (byte & mask) ? 1 : 0;
};

const setPixel = (data, x, y, color) => {
  const idx = y * data.width + x;
  const mask = 1 << (idx & 7);
  const offset = idx >> 3;
  if (color) {
    data.bits[offset] |= mask;
  } else {
    data.bits[offset] &= ~mask;
  }
};

export const bitmapHandler = {
  create({ width, height }) {
    const size = Math.ceil((width * height) / 8);
    return { bits: new Uint8Array(size), width, height };
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
  decode(buffer, opts) {
    const data = bitmapHandler.fromFile(buffer, opts);
    const palette = paletteToRGBA(opts.palette);
    const pixels = new Uint8ClampedArray(opts.width * opts.height * 4);
    for (let y = 0; y < opts.height; y += 1) {
      for (let x = 0; x < opts.width; x += 1) {
        const index = getPixel(data, x, y) % palette.length;
        const rgba = palette[index] || [0, 0, 0, 255];
        const offset = (y * opts.width + x) * 4;
        pixels[offset] = rgba[0];
        pixels[offset + 1] = rgba[1];
        pixels[offset + 2] = rgba[2];
        pixels[offset + 3] = rgba[3];
      }
    }
    return pixels;
  },
  encode(pixels, opts) {
    const expected = opts.width * opts.height * 4;
    if (pixels.length !== expected) {
      throw new Error(`Expected ${expected} bytes for ${opts.width}x${opts.height} RGBA buffer`);
    }
    const map = paletteToIndexMap(opts.palette);
    const data = bitmapHandler.create({ width: opts.width, height: opts.height });
    for (let y = 0; y < opts.height; y += 1) {
      for (let x = 0; x < opts.width; x += 1) {
        const offset = (y * opts.width + x) * 4;
        const key = rgbaToKey(
          pixels[offset],
          pixels[offset + 1],
          pixels[offset + 2],
          pixels[offset + 3],
        );
        const index = map.get(key);
        if (index === undefined) {
          throw new Error(`Pixel at ${x},${y} is not in palette`);
        }
        setPixel(data, x, y, index);
      }
    }
    return bitmapHandler.toFile(data);
  },
};

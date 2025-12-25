import { paletteToIndexMap, paletteToRGBA, rgbaToKey } from "./common.mjs";

const getPixel = (data, x, y) => data.pixels[y * data.width + x];

const setPixel = (data, x, y, color) => {
  data.pixels[y * data.width + x] = color & 0xff;
};

export const pixmapHandler = {
  create({ width, height }) {
    return { pixels: new Uint8Array(width * height), width, height };
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
  decode(buffer, opts) {
    const data = pixmapHandler.fromFile(buffer, opts);
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
    const data = pixmapHandler.create({ width: opts.width, height: opts.height });
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
    return pixmapHandler.toFile(data);
  },
};

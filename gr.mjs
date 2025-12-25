import { grAddress, paletteToIndexMap, paletteToRGBA, rgbaToKey } from "./common.mjs";

const getPixel = (data, x, y) => {
  const row24 = y >> 1;
  const offset = grAddress(x, row24);
  const value = data.memory[offset] || 0;
  return (y & 1) ? (value >> 4) & 0x0f : value & 0x0f;
};

const setPixel = (data, x, y, color) => {
  const row24 = y >> 1;
  const offset = grAddress(x, row24);
  const original = data.memory[offset] || 0;
  if (y & 1) {
    data.memory[offset] = (original & 0x0f) | ((color & 0x0f) << 4);
  } else {
    data.memory[offset] = (original & 0xf0) | (color & 0x0f);
  }
};

export const grHandler = {
  create({ width, height }) {
    return { memory: new Uint8Array(0x400), width, height };
  },
  toFile(data) {
    const out = new Uint8Array(0x400);
    out.set(data.memory.slice(0, 0x400));
    return out;
  },
  fromFile(buffer, opts) {
    if (buffer.byteLength !== 0x400) throw new Error("Expected 0x400 bytes for .GR");
    return { memory: new Uint8Array(buffer), width: opts.width, height: opts.height };
  },
  decode(buffer, opts) {
    const data = grHandler.fromFile(buffer, opts);
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
    const data = grHandler.create({ width: opts.width, height: opts.height });
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
    return grHandler.toFile(data);
  },
};

import { grAddress, paletteToIndexMap, paletteToRGBA, rgbaToKey } from "./common.mjs";

const auxColorDecode = (value) => ((value & 1) << 3) | (value >> 1);
const auxColorEncode = (value) => ((value << 1) & 0x0f) | (value >> 3);

const getPixel = (data, x, y) => {
  const bank = (x & 1) ? data.aux : data.main;
  const column = x >> 1;
  const row24 = y >> 1;
  const offset = grAddress(column, row24);
  const byte = bank[offset] || 0;
  const color = (y & 1) ? (byte >> 4) & 0x0f : byte & 0x0f;
  return (x & 1) ? auxColorDecode(color) : color;
};

const setPixel = (data, x, y, color) => {
  const bank = (x & 1) ? data.aux : data.main;
  const column = x >> 1;
  const row24 = y >> 1;
  const offset = grAddress(column, row24);
  const original = bank[offset] || 0;
  const stored = (x & 1) ? auxColorEncode(color & 0x0f) : (color & 0x0f);
  if (y & 1) {
    bank[offset] = (original & 0x0f) | (stored << 4);
  } else {
    bank[offset] = (original & 0xf0) | stored;
  }
};

export const dgrHandler = {
  create({ width, height }) {
    return {
      main: new Uint8Array(0x400),
      aux: new Uint8Array(0x400),
      width,
      height,
    };
  },
  toFile(data) {
    const out = new Uint8Array(0x800);
    out.set(data.main.slice(0, 0x400));
    out.set(data.aux.slice(0, 0x400), 0x400);
    return out;
  },
  fromFile(buffer, opts) {
    if (buffer.byteLength !== 0x800) throw new Error("Expected 0x800 bytes for .DGR");
    return {
      main: new Uint8Array(buffer.slice(0, 0x400)),
      aux: new Uint8Array(buffer.slice(0x400)),
      width: opts.width,
      height: opts.height,
    };
  },
  decode(buffer, opts) {
    const data = dgrHandler.fromFile(buffer, opts);
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
    const data = dgrHandler.create({ width: opts.width, height: opts.height });
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
    return dgrHandler.toFile(data);
  },
};

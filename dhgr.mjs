import { hgrAddress, paletteToIndexMap, paletteToRGBA, rgbaToKey } from "./common.mjs";

export const dhgrHandler = {
  create({ width, height }) {
    return {
      main: new Uint8Array(0x2000),
      aux: new Uint8Array(0x2000),
      width,
      height,
    };
  },
  toFile(data) {
    const out = new Uint8Array(0x4000);
    out.set(data.main.slice(0, 0x2000));
    out.set(data.aux.slice(0, 0x2000), 0x2000);
    return out;
  },
  fromFile(buffer, opts) {
    if (buffer.byteLength !== 0x4000) throw new Error("Expected 0x4000 bytes for .DHGR");
    return {
      main: new Uint8Array(buffer.slice(0, 0x2000)),
      aux: new Uint8Array(buffer.slice(0x2000)),
      width: opts.width,
      height: opts.height,
    };
  },
};

const dhgrBitAt = (data, x, y) => {
  if (x < 0 || x >= data.width || y < 0 || y >= data.height) return 0;
  const column = x >> 1;
  const offset = hgrAddress(column, y);
  const mask = 1 << (column % 7);
  const bank = (x & 1) ? data.main : data.aux;
  const byte = bank[offset] || 0;
  return (byte & mask) ? 1 : 0;
};

const dhgrNibbleAt = (data, x, y) => {
  const baseX = x * 4;
  if (baseX < 0 || baseX + 3 >= data.width) return 0;
  const b0 = dhgrBitAt(data, baseX, y);
  const b1 = dhgrBitAt(data, baseX + 1, y);
  const b2 = dhgrBitAt(data, baseX + 2, y);
  const b3 = dhgrBitAt(data, baseX + 3, y);
  return (b0 ? 1 : 0) | (b1 ? 2 : 0) | (b2 ? 4 : 0) | (b3 ? 8 : 0);
};

const setDhgrBitAt = (data, x, y, on) => {
  if (x < 0 || x >= data.width || y < 0 || y >= data.height) return;
  const column = x >> 1;
  const offset = hgrAddress(column, y);
  const mask = 1 << (column % 7);
  const bank = (x & 1) ? data.main : data.aux;
  const byte = bank[offset] || 0;
  bank[offset] = on ? (byte | mask) : (byte & ~mask);
};

const getColorPixel = (data, x, y) => dhgrNibbleAt(data, x, y);

const setColorPixel = (data, x, y, color) => {
  const baseX = x * 4;
  const value = color & 0x0f;
  setDhgrBitAt(data, baseX, y, (value & 0x01) !== 0);
  setDhgrBitAt(data, baseX + 1, y, (value & 0x02) !== 0);
  setDhgrBitAt(data, baseX + 2, y, (value & 0x04) !== 0);
  setDhgrBitAt(data, baseX + 3, y, (value & 0x08) !== 0);
};

const getMonoPixel = (data, x, y) => dhgrBitAt(data, x, y);

const setMonoPixel = (data, x, y, color) => {
  setDhgrBitAt(data, x, y, color !== 0);
};

export const dhgrColorHandler = {
  create() {
    return dhgrHandler.create({ width: 560, height: 192 });
  },
  toFile(data) {
    return dhgrHandler.toFile(data);
  },
  fromFile(buffer, opts) {
    if (buffer.byteLength !== 0x4000) throw new Error("Expected 0x4000 bytes for .DHGR");
    return {
      main: new Uint8Array(buffer.slice(0, 0x2000)),
      aux: new Uint8Array(buffer.slice(0x2000)),
      width: 560,
      height: 192,
    };
  },
  decode(buffer, opts) {
    const data = dhgrColorHandler.fromFile(buffer, opts);
    const palette = paletteToRGBA(opts.palette);
    const pixels = new Uint8ClampedArray(opts.width * opts.height * 4);
    for (let y = 0; y < opts.height; y += 1) {
      for (let x = 0; x < opts.width; x += 1) {
        const index = getColorPixel(data, x, y) % palette.length;
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
    const data = dhgrColorHandler.create();
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
        setColorPixel(data, x, y, index);
      }
    }
    return dhgrColorHandler.toFile(data);
  },
};

export const dhgrMonoHandler = {
  create() {
    return dhgrHandler.create({ width: 560, height: 192 });
  },
  toFile(data) {
    return dhgrHandler.toFile(data);
  },
  fromFile(buffer, opts) {
    if (buffer.byteLength !== 0x4000) throw new Error("Expected 0x4000 bytes for .DHGR");
    return {
      main: new Uint8Array(buffer.slice(0, 0x2000)),
      aux: new Uint8Array(buffer.slice(0x2000)),
      width: 560,
      height: 192,
    };
  },
  decode(buffer, opts) {
    const data = dhgrMonoHandler.fromFile(buffer, opts);
    const palette = paletteToRGBA(opts.palette);
    const pixels = new Uint8ClampedArray(opts.width * opts.height * 4);
    for (let y = 0; y < opts.height; y += 1) {
      for (let x = 0; x < opts.width; x += 1) {
        const index = getMonoPixel(data, x, y) % palette.length;
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
    const data = dhgrMonoHandler.create();
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
        setMonoPixel(data, x, y, index);
      }
    }
    return dhgrMonoHandler.toFile(data);
  },
};

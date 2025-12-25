import { hgrAddress, paletteToIndexMap, paletteToRGBA, rgbaToKey } from "./common.mjs";

const hgrColorFromBit = (phase, parity) => {
  if (phase === 0) {
    return parity ? 2 : 1; // green : purple
  }
  return parity ? 3 : 4; // orange : blue
};

const setHgrBit = (data, x, y, on) => {
  if (x < 0 || x >= data.width || y < 0 || y >= data.height) return;
  const offset = hgrAddress(x, y);
  const mask = 1 << (x % 7);
  const byte = data.memory[offset] || 0;
  data.memory[offset] = on ? (byte | mask) : (byte & ~mask);
};

const setHgrPhase = (data, x, y, phase) => {
  if (x < 0 || x >= data.width || y < 0 || y >= data.height) return;
  const offset = hgrAddress(x, y);
  const byte = data.memory[offset] || 0;
  data.memory[offset] = phase ? (byte | 0x80) : (byte & 0x7f);
};

const getHgrBit = (data, x, y) => {
  if (x < 0 || x >= data.width || y < 0 || y >= data.height) return 0;
  const offset = hgrAddress(x, y);
  const mask = 1 << (x % 7);
  return (data.memory[offset] & mask) ? 1 : 0;
};

export const hgrHandler = {
  create({ width, height }) {
    return { memory: new Uint8Array(0x2000), width, height };
  },
  toFile(data) {
    const out = new Uint8Array(0x2000);
    out.set(data.memory.slice(0, 0x2000));
    return out;
  },
  fromFile(buffer, opts) {
    if (buffer.byteLength !== 0x2000) throw new Error("Expected 0x2000 bytes for .HGR");
    return { memory: new Uint8Array(buffer), width: opts.width, height: opts.height };
  },
};

const getMonoPixel = (data, x, y) => (getHgrBit(data, x, y) ? 1 : 0);

const setMonoPixel = (data, x, y, color) => {
  setHgrBit(data, x, y, color !== 0);
};

const getColorPixel = (data, x, y) => {
  const baseX = x * 2;
  if (baseX < 0 || baseX + 1 >= data.width || y < 0 || y >= data.height) return 0;
  const evenOn = getHgrBit(data, baseX, y);
  const oddOn = getHgrBit(data, baseX + 1, y);
  if (evenOn && oddOn) return 5;
  if (evenOn) {
    const offset = hgrAddress(baseX, y);
    const phase = (data.memory[offset] & 0x80) ? 1 : 0;
    return hgrColorFromBit(phase, 0);
  }
  if (oddOn) {
    const offset = hgrAddress(baseX + 1, y);
    const phase = (data.memory[offset] & 0x80) ? 1 : 0;
    return hgrColorFromBit(phase, 1);
  }
  return 0;
};

const setColorPixel = (data, x, y, color) => {
  const baseX = x * 2;
  const evenX = baseX;
  const oddX = baseX + 1;
  if (evenX < 0 || oddX >= data.width || y < 0 || y >= data.height) return;
  if (color === 0) {
    setHgrBit(data, evenX, y, false);
    setHgrBit(data, oddX, y, false);
    return;
  }
  if (color === 5) {
    setHgrBit(data, evenX, y, true);
    setHgrBit(data, oddX, y, true);
    return;
  }
  const useOdd = color === 2 || color === 3;
  const targetX = useOdd ? oddX : evenX;
  const phase = color === 3 || color === 4 ? 1 : 0;
  setHgrBit(data, evenX, y, false);
  setHgrBit(data, oddX, y, false);
  setHgrBit(data, targetX, y, true);
  setHgrPhase(data, targetX, y, phase);
};

export const hgrMonoHandler = {
  create() {
    return hgrHandler.create({ width: 280, height: 192 });
  },
  toFile(data) {
    return hgrHandler.toFile(data);
  },
  fromFile(buffer) {
    return hgrHandler.fromFile(buffer, { width: 280, height: 192 });
  },
  decode(buffer, opts) {
    const data = hgrMonoHandler.fromFile(buffer);
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
    const data = hgrMonoHandler.create();
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
    return hgrMonoHandler.toFile(data);
  },
};

export const hgrColorHandler = {
  create() {
    return hgrHandler.create({ width: 280, height: 192 });
  },
  toFile(data) {
    return hgrHandler.toFile(data);
  },
  fromFile(buffer) {
    return hgrHandler.fromFile(buffer, { width: 280, height: 192 });
  },
  decode(buffer, opts) {
    const data = hgrColorHandler.fromFile(buffer);
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
    const data = hgrColorHandler.create();
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
    return hgrColorHandler.toFile(data);
  },
};

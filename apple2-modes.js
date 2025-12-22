export const paletteLores = [
  "#000000", "#DD0033", "#0000AA", "#DD00CC",
  "#006600", "#777777", "#0000FF", "#33CCFF",
  "#885500", "#FF6600", "#AAAAAA", "#FF9999",
  "#00AA00", "#FFFF00", "#00FF00", "#FFFFFF",
];

export const paletteHgr = [
  "#000000", "#B000F0", "#00C000", "#FF9900", "#0088FF", "#FFFFFF",
];

export const paletteBitmap = ["#000000", "#FFFFFF"];

export const modes = {
  lores: { id: "lores", name: "Lo-Res", width: 40, height: 48, ext: "GR", palette: paletteLores },
  dlores: { id: "dlores", name: "Double Lo-Res", width: 80, height: 48, ext: "DGR", palette: paletteLores },
  hgr: { id: "hgr", name: "Hi-Res", width: 280, height: 192, ext: "HGR", palette: paletteHgr },
  dhgr: { id: "dhgr", name: "Double Hi-Res", width: 560, height: 192, ext: "DHGR", palette: paletteLores },
  pixmap: { id: "pixmap", name: "Pixmap", ext: "PIXMAP", palette: null },
  bitmap: { id: "bitmap", name: "Bitmap", ext: "BITMAP", palette: paletteBitmap },
};

const sizeSignatures = {
  0x400: "lores",
  0x800: "dlores",
  0x2000: "hgr",
  0x4000: "dhgr",
};

const loresAddress = (x, row) => (row & 0x07) * 0x80 + (row >> 3) * 0x28 + x;

const hgrAddress = (x, y) => {
  const byteX = Math.floor(x / 7);
  return (y & 0x07) * 0x400 + (y >> 3) * 0x80 + byteX;
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const colorStringToRGBA = (hex) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b, 255];
};

const colorDistanceSq = (c1, c2) => {
  const [r1, g1, b1] = c1;
  const [r2, g2, b2] = c2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
};

const paletteLoresRGB = paletteLores.map(colorStringToRGBA);

const dhgrColorFromBits = (mainBit, auxBit, mainPhase, auxPhase, xParity) => {
  const both = mainBit && auxBit;
  const none = !mainBit && !auxBit;
  if (none) return 0; // black
  if (both) {
    const idx = (xParity ? 1 : 0) | ((mainPhase || auxPhase) ? 2 : 0);
    return [10, 11, 14, 15][idx];
  }
  if (mainBit) {
    const idx = (xParity ? 1 : 0) | (mainPhase ? 2 : 0);
    return [3, 12, 9, 6][idx]; // purple/green/orange/blue
  }
  const idx = (xParity ? 1 : 0) | (auxPhase ? 2 : 0);
  return [1, 4, 8, 7][idx]; // red/dark green/brown/light blue
};

export const modeHandlers = {
  lores: {
    create({ width, height }) {
      return { memory: new Uint8Array(0x400), width, height };
    },
    clone(data) {
      return { memory: new Uint8Array(data.memory), width: data.width, height: data.height };
    },
    getPixel(data, x, y) {
      const row24 = y >> 1;
      const offset = loresAddress(x, row24);
      const value = data.memory[offset] || 0;
      return (y & 1) ? (value >> 4) & 0x0f : value & 0x0f;
    },
    setPixel(data, x, y, color) {
      const row24 = y >> 1;
      const offset = loresAddress(x, row24);
      const original = data.memory[offset] || 0;
      if (y & 1) {
        data.memory[offset] = (original & 0x0f) | ((color & 0x0f) << 4);
      } else {
        data.memory[offset] = (original & 0xf0) | (color & 0x0f);
      }
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
  },
  dlores: {
    create({ width, height }) {
      return {
        main: new Uint8Array(0x400),
        aux: new Uint8Array(0x400),
        width,
        height,
      };
    },
    clone(data) {
      return {
        main: new Uint8Array(data.main),
        aux: new Uint8Array(data.aux),
        width: data.width,
        height: data.height,
      };
    },
    getPixel(data, x, y) {
      const bank = (x & 1) ? data.aux : data.main;
      const column = x >> 1;
      const row24 = y >> 1;
      const offset = loresAddress(column, row24);
      const byte = bank[offset] || 0;
      return (y & 1) ? (byte >> 4) & 0x0f : byte & 0x0f;
    },
    setPixel(data, x, y, color) {
      const bank = (x & 1) ? data.aux : data.main;
      const column = x >> 1;
      const row24 = y >> 1;
      const offset = loresAddress(column, row24);
      const original = bank[offset] || 0;
      if (y & 1) {
        bank[offset] = (original & 0x0f) | ((color & 0x0f) << 4);
      } else {
        bank[offset] = (original & 0xf0) | (color & 0x0f);
      }
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
  },
  hgr: {
    create({ width, height }) {
      return { memory: new Uint8Array(0x2000), width, height };
    },
    clone(data) {
      return { memory: new Uint8Array(data.memory), width: data.width, height: data.height };
    },
    bitAt(data, x, y) {
      if (x < 0 || x >= data.width || y < 0 || y >= data.height) return 0;
      const offset = hgrAddress(x, y);
      const mask = 1 << (x % 7);
      return (data.memory[offset] & mask) ? 1 : 0;
    },
    getPixel(data, x, y) {
      const offset = hgrAddress(x, y);
      const byte = data.memory[offset] || 0;
      const mask = 1 << (x % 7);
      const on = byte & mask;
      if (!on) return 0;

      const left = this.bitAt(data, x - 1, y);
      const right = this.bitAt(data, x + 1, y);
      if (left || right) return 5; // white

      const phase = (byte & 0x80) ? 1 : 0;
      const even = (x & 1) === 0;
      if (phase === 0) {
        return even ? 2 : 1; // green : purple
      }
      return even ? 3 : 4; // orange : blue
    },
    setPixel(data, x, y, color) {
      const offset = hgrAddress(x, y);
      const mask = 1 << (x % 7);
      const byte = data.memory[offset] || 0;
      if (color === 0) {
        data.memory[offset] = byte & ~mask;
        return;
      }

      let nextByte = byte | mask;
      if (color === 5) {
        // white: set bit and neighbor to force a double width
        data.memory[offset] = nextByte | 0x80;
        if (x + 1 < data.width) {
          const neighborOffset = hgrAddress(x + 1, y);
          const neighborMask = 1 << ((x + 1) % 7);
          data.memory[neighborOffset] = (data.memory[neighborOffset] || 0) | neighborMask | 0x80;
        }
        return;
      }

      const wantsPhase = (color === 3 || color === 4) ? 1 : 0;
      nextByte = wantsPhase ? (nextByte | 0x80) : (nextByte & 0x7f);

      // clear neighbors to avoid accidental white blends
      const clearNeighbor = (nx) => {
        if (nx < 0 || nx >= data.width) return;
        const no = hgrAddress(nx, y);
        const nm = 1 << (nx % 7);
        data.memory[no] = (data.memory[no] || 0) & ~nm;
      };
      clearNeighbor(x - 1);
      clearNeighbor(x + 1);

      data.memory[offset] = nextByte;
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
  },
  dhgr: {
    create({ width, height }) {
      return {
        main: new Uint8Array(0x2000),
        aux: new Uint8Array(0x2000),
        width,
        height,
      };
    },
    clone(data) {
      return {
        main: new Uint8Array(data.main),
        aux: new Uint8Array(data.aux),
        width: data.width,
        height: data.height,
      };
    },
    getPixel(data, x, y) {
      const offset = hgrAddress(x, y);
      const mask = 1 << (x % 7);
      const mainByte = data.main[offset] || 0;
      const auxByte = data.aux[offset] || 0;
      const mainBit = (mainByte & mask) ? 1 : 0;
      const auxBit = (auxByte & mask) ? 1 : 0;
      const mainPhase = (mainByte & 0x80) ? 1 : 0;
      const auxPhase = (auxByte & 0x80) ? 1 : 0;
      const parity = x & 1;
      return dhgrColorFromBits(mainBit, auxBit, mainPhase, auxPhase, parity);
    },
    setPixel(data, x, y, color) {
      const palette = paletteLores;
      const targetColor = palette[color % palette.length] || palette[0];
      const targetRGB = colorStringToRGBA(targetColor);
      const parity = x & 1;
      let best = null;
      for (let mainBit = 0; mainBit <= 1; mainBit += 1) {
        for (let auxBit = 0; auxBit <= 1; auxBit += 1) {
          for (let mainPhase = 0; mainPhase <= 1; mainPhase += 1) {
            for (let auxPhase = 0; auxPhase <= 1; auxPhase += 1) {
              const cIdx = dhgrColorFromBits(mainBit, auxBit, mainPhase, auxPhase, parity);
              const candRGB = paletteLoresRGB[cIdx];
              const dist = colorDistanceSq(targetRGB, candRGB);
              if (!best || dist < best.dist) {
                best = { dist, mainBit, auxBit, mainPhase, auxPhase };
              }
            }
          }
        }
      }
      const offset = hgrAddress(x, y);
      const mask = 1 << (x % 7);
      const mainByte = data.main[offset] || 0;
      const auxByte = data.aux[offset] || 0;
      data.main[offset] = (mainByte & ~mask) | (best.mainBit ? mask : 0);
      data.aux[offset] = (auxByte & ~mask) | (best.auxBit ? mask : 0);
      data.main[offset] = best.mainPhase ? (data.main[offset] | 0x80) : (data.main[offset] & 0x7f);
      data.aux[offset] = best.auxPhase ? (data.aux[offset] | 0x80) : (data.aux[offset] & 0x7f);
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
  },
  pixmap: {
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
  },
  bitmap: {
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
  },
};

export const paletteForMode = (mode) => {
  if (mode.palette) return mode.palette;
  if (mode.id === "pixmap") {
    return Array.from({ length: 16 }, (_, i) => `hsl(${(i * 23) % 360}deg 80% 60%)`);
  }
  return paletteBitmap;
};

const bestSquareFactors = (n) => {
  if (!n || n < 1) return { width: 64, height: 64, gap: 0 };
  let best = { width: n, height: 1, gap: n - 1 };
  for (let w = 1; w * w <= n; w += 1) {
    if (n % w !== 0) continue;
    const h = n / w;
    const gap = Math.abs(w - h);
    if (gap < best.gap) best = { width: w, height: h, gap };
  }
  return best;
};

export const inferDimensions = (byteLength, modeId) => {
  if (modeId === "bitmap") {
    const pixels = byteLength * 8;
    return bestSquareFactors(pixels);
  }
  const pixels = byteLength;
  return bestSquareFactors(pixels);
};

export const detectModeFromFile = (name, size) => {
  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.substring(lower.lastIndexOf(".") + 1) : "";
  const extMode = Object.values(modes).find((m) => m.ext.toLowerCase() === ext);
  const sizeModeId = sizeSignatures[size];
  const sizeMode = sizeModeId ? modes[sizeModeId] : null;

  if (extMode && sizeMode && extMode.id !== sizeMode.id) {
    throw new Error(`File extension .${extMode.ext.toLowerCase()} implies ${extMode.name}, but size 0x${size.toString(16)} implies ${sizeMode.name}`);
  }

  if (sizeMode) return sizeMode;
  if (extMode) return extMode;
  throw new Error(`Unsupported file: size 0x${size.toString(16)} (${size} bytes), extension ".${ext || "none"}"`);
};

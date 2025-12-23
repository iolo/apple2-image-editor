import { colorStringToRGBA, hgrAddress, paletteLores } from "./apple2-common.js";

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

export const dhgrHandler = {
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
};

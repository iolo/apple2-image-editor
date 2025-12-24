import { loresAddress } from "./apple2-common.mjs";

const auxColorDecode = (value) => ((value & 1) << 3) | (value >> 1);
const auxColorEncode = (value) => ((value << 1) & 0x0f) | (value >> 3);

export const dloresHandler = {
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
    const color = (y & 1) ? (byte >> 4) & 0x0f : byte & 0x0f;
    return (x & 1) ? auxColorDecode(color) : color;
  },
  setPixel(data, x, y, color) {
    const bank = (x & 1) ? data.aux : data.main;
    const column = x >> 1;
    const row24 = y >> 1;
    const offset = loresAddress(column, row24);
    const original = bank[offset] || 0;
    const stored = (x & 1) ? auxColorEncode(color & 0x0f) : (color & 0x0f);
    if (y & 1) {
      bank[offset] = (original & 0x0f) | (stored << 4);
    } else {
      bank[offset] = (original & 0xf0) | stored;
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
};

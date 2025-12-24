import { grAddress } from "./common.mjs";

export const grHandler = {
  create({ width, height }) {
    return { memory: new Uint8Array(0x400), width, height };
  },
  clone(data) {
    return { memory: new Uint8Array(data.memory), width: data.width, height: data.height };
  },
  getPixel(data, x, y) {
    const row24 = y >> 1;
    const offset = grAddress(x, row24);
    const value = data.memory[offset] || 0;
    return (y & 1) ? (value >> 4) & 0x0f : value & 0x0f;
  },
  setPixel(data, x, y, color) {
    const row24 = y >> 1;
    const offset = grAddress(x, row24);
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
};

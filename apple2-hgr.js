import { hgrAddress } from "./apple2-common.js";

export const hgrHandler = {
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
      return even ? 1 : 2; // purple : green
    }
    return even ? 4 : 3; // blue : orange
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
};

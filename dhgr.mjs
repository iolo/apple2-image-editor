import { hgrAddress } from "./common.mjs";

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

export const dhgrColorHandler = {
  create() {
    return dhgrHandler.create({ width: 560, height: 192 });
  },
  clone(data) {
    return dhgrHandler.clone(data);
  },
  getPixel(data, x, y) {
    return dhgrNibbleAt(data, x, y);
  },
  setPixel(data, x, y, color) {
    const baseX = x * 4;
    const value = color & 0x0f;
    setDhgrBitAt(data, baseX, y, (value & 0x01) !== 0);
    setDhgrBitAt(data, baseX + 1, y, (value & 0x02) !== 0);
    setDhgrBitAt(data, baseX + 2, y, (value & 0x04) !== 0);
    setDhgrBitAt(data, baseX + 3, y, (value & 0x08) !== 0);
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
};

export const dhgrMonoHandler = {
  create() {
    return dhgrHandler.create({ width: 560, height: 192 });
  },
  clone(data) {
    return dhgrHandler.clone(data);
  },
  getPixel(data, x, y) {
    return dhgrBitAt(data, x, y);
  },
  setPixel(data, x, y, color) {
    setDhgrBitAt(data, x, y, color !== 0);
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
};

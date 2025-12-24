import { hgrAddress } from "./common.mjs";

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
  clone(data) {
    return { memory: new Uint8Array(data.memory), width: data.width, height: data.height };
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

export const hgrMonoHandler = {
  create() {
    return hgrHandler.create({ width: 280, height: 192 });
  },
  clone(data) {
    return hgrHandler.clone(data);
  },
  getPixel(data, x, y) {
    return getHgrBit(data, x, y) ? 1 : 0;
  },
  setPixel(data, x, y, color) {
    setHgrBit(data, x, y, color !== 0);
  },
  toFile(data) {
    return hgrHandler.toFile(data);
  },
  fromFile(buffer) {
    if (buffer.byteLength !== 0x2000) throw new Error("Expected 0x2000 bytes for .HGR");
    return { memory: new Uint8Array(buffer), width: 280, height: 192 };
  },
};

export const hgrColorHandler = {
  create() {
    return hgrHandler.create({ width: 280, height: 192 });
  },
  clone(data) {
    return hgrHandler.clone(data);
  },
  getPixel(data, x, y) {
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
  },
  setPixel(data, x, y, color) {
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
  },
  toFile(data) {
    return hgrHandler.toFile(data);
  },
  fromFile(buffer) {
    if (buffer.byteLength !== 0x2000) throw new Error("Expected 0x2000 bytes for .HGR");
    return { memory: new Uint8Array(buffer), width: 280, height: 192 };
  },
};

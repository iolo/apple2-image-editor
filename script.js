const paletteLores = [
  "#000000", "#DD0033", "#0000AA", "#DD00CC",
  "#006600", "#777777", "#0000FF", "#33CCFF",
  "#885500", "#FF6600", "#AAAAAA", "#FF9999",
  "#00AA00", "#FFFF00", "#00FF00", "#FFFFFF",
];

const paletteHgr = [
  "#000000", "#B000F0", "#00C000", "#FF9900", "#0088FF", "#FFFFFF",
];

const paletteBitmap = ["#000000", "#FFFFFF"];

const modes = {
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

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const colorStringToRGBA = (hex) => {
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

const modeHandlers = {
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

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const scratch = document.createElement("canvas");
const scratchCtx = scratch.getContext("2d");
scratchCtx.imageSmoothingEnabled = false;

const elements = {
  newDialog: document.getElementById("newDialog"),
  newForm: document.getElementById("newForm"),
  modeSelect: document.getElementById("modeSelect"),
  widthInput: document.getElementById("widthInput"),
  heightInput: document.getElementById("heightInput"),
  settingsDialog: document.getElementById("settingsDialog"),
  aboutDialog: document.getElementById("aboutDialog"),
  prefGrid: document.getElementById("prefGrid"),
  prefZoom: document.getElementById("prefZoom"),
  fileInput: document.getElementById("fileInput"),
  fgPreview: document.getElementById("fgPreview"),
  bgPreview: document.getElementById("bgPreview"),
  paletteGrid: document.getElementById("paletteGrid"),
  paletteMeta: document.getElementById("paletteMeta"),
  modeInfo: document.getElementById("modeInfo"),
  zoomInfo: document.getElementById("zoomInfo"),
  cursorPos: document.getElementById("cursorPos"),
  dimensionDialog: document.getElementById("dimensionDialog"),
  dimensionForm: document.getElementById("dimensionForm"),
  dimWidth: document.getElementById("dimWidth"),
  dimHeight: document.getElementById("dimHeight"),
  toolButtons: document.getElementById("toolButtons"),
};

const state = {
  mode: modes.lores,
  data: null,
  width: modes.lores.width,
  height: modes.lores.height,
  fg: 1,
  bg: 0,
  zoom: 8,
  showGrid: true,
  caret: { x: 0, y: 0 },
  tool: "pencil",
  dragStart: null,
  dragColor: 1,
  undo: [],
  redo: [],
};

let pendingDimensionResolve = null;
let pendingDimensionReject = null;

const ensureDialog = (dialog) => {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    alert("Your browser does not support <dialog>.");
  }
};

const paletteForMode = (mode) => {
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

const inferDimensions = (byteLength, modeId) => {
  if (modeId === "bitmap") {
    const pixels = byteLength * 8;
    return bestSquareFactors(pixels);
  }
  const pixels = byteLength;
  return bestSquareFactors(pixels);
};

const detectModeFromFile = (name, size) => {
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

const setZoom = (value) => {
  state.zoom = clamp(value, 1, 24);
  render();
};

const updatePaletteGrid = () => {
  const palette = paletteForMode(state.mode);
  elements.paletteGrid.innerHTML = "";
  palette.forEach((color, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch-button";
    btn.style.background = color;
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = idx.toString(16).toUpperCase();
    btn.appendChild(label);
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      state.fg = idx;
      refreshColorPreview();
    });
    btn.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      state.bg = idx;
      refreshColorPreview();
    });
    elements.paletteGrid.appendChild(btn);
  });
  elements.paletteMeta.textContent = `${palette.length} colors`;
};

const refreshColorPreview = () => {
  const palette = paletteForMode(state.mode);
  elements.fgPreview.style.background = palette[state.fg % palette.length] || "#000";
  elements.bgPreview.style.background = palette[state.bg % palette.length] || "#000";
};

const setTool = (tool) => {
  state.tool = tool;
  if (elements.toolButtons) {
    elements.toolButtons.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    });
  }
  updateStatus();
};

const updateStatus = () => {
  elements.modeInfo.textContent = `${state.mode.name} ${state.width}x${state.height} (.${state.mode.ext})`;
  elements.zoomInfo.textContent = `Zoom ${state.zoom}x · ${state.tool}`;
  elements.cursorPos.textContent = `(${state.caret.x}, ${state.caret.y})`;
};

const pushUndo = () => {
  const handler = modeHandlers[state.mode.id];
  if (!handler || !handler.clone) return;
  state.undo.push(handler.clone(state.data));
  if (state.undo.length > 50) state.undo.shift();
  state.redo.length = 0;
};

const restoreData = (data) => {
  state.data = data;
  render();
};

const undo = () => {
  if (!state.undo.length) return;
  const handler = modeHandlers[state.mode.id];
  const snapshot = state.undo.pop();
  state.redo.push(handler.clone(state.data));
  restoreData(snapshot);
};

const redo = () => {
  if (!state.redo.length) return;
  const handler = modeHandlers[state.mode.id];
  const snapshot = state.redo.pop();
  state.undo.push(handler.clone(state.data));
  restoreData(snapshot);
};

const setPixel = (x, y, color) => {
  const handler = modeHandlers[state.mode.id];
  if (!handler) return;
  handler.setPixel(state.data, x, y, color);
};

const getPixel = (x, y) => {
  const handler = modeHandlers[state.mode.id];
  if (!handler) return 0;
  return handler.getPixel(state.data, x, y);
};

const applyDraw = (x, y, color) => {
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
  setPixel(x, y, color);
  state.caret = { x, y };
  render();
};

const drawLine = (x0, y0, x1, y1, color) => {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    if (x >= 0 && y >= 0 && x < state.width && y < state.height) {
      setPixel(x, y, color);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  state.caret = { x: x1, y: y1 };
  render();
};

const drawRect = (x0, y0, x1, y1, color) => {
  const minX = Math.max(Math.min(x0, x1), 0);
  const maxX = Math.min(Math.max(x0, x1), state.width - 1);
  const minY = Math.max(Math.min(y0, y1), 0);
  const maxY = Math.min(Math.max(y0, y1), state.height - 1);
  for (let x = minX; x <= maxX; x += 1) {
    setPixel(x, minY, color);
    setPixel(x, maxY, color);
  }
  for (let y = minY; y <= maxY; y += 1) {
    setPixel(minX, y, color);
    setPixel(maxX, y, color);
  }
  state.caret = { x: x1, y: y1 };
  render();
};

const floodFill = (sx, sy, color) => {
  if (sx < 0 || sy < 0 || sx >= state.width || sy >= state.height) return;
  const target = getPixel(sx, sy);
  if (target === color) return;
  const stack = [[sx, sy]];
  const visited = new Set();
  const key = (x, y) => `${x},${y}`;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) continue;
    const k = key(x, y);
    if (visited.has(k)) continue;
    visited.add(k);
    if (getPixel(x, y) !== target) continue;
    setPixel(x, y, color);
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
  state.caret = { x: sx, y: sy };
  render();
};

const drawAtCaretThenMove = (dx, dy) => {
  pushUndo();
  setPixel(state.caret.x, state.caret.y, state.fg);
  state.caret.x = clamp(state.caret.x + dx, 0, state.width - 1);
  state.caret.y = clamp(state.caret.y + dy, 0, state.height - 1);
  render();
};

const render = () => {
  canvas.width = state.width * state.zoom;
  canvas.height = state.height * state.zoom;

  const palette = paletteForMode(state.mode);
  const image = ctx.createImageData(state.width, state.height);
  const data = image.data;
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const idx = (y * state.width + x) * 4;
      const colorIdx = getPixel(x, y) % palette.length;
      const [r, g, b, a] = colorStringToRGBA(palette[colorIdx] || "#000000");
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }

  scratch.width = state.width;
  scratch.height = state.height;
  scratchCtx.putImageData(image, 0, 0);

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scratch, 0, 0, state.width, state.height, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (state.showGrid && state.zoom >= 4) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.width; x += 1) {
      const px = x * state.zoom + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, state.height * state.zoom);
      ctx.stroke();
    }
    for (let y = 0; y <= state.height; y += 1) {
      const py = y * state.zoom + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(state.width * state.zoom, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = Math.max(1, Math.floor(state.zoom / 4));
  ctx.strokeRect(
    state.caret.x * state.zoom + 0.5,
    state.caret.y * state.zoom + 0.5,
    state.zoom - 1,
    state.zoom - 1,
  );
  ctx.restore();

  refreshColorPreview();
  updateStatus();
};

const setMode = (modeId, width, height) => {
  const mode = modes[modeId];
  if (!mode) return;
  state.mode = mode;
  state.width = width || mode.width || state.width;
  state.height = height || mode.height || state.height;
  const handler = modeHandlers[modeId];
  state.data = handler.create({ width: state.width, height: state.height });
  state.undo = [];
  state.redo = [];
  if (mode.palette) {
    state.fg = 1;
    state.bg = 0;
  } else if (mode.id === "bitmap") {
    state.fg = 1;
    state.bg = 0;
  } else {
    state.fg = 1;
    state.bg = 0;
  }
  updatePaletteGrid();
  render();
};

const updateDimensionInputs = () => {
  const mode = modes[elements.modeSelect.value];
  const fixed = mode.width && mode.height;
  if (fixed) {
    elements.widthInput.value = mode.width;
    elements.heightInput.value = mode.height;
    elements.widthInput.disabled = true;
    elements.heightInput.disabled = true;
  } else {
    elements.widthInput.disabled = false;
    elements.heightInput.disabled = false;
  }
};

const openNewDialog = () => {
  updateDimensionInputs();
  ensureDialog(elements.newDialog);
};

const requestDimensions = ({ width, height }) => new Promise((resolve, reject) => {
  pendingDimensionResolve = resolve;
  pendingDimensionReject = reject;
  elements.dimWidth.value = width || 64;
  elements.dimHeight.value = height || 64;
  ensureDialog(elements.dimensionDialog);
});

const handleNewSubmit = (ev) => {
  ev.preventDefault();
  const modeId = elements.modeSelect.value;
  const width = parseInt(elements.widthInput.value, 10);
  const height = parseInt(elements.heightInput.value, 10);
  elements.newDialog.close();
  setMode(modeId, width, height);
};

const handleSettingsSubmit = (ev) => {
  ev.preventDefault();
  state.showGrid = elements.prefGrid.checked;
  const z = parseInt(elements.prefZoom.value, 10) || state.zoom;
  setZoom(z);
  elements.settingsDialog.close();
};

const handleFileOpen = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const detectedMode = detectModeFromFile(file.name, buffer.byteLength);
    let width = detectedMode.width;
    let height = detectedMode.height;
    if (detectedMode.id === "pixmap" || detectedMode.id === "bitmap") {
      const inferred = inferDimensions(buffer.byteLength, detectedMode.id);
      width = width || inferred.width || 64;
      height = height || inferred.height || 64;
      const dims = await requestDimensions({ width, height });
      width = parseInt(dims.width, 10);
      height = parseInt(dims.height, 10);
    }
    const handler = modeHandlers[detectedMode.id];
    const data = handler.fromFile(buffer, { width, height });
    state.mode = modes[detectedMode.id];
    state.width = width;
    state.height = height;
    state.data = data;
    state.undo = [];
    state.redo = [];
    updatePaletteGrid();
    render();
  } catch (err) {
    if (err && err.message !== "cancelled") {
      alert(`Open failed: ${err.message}`);
      console.error(err);
    }
  }
};

const saveFile = () => {
  const handler = modeHandlers[state.mode.id];
  if (!handler || !handler.toFile) return;
  try {
    const payload = handler.toFile(state.data);
    const blob = new Blob([payload], { type: "application/octet-stream" });
    const filename = `image.${state.mode.ext.toLowerCase()}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert(`Save failed: ${err.message}`);
  }
};

const setupToolbar = () => {
  document.getElementById("newButton").addEventListener("click", openNewDialog);
  document.getElementById("openButton").addEventListener("click", () => elements.fileInput.click());
  document.getElementById("saveButton").addEventListener("click", saveFile);
  document.getElementById("settingsButton").addEventListener("click", () => ensureDialog(elements.settingsDialog));
  document.getElementById("aboutButton").addEventListener("click", () => ensureDialog(elements.aboutDialog));

  document.getElementById("swapColors").addEventListener("click", () => {
    [state.fg, state.bg] = [state.bg, state.fg];
    refreshColorPreview();
  });

  document.getElementById("undoButton").addEventListener("click", undo);
  document.getElementById("redoButton").addEventListener("click", redo);

  document.getElementById("zoomIn").addEventListener("click", () => setZoom(state.zoom + 1));
  document.getElementById("zoomOut").addEventListener("click", () => setZoom(state.zoom - 1));

  document.getElementById("gridToggle").addEventListener("change", (ev) => {
    state.showGrid = ev.target.checked;
    render();
  });

  if (elements.toolButtons) {
    elements.toolButtons.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => setTool(btn.dataset.tool));
    });
  }

  elements.fileInput.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (file) handleFileOpen(file);
    elements.fileInput.value = "";
  });
};

const setupDialogs = () => {
  elements.modeSelect.addEventListener("change", updateDimensionInputs);
  elements.newForm.addEventListener("submit", handleNewSubmit);
  elements.newForm.addEventListener("reset", () => elements.newDialog.close());

  elements.settingsForm = document.getElementById("settingsForm");
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.settingsForm.addEventListener("reset", () => elements.settingsDialog.close());

  elements.dimensionForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const width = parseInt(elements.dimWidth.value, 10);
    const height = parseInt(elements.dimHeight.value, 10);
    elements.dimensionDialog.close();
    if (pendingDimensionResolve) pendingDimensionResolve({ width, height });
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
  elements.dimensionForm.addEventListener("reset", () => {
    elements.dimensionDialog.close();
    if (pendingDimensionReject) pendingDimensionReject(new Error("cancelled"));
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
  elements.dimensionDialog.addEventListener("cancel", (ev) => {
    ev.preventDefault();
    elements.dimensionDialog.close();
    if (pendingDimensionReject) pendingDimensionReject(new Error("cancelled"));
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
};

const setupCanvasDrawing = () => {
  let drawing = false;
  let drawColor = state.fg;

  const pickColorFromEvent = (ev) => {
    if (ev.button === 2 || ev.ctrlKey || ev.metaKey) return state.bg;
    return state.fg;
  };

  const toPixel = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((ev.clientX - rect.left) * scaleX) / state.zoom);
    const y = Math.floor(((ev.clientY - rect.top) * scaleY) / state.zoom);
    return { x, y };
  };

  canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

  canvas.addEventListener("mousedown", (ev) => {
    ev.preventDefault();
    const { x, y } = toPixel(ev);
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    drawColor = pickColorFromEvent(ev);
    state.dragStart = { x, y };
    state.dragColor = drawColor;
    state.caret = { x, y };
    pushUndo();
    if (state.tool === "fill") {
      floodFill(x, y, drawColor);
      drawing = false;
      return;
    }
    if (state.tool === "pencil") {
      drawing = true;
      applyDraw(x, y, drawColor);
      return;
    }
    drawing = true; // line or rect wait for mouseup
  });

  canvas.addEventListener("mousemove", (ev) => {
    if (!drawing) return;
    const { x, y } = toPixel(ev);
    if (state.tool === "pencil") {
      applyDraw(x, y, drawColor);
    } else {
      state.caret = { x, y };
    }
  });

  const finishShape = (ev) => {
    if (!drawing) return;
    const { x, y } = ev ? toPixel(ev) : state.caret;
    drawing = false;
    if (!state.dragStart) return;
    if (state.tool === "line") {
      drawLine(state.dragStart.x, state.dragStart.y, x, y, drawColor);
    } else if (state.tool === "rect") {
      drawRect(state.dragStart.x, state.dragStart.y, x, y, drawColor);
    }
    state.dragStart = null;
  };

  window.addEventListener("mouseup", finishShape);
  canvas.addEventListener("mouseleave", finishShape);
};

const handleKeyboard = () => {
  window.addEventListener("keydown", (ev) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLSelectElement || ev.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (ev.ctrlKey && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      undo();
      return;
    }
    if (ev.ctrlKey && ev.key.toLowerCase() === "y") {
      ev.preventDefault();
      redo();
      return;
    }
    switch (ev.key) {
      case "ArrowUp":
        if (ev.shiftKey) {
          drawAtCaretThenMove(0, -1);
        } else {
          state.caret.y = clamp(state.caret.y - 1, 0, state.height - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "ArrowDown":
        if (ev.shiftKey) {
          drawAtCaretThenMove(0, 1);
        } else {
          state.caret.y = clamp(state.caret.y + 1, 0, state.height - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "ArrowLeft":
        if (ev.shiftKey) {
          drawAtCaretThenMove(-1, 0);
        } else {
          state.caret.x = clamp(state.caret.x - 1, 0, state.width - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "ArrowRight":
        if (ev.shiftKey) {
          drawAtCaretThenMove(1, 0);
        } else {
          state.caret.x = clamp(state.caret.x + 1, 0, state.width - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "d":
      case "D":
        pushUndo();
        applyDraw(state.caret.x, state.caret.y, state.fg);
        ev.preventDefault();
        break;
      case "e":
      case "E":
        pushUndo();
        applyDraw(state.caret.x, state.caret.y, state.bg);
        ev.preventDefault();
        break;
      case "s":
      case "S":
        [state.fg, state.bg] = [state.bg, state.fg];
        refreshColorPreview();
        ev.preventDefault();
        break;
      case "+":
      case "=":
        setZoom(state.zoom + 1);
        ev.preventDefault();
        break;
      case "-":
        setZoom(state.zoom - 1);
        ev.preventDefault();
        break;
      default:
        break;
    }
  });
};

const init = () => {
  setupToolbar();
  setupDialogs();
  setupCanvasDrawing();
  handleKeyboard();
  setTool(state.tool);
  setMode("lores", modes.lores.width, modes.lores.height);
};

init();

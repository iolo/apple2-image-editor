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
export const paletteHgrMono = paletteBitmap;
export const paletteDhgrMono = paletteBitmap;
export const paletteDhgrColor = [
  "#000000", "#011EA9", "#00872D", "#2F45FF",
  "#9A6800", "#B9B9B9", "#00DE00", "#53FAD0",
  "#E72442", "#E649E4", "#686868", "#78BBFF",
  "#FF7C00", "#FFAB99", "#FFFC00", "#FFFFFF",
];

export const modes = {
  gr: { id: "gr", name: "Lo-Res", width: 40, height: 48, ext: "GR", palette: paletteLores, xscale: 2 },
  dgr: { id: "dgr", name: "Double Lo-Res", width: 80, height: 48, ext: "DGR", palette: paletteLores, xscale: 1 },
  hgrColor: { id: "hgrColor", name: "Hi-Res Color", width: 140, height: 192, ext: "HGR", palette: paletteHgr, xscale: 2 },
  hgrMono: { id: "hgrMono", name: "Hi-Res Mono", width: 280, height: 192, ext: "HGR", palette: paletteHgrMono, xscale: 1 },
  dhgrColor: { id: "dhgrColor", name: "Double Hi-Res Color", width: 140, height: 192, ext: "DHGR", palette: paletteDhgrColor, xscale: 2 },
  dhgrMono: { id: "dhgrMono", name: "Double Hi-Res Mono", width: 560, height: 192, ext: "DHGR", palette: paletteDhgrMono, xscale: 1 },
  pixmap: { id: "pixmap", name: "Pixmap", ext: "PIXMAP", palette: paletteLores, xscale: 1 },
  bitmap: { id: "bitmap", name: "Bitmap", ext: "BITMAP", palette: paletteBitmap, xscale: 1 },
};

const sizeSignatures = {
  0x400: "gr",
  0x800: "dgr",
  0x2000: "hgrColor",
  0x4000: "dhgrColor",
};

export const grAddress = (x, row) => (row & 0x07) * 0x80 + (row >> 3) * 0x28 + x;

export const hgrAddress = (x, y) => {
  const byteX = Math.floor(x / 7);
  // Apple II HGR interleaves 8-line blocks across 3 sections.
  return (y & 0x07) * 0x400 + ((y >> 3) & 0x07) * 0x80 + (y >> 6) * 0x28 + byteX;
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

export const rgbaToKey = (r, g, b, a = 255) => (
  ((r & 255) << 24) | ((g & 255) << 16) | ((b & 255) << 8) | (a & 255)
) >>> 0;

export const paletteToRGBA = (palette) => palette.map((color) => colorStringToRGBA(color));

export const paletteToIndexMap = (palette) => {
  const map = new Map();
  paletteToRGBA(palette).forEach((color, idx) => {
    map.set(rgbaToKey(color[0], color[1], color[2], color[3]), idx);
  });
  return map;
};

export const paletteForMode = (mode) => {
  return mode.palette;
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

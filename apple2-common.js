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

export const modes = {
  lores: { id: "lores", name: "Lo-Res", width: 40, height: 48, ext: "GR", palette: paletteLores },
  dlores: { id: "dlores", name: "Double Lo-Res", width: 80, height: 48, ext: "DGR", palette: paletteLores },
  hgrColor: { id: "hgrColor", name: "Hi-Res Color", width: 140, height: 192, ext: "HGR", palette: paletteHgr },
  hgrMono: { id: "hgrMono", name: "Hi-Res Mono", width: 280, height: 192, ext: "HGR", palette: paletteHgrMono },
  dhgr: { id: "dhgr", name: "Double Hi-Res", width: 560, height: 192, ext: "DHGR", palette: paletteLores },
  pixmap: { id: "pixmap", name: "Pixmap", ext: "PIXMAP", palette: null },
  bitmap: { id: "bitmap", name: "Bitmap", ext: "BITMAP", palette: paletteBitmap },
};

const sizeSignatures = {
  0x400: "lores",
  0x800: "dlores",
  0x2000: "hgrColor",
  0x4000: "dhgr",
};

export const loresAddress = (x, row) => (row & 0x07) * 0x80 + (row >> 3) * 0x28 + x;

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

import * as gr from './gr.mjs';
import * as dgr from './dgr.mjs';
import * as hgrColor from './hgr-color.mjs';
import * as hgrMono from './hgr-mono.mjs';
import * as dhgrColor from './dhgr-color.mjs';
import * as dhgrMono from './dhgr-mono.mjs';
import * as pixmap from './pixmap.mjs';
import * as bitmap from './bitmap.mjs';

export const hexToRgba = (hex) => {
  const m = /#(..)(..)(..)/i.exec(hex);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 255];
};

export const rgbaToKey = (r, g, b, a = 255) =>
  ((r & 255) << 24) | ((g & 255) << 16) | ((b & 255) << 8) | (a & 255);

export const paletteToRGBA = (palette) =>
  palette.map((color) => hexToRgba(color));

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

export class Palette {
  constructor(colors) {
    this.colors = colors;
    this.length = colors.length;
    this.rgbaMap = paletteToRGBA(colors);
    this.indexMap = paletteToIndexMap(colors);
  }
  getRgba(index) {
    return this.rgbaMap[index] || [0, 0, 0, 255];
  }
  getIndex(r, g, b, a) {
    return this.indexMap.get(rgbaToKey(r, g, b, a));
  }
  forEach(callback) {
    return this.colors.forEach(callback);
  }
}

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
  if (modeId === 'bitmap') {
    const pixels = byteLength * 8;
    return bestSquareFactors(pixels);
  }
  const pixels = byteLength;
  return bestSquareFactors(pixels);
};

const sizeSignatures = {
  0x400: 'gr',
  0x800: 'dgr',
  0x2000: 'hgrColor',
  0x4000: 'dhgrColor',
};

export const detectModeFromFile = (name, size) => {
  const lower = name.toLowerCase();
  const ext = lower.includes('.')
    ? lower.substring(lower.lastIndexOf('.') + 1)
    : '';
  const extMode = Object.values(modes).find((m) => m.ext.toLowerCase() === ext);
  const sizeModeId = sizeSignatures[size];
  const sizeMode = sizeModeId ? modes[sizeModeId] : null;

  if (extMode && sizeMode && extMode.id !== sizeMode.id) {
    throw new Error(
      `File extension .${extMode.ext.toLowerCase()} implies ${extMode.name}, but size 0x${size.toString(16)} implies ${sizeMode.name}`
    );
  }

  if (sizeMode) return sizeMode;
  if (extMode) return extMode;
  throw new Error(
    `Unsupported file: size 0x${size.toString(16)} (${size} bytes), extension ".${ext || 'none'}"`
  );
};

// mode specific buffer to RGBA array
export function decode(mode, palette, buffer, opts) {
  mode.init(buffer, opts);
  const pixels = new Uint8ClampedArray(opts.width * opts.height * 4);
  for (let y = 0; y < opts.height; y += 1) {
    for (let x = 0; x < opts.width; x += 1) {
      const index = mode.getPixel(x, y);
      const [r, g, b, a] = palette.getRgba(index);
      const offset = (y * opts.width + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = a;
    }
  }
  return pixels;
}

// RGBA array to mode specific buffer
export function encode(mode, palette, pixels, opts) {
  for (let y = 0; y < opts.height; y += 1) {
    for (let x = 0; x < opts.width; x += 1) {
      const offset = (y * opts.width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const a = pixels[offset + 3];
      const index = palette.getIndex(r, g, b, a);
      mode.setPixel(x, y, index);
    }
  }
  return mode.toBuffer();
}

export const modes = {
  gr: {
    id: 'gr',
    name: 'Lo-Res',
    width: 40,
    height: 48,
    ext: 'GR',
    xscale: 2,
    ...gr,
  },
  dgr: {
    id: 'dgr',
    name: 'Double Lo-Res',
    width: 80,
    height: 48,
    ext: 'DGR',
    xscale: 1,
    ...dgr,
  },
  hgrColor: {
    id: 'hgrColor',
    name: 'Hi-Res Color',
    width: 140,
    height: 192,
    ext: 'HGR',
    xscale: 2,
    ...hgrColor,
  },
  hgrMono: {
    id: 'hgrMono',
    name: 'Hi-Res Mono',
    width: 280,
    height: 192,
    ext: 'HGR',
    xscale: 1,
    ...hgrMono,
  },
  dhgrColor: {
    id: 'dhgrColor',
    name: 'Double Hi-Res Color',
    width: 140,
    height: 192,
    ext: 'DHGR',
    xscale: 2,
    ...dhgrColor,
  },
  dhgrMono: {
    id: 'dhgrMono',
    name: 'Double Hi-Res Mono',
    width: 560,
    height: 192,
    ext: 'DHGR',
    xscale: 1,
    ...dhgrMono,
  },
  pixmap: { id: 'pixmap', name: 'Pixmap', ext: 'PIXMAP', xscale: 1, ...pixmap },
  bitmap: { id: 'bitmap', name: 'Bitmap', ext: 'BITMAP', xscale: 1, ...bitmap },
};

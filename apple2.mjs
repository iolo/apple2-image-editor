import * as gr from './gr.mjs';
import * as dgr from './dgr.mjs';
import * as hgrColor from './hgr-color.mjs';
import * as hgrMono from './hgr-mono.mjs';
import * as dhgrColor from './dhgr-color.mjs';
import * as dhgrMono from './dhgr-mono.mjs';
import * as pixmap from './pixmap.mjs';
import * as bitmap from './bitmap.mjs';

export const modes = {
  gr: {
    id: 'gr',
    name: 'Lo-Res',
    width: 40,
    height: 48,
    ext: 'GR',
    size: 0x400,
    scaleX: 2,
    ...gr,
  },
  dgr: {
    id: 'dgr',
    name: 'Double Lo-Res',
    width: 80,
    height: 48,
    ext: 'DGR',
    size: 0x800,
    ...dgr,
  },
  hgrColor: {
    id: 'hgrColor',
    name: 'Hi-Res Color',
    width: 140,
    height: 192,
    ext: 'HGR',
    size: 0x2000,
    scaleX: 2,
    ...hgrColor,
  },
  hgrMono: {
    id: 'hgrMono',
    name: 'Hi-Res Mono',
    width: 280,
    height: 192,
    ext: 'HGR',
    size: 0x2000,
    ...hgrMono,
  },
  dhgrColor: {
    id: 'dhgrColor',
    name: 'Double Hi-Res Color',
    width: 140,
    height: 192,
    ext: 'DHGR',
    size: 0x4000,
    scaleX: 2,
    ...dhgrColor,
  },
  dhgrMono: {
    id: 'dhgrMono',
    name: 'Double Hi-Res Mono',
    width: 560,
    height: 192,
    ext: 'DHGR',
    size: 0x4000,
    scaleY: 2,
    ...dhgrMono,
  },
  pixmap: { id: 'pixmap', name: 'Pixmap', ext: 'PIXMAP', ...pixmap },
  bitmap: { id: 'bitmap', name: 'Bitmap', ext: 'BITMAP', ...bitmap },
};

export class Palette {
  constructor(colors) {
    this.colors = colors;
    this.length = colors.length;
    this.indexMap = {};
    for (let index = 0; index < colors.length; index += 1) {
      this.indexMap[colors[index]] = index;
    }
  }
  getColor(index) {
    return this.colors[index] ?? 0x000000;
  }
  getIndex(color) {
    return this.indexMap[color] ?? 0;
  }
  forEach(callback) {
    return this.colors.forEach(callback);
  }
  static toRgb(color) {
    return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
  }
  static fromRgb(r, g, b) {
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 255);
  }
  static toCss(color) {
    return '#' + color.toString(16).padStart(6, '0');
  }
}

// guess mode from filename extension or file size
export function detectMode(name, size) {
  const ext = name.toLowerCase().split('.').pop();
  return (
    Object.values(modes).find((mode) => mode.ext.toLowerCase() === ext) ??
    Object.values(modes).find((mode) => mode.size === size)
  );
}

// mode specific buffer to RGBA array
export function decode(mode, palette, buffer, opts) {
  const width = opts?.width ?? mode.width;
  const height = opts?.height ?? mode.height;
  const pixels = new Uint8Array(width * height * 4);
  const fb = mode.init(width, height, buffer);
  if (buffer) {
    fb.set(new Uint8Array(buffer));
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = mode.getPixel(fb, x, y);
      const [r, g, b] = Palette.toRgb(palette.getColor(index));
      const offset = (y * width + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255; // opaque
    }
  }
  return pixels;
}

// RGBA array to mode specific buffer
export function encode(mode, palette, pixels, opts) {
  const width = opts?.width ?? mode.width;
  const height = opts?.height ?? mode.height;
  const fb = mode.init(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const index = palette.getIndex(Palette.fromRgb(r, g, b));
      mode.setPixel(fb, x, y, index);
    }
  }
  return fb;
}

import * as gr from './gr.mjs';
import * as dgr from './dgr.mjs';
import * as hgr from './hgr.mjs';
import * as dhgr from './dhgr.mjs';
import * as pixmap from './pixmap.mjs';
import * as bitmap from './bitmap.mjs';

export const modes = {
  gr: {
    id: 'gr',
    name: 'Lo-Res',
    ext: 'GR',
    size: 0x400,
    init: gr.init,
    views: {
      color: gr.grColor,
      gray: gr.grGray,
      green: gr.grGreen,
      amber: gr.grAmber,
    },
    defaultView: 'color',
  },
  dgr: {
    id: 'dgr',
    name: 'Double Lo-Res',
    ext: 'DGR',
    size: 0x800,
    init: dgr.init,
    views: {
      color: dgr.dgrColor,
      gray: dgr.dgrGray,
      green: dgr.dgrGreen,
      amber: dgr.dgrAmber,
    },
    defaultView: 'color',
  },
  hgr: {
    id: 'hgr',
    name: 'Hi-Res',
    ext: 'HGR',
    size: 0x2000,
    init: hgr.init,
    views: {
      color: hgr.hgrColor,
      mono: hgr.hgrMono,
      green: hgr.hgrGreen,
      amber: hgr.hgrAmber,
    },
    defaultView: 'color',
  },
  dhgr: {
    id: 'dhgr',
    name: 'Double Hi-Res',
    ext: 'DHGR',
    size: 0x4000,
    init: dhgr.init,
    views: {
      color: dhgr.dhgrColor,
      mono: dhgr.dhgrMono,
      green: dhgr.dhgrGreen,
      amber: dhgr.dhgrAmber,
    },
    defaultView: 'color',
  },
  pixmap: {
    id: 'pixmap',
    name: 'Pixmap',
    ext: 'PIXMAP',
    init: pixmap.init,
    views: {
      color: pixmap.pixmapView,
    },
    defaultView: 'color',
  },
  bitmap: {
    id: 'bitmap',
    name: 'Bitmap',
    ext: 'BITMAP',
    init: bitmap.init,
    views: {
      mono: bitmap.bitmapView,
    },
    defaultView: 'mono',
  },
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
export function decode(mode, view, palette, buffer, opts) {
  const width = opts?.width ?? view.width ?? mode.width;
  const height = opts?.height ?? view.height ?? mode.height;
  const pixels = new Uint8Array(width * height * 4);
  const fb = mode.init(width, height, buffer);
  if (buffer) {
    fb.set(new Uint8Array(buffer));
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = view.getPixel(fb, x, y);
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
export function encode(mode, view, palette, pixels, opts) {
  const width = opts?.width ?? view.width ?? mode.width;
  const height = opts?.height ?? view.height ?? mode.height;
  const fb = mode.init(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const index = palette.getIndex(Palette.fromRgb(r, g, b));
      view.setPixel(fb, x, y, index);
    }
  }
  return fb;
}

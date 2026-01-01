import { Palette } from './apple2.mjs';

export const quantizeImageData = (imageData, palette) => {
  const paletteRgb = palette.colors.map((color) => Palette.toRgb(color));
  const data = imageData.data;
  const out = new Uint8Array(imageData.width * imageData.height * 4);
  for (let i = 0, o = 0; i < data.length; i += 4, o += 4) {
    const a = data[i + 3];
    if (a < 16) {
      const [r, g, b] = paletteRgb[0] ?? [0, 0, 0];
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let p = 0; p < paletteRgb.length; p += 1) {
      const [pr, pg, pb] = paletteRgb[p];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = p;
      }
    }
    const [rr, gg, bb] = paletteRgb[bestIndex];
    out[o] = rr;
    out[o + 1] = gg;
    out[o + 2] = bb;
    out[o + 3] = 255;
  }
  return out;
};

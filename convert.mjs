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

export const ditherFloydSteinberg = (imageData, palette) => {
  const paletteRgb = palette.colors.map((color) => Palette.toRgb(color));
  const { width, height } = imageData;
  const src = new Float32Array(imageData.data.length);
  for (let i = 0; i < imageData.data.length; i += 1) {
    src[i] = imageData.data[i];
  }
  const out = new Uint8Array(width * height * 4);

  const findNearest = (r, g, b) => {
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
    return paletteRgb[bestIndex];
  };

  const addError = (x, y, dr, dg, db, factor) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    src[idx] += dr * factor;
    src[idx + 1] += dg * factor;
    src[idx + 2] += db * factor;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const a = src[idx + 3];
      if (a < 16) {
        const [r, g, b] = paletteRgb[0] ?? [0, 0, 0];
        out[idx] = r;
        out[idx + 1] = g;
        out[idx + 2] = b;
        out[idx + 3] = 255;
        continue;
      }
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const [nr, ng, nb] = findNearest(r, g, b);
      out[idx] = nr;
      out[idx + 1] = ng;
      out[idx + 2] = nb;
      out[idx + 3] = 255;

      const er = r - nr;
      const eg = g - ng;
      const eb = b - nb;
      addError(x + 1, y, er, eg, eb, 7 / 16);
      addError(x - 1, y + 1, er, eg, eb, 3 / 16);
      addError(x, y + 1, er, eg, eb, 5 / 16);
      addError(x + 1, y + 1, er, eg, eb, 1 / 16);
    }
  }

  return out;
};

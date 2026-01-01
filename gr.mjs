export const GR_COLORS = [
  0x000000, // 0000 black
  0xac124c, // 0001 red
  0x000783, // 0010 dkblue
  0xc734ff, // 0011 purple/magenta
  0x00832f, // 0100 dkgreen
  0x808080, // 0101 dkgray
  0x008ab5, // 0110 blue
  0xaaaaff, // 0111 ltblue
  0x7a5f00, // 1000 brown
  0xf25e00, // 1001 orange
  0x78687f, // 1010 ltgray
  0xff89e5, // 1011 pink
  0x6fe62c, // 1100 green
  0xd5d51a, // 1101 yellow
  0x6ceeb2, // 1110 aqua
  0xffffff, // 1111 white
];

export const COLORS = GR_COLORS;

const clampByte = (value) => Math.max(0, Math.min(255, value));

const makeTintPalette = (colors, tint) =>
  colors.map((color) => {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const tr = clampByte(Math.round(luma * tint[0]));
    const tg = clampByte(Math.round(luma * tint[1]));
    const tb = clampByte(Math.round(luma * tint[2]));
    return (tr << 16) | (tg << 8) | tb;
  });

export const GR_GRAY_COLORS = makeTintPalette(GR_COLORS, [1, 1, 1]);
export const GR_GREEN_COLORS = makeTintPalette(GR_COLORS, [0.2, 1, 0.2]);
export const GR_AMBER_COLORS = makeTintPalette(GR_COLORS, [1, 0.75, 0.2]);

export const TEXT_OFFSET = [
  0x0000, 0x0080, 0x0100, 0x0180, 0x0200, 0x0280, 0x0300, 0x0380, 0x0028,
  0x00a8, 0x0128, 0x01a8, 0x0228, 0x02a8, 0x0328, 0x03a8, 0x0050, 0x00d0,
  0x0150, 0x01d0, 0x0250, 0x02d0, 0x0350, 0x03d0,
];

export function init() {
  return new Uint8Array(0x400);
}

function pixelOffset(x, y) {
  return TEXT_OFFSET[y >> 1] + x;
}

export function setPixel(fb, x, y, color) {
  const offset = pixelOffset(x, y);
  const byte = fb[offset];
  if (y & 1) {
    fb[offset] = (byte & 0x0f) | ((color & 0x0f) << 4);
  } else {
    fb[offset] = (byte & 0xf0) | (color & 0x0f);
  }
}

export function getPixel(fb, x, y) {
  const offset = pixelOffset(x, y);
  const byte = fb[offset];
  if (y & 1) {
    // odd row -> high nibble
    return (byte >> 4) & 0x0f;
  }
  // even row -> low nibble
  return byte & 0x0f;
}

const baseView = {
  width: 40,
  height: 48,
  scaleX: 2,
  setPixel,
  getPixel,
};

export const grColor = {
  name: 'Color',
  palette: GR_COLORS,
  ...baseView,
};

export const grGray = {
  name: 'Gray',
  palette: GR_GRAY_COLORS,
  ...baseView,
};

export const grGreen = {
  name: 'Green',
  palette: GR_GREEN_COLORS,
  ...baseView,
};

export const grAmber = {
  name: 'Amber',
  palette: GR_AMBER_COLORS,
  ...baseView,
};

import {
  detectModeFromFile,
  inferDimensions,
  modeHandlers,
  modes,
  paletteForMode,
  paletteToRGBA,
  rgbaToKey,
} from "./modes.mjs";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertRange = (value, min, max, message) => {
  assert(Number.isFinite(value), message);
  assert(value >= min && value <= max, message);
};

const fillBuffer = (width, height, rgba) => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = rgba[0];
    pixels[i + 1] = rgba[1];
    pixels[i + 2] = rgba[2];
    pixels[i + 3] = rgba[3];
  }
  return pixels;
};

const setPixel = (pixels, width, x, y, rgba) => {
  const offset = (y * width + x) * 4;
  pixels[offset] = rgba[0];
  pixels[offset + 1] = rgba[1];
  pixels[offset + 2] = rgba[2];
  pixels[offset + 3] = rgba[3];
};

const getPixelKey = (pixels, width, x, y) => {
  const offset = (y * width + x) * 4;
  return rgbaToKey(
    pixels[offset],
    pixels[offset + 1],
    pixels[offset + 2],
    pixels[offset + 3],
  );
};

const roundTripMode = (id, sampleIndex = 1, sizeOverride = null) => {
  const mode = modes[id];
  const handler = modeHandlers[id];
  assert(handler?.encode && handler?.decode, `Handler ${id} missing encode/decode`);
  const palette = paletteForMode(mode);
  const rgba = paletteToRGBA(palette);
  const width = sizeOverride?.width || mode.width;
  const height = sizeOverride?.height || mode.height;
  assert(width && height, `Mode ${id} missing dimensions`);
  const bg = rgba[0];
  const fg = rgba[sampleIndex % rgba.length];
  const pixels = fillBuffer(width, height, bg);
  setPixel(pixels, width, 0, 0, fg);
  const encoded = handler.encode(pixels, { width, height, palette });
  const decoded = handler.decode(encoded, { width, height, palette });
  assert(decoded.length === pixels.length, `${id} decoded size mismatch`);
  assert(
    getPixelKey(decoded, width, 0, 0) === rgbaToKey(fg[0], fg[1], fg[2], fg[3]),
    `${id} round-trip pixel mismatch`,
  );
  assert(
    getPixelKey(decoded, width, width - 1, height - 1) === rgbaToKey(bg[0], bg[1], bg[2], bg[3]),
    `${id} background pixel mismatch`,
  );
};

const run = () => {
  const expectedModes = ["gr", "dgr", "hgrColor", "hgrMono", "dhgrColor", "dhgrMono", "pixmap", "bitmap"];
  expectedModes.forEach((id) => {
    assert(modes[id], `Missing mode: ${id}`);
    assert(modeHandlers[id], `Missing mode handler: ${id}`);
  });

  roundTripMode("gr", 3);
  roundTripMode("dgr", 7);
  roundTripMode("hgrColor", 1);
  roundTripMode("hgrMono", 1);
  roundTripMode("dhgrColor", 1);
  roundTripMode("dhgrMono", 1);
  roundTripMode("pixmap", 2, { width: 8, height: 8 });
  roundTripMode("bitmap", 1, { width: 8, height: 8 });

  const palette = paletteForMode(modes.pixmap);
  assert(palette.length === 16, "Pixmap palette length mismatch");

  const detected = detectModeFromFile("test.gr", 0x400);
  assert(detected.id === "gr", "Mode detection mismatch for .GR");

  let threw = false;
  try {
    detectModeFromFile("test.dgr", 0x400);
  } catch (err) {
    threw = true;
  }
  assert(threw, "Expected mismatch detection to throw");

  const inferredBitmap = inferDimensions(8, "bitmap");
  assert(inferredBitmap.width * inferredBitmap.height === 64, "Bitmap dimension inference mismatch");
};

try {
  run();
  console.log("Smoke check passed.");
} catch (err) {
  console.error("Smoke check failed:");
  console.error(err.message || err);
  process.exit(1);
}

import {
  detectModeFromFile,
  inferDimensions,
  modeHandlers,
  modes,
  paletteForMode,
} from "./apple2-modes.js";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertRange = (value, min, max, message) => {
  assert(Number.isFinite(value), message);
  assert(value >= min && value <= max, message);
};

const run = () => {
  const expectedModes = ["lores", "dlores", "hgr", "dhgr", "pixmap", "bitmap"];
  expectedModes.forEach((id) => {
    assert(modes[id], `Missing mode: ${id}`);
    assert(modeHandlers[id], `Missing mode handler: ${id}`);
  });

  const lores = modeHandlers.lores.create({ width: 40, height: 48 });
  modeHandlers.lores.setPixel(lores, 0, 0, 3);
  assert(modeHandlers.lores.getPixel(lores, 0, 0) === 3, "Lo-res pixel mismatch");

  const dlores = modeHandlers.dlores.create({ width: 80, height: 48 });
  modeHandlers.dlores.setPixel(dlores, 1, 0, 7);
  assert(modeHandlers.dlores.getPixel(dlores, 1, 0) === 7, "Double lo-res pixel mismatch");

  const hgr = modeHandlers.hgr.create({ width: 280, height: 192 });
  modeHandlers.hgr.setPixel(hgr, 0, 0, 5);
  assert(modeHandlers.hgr.getPixel(hgr, 0, 0) === 5, "Hi-res white pixel mismatch");

  const dhgr = modeHandlers.dhgr.create({ width: 560, height: 192 });
  modeHandlers.dhgr.setPixel(dhgr, 0, 0, 1);
  assertRange(modeHandlers.dhgr.getPixel(dhgr, 0, 0), 0, 15, "Double hi-res pixel out of range");

  const pixmap = modeHandlers.pixmap.create({ width: 8, height: 8 });
  modeHandlers.pixmap.setPixel(pixmap, 2, 3, 200);
  assert(modeHandlers.pixmap.getPixel(pixmap, 2, 3) === 200, "Pixmap pixel mismatch");

  const bitmap = modeHandlers.bitmap.create({ width: 8, height: 8 });
  modeHandlers.bitmap.setPixel(bitmap, 4, 4, 1);
  assert(modeHandlers.bitmap.getPixel(bitmap, 4, 4) === 1, "Bitmap pixel mismatch");

  const palette = paletteForMode(modes.pixmap);
  assert(palette.length === 16, "Pixmap palette length mismatch");

  const detected = detectModeFromFile("test.gr", 0x400);
  assert(detected.id === "lores", "Mode detection mismatch for .GR");

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

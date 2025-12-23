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
  const expectedModes = ["gr", "dgr", "hgrColor", "hgrMono", "dhgrColor", "dhgrMono", "pixmap", "bitmap"];
  expectedModes.forEach((id) => {
    assert(modes[id], `Missing mode: ${id}`);
    assert(modeHandlers[id], `Missing mode handler: ${id}`);
  });

  const gr = modeHandlers.gr.create({ width: 40, height: 48 });
  modeHandlers.gr.setPixel(gr, 0, 0, 3);
  assert(modeHandlers.gr.getPixel(gr, 0, 0) === 3, "Lo-res pixel mismatch");

  const dgr = modeHandlers.dgr.create({ width: 80, height: 48 });
  modeHandlers.dgr.setPixel(dgr, 1, 0, 7);
  assert(modeHandlers.dgr.getPixel(dgr, 1, 0) === 7, "Double lo-res pixel mismatch");

  const hgrColor = modeHandlers.hgrColor.create({ width: 140, height: 192 });
  modeHandlers.hgrColor.setPixel(hgrColor, 0, 0, 1);
  assert(modeHandlers.hgrColor.getPixel(hgrColor, 0, 0) === 1, "Hi-res color pixel mismatch");

  const hgrMono = modeHandlers.hgrMono.create({ width: 280, height: 192 });
  modeHandlers.hgrMono.setPixel(hgrMono, 0, 0, 1);
  assert(modeHandlers.hgrMono.getPixel(hgrMono, 0, 0) === 1, "Hi-res mono pixel mismatch");

  const dhgrColor = modeHandlers.dhgrColor.create({ width: 140, height: 192 });
  modeHandlers.dhgrColor.setPixel(dhgrColor, 0, 0, 1);
  assertRange(modeHandlers.dhgrColor.getPixel(dhgrColor, 0, 0), 0, 15, "Double hi-res color pixel out of range");

  const dhgrMono = modeHandlers.dhgrMono.create({ width: 560, height: 192 });
  modeHandlers.dhgrMono.setPixel(dhgrMono, 0, 0, 1);
  assert(modeHandlers.dhgrMono.getPixel(dhgrMono, 0, 0) === 1, "Double hi-res mono pixel mismatch");

  const pixmap = modeHandlers.pixmap.create({ width: 8, height: 8 });
  modeHandlers.pixmap.setPixel(pixmap, 2, 3, 200);
  assert(modeHandlers.pixmap.getPixel(pixmap, 2, 3) === 200, "Pixmap pixel mismatch");

  const bitmap = modeHandlers.bitmap.create({ width: 8, height: 8 });
  modeHandlers.bitmap.setPixel(bitmap, 4, 4, 1);
  assert(modeHandlers.bitmap.getPixel(bitmap, 4, 4) === 1, "Bitmap pixel mismatch");

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

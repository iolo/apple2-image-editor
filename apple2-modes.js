import { bitmapHandler } from "./bitmap.js";
import {
  clamp,
  colorStringToRGBA,
  detectModeFromFile,
  inferDimensions,
  modes,
  paletteForMode,
} from "./apple2-common.js";
import { dhgrHandler } from "./apple2-dhgr.js";
import { dloresHandler } from "./apple2-dgr.js";
import { hgrHandler } from "./apple2-hgr.js";
import { loresHandler } from "./apple2-gr.js";
import { pixmapHandler } from "./pixmap.js";

export {
  clamp,
  colorStringToRGBA,
  detectModeFromFile,
  inferDimensions,
  modes,
  paletteForMode,
};

export const modeHandlers = {
  lores: loresHandler,
  dlores: dloresHandler,
  hgr: hgrHandler,
  dhgr: dhgrHandler,
  pixmap: pixmapHandler,
  bitmap: bitmapHandler,
};

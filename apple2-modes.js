import { bitmapHandler } from "./bitmap.js";
import {
  clamp,
  colorStringToRGBA,
  detectModeFromFile,
  inferDimensions,
  modes,
  paletteForMode,
} from "./apple2-common.js";
import { dhgrColorHandler, dhgrMonoHandler } from "./apple2-dhgr.js";
import { dloresHandler } from "./apple2-dgr.js";
import { hgrColorHandler, hgrMonoHandler } from "./apple2-hgr.js";
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
  gr: loresHandler,
  dgr: dloresHandler,
  hgrColor: hgrColorHandler,
  hgrMono: hgrMonoHandler,
  dhgrColor: dhgrColorHandler,
  dhgrMono: dhgrMonoHandler,
  pixmap: pixmapHandler,
  bitmap: bitmapHandler,
};

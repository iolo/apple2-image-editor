import { bitmapHandler } from "./bitmap.mjs";
import {
  clamp,
  colorStringToRGBA,
  detectModeFromFile,
  inferDimensions,
  modes,
  paletteForMode,
} from "./apple2-common.mjs";
import { dhgrColorHandler, dhgrMonoHandler } from "./apple2-dhgr.mjs";
import { dloresHandler } from "./apple2-dgr.mjs";
import { hgrColorHandler, hgrMonoHandler } from "./apple2-hgr.mjs";
import { loresHandler } from "./apple2-gr.mjs";
import { pixmapHandler } from "./pixmap.mjs";

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

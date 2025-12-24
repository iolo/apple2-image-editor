import { bitmapHandler } from "./bitmap.mjs";
import { dgrHandler } from "./dgr.mjs";
import { dhgrColorHandler, dhgrMonoHandler } from "./dhgr.mjs";
import { grHandler } from "./gr.mjs";
import { hgrColorHandler, hgrMonoHandler } from "./hgr.mjs";
import { pixmapHandler } from "./pixmap.mjs";

export * from "./common.mjs";

export const modeHandlers = {
  gr: grHandler,
  dgr: dgrHandler,
  hgrColor: hgrColorHandler,
  hgrMono: hgrMonoHandler,
  dhgrColor: dhgrColorHandler,
  dhgrMono: dhgrMonoHandler,
  pixmap: pixmapHandler,
  bitmap: bitmapHandler,
};

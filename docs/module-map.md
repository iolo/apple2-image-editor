# Module Map

This document summarizes the responsibilities and key exports of each module.

## Entry Points

- `index.html`
  - App layout and dialogs.
  - Canvas element for rendering.
  - Toolbox and palette controls.
- `style.css`
  - Layout and UI styling.
  - Toolbox, palette, dialogs, and canvas presentation.

## Core Application

- `app.mjs`
  - Owns all UI wiring and state management.
  - Coordinates modes, views, framebuffer, and RGBA rendering.
  - Handles input, tools, selection, undo/redo, zoom, and grid.
  - Implements file open/save and import flow.

## Mode + View Registry

- `apple2.mjs`
  - Mode registry (`modes`) for GR/DGR/HGR/DHGR/pixmap/bitmap.
  - `Palette` helper for RGB/index mapping.
  - `encode` and `decode` helpers (used as utilities).
  - `detectMode` for file type/size guessing.

## Mode Handlers (Framebuffer Layout + Views)

- `gr.mjs`
  - GR framebuffer layout.
  - Views: `color`, `gray`, `green`, `amber`.
- `dgr.mjs`
  - DGR framebuffer layout.
  - Views: `color`, `gray`, `green`, `amber`.
- `hgr.mjs`
  - HGR framebuffer layout.
  - Views: `color`, `mono`, `green`, `amber`.
- `dhgr.mjs`
  - DHGR framebuffer layout.
  - Views: `color`, `mono`, `green`, `amber`.
- `pixmap.mjs`
  - Generic 8bpp pixmap layout.
  - View: `color`.
- `bitmap.mjs`
  - Generic 1bpp bitmap layout.
  - View: `mono`.

## Tools

- `tools.mjs`
  - Drawing algorithms: line, rectangle, ellipse, flood fill.
  - Operates on `getPixel`/`setPixel` callbacks for flexibility.

## Conversion

- `convert.mjs`
  - Image quantization and dithering helpers.

## Assets and Misc

- `demo/`, `docs/`, `splash.mjs`, `splash.gr`
  - Demo and documentation assets.
- `PRNumber3.ttf`, `favicon.ico`, `screenshot.png`
  - Static assets used by the UI.

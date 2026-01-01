# Architecture Overview

This document describes the high-level architecture and data flow of
`apple2-image-editor`.

## Goals

- Keep the editor simple and explicit.
- Separate framebuffer formats (modes) from representations (views).
- Keep rendering and input responsive without extra dependencies.

## Main Pieces

- UI (HTML/CSS): layout, dialogs, toolbox, palette, canvas.
- App state (`app.mjs`): mode/view, framebuffer, RGBA pixels, tools, selection,
  undo/redo, zoom, grid.
- Mode handlers (`gr.mjs`, `dgr.mjs`, `hgr.mjs`, `dhgr.mjs`, `pixmap.mjs`,
  `bitmap.mjs`): framebuffer layout + view definitions.
- Codec (`apple2.mjs`): mode registry, palette utilities, encode/decode helpers.
- Tools (`tools.mjs`): drawing algorithms (line, rect, ellipse, flood fill).

## Data Flow

### 1) New/Open

- User selects a mode (New) or opens a file (Open).
- App resolves the mode and default view for that mode.
- App allocates a framebuffer (`state.fb`) and, if opening a file, loads bytes.
- App decodes the framebuffer into RGBA (`state.pixels`) using the view.
- Canvas renders `state.pixels` with the current zoom and scale.

### 2) Editing

- User input (mouse/keyboard) triggers tools.
- Tools call `setPixel(x, y, color)` on RGBA space.
- `setPixel` writes to both `state.pixels` and `state.fb` using the view.
- Canvas re-renders from `state.pixels`.

### 3) View Switching

- User selects a different view for the same mode.
- App keeps the same framebuffer (`state.fb`).
- App updates view metadata (resolution, palette, scale).
- App re-decodes `state.fb` into `state.pixels`.
- Canvas re-renders using the new view.

### 4) Save

- For Apple II formats, bytes are written directly from `state.fb`.
- For modern formats, RGBA is rasterized from `state.pixels`.

### 5) Undo/Redo

- Undo/redo snapshots store framebuffer bytes.
- Restoring a snapshot re-decodes into RGBA with the current view.

## Notes

- Modes are immutable after New/Open; views are switchable while editing.
- The framebuffer is the source of truth; RGBA is a view-specific rendering.

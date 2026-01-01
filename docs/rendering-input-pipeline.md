# Rendering And Input Pipeline

This document describes how rendering and input work in the editor.

## Rendering Pipeline

1. App state holds:
   - `state.fb`: mode-specific framebuffer (source of truth).
   - `state.pixels`: RGBA buffer used for drawing the canvas.

2. When mode or view changes:
   - The framebuffer is preserved (view switch) or reinitialized (mode change).
   - The view is applied to decode `state.fb` into `state.pixels`.

3. Rendering to canvas:
   - `state.pixels` is copied into a temporary `ImageData`.
   - The canvas is scaled based on `zoom` and `scaleX/scaleY`.
   - The rendered canvas is pixel-crisp with `imageSmoothingEnabled = false`.

4. Optional overlays:
   - Selection preview, caret, and pixel grid are drawn on top.

## Input Pipeline

### Mouse Input

- Mouse events map screen coordinates to logical pixel coordinates.
- Tools use `setPixel`/`getPixel` for direct edits.
- Selection tool stores a buffer of RGBA pixels and can move/copy regions.

### Keyboard Input

- Arrow keys move the caret.
- Shift + arrow draws while moving.
- Shortcuts for tool actions (swap colors, zoom, draw foreground/background).

## Tool Execution

- On mouse down:
  - App selects a tool and pushes an undo snapshot.
  - For drawing tools, the starting point is recorded.
  - For fill, the flood fill runs immediately.

- On mouse move:
  - Pencil draws directly per pixel.
  - Shape tools update a live preview.

- On mouse up:
  - Shapes are committed using tool helpers.
  - The preview is cleared and the canvas is redrawn.

## Undo/Redo

- Undo/redo stores snapshots of the framebuffer (`state.fb`).
- Restoring a snapshot re-decodes `state.fb` to `state.pixels`.
- View switching does not mutate the framebuffer.

## View Switching

- Switching views updates the palette and logical dimensions.
- The framebuffer remains the same.
- The UI re-decodes the framebuffer using the new view.

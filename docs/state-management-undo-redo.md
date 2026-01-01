# State Management And Undo/Redo

This document describes the editor state model and how undo/redo works.

## Core State

Key state fields in `app.mjs`:

- `state.mode`: current framebuffer mode (GR/DGR/HGR/DHGR/pixmap/bitmap).
- `state.view`: current view for the mode (color, mono, green, amber, etc.).
- `state.fb`: mode-specific framebuffer bytes (source of truth).
- `state.pixels`: RGBA pixels for rendering.
- `state.width`/`state.height`: logical dimensions for the current view.
- `state.palette`: palette for the current view.
- `state.tool`, `state.caretX`, `state.caretY`, selection state.
- `state.undo` / `state.redo`: framebuffer snapshots.

## State Transitions

### Mode Change

- Creates a new framebuffer and resets undo/redo.
- Loads file data if opening a file.
- Decodes framebuffer to RGBA for display.

### View Change

- Keeps the framebuffer intact.
- Updates palette and logical dimensions.
- Re-decodes framebuffer into RGBA.

### Drawing

- `setPixel` writes to both RGBA and framebuffer.
- Tool helpers use `getPixel`/`setPixel` to modify the image.

## Undo/Redo Model

- Undo/redo snapshots store framebuffer bytes, not RGBA pixels.
- On undo:
  - Pop a framebuffer snapshot.
  - Push the current framebuffer to redo.
  - Re-decode to RGBA using the current view.
- On redo:
  - Pop a framebuffer snapshot.
  - Push the current framebuffer to undo.
  - Re-decode to RGBA using the current view.

## Why Framebuffer Snapshots

- A view change should never lose data.
- The framebuffer stays consistent across view switches.
- Undo/redo should restore the true Apple II memory layout.

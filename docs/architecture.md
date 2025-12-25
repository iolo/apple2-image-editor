# Architecture

This editor keeps all editing logic mode-agnostic by storing pixels in a single RGBA buffer owned by the editor. Mode handlers act only as codecs between Apple II-specific byte layouts and the editor buffer. The canvas is a render target, not the source of truth.

## Core principles

- Editor owns the pixel buffer and tool logic.
- Mode handlers own format-specific encoding and decoding.
- Palette enforcement is strict; editor writes only palette colors.
- Rendering reads the buffer directly; no mode-specific drawing paths.

## Data flow

- New image:
  - Editor gets `width`, `height`, `palette` from mode metadata.
  - Editor allocates a blank RGBA buffer.
- Open file:
  - File bytes -> mode handler `decode(bytes)` -> RGBA buffer.
- Edit:
  - Tools update RGBA buffer only.
  - Undo/redo stores buffer snapshots.
- Render:
  - RGBA buffer -> `ImageData` -> canvas.
- Save:
  - RGBA buffer -> mode handler `encode(rgba)` -> file bytes.

## Editor responsibilities

- Maintain editor state: current mode, size, palette selection, zoom, caret, tools, undo/redo.
- Enforce palette-only drawing by using palette indices to produce RGBA colors.
- Provide tool algorithms (line, rect, fill) that only touch the RGBA buffer.
- Render the buffer to canvas with optional grid and caret.

## Mode handler contract

Each mode handler is a codec with metadata:

- `decode(buffer, { width, height, palette }) -> Uint8ClampedArray`
- `encode(pixels, { width, height, palette }) -> Uint8Array`
- `fromFile(buffer, opts)` and `toFile(data)` remain internal helpers for parsing raw format bytes.
- Any palette mapping or validation happens inside `encode/decode`, not in the editor.

## Palette enforcement

- The editor never writes non-palette colors.
- Any non-palette colors must be handled by the mode handler during `encode/decode`.
- If a color is not in the palette during `encode`, the handler throws an error.

## Mode switching

- When preserving data, the editor converts:
  - `current RGBA -> current handler encode -> next handler decode -> new RGBA`.
- On failure, the editor creates a blank buffer for the new mode.

## Files to read first

- `app.mjs`: editor state, tools, render loop, file load/save.
- `common.mjs`: palette helpers and utilities.
- `gr.mjs`, `dgr.mjs`, `hgr.mjs`, `dhgr.mjs`, `pixmap.mjs`, `bitmap.mjs`: codec implementations.

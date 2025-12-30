import { detectMode, modes, Palette, encode, decode } from './apple2.mjs';
import { drawLine, drawRect, floodFill } from './tools.mjs';

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const scratch = document.createElement('canvas');
const scratchCtx = scratch.getContext('2d');
scratchCtx.imageSmoothingEnabled = false;

const elements = {
  newDialog: document.getElementById('newDialog'),
  newForm: document.getElementById('newForm'),
  modeSelect: document.getElementById('modeSelect'),
  widthInput: document.getElementById('widthInput'),
  heightInput: document.getElementById('heightInput'),
  settingsDialog: document.getElementById('settingsDialog'),
  aboutDialog: document.getElementById('aboutDialog'),
  prefGrid: document.getElementById('prefGrid'),
  prefZoom: document.getElementById('prefZoom'),
  fileInput: document.getElementById('fileInput'),
  fgPreview: document.getElementById('fgPreview'),
  bgPreview: document.getElementById('bgPreview'),
  paletteGrid: document.getElementById('paletteGrid'),
  paletteMeta: document.getElementById('paletteMeta'),
  modeInfo: document.getElementById('modeInfo'),
  zoomInfo: document.getElementById('zoomInfo'),
  cursorPos: document.getElementById('cursorPos'),
  dimensionDialog: document.getElementById('dimensionDialog'),
  dimensionForm: document.getElementById('dimensionForm'),
  dimWidth: document.getElementById('dimWidth'),
  dimHeight: document.getElementById('dimHeight'),
  gridToggle: document.getElementById('gridToggle'),
  hgrModeSelect: document.getElementById('hgrModeSelect'),
  dhgrModeSelect: document.getElementById('dhgrModeSelect'),
  toolButtons: document.getElementById('toolButtons'),
};

const TOOLS = {
  PENCIL: 'pencil',
  LINE: 'line',
  RECT: 'rect',
  FILL: 'fill',
};

const DEF_ZOOM = 8;
const MIN_ZOOM = 1;
const MAX_ZOOM = 24;

const state = {
  mode: null,
  pixels: null,
  width: 0,
  height: 0,
  scaleX: 1,
  scaleY: 1,
  palette: null,
  fg: 0xffffff,
  bg: 0x000000,
  zoom: DEF_ZOOM,
  showGrid: true,
  caretX: 0,
  caretY: 0,
  tool: TOOLS.PENCIL,
  undo: [],
  redo: [],
};

let pendingDimensionResolve = null;
let pendingDimensionReject = null;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const setZoom = (value) => {
  state.zoom = clamp(value, MIN_ZOOM, MAX_ZOOM);
  render();
};

const updatePalette = () => {
  elements.paletteGrid.innerHTML = '';
  state.palette.forEach((color, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch-button';
    btn.style.background = Palette.toCss(color);
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = index.toString(16).toUpperCase();
    btn.appendChild(label);
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (ev.ctrlKey) {
        state.bg = color;
      } else {
        state.fg = color;
      }
      refreshColorPreview();
    });
    elements.paletteGrid.appendChild(btn);
  });
  elements.paletteMeta.textContent = `${state.palette.length} colors`;
};

const refreshColorPreview = () => {
  elements.fgPreview.style.background = Palette.toCss(state.fg);
  elements.bgPreview.style.background = Palette.toCss(state.bg);
};

const isHgrMode = (modeId) => modeId === 'hgrColor' || modeId === 'hgrMono';
const isDhgrMode = (modeId) => modeId === 'dhgrColor' || modeId === 'dhgrMono';

const updateToolbox = () => {
  if (elements.hgrModeSelect) {
    const active = isHgrMode(state.mode.id);
    elements.hgrModeSelect.disabled = !active;
    if (active) {
      elements.hgrModeSelect.value = state.mode.id;
    }
  }

  if (elements.dhgrModeSelect) {
    const active = isDhgrMode(state.mode.id);
    elements.dhgrModeSelect.disabled = !active;
    if (active) {
      elements.dhgrModeSelect.value = state.mode.id;
    }
  }
};

const updateStatus = () => {
  elements.modeInfo.textContent = `${state.mode.name} ${state.width}x${state.height} (.${state.mode.ext})`;
  elements.zoomInfo.textContent = `Zoom ${state.zoom}x · ${state.tool}`;
  elements.cursorPos.textContent = `(${state.caretX}, ${state.caretY})`;
};

const setTool = (tool) => {
  state.tool = tool;
  if (elements.toolButtons) {
    elements.toolButtons.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }
  updateStatus();
};

const pushUndo = () => {
  if (!state.pixels) return;
  state.undo.push(new Uint8Array(state.pixels));
  if (state.undo.length > 50) state.undo.shift();
  state.redo.length = 0;
};

const restorePixels = (pixels) => {
  state.pixels = pixels;
  render();
};

const undo = () => {
  if (!state.undo.length) return;
  const snapshot = state.undo.pop();
  state.redo.push(new Uint8Array(state.pixels));
  restorePixels(snapshot);
};

const redo = () => {
  if (!state.redo.length) return;
  const snapshot = state.redo.pop();
  state.undo.push(new Uint8Array(state.pixels));
  restorePixels(snapshot);
};

const setPixel = (x, y, color) => {
  const offset = (y * state.width + x) * 4;
  const [r, g, b] = Palette.toRgb(color);
  state.pixels[offset] = r;
  state.pixels[offset + 1] = g;
  state.pixels[offset + 2] = b;
  state.pixels[offset + 3] = 255; // opaque
};

const getPixel = (x, y) => {
  const offset = (y * state.width + x) * 4;
  const r = state.pixels[offset];
  const g = state.pixels[offset + 1];
  const b = state.pixels[offset + 2];
  return Palette.fromRgb(r, g, b);
};

const applyDraw = (x, y, color) => {
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
  setPixel(x, y, color);
  state.caretX = x;
  state.caretY = y;
  render();
};

const render = () => {
  const scaleX = state.zoom * state.scaleX;
  const scaleY = state.zoom * state.scaleY;
  canvas.width = Math.max(1, Math.round(state.width * scaleX));
  canvas.height = Math.max(1, Math.round(state.height * scaleY));
  const displayScaleX = canvas.width / state.width;
  const displayScaleY = canvas.height / state.height;

  const image = ctx.createImageData(state.width, state.height);
  if (state.pixels && state.pixels.length === image.data.length) {
    image.data.set(state.pixels);
  }

  scratch.width = state.width;
  scratch.height = state.height;
  scratchCtx.putImageData(image, 0, 0);

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    scratch,
    0,
    0,
    state.width,
    state.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  ctx.restore();

  if (state.showGrid && state.zoom >= 4) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.width; x += 1) {
      const px = x * displayScaleX + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, state.height * displayScaleY);
      ctx.stroke();
    }
    for (let y = 0; y <= state.height; y += 1) {
      const py = y * displayScaleY + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(state.width * displayScaleX, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = '#4da3ff';
  ctx.lineWidth = Math.max(1, Math.floor(state.zoom / 4));
  ctx.strokeRect(
    state.caretX * displayScaleX + 0.5,
    state.caretY * displayScaleY + 0.5,
    displayScaleX - 1,
    displayScaleY - 1
  );
  ctx.restore();

  refreshColorPreview();
  updateStatus();
};

const setMode = (modeId, width, height) => {
  const mode = modes[modeId];
  if (!mode) return;
  state.mode = mode;
  state.width = width ?? mode.width;
  state.height = height ?? mode.height;
  state.scaleX = mode.scaleX ?? 1;
  state.scaleY = mode.scaleY ?? 1;
  state.palette = new Palette(mode.COLORS);
  state.fg = state.palette.getColor(state.palette.length - 1);
  state.bg = state.palette.getColor(0);
  state.undo = [];
  state.redo = [];
  state.caretX = clamp(state.caretX, 0, state.width - 1);
  state.caretY = clamp(state.caretY, 0, state.height - 1);
  state.pixels = decode(state.mode, state.palette, null, {
    width: state.width,
    height: state.height,
  });
  updatePalette();
  updateToolbox();
  render();
};

const updateDimensionInputs = () => {
  const mode = modes[elements.modeSelect.value];
  const fixed = mode.width && mode.height;
  if (fixed) {
    elements.widthInput.value = mode.width;
    elements.heightInput.value = mode.height;
    elements.widthInput.disabled = true;
    elements.heightInput.disabled = true;
  } else {
    elements.widthInput.disabled = false;
    elements.heightInput.disabled = false;
  }
};

const openNewDialog = () => {
  updateDimensionInputs();
  elements.newDialog.showModal();
};

const requestDimensions = (width, height) =>
  new Promise((resolve, reject) => {
    pendingDimensionResolve = resolve;
    pendingDimensionReject = reject;
    elements.dimWidth.value = width ?? 16;
    elements.dimHeight.value = height ?? 16;
    elements.dimensionDialog.showModal();
  });

const handleNewSubmit = (ev) => {
  ev.preventDefault();
  const modeId = elements.modeSelect.value;
  const width = parseInt(elements.widthInput.value, 10);
  const height = parseInt(elements.heightInput.value, 10);
  elements.newDialog.close();
  setMode(modeId, width, height);
};

const handleSettingsSubmit = (ev) => {
  ev.preventDefault();
  state.showGrid = elements.prefGrid.checked;
  const z = parseInt(elements.prefZoom.value, 10) ?? state.zoom;
  setZoom(z);
  elements.settingsDialog.close();
};

const handleFileOpen = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const mode = detectMode(file.name, buffer.byteLength);
    if (!mode) {
      throw new Error('Could not detect file format');
    }
    if (!mode.width || !mode.height) {
      const { width, height } = await requestDimensions(
        mode.width,
        mode.height
      );
      setMode(mode.id, width, height);
    } else if (mode.id !== state.mode.id) {
      setMode(mode.id);
    }
    state.pixels = decode(state.mode, state.palette, buffer, {
      width: state.width,
      height: state.height,
    });
    render();
  } catch (err) {
    if (err && err.message !== 'cancelled') {
      alert(`Open failed: ${err.message}`);
      console.error(err);
    }
  }
};

const IMAGE_FORMATS = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const getExtension = (filename) => {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
};

const pixelsToBlob = (mimeType) =>
  new Promise((resolve, reject) => {
    const image = new ImageData(
      new Uint8ClampedArray(state.pixels),
      state.width,
      state.height
    );
    const outCanvas = document.createElement('canvas');
    outCanvas.width = state.width;
    outCanvas.height = state.height;
    const outCtx = outCanvas.getContext('2d');
    outCtx.putImageData(image, 0, 0);
    outCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not encode image'));
        return;
      }
      resolve(blob);
    }, mimeType);
  });

const buildSaveBlob = async (ext) => {
  const mimeType = IMAGE_FORMATS[ext];
  if (mimeType) {
    return pixelsToBlob(mimeType);
  }
  const payload = encode(state.mode, state.palette, state.pixels, {
    width: state.width,
    height: state.height,
  });
  return new Blob([payload], { type: 'application/octet-stream' });
};

const saveFile = async () => {
  try {
    const defaultName = `image.${state.mode.ext.toLowerCase()}`;
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'Modern images',
            accept: {
              'image/png': ['.png'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/webp': ['.webp'],
            },
          },
          {
            description: 'Apple II image formats',
            accept: {
              'application/octet-stream': [
                '.gr',
                '.dgr',
                '.hgr',
                '.dhgr',
                '.pixmap',
                '.bitmap',
              ],
            },
          },
        ],
      });
      const filename = handle.name || defaultName;
      const ext = getExtension(filename);
      const blob = await buildSaveBlob(ext);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    const blob = await buildSaveBlob(getExtension(defaultName));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    alert(`Save failed: ${err.message}`);
  }
};

const setupToolbar = () => {
  document.getElementById('newButton').addEventListener('click', openNewDialog);
  document
    .getElementById('openButton')
    .addEventListener('click', () => elements.fileInput.click());
  document.getElementById('saveButton').addEventListener('click', saveFile);
  document
    .getElementById('settingsButton')
    .addEventListener('click', () => elements.settingsDialog.showModal());
  document
    .getElementById('aboutButton')
    .addEventListener('click', () => elements.aboutDialog.showModal());

  document.getElementById('swapColors').addEventListener('click', () => {
    [state.fg, state.bg] = [state.bg, state.fg];
    refreshColorPreview();
  });

  document.getElementById('undoButton').addEventListener('click', undo);
  document.getElementById('redoButton').addEventListener('click', redo);

  document
    .getElementById('zoomIn')
    .addEventListener('click', () => setZoom(state.zoom + 1));
  document
    .getElementById('zoomOut')
    .addEventListener('click', () => setZoom(state.zoom - 1));

  elements.gridToggle.addEventListener('change', (ev) => {
    state.showGrid = ev.target.checked;
    render();
  });

  if (elements.hgrModeSelect) {
    elements.hgrModeSelect.addEventListener('change', (ev) => {
      const mode = ev.target.value;
      if (!isHgrMode(mode)) return;
      const payload = encode(state.mode, state.palette, state.pixels);
      setMode(mode);
      state.pixels = decode(state.mode, state.palette, payload);
      render();
    });
  }

  if (elements.dhgrModeSelect) {
    elements.dhgrModeSelect.addEventListener('change', (ev) => {
      const mode = ev.target.value;
      if (!isDhgrMode(mode)) return;
      const payload = encode(state.mode, state.palette, state.pixels);
      setMode(mode);
      state.pixels = decode(state.mode, state.palette, payload);
      render();
    });
  }

  if (elements.toolButtons) {
    elements.toolButtons.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });
  }

  elements.fileInput.addEventListener('change', (ev) => {
    const file = ev.target.files?.[0];
    if (file) handleFileOpen(file);
    elements.fileInput.value = '';
  });
};

const setupDialogs = () => {
  elements.modeSelect.addEventListener('change', updateDimensionInputs);
  elements.newForm.addEventListener('submit', handleNewSubmit);
  elements.newForm.addEventListener('reset', () => elements.newDialog.close());

  elements.settingsForm = document.getElementById('settingsForm');
  elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
  elements.settingsForm.addEventListener('reset', () =>
    elements.settingsDialog.close()
  );

  elements.dimensionForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const width = parseInt(elements.dimWidth.value, 10);
    const height = parseInt(elements.dimHeight.value, 10);
    elements.dimensionDialog.close();
    if (pendingDimensionResolve) pendingDimensionResolve({ width, height });
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
  elements.dimensionForm.addEventListener('reset', () => {
    elements.dimensionDialog.close();
    if (pendingDimensionReject) pendingDimensionReject(new Error('cancelled'));
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
  elements.dimensionDialog.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    elements.dimensionDialog.close();
    if (pendingDimensionReject) pendingDimensionReject(new Error('cancelled'));
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
};

const setupCanvasDrawing = () => {
  let drawing = false;
  let drawColor = state.fg;
  let dragX = -1;
  let dragY = -1;

  const pickColorFromEvent = (ev) => {
    return ev.ctrlKey ? state.bg : state.fg;
  };

  const toPixel = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const displayScaleX = canvas.width / state.width;
    const displayScaleY = canvas.height / state.height;
    const x = Math.floor(((ev.clientX - rect.left) * scaleX) / displayScaleX);
    const y = Math.floor(((ev.clientY - rect.top) * scaleY) / displayScaleY);
    return { x, y };
  };

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  canvas.addEventListener(
    'wheel',
    (ev) => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const direction = Math.sign(ev.deltaY);
      if (direction === 0) return;
      setZoom(state.zoom - direction);
    },
    { passive: false }
  );

  canvas.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const { x, y } = toPixel(ev);
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    drawColor = pickColorFromEvent(ev);
    state.caretX = dragX = x;
    state.caretY = dragY = y;
    pushUndo();
    if (state.tool === TOOLS.FILL) {
      floodFill(x, y, drawColor, getPixel, setPixel, state.width, state.height);
      render();
      drawing = false;
      return;
    }
    if (state.tool === TOOLS.PENCIL) {
      drawing = true;
      applyDraw(x, y, drawColor);
      return;
    }
    drawing = true; // line or rect wait for mouseup
  });

  canvas.addEventListener('mousemove', (ev) => {
    if (!drawing) return;
    const { x, y } = toPixel(ev);
    if (state.tool === TOOLS.PENCIL) {
      applyDraw(x, y, drawColor);
    } else {
      state.caretX = x;
      state.caretY = y;
    }
  });

  const finishShape = (ev) => {
    if (!drawing) return;
    const { x, y } = ev ? toPixel(ev) : state.caret;
    drawing = false;
    if (dragX < 0 || dragY < 0) return;
    if (state.tool === TOOLS.LINE) {
      drawLine(
        dragX,
        dragY,
        x,
        y,
        drawColor,
        setPixel,
        state.width,
        state.height
      );
      render();
    } else if (state.tool === TOOLS.RECT) {
      drawRect(
        dragX,
        dragY,
        x,
        y,
        drawColor,
        setPixel,
        state.width,
        state.height
      );
      render();
    }
    dragX = dragY = -1;
  };

  window.addEventListener('mouseup', finishShape);
  canvas.addEventListener('mouseleave', finishShape);
};

const moveCaretAfterDraw = (dx, dy, draw) => {
  if (draw) {
    pushUndo();
    setPixel(state.caretX, state.caretY, state.fg);
  }
  state.caretX = clamp(state.caretX + dx, 0, state.width - 1);
  state.caretY = clamp(state.caretY + dy, 0, state.height - 1);
  render();
};

const handleKeyboard = () => {
  window.addEventListener('keydown', (ev) => {
    if (
      ev.target instanceof HTMLInputElement ||
      ev.target instanceof HTMLSelectElement ||
      ev.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (ev.ctrlKey && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      undo();
      return;
    }
    if (ev.ctrlKey && ev.key.toLowerCase() === 'y') {
      ev.preventDefault();
      redo();
      return;
    }
    switch (ev.key) {
      case 'ArrowUp':
        moveCaretAfterDraw(0, -1, ev.shiftKey);
        ev.preventDefault();
        break;
      case 'ArrowDown':
        moveCaretAfterDraw(0, 1, ev.shiftKey);
        ev.preventDefault();
        break;
      case 'ArrowLeft':
        moveCaretAfterDraw(-1, 0, ev.shiftKey);
        ev.preventDefault();
        break;
      case 'ArrowRight':
        moveCaretAfterDraw(1, 0, ev.shiftKey);
        ev.preventDefault();
        break;
      case 'd':
      case 'D':
        pushUndo();
        applyDraw(state.caretX, state.caretY, state.fg);
        ev.preventDefault();
        break;
      case 'e':
      case 'E':
        pushUndo();
        applyDraw(state.caretX, state.caretY, state.bg);
        ev.preventDefault();
        break;
      case 's':
      case 'S':
        [state.fg, state.bg] = [state.bg, state.fg];
        refreshColorPreview();
        ev.preventDefault();
        break;
      case '+':
      case '=':
        setZoom(ev.ctrlKey ? MAX_ZOOM : state.zoom + 1);
        ev.preventDefault();
        break;
      case '-':
        setZoom(ev.ctrlKey ? MIN_ZOOM : state.zoom - 1);
        ev.preventDefault();
        break;
      default:
        break;
    }
  });
};

const init = () => {
  setMode('gr');
  setupToolbar();
  setupDialogs();
  setupCanvasDrawing();
  handleKeyboard();
  setTool(state.tool);
};

init();

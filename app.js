import {
  clamp,
  colorStringToRGBA,
  detectModeFromFile,
  inferDimensions,
  modeHandlers,
  modes,
  paletteForMode,
} from "./apple2-modes.js";
import { drawLine, drawRect, floodFill } from "./image-tools.js";

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const scratch = document.createElement("canvas");
const scratchCtx = scratch.getContext("2d");
scratchCtx.imageSmoothingEnabled = false;

const elements = {
  newDialog: document.getElementById("newDialog"),
  newForm: document.getElementById("newForm"),
  modeSelect: document.getElementById("modeSelect"),
  widthInput: document.getElementById("widthInput"),
  heightInput: document.getElementById("heightInput"),
  settingsDialog: document.getElementById("settingsDialog"),
  aboutDialog: document.getElementById("aboutDialog"),
  prefGrid: document.getElementById("prefGrid"),
  prefZoom: document.getElementById("prefZoom"),
  fileInput: document.getElementById("fileInput"),
  fgPreview: document.getElementById("fgPreview"),
  bgPreview: document.getElementById("bgPreview"),
  paletteGrid: document.getElementById("paletteGrid"),
  paletteMeta: document.getElementById("paletteMeta"),
  modeInfo: document.getElementById("modeInfo"),
  zoomInfo: document.getElementById("zoomInfo"),
  cursorPos: document.getElementById("cursorPos"),
  dimensionDialog: document.getElementById("dimensionDialog"),
  dimensionForm: document.getElementById("dimensionForm"),
  dimWidth: document.getElementById("dimWidth"),
  dimHeight: document.getElementById("dimHeight"),
  gridToggle: document.getElementById("gridToggle"),
  toolButtons: document.getElementById("toolButtons"),
};

const state = {
  mode: modes.lores,
  data: null,
  width: modes.lores.width,
  height: modes.lores.height,
  fg: 1,
  bg: 0,
  zoom: 8,
  showGrid: true,
  caret: { x: 0, y: 0 },
  tool: "pencil",
  dragStart: null,
  dragColor: 1,
  undo: [],
  redo: [],
};

let pendingDimensionResolve = null;
let pendingDimensionReject = null;

const ensureDialog = (dialog) => {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    alert("Your browser does not support <dialog>.");
  }
};

const setZoom = (value) => {
  state.zoom = clamp(value, 1, 24);
  render();
};

const updatePaletteGrid = () => {
  const palette = paletteForMode(state.mode);
  elements.paletteGrid.innerHTML = "";
  palette.forEach((color, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch-button";
    btn.style.background = color;
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = idx.toString(16).toUpperCase();
    btn.appendChild(label);
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      state.fg = idx;
      refreshColorPreview();
    });
    btn.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      state.bg = idx;
      refreshColorPreview();
    });
    elements.paletteGrid.appendChild(btn);
  });
  elements.paletteMeta.textContent = `${palette.length} colors`;
};

const refreshColorPreview = () => {
  const palette = paletteForMode(state.mode);
  elements.fgPreview.style.background = palette[state.fg % palette.length] || "#000";
  elements.bgPreview.style.background = palette[state.bg % palette.length] || "#000";
};

const updateStatus = () => {
  elements.modeInfo.textContent = `${state.mode.name} ${state.width}x${state.height} (.${state.mode.ext})`;
  elements.zoomInfo.textContent = `Zoom ${state.zoom}x · ${state.tool}`;
  elements.cursorPos.textContent = `(${state.caret.x}, ${state.caret.y})`;
};

const setTool = (tool) => {
  state.tool = tool;
  if (elements.toolButtons) {
    elements.toolButtons.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    });
  }
  updateStatus();
};

const pushUndo = () => {
  const handler = modeHandlers[state.mode.id];
  if (!handler || !handler.clone) return;
  state.undo.push(handler.clone(state.data));
  if (state.undo.length > 50) state.undo.shift();
  state.redo.length = 0;
};

const restoreData = (data) => {
  state.data = data;
  render();
};

const undo = () => {
  if (!state.undo.length) return;
  const handler = modeHandlers[state.mode.id];
  const snapshot = state.undo.pop();
  state.redo.push(handler.clone(state.data));
  restoreData(snapshot);
};

const redo = () => {
  if (!state.redo.length) return;
  const handler = modeHandlers[state.mode.id];
  const snapshot = state.redo.pop();
  state.undo.push(handler.clone(state.data));
  restoreData(snapshot);
};

const setPixel = (x, y, color) => {
  const handler = modeHandlers[state.mode.id];
  if (!handler) return;
  handler.setPixel(state.data, x, y, color);
};

const getPixel = (x, y) => {
  const handler = modeHandlers[state.mode.id];
  if (!handler) return 0;
  return handler.getPixel(state.data, x, y);
};

const applyDraw = (x, y, color) => {
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
  setPixel(x, y, color);
  state.caret = { x, y };
  render();
};

const render = () => {
  canvas.width = state.width * state.zoom;
  canvas.height = state.height * state.zoom;

  const palette = paletteForMode(state.mode);
  const image = ctx.createImageData(state.width, state.height);
  const data = image.data;
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const idx = (y * state.width + x) * 4;
      const colorIdx = getPixel(x, y) % palette.length;
      const [r, g, b, a] = colorStringToRGBA(palette[colorIdx] || "#000000");
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }

  scratch.width = state.width;
  scratch.height = state.height;
  scratchCtx.putImageData(image, 0, 0);

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scratch, 0, 0, state.width, state.height, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (state.showGrid && state.zoom >= 4) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.width; x += 1) {
      const px = x * state.zoom + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, state.height * state.zoom);
      ctx.stroke();
    }
    for (let y = 0; y <= state.height; y += 1) {
      const py = y * state.zoom + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(state.width * state.zoom, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = Math.max(1, Math.floor(state.zoom / 4));
  ctx.strokeRect(
    state.caret.x * state.zoom + 0.5,
    state.caret.y * state.zoom + 0.5,
    state.zoom - 1,
    state.zoom - 1,
  );
  ctx.restore();

  refreshColorPreview();
  updateStatus();
};

const setMode = (modeId, width, height) => {
  const mode = modes[modeId];
  if (!mode) return;
  state.mode = mode;
  state.width = width || mode.width || state.width;
  state.height = height || mode.height || state.height;
  const handler = modeHandlers[modeId];
  state.data = handler.create({ width: state.width, height: state.height });
  state.undo = [];
  state.redo = [];
  state.fg = 1;
  state.bg = 0;
  updatePaletteGrid();
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
  ensureDialog(elements.newDialog);
};

const requestDimensions = ({ width, height }) => new Promise((resolve, reject) => {
  pendingDimensionResolve = resolve;
  pendingDimensionReject = reject;
  elements.dimWidth.value = width || 64;
  elements.dimHeight.value = height || 64;
  ensureDialog(elements.dimensionDialog);
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
  const z = parseInt(elements.prefZoom.value, 10) || state.zoom;
  setZoom(z);
  elements.settingsDialog.close();
};

const handleFileOpen = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const detectedMode = detectModeFromFile(file.name, buffer.byteLength);
    let width = detectedMode.width;
    let height = detectedMode.height;
    if (detectedMode.id === "pixmap" || detectedMode.id === "bitmap") {
      const inferred = inferDimensions(buffer.byteLength, detectedMode.id);
      width = width || inferred.width || 64;
      height = height || inferred.height || 64;
      const dims = await requestDimensions({ width, height });
      width = parseInt(dims.width, 10);
      height = parseInt(dims.height, 10);
    }
    const handler = modeHandlers[detectedMode.id];
    const data = handler.fromFile(buffer, { width, height });
    state.mode = modes[detectedMode.id];
    state.width = width;
    state.height = height;
    state.data = data;
    state.undo = [];
    state.redo = [];
    updatePaletteGrid();
    render();
  } catch (err) {
    if (err && err.message !== "cancelled") {
      alert(`Open failed: ${err.message}`);
      console.error(err);
    }
  }
};

const saveFile = () => {
  const handler = modeHandlers[state.mode.id];
  if (!handler || !handler.toFile) return;
  try {
    const payload = handler.toFile(state.data);
    const blob = new Blob([payload], { type: "application/octet-stream" });
    const filename = `image.${state.mode.ext.toLowerCase()}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert(`Save failed: ${err.message}`);
  }
};

const setupToolbar = () => {
  document.getElementById("newButton").addEventListener("click", openNewDialog);
  document.getElementById("openButton").addEventListener("click", () => elements.fileInput.click());
  document.getElementById("saveButton").addEventListener("click", saveFile);
  document.getElementById("settingsButton").addEventListener("click", () => ensureDialog(elements.settingsDialog));
  document.getElementById("aboutButton").addEventListener("click", () => ensureDialog(elements.aboutDialog));

  document.getElementById("swapColors").addEventListener("click", () => {
    [state.fg, state.bg] = [state.bg, state.fg];
    refreshColorPreview();
  });

  document.getElementById("undoButton").addEventListener("click", undo);
  document.getElementById("redoButton").addEventListener("click", redo);

  document.getElementById("zoomIn").addEventListener("click", () => setZoom(state.zoom + 1));
  document.getElementById("zoomOut").addEventListener("click", () => setZoom(state.zoom - 1));

  elements.gridToggle.addEventListener("change", (ev) => {
    state.showGrid = ev.target.checked;
    render();
  });

  if (elements.toolButtons) {
    elements.toolButtons.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => setTool(btn.dataset.tool));
    });
  }

  elements.fileInput.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (file) handleFileOpen(file);
    elements.fileInput.value = "";
  });
};

const setupDialogs = () => {
  elements.modeSelect.addEventListener("change", updateDimensionInputs);
  elements.newForm.addEventListener("submit", handleNewSubmit);
  elements.newForm.addEventListener("reset", () => elements.newDialog.close());

  elements.settingsForm = document.getElementById("settingsForm");
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.settingsForm.addEventListener("reset", () => elements.settingsDialog.close());

  elements.dimensionForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const width = parseInt(elements.dimWidth.value, 10);
    const height = parseInt(elements.dimHeight.value, 10);
    elements.dimensionDialog.close();
    if (pendingDimensionResolve) pendingDimensionResolve({ width, height });
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
  elements.dimensionForm.addEventListener("reset", () => {
    elements.dimensionDialog.close();
    if (pendingDimensionReject) pendingDimensionReject(new Error("cancelled"));
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
  elements.dimensionDialog.addEventListener("cancel", (ev) => {
    ev.preventDefault();
    elements.dimensionDialog.close();
    if (pendingDimensionReject) pendingDimensionReject(new Error("cancelled"));
    pendingDimensionResolve = null;
    pendingDimensionReject = null;
  });
};

const setupCanvasDrawing = () => {
  let drawing = false;
  let drawColor = state.fg;

  const pickColorFromEvent = (ev) => {
    if (ev.button === 2 || ev.ctrlKey || ev.metaKey) return state.bg;
    return state.fg;
  };

  const toPixel = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((ev.clientX - rect.left) * scaleX) / state.zoom);
    const y = Math.floor(((ev.clientY - rect.top) * scaleY) / state.zoom);
    return { x, y };
  };

  canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

  canvas.addEventListener("mousedown", (ev) => {
    ev.preventDefault();
    const { x, y } = toPixel(ev);
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    drawColor = pickColorFromEvent(ev);
    state.dragStart = { x, y };
    state.dragColor = drawColor;
    state.caret = { x, y };
    pushUndo();
    if (state.tool === "fill") {
      floodFill(x, y, drawColor, getPixel, setPixel, state.width, state.height);
      render();
      drawing = false;
      return;
    }
    if (state.tool === "pencil") {
      drawing = true;
      applyDraw(x, y, drawColor);
      return;
    }
    drawing = true; // line or rect wait for mouseup
  });

  canvas.addEventListener("mousemove", (ev) => {
    if (!drawing) return;
    const { x, y } = toPixel(ev);
    if (state.tool === "pencil") {
      applyDraw(x, y, drawColor);
    } else {
      state.caret = { x, y };
    }
  });

  const finishShape = (ev) => {
    if (!drawing) return;
    const { x, y } = ev ? toPixel(ev) : state.caret;
    drawing = false;
    if (!state.dragStart) return;
    if (state.tool === "line") {
      drawLine(state.dragStart.x, state.dragStart.y, x, y, drawColor, setPixel, state.width, state.height);
      render();
    } else if (state.tool === "rect") {
      drawRect(state.dragStart.x, state.dragStart.y, x, y, drawColor, setPixel, state.width, state.height);
      render();
    }
    state.dragStart = null;
  };

  window.addEventListener("mouseup", finishShape);
  canvas.addEventListener("mouseleave", finishShape);
};

const drawAtCaretThenMove = (dx, dy) => {
  pushUndo();
  setPixel(state.caret.x, state.caret.y, state.fg);
  state.caret.x = clamp(state.caret.x + dx, 0, state.width - 1);
  state.caret.y = clamp(state.caret.y + dy, 0, state.height - 1);
  render();
};

const handleKeyboard = () => {
  window.addEventListener("keydown", (ev) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLSelectElement || ev.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (ev.ctrlKey && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      undo();
      return;
    }
    if (ev.ctrlKey && ev.key.toLowerCase() === "y") {
      ev.preventDefault();
      redo();
      return;
    }
    switch (ev.key) {
      case "ArrowUp":
        if (ev.shiftKey) {
          drawAtCaretThenMove(0, -1);
        } else {
          state.caret.y = clamp(state.caret.y - 1, 0, state.height - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "ArrowDown":
        if (ev.shiftKey) {
          drawAtCaretThenMove(0, 1);
        } else {
          state.caret.y = clamp(state.caret.y + 1, 0, state.height - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "ArrowLeft":
        if (ev.shiftKey) {
          drawAtCaretThenMove(-1, 0);
        } else {
          state.caret.x = clamp(state.caret.x - 1, 0, state.width - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "ArrowRight":
        if (ev.shiftKey) {
          drawAtCaretThenMove(1, 0);
        } else {
          state.caret.x = clamp(state.caret.x + 1, 0, state.width - 1);
          render();
        }
        ev.preventDefault();
        break;
      case "d":
      case "D":
        pushUndo();
        applyDraw(state.caret.x, state.caret.y, state.fg);
        ev.preventDefault();
        break;
      case "e":
      case "E":
        pushUndo();
        applyDraw(state.caret.x, state.caret.y, state.bg);
        ev.preventDefault();
        break;
      case "s":
      case "S":
        [state.fg, state.bg] = [state.bg, state.fg];
        refreshColorPreview();
        ev.preventDefault();
        break;
      case "+":
      case "=":
        setZoom(state.zoom + 1);
        ev.preventDefault();
        break;
      case "-":
        setZoom(state.zoom - 1);
        ev.preventDefault();
        break;
      default:
        break;
    }
  });
};

const init = () => {
  setupToolbar();
  setupDialogs();
  setupCanvasDrawing();
  handleKeyboard();
  setTool(state.tool);
  setMode("lores", modes.lores.width, modes.lores.height);
};

init();

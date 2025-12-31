export const drawLine = (x0, y0, x1, y1, color, setPixel, width, height) => {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    if (x >= 0 && y >= 0 && x < width && y < height) {
      setPixel(x, y, color);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};

export const drawRect = (x0, y0, x1, y1, color, setPixel, width, height) => {
  const minX = Math.max(Math.min(x0, x1), 0);
  const maxX = Math.min(Math.max(x0, x1), width - 1);
  const minY = Math.max(Math.min(y0, y1), 0);
  const maxY = Math.min(Math.max(y0, y1), height - 1);
  for (let x = minX; x <= maxX; x += 1) {
    setPixel(x, minY, color);
    setPixel(x, maxY, color);
  }
  for (let y = minY; y <= maxY; y += 1) {
    setPixel(minX, y, color);
    setPixel(maxX, y, color);
  }
};

export const drawRectFilled = (
  x0,
  y0,
  x1,
  y1,
  fillColor,
  borderColor,
  setPixel,
  width,
  height
) => {
  const minX = Math.max(Math.min(x0, x1), 0);
  const maxX = Math.min(Math.max(x0, x1), width - 1);
  const minY = Math.max(Math.min(y0, y1), 0);
  const maxY = Math.min(Math.max(y0, y1), height - 1);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      setPixel(x, y, fillColor);
    }
  }
  drawRect(minX, minY, maxX, maxY, borderColor, setPixel, width, height);
};

export const drawEllipse = (x0, y0, x1, y1, color, setPixel, width, height) => {
  const minX = Math.max(Math.min(x0, x1), 0);
  const maxX = Math.min(Math.max(x0, x1), width - 1);
  const minY = Math.max(Math.min(y0, y1), 0);
  const maxY = Math.min(Math.max(y0, y1), height - 1);
  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;
  const cx = minX + rx;
  const cy = minY + ry;

  if (rx === 0 || ry === 0) {
    drawLine(minX, minY, maxX, maxY, color, setPixel, width, height);
    return;
  }

  for (let x = minX; x <= maxX; x += 1) {
    const dx = (x - cx) / rx;
    const dy = Math.sqrt(Math.max(0, 1 - dx * dx)) * ry;
    const y1 = Math.round(cy - dy);
    const y2 = Math.round(cy + dy);
    if (y1 >= 0 && y1 < height) setPixel(x, y1, color);
    if (y2 >= 0 && y2 < height) setPixel(x, y2, color);
  }

  for (let y = minY; y <= maxY; y += 1) {
    const dy = (y - cy) / ry;
    const dx = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    const x1 = Math.round(cx - dx);
    const x2 = Math.round(cx + dx);
    if (x1 >= 0 && x1 < width) setPixel(x1, y, color);
    if (x2 >= 0 && x2 < width) setPixel(x2, y, color);
  }
};

export const drawEllipseFilled = (
  x0,
  y0,
  x1,
  y1,
  fillColor,
  borderColor,
  setPixel,
  width,
  height
) => {
  const minX = Math.max(Math.min(x0, x1), 0);
  const maxX = Math.min(Math.max(x0, x1), width - 1);
  const minY = Math.max(Math.min(y0, y1), 0);
  const maxY = Math.min(Math.max(y0, y1), height - 1);
  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;
  const cx = minX + rx;
  const cy = minY + ry;

  if (rx === 0 || ry === 0) {
    drawLine(minX, minY, maxX, maxY, borderColor, setPixel, width, height);
    return;
  }

  for (let y = minY; y <= maxY; y += 1) {
    const dy = (y - cy) / ry;
    const dx = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    const x1 = Math.round(cx - dx);
    const x2 = Math.round(cx + dx);
    for (let x = x1; x <= x2; x += 1) {
      if (x >= 0 && x < width) setPixel(x, y, fillColor);
    }
  }
  drawEllipse(minX, minY, maxX, maxY, borderColor, setPixel, width, height);
};

export const floodFill = (sx, sy, color, getPixel, setPixel, width, height) => {
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return;
  const target = getPixel(sx, sy);
  if (target === color) return;
  const stack = [[sx, sy]];
  const visited = new Set();
  const key = (x, y) => `${x},${y}`;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const k = key(x, y);
    if (visited.has(k)) continue;
    visited.add(k);
    if (getPixel(x, y) !== target) continue;
    setPixel(x, y, color);
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
};

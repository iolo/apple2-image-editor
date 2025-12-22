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

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";

const CONTENT_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
};

const findChromium = async () => {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || process.env.CHROME_PATH;
  if (envPath) return envPath;
  const candidates = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      return candidate;
    } catch {
      // ignore missing
    }
  }
  throw new Error("Chromium/Chrome not found. Set PLAYWRIGHT_CHROMIUM_PATH or CHROME_PATH.");
};

const createServer = () => {
  const root = process.cwd();
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = normalize(join(root, path));
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const data = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream" });
      res.end(data);
    } catch (err) {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sampleCanvasColor = async (page, selector, pixelX, pixelY) => {
  return page.evaluate(({ selector, pixelX, pixelY }) => {
    const canvas = document.querySelector(selector);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(pixelX, pixelY, 1, 1).data;
    return Array.from(data);
  }, { selector, pixelX, pixelY });
};

const run = async () => {
  const chromePath = await findChromium();
  const { server, port } = await createServer();
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#drawingCanvas");

    await page.click("#newButton");
    await page.waitForSelector("#newDialog[open]");
    await page.click("#newDialog button[type=submit]");

    const canvasBox = await page.locator("#drawingCanvas").boundingBox();
    assert(canvasBox, "Canvas not found");

    const clickX = canvasBox.x + 4;
    const clickY = canvasBox.y + 4;
    await page.mouse.click(clickX, clickY);

    const color = await sampleCanvasColor(page, "#drawingCanvas", 4, 4);
    assert(color, "Failed to sample canvas color");

    const [r, g, b, a] = color;
    assert(r === 221 && g === 0 && b === 51 && a === 255, "Unexpected pixel color after draw");
  } finally {
    await browser.close();
    server.close();
  }
};

run()
  .then(() => {
    console.log("E2E check passed.");
  })
  .catch((err) => {
    console.error("E2E check failed:");
    console.error(err.message || err);
    process.exit(1);
  });

import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const assets = [
  'index.html',
  'style.css',
  'app.mjs',
  'desktop.mjs',
  'apple2.mjs',
  'bitmap.mjs',
  'convert.mjs',
  'dgr.mjs',
  'dhgr.mjs',
  'gr.mjs',
  'hgr.mjs',
  'pixmap.mjs',
  'splash.mjs',
  'tools.mjs',
  'favicon.ico',
  'PRNumber3.ttf',
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(
  assets.map((asset) => cp(path.join(root, asset), path.join(output, asset)))
);

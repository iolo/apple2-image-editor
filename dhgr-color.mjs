import { HGR_OFFSET } from './hgr-color.mjs';

export const COLORS = [
  '#000000',
  '#011EA9',
  '#00872D',
  '#2F45FF',
  '#9A6800',
  '#B9B9B9',
  '#00DE00',
  '#53FAD0',
  '#E72442',
  '#E649E4',
  '#686868',
  '#78BBFF',
  '#FF7C00',
  '#FFAB99',
  '#FFFC00',
  '#FFFFFF',
];

// |bank        | AUX        |MAIN         | AUX         | MAIN       |   |
// |------------|------------|-------------+-------------|------------|---|
// |address     | $2000      |$2000        | $2001       | $2001      |...|
// |------------|------------|-------------+-------------|------------|---|
// |bit offset  | 7 654 3210 | 7 65 4321 0 | 7 6 5432 10 | 7 6543 210 |...|
// |pixel       | - BBB AAAA | - DD CCCC B | - F EEEE DD | - GGGG FFF |...|
// |pixel offset| - 123 0123 | - 23 0123 0 | - 3 0123 01 | - 0123 012 |...|
// |x           |   1   0    |   3  2    1 |   5 4    3  |   6    5   |...|

let main;
let aux;

export function init(buffer) {
  main = new Uint8Array(buffer.slice(0, 0x2000));
  aux = new Uint8Array(buffer.slice(0x2000));
}

export function toBufr() {
  return new Uint8Buffer(framebuffer);
}

function pixelOffset(x, y) {
  return HGR_OFFSET[y] + (x >> 3);
}

export function getPixel(x, y) {
  const offset = pixelOffset(x, y);
  const byte0 = aux[offset];
  const byte1 = main[offset];
  const byte2 = aux[offset + 1];
  const byte3 = main[offset + 1];

  // TODO: 4bits of byte0..byte3
}
export function setPixel(x, y, color) {
  const offset = pixelOffset(x, y);
  const byte0 = aux[offset];
  const byte1 = main[offset];
  const byte2 = aux[offset + 1];
  const byte3 = main[offset + 1];
  // TODO: 4bits of byte0..byte3
}

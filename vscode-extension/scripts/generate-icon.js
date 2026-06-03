// Generates resources/icon.png (128x128) — a white checkmark on an indigo
// rounded square. Dependency-free: draws into an RGBA buffer and encodes a PNG
// with Node's built-in zlib. Re-run with `node scripts/generate-icon.js`.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 128;
const H = 128;
const buf = Buffer.alloc(W * H * 4); // RGBA, transparent

function set(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
}

// Rounded-square background (indigo #4F46E5).
const R = 18;
function inRounded(x, y) {
  const left = x < R;
  const right = x > W - 1 - R;
  const top = y < R;
  const bottom = y > H - 1 - R;
  if ((left || right) && (top || bottom)) {
    const cx = left ? R : W - 1 - R;
    const cy = top ? R : H - 1 - R;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= R * R;
  }
  return true;
}
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (inRounded(x, y)) set(x, y, 79, 70, 229, 255);
  }
}

// White checkmark.
function dot(x, y, t) {
  for (let dy = -t; dy <= t; dy++) {
    for (let dx = -t; dx <= t; dx++) {
      if (dx * dx + dy * dy <= t * t) set(x + dx, y + dy, 255, 255, 255, 255);
    }
  }
}
function line(x0, y0, x1, y1, t) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    dot(x0, y0, t);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}
line(38, 68, 56, 88, 8);
line(56, 88, 94, 42, 8);

// PNG encode.
const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length >>> 0, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // colour type RGBA
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter: none
  buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'resources', 'icon.png');
fs.writeFileSync(out, png);
console.log('Wrote', out, png.length, 'bytes');

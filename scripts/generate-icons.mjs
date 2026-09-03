/**
 * Generates brand placeholder assets (no external dependencies):
 *  - public/icon-192.png, public/icon-512.png (PWA manifest)
 *  - public/apple-touch-icon.png (180x180)
 *  - public/favicon.ico (16 + 32)
 *  - public/og-image.png (1200x630)
 *
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');

// ---------- PNG encoding ----------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
};

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
};

const encodePng = (width, height, pixelAt) => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Each scanline is prefixed with a filter byte (0 = none)
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      const offset = rowStart + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

// ---------- Watch artwork ----------

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp01(((px - ax) * dx + (py - ay) * dy) / lengthSq);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};

const drawWatch = (width, height) => {
  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;

  const gradientTop = [15, 23, 42]; // #0f172a
  const gradientBottom = [40, 73, 165]; // #2849a5
  const gold = [212, 175, 55]; // #d4af37
  const face = [13, 21, 38]; // #0d1526
  const hand = [248, 250, 252]; // #f8fafc

  const bezelOuter = size * 0.44;
  const bezelInner = bezelOuter - size * 0.035;
  const handWidth = Math.max(1.5, size * 0.012);

  // 10:10 hand positions (degrees from 12 o'clock, clockwise)
  const minuteDeg = 60;
  const hourDeg = 300;
  const minuteLength = size * 0.3;
  const hourLength = size * 0.21;
  const minuteAngle = (minuteDeg * Math.PI) / 180;
  const hourAngle = (hourDeg * Math.PI) / 180;
  const minuteTip = [
    cx + Math.cos(minuteAngle) * minuteLength,
    cy + Math.sin(minuteAngle) * minuteLength,
  ];
  const hourTip = [cx + Math.cos(hourAngle) * hourLength, cy + Math.sin(hourAngle) * hourLength];

  return (x, y) => {
    const t = clamp01(y / height);
    let color = [
      lerp(gradientTop[0], gradientBottom[0], t),
      lerp(gradientTop[1], gradientBottom[1], t),
      lerp(gradientTop[2], gradientBottom[2], t),
    ];

    const d = Math.hypot(x - cx, y - cy);

    if (d <= bezelOuter && d >= bezelInner) {
      color = gold;
    } else if (d < bezelInner) {
      color = face;
      // Index markers at 12, 3, 6, 9 o'clock
      const markerRadius = bezelInner * 0.86;
      for (const deg of [270, 0, 90, 180]) {
        const rad = (deg * Math.PI) / 180;
        const mx = cx + Math.cos(rad) * markerRadius;
        const my = cy + Math.sin(rad) * markerRadius;
        if (Math.hypot(x - mx, y - my) <= Math.max(1.2, size * 0.014)) {
          color = gold;
        }
      }
      // Hands
      if (distToSegment(x, y, cx, cy, minuteTip[0], minuteTip[1]) <= handWidth / 2) {
        color = hand;
      }
      if (distToSegment(x, y, cx, cy, hourTip[0], hourTip[1]) <= handWidth / 2) {
        color = hand;
      }
      // Center cap
      if (d <= Math.max(1.2, size * 0.018)) {
        color = gold;
      }
    }

    return [color[0], color[1], color[2], 255];
  };
};

// ---------- ICO encoding ----------

const encodeIco = (pngBuffers) => {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + 16 * count;
  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16);
    // ICO stores square dimensions in a byte; 0 means 256.
    const width = png.readUInt32BE(16); // IHDR width
    const height = png.readUInt32BE(20); // IHDR height
    entry[0] = width === 256 ? 0 : width;
    entry[1] = height === 256 ? 0 : height;
    entry[2] = 0; // palette
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
};

// ---------- Output ----------

const pixel = (w, h) => (x, y) => drawWatch(w, h)(Math.floor(x), Math.floor(y));

mkdirSync(PUBLIC_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', width: 192, height: 192 },
  { file: 'icon-512.png', width: 512, height: 512 },
  { file: 'apple-touch-icon.png', width: 180, height: 180 },
  { file: 'og-image.png', width: 1200, height: 630 },
];

for (const target of targets) {
  const png = encodePng(target.width, target.height, pixel(target.width, target.height));
  writeFileSync(join(PUBLIC_DIR, target.file), png);
  console.log(`✓ ${target.file} (${target.width}x${target.height}, ${png.length} bytes)`);
}

const favicon16 = encodePng(16, 16, pixel(16, 16));
const favicon32 = encodePng(32, 32, pixel(32, 32));
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), encodeIco([favicon16, favicon32]));
console.log('✓ favicon.ico (16 + 32)');

console.log('Assets written to public/.');

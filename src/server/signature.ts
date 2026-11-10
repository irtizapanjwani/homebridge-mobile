/// <reference types="node" />
// The app's signature pad records strokes (SVG "M x,y L x,y …" paths). The website's PDF code embeds
// a PNG, so the strokes are drawn into a small transparent PNG here — no image library needed.

import { deflateSync } from 'node:zlib';

export type DrawnSignature = { paths: string[]; width: number; height: number };

const SCALE = 2; // sharper on the printed form
const RADIUS = 1.4 * SCALE; // pen half-width
const INK = [0x1a, 0x1d, 0x1a];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Checks the strokes and draws them as a PNG data URL, or returns null if there's nothing usable. */
export function signatureToPngDataUrl(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null;
  const { paths, width, height } = input as Partial<DrawnSignature>;
  if (!Array.isArray(paths) || !paths.length || paths.length > 200) return null;
  const w = Math.round(Math.min(Math.max(Number(width) || 0, 50), 900));
  const h = Math.round(Math.min(Math.max(Number(height) || 0, 50), 400));
  const strokes: [number, number][][] = [];
  let points = 0;
  for (const p of paths) {
    if (typeof p !== 'string' || p.length > 40_000) return null;
    const pts = [...p.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
    points += pts.length;
    if (pts.length) strokes.push(pts);
  }
  if (!strokes.length || points > 20_000) return null;

  const W = w * SCALE;
  const H = h * SCALE;
  const px = new Uint8Array(W * H); // coverage 0..255
  const dot = (cx: number, cy: number) => {
    const x0 = Math.max(0, Math.floor(cx - RADIUS - 1));
    const x1 = Math.min(W - 1, Math.ceil(cx + RADIUS + 1));
    const y0 = Math.max(0, Math.floor(cy - RADIUS - 1));
    const y1 = Math.min(H - 1, Math.ceil(cy + RADIUS + 1));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const a = Math.max(0, Math.min(1, RADIUS + 0.5 - d)); // soft edge
        const v = Math.round(a * 255);
        if (v > px[y * W + x]) px[y * W + x] = v;
      }
  };
  for (const s of strokes) {
    const pts = s.map(([x, y]) => [x * SCALE, y * SCALE] as const);
    dot(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.75));
      for (let t = 1; t <= steps; t++) dot(ax + ((bx - ax) * t) / steps, ay + ((by - ay) * t) / steps);
    }
  }

  // RGBA rows, each starting with filter byte 0.
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    const row = y * (1 + W * 4);
    for (let x = 0; x < W; x++) {
      const o = row + 1 + x * 4;
      raw[o] = INK[0];
      raw[o + 1] = INK[1];
      raw[o + 2] = INK[2];
      raw[o + 3] = px[y * W + x];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

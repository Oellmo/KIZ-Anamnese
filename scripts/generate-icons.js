import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Function to generate a valid PNG Buffer with RGBA colors
function createPng(width, height, isMaskable = false) {
  // CRC32 implementation
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Construct raw uncompressed RGBA scanlines
  // Each scanline: 1 byte filter (0 = None) + width * 4 bytes RGBA
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;
  const safeScale = isMaskable ? scale * 0.75 : scale;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Base Emerald-to-Teal Gradient background
      // Emerald: #047857 (4, 120, 87) -> Teal: #0d9488 (13, 148, 136)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(4 + (13 - 4) * gradRatio);
      let g = Math.round(120 + (148 - 120) * gradRatio);
      let b = Math.round(87 + (136 - 87) * gradRatio);
      let a = 255;

      const dx = (x - cx) / safeScale;
      const dy = (y - cy) / safeScale;

      // Draw emblem in center: Shield and Medical Cross
      // Shield boundary approx:
      const inShieldX = Math.abs(dx) <= 120;
      const inShieldY = dy >= -160 && dy <= (130 - Math.abs(dx) * 0.6);
      
      // Cross shape
      const inCrossH = Math.abs(dx) <= 60 && Math.abs(dy + 15) <= 18;
      const inCrossV = Math.abs(dx) <= 18 && Math.abs(dy + 15) <= 60;
      const inCross = inCrossH || inCrossV;

      // Checkmark at bottom of shield
      const inCheck1 = Math.abs(dx + 25 - (dy - 90)) < 10 && dx >= -50 && dx <= 0;
      const inCheck2 = Math.abs(dx - 15 + (dy - 90) * 0.8) < 10 && dx >= -5 && dx <= 60;
      const inCheck = inCheck1 || inCheck2;

      if (inCross) {
        // Pure White
        r = 255; g = 255; b = 255;
      } else if (inCheck) {
        // Light Mint/Emerald: #6ee7b7
        r = 110; g = 231; b = 183;
      } else if (inShieldX && inShieldY) {
        // Subtle lighter overlay in shield body
        r = Math.min(255, r + 25);
        g = Math.min(255, g + 25);
        b = Math.min(255, b + 25);
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk (zlib deflate)
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 192x192 standard icon
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
console.log('Created public/pwa-192x192.png');

// 2. Generate 512x512 standard icon
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
console.log('Created public/pwa-512x512.png');

// 3. Generate 512x512 maskable icon with safe zone
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
console.log('Created public/pwa-maskable-512x512.png');

// 4. Generate 180x180 Apple touch icon for iOS Safari
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
console.log('Created public/apple-touch-icon.png');

// 5. Generate 64x64 favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));
console.log('Created public/favicon.ico');

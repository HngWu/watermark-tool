import { crc32 } from './crypto';
import { dct8x8, idct8x8 } from './dct';

export interface WatermarkPayload {
  recipient: string;
  timestamp: string;
  trackingId: string;
  crc32: string; // hex string
  signature?: string; // Phase 2: cryptographic signature
}

const START_MARKER = 'WMSTART:';
const END_MARKER = ':WMEND';

export const applyInvisibleWatermarkToData = (
  imageData: ImageData,
  trackingData: string
): void => {
  const { width, height, data: mainData } = imageData;
  const encodedData = btoa(unescape(encodeURIComponent(trackingData)));
  const fullData = START_MARKER + encodedData + END_MARKER;

  const bits: number[] = [];
  for (let i = 0; i < fullData.length; i++) {
    const code = fullData.charCodeAt(i);
    for (let j = 7; j >= 0; j--) {
      bits.push((code >> j) & 1);
    }
  }

  const regions = [
    { x: 0, y: 0, w: Math.floor(width / 2), h: Math.floor(height / 2) },
    { x: Math.floor(width / 4), y: Math.floor(height / 4), w: Math.floor(width / 2), h: Math.floor(height / 2) },
    { x: Math.floor(width / 2), y: Math.floor(height / 2), w: Math.floor(width / 2), h: Math.floor(height / 2) },
  ];

  for (const region of regions) {
    let bitIndex = 0;
    for (let y = region.y; y < region.y + region.h && bitIndex < bits.length; y++) {
      for (let x = region.x; x < region.x + region.w && bitIndex < bits.length; x++) {
        const i = (y * width + x) * 4;
        if (bitIndex < bits.length) mainData[i + 0] = (mainData[i + 0] & 0xFE) | bits[bitIndex++];
        if (bitIndex < bits.length) mainData[i + 1] = (mainData[i + 1] & 0xFE) | bits[bitIndex++];
        if (bitIndex < bits.length) mainData[i + 2] = (mainData[i + 2] & 0xFE) | bits[bitIndex++];
      }
    }
  }
};

export const extractInvisibleWatermarkFromData = (
  imageData: ImageData
): { payload: WatermarkPayload | null; tampered: boolean } => {
  const { width, height, data: mainData } = imageData;
  const regions = [
    { x: 0, y: 0, w: Math.floor(width / 2), h: Math.floor(height / 2) },
    { x: Math.floor(width / 4), y: Math.floor(height / 4), w: Math.floor(width / 2), h: Math.floor(height / 2) },
    { x: Math.floor(width / 2), y: Math.floor(height / 2), w: Math.floor(width / 2), h: Math.floor(height / 2) },
  ];

  const validCandidates: WatermarkPayload[] = [];
  const corruptedCandidates: WatermarkPayload[] = [];

  for (const region of regions) {
    const bits: number[] = [];
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        const i = (y * width + x) * 4;
        bits.push(mainData[i + 0] & 1);
        bits.push(mainData[i + 1] & 1);
        bits.push(mainData[i + 2] & 1);
      }
    }

    let extracted = '';
    for (let i = 0; i < bits.length - 7; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      if (byte === 0) break;
      extracted += String.fromCharCode(byte);
    }

    let start = extracted.indexOf(START_MARKER);
    let end = start !== -1 ? extracted.indexOf(END_MARKER, start + START_MARKER.length) : -1;

    if (start === -1 || end === -1) continue;

    const encoded = extracted.substring(start + START_MARKER.length, end);
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const payload = JSON.parse(decoded) as WatermarkPayload;

      const expectedCRC = crc32(payload.recipient + payload.trackingId);
      if (payload.crc32 === expectedCRC) {
        validCandidates.push(payload);
      } else {
        corruptedCandidates.push(payload);
      }
    } catch (e) {
      // Failed to parse
    }
  }

  if (validCandidates.length > 0) {
    return { payload: validCandidates[0], tampered: false };
  }
  if (corruptedCandidates.length > 0) {
    return { payload: corruptedCandidates[0], tampered: true };
  }

  return { payload: null, tampered: false };
};

/**
 * Robust Watermarking (DCT Domain)
 */
export const applyDCTWatermarkToData = (
  imageData: ImageData,
  trackingData: string
): void => {
  const { width, height, data } = imageData;
  const encodedData = btoa(unescape(encodeURIComponent(trackingData)));
  const fullData = START_MARKER + encodedData + END_MARKER;
  
  const bits: number[] = [];
  for (let i = 0; i < fullData.length; i++) {
    const code = fullData.charCodeAt(i);
    for (let j = 7; j >= 0; j--) bits.push((code >> j) & 1);
  }

  const strength = 25; // Increased strength for better robustness
  let bitIndex = 0;

  // We use Red channel for embedding
  for (let y = 0; y < height - 8 && bitIndex < bits.length; y += 8) {
    for (let x = 0; x < width - 8 && bitIndex < bits.length; x += 8) {
      const block = Array.from({ length: 8 }, (_, i) => 
        Array.from({ length: 8 }, (_, j) => data[((y + i) * width + (x + j)) * 4])
      );

      const dctBlock = dct8x8(block);
      
      const bit = bits[bitIndex++];
      // Use middle frequency coefficients (4,1) and (3,2) for better robustness
      if (bit === 1) {
        if (dctBlock[4][1] <= dctBlock[3][2]) {
          dctBlock[4][1] = dctBlock[3][2] + strength;
        }
      } else {
        if (dctBlock[4][1] >= dctBlock[3][2]) {
          dctBlock[3][2] = dctBlock[4][1] + strength;
        }
      }

      const idctBlock = idct8x8(dctBlock);
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const val = idctBlock[i][j];
          const pixelIdx = ((y + i) * width + (x + j)) * 4;
          data[pixelIdx] = Math.max(0, Math.min(255, val));
        }
      }
    }
  }
};

export const extractDCTWatermarkFromData = (
  imageData: ImageData
): { payload: WatermarkPayload | null; tampered: boolean } => {
  const { width, height, data } = imageData;
  const bits: number[] = [];

  for (let y = 0; y < height - 8; y += 8) {
    for (let x = 0; x < width - 8; x += 8) {
      const block = Array.from({ length: 8 }, (_, i) => 
        Array.from({ length: 8 }, (_, j) => data[((y + i) * width + (x + j)) * 4])
      );
      const dctBlock = dct8x8(block);
      bits.push(dctBlock[4][1] > dctBlock[3][2] ? 1 : 0);
    }
  }

  let extracted = '';
  for (let i = 0; i < bits.length - 7; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    extracted += String.fromCharCode(byte);
    if (extracted.length > 2000) break; // Safety break
  }

  let start = extracted.indexOf(START_MARKER);
  let end = start !== -1 ? extracted.indexOf(END_MARKER, start + START_MARKER.length) : -1;

  if (start !== -1 && end !== -1) {
    const encoded = extracted.substring(start + START_MARKER.length, end);
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const payload = JSON.parse(decoded) as WatermarkPayload;
      const expectedCRC = crc32(payload.recipient + payload.trackingId);
      return { payload, tampered: payload.crc32 !== expectedCRC };
    } catch {
      return { payload: null, tampered: false };
    }
  }

  return { payload: null, tampered: false };
};

export const applyForensicWatermarkToData = (
  imageData: ImageData,
  fingerprint: string
): void => {
  const data = imageData.data;
  const seed = fingerprint.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.sin(i + seed) * 127 + 128) % 3 - 1;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
};

export const applyDRMProtectionToData = (
  imageData: ImageData
): void => {
  const { width, height, data } = imageData;
  const gridSize = 50;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x % gridSize === 0 || y % gridSize === 0) {
        const i = (y * width + x) * 4;
        data[i] = Math.max(0, data[i] - 1);
        data[i+1] = Math.max(0, data[i+1] - 1);
        data[i+2] = Math.max(0, data[i+2] - 1);
      }
    }
  }
};

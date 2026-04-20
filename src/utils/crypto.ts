import * as nacl from 'tweetnacl';

export const makeCRCTable = (): Uint32Array => {
  const c = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let crc = n;
    for (let k = 8; k; k--) {
      crc = crc & 1 ? 0xEDB88320 ^ (crc >>> 1) : crc >>> 1;
    }
    c[n] = crc >>> 0;
  }
  return c;
};

export const crc32 = (str: string): string => {
  let crc = 0 ^ -1;
  const crcTable = makeCRCTable();
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return ((crc ^ -1) >>> 0).toString(16);
};

export const generateTrackingId = (): string => {
  return `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
};

/**
 * Cryptographic Signing
 */
const SEED = new Uint8Array(32).fill(0x42); 
const keyPair = nacl.sign.keyPair.fromSeed(SEED);

export const signPayload = (payload: string): string => {
  const message = new Uint8Array(new TextEncoder().encode(payload));
  const signature = nacl.sign.detached(message, new Uint8Array(keyPair.secretKey));
  return btoa(String.fromCharCode(...Array.from(signature)));
};

export const verifyPayload = (payload: string, signatureB64: string): boolean => {
  try {
    const message = new Uint8Array(new TextEncoder().encode(payload));
    const signature = new Uint8Array(atob(signatureB64).split('').map(c => c.charCodeAt(0)));
    return nacl.sign.detached.verify(message, signature, new Uint8Array(keyPair.publicKey));
  } catch (e) {
    return false;
  }
};

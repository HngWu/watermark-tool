import { describe, it, expect } from 'vitest';
import { crc32, generateTrackingId, signPayload, verifyPayload } from './crypto';

describe('Crypto Utilities', () => {
  it('should generate a valid tracking ID', () => {
    const id = generateTrackingId();
    expect(id).toMatch(/^TRK-\d+-[A-Z0-9]+$/);
  });

  it('should calculate accurate CRC32 hashes', () => {
    expect(crc32('hello world')).toBe('d4a1185');
    const hash1 = crc32('test1');
    const hash2 = crc32('test1');
    expect(hash1).toBe(hash2);
  });

  it('should sign and verify a payload', () => {
    const payload = JSON.stringify({ data: 'test' });
    const signature = signPayload(payload);
    expect(signature).toBeDefined();
    expect(verifyPayload(payload, signature)).toBe(true);
  });

  it('should fail verification for tampered payload', () => {
    const payload = JSON.stringify({ data: 'test' });
    const signature = signPayload(payload);
    expect(verifyPayload(payload + 'tampered', signature)).toBe(false);
  });

  it('should fail verification for tampered signature', () => {
    const payload = JSON.stringify({ data: 'test' });
    const signature = signPayload(payload);
    // Tamper with base64 string slightly
    const tamperedSignature = signature.substring(0, signature.length - 4) + 'AAAA';
    expect(verifyPayload(payload, tamperedSignature)).toBe(false);
  });
});

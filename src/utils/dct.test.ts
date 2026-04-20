import { describe, it, expect } from 'vitest';
import { dct8x8, idct8x8 } from './dct';

describe('DCT Utilities', () => {
  it('should perform DCT and IDCT and return similar block', () => {
    const block = [
      [255, 255, 255, 255, 255, 255, 255, 255],
      [255, 128, 128, 128, 128, 128, 128, 255],
      [255, 128, 0, 0, 0, 0, 128, 255],
      [255, 128, 0, 50, 50, 0, 128, 255],
      [255, 128, 0, 50, 50, 0, 128, 255],
      [255, 128, 0, 0, 0, 0, 128, 255],
      [255, 128, 128, 128, 128, 128, 128, 255],
      [255, 255, 255, 255, 255, 255, 255, 255],
    ];

    const dct = dct8x8(block);
    const idct = idct8x8(dct);

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // Allow small rounding errors
        expect(Math.abs(idct[i][j] - block[i][j])).toBeLessThanOrEqual(2);
      }
    }
  });

  it('should handle zero block', () => {
    const block = Array.from({ length: 8 }, () => new Array(8).fill(0));
    const dct = dct8x8(block);
    const idct = idct8x8(dct);
    expect(idct).toEqual(block);
  });
});

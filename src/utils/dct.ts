/**
 * 8x8 Discrete Cosine Transform (DCT-II) and Inverse DCT
 */

export const dct8x8 = (block: number[][]): number[][] => {
  const N = 8;
  const dct = Array.from({ length: N }, () => new Array(N).fill(0));

  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum += block[x][y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
        }
      }
      const au = u === 0 ? 1 / Math.sqrt(N) : Math.sqrt(2 / N);
      const av = v === 0 ? 1 / Math.sqrt(N) : Math.sqrt(2 / N);
      dct[u][v] = au * av * sum;
    }
  }
  return dct;
};

export const idct8x8 = (dct: number[][]): number[][] => {
  const N = 8;
  const block = Array.from({ length: N }, () => new Array(N).fill(0));

  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      let sum = 0;
      for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
          const au = u === 0 ? 1 / Math.sqrt(N) : Math.sqrt(2 / N);
          const av = v === 0 ? 1 / Math.sqrt(N) : Math.sqrt(2 / N);
          sum += au * av * dct[u][v] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
        }
      }
      block[x][y] = Math.round(sum);
    }
  }
  return block;
};

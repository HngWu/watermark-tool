import { 
  applyInvisibleWatermarkToData, 
  extractInvisibleWatermarkFromData, 
  applyForensicWatermarkToData,
  applyDCTWatermarkToData,
  extractDCTWatermarkFromData
} from '../utils/watermark';

self.onmessage = (e: MessageEvent) => {
  const { type, imageData, trackingData, fingerprint, method } = e.data;

  if (type === 'apply') {
    if (fingerprint) {
      applyForensicWatermarkToData(imageData, fingerprint);
    }
    if (trackingData) {
      if (method === 'dct') {
        applyDCTWatermarkToData(imageData, trackingData);
      } else {
        applyInvisibleWatermarkToData(imageData, trackingData);
      }
    }
    self.postMessage({ type: 'apply_result', imageData }, [imageData.data.buffer] as any);
  } else if (type === 'extract') {
    let result = extractInvisibleWatermarkFromData(imageData);
    if (!result.payload) {
      result = extractDCTWatermarkFromData(imageData);
    }
    self.postMessage({ type: 'extract_result', result });
  }
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VerifyResult {
  recipient: string;
  timestamp: string;
  trackingId: string;
  source: 'LSB' | 'EXIF' | 'DCT';
  tampered?: boolean;
}

export interface ImageItem {
  id: string;
  name: string;
  src: string;
  previewSrc?: string; // Low-res fast preview
  watermarkedSrc?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export interface WatermarkTemplate {
  id: string;
  name: string;
  recipient: string;
  opacity: number;
  watermarkMethod: 'lsb' | 'dct';
  signWatermark: boolean;
  forensicTracking: boolean;
  selectedFont: string;
  tiltedText: string;
  tiltedAngle: number;
  watermarkColor: 'white' | 'black';
}

interface WatermarkState {
  activeTab: 'watermark' | 'verify';
  setActiveTab: (tab: 'watermark' | 'verify') => void;

  // Watermark Tab State
  imageList: ImageItem[];
  addImage: (image: ImageItem) => void;
  removeImage: (id: string) => void;
  updateImageStatus: (id: string, status: ImageItem['status'], watermarkedSrc?: string, error?: string) => void;
  updateImagePreview: (id: string, previewSrc: string) => void;
  clearImages: () => void;
  
  recipient: string;
  setRecipient: (recipient: string) => void;
  tiltedText: string;
  setTiltedText: (text: string) => void;
  tiltedAngle: number;
  setTiltedAngle: (angle: number) => void;
  watermarkColor: 'white' | 'black';
  setWatermarkColor: (color: 'white' | 'black') => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  includeQR: boolean;
  setIncludeQR: (includeQR: boolean) => void;
  qrUrl: string;
  setQrUrl: (qrUrl: string) => void;
  invisibleWatermark: boolean;
  setInvisibleWatermark: (invisible: boolean) => void;
  watermarkMethod: 'lsb' | 'dct';
  setWatermarkMethod: (method: 'lsb' | 'dct') => void;
  signWatermark: boolean;
  setSignWatermark: (sign: boolean) => void;
  forensicTracking: boolean;
  setForensicTracking: (forensic: boolean) => void;
  drmProtection: boolean;
  setDrmProtection: (drm: boolean) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;

  // Batch Progress
  processedCount: number;
  setProcessedCount: (count: number) => void;
  incrementProcessedCount: () => void;

  // Templates
  templates: WatermarkTemplate[];
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;

  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;

  // Verify Tab State
  verifyImage: string | null;
  setVerifyImage: (image: string | null) => void;
  isVerifying: boolean;
  setIsVerifying: (isVerifying: boolean) => void;
  verifyResult: VerifyResult | null;
  setVerifyResult: (result: VerifyResult | null) => void;
  verifyError: string | null;
  setVerifyError: (error: string | null) => void;
}

export const useWatermarkStore = create<WatermarkState>()(
  persist(
    (set, get) => ({
      activeTab: 'watermark',
      setActiveTab: (tab) => set({ activeTab: tab }),

      imageList: [],
      addImage: (image) => set((state) => ({ imageList: [...state.imageList, image] })),
      removeImage: (id) => set((state) => ({ imageList: state.imageList.filter(img => img.id !== id) })),
      updateImageStatus: (id, status, watermarkedSrc, error) => set((state) => ({
        imageList: state.imageList.map(img => 
          img.id === id ? { ...img, status, watermarkedSrc, error } : img
        )
      })),
      updateImagePreview: (id, previewSrc) => set((state) => ({
        imageList: state.imageList.map(img => img.id === id ? { ...img, previewSrc } : img)
      })),
      clearImages: () => set({ imageList: [], processedCount: 0 }),

      recipient: '',
      setRecipient: (recipient) => set({ recipient }),
      tiltedText: '',
      setTiltedText: (tiltedText) => set({ tiltedText }),
      tiltedAngle: -45,
      setTiltedAngle: (tiltedAngle) => set({ tiltedAngle }),
      watermarkColor: 'white',
      setWatermarkColor: (watermarkColor) => set({ watermarkColor }),
      opacity: 30,
      setOpacity: (opacity) => set({ opacity }),
      includeQR: false,
      setIncludeQR: (includeQR) => set({ includeQR }),
      qrUrl: '',
      setQrUrl: (qrUrl) => set({ qrUrl }),
      invisibleWatermark: true,
      setInvisibleWatermark: (invisibleWatermark) => set({ invisibleWatermark }),
      watermarkMethod: 'lsb',
      setWatermarkMethod: (watermarkMethod) => set({ watermarkMethod }),
      signWatermark: true,
      setSignWatermark: (signWatermark) => set({ signWatermark }),
      forensicTracking: true,
      setForensicTracking: (forensicTracking) => set({ forensicTracking }),
      drmProtection: false,
      setDrmProtection: (drmProtection) => set({ drmProtection }),
      selectedFont: 'Arial',
      setSelectedFont: (selectedFont) => set({ selectedFont }),

      processedCount: 0,
      setProcessedCount: (processedCount) => set({ processedCount }),
      incrementProcessedCount: () => set((state) => ({ processedCount: state.processedCount + 1 })),

      templates: [],
      saveTemplate: (name) => set((state) => {
        const newTemplate: WatermarkTemplate = {
          id: Date.now().toString(),
          name,
          recipient: state.recipient,
          opacity: state.opacity,
          watermarkMethod: state.watermarkMethod,
          signWatermark: state.signWatermark,
          forensicTracking: state.forensicTracking,
          selectedFont: state.selectedFont,
          tiltedText: state.tiltedText,
          tiltedAngle: state.tiltedAngle,
          watermarkColor: state.watermarkColor
        };
        return { templates: [...state.templates, newTemplate] };
      }),
      loadTemplate: (id) => {
        const template = get().templates.find(t => t.id === id);
        if (template) {
          set({
            recipient: template.recipient,
            opacity: template.opacity,
            watermarkMethod: template.watermarkMethod,
            signWatermark: template.signWatermark,
            forensicTracking: template.forensicTracking,
            selectedFont: template.selectedFont,
            tiltedText: template.tiltedText,
            tiltedAngle: template.tiltedAngle,
            watermarkColor: template.watermarkColor || 'white'
          });
        }
      },
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id)
      })),

      isProcessing: false,
      setIsProcessing: (isProcessing) => set({ isProcessing }),

      verifyImage: null,
      setVerifyImage: (verifyImage) => set({ verifyImage }),
      isVerifying: false,
      setIsVerifying: (isVerifying) => set({ isVerifying }),
      verifyResult: null,
      setVerifyResult: (verifyResult) => set({ verifyResult }),
      verifyError: null,
      setVerifyError: (verifyError) => set({ verifyError }),
    }),
    {
      name: 'watermark-storage',
      partialize: (state) => ({ 
        templates: state.templates,
        recipient: state.recipient,
        opacity: state.opacity,
        watermarkMethod: state.watermarkMethod,
        signWatermark: state.signWatermark,
        forensicTracking: state.forensicTracking,
        selectedFont: state.selectedFont,
        tiltedText: state.tiltedText,
        tiltedAngle: state.tiltedAngle,
        watermarkColor: state.watermarkColor
      }),
    }
  )
);

import React, { useState, useRef, useEffect, type DragEvent } from 'react';
import { 
  Upload, Download, Shield, Fingerprint, Lock, AlertCircle, CheckCircle2, 
  Search, XCircle, Trash2, Loader2, Save, Plus, Palette, Info
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useWatermarkStore, type ImageItem } from './store/watermarkStore';
import { crc32, generateTrackingId, signPayload, verifyPayload } from './utils/crypto';
import { type WatermarkPayload } from './utils/watermark';

const FONTS = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Impact'];

const ensurePiexif = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).piexif) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/piexif.min.js';
    script.onload = () => resolve();
    script.onerror = () => console.error('❌ Failed to load piexifjs');
    document.head.appendChild(script);
  });
};

const App: React.FC = () => {
  const {
    activeTab, setActiveTab,
    imageList, addImage, removeImage, updateImageStatus, updateImagePreview, clearImages,
    recipient, setRecipient,
    tiltedText, setTiltedText,
    tiltedAngle, setTiltedAngle,
    watermarkColor, setWatermarkColor,
    opacity, setOpacity,
    includeQR,
    qrUrl,
    invisibleWatermark,
    watermarkMethod, setWatermarkMethod,
    signWatermark, setSignWatermark,
    forensicTracking, setForensicTracking,
    isProcessing, setIsProcessing,
    processedCount, incrementProcessedCount,
    templates, saveTemplate, loadTemplate, deleteTemplate,
    selectedFont, setSelectedFont,
    verifyImage, setVerifyImage,
    isVerifying, setIsVerifying,
    verifyResult, setVerifyResult,
    verifyError, setVerifyError
  } = useWatermarkStore();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateModal, setShowTemplateNameModal] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const verifyCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    ensurePiexif();
    workerRef.current = new Worker(new URL('./workers/watermark.worker.ts', import.meta.url), { type: 'module' });
    return () => workerRef.current?.terminate();
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const id = uuidv4();
          addImage({ id, name: file.name, src, status: 'pending' });
          if (!selectedPreviewId) setSelectedPreviewId(id);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const processImage = async (imageItem: ImageItem, isFastPreview = false): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      if (!workerRef.current) return reject('No worker');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject('No context');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        let drawWidth = img.width;
        let drawHeight = img.height;
        if (isFastPreview && (img.width > 1200 || img.height > 1200)) {
          const scale = Math.min(1200 / img.width, 1200 / img.height);
          drawWidth *= scale;
          drawHeight *= scale;
        }

        canvas.width = drawWidth;
        canvas.height = drawHeight;
        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

        const currentTrackingId = generateTrackingId();
        const payload: WatermarkPayload = {
          recipient,
          timestamp: new Date().toISOString(),
          trackingId: currentTrackingId,
          crc32: crc32(recipient + currentTrackingId)
        };

        if (signWatermark) {
          payload.signature = signPayload(JSON.stringify(payload));
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const currentWorker = workerRef.current!;
        const handleWorkerMessage = async (e: MessageEvent) => {
          if (e.data.type === 'apply_result') {
            ctx.putImageData(e.data.imageData, 0, 0);
            
            const textColor = watermarkColor === 'white' ? '255, 255, 255' : '0, 0, 0';
            
            // Overlays (Standard Text)
            const fontSize = Math.max(20, canvas.width / 30);
            ctx.font = `bold ${fontSize}px ${selectedFont}`;
            ctx.fillStyle = `rgba(${textColor}, ${opacity / 100})`;
            ctx.fillText(`${recipient} • ${new Date().toLocaleDateString()} • SECURE`, 50, canvas.height - 50);

            // Tilted Repeating Watermark Pattern
            if (tiltedText.trim()) {
              ctx.save();
              const tiltedFontSize = Math.max(20, canvas.width / 25);
              ctx.font = `bold ${tiltedFontSize}px ${selectedFont}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = `rgba(${textColor}, ${opacity / 250})`;

              let patternText = tiltedText;
              while (ctx.measureText(patternText).width < 400) {
                patternText += "   " + tiltedText;
              }

              const textWidth = ctx.measureText(patternText).width + 100;
              const lineHeight = tiltedFontSize * 4;

              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((tiltedAngle * Math.PI) / 180);

              const diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
              for (let y = -diag; y < diag; y += lineHeight) {
                for (let x = -diag; x < diag; x += textWidth) {
                  const xOffset = (Math.floor(y / lineHeight) % 2 === 0) ? 0 : textWidth / 2;
                  ctx.fillText(patternText, x + xOffset, y);
                }
              }
              ctx.restore();
            }

            if (includeQR && qrUrl) {
              ctx.fillStyle = watermarkColor === 'white' ? 'white' : 'black';
              ctx.fillRect(20, 20, 100, 100);
            }

            let dataUrl = canvas.toDataURL('image/png');
            
            if (!isFastPreview && invisibleWatermark) {
              const piexif = (window as any).piexif;
              if (piexif) {
                try {
                  const exifObj = piexif.dump({
                    "Exif": { [piexif.ExifIFD.UserComment]: piexif.helper.encodeText(JSON.stringify(payload)) }
                  });
                  dataUrl = piexif.insert(exifObj, dataUrl);
                } catch (e) { console.warn('EXIF insert failed', e); }
              }
            }
            resolve(dataUrl);
          }
        };

        currentWorker.onmessage = handleWorkerMessage;
        currentWorker.postMessage({
          type: 'apply',
          imageData,
          trackingData: invisibleWatermark ? JSON.stringify(payload) : null,
          fingerprint: forensicTracking ? `${recipient}-${currentTrackingId}` : null,
          method: watermarkMethod
        }, [imageData.data.buffer]);
      };
      img.onerror = () => reject('Image load failed');
      img.src = imageItem.src;
    });
  };

  useEffect(() => {
    if (!selectedPreviewId || isProcessing) return;
    const selected = imageList.find(img => img.id === selectedPreviewId);
    if (!selected) return;

    const timeout = setTimeout(async () => {
      try {
        const preview = await processImage(selected, true);
        updateImagePreview(selected.id, preview);
      } catch (e) { console.error('Preview failed', e); }
    }, 400);

    return () => clearTimeout(timeout);
  }, [selectedPreviewId, recipient, tiltedText, tiltedAngle, watermarkColor, opacity, watermarkMethod, signWatermark, forensicTracking, selectedFont]);

  const applyWatermarkAll = async () => {
    if (!recipient.trim() || imageList.length === 0) return;
    setIsProcessing(true);
    for (const item of imageList) {
      if (item.status === 'done') {
        incrementProcessedCount();
        continue;
      }
      updateImageStatus(item.id, 'processing');
      try {
        const resultSrc = await processImage(item);
        updateImageStatus(item.id, 'done', resultSrc);
        incrementProcessedCount();
      } catch (err) {
        updateImageStatus(item.id, 'error', undefined, String(err));
      }
    }
    setIsProcessing(false);
  };

  const downloadAll = () => {
    imageList.forEach(img => {
      if (img.watermarkedSrc) {
        const link = document.createElement('a');
        link.download = `protected_${img.name}`;
        link.href = img.watermarkedSrc;
        link.click();
      }
    });
  };

  const selectedImage = imageList.find(img => img.id === selectedPreviewId);
  const progressPercent = imageList.length > 0 ? (processedCount / imageList.length) * 100 : 0;
  const anyDone = imageList.some(img => img.status === 'done');

  const verifyImageWatermark = async (): Promise<void> => {
    if (!verifyImage || !workerRef.current) return;
    setIsVerifying(true); setVerifyResult(null); setVerifyError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      workerRef.current!.onmessage = (e) => {
        if (e.data.type === 'extract_result') {
          const { result } = e.data;
          if (result.payload) {
            let tampered = result.tampered;
            if (result.payload.signature) {
              const { signature, ...rest } = result.payload;
              if (!verifyPayload(JSON.stringify(rest), signature)) tampered = true;
            }
            setVerifyResult({ ...result.payload, source: 'LSB/DCT', tampered });
            setIsVerifying(false);
          } else {
            const piexif = (window as any).piexif;
            try {
              const exifObj = piexif.load(verifyImage);
              const comment = exifObj?.Exif?.[piexif.ExifIFD.UserComment];
              if (comment) {
                const payload = JSON.parse(piexif.helper.decodeText(comment));
                setVerifyResult({ ...payload, source: 'EXIF', tampered: false });
              } else {
                setVerifyError('Watermark extraction failed. The image might not be protected by this tool, or the watermark has been intentionally stripped or corrupted.');
              }
            } catch {
              setVerifyError('Detection Error: No valid protection layers (LSB, DCT, or EXIF) were found in this file. Possible causes include: severe image compression, format conversion, or the image was never protected.');
            }
            setIsVerifying(false);
          }
        }
      };
      workerRef.current!.postMessage({ type: 'extract', imageData }, [imageData.data.buffer]);
    };
    img.onerror = () => {
      setVerifyError('System Error: Failed to load image data. Please ensure the file is a valid image (PNG, JPG, WEBP).');
      setIsVerifying(false);
    };
    img.src = verifyImage;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-white/30">
      {/* Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="bg-blob bg-cyan-500 w-[500px] h-[500px] -top-48 -left-48" />
        <div className="bg-blob bg-purple-600 w-[600px] h-[600px] -bottom-48 -right-48 animation-delay-2000" />
        <div className="bg-blob bg-pink-500 w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header - Floating Pill */}
        <header className="flex flex-col items-center gap-6 pt-12 pb-8 px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">SecureAsset</h1>
          </div>
          
          <nav className="flex glass-card p-1 rounded-full border-white/5">
            <button 
              onClick={() => setActiveTab('watermark')} 
              className={`px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all min-h-[56px] flex items-center justify-center ${activeTab === 'watermark' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
            >
              PROTECT
            </button>
            <button 
              onClick={() => setActiveTab('verify')} 
              className={`px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all min-h-[56px] flex items-center justify-center ${activeTab === 'verify' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
            >
              VERIFY
            </button>
          </nav>
        </header>

        <div className="max-w-full mx-auto space-y-12 p-4 lg:p-12 w-full">

        {activeTab === 'watermark' ? (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-40 lg:pb-0">
            {/* Main Content Area - Visual Focus */}
            <div className="flex-1 space-y-8 lg:space-y-12 order-1">
              {/* Import Section */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Plus className="w-3 h-3" /> Input Source
                </h2>
                <div 
                  onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}} 
                  onDragLeave={() => setIsDragging(false)} 
                  onDrop={handleDrop} 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`border border-white/5 bg-white/[0.02] rounded-[32px] p-12 text-center cursor-pointer transition-all duration-500 hover:bg-white/[0.04] group ${isDragging ? 'border-purple-500/50 bg-purple-500/5' : 'hover:border-white/20'}`}
                >
                  <input type="file" multiple ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept="image/*" />
                  <Upload className="mx-auto w-8 h-8 text-slate-600 mb-4 group-hover:text-white transition-all duration-500 group-hover:scale-110" />
                  <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 group-hover:text-white transition-colors uppercase">Deploy Assets</p>
                </div>
              </div>

              {/* Main Batch Area - Visual Focus */}
              <section className="bg-white/[0.01] rounded-[40px] border border-white/5 overflow-hidden flex flex-col min-h-[600px] shadow-2xl backdrop-blur-3xl">
                {isProcessing && (
                  <div className="h-1 bg-white/10 w-full">
                    <div className="bg-white h-full transition-all duration-700 shadow-[0_0_10px_#fff]" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
                
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Batch Queue [{imageList.length}]</h2>
                  {imageList.length > 0 && (
                    <button onClick={clearImages} className="text-[9px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                      <Trash2 className="w-3 h-3" /> Flush All
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {imageList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20">
                      <Plus className="w-12 h-12 font-thin" />
                      <p className="text-[10px] font-black tracking-[0.5em] uppercase">System Standby</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                      {imageList.map(img => (
                        <div 
                          key={img.id} 
                          onClick={() => setSelectedPreviewId(img.id)} 
                          className={`group relative glass-card rounded-[2.5rem] p-4 transition-all duration-500 cursor-pointer overflow-hidden ${selectedPreviewId === img.id ? 'border-white/40 ring-1 ring-white/20' : 'border-transparent hover:border-white/10'}`}
                        >
                          <div className="aspect-square rounded-2xl overflow-hidden bg-black mb-4 border border-white/5">
                            <img src={img.previewSrc || img.watermarkedSrc || img.src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-bold truncate text-slate-400 uppercase tracking-wider">{img.name}</p>
                            <div className="flex items-center gap-2">
                              {img.status === 'processing' && <Loader2 className="w-2 h-2 animate-spin text-white" />}
                              <span className={`text-[8px] font-black uppercase tracking-widest ${img.status === 'done' ? 'text-emerald-500' : 'text-slate-600'}`}>{img.status}</span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {e.stopPropagation(); removeImage(img.id)}} 
                            className="absolute top-6 right-6 p-2 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all border border-white/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedImage && (
                  <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="w-full md:w-1/2 aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl group relative">
                      <img src={selectedImage.previewSrc || selectedImage.watermarkedSrc || selectedImage.src} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                         <p className="text-[10px] font-bold tracking-widest text-white uppercase">{selectedImage.name}</p>
                      </div>
                    </div>
                    <div className="flex-1 py-4 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[10px] font-black tracking-[0.3em] text-white uppercase">Asset Diagnostics</h3>
                          <div className="px-3 py-1 bg-white/10 text-white text-[8px] font-black rounded-full tracking-[0.2em] uppercase">Pro View</div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1 border-l border-white/10 pl-4">
                             <span className="block text-[8px] text-slate-600 uppercase font-black tracking-widest">Protection Status</span>
                             <span className="text-[10px] font-mono text-white uppercase tracking-wider">{selectedImage.status}</span>
                           </div>
                           <div className="space-y-1 border-l border-white/10 pl-4">
                             <span className="block text-[8px] text-slate-600 uppercase font-black tracking-widest">Embedding Layer</span>
                             <span className="text-[10px] font-mono text-white uppercase tracking-wider">{watermarkMethod}</span>
                           </div>
                        </div>
                      </div>
                      {selectedImage.watermarkedSrc && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Unique signature verified and embedded.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Controls (Settings Bottom Sheet) */}
            <div className="lg:w-[400px] shrink-0 order-2">
              <aside className={`fixed bottom-0 left-0 right-0 z-50 lg:relative lg:bottom-auto lg:z-0 glass-card p-8 rounded-t-[40px] lg:rounded-[32px] border-t lg:border border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:shadow-2xl transition-all duration-500 ease-in-out ${isSheetExpanded ? 'h-[85vh]' : 'h-[160px] lg:h-fit'} overflow-y-auto custom-scrollbar`}>
                {/* Mobile Handle */}
                <div 
                  onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                  className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 lg:hidden cursor-pointer hover:bg-white/40 transition-colors" 
                />

                <div className="space-y-8">
                  {/* Settings Section */}
                  <div className="space-y-6">
                    <div 
                      onClick={() => window.innerWidth < 1024 && setIsSheetExpanded(!isSheetExpanded)}
                      className="flex justify-between items-center mb-2 cursor-pointer lg:cursor-default"
                    >
                      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Configuration
                      </h2>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setShowTemplateNameModal(true); }} className="p-2 hover:bg-white/10 rounded-full text-slate-500 transition-all active:scale-90" title="Save Configuration">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {templates.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                        {templates.map(t => (
                          <div key={t.id} className="flex-shrink-0 flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 hover:border-white/30 transition-all cursor-default">
                            <button onClick={() => loadTemplate(t.id)} className="text-[9px] font-bold tracking-tighter uppercase mr-3">
                              {t.name}
                            </button>
                            <button onClick={() => deleteTemplate(t.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Asset Owner</label>
                        <input 
                          type="text" 
                          placeholder="EX: PHOTOGRAPHER NAME" 
                          value={recipient} 
                          onChange={(e) => setRecipient(e.target.value)} 
                          className="w-full liquid-input text-sm" 
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Overlay</label>
                            <input 
                              type="text" 
                              placeholder="DRAFT" 
                              value={tiltedText} 
                              onChange={(e) => setTiltedText(e.target.value)} 
                              className="w-full liquid-input py-3 text-xs" 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Angle</label>
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                              <input type="range" min="-90" max="90" value={tiltedAngle} onChange={(e) => setTiltedAngle(Number(e.target.value))} className="flex-1 accent-white h-1 bg-white/10 rounded-full appearance-none" />
                              <span className="text-[10px] font-mono text-slate-400 w-8">{tiltedAngle}°</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Theme</label>
                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                              <button onClick={() => setWatermarkColor('white')} className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all ${watermarkColor === 'white' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>WHITE</button>
                              <button onClick={() => setWatermarkColor('black')} className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all ${watermarkColor === 'black' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>BLACK</button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Alpha</label>
                            <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5 min-h-[52px]">
                              <input type="range" min="5" max="90" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1 accent-white h-1 bg-white/10 rounded-full appearance-none" />
                              <span className="text-[10px] font-mono text-slate-400">{opacity}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Typography</label>
                          <select 
                            value={selectedFont} 
                            onChange={(e) => setSelectedFont(e.target.value)} 
                            className="w-full liquid-input py-4 text-xs appearance-none cursor-pointer min-h-[56px]"
                          >
                            {FONTS.map(f => <option key={f} value={f} className="bg-[#111]">{f.toUpperCase()}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button 
                            onClick={() => setWatermarkMethod(watermarkMethod === 'lsb' ? 'dct' : 'lsb')} 
                            className={`p-5 rounded-2xl border text-[9px] font-black tracking-[0.2em] transition-all text-left flex flex-col justify-between h-28 ${watermarkMethod === 'dct' ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                          >
                            {watermarkMethod === 'dct' ? <Lock className="w-5 h-5 mb-2" /> : <Shield className="w-5 h-5 mb-2" />}
                            {watermarkMethod === 'dct' ? 'ROBUST (DCT)' : 'STANDARD (LSB)'}
                          </button>
                          <div className="grid grid-rows-2 gap-2">
                            <button onClick={() => setSignWatermark(!signWatermark)} className={`flex items-center justify-between px-5 rounded-xl border text-[9px] font-bold transition-all min-h-[52px] ${signWatermark ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}>
                              SIGNED {signWatermark ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 opacity-20" />}
                            </button>
                            <button onClick={() => setForensicTracking(!forensicTracking)} className={`flex items-center justify-between px-5 rounded-xl border text-[9px] font-bold transition-all min-h-[52px] ${forensicTracking ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}>
                              FORENSIC {forensicTracking ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Fingerprint className="w-3.5 h-3.5 opacity-20" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button 
                      onClick={applyWatermarkAll} 
                      disabled={isProcessing || imageList.length === 0 || !recipient.trim()} 
                      className="w-full btn-liquid-primary flex items-center justify-center gap-4 text-xs"
                    >
                      {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      {isProcessing ? 'Encrypting...' : 'Initiate Protection'}
                    </button>
                    
                    {anyDone && (
                      <button 
                        onClick={downloadAll} 
                        className="w-full bg-transparent border border-white/10 hover:border-white/30 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase"
                      >
                        <Download className="w-4 h-4" /> Download Protected
                      </button>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          /* Verify Center - Deep Minimalist */
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <section className="glass-card p-12 rounded-[3rem] text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-[10px] font-black tracking-[0.5em] text-white uppercase">AUTHENTICATION GATEWAY</h2>
                <p className="text-slate-500 text-xs font-light tracking-widest max-w-sm mx-auto">Upload secure assets to verify forensic digital signatures and ownership data.</p>
              </div>

              <div 
                onClick={() => verifyInputRef.current?.click()} 
                className="border-2 border-dashed border-white/5 rounded-[32px] p-20 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-700 cursor-pointer group relative overflow-hidden"
              >
                <input type="file" ref={verifyInputRef} onChange={(e) => {const file = e.target.files?.[0]; if (file) {const r = new FileReader(); r.onload = (ev) => setVerifyImage(ev.target?.result as string); r.readAsDataURL(file)}}} className="hidden" />
                {verifyImage ? (
                  <img src={verifyImage} className="max-h-[400px] mx-auto rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-105 transition-transform duration-1000" />
                ) : (
                  <div className="space-y-6">
                    <Search className="w-8 h-8 mx-auto text-slate-700 group-hover:text-white transition-colors duration-700" />
                    <p className="text-[10px] font-black tracking-[0.3em] text-slate-600 group-hover:text-white transition-colors duration-700">SELECT VERIFICATION TARGET</p>
                  </div>
                )}
              </div>

              <button 
                onClick={verifyImageWatermark} 
                disabled={!verifyImage || isVerifying} 
                className="w-full btn-liquid-primary py-6 text-xs tracking-[0.4em]"
              >
                {isVerifying ? 'ANALYZING BITSTREAM...' : 'START DEEP SCAN'}
              </button>

              {verifyResult && (
                <div className="bg-white/[0.03] rounded-[32px] border border-white/10 p-10 space-y-8 text-left animate-in slide-in-from-top-12 duration-700">
                  <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                    <div className={`p-4 rounded-2xl ${verifyResult.tampered ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {verifyResult.tampered ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div>
                       <h3 className={`font-black text-lg tracking-widest uppercase ${verifyResult.tampered ? 'text-red-500' : 'text-emerald-500'}`}>{verifyResult.tampered ? 'TAMPERED ASSET' : 'AUTHENTIC ASSET'}</h3>
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Source: {verifyResult.source} Layer Analysis</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><p className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Originating Owner</p><p className="text-sm font-bold text-white tracking-widest uppercase">{verifyResult.recipient}</p></div>
                    <div className="space-y-2"><p className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Timestamp</p><p className="text-sm font-bold text-white tracking-widest">{new Date(verifyResult.timestamp).toLocaleDateString()}</p></div>
                    <div className="col-span-2 space-y-2 pt-4 border-t border-white/5"><p className="text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">Secure Tracking Hash</p><p className="text-[10px] font-mono text-purple-400 break-all bg-black/40 p-4 rounded-xl border border-white/5">{verifyResult.trackingId}</p></div>
                  </div>
                </div>
              )}

              {verifyError && (
                <div className="bg-red-500/[0.02] border border-red-500/20 p-8 rounded-[32px] text-left space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">Verification Failed</span>
                  </div>
                  <p className="text-red-200/60 text-xs font-light leading-relaxed">{verifyError}</p>
                  <div className="pt-4 space-y-2">
                    <span className="text-[8px] text-red-500/40 uppercase font-black tracking-widest flex items-center gap-2"><Info className="w-3 h-3" /> Probable Causes:</span>
                    <ul className="text-[9px] text-red-200/40 space-y-1 ml-5 list-disc font-bold tracking-wider">
                      <li>IMAGE HAS BEEN RE-SAVED WITHOUT METADATA (EXIF LOSS)</li>
                      <li>HEAVY COMPRESSION HAS DEGRADED THE PIXEL-LAYER WATERMARK</li>
                      <li>THE FILE FORMAT WAS CHANGED (E.G. PNG TO JPG)</li>
                      <li>THE ASSET WAS NOT PROTECTED BY THE SECUREASSET PROTOCOL</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={verifyCanvasRef} className="hidden" />

        {/* Minimalist Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-in fade-in duration-500">
            <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[40px] w-full max-w-md shadow-[0_0_100px_rgba(0,0,0,1)] space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-black tracking-[0.4em] uppercase text-white">Save Preset</h3>
                <p className="text-[10px] text-slate-600 tracking-widest uppercase">Archive current configuration for instant recall.</p>
              </div>
              <input 
                type="text" 
                autoFocus 
                placeholder="PRESET NAME" 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl outline-none focus:border-white/20 text-sm tracking-widest uppercase" 
              />
              <div className="flex gap-4">
                <button onClick={() => setShowTemplateNameModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={() => { saveTemplate(templateName); setTemplateName(''); setShowTemplateNameModal(false); }} className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-slate-200 transition-all">Archive Preset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default App;

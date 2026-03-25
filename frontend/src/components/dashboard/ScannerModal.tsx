import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type OCRScanResponse, type ScannedTicket } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResults: (results: ScannedTicket[]) => void;
}

export function ScannerModal({ isOpen, onClose, onScanResults }: ScannerModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsWarmingUp(true);
      api.warmupOCR().then(() => {
        setIsWarmingUp(false);
        toast.success("Module OCR initialisé", {
          duration: 2000,
          style: { fontSize: '12px', width: 'fit-content' }
        });
      });
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const validFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
      if (validFiles.length !== selectedFiles.length) {
        toast.error("Certains fichiers sélectionnés ne sont pas des images.");
      }
      setFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]); // Clean up object URL
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      const validFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      if (validFiles.length !== droppedFiles.length) {
        toast.error("Certains fichiers déposés ne sont pas des images.");
      }
      setFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScan = async () => {
    if (files.length === 0) return;
    setIsScanning(true);

    const startTime = Date.now();
    try {
      // Redimensionnement de tous les tickets pour accélérer l'OCR
      const resizedFiles = await Promise.all(files.map(f => resizeImage(f)));
      
      const results = await Promise.all(
        resizedFiles.map(async (file) => {
          const result = await api.scanTicket(file);
          return { result, file };
        })
      );
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      onScanResults(results);
      toast.success(`${results.length} ticket(s) analysé(s) en ${duration}s ! ⚡`);
      onClose();
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || "Échec de l'analyse des tickets");
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    previews.forEach(url => URL.revokeObjectURL(url)); // Revoke all preview URLs
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        reset(); // Reset state when dialog closes
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Scanner un ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {previews.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer",
                "animate-in fade-in duration-500"
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Prendre une photo ou glisser un ticket</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP jusqu'à 10MB</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                multiple // Allow multiple file selection
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 animate-in zoom-in-95 duration-300">
              {/* Image Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {previews.map((prev, idx) => (
                    <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-white/10">
                      <img src={prev} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isScanning}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => { reset(); onClose(); }}
              className="flex-1 border-white/10 text-gray-400 hover:text-white"
              disabled={isScanning || isWarmingUp}
            >
              Annuler
            </Button>
            <Button
              onClick={handleScan}
              disabled={files.length === 0 || isScanning || isWarmingUp}
              className="flex-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:opacity-90 relative overflow-hidden group"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : isWarmingUp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

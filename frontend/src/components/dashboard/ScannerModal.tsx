"use client"
import React from 'react';
import { Camera, X, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ScannedTicket } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScanner } from '@/hooks/useScanner';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResults: (results: ScannedTicket[]) => void;
}

export function ScannerModal({ isOpen, onClose, onScanResults }: ScannerModalProps) {
  const { 
    files, previews, isScanning, isWarmingUp, fileInputRef, 
    handleFileChange, handleDragOver, handleDrop, removeFile, handleScan, reset 
  } = useScanner(isOpen, onClose, onScanResults);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Scanner un document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {previews.length === 0 ? (
            <div
              onDragOver={handleDragOver} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer animate-in fade-in duration-500"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Prendre une photo ou glisser un fichier</p>
                <p className="text-xs text-muted-foreground mt-1">Images ou PDF (fiche de paie)</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" capture="environment" multiple className="hidden" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-300 max-h-[400px] overflow-y-auto p-1">
              {previews.map((prev, idx) => (
                <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-black/40">
                  {files[idx]?.type === 'application/pdf' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-indigo-500/5">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">PDF</div>
                      <span className="text-[10px] text-white/40 truncate px-2 w-full text-center">{files[idx].name}</span>
                    </div>
                  ) : (
                    <img src={prev} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" disabled={isScanning}><X className="w-4 h-4 text-white" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => { reset(); onClose(); }} className="flex-1 border-white/10 text-gray-400 hover:text-white" disabled={isScanning || isWarmingUp}>Annuler</Button>
            <Button onClick={handleScan} disabled={files.length === 0 || isScanning || isWarmingUp} className="flex-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:opacity-90 relative overflow-hidden group">
              {isScanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyse...</> : 
               isWarmingUp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Initialisation...</> : 
               <><Sparkles className="w-4 h-4 mr-2" />Analyser ({files.length})</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

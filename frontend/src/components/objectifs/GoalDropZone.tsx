"use client";
import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, Loader2, X } from "lucide-react";
import { api } from "@/api";

interface GoalDropZoneProps {
  goalId: number;
  onSuccess?: () => void;
}

export function GoalDropZone({ goalId, onSuccess }: GoalDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    setStatus("idle");

    try {
      await api.uploadGoalAttachment(goalId, file);
      setStatus("success");
      setIsDragging(false);
      onSuccess?.();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden ${
        isDragging
          ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
          : status === "success"
          ? "border-emerald-500 bg-emerald-500/5"
          : status === "error"
          ? "border-red-500 bg-red-500/5"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf"
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Envoi...</p>
        </div>
      ) : status === "success" ? (
        <div className="flex flex-col items-center gap-2 py-2 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enregistré !</p>
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col items-center gap-2 py-2 text-red-400 animate-in shake duration-300">
          <X className="w-6 h-6" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Erreur d'envoi</p>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className={`w-5 h-5 ${isDragging ? "text-indigo-400" : "text-white/20 group-hover:text-white/60"}`} />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Glisser ou cliquer</p>
            <p className="text-[8px] text-white/20 font-medium">Facture, devis, photo...</p>
          </div>
        </>
      )}

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
    </div>
  );
}

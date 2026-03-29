"use client"

import React from "react"
import { Image as ImageIcon, Loader2, FileText, ArrowRight } from "lucide-react"
import { api, type Attachment } from "@/api"
import { GoalDropZone } from "./GoalDropZone"

interface GoalGalleryProps {
  goalId: number
  attachments: Attachment[]
  loading: boolean
  onSuccess: () => void
}

export function GoalGallery({ goalId, attachments, loading, onSuccess }: GoalGalleryProps) {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
             <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Galerie
          </h3>
          <span className="text-[10px] font-bold text-white/20">{attachments.length} médias</span>
       </div>

       {loading ? (
         <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-white/10 animate-spin" />
         </div>
       ) : (
         <div className="grid grid-cols-2 gap-4">
            {attachments.map(att => (
              <div key={att.id} className="aspect-square rounded-[32px] bg-white/5 border border-white/5 overflow-hidden group relative shadow-inner">
                 {att.file_name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                   <img 
                      src={api.getAttachmentUrl(att.id!)} 
                      alt={att.file_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-2 grayscale group-hover:grayscale-0 transition-all bg-white/[0.02]">
                      <FileText className="w-6 h-6 text-indigo-400/50" />
                      <span className="text-[8px] font-black text-white/20 px-3 truncate w-full text-center uppercase tracking-widest">{att.file_name}</span>
                   </div>
                 )}
                 <div className="absolute inset-0 bg-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button className="p-3 rounded-2xl bg-white text-indigo-600 hover:scale-110 transition-transform shadow-xl">
                       <ArrowRight className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            ))}
            
            <div className="aspect-square">
               <GoalDropZone goalId={goalId} onSuccess={onSuccess} />
            </div>
         </div>
       )}
    </div>
  )
}

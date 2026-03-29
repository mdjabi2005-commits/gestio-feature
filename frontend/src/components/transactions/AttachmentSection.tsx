import React from 'react';
import { FileText, Trash2, RefreshCw } from 'lucide-react';
import { api, Attachment } from '@/api';

interface AttachmentSectionProps {
  attachments: Attachment[];
  readOnly?: boolean;
  onDelete?: (id: number) => void;
  isDeletingId?: number | null;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  attachments,
  readOnly = false,
  onDelete,
  isDeletingId = null,
}) => {
  if (attachments.length === 0 && readOnly) {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center gap-2 text-gray-500">
        <FileText className="w-8 h-8 opacity-20" />
        <p className="text-sm italic">Aucun fichier associé</p>
      </div>
    );
  }

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Pièces jointes ({attachments.length})
      </label>
      <div className="grid gap-2">
        {attachments.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => readOnly && file.id && window.open(api.getAttachmentUrl(file.id), '_blank')}
            title={readOnly ? "Cliquer pour ouvrir" : undefined}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">{file.file_name || "Fichier"}</span>
                <span className="text-[10px] text-gray-400">
                  {file.upload_date ? `Ajouté le ${new Date(file.upload_date).toLocaleDateString()}` : ""}
                </span>
              </div>
            </div>
            {!readOnly && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  file.id && onDelete(file.id);
                }}
                disabled={isDeletingId === file.id}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                {isDeletingId === file.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

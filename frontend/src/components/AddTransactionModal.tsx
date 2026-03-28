import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import type { Transaction, Attachment } from '@/api';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TransactionSummaryView } from './transactions/TransactionSummaryView';
import { TransactionFormFields } from './transactions/TransactionFormFields';
import { AttachmentSection } from './transactions/AttachmentSection';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  onRescan?: () => void;
  initialData?: Transaction;
  warnings?: string[];
  rawOcrText?: string;
  scannedFile?: File | null;
  readOnly?: boolean;
}

const AddTransactionModal: React.FC<Props> = ({ 
  onClose, onSuccess, onRescan, initialData,
  warnings = [], rawOcrText, scannedFile, readOnly = false,
}) => {
  const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [type, setType] = useState<'Dépense' | 'Revenu'>(initialData?.type || 'Dépense');
  const [date, setDate] = useState(initialData?.date || getLocalDate());
  const [amount, setAmount] = useState(initialData?.montant?.toString() || '');
  const [category, setCategory] = useState(initialData?.categorie || 'Alimentation');
  const [subcategory, setSubcategory] = useState(initialData?.sous_categorie || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [objectifId, setObjectifId] = useState<number | null>(initialData?.objectif_id || null);
  const [isRawTextOpen, setIsRawTextOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState<number | null>(null);

  useEffect(() => {
    if (initialData?.id) loadAttachments(initialData.id);
  }, [initialData?.id]);

  const loadAttachments = async (id: number) => {
    try { setAttachments(await api.getAttachments(id)); }
    catch (err) { console.error('Failed to load attachments', err); }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return;
    setIsDeletingAttachment(attachmentId);
    try {
      await api.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (err) { alert('Erreur lors de la suppression'); }
    finally { setIsDeletingAttachment(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    try {
      const transaction: Transaction = {
        id: initialData?.id, type, date, montant: parseFloat(amount),
        categorie: category, sous_categorie: subcategory || undefined,
        description: description || undefined, source: initialData?.source || 'manual',
        objectif_id: objectifId || undefined,
        attachment: (initialData as any)?.attachment // Preservation of archived path
      };
      if (initialData?.id) {
        await api.updateTransaction(initialData.id, transaction);
        toast.success("Transaction mise à jour !");
      } else {
        const id = await api.addTransaction(transaction);
        // Only upload if NOT already archived (e.g. manual entry with file, not OCR)
        if (scannedFile && !transaction.attachment) {
          try {
            await api.uploadAttachment(id, scannedFile);
            toast.success("Transaction créée avec pièce jointe !");
          } catch (e) {
            toast.success("Transaction créée (pièce jointe non jointe)");
          }
        } else {
          toast.success("Transaction créée !");
        }
      }
      onSuccess?.(); onClose();
    } catch (err) { 
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-content relative w-full max-w-lg glass-card rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              {readOnly ? 'Détails' : initialData?.id ? 'Modifier' : 'Nouvelle Transaction'}
            </h2>
            {initialData?.source === 'ocr' && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">Scanner</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRescan && (
              <button onClick={onRescan} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-xs">
                <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Rescanner</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Warnings & OCR Debug */}
        {(warnings.length > 0 || rawOcrText) && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-white/10 space-y-3">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-amber-400 text-xs font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                <AlertTriangle className="w-3.5 h-3.5" /><span>Attention : {w}</span>
              </div>
            ))}
            {rawOcrText && (
              <Collapsible open={isRawTextOpen} onOpenChange={setIsRawTextOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-gray-300 uppercase tracking-widest font-bold transition-colors">
                  <FileText className="w-3 h-3" />{isRawTextOpen ? 'Masquer le texte brut' : 'Voir le texte brut (Debug)'}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">{rawOcrText}</CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        <div className="p-6 space-y-6">
          {readOnly ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <TransactionSummaryView type={type} amount={amount} description={description} category={category} subcategory={subcategory} date={date} />
              <AttachmentSection attachments={attachments} readOnly />
              <button type="button" onClick={onClose} className="w-full px-4 py-3 rounded-xl font-medium text-sm text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all">Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <TransactionFormFields 
                type={type} setType={setType} 
                date={date} setDate={setDate} 
                amount={amount} setAmount={setAmount} 
                category={category} setCategory={setCategory} 
                subcategory={subcategory} setSubcategory={setSubcategory} 
                description={description} setDescription={setDescription} 
                objectifId={objectifId} setObjectifId={setObjectifId}
              />
              {initialData?.id && <AttachmentSection attachments={attachments} onDelete={handleDeleteAttachment} isDeletingId={isDeletingAttachment} />}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-medium text-sm text-gray-400 bg-white/5 hover:bg-white/10 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 relative px-4 py-3 rounded-xl font-medium text-sm text-white overflow-hidden group shadow-lg shadow-indigo-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative">{initialData?.id ? 'Enregistrer' : 'Ajouter'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;

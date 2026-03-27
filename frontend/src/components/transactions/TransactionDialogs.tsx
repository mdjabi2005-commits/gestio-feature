"use client"
import React from 'react'
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from '@/api'
import { toast } from 'sonner'

interface TransactionDialogsProps {
  deleteId: number | null;
  setDeleteId: (id: number | null) => void;
  onDeleted: (id: number) => Promise<void>;
}

export function TransactionDialogs({ deleteId, setDeleteId, onDeleted }: TransactionDialogsProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const transactionId = e.target.dataset.transactionId
    if (file && transactionId) {
      try {
        toast.loading("Envoi du fichier...")
        await api.uploadAttachment(parseInt(transactionId), file)
        toast.dismiss()
        toast.success("Fichier joint avec succès !")
      } catch (err) {
        toast.dismiss()
        toast.error("Échec de l'envoi")
      }
    }
    e.target.value = ''
  }

  return (
    <>
      <input 
        type="file" 
        id="transaction-file-input" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer cette transaction ?"
        description="Cette action est irréversible. La transaction sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Anuller"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId === null) return
          await onDeleted(deleteId)
          setDeleteId(null)
        }}
      />
    </>
  )
}

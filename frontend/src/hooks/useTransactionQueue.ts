"use client"
import { useState } from 'react'
import { api, type ScannedTicket, type IncomeScanResponse } from '@/api'
import { toast } from 'sonner'

export function useTransactionQueue(refreshData: () => void, setEditingTransaction: (t: any) => void, setIsAddModalOpen: (b: boolean) => void, setIsViewMode: (b: boolean) => void) {
  const [scanResultsQueue, setScanResultsQueue] = useState<ScannedTicket[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleTransactionSuccess = () => {
    if (editingIndex !== null) {
      setScanResultsQueue(prev => prev.filter((_, i) => i !== editingIndex))
      setEditingIndex(null)
    }
    setEditingTransaction(null)
    setIsAddModalOpen(false)
    setIsViewMode(false)
    refreshData()
  }

  const handleScanResults = (results: any[]) => {
    const flattened: ScannedTicket[] = []
    results.forEach(res => {
      if (res.type === 'income') {
        const income = res.result as IncomeScanResponse
        const archivedPath = income.archived_path
        let totalAllocated = 0
        
        income.suggested_splits.forEach((split: any) => {
          totalAllocated += split.montant
          flattened.push({
            file: res.file,
            result: {
              transaction: {
                type: 'revenu',
                date: income.date,
                categorie: split.categorie,
                sous_categorie: split.sous_categorie,
                montant: split.montant,
                description: split.description,
                source: 'pdf',
                attachment: archivedPath
              },
              warnings: [],
              raw_ocr_text: income.raw_text
            }
          })
        })
        const remainder = Math.max(0, income.total_net - totalAllocated)
        if (remainder > 0.1) {
          flattened.push({
            file: res.file,
            result: {
              transaction: {
                type: 'revenu',
                date: income.date,
                categorie: 'Autre',
                montant: remainder,
                description: 'Reliquat de fiche de paie',
                source: 'pdf',
                attachment: archivedPath
              },
              warnings: ["Montant résiduel non alloué par le plan"],
              raw_ocr_text: income.raw_text
            }
          })
        }
      } else {
        const ticket = res as ScannedTicket;
        if (ticket.result.archived_path) {
          ticket.result.transaction.attachment = ticket.result.archived_path;
        }
        flattened.push(ticket);
      }
    })
    setScanResultsQueue(prev => [...prev, ...flattened])
  }

  const handleValidate = async (index: number) => {
    const { result, file } = scanResultsQueue[index]
    try {
      const transactionId = await api.addTransaction(result.transaction)
      // Only upload if NOT already archived (e.g. normal ticket scan)
      if (transactionId && file && !result.transaction.attachment) {
        try { await api.uploadAttachment(transactionId, file) }
        catch (e) { toast.error("Échec de la pièce jointe") }
      }
      setScanResultsQueue(prev => prev.filter((_, i) => i !== index))
      refreshData()
      toast.success(file ? "Validé avec succès ! ⚡" : "Transaction créée !")
    } catch (e) { toast.error("Échec de la validation") }
  }

  const currentScanResult = editingIndex !== null ? scanResultsQueue[editingIndex].result : null
  const currentScanFile = editingIndex !== null ? scanResultsQueue[editingIndex].file : null

  return {
    scanResultsQueue, setScanResultsQueue, editingIndex, setEditingIndex,
    currentScanResult, currentScanFile,
    handleScanResults, handleValidate, handleTransactionSuccess
  }
}

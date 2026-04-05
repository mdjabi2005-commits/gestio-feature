"use client"
import { useState, useRef, useEffect } from 'react'
import { api, type ScannedTicket } from '@/api'
import { toast } from "sonner"

export function useScanner(isOpen: boolean, onClose: () => void, onScanResults: (results: ScannedTicket[]) => void) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isWarmingUp, setIsWarmingUp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setIsWarmingUp(true)
      api.warmupOCR().then(() => {
        setIsWarmingUp(false)
        toast.success("Module OCR initialisé", { duration: 2000, style: { fontSize: '12px' } })
      })
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) addFiles(selected)
  }

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
    if (valid.length !== newFiles.length) toast.error("Images ou PDF uniquement.")
    setFiles(prev => [...prev, ...valid])
    setPreviews(prev => [...prev, ...valid.map(f => f.type === 'application/pdf' ? '' : URL.createObjectURL(f))])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length > 0) addFiles(dropped)
  }

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1200
          let width = img.width, height = img.height
          if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file), 'image/jpeg', 0.85)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleScan = async () => {
    if (files.length === 0) return
    setIsScanning(true)
    const start = Date.now()
    try {
      const results: any[] = []
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const result = await api.scanIncome(file)
          results.push({ result, file, type: 'income' })
        } else {
          const resized = await resizeImage(file)
          const result = await api.scanTicket(resized)
          results.push({ result, file: resized, type: 'ticket' })
        }
      }
      onScanResults(results)
      toast.success(`${results.length} doc(s) en ${((Date.now() - start)/1000).toFixed(1)}s !`, { position: "top-center" })
      onClose()
    } catch (error: any) { toast.error(error.message || "Échec") }
    finally { setIsScanning(false) }
  }

  const reset = () => {
    previews.forEach(url => url && URL.revokeObjectURL(url))
    setFiles([]); setPreviews([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return { files, previews, isScanning, isWarmingUp, fileInputRef, handleFileChange, handleDragOver, handleDrop, removeFile, handleScan, reset }
}

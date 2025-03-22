"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import UploadForm from "@/components/UploadForm"

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
}

export function UploadDialog({ isOpen, onClose, onUploadComplete }: UploadDialogProps) {
  const handleUploadComplete = () => {
    onUploadComplete()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Songs</DialogTitle>
          <DialogDescription>Upload your music files to your personal library.</DialogDescription>
        </DialogHeader>
        <UploadForm onUpload={handleUploadComplete} />
      </DialogContent>
    </Dialog>
  )
}
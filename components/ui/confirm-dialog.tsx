import { useState } from 'react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LoadingButton } from '@/components/ui/loading'

interface ConfirmDialogProps {
  children: React.ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void> | boolean | Promise<boolean>
  isLoading?: boolean
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  children,
  title,
  description,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  onConfirm,
  isLoading = false,
  variant = 'default'
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    try {
      const result = await onConfirm()
      // Eğer onConfirm false return ederse dialog'ı açık tut
      if (result !== false) {
        setOpen(false)
      }
    } catch (error) {
      // Hata durumunda dialog'ı açık tut
      console.error('Confirm action failed:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <LoadingButton
            onClick={handleConfirm}
            loading={isLoading}
            variant={variant}
            loadingText="İşleniyor..."
          >
            {confirmText}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 
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
  onConfirm: () => void | Promise<void>
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
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog>
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
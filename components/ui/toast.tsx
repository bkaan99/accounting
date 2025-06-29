import { toast as sonnerToast } from 'sonner'

// Toast utility fonksiyonları
export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 3000,
      style: {
        background: '#10b981',
        color: 'white',
        border: 'none',
      },
    })
  },
  
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 4000,
      style: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
      },
    })
  },
  
  warning: (message: string) => {
    sonnerToast.warning(message, {
      duration: 3500,
      style: {
        background: '#f59e0b',
        color: 'white',
        border: 'none',
      },
    })
  },
  
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 3000,
      style: {
        background: '#3b82f6',
        color: 'white',
        border: 'none',
      },
    })
  },
  
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      style: {
        background: '#6b7280',
        color: 'white',
        border: 'none',
      },
    })
  },
  
  // Loading toast'ı güncelleme
  success_update: (id: string | number, message: string) => {
    sonnerToast.success(message, {
      id,
      duration: 3000,
      style: {
        background: '#10b981',
        color: 'white',
        border: 'none',
      },
    })
  },
  
  error_update: (id: string | number, message: string) => {
    sonnerToast.error(message, {
      id,
      duration: 4000,
      style: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
      },
    })
  }
} 
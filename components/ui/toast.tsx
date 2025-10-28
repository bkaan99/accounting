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
  },

  // Şifre sıfırlama toast'ı (kopyalama özelliği ile)
  password_reset: (id: string | number, password: string) => {
    sonnerToast.success(
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Şifre sıfırlandı!</div>
          <div className="text-sm opacity-90">Yeni şifre: <span className="font-mono bg-black/20 px-1 rounded">{password}</span></div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(password)
            sonnerToast.success('Şifre kopyalandı!', { duration: 2000 })
          }}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Şifreyi kopyala"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </button>
      </div>,
      {
        id,
        duration: 10000, // Daha uzun süre göster
        style: {
          background: '#10b981',
          color: 'white',
          border: 'none',
        },
      }
    )
  }
} 
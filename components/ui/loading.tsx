import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-gray-500',
        sizeClasses[size],
        className
      )} 
    />
  )
}

// Loading Button Component
interface LoadingButtonProps {
  loading: boolean
  children: React.ReactNode
  className?: string
  loadingText?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'default' | 'destructive' | 'outline'
  disabled?: boolean
}

export function LoadingButton({ 
  loading, 
  children, 
  className,
  loadingText = 'Yükleniyor...',
  onClick,
  type = 'button',
  variant = 'default',
  disabled = false,
  ...props 
}: LoadingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        'h-10 px-4 py-2',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Page Loading Overlay
interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Yükleniyor...' }: PageLoadingProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
        <Spinner size="lg" />
        <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {message}
        </span>
      </div>
    </div>
  )
}

// Card Loading Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  )
}

// Table Loading Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  )
} 
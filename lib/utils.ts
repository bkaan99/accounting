import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getTime()).slice(-4)
  
  return `F-${year}${month}${day}-${time}`
}

/**
 * Pagination parametrelerini parse eder ve döndürür
 * @param searchParams URL search params
 * @param defaultLimit Varsayılan limit (default: 20)
 * @returns { page, limit, skip, take }
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20
): { page: number; limit: number; skip: number; take: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit))
  const skip = (page - 1) * limit
  const take = limit

  return { page, limit, skip, take }
}

/**
 * Pagination response formatı
 */
export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
} 
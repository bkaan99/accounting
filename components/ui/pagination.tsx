'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
}

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Sayfa başına kayıt:
          </p>
          {onLimitChange && (
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value, 10))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {limitOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {startItem}-{endItem} / {total}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(1)}
            disabled={!hasPrev || page === 1}
          >
            <span className="sr-only">İlk sayfa</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
          >
            <span className="sr-only">Önceki sayfa</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Sayfa
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {page} / {totalPages || 1}
            </span>
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
          >
            <span className="sr-only">Sonraki sayfa</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext || page === totalPages}
          >
            <span className="sr-only">Son sayfa</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


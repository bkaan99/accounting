import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export interface ApiError {
  error: string
  details?: any
  code?: string
}

/**
 * Merkezi error handler fonksiyonu
 * Tüm API route'larında kullanılmalı
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiError> {
  // Log the error with context
  const errorContext = context ? `[${context}]` : ''
  console.error(`${errorContext} Error:`, error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Geçersiz veri',
        details: error.errors,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return NextResponse.json(
      {
        error: 'Veritabanı hatası oluştu. Lütfen sistem yöneticisi ile iletişime geçin.',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    )
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Veritabanı doğrulama hatası. Lütfen gönderilen verileri kontrol edin.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    )
  }

  // Error object with message
  if (error instanceof Error) {
    // Unauthorized errors
    if (error.message.includes('Unauthorized') || error.message.includes('Yetkisiz')) {
      return NextResponse.json(
        {
          error: 'Yetkisiz erişim',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Not found errors
    if (error.message.includes('not found') || error.message.includes('bulunamadı')) {
      return NextResponse.json(
        {
          error: error.message || 'Kayıt bulunamadı',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Forbidden errors
    if (error.message.includes('Forbidden') || error.message.includes('yetkiniz yok')) {
      return NextResponse.json(
        {
          error: error.message || 'Bu işlem için yetkiniz yok',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }
  }

  // Default error response
  return NextResponse.json(
    {
      error: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  )
}

/**
 * Prisma hatalarını handle eder
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse<ApiError> {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined
      const field = target?.[0] || 'alan'
      return NextResponse.json(
        {
          error: `Bu ${field} zaten kullanılıyor.`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          details: { field },
        },
        { status: 400 }
      )

    case 'P2003':
      // Foreign key constraint violation
      const fieldName = error.meta?.field_name as string | undefined
      return NextResponse.json(
        {
          error: `Geçersiz referans: ${fieldName || 'bilinmeyen alan'}. Lütfen sistem yöneticisi ile iletişime geçin.`,
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          details: { field: fieldName },
        },
        { status: 400 }
      )

    case 'P2025':
      // Record not found
      return NextResponse.json(
        {
          error: 'Kayıt bulunamadı',
          code: 'RECORD_NOT_FOUND',
        },
        { status: 404 }
      )

    case 'P2004':
      // Constraint violation
      return NextResponse.json(
        {
          error: 'Veritabanı kısıtlaması ihlal edildi. Lütfen verilerinizi kontrol edin.',
          code: 'CONSTRAINT_VIOLATION',
        },
        { status: 400 }
      )

    default:
      return NextResponse.json(
        {
          error: 'Veritabanı hatası oluştu. Lütfen sistem yöneticisi ile iletişime geçin.',
          code: 'DATABASE_ERROR',
          details: { prismaCode: error.code },
        },
        { status: 500 }
      )
  }
}

/**
 * API route wrapper - try-catch bloğunu otomatik handle eder
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error, context)
    }
  }
}

/**
 * Özel hata mesajları için helper fonksiyonlar
 */
export const ApiErrors = {
  unauthorized: (message = 'Yetkisiz erişim') =>
    NextResponse.json(
      {
        error: message,
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    ),

  forbidden: (message = 'Bu işlem için yetkiniz yok') =>
    NextResponse.json(
      {
        error: message,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    ),

  notFound: (message = 'Kayıt bulunamadı') =>
    NextResponse.json(
      {
        error: message,
        code: 'NOT_FOUND',
      },
      { status: 404 }
    ),

  badRequest: (message: string, details?: any) =>
    NextResponse.json(
      {
        error: message,
        code: 'BAD_REQUEST',
        ...(details && { details }),
      },
      { status: 400 }
    ),

  conflict: (message: string) =>
    NextResponse.json(
      {
        error: message,
        code: 'CONFLICT',
      },
      { status: 409 }
    ),
}


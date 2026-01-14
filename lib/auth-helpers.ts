import { getServerSession } from 'next-auth'
import { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { ApiErrors } from './error-handler'

/**
 * Session'ı alır ve döndürür
 * Session yoksa null döner
 */
export async function getSession(): Promise<Session | null> {
  return await getServerSession(authOptions)
}

/**
 * Session'ı zorunlu kılar
 * Session yoksa unauthorized hatası döndürür
 */
export async function requireAuth(): Promise<{ session: Session; response?: never } | { session?: never; response: NextResponse }> {
  const session = await getSession()
  
  if (!session?.user?.id) {
    return { response: ApiErrors.unauthorized() }
  }
  
  return { session }
}

/**
 * Süperadmin kontrolü yapar
 * Süperadmin değilse unauthorized hatası döndürür
 */
export async function requireSuperAdmin(): Promise<{ session: Session; response?: never } | { session?: never; response: NextResponse }> {
  const authResult = await requireAuth()
  
  if ('response' in authResult) {
    return authResult
  }
  
  const { session } = authResult
  
  if (session.user.role !== 'SUPERADMIN') {
    return { response: ApiErrors.unauthorized('Bu işlem için süperadmin yetkisi gereklidir') }
  }
  
  return { session }
}

/**
 * Kullanıcının şirketi olup olmadığını kontrol eder
 * Şirket yoksa bad request hatası döndürür
 */
export async function requireCompany(): Promise<{ session: Session; response?: never } | { session?: never; response: NextResponse }> {
  const authResult = await requireAuth()
  
  if ('response' in authResult) {
    return authResult
  }
  
  const { session } = authResult
  
  if (!session.user.companyId) {
    return { 
      response: ApiErrors.badRequest('Şirket bilgisi bulunamadı')
    }
  }
  
  return { session }
}

/**
 * Kullanıcının şirketinin var olup olmadığını kontrol eder
 * Şirket veritabanında yoksa bad request hatası döndürür
 */
export async function requireValidCompany(): Promise<{ session: Session; company: { id: string }; response?: never } | { session?: never; company?: never; response: NextResponse }> {
  const companyResult = await requireCompany()
  
  if ('response' in companyResult) {
    return companyResult
  }
  
  const { session } = companyResult
  
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId! },
  })
  
  if (!company) {
    return { 
      response: ApiErrors.badRequest('Şirket bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.')
    }
  }
  
  return { session, company: { id: company.id } }
}

/**
 * Kullanıcının belirli bir şirkete erişim yetkisi olup olmadığını kontrol eder
 * Süperadmin tüm şirketlere erişebilir
 * Diğer kullanıcılar sadece kendi şirketlerine erişebilir
 */
export function canAccessCompany(session: Session, companyId: string | null | undefined): boolean {
  if (!companyId) return false
  
  // Süperadmin tüm şirketlere erişebilir
  if (session.user.role === 'SUPERADMIN') {
    return true
  }
  
  // Diğer kullanıcılar sadece kendi şirketlerine erişebilir
  return session.user.companyId === companyId
}

/**
 * Şirket erişim kontrolü yapar
 * Erişim yoksa forbidden hatası döndürür
 */
export async function checkCompanyAccess(companyId: string | null | undefined): Promise<{ session: Session; response?: never } | { session?: never; response: NextResponse }> {
  const authResult = await requireAuth()
  
  if ('response' in authResult) {
    return authResult
  }
  
  const { session } = authResult
  
  if (!canAccessCompany(session, companyId)) {
    return { 
      response: ApiErrors.forbidden('Bu şirkete erişim yetkiniz yok')
    }
  }
  
  return { session }
}

/**
 * Kasa erişim kontrolü yapar
 * Kasa bulunamazsa not found hatası döndürür
 * Erişim yoksa forbidden hatası döndürür
 */
export async function checkCashAccountAccess(cashAccountId: string | null | undefined): Promise<{ session: Session; cashAccount: { id: string; companyId: string; isActive: boolean }; response?: never } | { session?: never; cashAccount?: never; response: NextResponse }> {
  const authResult = await requireAuth()
  
  if ('response' in authResult) {
    return authResult
  }
  
  const { session } = authResult
  
  if (!cashAccountId) {
    return { 
      response: ApiErrors.badRequest('Kasa ID gerekli')
    }
  }
  
  const cashAccount = await prisma.cashAccount.findUnique({
    where: { id: cashAccountId },
    select: {
      id: true,
      companyId: true,
      isActive: true,
    },
  })
  
  if (!cashAccount) {
    return { 
      response: ApiErrors.notFound('Kasa bulunamadı')
    }
  }
  
  // Süperadmin tüm kasalara erişebilir
  if (session.user.role !== 'SUPERADMIN' && cashAccount.companyId !== session.user.companyId) {
    return { 
      response: ApiErrors.forbidden('Bu kasaya erişim yetkiniz yok')
    }
  }
  
  return { session, cashAccount }
}

/**
 * Kasa erişim ve aktiflik kontrolü yapar
 * Kasa aktif değilse bad request hatası döndürür
 */
export async function checkCashAccountAccessAndActive(cashAccountId: string | null | undefined): Promise<{ session: Session; cashAccount: { id: string; companyId: string; isActive: boolean }; response?: never } | { session?: never; cashAccount?: never; response: NextResponse }> {
  const accessResult = await checkCashAccountAccess(cashAccountId)
  
  if ('response' in accessResult) {
    return accessResult
  }
  
  const { session, cashAccount } = accessResult
  
  if (!cashAccount.isActive) {
    return { 
      response: ApiErrors.badRequest('Bu kasa aktif değil')
    }
  }
  
  return { session, cashAccount }
}

/**
 * Kullanıcının süperadmin olup olmadığını kontrol eder
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === 'SUPERADMIN'
}

/**
 * Kullanıcının admin veya süperadmin olup olmadığını kontrol eder
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
}

/**
 * Şirket erişim kontrolü için where clause oluşturur
 * Süperadmin için boş where, diğerleri için companyId filtresi
 */
export function getCompanyWhereClause(session: Session): Prisma.CompanyWhereInput {
  if (session.user.role === 'SUPERADMIN') {
    return {}
  }
  
  if (session.user.companyId) {
    return { companyId: session.user.companyId }
  }
  
  return {}
}


import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

export const RegisterSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const ClientSchema = z.object({
  name: z.string().min(2, 'Tedarikçi adı en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
})

export const TransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'İşlem türü seçiniz',
  }),
  category: z.string().min(1, 'Kategori seçiniz'),
  amount: z.number().positive('Tutar pozitif olmalıdır'),
  description: z.string().optional().nullable(),
  date: z.date(),
})

export const TransactionCreateSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'İşlem türü seçiniz',
  }),
  category: z.string().min(1, 'Kategori seçiniz'),
  amount: z.number().positive('Tutar pozitif olmalıdır').or(z.string().transform((val) => parseFloat(val))),
  description: z.string().optional().nullable(),
  date: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
  cashAccountId: z.string().optional().nullable(),
  isPaid: z.boolean().optional().default(false),
})

export const TransactionUpdateSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1, 'Kategori seçiniz').optional(),
  amount: z.number().positive('Tutar pozitif olmalıdır').or(z.string().transform((val) => parseFloat(val))).optional(),
  description: z.string().optional().nullable(),
  date: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
  cashAccountId: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
})

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Açıklama giriniz'),
  quantity: z.number().positive('Miktar pozitif olmalıdır'),
  unitPrice: z.number().positive('Fiyat pozitif olmalıdır'),
})

export const ClientInfoSchema = z.object({
  name: z.string().min(1, 'Tedarikçi adı gerekli'),
  email: z.string().email('Geçerli e-posta giriniz').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Tedarikçi seçiniz'),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1, 'En az bir kalem ekleyiniz'),
})

export const InvoiceSchema = z.object({
  clientId: z.string().min(1, 'Tedarikçi seçiniz'),
  dueDate: z.date(),
  notes: z.string().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1, 'En az bir kalem ekleyiniz'),
})

export const SettingsSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const SettingsUpdateSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').optional(),
  company: z.string().optional().nullable(),
  companyLogo: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır'),
})

export const CashAccountSchema = z.object({
  name: z.string().min(1, 'Kasa adı gereklidir'),
  type: z.enum(['CASH', 'CREDIT_CARD', 'BANK_ACCOUNT'], {
    required_error: 'Kasa türü seçiniz',
  }),
  description: z.string().optional().nullable(),
  initialBalance: z.number().default(0).or(z.string().transform((val) => parseFloat(val) || 0)),
})

export const CashAccountUpdateSchema = z.object({
  name: z.string().min(1, 'Kasa adı gereklidir').optional(),
  type: z.enum(['CASH', 'CREDIT_CARD', 'BANK_ACCOUNT']).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const InvoiceUpdateSchema = z.object({
  clientId: z.string().min(1, 'Tedarikçi seçiniz').optional(),
  issueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
  dueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1, 'En az bir kalem ekleyiniz').optional(),
})

export const UserCreateSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER'),
  companyId: z.string().optional().nullable(),
})

export const UserUpdateSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').optional(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
  company: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
})

export const CompanySchema = z.object({
  name: z.string().min(1, 'Şirket adı gereklidir'),
  taxId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().nullable().or(z.literal('')),
  website: z.union([
    z.string().url('Geçerli bir URL giriniz'),
    z.literal(''),
    z.null(),
  ]).optional(),
  logo: z.string().optional().nullable(),
})

export const CompanyUpdateSchema = z.object({
  name: z.string().min(1, 'Şirket adı gereklidir').optional(),
  taxId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().nullable().or(z.literal('')),
  website: z.union([
    z.string().url('Geçerli bir URL giriniz'),
    z.literal(''),
    z.null(),
  ]).optional(),
  logo: z.string().optional().nullable(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ClientInput = z.infer<typeof ClientSchema>
export type TransactionInput = z.infer<typeof TransactionSchema>
export type TransactionCreateInput = z.infer<typeof TransactionCreateSchema>
export type TransactionUpdateInput = z.infer<typeof TransactionUpdateSchema>
export type InvoiceInput = z.infer<typeof InvoiceSchema>
export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>
export type InvoiceCreateInput = z.infer<typeof invoiceSchema>
export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdateSchema>
export type ClientInfoInput = z.infer<typeof ClientInfoSchema>
export type SettingsInput = z.infer<typeof SettingsSchema>
export type SettingsUpdateInput = z.infer<typeof SettingsUpdateSchema>
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>
export type CashAccountInput = z.infer<typeof CashAccountSchema>
export type CashAccountUpdateInput = z.infer<typeof CashAccountUpdateSchema>
export type UserCreateInput = z.infer<typeof UserCreateSchema>
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>
export type CompanyInput = z.infer<typeof CompanySchema>
export type CompanyUpdateInput = z.infer<typeof CompanyUpdateSchema> 
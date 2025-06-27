import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

export const RegisterSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const ClientSchema = z.object({
  name: z.string().min(2, 'Müşteri adı en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
})

export const TransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'İşlem türü seçiniz',
  }),
  category: z.string().min(1, 'Kategori seçiniz'),
  amount: z.number().positive('Tutar pozitif olmalıdır'),
  description: z.string().optional(),
  date: z.date(),
})

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Açıklama giriniz'),
  quantity: z.number().positive('Miktar pozitif olmalıdır'),
  price: z.number().positive('Fiyat pozitif olmalıdır'),
})

export const InvoiceSchema = z.object({
  clientId: z.string().min(1, 'Müşteri seçiniz'),
  dueDate: z.date(),
  notes: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, 'En az bir kalem ekleyiniz'),
})

export const SettingsSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ClientInput = z.infer<typeof ClientSchema>
export type TransactionInput = z.infer<typeof TransactionSchema>
export type InvoiceInput = z.infer<typeof InvoiceSchema>
export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>
export type SettingsInput = z.infer<typeof SettingsSchema> 
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateOverdueInvoices } from '@/lib/invoice-status'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Gecikmiş faturaları güncelle
    await updateOverdueInvoices()

    return NextResponse.json({ 
      message: 'Gecikmiş faturalar güncellendi',
      success: true 
    })
  } catch (error) {
    console.error('Update overdue invoices error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import jsPDF from 'jspdf'

interface InvoiceItem {
  description: string
  quantity: number
  price: number
  total: number
}

interface Client {
  name: string
  email?: string
  phone?: string
  address?: string
}

interface InvoiceData {
  number: string
  issueDate: string
  dueDate: string
  status: string
  totalAmount: number
  notes?: string
  clientInfo: Client
  items: InvoiceItem[]
}

export const generateInvoicePDF = (invoice: InvoiceData) => {
  const doc = new jsPDF()
  
  // Sayfa boyutları
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Başlık
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('FATURA', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Fatura numarası
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fatura No: ${invoice.number}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Şirket bilgileri (sol)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Fatura Düzenleyen:', 20, yPosition)
  yPosition += 8
  doc.setFont('helvetica', 'normal')
  doc.text('Muhasebe Yazılımı A.Ş.', 20, yPosition)
  yPosition += 6
  doc.text('Teknoloji Mahallesi No:123', 20, yPosition)
  yPosition += 6
  doc.text('Ankara, Türkiye', 20, yPosition)
  yPosition += 6
  doc.text('Tel: +90 312 555 01 01', 20, yPosition)

  // Müşteri bilgileri (sağ)
  let rightYPosition = yPosition - 26
  doc.setFont('helvetica', 'bold')
  doc.text('Fatura Edilen:', pageWidth - 20, rightYPosition, { align: 'right' })
  rightYPosition += 8
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.clientInfo.name, pageWidth - 20, rightYPosition, { align: 'right' })
  rightYPosition += 6
  if (invoice.clientInfo.address) {
    doc.text(invoice.clientInfo.address, pageWidth - 20, rightYPosition, { align: 'right' })
    rightYPosition += 6
  }
  if (invoice.clientInfo.phone) {
    doc.text(invoice.clientInfo.phone, pageWidth - 20, rightYPosition, { align: 'right' })
    rightYPosition += 6
  }
  if (invoice.clientInfo.email) {
    doc.text(invoice.clientInfo.email, pageWidth - 20, rightYPosition, { align: 'right' })
  }

  yPosition += 25

  // Fatura bilgileri
  doc.setFont('helvetica', 'bold')
  doc.text('Fatura Tarihi:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(invoice.issueDate).toLocaleDateString('tr-TR'), 80, yPosition)

  doc.setFont('helvetica', 'bold')
  doc.text('Vade Tarihi:', pageWidth - 80, yPosition, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(invoice.dueDate).toLocaleDateString('tr-TR'), pageWidth - 20, yPosition, { align: 'right' })

  yPosition += 15

  // Durum
  doc.setFont('helvetica', 'bold')
  doc.text('Durum:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  const statusText = invoice.status === 'PAID' ? 'Ödendi' : 
                    invoice.status === 'SENT' ? 'Gönderildi' : 
                    invoice.status === 'OVERDUE' ? 'Gecikmiş' : 'Taslak'
  doc.text(statusText, 60, yPosition)

  yPosition += 20

  // Tablo başlığı
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(240, 240, 240)
  doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F')
  
  doc.text('Açıklama', 25, yPosition)
  doc.text('Miktar', pageWidth - 120, yPosition, { align: 'center' })
  doc.text('Birim Fiyat', pageWidth - 80, yPosition, { align: 'center' })
  doc.text('Toplam', pageWidth - 25, yPosition, { align: 'right' })
  
  yPosition += 15

  // Fatura kalemleri
  doc.setFont('helvetica', 'normal')
  invoice.items.forEach((item) => {
    // Sayfa sonu kontrolü
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = 20
    }

    doc.text(item.description, 25, yPosition)
    doc.text(item.quantity.toString(), pageWidth - 120, yPosition, { align: 'center' })
    doc.text(`₺${item.price.toFixed(2)}`, pageWidth - 80, yPosition, { align: 'center' })
    doc.text(`₺${item.total.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })
    
    yPosition += 10
  })

  yPosition += 10

  // Toplam
  doc.setDrawColor(0, 0, 0)
  doc.line(pageWidth - 100, yPosition, pageWidth - 20, yPosition)
  yPosition += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('GENEL TOPLAM:', pageWidth - 100, yPosition)
  doc.text(`₺${invoice.totalAmount.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })

  yPosition += 20

  // Notlar
  if (invoice.notes) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Notlar:', 20, yPosition)
    yPosition += 8
    doc.setFont('helvetica', 'normal')
    
    // Notları satırlara böl
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40)
    doc.text(splitNotes, 20, yPosition)
  }

  // Alt bilgi
  yPosition = pageHeight - 30
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text('Bu fatura elektronik olarak oluşturulmuştur.', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 5
  doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, 
    pageWidth / 2, yPosition, { align: 'center' })

  return doc
}

export const downloadInvoicePDF = (invoice: InvoiceData) => {
  const doc = generateInvoicePDF(invoice)
  doc.save(`Fatura-${invoice.number}.pdf`)
}

export const previewInvoicePDF = (invoice: InvoiceData) => {
  const doc = generateInvoicePDF(invoice)
  const pdfUrl = doc.output('bloburl')
  window.open(pdfUrl, '_blank')
} 
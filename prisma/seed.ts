import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlatılıyor...')

  try {
    // 1. Şirketler oluştur
    const company1 = await prisma.company.create({
      data: {
        name: 'ABC Teknoloji A.Ş.',
        taxId: '1234567890',
        address: 'İstanbul, Türkiye',
        phone: '+90 212 555 0101',
        email: 'info@abcteknoloji.com',
        website: 'https://abcteknoloji.com',
        logo: 'https://example.com/logo1.png'
      }
    })

    const company2 = await prisma.company.create({
      data: {
        name: 'XYZ Danışmanlık Ltd.',
        taxId: '0987654321',
        address: 'Ankara, Türkiye',
        phone: '+90 312 555 0202',
        email: 'info@xyzdanismanlik.com',
        website: 'https://xyzdanismanlik.com'
      }
    })

    const systemCompany = await prisma.company.create({
      data: {
        name: 'Sistem Yönetimi',
        taxId: '0000000000',
        address: 'Sistem',
        email: 'admin@system.com'
      }
    })

    console.log('✅ Şirketler oluşturuldu')

    // 2. Kullanıcılar oluştur
    const hashedPassword = await bcrypt.hash('123456', 10)

    // Süperadmin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Sistem Yöneticisi',
        email: 'test@muhasebe.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        companyId: systemCompany.id,
        phone: '+90 555 000 0000'
      }
    })

    // Admin kullanıcılar
    const admin1 = await prisma.user.create({
      data: {
        name: 'Ahmet Yılmaz',
        email: 'ahmet@abcteknoloji.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company1.id,
        phone: '+90 555 111 1111',
        address: 'İstanbul, Türkiye'
      }
    })

    const admin2 = await prisma.user.create({
      data: {
        name: 'Fatma Demir',
        email: 'fatma@xyzdanismanlik.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company2.id,
        phone: '+90 555 222 2222',
        address: 'Ankara, Türkiye'
      }
    })

    // Normal kullanıcılar
    const user1 = await prisma.user.create({
      data: {
        name: 'Mehmet Kaya',
        email: 'mehmet@abcteknoloji.com',
        password: hashedPassword,
        role: 'USER',
        companyId: company1.id,
        phone: '+90 555 333 3333'
      }
    })

    const user2 = await prisma.user.create({
      data: {
        name: 'Ayşe Özkan',
        email: 'ayse@xyzdanismanlik.com',
        password: hashedPassword,
        role: 'USER',
        companyId: company2.id,
        phone: '+90 555 444 4444'
      }
    })

    // Test kullanıcısı
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Kullanıcı',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
        companyId: company1.id,
        phone: '+90 555 999 9999'
      }
    })

    console.log('✅ Kullanıcılar oluşturuldu')

    // 3. Müşteriler oluştur
    const client1 = await prisma.client.create({
      data: {
        name: 'Beta Yazılım Ltd.',
        email: 'info@betayazilim.com',
        phone: '+90 216 555 0505',
        address: 'İstanbul, Türkiye',
        taxId: '1111111111',
        companyId: company1.id,
        userId: admin1.id
      }
    })

    const client2 = await prisma.client.create({
      data: {
        name: 'Gamma İnşaat A.Ş.',
        email: 'info@gammainsaat.com',
        phone: '+90 312 555 0606',
        address: 'Ankara, Türkiye',
        taxId: '2222222222',
        companyId: company2.id,
        userId: admin2.id
      }
    })

    const client3 = await prisma.client.create({
      data: {
        name: 'Delta Ticaret Ltd.',
        email: 'info@deltaticaret.com',
        phone: '+90 232 555 0707',
        address: 'İzmir, Türkiye',
        taxId: '3333333333',
        companyId: company1.id,
        userId: user1.id
      }
    })

    console.log('✅ Müşteriler oluşturuldu')

    // 4. Faturalar oluştur
    const invoice1 = await prisma.invoice.create({
      data: {
        number: 'FAT-2024-001',
        clientId: client1.id,
        userId: admin1.id,
        companyId: company1.id,
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'SENT',
        subtotal: 1000,
        taxAmount: 180,
        totalAmount: 1180,
        notes: 'Yazılım geliştirme hizmeti'
      }
    })

    const invoice2 = await prisma.invoice.create({
      data: {
        number: 'FAT-2024-002',
        clientId: client2.id,
        userId: admin2.id,
        companyId: company2.id,
        issueDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        status: 'PAID',
        subtotal: 2500,
        taxAmount: 450,
        totalAmount: 2950,
        notes: 'Danışmanlık hizmeti'
      }
    })

    console.log('✅ Faturalar oluşturuldu')

    // 5. Fatura kalemleri oluştur
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice1.id,
          description: 'Web sitesi geliştirme',
          quantity: 1,
          price: 1000,
          total: 1000
        },
        {
          invoiceId: invoice2.id,
          description: 'Proje danışmanlığı',
          quantity: 50,
          price: 50,
          total: 2500
        }
      ]
    })

    console.log('✅ Fatura kalemleri oluşturuldu')

    // 6. İşlemler oluştur
    await prisma.transaction.createMany({
      data: [
        {
          userId: admin1.id,
          companyId: company1.id,
          type: 'INCOME',
          category: 'Hizmet Geliri',
          amount: 1180,
          description: 'Web sitesi geliştirme geliri',
          date: new Date('2024-01-15'),
          invoiceId: invoice1.id
        },
        {
          userId: admin2.id,
          companyId: company2.id,
          type: 'INCOME',
          category: 'Hizmet Geliri',
          amount: 2950,
          description: 'Danışmanlık geliri',
          date: new Date('2024-01-20'),
          invoiceId: invoice2.id
        },
        {
          userId: admin1.id,
          companyId: company1.id,
          type: 'EXPENSE',
          category: 'Ofis Malzemeleri',
          amount: 150,
          description: 'Kırtasiye alışverişi',
          date: new Date('2024-01-10')
        },
        {
          userId: user1.id,
          companyId: company1.id,
          type: 'EXPENSE',
          category: 'Yakıt',
          amount: 200,
          description: 'Araç yakıtı',
          date: new Date('2024-01-12')
        }
      ]
    })

    console.log('✅ İşlemler oluşturuldu')

    console.log(`
🎉 Seed başarıyla tamamlandı!

📊 Oluşturulan veriler:
- 3 Şirket (ABC Teknoloji, XYZ Danışmanlık, Sistem Yönetimi)
- 6 Kullanıcı (1 Süperadmin, 2 Admin, 3 Normal kullanıcı)
- 3 Müşteri
- 2 Fatura
- 4 İşlem

🔑 Test Hesapları:
- Süperadmin: test@muhasebe.com / 123456
- Admin (ABC): ahmet@abcteknoloji.com / 123456
- Admin (XYZ): fatma@xyzdanismanlik.com / 123456
- Normal kullanıcı: user@example.com / 123456
`)

  } catch (error) {
    console.error('❌ Seed hatası:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
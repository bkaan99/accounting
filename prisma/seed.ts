import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlatılıyor...')

  try {
    // Mevcut verileri temizle
    await prisma.transaction.deleteMany()
    await prisma.invoiceItem.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.client.deleteMany()
    await prisma.cashAccount.deleteMany()
    await prisma.user.deleteMany()
    await prisma.company.deleteMany()

    console.log('✅ Mevcut veriler temizlendi')

    // Süperadmin kullanıcısını oluştur
    const hashedPassword = await bcrypt.hash('123456', 10)

    const superAdmin = await prisma.user.create({
      data: {
        name: 'Sistem Yöneticisi',
        email: 'test@muhasebe.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        companyId: null, // SUPERADMIN için şirket gerekmez
        phone: '+90 555 000 0000'
      }
    })

    console.log('✅ Süperadmin kullanıcısı oluşturuldu')

    console.log(`
🎉 Seed başarıyla tamamlandı!

📊 Oluşturulan veriler:
- 1 Kullanıcı (Süperadmin)

🔑 Test Hesabı:
- Süperadmin: test@muhasebe.com / 123456
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
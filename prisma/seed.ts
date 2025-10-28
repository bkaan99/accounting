import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Sadece temel kullanıcı hesaplarını oluştur
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  // Süperadmin kullanıcısı
  await prisma.user.upsert({
    where: { email: 'test@muhasebe.com' },
    update: { role: 'SUPERADMIN' },
    create: {
      email: 'test@muhasebe.com',
      name: 'Test Kullanıcı (Süperadmin)',
      password: hashedPassword,
      company: 'Muhasebe A.Ş.',
      phone: '+90 532 123 45 67',
      address: 'İstanbul, Türkiye',
      role: 'SUPERADMIN',
    },
  })

  // Normal kullanıcı
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Normal Kullanıcı',
      password: hashedPassword,
      company: 'Demo Şirketi',
      phone: '+90 532 111 22 33',
      address: 'Ankara, Türkiye',
      role: 'USER',
    },
  })

  console.log('✅ Temel kullanıcı hesapları oluşturuldu!')
  console.log('Süperadmin: test@muhasebe.com / 123456')
  console.log('Normal kullanıcı: user@example.com / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
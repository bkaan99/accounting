import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Test kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const user = await prisma.user.upsert({
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

  // Test müşterileri oluştur
  const client1 = await prisma.client.upsert({
    where: { id: 'client-1' },
    update: {},
    create: {
      id: 'client-1',
      name: 'ABC Teknoloji Ltd.',
      email: 'info@abcteknoloji.com',
      phone: '+90 212 555 01 01',
      address: 'Maslak, İstanbul',
      taxId: '1234567890',
      userId: user.id,
    },
  })

  const client2 = await prisma.client.upsert({
    where: { id: 'client-2' },
    update: {},
    create: {
      id: 'client-2',
      name: 'XYZ İnşaat A.Ş.',
      email: 'muhasebe@xyzinsaat.com',
      phone: '+90 312 555 02 02',
      address: 'Çankaya, Ankara',
      taxId: '9876543210',
      userId: user.id,
    },
  })

  // Test faturaları oluştur
  const invoice1 = await prisma.invoice.upsert({
    where: { number: 'F-2024-001' },
    update: {},
    create: {
      number: 'F-2024-001',
      clientId: client1.id,
      userId: user.id,
      dueDate: new Date('2024-02-15'),
      status: 'SENT',
      subtotal: 10000,
      taxAmount: 1800,
      totalAmount: 11800,
      notes: 'Web sitesi geliştirme hizmeti',
      items: {
        create: [
          {
            description: 'Web Tasarım',
            quantity: 1,
            price: 5000,
            total: 5000,
          },
          {
            description: 'Backend Geliştirme',
            quantity: 1,
            price: 5000,
            total: 5000,
          },
        ],
      },
    },
  })

  const invoice2 = await prisma.invoice.upsert({
    where: { number: 'F-2024-002' },
    update: {},
    create: {
      number: 'F-2024-002',
      clientId: client2.id,
      userId: user.id,
      dueDate: new Date('2024-02-20'),
      status: 'PAID',
      subtotal: 25000,
      taxAmount: 4500,
      totalAmount: 29500,
      notes: 'Proje danışmanlık hizmeti',
      items: {
        create: [
          {
            description: 'Mimari Danışmanlık',
            quantity: 50,
            price: 500,
            total: 25000,
          },
        ],
      },
    },
  })

  // Test işlemleri (gelir/gider) oluştur
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: 'INCOME',
        category: 'Hizmet Geliri',
        amount: 11800,
        description: 'ABC Teknoloji - Web geliştirme',
        date: new Date('2024-01-15'),
      },
      {
        userId: user.id,
        type: 'INCOME',
        category: 'Danışmanlık',
        amount: 29500,
        description: 'XYZ İnşaat - Proje danışmanlığı',
        date: new Date('2024-01-20'),
      },
      {
        userId: user.id,
        type: 'EXPENSE',
        category: 'Ofis Gideri',
        amount: 2500,
        description: 'Kira ödemesi',
        date: new Date('2024-01-01'),
      },
      {
        userId: user.id,
        type: 'EXPENSE',
        category: 'Teknoloji',
        amount: 1200,
        description: 'Yazılım lisansları',
        date: new Date('2024-01-10'),
      },
      {
        userId: user.id,
        type: 'EXPENSE',
        category: 'Ulaşım',
        amount: 850,
        description: 'Yakıt gideri',
        date: new Date('2024-01-12'),
      },
    ],
  })

  // Normal bir kullanıcı da ekleyelim
  const normalUser = await prisma.user.upsert({
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

  // Normal kullanıcı için bir müşteri ekleyelim
  await prisma.client.upsert({
    where: { id: 'client-demo' },
    update: {},
    create: {
      id: 'client-demo',
      name: 'Demo Müşteri',
      email: 'demo@client.com',
      phone: '+90 212 333 44 55',
      address: 'İzmir, Türkiye',
      taxId: '5555555555',
      userId: normalUser.id,
    },
  })

  console.log('✅ Seed veriler başarıyla oluşturuldu!')
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
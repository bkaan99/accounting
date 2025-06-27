# Muhasebe Uygulaması

Modern ve kullanıcı dostu bir muhasebe uygulaması. Next.js 14, Prisma, NextAuth ve Tailwind CSS kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- ✅ **Kullanıcı Kimlik Doğrulaması** - Güvenli giriş/kayıt sistemi
- ✅ **Dashboard** - Gelir/gider özet paneli ve grafikler
- ✅ **Müşteri Yönetimi** - Müşteri ekleme, düzenleme, silme
- ✅ **Fatura Oluşturma** - Detaylı faturalar oluşturma ve yönetme
- ✅ **İşlem Takibi** - Gelir/gider kayıtları
- ✅ **Ayarlar** - Kullanıcı ve şirket bilgileri
- ✅ **Responsive Tasarım** - Mobil ve desktop uyumlu
- ✅ **Dark Mode** - Koyu tema desteği

## 🛠️ Teknolojiler

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js
- **Validation:** Zod
- **Forms:** React Hook Form

## 📋 Gereksinimler

- Node.js 18+ 
- PostgreSQL veritabanı
- npm veya yarn

## 🚀 Kurulum

1. **Projeyi klonlayın:**
\`\`\`bash
git clone <repo-url>
cd muhasebe-uygulamasi
\`\`\`

2. **Paketleri yükleyin:**
\`\`\`bash
npm install
\`\`\`

3. **Çevre değişkenlerini ayarlayın:**
\`\`\`bash
cp .env.example .env
\`\`\`

\`.env\` dosyasını düzenleyin:
\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/muhasebe_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
\`\`\`

4. **Veritabanını hazırlayın:**
\`\`\`bash
npx prisma db push
npm run db:seed
\`\`\`

5. **Uygulamayı başlatın:**
\`\`\`bash
npm run dev
\`\`\`

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 🔑 Test Hesabı

Uygulamayı test etmek için aşağıdaki bilgileri kullanabilirsiniz:

- **E-posta:** test@muhasebe.com
- **Şifre:** 123456

## 📱 Kullanım

### Dashboard
- Toplam gelir, gider ve kar görüntülemesi
- Son işlemler ve faturalar listesi
- Özet istatistikler

### Müşteriler
- Yeni müşteri ekleme
- Müşteri bilgilerini düzenleme
- Müşteri arama ve filtreleme

### Faturalar
- Yeni fatura oluşturma
- Fatura durumu takibi (Taslak, Gönderildi, Ödendi)
- PDF fatura export (yakında)

### İşlemler
- Gelir/gider kayıtları
- Kategori bazında gruplandırma
- Tarih filtreleme

## 🚢 Vercel Deployment

1. **Vercel hesabınıza projeyi import edin**
2. **Çevre değişkenlerini Vercel dashboard'da ayarlayın**
3. **PostgreSQL veritabanını bağlayın (Vercel Postgres önerilir)**
4. **Deploy edin**

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (\`git checkout -b feature/amazing-feature\`)
3. Commit edin (\`git commit -m 'Add some amazing feature'\`)
4. Push edin (\`git push origin feature/amazing-feature\`)
5. Pull Request oluşturun

## 📞 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

---

⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın! 
# Docker Kullanım Kılavuzu

Bu proje Docker ile containerize edilmiştir. Aşağıdaki adımları takip ederek uygulamayı çalıştırabilirsiniz.

## Gereksinimler

- Docker (20.10 veya üzeri)
- Docker Compose (2.0 veya üzeri)

## Hızlı Başlangıç

### 1. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değerleri doldurun:

```bash
cp .env.example .env
```

Önemli: `NEXTAUTH_SECRET` değerini güvenli bir şekilde değiştirin.

### 2. Docker Compose ile Çalıştırma

```bash
# Uygulamayı build edip çalıştır
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Durdur
docker-compose down
```

### 3. Veritabanını Başlatma

İlk çalıştırmada veritabanını oluşturmanız gerekebilir:

```bash
# Container içine gir
docker-compose exec app sh

# Veritabanını oluştur
npx prisma db push

# Seed verilerini yükle (opsiyonel)
npm run db:seed
```

## Manuel Docker Komutları

### Build

```bash
docker build -t muhasebe-app .
```

### Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/prisma/dev.db" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -v $(pwd)/prisma/prisma:/app/prisma/prisma \
  muhasebe-app
```

## Production Kullanımı

Production ortamında SQLite yerine PostgreSQL kullanmanız önerilir. `docker-compose.prod.yml` dosyası oluşturarak PostgreSQL ekleyebilirsiniz.

## Sorun Giderme

### Port Zaten Kullanılıyor

Eğer 3000 portu kullanılıyorsa, `docker-compose.yml` dosyasındaki port numarasını değiştirin:

```yaml
ports:
  - "3001:3000"  # 3001 portunu kullan
```

### Veritabanı Sorunları

Veritabanı dosyası container içinde kalıcı olmalı. Volume mount'un doğru çalıştığından emin olun.

### Build Hataları

Eğer build sırasında hata alırsanız:

```bash
# Cache'i temizle ve yeniden build et
docker-compose build --no-cache
```

## Geliştirme

Geliştirme için Docker kullanmak istemiyorsanız:

```bash
npm install
npm run dev
```


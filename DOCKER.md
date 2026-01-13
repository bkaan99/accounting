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

Önemli: 
- `NEXTAUTH_SECRET` değerini güvenli bir şekilde değiştirin.
- `POSTGRES_PASSWORD` değerini production ortamında mutlaka değiştirin.

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

PostgreSQL servisi otomatik olarak başlatılır. İlk çalıştırmada veritabanı şemasını oluşturmanız gerekir:

```bash
# Container içine gir
docker-compose exec app sh

# Veritabanı şemasını oluştur
npx prisma db push

# Seed verilerini yükle (opsiyonel)
npm run db:seed
```

**Not:** PostgreSQL servisi sağlıklı hale gelene kadar app servisi bekler (healthcheck ile).

## Manuel Docker Komutları

### Build

```bash
docker build -t muhasebe-app .
```

### Run

PostgreSQL servisi ayrı bir container olarak çalıştırılmalıdır. Docker Compose kullanmanız önerilir.

## Production Kullanımı

Proje artık PostgreSQL kullanmaktadır. Production ortamında:

1. Güvenli bir `POSTGRES_PASSWORD` belirleyin
2. `NEXTAUTH_SECRET` değerini güvenli bir şekilde oluşturun
3. Veritabanı yedekleme stratejisi oluşturun
4. PostgreSQL volume'ünü düzenli olarak yedekleyin

## Sorun Giderme

### Port Zaten Kullanılıyor

Eğer 3000 portu kullanılıyorsa, `docker-compose.yml` dosyasındaki port numarasını değiştirin:

```yaml
ports:
  - "3001:3000"  # 3001 portunu kullan
```

### Veritabanı Sorunları

PostgreSQL veritabanı `postgres_data` volume'ünde saklanır. Volume'ün doğru çalıştığından emin olun:

```bash
# Volume'leri kontrol et
docker volume ls

# PostgreSQL loglarını kontrol et
docker-compose logs postgres

# PostgreSQL'e bağlanmayı test et
docker-compose exec postgres psql -U muhasebe -d muhasebe_db
```

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


#!/bin/sh
set -e

echo "🚀 Container başlatılıyor..."

# docker-compose'un depends_on ve healthcheck'i PostgreSQL'in hazır olmasını sağlar
# Ama yine de birkaç saniye bekleyelim
echo "⏳ PostgreSQL'in tamamen hazır olması bekleniyor..."
sleep 5

# Prisma Client'ı generate et
echo "🔄 Prisma Client generate ediliyor..."
npx prisma generate || {
  echo "⚠️  Prisma Client generate edilemedi, devam ediliyor..."
}

# Veritabanı şemasını oluştur/güncelle
echo "📊 Veritabanı şeması oluşturuluyor/güncelleniyor..."
npx prisma db push || {
  echo "⚠️  Veritabanı şeması oluşturulurken hata oluştu, devam ediliyor..."
}

# Seed çalıştır (RUN_SEED=true ise veya development modunda)
if [ "$RUN_SEED" = "true" ] || [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Seed verileri yükleniyor..."
  npm run db:seed || {
    echo "⚠️  Seed verileri yüklenirken hata oluştu (normal olabilir), devam ediliyor..."
  }
else
  echo "ℹ️  Seed atlanıyor (RUN_SEED=false ve NODE_ENV=production)"
fi

echo "✅ Veritabanı hazırlandı!"
echo "🚀 Uygulama başlatılıyor..."

# Uygulamayı başlat
exec "$@"


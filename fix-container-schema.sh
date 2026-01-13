#!/bin/bash

echo "🔧 Container içindeki schema dosyasını düzeltiliyor..."

# Container içindeki schema'yı kontrol et
echo "📋 Container içindeki mevcut schema:"
docker-compose exec -T app head -15 prisma/schema.prisma

echo ""
echo "🔄 Schema dosyasını PostgreSQL'e güncelliyor..."

# Container içinde schema dosyasını güncelle
docker-compose exec -T app sh -c 'sed -i "s/provider = \"sqlite\"/provider = \"postgresql\"/g" prisma/schema.prisma'

echo "✅ Schema güncellendi!"
echo ""
echo "📋 Güncellenmiş schema:"
docker-compose exec -T app head -15 prisma/schema.prisma

echo ""
echo "🔄 Prisma Client'ı yeniden generate ediliyor..."
docker-compose exec app npx prisma generate

echo ""
echo "📊 Veritabanı şemasını oluşturuluyor..."
docker-compose exec app npx prisma db push

echo ""
echo "🌱 Seed verilerini yükleniyor..."
docker-compose exec app npm run db:seed

echo ""
echo "✅ Tüm işlemler tamamlandı!"


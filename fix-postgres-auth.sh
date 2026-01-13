#!/bin/bash

echo "🔧 PostgreSQL kimlik doğrulama sorununu düzeltiliyor..."

echo ""
echo "📋 Mevcut durum:"
echo "   - POSTGRES_USER: ${POSTGRES_USER:-muhasebe} (default)"
echo "   - POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-muhasebe123} (default)"
echo "   - POSTGRES_DB: ${POSTGRES_DB:-muhasebe_db} (default)"

echo ""
echo "⚠️  PostgreSQL container'ı ve volume'ü temizleniyor..."
docker-compose down -v

echo ""
echo "🔄 Container'lar yeniden başlatılıyor..."
docker-compose up -d

echo ""
echo "⏳ PostgreSQL'in hazır olması bekleniyor..."
sleep 5

echo ""
echo "🔍 PostgreSQL bağlantısı test ediliyor..."
docker-compose exec -T postgres psql -U muhasebe -d muhasebe_db -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL bağlantısı başarılı!"
    echo ""
    echo "📊 Veritabanı şemasını oluşturuluyor..."
    docker-compose exec app npx prisma db push
    
    echo ""
    echo "🌱 Seed verilerini yükleniyor..."
    docker-compose exec app npm run db:seed
    
    echo ""
    echo "✅ Tüm işlemler tamamlandı!"
else
    echo ""
    echo "❌ PostgreSQL bağlantısı başarısız!"
    echo ""
    echo "🔍 Kontrol edin:"
    echo "   1. .env dosyasındaki POSTGRES_USER ve POSTGRES_PASSWORD değerleri"
    echo "   2. docker-compose.yml'deki DATABASE_URL formatı"
    echo ""
    echo "📋 PostgreSQL loglarını kontrol edin:"
    echo "   docker-compose logs postgres"
fi


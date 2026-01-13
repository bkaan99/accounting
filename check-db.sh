#!/bin/bash

echo "🔍 Veritabanı bağlantısını kontrol ediliyor..."

# .env dosyası var mı?
if [ ! -f .env ]; then
    echo "❌ .env dosyası bulunamadı!"
    echo "📝 .env.example dosyasını .env olarak kopyalayın:"
    echo "   cp .env.example .env"
    exit 1
fi

# DATABASE_URL kontrolü
if grep -q "DATABASE_URL" .env; then
    DB_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ $DB_URL == postgresql://* ]] || [[ $DB_URL == postgres://* ]]; then
        echo "✅ DATABASE_URL doğru formatta: $DB_URL"
    else
        echo "❌ DATABASE_URL yanlış formatta!"
        echo "   Şu formatta olmalı: postgresql://user:password@host:port/database"
        echo "   Mevcut: $DB_URL"
        exit 1
    fi
else
    echo "❌ .env dosyasında DATABASE_URL bulunamadı!"
    exit 1
fi

# Schema kontrolü
if grep -q 'provider = "postgresql"' prisma/schema.prisma; then
    echo "✅ Prisma schema PostgreSQL için yapılandırılmış"
else
    echo "❌ Prisma schema PostgreSQL için yapılandırılmamış!"
    exit 1
fi

echo ""
echo "✅ Tüm kontroller başarılı!"
echo ""
echo "📋 Sonraki adımlar:"
echo "   1. docker-compose down"
echo "   2. docker-compose build --no-cache app"
echo "   3. docker-compose up -d"
echo "   4. docker-compose exec app npx prisma generate"
echo "   5. docker-compose exec app npx prisma db push"
echo "   6. docker-compose exec app npm run db:seed"


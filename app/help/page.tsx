'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Download, FileText, HelpCircle } from 'lucide-react'

export default function HelpPage() {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadPDF = async () => {
    setIsDownloading(true)
    try {
      // Create a new window with the user manual content
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Muhasebe Uygulaması Kullanım Kılavuzu</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
              }
              h1 {
                color: #2563eb;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 10px;
                margin-bottom: 30px;
              }
              h2 {
                color: #1e40af;
                margin-top: 30px;
                margin-bottom: 15px;
                border-left: 4px solid #3b82f6;
                padding-left: 15px;
              }
              h3 {
                color: #1e3a8a;
                margin-top: 20px;
                margin-bottom: 10px;
              }
              ul, ol {
                margin-left: 20px;
              }
              li {
                margin-bottom: 5px;
              }
              strong {
                color: #1e40af;
              }
              .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 5px;
                padding: 10px;
                margin: 15px 0;
              }
              .feature-list {
                background: #f0f9ff;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
              }
              .code {
                background: #f3f4f6;
                padding: 2px 5px;
                border-radius: 3px;
                font-family: monospace;
              }
              hr {
                border: none;
                border-top: 2px solid #e5e7eb;
                margin: 30px 0;
              }
              .toc {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 5px;
                padding: 20px;
                margin: 20px 0;
              }
              .toc ul {
                list-style-type: none;
                margin-left: 0;
              }
              .toc li {
                margin-bottom: 3px;
              }
              @media print {
                body { margin: 0; padding: 15px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>📊 Muhasebe Uygulaması Kullanım Kılavuzu</h1>
            
            <div class="toc">
              <h2>📋 İçindekiler</h2>
              <ul>
                <li>1. Giriş</li>
                <li>2. Başlangıç</li>
                <li>3. Dashboard</li>
                <li>4. Tedarikçi Yönetimi</li>
                <li>5. Fatura Yönetimi</li>
                <li>6. İşlem Yönetimi</li>
                <li>7. Filtreleme ve Arama</li>
                <li>8. PDF İşlemleri</li>
                <li>9. Ayarlar</li>
                <li>10. Süperadmin Özellikleri</li>
                <li>11. Sık Sorulan Sorular</li>
              </ul>
            </div>

            <hr>

            <h2>🚀 Giriş</h2>
            <p>Bu muhasebe uygulaması, küçük ve orta ölçekli işletmelerin finansal işlemlerini takip etmelerine yardımcı olmak için geliştirilmiştir. Uygulama ile fatura oluşturabilir, tedarikçi bilgilerini yönetebilir, gelir-gider takibi yapabilir ve detaylı raporlar alabilirsiniz.</p>

            <div class="feature-list">
              <h3>🌟 Temel Özellikler</h3>
              <ul>
                <li><strong>Dashboard:</strong> Genel finansal durum görüntüleme</li>
                <li><strong>Tedarikçi Yönetimi:</strong> Tedarikçi bilgileri ekleme/düzenleme</li>
                <li><strong>Fatura Yönetimi:</strong> Fatura oluşturma, düzenleme, PDF indirme</li>
                <li><strong>İşlem Takibi:</strong> Gelir/gider kayıtları</li>
                <li><strong>Filtreleme:</strong> Gelişmiş arama ve filtreleme</li>
                <li><strong>Dark Mode:</strong> Karanlık tema desteği</li>
                <li><strong>Responsive:</strong> Mobil uyumlu tasarım</li>
              </ul>
            </div>

            <hr>

            <h2>🏁 Başlangıç</h2>
            
            <h3>🔐 Giriş Yapma</h3>
            <ol>
              <li>Uygulamaya giriş yapmak için email ve şifrenizi girin</li>
              <li>"Giriş Yap" butonuna tıklayın</li>
              <li>Başarılı girişten sonra Dashboard sayfasına yönlendirileceksiniz</li>
            </ol>

            <h3>📝 Kayıt Olma</h3>
            <ol>
              <li>Giriş sayfasında "Kayıt Ol" linkine tıklayın</li>
              <li>Gerekli bilgileri doldurun: Ad Soyad, Email, Şifre</li>
              <li>"Kayıt Ol" butonuna tıklayın</li>
            </ol>

            <h3>🧭 Navigasyon</h3>
            <p>Sol menüde bulunan sekmeler:</p>
            <ul>
              <li><strong>Dashboard:</strong> Ana sayfa</li>
              <li><strong>Tedarikçiler:</strong> Tedarikçi listesi ve yönetimi</li>
              <li><strong>Faturalar:</strong> Fatura listesi ve yönetimi</li>
              <li><strong>İşlemler:</strong> Gelir/gider işlemleri</li>
              <li><strong>Ayarlar:</strong> Kullanıcı ayarları</li>
            </ul>

            <hr>

            <h2>📊 Dashboard</h2>
            <p>Dashboard, işletmenizin genel durumunu gösterir.</p>

            <h3>📈 Önemli Metrikler</h3>
            <ol>
              <li><strong>Toplam Gelir:</strong> Tüm gelir işlemlerinin toplamı</li>
              <li><strong>Toplam Gider:</strong> Tüm gider işlemlerinin toplamı</li>
              <li><strong>Net Kar:</strong> Gelir - Gider farkı</li>
              <li><strong>Toplam Tedarikçi:</strong> Sistemdeki tedarikçi sayısı</li>
              <li><strong>Çalışma Süresi:</strong> Uygulamanın ne kadar süredir çalıştığı</li>
            </ol>

            <hr>

            <h2>👥 Tedarikçi Yönetimi</h2>

            <h3>➕ Yeni Tedarikçi Ekleme</h3>
            <ol>
              <li><strong>Tedarikçiler</strong> sekmesine gidin</li>
              <li><strong>"Yeni Tedarikçi"</strong> butonuna tıklayın</li>
              <li>Gerekli bilgileri doldurun: Ad (zorunlu), Email (zorunlu), Telefon, Adres</li>
              <li><strong>"Tedarikçi Ekle"</strong> butonuna tıklayın</li>
            </ol>

            <div class="warning">
              <strong>⚠️ Dikkat:</strong> Tedarikçiyi sildikten sonra o tedarikçiye ait faturalar da silinir.
            </div>

            <hr>

            <h2>🧾 Fatura Yönetimi</h2>

            <h3>📄 Yeni Fatura Oluşturma</h3>
            <ol>
              <li><strong>Faturalar</strong> sekmesine gidin</li>
              <li><strong>"Yeni Fatura"</strong> butonuna tıklayın</li>
              <li>Fatura bilgilerini doldurun: Tedarikçi, Fatura Tarihi, Vade Tarihi, Notlar</li>
              <li><strong>"Kalem Ekle"</strong> butonuna tıklayarak ürün/hizmet ekleyin</li>
              <li><strong>"Fatura Oluştur"</strong> butonuna tıklayın</li>
            </ol>

            <h3>🏷️ Fatura Durumları</h3>
            <ul>
              <li><strong>Taslak:</strong> Henüz gönderilmemiş fatura</li>
              <li><strong>Gönderildi:</strong> Tedarikçiye gönderilmiş fatura</li>
              <li><strong>Ödendi:</strong> Ödemesi alınmış fatura</li>
              <li><strong>Gecikmiş:</strong> Vade tarihi geçmiş, ödenmemiş fatura</li>
            </ul>

            <hr>

            <h2>💰 İşlem Yönetimi</h2>

            <h3>➕ Yeni İşlem Ekleme</h3>
            <ol>
              <li><strong>İşlemler</strong> sekmesine gidin</li>
              <li><strong>"Yeni İşlem"</strong> butonuna tıklayın</li>
              <li>İşlem türünü seçin: Gelir (yeşil) veya Gider (kırmızı)</li>
              <li>Gerekli bilgileri doldurun: Kategori, Tutar, Tarih, Açıklama</li>
            </ol>

            <h3>📊 Gelir Kategorileri</h3>
            <p>Satış, Hizmet, Faiz, Kira, Komisyon, Diğer</p>

            <h3>📉 Gider Kategorileri</h3>
            <p>Kira, Maaş, Elektrik, Su, Telefon, İnternet, Yakıt, Kırtasiye, Yemek, Ulaşım, Vergi, Sigorta, Bakım-Onarım, Pazarlama, Danışmanlık, Diğer</p>

            <hr>

            <h2>🔍 Filtreleme ve Arama</h2>

            <h3>📋 Fatura Filtreleri</h3>
            <h4>⚡ Hızlı Filtreler</h4>
            <ul>
              <li>Tümü, Taslak, Gönderildi, Ödendi, Gecikmiş</li>
            </ul>

            <h4>🔧 Gelişmiş Filtreler</h4>
            <ul>
              <li>Tedarikçi bazlı filtreleme</li>
              <li>Fatura numarası arama</li>
              <li>Tarih aralığı seçimi</li>
              <li>Tutar aralığı belirleme</li>
            </ul>

            <h3>💸 İşlem Filtreleri</h3>
            <ul>
              <li>Gelir/Gider türü seçimi</li>
              <li>Kategori bazlı filtreleme</li>
              <li>Tarih ve tutar aralığı</li>
              <li>Açıklama içinde arama</li>
            </ul>

            <hr>

            <h2>📄 PDF İşlemleri</h2>

            <h3>⬇️ Fatura PDF'i İndirme</h3>
            <ol>
              <li>Fatura listesinde veya detay sayfasında <strong>"PDF İndir"</strong> butonuna tıklayın</li>
              <li>PDF otomatik olarak indirilir</li>
            </ol>

            <h3>👁️ PDF Önizleme</h3>
            <ol>
              <li><strong>"PDF Önizle"</strong> butonuna tıklayın</li>
              <li>PDF yeni sekmede açılır</li>
            </ol>

            <h3>📋 PDF İçeriği</h3>
            <ul>
              <li>Şirket ve tedarikçi bilgileri</li>
              <li>Fatura detayları (numara, tarih, vade)</li>
              <li>Kalemler tablosu</li>
              <li>Toplam hesaplamalar (KDV dahil)</li>
              <li>Elektronik fatura damgası</li>
            </ul>

            <hr>

            <h2>⚙️ Ayarlar</h2>

            <h3>👤 Profil Bilgileri</h3>
            <ul>
              <li>Ad Soyad güncelleme</li>
              <li>Email değiştirme</li>
              <li>Şifre yenileme</li>
            </ul>

            <h3>🌙 Tema Ayarları</h3>
            <p>Sağ üst köşedeki güneş/ay ikonuna tıklayarak karanlık/aydınlık tema arasında geçiş yapın.</p>

            <hr>

            <h2>🛡️ Süperadmin Özellikleri</h2>
            <p>Süperadmin yetkisine sahip kullanıcılar ek menülere erişebilir:</p>
            <ul>
              <li><strong>Kullanıcı Yönetimi:</strong> Tüm kullanıcıları görüntüleme ve yönetme</li>
              <li><strong>Global İstatistikler:</strong> Sistem geneli raporlar</li>
              <li><strong>Sistem Yönetimi:</strong> Sistem ayarları ve log dosyaları</li>
            </ul>

            <hr>

            <h2>❓ Sık Sorulan Sorular</h2>

            <h3>🔒 Güvenlik</h3>
            <p><strong>S: Verilerim güvende mi?</strong><br>
            C: Evet, tüm veriler şifrelenmiş olarak saklanır ve sadece sizin hesabınızla erişilebilir.</p>

            <h3>📱 Uyumluluk</h3>
            <p><strong>S: Mobil cihazlarda kullanabilir miyim?</strong><br>
            C: Evet, uygulama responsive tasarıma sahiptir ve tüm cihazlarda sorunsuz çalışır.</p>

            <h3>🧾 Faturalar</h3>
            <p><strong>S: Fatura numaraları otomatik mı oluşuyor?</strong><br>
            C: Evet, fatura numaraları otomatik olarak INV-0001 formatında oluşturulur.</p>

            <hr>

            <h2>📞 Destek</h2>
            <p>Herhangi bir sorun yaşadığınızda:</p>
            <ol>
              <li>Bu kılavuzu tekrar inceleyin</li>
              <li>Sistem yöneticisiyle iletişime geçin</li>
              <li>Karşılaştığınız hataları detaylı şekilde bildirin</li>
            </ol>

            <hr>

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 5px;">
              <h2>📋 Sürüm Bilgileri</h2>
              <p><strong>Versiyon:</strong> 1.0.0</p>
              <p><strong>Son Güncelleme:</strong> 2024</p>
              <p><strong>Teknolojiler:</strong> Next.js, React, TypeScript, Tailwind CSS, Prisma</p>
              <br>
              <p><em>Bu kılavuz, Muhasebe Uygulaması'nın tüm özelliklerini kapsamlı şekilde açıklamaktadır.</em></p>
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()

        // Wait a bit for content to load, then print
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 1000)
      }
    } catch (error) {
      console.error('PDF download error:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const sections = [
    {
      title: 'Başlangıç',
      icon: '🚀',
      description: 'Giriş yapma, kayıt olma ve temel navigasyon',
    },
    {
      title: 'Dashboard',
      icon: '📊',
      description: 'Ana sayfa ve önemli metriklerin görüntülenmesi',
    },
    {
      title: 'Tedarikçi Yönetimi',
      icon: '👥',
      description: 'Tedarikçi ekleme, düzenleme ve silme işlemleri',
    },
    {
      title: 'Fatura Yönetimi',
      icon: '🧾',
      description: 'Fatura oluşturma, düzenleme ve PDF işlemleri',
    },
    {
      title: 'İşlem Yönetimi',
      icon: '💰',
      description: 'Gelir/gider işlemlerinin takibi',
    },
    {
      title: 'Filtreleme',
      icon: '🔍',
      description: 'Gelişmiş arama ve filtreleme özellikleri',
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
              Yardım & Kullanım Kılavuzu
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Muhasebe uygulamasının tüm özelliklerini öğrenin
            </p>
          </div>
          <Button
            onClick={downloadPDF}
            disabled={isDownloading}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? 'İndiriliyor...' : 'PDF İndir'}</span>
          </Button>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">{section.icon}</span>
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Help Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>Hızlı Başlangıç</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                🚀 Uygulamaya Başlarken
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Email ve şifrenizle giriş yapın</li>
                <li>Dashboard'dan genel durumunuzu kontrol edin</li>
                <li>İlk tedarikçinizi ekleyin</li>
                <li>İlk faturanızı oluşturun</li>
                <li>Gelir/gider işlemlerinizi kaydedin</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Temel İşlemler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Fatura Oluşturma
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Faturalar → Yeni Fatura → Tedarikçi seç → Kalemler ekle →
                    Oluştur
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    İşlem Ekleme
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    İşlemler → Yeni İşlem → Tür seç (Gelir/Gider) → Bilgileri
                    doldur
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    PDF İndirme
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Fatura detayında → PDF İndir/Önizle → Otomatik indirme
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    Filtreleme
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Filtreler butonu → Kriterleri seç → Sonuçları görüntüle
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">💡 İpuçları</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">💡</span>
                  <span>
                    Fatura numaraları otomatik olarak oluşturulur (INV-0001
                    formatında)
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">💡</span>
                  <span>Dark mode için sağ üstteki tema butonunu kullanın</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">💡</span>
                  <span>
                    Filtreleri temizlemek için "Temizle" butonunu kullanın
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">💡</span>
                  <span>Uygulama mobil cihazlarda da mükemmel çalışır</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Daha Fazla Yardım</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Detaylı kullanım kılavuzu için yukarıdaki "PDF İndir" butonunu
              kullanarak kapsamlı dokümantasyonu indirebilirsiniz.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>📄</span>
                <span>Kapsamlı kullanım kılavuzu</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>🖼️</span>
                <span>Görsel açıklamalar</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>❓</span>
                <span>Sık sorulan sorular</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>🛠️</span>
                <span>Teknik detaylar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

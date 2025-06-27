# Muhasebe Uygulaması Kullanım Kılavuzu

## İçindekiler

1. [Giriş](#giriş)
2. [Başlangıç](#başlangıç)
3. [Dashboard](#dashboard)
4. [Müşteri Yönetimi](#müşteri-yönetimi)
5. [Fatura Yönetimi](#fatura-yönetimi)
6. [İşlem Yönetimi](#işlem-yönetimi)
7. [Filtreleme ve Arama](#filtreleme-ve-arama)
8. [PDF İşlemleri](#pdf-işlemleri)
9. [Ayarlar](#ayarlar)
10. [Süperadmin Özellikleri](#süperadmin-özellikleri)
11. [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## Giriş

Bu muhasebe uygulaması, küçük ve orta ölçekli işletmelerin finansal işlemlerini takip etmelerine yardımcı olmak için geliştirilmiştir. Uygulama ile fatura oluşturabilir, müşteri bilgilerini yönetebilir, gelir-gider takibi yapabilir ve detaylı raporlar alabilirsiniz.

### Temel Özellikler

- 📊 **Dashboard**: Genel finansal durum görüntüleme
- 👥 **Müşteri Yönetimi**: Müşteri bilgileri ekleme/düzenleme
- 🧾 **Fatura Yönetimi**: Fatura oluşturma, düzenleme, PDF indirme
- 💰 **İşlem Takibi**: Gelir/gider kayıtları
- 🔍 **Filtreleme**: Gelişmiş arama ve filtreleme
- 🌙 **Dark Mode**: Karanlık tema desteği
- 📱 **Responsive**: Mobil uyumlu tasarım

---

## Başlangıç

### Giriş Yapma

1. Uygulamaya giriş yapmak için email ve şifrenizi girin
2. "Giriş Yap" butonuna tıklayın
3. Başarılı girişten sonra Dashboard sayfasına yönlendirileceksiniz

### Kayıt Olma

1. Giriş sayfasında "Kayıt Ol" linkine tıklayın
2. Gerekli bilgileri doldurun:
   - Ad Soyad
   - Email
   - Şifre
3. "Kayıt Ol" butonuna tıklayın

### Navigasyon

Sol menüde bulunan sekmeler:

- **Dashboard**: Ana sayfa
- **Müşteriler**: Müşteri listesi ve yönetimi
- **Faturalar**: Fatura listesi ve yönetimi
- **İşlemler**: Gelir/gider işlemleri
- **Ayarlar**: Kullanıcı ayarları

---

## Dashboard

Dashboard, işletmenizin genel durumunu gösterir.

### Önemli Metrikler

1. **Toplam Gelir**: Tüm gelir işlemlerinin toplamı
2. **Toplam Gider**: Tüm gider işlemlerinin toplamı
3. **Net Kar**: Gelir - Gider farkı
4. **Toplam Müşteri**: Sistemdeki müşteri sayısı
5. **Çalışma Süresi**: Uygulamanın ne kadar süredir çalıştığı

### Son İşlemler

- En son eklenen 5 işlem görüntülenir
- Her işlemde kategori, açıklama, tarih ve tutar bilgileri yer alır
- Gelirler yeşil (+), giderler kırmızı (-) ile gösterilir

### Son Faturalar

- En son oluşturulan 5 fatura görüntülenir
- Fatura numarası, müşteri adı, tutar ve durum bilgileri yer alır

---

## Müşteri Yönetimi

### Yeni Müşteri Ekleme

1. **Müşteriler** sekmesine gidin
2. **"Yeni Müşteri"** butonuna tıklayın
3. Gerekli bilgileri doldurun:
   - **Ad**: Müşteri adı (zorunlu)
   - **Email**: Email adresi (zorunlu)
   - **Telefon**: Telefon numarası
   - **Adres**: Posta adresi
4. **"Müşteri Ekle"** butonuna tıklayın

### Müşteri Düzenleme

1. Müşteri listesinde düzenlemek istediğiniz müşterinin yanındaki **"Düzenle"** butonuna tıklayın
2. Bilgileri güncelleyin
3. **"Güncelle"** butonuna tıklayın

### Müşteri Silme

1. Müşteri listesinde silmek istediğiniz müşterinin yanındaki **"Sil"** butonuna tıklayın
2. Onay dialogunda **"Evet, Sil"** butonuna tıklayın

⚠️ **Dikkat**: Müşteriyi sildikten sonra o müşteriye ait faturalar da silinir.

---

## Fatura Yönetimi

### Yeni Fatura Oluşturma

1. **Faturalar** sekmesine gidin
2. **"Yeni Fatura"** butonuna tıklayın
3. Fatura bilgilerini doldurun:
   - **Müşteri**: Dropdown'dan müşteri seçin
   - **Fatura Tarihi**: Fatura düzenlenme tarihi
   - **Vade Tarihi**: Ödeme vade tarihi
   - **Notlar**: Ek açıklamalar (opsiyonel)

### Fatura Kalemleri Ekleme

1. **"Kalem Ekle"** butonuna tıklayın
2. Her kalem için:
   - **Açıklama**: Ürün/hizmet açıklaması
   - **Miktar**: Adet
   - **Birim Fiyat**: TL cinsinden fiyat
3. Toplam tutar otomatik hesaplanır
4. **"Fatura Oluştur"** butonuna tıklayın

### Fatura Durumları

- **Taslak**: Henüz gönderilmemiş fatura
- **Gönderildi**: Müşteriye gönderilmiş fatura
- **Ödendi**: Ödemesi alınmış fatura
- **Gecikmiş**: Vade tarihi geçmiş, ödenmemiş fatura

### Fatura İşlemleri

Her fatura için mevcut işlemler:

1. **Görüntüle**: Fatura detaylarını görüntüleme
2. **Düzenle**: Fatura bilgilerini değiştirme
3. **PDF İndir**: Faturayı PDF olarak indirme
4. **PDF Önizle**: Faturayı tarayıcıda görüntüleme
5. **Durum Güncelle**: Fatura durumunu değiştirme
6. **Sil**: Faturayı silme

---

## İşlem Yönetimi

### Yeni İşlem Ekleme

1. **İşlemler** sekmesine gidin
2. **"Yeni İşlem"** butonuna tıklayın
3. İşlem türünü seçin:
   - **Gelir**: Yeşil buton
   - **Gider**: Kırmızı buton

### İşlem Bilgileri

4. Gerekli bilgileri doldurun:
   - **Kategori**: Dropdown'dan kategori seçin
   - **Tutar**: TL cinsinden tutar
   - **Tarih**: İşlem tarihi
   - **Açıklama**: İşlem açıklaması

### Gelir Kategorileri

- Satış
- Hizmet
- Faiz
- Kira
- Komisyon
- Diğer

### Gider Kategorileri

- Kira
- Maaş
- Elektrik
- Su
- Telefon
- İnternet
- Yakıt
- Kırtasiye
- Yemek
- Ulaşım
- Vergi
- Sigorta
- Bakım-Onarım
- Pazarlama
- Danışmanlık
- Diğer

### İşlem Düzenleme/Silme

1. İşlem listesinde **"İşlemler"** sütunundaki butonları kullanın
2. **Düzenle**: İşlem bilgilerini güncelleyin
3. **Sil**: İşlemi kalıcı olarak silin

---

## Filtreleme ve Arama

### Fatura Filtreleri

#### Hızlı Filtreler

- **Tümü**: Tüm faturaları göster
- **Taslak**: Sadece taslak faturaları
- **Gönderildi**: Gönderilmiş faturaları
- **Ödendi**: Ödenmiş faturaları
- **Gecikmiş**: Gecikmiş faturaları

#### Gelişmiş Filtreler

**"Filtreler"** butonuna tıklayarak erişin:

1. **Müşteri**: Belirli müşteriye ait faturalar
2. **Fatura No**: Fatura numarasına göre arama
3. **Fatura Tarihi**: Tarih aralığı
4. **Vade Tarihi**: Vade tarih aralığı
5. **Tutar Aralığı**: Min/Max tutar

### İşlem Filtreleri

#### Hızlı Filtreler

- **Tümü**: Tüm işlemleri göster
- **Gelir**: Sadece gelir işlemleri
- **Gider**: Sadece gider işlemleri

#### Gelişmiş Filtreler

1. **Kategori**: Belirli kategoriye ait işlemler
2. **Tarih Aralığı**: Başlangıç ve bitiş tarihi
3. **Tutar Aralığı**: Min/Max tutar
4. **Açıklama Ara**: Açıklama içinde kelime arama

### Filtre Temizleme

- **"Temizle"** butonuna tıklayarak tüm filtreleri sıfırlayın
- Aktif filtre sayısı filtre butonunun yanında gösterilir

---

## PDF İşlemleri

### Fatura PDF'i İndirme

1. Fatura listesinde veya detay sayfasında **"PDF İndir"** butonuna tıklayın
2. PDF otomatik olarak indirilir

### Fatura PDF Önizleme

1. **"PDF Önizle"** butonuna tıklayın
2. PDF yeni sekmede açılır

### PDF İçeriği

Fatura PDF'inde yer alan bilgiler:

- **Şirket Bilgileri**: Fatura düzenleyen bilgileri
- **Müşteri Bilgileri**: Fatura alan müşteri bilgileri
- **Fatura Detayları**: Numara, tarih, vade
- **Kalemler Tablosu**: Açıklama, miktar, birim fiyat, toplam
- **Toplam Hesaplamalar**: Ara toplam, KDV, genel toplam
- **Elektronik Fatura Damgası**: Dijital onay

---

## Ayarlar

### Profil Bilgileri

1. **Ayarlar** sekmesine gidin
2. Profil bilgilerinizi güncelleyebilirsiniz:
   - Ad Soyad
   - Email
   - Şifre değiştirme

### Tema Ayarları

- Sağ üst köşedeki **güneş/ay** ikonuna tıklayarak karanlık/aydınlık tema arasında geçiş yapın

### Oturum Kapatma

- Sağ üst köşedeki profil menüsünden **"Çıkış Yap"** seçeneğini kullanın

---

## Süperadmin Özellikleri

Süperadmin yetkisine sahip kullanıcılar ek menülere erişebilir:

### Kullanıcı Yönetimi

- Tüm kullanıcıları görüntüleme
- Kullanıcı ekleme/düzenleme/silme
- Yetki seviyesi belirleme

### Global İstatistikler

- Tüm sistemdeki istatistikleri görüntüleme
- Kullanıcı bazlı raporlar
- Sistem performans metrikleri

### Sistem Yönetimi

- Sistem ayarları
- Veritabanı yönetimi
- Log dosyaları

---

## Sık Sorulan Sorular

### Genel Sorular

**S: Verilerim güvende mi?**
C: Evet, tüm veriler şifrelenmiş olarak saklanır ve sadece sizin hesabınızla erişilebilir.

**S: Mobil cihazlarda kullanabilir miyim?**
C: Evet, uygulama responsive tasarıma sahiptir ve tüm cihazlarda sorunsuz çalışır.

**S: Veri yedekleme var mı?**
C: Veriler otomatik olarak yedeklenir ve güvenli sunucularda saklanır.

### Fatura Soruları

**S: Fatura numaraları otomatik mı oluşuyor?**
C: Evet, fatura numaraları otomatik olarak INV-0001 formatında oluşturulur.

**S: Fatura düzenledikten sonra değiştirebilir miyim?**
C: Evet, fatura durumu "Taslak" iken tüm bilgileri değiştirebilirsiniz.

**S: PDF'de KDV hesaplaması var mı?**
C: Evet, PDF'de KDV hesaplaması otomatik olarak yapılır.

### İşlem Soruları

**S: Geçmiş tarihli işlem ekleyebilir miyim?**
C: Evet, istediğiniz tarihi seçerek geçmiş tarihli işlem ekleyebilirsiniz.

**S: İşlem kategorilerini değiştirebilir miyim?**
C: Şu anda önceden tanımlanmış kategoriler kullanılmaktadır.

**S: Toplu işlem ekleme mümkün mü?**
C: Şu anda tekil işlem ekleme desteklenmektedir.

### Teknik Sorular

**S: Hangi tarayıcılarda çalışır?**
C: Chrome, Firefox, Safari ve Edge'in güncel sürümlerinde çalışır.

**S: İnternet bağlantısı olmadan kullanabilir miyim?**
C: Hayır, uygulama internet bağlantısı gerektirir.

**S: Veri dışa aktarma mümkün mü?**
C: PDF indirme özelliği mevcuttur, Excel dışa aktarma gelecek sürümlerde eklenecektir.

---

## Destek

Herhangi bir sorun yaşadığınızda veya yardıma ihtiyacınız olduğunda:

1. **Dokümantasyon**: Bu kılavuzu tekrar inceleyin
2. **İletişim**: Sistem yöneticisiyle iletişime geçin
3. **Hata Bildirimi**: Karşılaştığınız hataları detaylı şekilde bildirin

---

## Sürüm Bilgileri

**Versiyon**: 1.0.0  
**Son Güncelleme**: 2024  
**Teknolojiler**: Next.js, React, TypeScript, Tailwind CSS, Prisma

---

_Bu kılavuz, Muhasebe Uygulaması'nın tüm özelliklerini kapsamlı şekilde açıklamaktadır. Düzenli olarak güncellenmektedir._

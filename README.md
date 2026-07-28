# 💧 CanFiyat - Cansızzade Fiyat, Hakediş & Kâr Simülasyon Portalı

CanFiyat, **Cansızzade** markasının uçucu ve sabit yağ ürün yelpazesi için özel olarak geliştirilmiş; **Toptan Ham Yağ Alış Fiyatı (1KG ₺)**, **Ambalaj/Şişe Boyutları (20ml - 1000ml)** ve **Pazaryeri Kesintileri (Trendyol, Hepsiburada, İyzico)** üzerinden anlık hakediş ve net kâr hesaplayan, bulut senkronizasyonlu profesyonel bir finansal simülasyon portalıdır.

---

## 🚀 Projenin Temel Özellikleri & Sistem Mimarisi

### 1. 🌾 Toptan Yağ Alış Fiyatı (1KG ₺) & Otomatik Birim Maliyet Hesabı
* Sitedeki 65 ürünün her biri için (örn: *Sarı Kantaron Yağı, Tatlı Badem Yağı, Biberiye Yağı*) 1KG toptan alış fiyatı tanımlanmıştır.
* Seçilen ambalaj boyutuna (ml / gram) göre toptan yağ maliyeti miligram hassasiyetinde hesaplanır ve üzerine ambalaj/etiket maliyeti eklenerek **Birim Maliyet** bulunur:
  $$\text{Birim Maliyet} = \left(\frac{\text{1KG Toptan Fiyatı}}{1000} \times \text{Ambalaj ml}\right) + \text{Şişe Maliyeti}$$

### 2. 🧴 Bağımsız Ambalaj & Şişe Boyutu Hafızası (20ml - 1000ml / 1kg)
* Her ürünün içinde 7 farklı ambalaj boyutu saklanır: **20ml, 30ml, 50ml, 100ml, 250ml, 500ml, 1000ml (1kg)**.
* **Ürün ve Ambalaj İzolasyonu (v1.09+):** Bir ürünün veya şişenin fiyatlarını değiştirdiğinizde bu değer yalnızca o ürüne ve o ambalaj boyutuna yazılır. Diğer ürünlerin veya şişelerin verilerini **kesinlikle bozmaz!**

### 3. 🧮 5 Farklı Simülasyon ve Hesaplama Sistemi

| Sistem | Açıklama & İşlev |
| :--- | :--- |
| **Sistem 1: Toptandan Fiyat Yarat** | Toptan maliyet üzerine hedeflenen net kârı (örn. 70 ₺) koyarak Trendyol, Hepsiburada ve Web siteniz için açmanız gereken kargo & komisyon dahil **satış etiket fiyatlarını** verir. |
| **Sistem 2: İyzico Fiyatından Eşitle** | Kendi web sitenizdeki (İyzico) satış fiyatınızdan elde ettiğiniz net kârı birebir korumak için Trendyol ve Hepsiburada'da koymanız gereken **eşdeğer satış fiyatlarını** bulur. |
| **Sistem 3: gr/kg Hacim Matrisi** | 1KG toptan maliyet üzerinden 20ml'den 1000ml'ye kadar tüm şişe boyutlarının birim maliyetlerini ve önerilen satış fiyatlarını tek tabloda listeler. |
| **Sistem 4: Perakende Analiz** | Aklınızdaki bir perakende satış etiket fiyatını girdiğinizde kesintiler sonrası size kalacak **net hakedişi, net kârı ve kâr marjını (%)** hesaplar. |
| **Sistem 5: Trendyol Teklif Simülatörü** | Trendyol Satıcı Paneli'ndeki 3 kampanya etiketi seviyesinin (**🟢 1. Avantajlı, 🟡 2. Çok Avantajlı, 🔴 3. Süper Avantajlı**) teklif edilen satış fiyatını ve komisyon oranını girdiğinizde toptan maliyetinize göre **kârda mısınız zararda mısınız** anında gösterir! *(Kurtarmıyorsa ⚠️ ZARAR uyarısı verir)*. |

---

## ⚡ Bulut Senkronizasyon & Veri Mimarisi (Supabase + LocalStorage)

* **Supabase Cloud DB Entegrasyonu:** Değiştirdiğiniz veya yeni eklediğiniz ürün slot ayarları anında bulut veritabanına kaydedilir.
* **Çevrimdışı Çalışma (Offline Resilience):** İnternet bağlantısı kopsa dahi tarayıcı hafızası (LocalStorage) devreye girer, verileriniz asla kaybolmaz.
* **Ücretsiz Altyapı:** Vercel Hosting ve Supabase Bulut Veritabanı %100 ücretsiz (Free Tier) altyapıda çalışır. Hiçbir zaman ücret talep etmez.

---

## 🎨 Kullanıcı Arayüzü & Ergonomi

* **Açılır Kutu (Dropdown) Ambalaj Seçimi:** Ambalaj boyutu seçimi dikey yer kaplamayan şık bir dropdown menüden yapılır.
* **Tek Ekrana Sığan Düzen (Fit-on-Screen):** Sayfayı kaydırmaya gerek kalmadan tüm hesaplama girdileri ve kârlılık sonuçları tek bakışta görünür.
* **Görünüm Modları:** Satır / Tablo görünümü ile Kartlar görünümü arasında tek tıkla geçiş.
* **Hızlı Arama & Filtreleme:** Uçucu Yağlar (23) ve Sabit Yağlar (42) kategorilerine göre tek tıkla filtreleme.
* **Yeni Ürün Ekleme:** Kataloğa yeni özel ürün ekleme ve KDV oranlarını (%1 / %20) ayarlama imkanı.

---

## 🤝 Projeyi Çalıştırma Rehberi

### 🌐 1. Canlı Sürüm Bağlantısı (Vercel)
👉 **[https://canfiyat-two.vercel.app/](https://canfiyat-two.vercel.app/)**

### 📂 2. GitHub Repositori Bağlantısı
👉 **[https://github.com/ahmetsdb/canfiyat.git](https://github.com/ahmetsdb/canfiyat.git)**

---
*CanFiyat Portal Documentation & User Guide - Created for Cansızzade Team & Ahmet* 💧

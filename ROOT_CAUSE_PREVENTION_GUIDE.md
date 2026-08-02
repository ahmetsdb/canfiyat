# CanFiyat Portal - Kök Neden Analizi & Tekrarlanmayı Önleme Rehberi

Bu doküman, CanFiyat uygulamasında yeni bir özellik eklendiğinde veya sayfa yenilendiğinde yaşanan **`TOPLAM ÜRÜN 0` / Boş Ekran** sorununun kök nedenlerini, tarayıcı önbellek (cache) davranışlarını ve bir daha asla tekrarlanmaması için kurulan kalıcı önlem mekanizmalarını açıklar.

---

## 📌 1. Sorunun Kapsamlı Kök Neden Analizi (Root Cause Analysis)

Sistemde yeni bir geliştirme yapıldığında ekranın kilitlenmesine neden olan **3 ana teknik faktör** tespit edilmiştir:

### A. Tarayıcı Önbelleği (Browser Disk Cache & Stale JS Scripts)
- **Problem:** Chrome, Edge ve Safari gibi modern tarayıcılar, ağ trafiğini azaltmak için JavaScript dosyalarını kullanıcı cihazındaki disk önbelleğinde saklar.
- **Neden Yaşanıyordu?:** `index.html` içerisindeki `<script src="js/app.js?v=2.01">` sürüm parametresi her kod güncellemesinde yenilenmediğinde, tarayıcı sunucudaki yeni ve düzeltilmiş kod yerine **kendi diskindeki eski/bozuk `app.js` dosyasını** çalıştırmaya devam eder.

### B. `localStorage` Hafıza Kilitlenmesi (Stale Storage State)
- **Problem:** Kullanıcının tarayıcısındaki `localStorage.getItem("canfiyat_products_vX")` anahtarında geçmiş bir oturumdan kalan boş veya hatalı bir nesne (`{}`) saklandığında, sistem ürün yok zannederek 0 ürün gösterir.

### C. Ayrıştırma Zamanı Sentaks Hataları (Parse-Time SyntaxError)
- **Problem:** Kod düzenlemeleri sırasında, `async` fonksiyon bloklarının dışına taşan yetim bir `await` ifadesi (örneğin: `await StorageManager.saveProduct(...)`) JavaScript derleyicisi tarafından **Parse-Time (Derleme Anı)** hatası olarak yakalanır.
- **Neden Ekran Kararıyordu?:** Dosyada tek bir Parse-Time hatası olduğunda, tarayıcı `js/app.js` dosyasının **tamamını reddeder**. `initApp()` ve `renderProductGrid()` fonksiyonları hiç tanımlanamadığı için sayfa açılışında 0 ürün kalır ve hiçbir butona basılamaz.

---

## 🛡️ 2. Tekrarlanmayı %100 Önleyen Kurulan Kalıcı Mimariler

Sorunun gelecekteki tüm güncellemelerde otomatik olarak engellenmesi için 4 katmanlı güvenlik kalkanı kurulmuştur:

### 1. Senkronize 65 Ürün Taban Eşleştirme Kalkanı (`baseMap`)
`js/storage.js` içerisindeki `StorageManager.getProducts()` fonksiyonu değiştirildi:
- Kullanıcı tarayıcısında ne tür bozuk önbellek verisi saklanırsa saklansın, sistem önce `INITIAL_PRODUCTS` (65 ürün) haritasını hafızada eksiksiz oluşturur.
- Kayıtlı veriler bunun üzerine güvenle birleştirilir (`merge`). Ürün sayısının **0'a düşmesi matematiksel olarak imkansız hale getirilmiştir**.

### 2. Zorunlu Önbellek Kırma (Cache Busting Strategy)
- `index.html` dosyasındaki tüm JavaScript bağlantılarına versiyon parametreleri eklenmiştir (`js/app.js?v=2.02`).
- Yapılan her güncelemede versiyon numarası artırılarak tarayıcının sunucudaki **en son güncel kodu çekmesi zorunlu kılınır**.

### 3. Çift Katman Hata Kalkanı (`try...catch` Isolation)
- `renderProductGrid()` ve `renderLayer2Cards()` fonksiyonlarındaki ürün kartı döngüleri bağımsız `try...catch` bloklarına alınmıştır.
- Herhangi bir üründe eksik veya hatalı veri olsa bile, diğer 64 ürünün ekrana basılması engellenemez.

### 4. Dahili Favicon Bağlantısı
- `/favicon.ico 404` ağ hatalarını önlemek için `index.html` başlığına gömülü SVG ikon eklenmiştir.

---

## 📋 3. Gelecekteki Her Güncellemede Uygulanacak Kontrol Listesi (Checklist)

Her yeni kod geliştirmesinde aşağıdaki kontrol adımları sırasıyla uygulanacaktır:

1. [ ] **Sentaks Kontrolü:** `js/app.js` ve `js/calculator.js` dosyalarında `async` dışı `await` veya parantez hatası bulunmadığı doğrulanacak.
2. [ ] **Versiyon Yükseltme:** `index.html` içindeki `<script src="js/app.js?v=X.XX">` etiketi bir üst sürüme yükseltilecek.
3. [ ] **Storage Key Değişimi:** Büyük şema değişikliklerinde `js/storage.js` içindeki `STORAGE_KEYS.PRODUCTS` anahtarı (`v10`, `v11` vb.) güncellenecek.
4. [ ] **CURL & Canlı Sunucu Doğrulaması:** `git push` sonrası Vercel üzerindeki canlı JS dosyası `curl` ile çekilip hatasız çalıştığı teyit edilecek.

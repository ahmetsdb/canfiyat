// Cansızzade Resmi Fiyat Teklifi Listelerinden Derlenen Ürün Kataloğu
// Faturadaki KDV Hariç Tutarlar + %20 veya %1 KDV = Katman 1 KDV Dahil Fiyatları

const INITIAL_PRODUCTS = [
  // ==========================================
  // UÇUCU YAĞLAR (Essential Oils) - KDV Hariç Fatura Tutarları + %20 KDV = Katman 1 KDV Dahil Fiyatı
  // Default Volume: 1000ml (1KG)
  // ==========================================
  { id: "U.0271", sku: "U.0271", name: "YASEMİN YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1950.00, costPerKg: 2340.00, defaultVolume: "1000ml" },
  { id: "U.0326", sku: "U.0326", name: "BERGAMOT UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2950.00, costPerKg: 3540.00, defaultVolume: "1000ml" },
  { id: "U.0235", sku: "U.0235", name: "BİBERİYE YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1500.00, costPerKg: 1800.00, defaultVolume: "1000ml" },
  { id: "U.0313", sku: "U.0313", name: "Citronella Yağı", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2500.00, costPerKg: 3000.00, defaultVolume: "1000ml" },
  { id: "U.0320", sku: "U.0320", name: "ÇAY AĞACI YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1750.00, costPerKg: 2100.00, defaultVolume: "1000ml" },
  { id: "T.0407", sku: "T.0407", name: "DEFNE YAPRAĞI YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 3950.00, costPerKg: 4740.00, defaultVolume: "1000ml" },
  { id: "U.0332", sku: "U.0332", name: "GREYFURT YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 3500.00, costPerKg: 4200.00, defaultVolume: "1000ml" },
  { id: "U.0106", sku: "U.0106", name: "KARANFİL YAĞI (Tomurcuk)", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 4750.00, costPerKg: 5700.00, defaultVolume: "1000ml" },
  { id: "U.0105", sku: "U.0105", name: "KARANFİL YAĞI (YAPRAK)", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2750.00, costPerKg: 3300.00, defaultVolume: "1000ml" },
  { id: "U.0199", sku: "U.0199", name: "NANE UÇUCU YAĞI peppermint", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2500.00, costPerKg: 3000.00, defaultVolume: "1000ml" },
  { id: "U.0155", sku: "U.0155", name: "LAVANTA YAĞI (intermedia)", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1750.00, costPerKg: 2100.00, defaultVolume: "1000ml" },
  { id: "U.285",  sku: "U.285",  name: "PORTAKAL KABUĞU YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2250.00, costPerKg: 2700.00, defaultVolume: "1000ml" },
  { id: "U.0259", sku: "U.0259", name: "NİOLİ UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1850.00, costPerKg: 2220.00, defaultVolume: "1000ml" },
  { id: "U.0248", sku: "U.0248", name: "OKALİPTUS YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1800.00, costPerKg: 2160.00, defaultVolume: "1000ml" },
  { id: "U.0160", sku: "U.0160", name: "PAÇULİ YAĞI (uçucu)", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 4250.00, costPerKg: 5100.00, defaultVolume: "1000ml" },
  { id: "U.0159", sku: "U.0159", name: "PALMAROSA YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 4000.00, costPerKg: 4800.00, defaultVolume: "1000ml" },
  { id: "U.0308", sku: "U.0308", name: "MANDALİNA YAĞI-YEŞİL", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 1250.00, costPerKg: 1500.00, defaultVolume: "1000ml" },
  { id: "U.0314", sku: "U.0314", name: "SEDİR UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2500.00, costPerKg: 3000.00, defaultVolume: "1000ml" },
  { id: "U.0411", sku: "U.0411", name: "TARÇIN KABUĞU YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2500.00, costPerKg: 3000.00, defaultVolume: "1000ml" },
  { id: "U.0154", sku: "U.0154", name: "LAVANTA YAĞI (angustifolia)", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 2500.00, costPerKg: 3000.00, defaultVolume: "1000ml" },
  { id: "U.0334", sku: "U.0334", name: "ZENCEFİL YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 3500.00, costPerKg: 4200.00, defaultVolume: "1000ml" },
  { id: "U.0095", sku: "U.0095", name: "KEKİK YAĞI", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 5000.00, costPerKg: 6000.00, defaultVolume: "1000ml" },
  { id: "U.0176", sku: "U.0176", name: "Vanilya Yağı - Planifolia", category: "Uçucu Yağlar", kdv: 20, inputVatRate: 20, listPriceKdvHaric: 4750.00, costPerKg: 5700.00, defaultVolume: "1000ml" },

  // =========================================================================
  // 2. SOĞUK SIKIM VE DIŞARIDAN ALINAN YAĞLAR (Resmi Fabrika Çizelgesi)
  // Verisi olanların değerleri girildi, verisi olmayanlar 0.00 TL yapıldı.
  // =========================================================================
  { id: "T.0243", sku: "T.0243", name: "ARGAN YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 700.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 700.00, defaultVolume: "1000ml" },
  { id: "T.0358", sku: "T.0358", name: "ASPİR YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 20, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0245", sku: "T.0245", name: "AVOKADO YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "wholesale", wholesaleCostPerKg: 500.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 500.00, defaultVolume: "1000ml" },
  { id: "T.0359", sku: "T.0359", name: "ACI BADEM YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0078", sku: "T.0078", name: "BADEM YAĞI (TATLI)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "wholesale", wholesaleCostPerKg: 190.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 190.00, defaultVolume: "1000ml" },
  { id: "T.0254", sku: "T.0254", name: "BAMYA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 72.00, yieldPercent: 8, dipStatus: "none", dipPercent: 0, costPerKg: 900.00, defaultVolume: "1000ml" },
  { id: "T.0013", sku: "T.0013", name: "BUĞDAY ÖZÜ YAĞI (ruşeym)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "wholesale", wholesaleCostPerKg: 1753.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 1753.00, defaultVolume: "1000ml" },
  { id: "T.0087", sku: "T.0087", name: "CEVİZ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isHybrid: true, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 45, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0147", sku: "T.0147", name: "CHİA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 146.00, yieldPercent: 10, dipStatus: "none", dipPercent: 0, costPerKg: 1460.00, defaultVolume: "1000ml" },
  { id: "T.0074", sku: "T.0074", name: "ÇÖREK OTU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 225.00, yieldPercent: 25, dipStatus: "none", dipPercent: 0, costPerKg: 900.00, defaultVolume: "1000ml" },
  { id: "T.0363", sku: "T.0363", name: "ÇUHA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 2750.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 2750.00, defaultVolume: "1000ml" },
  { id: "T.0353", sku: "T.0353", name: "DEFNE TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 18, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0323", sku: "T.0323", name: "DEVE DİKENİ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 15, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0368", sku: "T.0368", name: "FESLEĞEN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0079", sku: "T.0079", name: "FINDIK YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 50, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "A.0300", sku: "A.0300", name: "BİTKİSEL GLİSERİN", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 106.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 106.00, defaultVolume: "1000ml" },
  { id: "T.0213", sku: "T.0213", name: "HAŞHAŞ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 190.00, yieldPercent: 28, dipStatus: "none", dipPercent: 0, costPerKg: 678.57, defaultVolume: "1000ml" },
  { id: "T.0077", sku: "T.0077", name: "HİNDİSTAN CEVİZİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 233.00, yieldPercent: 60, dipStatus: "none", dipPercent: 0, costPerKg: 388.33, defaultVolume: "1000ml" },
  { id: "T.0155_sabit", sku: "T.0155", name: "HİNT YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 103.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 103.00, defaultVolume: "1000ml" },
  { id: "T.0364", sku: "T.0364", name: "HODAN YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 2900.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 2900.00, defaultVolume: "1000ml" },
  { id: "T.0366", sku: "T.0366", name: "ISIRGAN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 440.00, yieldPercent: 24, dipStatus: "none", dipPercent: 0, costPerKg: 1833.33, defaultVolume: "1000ml" },
  { id: "T.0362", sku: "T.0362", name: "İNCİR ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isHybrid: true, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 20, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0110", sku: "T.0110", name: "JOJOBA YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, isHybrid: true, supplyType: "wholesale", wholesaleCostPerKg: 850.00, seedCostPerKg: 0, yieldPercent: 50, dipStatus: "none", dipPercent: 0, costPerKg: 850.00, defaultVolume: "1000ml" },
  { id: "T.0080", sku: "T.0080", name: "KABAK ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "wholesale", wholesaleCostPerKg: 220.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 220.00, defaultVolume: "1000ml" },
  { id: "T.0224", sku: "T.0224", name: "KAKAO YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "wholesale", wholesaleCostPerKg: 685.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 685.00, defaultVolume: "1000ml" },
  { id: "T.0082", sku: "T.0082", name: "KAYISI ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 30, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0209", sku: "T.0209", name: "KENEVİR TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 250.00, seedCostPerKgLocal: 250.00, seedCostPerKgImported: 154.00, yieldPercent: 20, dipStatus: "none", dipPercent: 0, costPerKg: 1250.00, defaultVolume: "1000ml" },
  { id: "T.0083", sku: "T.0083", name: "KETEN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 35.00, yieldPercent: 25, dipStatus: "none", dipPercent: 0, costPerKg: 140.00, defaultVolume: "1000ml" },
  { id: "T.0369", sku: "T.0369", name: "KETENCİK TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0370", sku: "T.0370", name: "KİRAZ ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0371", sku: "T.0371", name: "KİŞNİŞ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isHybrid: true, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0104", sku: "T.0104", name: "KUŞBURNU ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 25.00, yieldPercent: 4, dipStatus: "none", dipPercent: 0, costPerKg: 625.00, defaultVolume: "1000ml" },
  { id: "T.0270", sku: "T.0270", name: "MAKADEMYA YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 826.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 826.00, defaultVolume: "1000ml" },
  { id: "T.0210", sku: "T.0210", name: "MENENGİÇ TOHUMU YAĞI (bıttım)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 28, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0084", sku: "T.0084", name: "NAR ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 8, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0367", sku: "T.0367", name: "PAPATYA YAĞI (Maserasyon)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, herbCostPerKg: 650.00, oliveOilCostPerKg: 240.00, herbRatioKg: 0.20, dipStatus: "none", dipPercent: 0, costPerKg: 370.00, defaultVolume: "1000ml" },
  { id: "T.0340", sku: "T.0340", name: "PİRİNÇ KEPEĞİ YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 600.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 600.00, defaultVolume: "1000ml" },
  { id: "T.0355_ham", sku: "T.0355_ham", name: "SHEA (HAM) YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 600.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 600.00, defaultVolume: "1000ml" },
  { id: "T.0355", sku: "T.0355", name: "SHEA (RAFİNE) YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 285.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 285.00, defaultVolume: "1000ml" },
  { id: "A.0301_wax", sku: "A.0301_wax", name: "SKUALEN YAĞI (Wax)", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 1914.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 1914.00, defaultVolume: "1000ml" },
  { id: "A.0301", sku: "A.0301", name: "SKUALEN YAĞI (Sıvı)", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 2015.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 2015.00, defaultVolume: "1000ml" },
  { id: "T.0085", sku: "T.0085", name: "SUSAM YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 95.00, yieldPercent: 45, dipStatus: "none", dipPercent: 0, costPerKg: 211.11, defaultVolume: "1000ml" },
  { id: "T.0365", sku: "T.0365", name: "TAMANU YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 2300.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 2300.00, defaultVolume: "1000ml" },
  { id: "T.0233", sku: "T.0233", name: "TESBİH AĞACI (NEEM) YAĞI", category: "Sabit Yağlar", kdv: 20, inputVatRate: 20, supplyType: "wholesale", wholesaleCostPerKg: 1000.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 1000.00, defaultVolume: "1000ml" },
  { id: "T.0360", sku: "T.0360", name: "ÜZERLİK TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 6, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0086", sku: "T.0086", name: "ÜZÜM ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isHybrid: true, supplyType: "wholesale", wholesaleCostPerKg: 330.00, seedCostPerKg: 30.00, yieldPercent: 0, dipStatus: "has_dip", dipPercent: 6.67, costPerKg: 330.00, defaultVolume: "1000ml" },
  { id: "T.0321", sku: "T.0321", name: "VİŞNE ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0389", sku: "T.0389", name: "ZEYTİNYAĞI (Soğuk Sıkım)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "wholesale", wholesaleCostPerKg: 240.00, seedCostPerKg: 0, yieldPercent: 0, dipStatus: "none", dipPercent: 0, costPerKg: 240.00, defaultVolume: "1000ml" },

  // =========================================================================
  // 3. MASERASYON YAĞLAR (Tablo 2 Verileri - Zeytinyağı 240 TL, Ot Girdisi Olmayanlar 0 TL)
  // =========================================================================
  { id: "T.0356_mas", sku: "T.0356_mas", name: "HAVUÇ YAĞI (Maserasyon)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "wholesale", wholesaleCostPerKg: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0097", sku: "T.0097", name: "AT KESTANESİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0148", sku: "T.0148", name: "AYNISEFA YAĞI (CALENDULA)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0125", sku: "T.0125", name: "KUDRET NARI YAĞI (Meyveli)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0221", sku: "T.0221", name: "KUDRET NARI YAĞI (Süzülmüş)", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0081", sku: "T.0081", name: "SARI KANTARON YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0246", sku: "T.0246", name: "SARIMSAK YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0272", sku: "T.0272", name: "UDİ HİNDİ YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, isMaceration: true, supplyType: "press", oliveOilCostPerKg: 240.00, herbCostPerKg: 0, herbRatioKg: 0.20, costPerKg: 0, defaultVolume: "1000ml" },

  // Ekstra Sabit Ürünler (Tabloda olmayanlar 0 TL yapıldı)
  { id: "A.0200", sku: "A.0200", name: "BUĞDAY YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0356", sku: "T.0356", name: "HAVUÇ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, costPerKg: 0, defaultVolume: "1000ml" },
  { id: "T.0361", sku: "T.0361", name: "ALOE VERA YAĞI", category: "Sabit Yağlar", kdv: 1, inputVatRate: 1, supplyType: "press", wholesaleCostPerKg: 0, seedCostPerKg: 0, yieldPercent: 0, costPerKg: 0, defaultVolume: "1000ml" }
];

// Exact Packaging Costs (Şişe + Kapak + Tıpa + Sanayi Bidonu)
const DEFAULT_PACKAGING_COSTS = {
  "20ml": 6.00,    // 20ml tahmini
  "30ml": 6.75,    // Şişe: 2.50 TL + Kapak+Tıpa: 4.25 TL = 6.75 TL
  "50ml": 7.25,    // Şişe: 3.00 TL + Kapak+Tıpa: 4.25 TL = 7.25 TL
  "100ml": 8.35,   // Şişe: 4.10 TL + Kapak+Tıpa: 4.25 TL = 8.35 TL
  "250ml": 14.50,  // Toplam: 14.50 TL
  "300ml": 18.00,  // 300ml kavanoz / ambalaj
  "500ml": 25.00,  // 500ml
  "1000ml": 35.00, // 1000ml (1 KG)
  "5000ml": 45.00, // 5000ml (5 KG Bidon)
  // Toptan Sanayi Bidon Grubu (Geçici Maliyetler)
  "10KG": 10.00,   // 10 KG Sanayi Bidonu (10 TL)
  "25KG": 25.00,   // 25 KG Sanayi Bidonu (25 TL)
  "30KG": 30.00,   // 30 KG Sanayi Bidonu (30 TL)
  "100KG": 35.00,  // 100 KG Tonaj Ambalajı (35 TL)
  "250KG": 60.00   // 250 KG Sanayi Varili (60 TL)
};

// Global default channel settings
const DEFAULT_CHANNEL_PRESETS = {
  trendyol: { commission: 19, discount: 0, cargo: 110 },
  hepsiburada: { commission: 17, discount: 0, cargo: 110 },
  iyzico: { commission: 4, discount: 0, cargo: 82.50 }
};

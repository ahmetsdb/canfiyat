// Cansızzade Resmi Fiyat Teklifi Listelerinden Derlenen Ürün Kataloğu
// Uçucu Yağlar ve Sabit Yağlar (KDV Dahil Toptan Satış Fiyatları)

const INITIAL_PRODUCTS = [
  // ==========================================
  // UÇUCU YAĞLAR (Essential Oils) - %20 KDV Dahil Toptan Satış Fiyatları
  // Default Volume: 50ml (7.25 TL)
  // ==========================================
  { id: "U.0271", sku: "U.0271", name: "YASEMİN YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2340.00, defaultVolume: "50ml" },
  { id: "U.0326", sku: "U.0326", name: "BERGAMOT UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3540.00, defaultVolume: "50ml" },
  { id: "U.0235", sku: "U.0235", name: "BİBERİYE YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1800.00, defaultVolume: "50ml" },
  { id: "U.0313", sku: "U.0313", name: "Citronella Yağı", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3000.00, defaultVolume: "50ml" },
  { id: "U.0320", sku: "U.0320", name: "ÇAY AĞACI YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2100.00, defaultVolume: "50ml" },
  { id: "T.0407", sku: "T.0407", name: "DEFNE YAPRAĞI YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4740.00, defaultVolume: "50ml" },
  { id: "U.0332", sku: "U.0332", name: "GREYFURT YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4200.00, defaultVolume: "50ml" },
  { id: "U.0106", sku: "U.0106", name: "KARANFİL YAĞI (Tomurcuk)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 5700.00, defaultVolume: "50ml" },
  { id: "U.0105", sku: "U.0105", name: "KARANFİL YAĞI (YAPRAK)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3300.00, defaultVolume: "50ml" },
  { id: "U.0199", sku: "U.0199", name: "NANE UÇUCU YAĞI peppermint", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3000.00, defaultVolume: "50ml" },
  { id: "U.0155", sku: "U.0155", name: "LAVANTA YAĞI (intermedia)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2100.00, defaultVolume: "50ml" },
  { id: "U.285",  sku: "U.285",  name: "PORTAKAL KABUĞU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2700.00, defaultVolume: "50ml" },
  { id: "U.0259", sku: "U.0259", name: "NİOLİ UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2220.00, defaultVolume: "50ml" },
  { id: "U.0248", sku: "U.0248", name: "OKALİPTUS YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2160.00, defaultVolume: "50ml" },
  { id: "U.0160", sku: "U.0160", name: "PAÇULİ YAĞI (uçucu)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 5100.00, defaultVolume: "50ml" },
  { id: "U.0159", sku: "U.0159", name: "PALMAROSA YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4800.00, defaultVolume: "50ml" },
  { id: "U.0308", sku: "U.0308", name: "MANDALİNA YAĞI-YEŞİL", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1500.00, defaultVolume: "50ml" },
  { id: "U.0314", sku: "U.0314", name: "SEDİR UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3000.00, defaultVolume: "50ml" },
  { id: "U.0411", sku: "U.0411", name: "TARÇIN KABUĞU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3000.00, defaultVolume: "50ml" },
  { id: "U.0154", sku: "U.0154", name: "LAVANTA YAĞI (angustifolia)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3000.00, defaultVolume: "50ml" },
  { id: "U.0334", sku: "U.0334", name: "ZENCEFİL YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4200.00, defaultVolume: "50ml" },
  { id: "U.0095", sku: "U.0095", name: "KEKİK YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 6000.00, defaultVolume: "50ml" },
  { id: "U.0176", sku: "U.0176", name: "Vanilya Yağı - Planifolia", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 5700.00, defaultVolume: "50ml" },

  // ==========================================
  // SABİT YAĞLAR (Fixed / Carrier Oils) - %1 veya %20 KDV Dahil Toptan Satış Fiyatları
  // Default Volume: 250ml (14.50 TL)
  // ==========================================
  { id: "T.0243", sku: "T.0243", name: "ARGAN YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1920.00, defaultVolume: "250ml" },
  { id: "T.0097", sku: "T.0097", name: "AT KESTANESİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 707.00, defaultVolume: "250ml" },
  { id: "T.0245", sku: "T.0245", name: "AVOKADO YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 580.75, defaultVolume: "250ml" },
  { id: "T.0148", sku: "T.0148", name: "AYNISEFA YAĞI (CALENDULA)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 656.50, defaultVolume: "250ml" },
  { id: "T.0078", sku: "T.0078", name: "BADEM YAĞI (TATLI)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 424.20, defaultVolume: "250ml" },
  { id: "T.0254", sku: "T.0254", name: "BAMYA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 757.50, defaultVolume: "250ml" },
  { id: "T.0013", sku: "T.0013", name: "BUĞDAY ÖZÜ YAĞI (ruşeym)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1212.00, defaultVolume: "250ml" },
  { id: "T.0147", sku: "T.0147", name: "CHİA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 858.50, defaultVolume: "250ml" },
  { id: "T.0074", sku: "T.0074", name: "ÇÖREK OTU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1212.00, defaultVolume: "250ml" },
  { id: "T.0363", sku: "T.0363", name: "ÇUHA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 4080.00, defaultVolume: "250ml" },
  { id: "T.0353", sku: "T.0353", name: "DEFNE TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1212.00, defaultVolume: "250ml" },
  { id: "T.0323", sku: "T.0323", name: "DEVE DİKENİ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 858.50, defaultVolume: "250ml" },
  { id: "T.0213", sku: "T.0213", name: "HAŞHAŞ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 808.00, defaultVolume: "250ml" },
  { id: "T.0077", sku: "T.0077", name: "HİNDİSTAN CEVİZİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 656.50, defaultVolume: "250ml" },
  { id: "T.0155_sabit", sku: "T.0155", name: "HİNT YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 288.00, defaultVolume: "250ml" },
  { id: "T.0364", sku: "T.0364", name: "HODAN YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 5400.00, defaultVolume: "250ml" },
  { id: "T.0366", sku: "T.0366", name: "ISIRGAN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 2424.00, defaultVolume: "250ml" },
  { id: "T.0362", sku: "T.0362", name: "İNCİR ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 4545.00, defaultVolume: "250ml" },
  { id: "T.0110", sku: "T.0110", name: "JOJOBA YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1320.00, defaultVolume: "250ml" },
  { id: "T.0080", sku: "T.0080", name: "KABAK ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 454.50, defaultVolume: "250ml" },
  { id: "T.0224", sku: "T.0224", name: "KAKAO YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1767.50, defaultVolume: "250ml" },
  { id: "T.0082", sku: "T.0082", name: "KAYISI ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 353.50, defaultVolume: "250ml" },
  { id: "T.0209", sku: "T.0209", name: "KENEVİR TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1111.00, defaultVolume: "250ml" },
  { id: "T.0083", sku: "T.0083", name: "KETEN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 353.50, defaultVolume: "250ml" },
  { id: "T.0104", sku: "T.0104", name: "KUŞBURNU ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1414.00, defaultVolume: "250ml" },
  { id: "T.0270", sku: "T.0270", name: "MAKADEMYA YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1200.00, defaultVolume: "250ml" },
  { id: "T.0210", sku: "T.0210", name: "MENENGİÇ TOHUMU YAĞI (bıttım)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 707.00, defaultVolume: "250ml" },
  { id: "T.0084", sku: "T.0084", name: "NAR ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 303.00, defaultVolume: "250ml" },
  { id: "T.0340", sku: "T.0340", name: "PİRİNÇ KEPEĞİ YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1500.00, defaultVolume: "250ml" },
  { id: "T.0081", sku: "T.0081", name: "SARI KANTARON YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 606.00, defaultVolume: "250ml" },
  { id: "T.0246", sku: "T.0246", name: "SARIMSAK YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 656.50, defaultVolume: "250ml" },
  { id: "T.0355", sku: "T.0355", name: "SHEA YAĞI (Refined)", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 690.00, defaultVolume: "250ml" },
  { id: "T.0085", sku: "T.0085", name: "SUSAM YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 383.80, defaultVolume: "250ml" },
  { id: "T.0365", sku: "T.0365", name: "TAMANU YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 3600.00, defaultVolume: "250ml" },
  { id: "T.0233", sku: "T.0233", name: "TESBİH AĞACI YAĞI/NEEM OİL", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 2640.00, defaultVolume: "250ml" },
  { id: "T.0272", sku: "T.0272", name: "UDİ HİNDİ YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 750.00, defaultVolume: "250ml" },
  { id: "T.0086", sku: "T.0086", name: "ÜZÜM ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 464.60, defaultVolume: "250ml" },
  { id: "T.0321", sku: "T.0321", name: "VİŞNE ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 505.00, defaultVolume: "250ml" },
  { id: "T.0125", sku: "T.0125", name: "KUDRET NARI YAĞI (Meyveli)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 606.00, defaultVolume: "250ml" },
  { id: "T.0221", sku: "T.0221", name: "KUDRET NARI YAĞI (Süzülmüş)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 606.00, defaultVolume: "250ml" },
  { id: "T.0389", sku: "T.0389", name: "ZEYTİNYAĞI (Soğuk Sıkım)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 454.50, defaultVolume: "250ml" },
  { id: "A.0200", sku: "A.0200", name: "BUĞDAY YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 959.50, defaultVolume: "250ml" }
];

// Exact Packaging Costs (Şişe + Kapak + Tıpa + Sanayi Bidonu)
const DEFAULT_PACKAGING_COSTS = {
  "20ml": 6.00,    // 20ml tahmini
  "30ml": 6.75,    // Şişe: 2.50 TL + Kapak+Tıpa: 4.25 TL = 6.75 TL
  "50ml": 7.25,    // Şişe: 3.00 TL + Kapak+Tıpa: 4.25 TL = 7.25 TL
  "100ml": 8.35,   // Şişe: 4.10 TL + Kapak+Tıpa: 4.25 TL = 8.35 TL
  "250ml": 14.50,  // Toplam: 14.50 TL
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

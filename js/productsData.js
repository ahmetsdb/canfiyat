// Cansızzade Resmi Fiyat Teklifi Listelerinden Derlenen Ürün Kataloğu
// Uçucu Yağlar ve Sabit Yağlar (KDV & 1KG Toptan Fiyatları Dahil)

const INITIAL_PRODUCTS = [
  // ==========================================
  // UÇUCU YAĞLAR (Essential Oils)
  // ==========================================
  { id: "U.0271", sku: "U.0271", name: "YASEMİN YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1950.00 },
  { id: "U.0326", sku: "U.0326", name: "BERGAMOT UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2950.00 },
  { id: "U.0235", sku: "U.0235", name: "BİBERİYE YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1500.00 },
  { id: "U.0313", sku: "U.0313", name: "Citronella Yağı", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2500.00 },
  { id: "U.0320", sku: "U.0320", name: "ÇAY AĞACI YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1750.00 },
  { id: "T.0407", sku: "T.0407", name: "DEFNE YAPRAĞI YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3950.00 },
  { id: "U.0332", sku: "U.0332", name: "GREYFURT YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3500.00 },
  { id: "U.0106", sku: "U.0106", name: "KARANFİL YAĞI (Tomurcuk)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4750.00 },
  { id: "U.0105", sku: "U.0105", name: "KARANFİL YAĞI (YAPRAK)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2750.00 },
  { id: "U.0199", sku: "U.0199", name: "NANE UÇUCU YAĞI peppermint", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2500.00 },
  { id: "U.0155", sku: "U.0155", name: "LAVANTA YAĞI (intermedia)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1750.00 },
  { id: "U.285",  sku: "U.285",  name: "PORTAKAL KABUĞU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2250.00 },
  { id: "U.0259", sku: "U.0259", name: "NİOLİ UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1850.00 },
  { id: "U.0248", sku: "U.0248", name: "OKALİPTUS YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1800.00 },
  { id: "U.0160", sku: "U.0160", name: "PAÇULİ YAĞI (uçucu)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4250.00 },
  { id: "U.0159", sku: "U.0159", name: "PALMAROSA YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4000.00 },
  { id: "U.0308", sku: "U.0308", name: "MANDALİNA YAĞI-YEŞİL", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 1250.00 },
  { id: "U.0314", sku: "U.0314", name: "SEDİR UÇUCU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2500.00 },
  { id: "U.0411", sku: "U.0411", name: "TARÇIN KABUĞU YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2500.00 },
  { id: "U.0154", sku: "U.0154", name: "LAVANTA YAĞI (angustifolia)", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 2500.00 },
  { id: "U.0334", sku: "U.0334", name: "ZENCEFİL YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 3500.00 },
  { id: "U.0095", sku: "U.0095", name: "KEKİK YAĞI", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 5000.00 },
  { id: "U.0176", sku: "U.0176", name: "Vanilya Yağı - Planifolia", category: "Uçucu Yağlar", kdv: 20, unit: "1KG", costPerKg: 4750.00 },

  // ==========================================
  // SABİT YAĞLAR (Fixed / Carrier Oils)
  // ==========================================
  { id: "T.0243", sku: "T.0243", name: "ARGAN YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1600.00 },
  { id: "T.0097", sku: "T.0097", name: "AT KESTANESİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 700.00 },
  { id: "T.0245", sku: "T.0245", name: "AVOKADO YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 575.00 },
  { id: "T.0148", sku: "T.0148", name: "AYNISEFA YAĞI (CALENDULA)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 650.00 },
  { id: "T.0078", sku: "T.0078", name: "BADEM YAĞI (TATLI)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 420.00 },
  { id: "T.0254", sku: "T.0254", name: "BAMYA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 750.00 },
  { id: "T.0013", sku: "T.0013", name: "BUĞDAY ÖZÜ YAĞI (ruşeym)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1200.00 },
  { id: "T.0147", sku: "T.0147", name: "CHİA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 850.00 },
  { id: "T.0074", sku: "T.0074", name: "ÇÖREK OTU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1200.00 },
  { id: "T.0363", sku: "T.0363", name: "ÇUHA TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 3400.00 },
  { id: "T.0353", sku: "T.0353", name: "DEFNE TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1200.00 },
  { id: "T.0323", sku: "T.0323", name: "DEVE DİKENİ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 850.00 },
  { id: "T.0213", sku: "T.0213", name: "HAŞHAŞ TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 800.00 },
  { id: "T.0077", sku: "T.0077", name: "HİNDİSTAN CEVİZİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 650.00 },
  { id: "T.0155_sabit", sku: "T.0155", name: "HİNT YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 240.00 },
  { id: "T.0364", sku: "T.0364", name: "HODAN YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 4500.00 },
  { id: "T.0366", sku: "T.0366", name: "ISIRGAN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 2400.00 },
  { id: "T.0362", sku: "T.0362", name: "İNCİR ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 4500.00 },
  { id: "T.0110", sku: "T.0110", name: "JOJOBA YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1100.00 },
  { id: "T.0080", sku: "T.0080", name: "KABAK ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 450.00 },
  { id: "T.0224", sku: "T.0224", name: "KAKAO YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1750.00 },
  { id: "T.0082", sku: "T.0082", name: "KAYISI ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 350.00 },
  { id: "T.0209", sku: "T.0209", name: "KENEVİR TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1100.00 },
  { id: "T.0083", sku: "T.0083", name: "KETEN TOHUMU YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 350.00 },
  { id: "T.0104", sku: "T.0104", name: "KUŞBURNU ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 1400.00 },
  { id: "T.0270", sku: "T.0270", name: "MAKADEMYA YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1000.00 },
  { id: "T.0210", sku: "T.0210", name: "MENENGİÇ TOHUMU YAĞI (bıttım)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 700.00 },
  { id: "T.0084", sku: "T.0084", name: "NAR ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 300.00 },
  { id: "T.0340", sku: "T.0340", name: "PİRİNÇ KEPEĞİ YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 1250.00 },
  { id: "T.0081", sku: "T.0081", name: "SARI KANTARON YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 600.00 },
  { id: "T.0246", sku: "T.0246", name: "SARIMSAK YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 650.00 },
  { id: "T.0355", sku: "T.0355", name: "SHEA YAĞI (Refined)", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 575.00 },
  { id: "T.0085", sku: "T.0085", name: "SUSAM YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 380.00 },
  { id: "T.0365", sku: "T.0365", name: "TAMANU YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 3000.00 },
  { id: "T.0233", sku: "T.0233", name: "TESBİH AĞACI YAĞI/NEEM OİL", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 2200.00 },
  { id: "T.0272", sku: "T.0272", name: "UDİ HİNDİ YAĞI", category: "Sabit Yağlar", kdv: 20, unit: "1KG", costPerKg: 625.00 },
  { id: "T.0086", sku: "T.0086", name: "ÜZÜM ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 460.00 },
  { id: "T.0321", sku: "T.0321", name: "VİŞNE ÇEKİRDEĞİ YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 500.00 },
  { id: "T.0125", sku: "T.0125", name: "KUDRET NARI YAĞI (Meyveli)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 600.00 },
  { id: "T.0221", sku: "T.0221", name: "KUDRET NARI YAĞI (Süzülmüş)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 600.00 },
  { id: "T.0389", sku: "T.0389", name: "ZEYTİNYAĞI (Soğuk Sıkım)", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 450.00 },
  { id: "A.0200", sku: "A.0200", name: "BUĞDAY YAĞI", category: "Sabit Yağlar", kdv: 1, unit: "1KG", costPerKg: 950.00 }
];

// Packaging bottle default cost estimates (Bottle + Cap + Label + Boxing)
const DEFAULT_PACKAGING_COSTS = {
  "20ml": 12.00,
  "50ml": 15.00,
  "100ml": 18.00,
  "250ml": 25.00,
  "500ml": 35.00,
  "1000ml": 45.00
};

// Global default channel settings
const DEFAULT_CHANNEL_PRESETS = {
  trendyol: { commission: 19, discount: 0, cargo: 110 },
  hepsiburada: { commission: 17, discount: 0, cargo: 110 },
  iyzico: { commission: 4, discount: 0, cargo: 110 }
};

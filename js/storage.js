// CanFiyat Storage Manager
// Manages local persistence for product slots and global preset settings.

const STORAGE_KEYS = {
  PRODUCTS: "canfiyat_products_v1",
  GLOBAL_SETTINGS: "canfiyat_global_settings_v1"
};

class StorageManager {
  static getProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!stored) {
        // Initialize with default product list
        const initialMap = {};
        INITIAL_PRODUCTS.forEach(p => {
          initialMap[p.id] = {
            ...p,
            selectedVolume: "250ml", // Default packaging size
            packagingCost: DEFAULT_PACKAGING_COSTS["250ml"],
            targetProfit: 300,       // Default net profit target
            // Channel specific overrides (if empty, uses global presets)
            channels: {
              trendyol: { commission: 19, discount: 0, cargo: 110 },
              hepsiburada: { commission: 17, discount: 0, cargo: 110 },
              iyzico: { commission: 4, discount: 0, cargo: 110 }
            },
            updatedAt: new Date().toISOString()
          };
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialMap));
        return initialMap;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Storage error:", e);
      return {};
    }
  }

  static getProductById(id) {
    const products = this.getProducts();
    return products[id] || null;
  }

  static saveProduct(productData) {
    const products = this.getProducts();
    products[productData.id] = {
      ...products[productData.id],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return products[productData.id];
  }

  static resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_SETTINGS);
    return this.getProducts();
  }

  static getGlobalSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, JSON.stringify(DEFAULT_CHANNEL_PRESETS));
        return DEFAULT_CHANNEL_PRESETS;
      }
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_CHANNEL_PRESETS;
    }
  }

  static saveGlobalSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, JSON.stringify(settings));
  }
}

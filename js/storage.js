// CanFiyat Storage Manager with Multi-Volume Product Slots & Independent System 2 / System 4 Prices

const SUPABASE_URL = "https://fmvvhwccthxigyyjnalg.supabase.co";
const SUPABASE_KEY = "sb_publishable_4hGtpGFz6qRHkI39zbrLug_HTvff6B6";

const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient) 
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const STORAGE_KEYS = {
  PRODUCTS: "canfiyat_products_v8", // Auto fail-safe reset v8
  GLOBAL_SETTINGS: "canfiyat_global_settings_v1",
  SITE_OVERRIDES: "canfiyat_site_overrides_v1"
};

class StorageManager {
  static createDefaultVolumeConfigs() {
    const configs = {};
    const volumes = ["20ml", "30ml", "50ml", "100ml", "250ml", "500ml", "1000ml", "5000ml"];
    volumes.forEach(vol => {
      configs[vol] = {
        packagingCost: DEFAULT_PACKAGING_COSTS[vol] || 14.50,
        targetProfit: 0,
        webSalePrice: 500, // Her ürüne ve ambalaja özel İyzico fiyatı (Sistem 2)
        retailPrice: 650,  // Her ürüne ve ambalaja özel Perakende Fiyatı (Sistem 4)
        channels: {
          trendyol: { commission: 19, discount: 0, cargo: 110 },
          hepsiburada: { commission: 17, discount: 0, cargo: 110 },
          iyzico: { commission: 4, discount: 0, cargo: 82.50 }
        }
      };
    });
    return configs;
  }

  static getProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      let parsed = null;
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (err) {
          console.warn("Corrupted JSON in localStorage, resetting to default products.");
        }
      }

      // FAIL-SAFE: If stored data is null, not an object, or has ZERO products, FORCE LOAD INITIAL_PRODUCTS (65 items)!
      if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
        const initialMap = {};
        if (typeof INITIAL_PRODUCTS !== 'undefined' && Array.isArray(INITIAL_PRODUCTS)) {
          INITIAL_PRODUCTS.forEach(p => {
            const defaultVol = p.defaultVolume || (p.category === "Uçucu Yağlar" ? "50ml" : "250ml");

            initialMap[p.id] = {
              id: p.id,
              sku: p.sku,
              name: p.name,
              category: p.category,
              kdv: p.kdv,
              unit: "1KG",
              costPerKg: p.costPerKg,
              activeVolume: defaultVol,
              volumes: this.createDefaultVolumeConfigs(),
              updatedAt: new Date().toISOString()
            };
          });
        }
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialMap));
        this.seedSupabaseDatabase(initialMap);
        return initialMap;
      }
      return parsed;
    } catch (e) {
      console.error("Storage error:", e);
      const initialMap = {};
      if (typeof INITIAL_PRODUCTS !== 'undefined' && Array.isArray(INITIAL_PRODUCTS)) {
        INITIAL_PRODUCTS.forEach(p => {
          const defaultVol = p.defaultVolume || (p.category === "Uçucu Yağlar" ? "50ml" : "250ml");
          initialMap[p.id] = {
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            kdv: p.kdv,
            unit: "1KG",
            costPerKg: p.costPerKg,
            activeVolume: defaultVol,
            volumes: this.createDefaultVolumeConfigs(),
            updatedAt: new Date().toISOString()
          };
        });
      }
      return initialMap;
    }
  }

  static async fetchFromSupabase(onCompleteCallback) {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient.from("products").select("*");
      if (error) {
        console.warn("Supabase fetch error, fallback to local storage:", error);
        return;
      }

      if (data && data.length > 0) {
        const cloudMap = {};
        data.forEach(item => {
          const defaultVol = item.active_volume || (item.category === "Uçucu Yağlar" ? "50ml" : "250ml");
          cloudMap[item.id] = {
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            kdv: item.kdv,
            unit: item.unit,
            costPerKg: item.cost_per_kg,
            activeVolume: defaultVol,
            volumes: item.volumes || this.createDefaultVolumeConfigs(),
            updatedAt: item.updated_at
          };
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudMap));
        if (onCompleteCallback) onCompleteCallback(cloudMap);
      } else {
        const localData = this.getProducts();
        this.seedSupabaseDatabase(localData);
        if (onCompleteCallback) onCompleteCallback(localData);
      }
    } catch (e) {
      console.error("Supabase sync failed:", e);
    }
  }

  static async seedSupabaseDatabase(productsMap) {
    if (!supabaseClient) return;

    try {
      const rows = Object.values(productsMap).map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        kdv: p.kdv,
        unit: p.unit,
        cost_per_kg: p.costPerKg,
        active_volume: p.activeVolume || "250ml",
        volumes: p.volumes || this.createDefaultVolumeConfigs(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabaseClient.from("products").upsert(rows);
      if (error) {
        console.warn("Supabase seed warning:", error.message);
      } else {
        console.log("Supabase database seeded with product-specific System 2 & 4 prices!");
      }
    } catch (e) {
      console.error("Seed error:", e);
    }
  }

  static async saveProduct(productData) {
    const products = this.getProducts();
    const existing = products[productData.id] || {};
    
    const updated = {
      ...existing,
      ...productData,
      updatedAt: new Date().toISOString()
    };
    products[productData.id] = updated;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    if (supabaseClient) {
      try {
        await supabaseClient.from("products").upsert({
          id: updated.id,
          sku: updated.sku,
          name: updated.name,
          category: updated.category,
          kdv: updated.kdv,
          unit: updated.unit,
          cost_per_kg: updated.costPerKg,
          active_volume: updated.activeVolume,
          volumes: updated.volumes,
          updated_at: updated.updatedAt
        });
      } catch (e) {
        console.error("Supabase update error:", e);
      }
    }

    return updated;
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

  static getFactoryOverhead() {
    try {
      const stored = localStorage.getItem("canfiyat_factory_overhead");
      const defaultConfig = {
        salaries: 200000,
        sgk: 50000,
        electricity: 20000,
        catering: 60000,
        rentSarf: 0,
        monthlyCapacityKg: 3000
      };
      if (!stored) return defaultConfig;
      return { ...defaultConfig, ...JSON.parse(stored) };
    } catch (e) {
      return {
        salaries: 200000,
        sgk: 50000,
        electricity: 20000,
        catering: 60000,
        rentSarf: 0,
        monthlyCapacityKg: 3000
      };
    }
  }

  static saveFactoryOverhead(overheadConfig) {
    localStorage.setItem("canfiyat_factory_overhead", JSON.stringify(overheadConfig));
  }

  static getSiteOverrides() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SITE_OVERRIDES);
      return stored ? JSON.parse(stored) : {};
    } catch(e) {
      return {};
    }
  }

  static getSiteOverride(productId, volKey) {
    const map = this.getSiteOverrides();
    const key = `${productId}_${volKey}`;
    return (map && map[key] !== undefined) ? map[key] : null;
  }

  static setSiteOverride(productId, volKey, price) {
    try {
      const map = this.getSiteOverrides();
      const key = `${productId}_${volKey}`;
      if (price === null || price === "" || isNaN(parseFloat(price))) {
        delete map[key];
      } else {
        map[key] = parseFloat(price);
      }
      localStorage.setItem(STORAGE_KEYS.SITE_OVERRIDES, JSON.stringify(map));
    } catch(e) {}
  }
}

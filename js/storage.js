// CanFiyat Storage Manager with Supabase Cloud Database Integration

const SUPABASE_URL = "https://fmvvhwccthxigyyjnalg.supabase.co";
const SUPABASE_KEY = "sb_publishable_4hGtpGFz6qRHkI39zbrLug_HTvff6B6";

const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient) 
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const STORAGE_KEYS = {
  PRODUCTS: "canfiyat_products_v1",
  GLOBAL_SETTINGS: "canfiyat_global_settings_v1"
};

class StorageManager {
  // Sync products from Supabase DB or LocalStorage
  static getProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!stored) {
        const initialMap = {};
        INITIAL_PRODUCTS.forEach(p => {
          initialMap[p.id] = {
            ...p,
            selectedVolume: "250ml",
            packagingCost: DEFAULT_PACKAGING_COSTS["250ml"],
            targetProfit: 300,
            channels: {
              trendyol: { commission: 19, discount: 0, cargo: 110 },
              hepsiburada: { commission: 17, discount: 0, cargo: 110 },
              iyzico: { commission: 4, discount: 0, cargo: 110 }
            },
            updatedAt: new Date().toISOString()
          };
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialMap));
        // Seed to Supabase asynchronously
        this.seedSupabaseDatabase(initialMap);
        return initialMap;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Storage error:", e);
      return {};
    }
  }

  // Load latest data from Supabase Cloud DB and refresh local cache
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
          cloudMap[item.id] = {
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            kdv: item.kdv,
            unit: item.unit,
            costPerKg: item.cost_per_kg,
            selectedVolume: item.selected_volume,
            packagingCost: item.packaging_cost,
            targetProfit: item.target_profit,
            channels: item.channels,
            updatedAt: item.updated_at
          };
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudMap));
        if (onCompleteCallback) onCompleteCallback(cloudMap);
      } else {
        // DB is empty, seed initial data
        const localData = this.getProducts();
        this.seedSupabaseDatabase(localData);
      }
    } catch (e) {
      console.error("Supabase sync failed:", e);
    }
  }

  // Seed Supabase DB with 65 Cansızzade products
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
        selected_volume: p.selectedVolume || "250ml",
        packaging_cost: p.packagingCost || 25,
        target_profit: p.targetProfit || 300,
        channels: p.channels,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabaseClient.from("products").upsert(rows);
      if (error) {
        console.warn("Supabase seed warning:", error.message);
      } else {
        console.log("Supabase database seeded with 65 Cansızzade products!");
      }
    } catch (e) {
      console.error("Seed error:", e);
    }
  }

  // Save Product Slot state to LocalStorage & Supabase Cloud DB
  static async saveProduct(productData) {
    const products = this.getProducts();
    const updated = {
      ...products[productData.id],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    products[productData.id] = updated;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // Save to Supabase Cloud DB
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
          selected_volume: updated.selectedVolume,
          packaging_cost: updated.packagingCost,
          target_profit: updated.targetProfit,
          channels: updated.channels,
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
}

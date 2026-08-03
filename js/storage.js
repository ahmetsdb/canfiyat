// CanFiyat Storage Manager with Multi-Volume Product Slots & Independent System 2 / System 4 Prices

const SUPABASE_URL = "https://fmvvhwccthxigyyjnalg.supabase.co";
const SUPABASE_KEY = "sb_publishable_4hGtpGFz6qRHkI39zbrLug_HTvff6B6";

const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient) 
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const DEFAULT_USER = "ahmet";
const DEFAULT_PASS = "Ahmet123.";

const STORAGE_KEYS = {
  PRODUCTS: "canfiyat_products_v10", // Bulletproof Storage Key v10 (Guaranteed 65 products merge)
  GLOBAL_SETTINGS: "canfiyat_global_settings_v1",
  SITE_OVERRIDES: "canfiyat_site_overrides_v1",
  AUTH_SESSION: "canfiyat_auth_session_v1"
};

class StorageManager {
  static isAuthenticated() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!stored) return false;
      if (stored === "authenticated_ahmet") return true; // Geriye dönük uyumluluk
      const parsed = JSON.parse(stored);
      if (parsed && parsed.status === "authenticated_ahmet" && parsed.user === "ahmet") {
        if (!parsed.expiresAt || parsed.expiresAt > Date.now()) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static login(username, password, rememberLongTerm = true) {
    const u = (username || "").trim().toLowerCase();
    const p = (password || "").trim();
    if (u === DEFAULT_USER && p === DEFAULT_PASS) {
      const days = rememberLongTerm ? 365 : 30;
      const sessionData = {
        status: "authenticated_ahmet",
        user: "ahmet",
        loginTime: new Date().toISOString(),
        expiresAt: Date.now() + (days * 24 * 60 * 60 * 1000) // 1 Yıl (365 gün) Kesintisiz Hatırla
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
      return { success: true };
    }
    return { success: false, message: "Kullanıcı adı veya şifre hatalı!" };
  }

  static logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

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
    const baseMap = {};
    INITIAL_PRODUCTS.forEach(p => {
      const defaultVol = p.defaultVolume || (p.category === "Uçucu Yağlar" ? "50ml" : "250ml");
      const defaultSeedCost = parseFloat(((p.costPerKg || 1212.00) * 0.25).toFixed(2));
      baseMap[p.id] = {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        kdv: p.kdv,
        unit: "1KG",
        costPerKg: p.costPerKg,
        initialCostPerKg: p.costPerKg,
        initialSeedCostPerKg: defaultSeedCost,
        initialYieldPercent: 25,
        initialDipPercent: 0,
        initialHerbCostPerKg: 0,
        initialOliveOilCostPerKg: 454.50,
        initialHerbRatioKg: 0.20,
        initialTargetProfit: 70,
        activeVolume: defaultVol,
        volumes: this.createDefaultVolumeConfigs(),
        updatedAt: new Date().toISOString()
      };
    });

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          Object.keys(parsed).forEach(id => {
            if (baseMap[id]) {
              baseMap[id] = { ...baseMap[id], ...parsed[id] };
            } else if (parsed[id] && parsed[id].name) {
              baseMap[id] = parsed[id];
            }
          });
        }
      }
    } catch (e) {
      console.error("Storage error, using base initial products:", e);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(baseMap));
    return baseMap;
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
        const currentLocal = this.getProducts();
        data.forEach(item => {
          if (!item || !item.id) return;
          const defaultVol = item.active_volume || item.selected_volume || (item.category === "Uçucu Yağlar" ? "50ml" : "250ml");
          if (currentLocal[item.id]) {
            currentLocal[item.id] = {
              ...currentLocal[item.id],
              costPerKg: item.cost_per_kg ?? item.costPerKg ?? currentLocal[item.id].costPerKg,
              activeVolume: defaultVol,
              volumes: item.volumes || currentLocal[item.id].volumes || this.createDefaultVolumeConfigs(),
              updatedAt: item.updated_at || new Date().toISOString()
            };
          }
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(currentLocal));
        if (onCompleteCallback) onCompleteCallback(currentLocal);
      } else {
        const localData = this.getProducts();
        this.seedSupabaseDatabase(localData);
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
    delete updated.layer2DrawerOpen;
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

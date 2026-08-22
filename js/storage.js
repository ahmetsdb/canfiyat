// CanFiyat Storage Manager with Multi-Volume Product Slots & Independent System 2 / System 4 Prices

const SUPABASE_URL = "https://fmvvhwccthxigyyjnalg.supabase.co";
const SUPABASE_KEY = "sb_publishable_4hGtpGFz6qRHkI39zbrLug_HTvff6B6";

const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient) 
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const DEFAULT_USER = "ahmet";
const DEFAULT_PASS = "Ahmet123.";

const STORAGE_KEYS = {
  PRODUCTS: "canfiyat_products_v16", // Katman 1 Master Products Catalog
  GLOBAL_SETTINGS: "canfiyat_global_settings_v1",
  SITE_OVERRIDES: "canfiyat_site_overrides_v1", // Katman 3 Store Price Overrides
  LAYER2_SIM: "canfiyat_layer2_sim_v1", // Katman 2 Isolated Simulation State
  TRENDYOL_CUSTOM: "canfiyat_trendyol_custom_v1",
  AUTH_SESSION: "canfiyat_auth_session_v1"
};

class StorageManager {
  static isAuthenticated() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!stored) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  static login(username, password, rememberLongTerm = true) {
    const days = rememberLongTerm ? 365 : 30;
    const sessionData = {
      status: "authenticated_ahmet",
      user: "ahmet",
      loginTime: new Date().toISOString(),
      expiresAt: Date.now() + (days * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
    return { success: true };
  }

  static logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  static getWholesaleTiers() {
    const defaults = {
      tier1: { minKg: 5, maxKg: 30, discount: 5, label: "5 - 30 KG Arası" },
      tier2: { minKg: 30, maxKg: 100, discount: 10, label: "30 - 100 KG Arası" },
      tier3: { minKg: 100, maxKg: 250, discount: 15, label: "100 - 250 KG Arası" },
      tier4: { minKg: 250, maxKg: 99999, discount: 20, label: "250 KG ve Üzeri" }
    };
    try {
      const stored = localStorage.getItem("canfiyat_wholesale_tiers");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return { ...defaults, ...parsed };
        }
      }
    } catch (e) {
      console.error("Wholesale tiers storage error:", e);
    }
    return defaults;
  }

  static saveWholesaleTiers(tiers) {
    try {
      localStorage.setItem("canfiyat_wholesale_tiers", JSON.stringify(tiers));
    } catch (e) {
      console.error("Save wholesale tiers error:", e);
    }
  }

  static createDefaultVolumeConfigs() {
    const configs = {};
    const volumes = ["20ml", "30ml", "50ml", "100ml", "250ml", "500ml", "1000ml", "5000ml", "10KG", "25KG", "30KG"];
    volumes.forEach(vol => {
      let defaultPack = (typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[vol]) ? DEFAULT_PACKAGING_COSTS[vol] : 14.50;
      if (vol === "10KG") defaultPack = 10.00;
      if (vol === "25KG") defaultPack = 25.00;
      if (vol === "30KG") defaultPack = 30.00;

      configs[vol] = {
        packagingCost: defaultPack,
        targetProfit: 0,
        webSalePrice: 500,
        retailPrice: 650,
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
      ["canfiyat_products_v1", "canfiyat_products_v2", "canfiyat_products_v10", "canfiyat_products_v11", "canfiyat_products_v12", "canfiyat_products_v13"].forEach(oldKey => {
        localStorage.removeItem(oldKey);
      });
    } catch(e) {}

    const baseMap = {};
    if (typeof INITIAL_PRODUCTS !== "undefined" && Array.isArray(INITIAL_PRODUCTS)) {
      INITIAL_PRODUCTS.forEach(p => {
        const defaultVol = p.defaultVolume || "1000ml";
        const kdvRate = p.kdv || (p.category === "Uçucu Yağlar" ? 20 : 1);
        const rawNetPrice = p.listPriceKdvHaric || 1000.00;
        const costKdvDahil = parseFloat((rawNetPrice * (1 + (kdvRate / 100))).toFixed(2));
        const defaultSeedCostKdvDahil = parseFloat((costKdvDahil * 0.25).toFixed(2));

        baseMap[p.id] = {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          kdv: kdvRate,
          unit: "1KG",
          listPriceKdvHaric: rawNetPrice,
          rawNetCostPerKg: rawNetPrice,
          costPerKg: costKdvDahil,
          initialCostPerKg: costKdvDahil,
          initialSeedCostPerKg: defaultSeedCostKdvDahil,
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
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          Object.keys(parsed).forEach(id => {
            if (baseMap[id]) {
              delete parsed[id].layer2DrawerOpen;
              const kdvRate = baseMap[id].kdv;
              const defaultNet = baseMap[id].listPriceKdvHaric;
              const defaultKdvDahil = baseMap[id].initialCostPerKg;

              if (parsed[id].isUserEdited && parsed[id].listPriceKdvHaric) {
                const userNet = parsed[id].listPriceKdvHaric;
                const userKdvDahil = parseFloat((userNet * (1 + (kdvRate / 100))).toFixed(2));
                baseMap[id] = {
                  ...baseMap[id],
                  ...parsed[id],
                  kdv: kdvRate,
                  listPriceKdvHaric: userNet,
                  rawNetCostPerKg: userNet,
                  costPerKg: userKdvDahil,
                  initialCostPerKg: defaultKdvDahil
                };
              } else {
                baseMap[id] = {
                  ...baseMap[id],
                  ...parsed[id],
                  kdv: kdvRate,
                  listPriceKdvHaric: defaultNet,
                  rawNetCostPerKg: defaultNet,
                  costPerKg: defaultKdvDahil,
                  initialCostPerKg: defaultKdvDahil
                };
              }
            } else if (parsed[id] && parsed[id].name) {
              baseMap[id] = parsed[id];
            }
          });
        }
      }
    } catch (e) {
      console.error("Storage error, using base initial products:", e);
    }

    if (Object.keys(baseMap).length < 50 && typeof INITIAL_PRODUCTS !== "undefined") {
      INITIAL_PRODUCTS.forEach(p => {
        if (!baseMap[p.id]) {
          baseMap[p.id] = {
            id: p.id, sku: p.sku, name: p.name, category: p.category, kdv: p.kdv || 1, unit: "1KG",
            costPerKg: p.costPerKg || 1200.00, volumes: this.createDefaultVolumeConfigs()
          };
        }
      });
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(baseMap));
    return baseMap;
  }

  static async fetchFromSupabase(onCompleteCallback) {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient.from("products").select("id, sku, name, category, kdv, unit, cost_per_kg, updated_at");
      if (error) {
        console.warn("Supabase fetch error, fallback to local storage:", error);
        if (onCompleteCallback) onCompleteCallback(this.getProducts());
        return;
      }

      if (data && data.length > 0) {
        const currentLocal = this.getProducts();
        data.forEach(item => {
          if (!item || !item.id) return;
          if (currentLocal[item.id]) {
            const kdvRate = currentLocal[item.id].kdv;
            const rawNetPrice = currentLocal[item.id].listPriceKdvHaric;
            const costKdvDahil = parseFloat((rawNetPrice * (1 + (kdvRate / 100))).toFixed(2));

            const isUserEdited = currentLocal[item.id].isUserEdited;
            const finalNetPrice = isUserEdited ? currentLocal[item.id].listPriceKdvHaric : rawNetPrice;
            const finalCostKdvDahil = isUserEdited ? currentLocal[item.id].costPerKg : costKdvDahil;

            currentLocal[item.id] = {
              ...currentLocal[item.id],
              listPriceKdvHaric: finalNetPrice,
              rawNetCostPerKg: finalNetPrice,
              costPerKg: finalCostKdvDahil,
              updatedAt: item.updated_at || new Date().toISOString()
            };
          }
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(currentLocal));
        // Auto-sync any browser-side edits straight into Supabase Cloud DB
        this.seedSupabaseDatabase(currentLocal);
        if (onCompleteCallback) onCompleteCallback(currentLocal);
      } else {
        const localData = this.getProducts();
        this.seedSupabaseDatabase(localData);
        if (onCompleteCallback) onCompleteCallback(localData);
      }
    } catch (e) {
      console.error("Supabase sync failed:", e);
      if (onCompleteCallback) onCompleteCallback(this.getProducts());
    }
  }

  static async seedSupabaseDatabase(productsMap) {
    if (!supabaseClient) {
      return { success: false, error: "Supabase istemcisi başlatılamadı." };
    }

    try {
      const rows = Object.values(productsMap).map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        kdv: p.kdv,
        unit: p.unit,
        cost_per_kg: p.costPerKg,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabaseClient.from("products").upsert(rows);
      if (error) {
        console.warn("Supabase seed warning:", error.message);
        return { success: false, error: error.message };
      } else {
        console.log("Supabase database synced successfully!", rows.length);
        return { success: true, count: rows.length };
      }
    } catch (e) {
      console.error("Seed error:", e);
      return { success: false, error: e.message || String(e) };
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

  static getTrendyolCustomProducts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRENDYOL_CUSTOM);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  static saveTrendyolCustomProducts(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRENDYOL_CUSTOM, JSON.stringify(items));
    } catch (e) {
      console.error("Save Trendyol custom products error:", e);
    }
  }

  // ==========================================
  // KATMAN 2 ISOLATED SIMULATION STORAGE
  // ==========================================
  static getLayer2SimData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAYER2_SIM);
      return stored ? JSON.parse(stored) : {};
    } catch(e) {
      return {};
    }
  }

  static getLayer2SimProduct(productId) {
    const map = this.getLayer2SimData();
    return map[productId] || {};
  }

  static saveLayer2SimProduct(productId, simData) {
    try {
      const map = this.getLayer2SimData();
      map[productId] = {
        ...(map[productId] || {}),
        ...simData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.LAYER2_SIM, JSON.stringify(map));
    } catch(e) {
      console.error("Save Layer 2 Sim error:", e);
    }
  }

  static resetLayer2SimProduct(productId) {
    try {
      const map = this.getLayer2SimData();
      delete map[productId];
      localStorage.setItem(STORAGE_KEYS.LAYER2_SIM, JSON.stringify(map));
    } catch(e) {}
  }
}

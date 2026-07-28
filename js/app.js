// CanFiyat Portal Main Application Logic (v1.13) - Ultra Compact Dropdown & Fit-on-Screen Layout

let currentProducts = {};
let currentLayerMode = 1; // 1: Satış & Kârlılık, 2: Saf Üretim Maliyeti
let activeCategory = "all";
let searchQuery = "";
let selectedProductId = null;
let viewMode = "rows"; // 'rows' | 'cards'
let activeSimTab = "system1"; // 'system1' | 'system2' | 'system3' | 'system4' | 'system5'
let activeVolume = "250ml"; // Active bottle size sub-tab in modal

const ALL_VOLUMES = [
  { key: "20ml", label: "20 ml", price: "6.00 ₺" },
  { key: "30ml", label: "30 ml", price: "6.75 ₺" },
  { key: "50ml", label: "50 ml", price: "7.25 ₺" },
  { key: "100ml", label: "100 ml", price: "8.35 ₺" },
  { key: "250ml", label: "250 ml", price: "14.50 ₺" },
  { key: "500ml", label: "500 ml", price: "25.00 ₺" },
  { key: "1000ml", label: "1000 ml (1kg)", price: "35.00 ₺" }
];

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  currentProducts = StorageManager.getProducts();
  renderStats();
  if (currentLayerMode === 1) {
    renderProductGrid();
  } else {
    renderLayer2Cards();
  }
  setupEventListeners();

  // Async sync with Supabase Cloud DB
  StorageManager.fetchFromSupabase((cloudMap) => {
    if (cloudMap && Object.keys(cloudMap).length > 0) {
      currentProducts = cloudMap;
    } else {
      currentProducts = StorageManager.getProducts();
    }
    renderStats();
    if (currentLayerMode === 1) {
      renderProductGrid();
    } else {
      renderLayer2Cards();
    }
    console.log("Synced latest product slot state from Supabase Cloud DB!");
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProductGrid();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedProductId) {
      calculateCurrentModal();
    }
  });
}

function setViewMode(mode) {
  viewMode = mode;
  document.querySelectorAll(".view-mode-btn").forEach(btn => {
    btn.classList.remove("bg-blue-600", "text-white");
    btn.classList.add("bg-slate-900", "text-slate-400", "border-slate-800");
  });
  
  const activeBtn = document.getElementById(`view-btn-${mode}`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-slate-900", "text-slate-400", "border-slate-800");
    activeBtn.classList.add("bg-blue-600", "text-white");
  }

  renderProductGrid();
}

function renderStats() {
  const productsArr = Object.values(currentProducts);
  const totalCount = productsArr.length;
  const ucucuCount = productsArr.filter(p => p.category === "Uçucu Yağlar").length;
  const sabitCount = productsArr.filter(p => p.category === "Sabit Yağlar").length;

  document.getElementById("stat-total-count").innerText = totalCount;
  document.getElementById("stat-ucucu-count").innerText = ucucuCount;
  document.getElementById("stat-sabit-count").innerText = sabitCount;
}

function filterCategory(cat) {
  activeCategory = cat;
  
  document.querySelectorAll(".cat-tab-btn").forEach(btn => {
    btn.classList.remove("bg-blue-600", "text-white");
    btn.classList.add("bg-slate-800", "text-slate-400", "hover:bg-slate-700");
  });
  
  const activeBtn = document.getElementById(`cat-tab-${cat}`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-slate-800", "text-slate-400", "hover:bg-slate-700");
    activeBtn.classList.add("bg-blue-600", "text-white");
  }

  renderProductGrid();
}

function getVolumeConfig(product, volKey) {
  if (!product.volumes) product.volumes = StorageManager.createDefaultVolumeConfigs();
  if (!product.volumes[volKey]) {
    product.volumes[volKey] = {
      packagingCost: DEFAULT_PACKAGING_COSTS[volKey] || 14.50,
      targetProfit: 70,
      webSalePrice: null,
      retailPrice: null,
      s5: null,
      channels: {
        trendyol: { commission: 19, discount: 0, cargo: 110 },
        hepsiburada: { commission: 17, discount: 0, cargo: 110 },
        iyzico: { commission: 4, discount: 0, cargo: 110 }
      }
    };
  }
  return product.volumes[volKey];
}


function renderProductGrid() {
  const container = document.getElementById("product-grid");
  if (!container) return;

  container.innerHTML = "";

  const productsArr = Object.values(currentProducts);
  const filtered = productsArr.filter(p => {
    const matchesCat = (activeCategory === "all") || (p.category === activeCategory);
    const matchesSearch = (p.name.toLowerCase().includes(searchQuery)) || 
                          (p.sku.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-10 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 w-full">
        <svg class="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="text-xs font-medium">Aramanıza uygun Cansızzade ürünü bulunamadı.</p>
        <button onclick="clearSearch()" class="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg">Aramayı Temizle</button>
      </div>
    `;
    return;
  }

  if (viewMode === "rows") {
    container.className = "flex flex-col gap-2.5 w-full";
  } else {
    container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full";
  }

  filtered.forEach(product => {
    const mainVol = product.activeVolume || (product.category === "Uçucu Yağlar" ? "50ml" : "250ml");
    const volConfig = getVolumeConfig(product, mainVol);
    const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, mainVol, volConfig.packagingCost);
    
    const tyResult = PriceCalculator.calculateSystem1Channel({
      wholesaleCost: unitCost,
      targetProfit: volConfig.targetProfit ?? 70,
      commission: volConfig.channels?.trendyol?.commission || 19,
      discount: volConfig.channels?.trendyol?.discount || 0,
      cargo: volConfig.channels?.trendyol?.cargo || 110
    });

    const isUcucu = product.category === "Uçucu Yağlar";
    const badgeClass = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    if (viewMode === "rows") {
      const rowHtml = `
        <div class="glass-card rounded-xl p-3 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:border-blue-500/40 transition-all group">
          <div class="flex items-center gap-2.5 min-w-[260px]">
            <span class="font-mono text-[11px] font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              ${product.sku}
            </span>
            <div>
              <h3 class="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                ${product.name}
              </h3>
              <span class="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${badgeClass}">
                ${product.category}
              </span>
            </div>
          </div>

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[120px]">
            <span class="text-slate-400 block text-[9px] uppercase font-semibold">1KG Toptan</span>
            <span class="font-bold text-slate-200 text-xs">${PriceCalculator.formatTL(product.costPerKg)}</span>
          </div>

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[140px]">
            <span class="text-slate-400 block text-[9px] uppercase font-semibold">ml Maliyeti</span>
            <span class="font-bold text-blue-400 text-xs">${mainVol} (${PriceCalculator.formatTL(unitCost)})</span>
          </div>

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[130px]">
            <span class="text-slate-400 block text-[9px] uppercase font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Trendyol Etiket
            </span>
            <span class="font-bold text-white text-xs">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
          </div>

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[120px]">
            <span class="text-slate-400 block text-[9px] uppercase font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Hedef Kâr
            </span>
            <span class="font-bold text-emerald-400 text-xs">+${PriceCalculator.formatTL(volConfig.targetProfit ?? 70)}</span>
          </div>

          <div class="min-w-[160px]">
            <button onclick="openProductSlot('${product.id}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-xl shadow text-xs flex items-center justify-center gap-1.5 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              AYARLARI AÇ
            </button>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", rowHtml);
    } else {
      const cardHtml = `
        <div class="glass-card glass-card-hover rounded-xl p-4 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}">
                ${product.category}
              </span>
              <span class="font-mono text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                ${product.sku}
              </span>
            </div>

            <h3 class="text-xs font-bold text-white tracking-tight mb-2 group-hover:text-blue-400 transition-colors">
              ${product.name}
            </h3>

            <div class="grid grid-cols-2 gap-2 my-2 text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <div>
                <span class="text-slate-400 block text-[9px] uppercase font-semibold">1KG Toptan</span>
                <span class="font-bold text-slate-200 text-xs">${PriceCalculator.formatTL(product.costPerKg)}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[9px] uppercase font-semibold">ml Maliyeti</span>
                <span class="font-bold text-blue-400 text-xs">${mainVol} (${PriceCalculator.formatTL(unitCost)})</span>
              </div>
            </div>

            <div class="space-y-1 text-xs my-2">
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1 text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Trendyol:</span>
                <span class="font-bold text-white text-xs">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1 text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Net Kâr:</span>
                <span class="font-bold text-emerald-400 text-xs">+${PriceCalculator.formatTL(volConfig.targetProfit ?? 70)}</span>
              </div>
            </div>
          </div>

          <button onclick="openProductSlot('${product.id}')" class="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg shadow text-xs flex items-center justify-center gap-1.5 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            AYARLARI AÇ
          </button>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", cardHtml);
    }
  });
}

function clearSearch() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  searchQuery = "";
  renderProductGrid();
}

// ==========================================
// ADD NEW CUSTOM PRODUCT MODAL LOGIC
// ==========================================
function openAddProductModal() {
  const modal = document.getElementById("add-product-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAddProductModal() {
  const modal = document.getElementById("add-product-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function submitNewProduct() {
  const sku = document.getElementById("add-custom-sku").value.trim() || `CUSTOM-${Date.now()}`;
  const name = document.getElementById("add-custom-name").value.trim() || "Özel Ürün";
  const category = document.getElementById("add-custom-category").value;
  const costKg = parseFloat(document.getElementById("add-custom-cost-kg").value) || 1000;
  const kdv = parseFloat(document.getElementById("add-custom-kdv").value) || 20;

  const defaultVol = category === "Uçucu Yağlar" ? "50ml" : "250ml";

  const newProduct = {
    id: sku,
    sku: sku,
    name: name,
    category: category,
    kdv: kdv,
    unit: "1KG",
    costPerKg: costKg,
    activeVolume: defaultVol,
    volumes: StorageManager.createDefaultVolumeConfigs()
  };

  await StorageManager.saveProduct(newProduct);
  currentProducts = StorageManager.getProducts();

  renderStats();
  renderProductGrid();
  closeAddProductModal();

  showToast(`Yeni Ürün Kartı Eklendi: ${name} ✅`);
  openProductSlot(sku);
}

// ==========================================
// MODAL WORKSPACE & DROPDOWN VOLUME LOGIC
// ==========================================
function openProductSlot(productId) {
  selectedProductId = productId;
  const product = currentProducts[productId];
  if (!product) return;

  activeVolume = product.activeVolume || (product.category === "Uçucu Yağlar" ? "50ml" : "250ml");

  document.getElementById("modal-product-title").innerText = `${product.name} (${product.sku})`;
  document.getElementById("modal-product-category").innerText = product.category;
  document.getElementById("slot-cost-per-kg").value = product.costPerKg;

  syncModalVolumeDropdown(activeVolume);
  loadActiveVolumeConfig(product, activeVolume);

  switchSimTab("system1");

  const modal = document.getElementById("product-slot-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function syncModalVolumeDropdown(volKey) {
  const select = document.getElementById("modal-volume-select");
  if (select) select.value = volKey;
}

function selectModalVolumeDropdown(volKey) {
  saveInputsToCurrentVolumeConfig();

  activeVolume = volKey;
  const product = currentProducts[selectedProductId];
  if (product) {
    product.activeVolume = volKey;
    syncModalVolumeDropdown(volKey);
    loadActiveVolumeConfig(product, volKey);
    calculateCurrentModal();
  }
}

function loadActiveVolumeConfig(product, volKey) {
  const config = getVolumeConfig(product, volKey);

  const packCost = config.packagingCost ?? (DEFAULT_PACKAGING_COSTS[volKey] || 14.50);
  const targetProfit = config.targetProfit ?? 70;
  const tyChannel = config.channels?.trendyol || { commission: 19, discount: 0, cargo: 110 };

  const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, volKey, packCost);
  const s1TyRes = PriceCalculator.calculateSystem1Channel({
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: tyChannel.commission || 19,
    discount: tyChannel.discount || 0,
    cargo: tyChannel.cargo || 110
  });

  const baseTyPrice = s1TyRes.listPrice;

  document.getElementById("slot-packaging-cost").value = packCost;
  document.getElementById("slot-target-profit").value = targetProfit;
  
  document.getElementById("s2_web_price").value = config.webSalePrice ?? parseFloat((baseTyPrice * 0.85).toFixed(2));
  document.getElementById("s4_retail_price").value = config.retailPrice ?? baseTyPrice;

  const s5 = config.s5 || {};
  const defaultAvPrice = parseFloat((baseTyPrice * 0.90).toFixed(2));  // 🟢 1. Avantajlı %10 indirimli teklif
  const defaultCakPrice = parseFloat((baseTyPrice * 0.82).toFixed(2)); // 🟡 2. Çok Avantajlı %18 indirimli teklif
  const defaultSupPrice = parseFloat((baseTyPrice * 0.70).toFixed(2)); // 🔴 3. Süper Avantajlı %30 indirimli teklif

  document.getElementById("s5_price_av").value = s5.priceAv ?? defaultAvPrice;
  document.getElementById("s5_comm_av").value = s5.commAv ?? 19.0;
  document.getElementById("s5_price_cak").value = s5.priceCak ?? defaultCakPrice;
  document.getElementById("s5_comm_cak").value = s5.commCak ?? 19.0;
  document.getElementById("s5_price_sup").value = s5.priceSup ?? defaultSupPrice;
  document.getElementById("s5_comm_sup").value = s5.commSup ?? 19.0;
  document.getElementById("s5_cargo").value = s5.cargo ?? (tyChannel.cargo || 110);


  const ty = config.channels?.trendyol || { commission: 19, discount: 0, cargo: 110 };
  const hb = config.channels?.hepsiburada || { commission: 17, discount: 0, cargo: 110 };
  const iy = config.channels?.iyzico || { commission: 4, discount: 0, cargo: 82.50 };

  document.getElementById("s1_comm_ty").value = ty.commission;
  document.getElementById("s1_disc_ty").value = ty.discount;
  document.getElementById("s1_kargo_ty").value = ty.cargo;

  document.getElementById("s1_comm_hb").value = hb.commission;
  document.getElementById("s1_disc_hb").value = hb.discount;
  document.getElementById("s1_kargo_hb").value = hb.cargo;

  document.getElementById("s1_comm_iy").value = iy.commission;
  document.getElementById("s1_disc_iy").value = iy.discount;
  document.getElementById("s1_kargo_iy").value = iy.cargo;

  calculateCurrentModal();
}

function saveInputsToCurrentVolumeConfig() {
  if (!selectedProductId) return;
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const config = getVolumeConfig(product, activeVolume);
  config.packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  config.targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;
  
  config.webSalePrice = parseFloat(document.getElementById("s2_web_price").value) || 500;
  config.retailPrice = parseFloat(document.getElementById("s4_retail_price").value) || 650;

  config.s5 = {
    priceAv: parseFloat(document.getElementById("s5_price_av").value) || 0,
    commAv: parseFloat(document.getElementById("s5_comm_av").value) || 15,
    priceCak: parseFloat(document.getElementById("s5_price_cak").value) || 0,
    commCak: parseFloat(document.getElementById("s5_comm_cak").value) || 14.6,
    priceSup: parseFloat(document.getElementById("s5_price_sup").value) || 0,
    commSup: parseFloat(document.getElementById("s5_comm_sup").value) || 12.5,
    cargo: parseFloat(document.getElementById("s5_cargo").value) || 110
  };

  config.channels = {
    trendyol: {
      commission: parseFloat(document.getElementById("s1_comm_ty").value) || 0,
      discount: parseFloat(document.getElementById("s1_disc_ty").value) || 0,
      cargo: parseFloat(document.getElementById("s1_kargo_ty").value) || 0
    },
    hepsiburada: {
      commission: parseFloat(document.getElementById("s1_comm_hb").value) || 0,
      discount: parseFloat(document.getElementById("s1_disc_hb").value) || 0,
      cargo: parseFloat(document.getElementById("s1_kargo_hb").value) || 0
    },
    iyzico: {
      commission: parseFloat(document.getElementById("s1_comm_iy").value) || 0,
      discount: parseFloat(document.getElementById("s1_disc_iy").value) || 0,
      cargo: parseFloat(document.getElementById("s1_kargo_iy").value) || 0
    }
  };
}

function closeProductSlot() {
  const modal = document.getElementById("product-slot-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  selectedProductId = null;
}

function switchSimTab(tabId) {
  activeSimTab = tabId;

  document.querySelectorAll(".sim-tab-btn").forEach(btn => {
    btn.classList.remove("active", "bg-blue-600", "text-white");
    btn.classList.add("inactive", "text-slate-400");
  });

  const activeBtn = document.getElementById(`sim-tab-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove("inactive", "text-slate-400");
    activeBtn.classList.add("active", "bg-blue-600", "text-white");
  }

  ["system1", "system2", "system3", "system4", "system5"].forEach(id => {
    const el = document.getElementById(`sim-${id}-container`);
    if (el) {
      if (id === tabId) {
        el.classList.remove("hidden");
        el.classList.add("block");
      } else {
        el.classList.add("hidden");
        el.classList.remove("block");
      }
    }
  });

  calculateCurrentModal();
}

function calculateCurrentModal() {
  if (!selectedProductId) return;

  if (activeSimTab === "system1") {
    calculateSystem1Modal();
  } else if (activeSimTab === "system2") {
    calculateSystem2Modal();
  } else if (activeSimTab === "system3") {
    calculateSystem3Modal();
  } else if (activeSimTab === "system4") {
    calculateSystem4Modal();
  } else if (activeSimTab === "system5") {
    calculateSystem5Modal();
  }
}

function getModalCostPerKg() {
  const inputVal = parseFloat(document.getElementById("slot-cost-per-kg").value);
  if (!isNaN(inputVal) && inputVal >= 0) return inputVal;
  const product = currentProducts[selectedProductId];
  return product ? product.costPerKg : 1000;
}

function calculateSystem1Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const costPerKg = getModalCostPerKg();
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;

  const unitCost = PriceCalculator.calculateUnitWholesaleCost(costPerKg, activeVolume, packagingCost);
  document.getElementById("calculated-unit-cost").innerText = PriceCalculator.formatTL(unitCost);

  const tyInput = {
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_ty").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_ty").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_ty").value) || 110
  };

  const hbInput = {
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_hb").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_hb").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_hb").value) || 110
  };

  const iyInput = {
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_iy").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_iy").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_iy").value) || 110
  };

  const tyRes = PriceCalculator.calculateSystem1Channel(tyInput);
  const hbRes = PriceCalculator.calculateSystem1Channel(hbInput);
  const iyRes = PriceCalculator.calculateSystem1Channel(iyInput);

  document.getElementById("s1_list_ty").innerText = PriceCalculator.formatTL(tyRes.listPrice);
  document.getElementById("s1_sale_ty").innerText = `İndirimli: ${PriceCalculator.formatTL(tyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_ty").innerText = PriceCalculator.formatTL(tyRes.salePrice);
  document.getElementById("s1_rec_kargo_ty").innerText = `-${PriceCalculator.formatTL(tyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_ty").innerText = `-${PriceCalculator.formatTL(tyRes.commAmount)}`;
  document.getElementById("s1_hakedis_ty").innerText = PriceCalculator.formatTL(tyRes.payout);
  document.getElementById("s1_rec_maliyet_ty").innerText = `-${PriceCalculator.formatTL(tyRes.wholesaleCost)}`;
  document.getElementById("s1_profit_ty").innerText = PriceCalculator.formatTL(tyRes.netProfit);

  document.getElementById("s1_list_hb").innerText = PriceCalculator.formatTL(hbRes.listPrice);
  document.getElementById("s1_sale_hb").innerText = `İndirimli: ${PriceCalculator.formatTL(hbRes.salePrice)}`;
  document.getElementById("s1_rec_sale_hb").innerText = PriceCalculator.formatTL(hbRes.salePrice);
  document.getElementById("s1_rec_kargo_hb").innerText = `-${PriceCalculator.formatTL(hbRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_hb").innerText = `-${PriceCalculator.formatTL(hbRes.commAmount)}`;
  document.getElementById("s1_hakedis_hb").innerText = PriceCalculator.formatTL(hbRes.payout);
  document.getElementById("s1_rec_maliyet_hb").innerText = `-${PriceCalculator.formatTL(hbRes.wholesaleCost)}`;
  document.getElementById("s1_profit_hb").innerText = PriceCalculator.formatTL(hbRes.netProfit);

  document.getElementById("s1_list_iy").innerText = PriceCalculator.formatTL(iyRes.listPrice);
  document.getElementById("s1_sale_iy").innerText = `İndirimli: ${PriceCalculator.formatTL(iyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_iy").innerText = PriceCalculator.formatTL(iyRes.salePrice);
  document.getElementById("s1_rec_kargo_iy").innerText = `-${PriceCalculator.formatTL(iyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_iy").innerText = `-${PriceCalculator.formatTL(iyRes.commAmount)}`;
  document.getElementById("s1_hakedis_iy").innerText = PriceCalculator.formatTL(iyRes.payout);
  document.getElementById("s1_rec_maliyet_iy").innerText = `-${PriceCalculator.formatTL(iyRes.wholesaleCost)}`;
  document.getElementById("s1_profit_iy").innerText = PriceCalculator.formatTL(iyRes.netProfit);
}

function calculateSystem2Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const costPerKg = getModalCostPerKg();
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const unitCost = PriceCalculator.calculateUnitWholesaleCost(costPerKg, activeVolume, packagingCost);

  const webPrice = parseFloat(document.getElementById("s2_web_price").value) || 0;

  const s2Res = PriceCalculator.calculateSystem2({
    webSalePrice: webPrice,
    unitCost: unitCost,
    tyComm: parseFloat(document.getElementById("s1_comm_ty").value) || 19,
    tyCargo: parseFloat(document.getElementById("s1_kargo_ty").value) || 110,
    hbComm: parseFloat(document.getElementById("s1_comm_hb").value) || 17,
    hbCargo: parseFloat(document.getElementById("s1_kargo_hb").value) || 110
  });

  document.getElementById("s2_web_profit_display").innerText = PriceCalculator.formatTL(s2Res.webProfit);
  document.getElementById("s2_ty_eq_price").innerText = PriceCalculator.formatTL(s2Res.tyEquivalentList);
  document.getElementById("s2_ty_payout").innerText = `Eşdeğer Hakediş: ${PriceCalculator.formatTL(s2Res.tyPayout)}`;

  document.getElementById("s2_hb_eq_price").innerText = PriceCalculator.formatTL(s2Res.hbEquivalentList);
  document.getElementById("s2_hb_payout").innerText = `Eşdeğer Hakediş: ${PriceCalculator.formatTL(s2Res.hbPayout)}`;
}

function calculateSystem3Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const costPerKg = getModalCostPerKg();
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 70;
  const matrix = PriceCalculator.calculateSystem3VolumeMatrix(costPerKg, targetProfit);

  const tbody = document.getElementById("s3-matrix-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  matrix.forEach(row => {
    const tr = `
      <tr class="hover:bg-slate-900/60 transition-colors">
        <td class="p-2.5 font-bold text-white">${row.volume}</td>
        <td class="p-2.5 text-slate-300">${PriceCalculator.formatTL(row.packagingCost)}</td>
        <td class="p-2.5 font-bold text-blue-400">${PriceCalculator.formatTL(row.unitCost)}</td>
        <td class="p-2.5 font-bold text-white">${PriceCalculator.formatTL(row.tyPrice)}</td>
        <td class="p-2.5 font-bold text-emerald-400 text-right">+${PriceCalculator.formatTL(row.netProfit)}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });
}

function calculateSystem4Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const costPerKg = getModalCostPerKg();
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const unitCost = PriceCalculator.calculateUnitWholesaleCost(costPerKg, activeVolume, packagingCost);

  const retailPrice = parseFloat(document.getElementById("s4_retail_price").value) || 0;
  const comm = parseFloat(document.getElementById("s4_comm").value) || 19;
  const cargo = parseFloat(document.getElementById("s4_cargo").value) || 110;

  const s4Res = PriceCalculator.calculateSystem4({
    retailPrice: retailPrice,
    unitCost: unitCost,
    commission: comm,
    cargo: cargo
  });

  document.getElementById("s4_payout_display").innerText = PriceCalculator.formatTL(s4Res.payout);
  document.getElementById("s4_profit_display").innerText = PriceCalculator.formatTL(s4Res.netProfit);
  document.getElementById("s4_margin_display").innerText = `%${s4Res.marginPercent}`;
}

function calculateSystem5Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  // Update active volume badge text
  const badgeEl = document.getElementById("s5-active-volume-badge");
  if (badgeEl) {
    badgeEl.innerText = `${activeVolume}`;
  }

  const costPerKg = getModalCostPerKg();
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const unitCost = PriceCalculator.calculateUnitWholesaleCost(costPerKg, activeVolume, packagingCost);
  const cargo = parseFloat(document.getElementById("s5_cargo").value) || 110;

  // 1. Avantajlı
  const priceAv = parseFloat(document.getElementById("s5_price_av").value) || 0;
  const commAv = parseFloat(document.getElementById("s5_comm_av").value) || 15;
  const commAmtAv = priceAv * (commAv / 100);
  const payoutAv = priceAv - commAmtAv - cargo;
  const profitAv = payoutAv - unitCost;

  // 2. Çok Avantajlı
  const priceCak = parseFloat(document.getElementById("s5_price_cak").value) || 0;
  const commCak = parseFloat(document.getElementById("s5_comm_cak").value) || 14.6;
  const commAmtCak = priceCak * (commCak / 100);
  const payoutCak = priceCak - commAmtCak - cargo;
  const profitCak = payoutCak - unitCost;

  // 3. Süper Avantajlı
  const priceSup = parseFloat(document.getElementById("s5_price_sup").value) || 0;
  const commSup = parseFloat(document.getElementById("s5_comm_sup").value) || 12.5;
  const commAmtSup = priceSup * (commSup / 100);
  const payoutSup = priceSup - commAmtSup - cargo;
  const profitSup = payoutSup - unitCost;

  // Render Avantajlı Card
  document.getElementById("s5_res_comm_av").innerText = `-${PriceCalculator.formatTL(commAmtAv)}`;
  document.getElementById("s5_res_cargo_av").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_av").innerText = PriceCalculator.formatTL(payoutAv);
  document.getElementById("s5_res_cost_av").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  const elProfAv = document.getElementById("s5_res_profit_av");
  if (profitAv < 0) {
    elProfAv.className = "val font-black text-rose-400 text-xs";
    elProfAv.innerText = `⚠️ ZARAR ${PriceCalculator.formatTL(profitAv)}`;
  } else {
    elProfAv.className = "val font-black text-emerald-400 text-xs";
    elProfAv.innerText = `+${PriceCalculator.formatTL(profitAv)}`;
  }

  // Render Çok Avantajlı Card
  document.getElementById("s5_res_comm_cak").innerText = `-${PriceCalculator.formatTL(commAmtCak)}`;
  document.getElementById("s5_res_cargo_cak").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_cak").innerText = PriceCalculator.formatTL(payoutCak);
  document.getElementById("s5_res_cost_cak").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  const elProfCak = document.getElementById("s5_res_profit_cak");
  if (profitCak < 0) {
    elProfCak.className = "val font-black text-rose-400 text-xs";
    elProfCak.innerText = `⚠️ ZARAR ${PriceCalculator.formatTL(profitCak)}`;
  } else {
    elProfCak.className = "val font-black text-emerald-400 text-xs";
    elProfCak.innerText = `+${PriceCalculator.formatTL(profitCak)}`;
  }

  // Render Süper Avantajlı Card
  document.getElementById("s5_res_comm_sup").innerText = `-${PriceCalculator.formatTL(commAmtSup)}`;
  document.getElementById("s5_res_cargo_sup").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_sup").innerText = PriceCalculator.formatTL(payoutSup);
  document.getElementById("s5_res_cost_sup").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  const elProfSup = document.getElementById("s5_res_profit_sup");
  if (profitSup < 0) {
    elProfSup.className = "val font-black text-rose-400 text-xs";
    elProfSup.innerText = `⚠️ ZARAR ${PriceCalculator.formatTL(profitSup)}`;
  } else {
    elProfSup.className = "val font-black text-emerald-400 text-xs";
    elProfSup.innerText = `+${PriceCalculator.formatTL(profitSup)}`;
  }
}

async function saveCurrentProductSlot() {
  if (!selectedProductId) return;

  saveInputsToCurrentVolumeConfig();

  const product = currentProducts[selectedProductId];
  if (!product) return;

  product.activeVolume = activeVolume;
  product.costPerKg = getModalCostPerKg();

  await StorageManager.saveProduct(product);
  currentProducts = StorageManager.getProducts();
  
  renderProductGrid();
  renderStats();

  showToast(`${product.name} İçin Tüm Ayarlar ve Trendyol Teklif Fiyatları Saklandı! ☁️✅`);
}

function resetCatalog() {
  if (confirm("Tüm ürün slot ayarlarınızı fabrika varsayılanlarına sıfırlamak istediğinize emin misiniz?")) {
    currentProducts = StorageManager.resetToDefault();
    renderProductGrid();
    renderStats();
    showToast("Ürün Kataloğu Fabrika Ayarlarına Sıfırlandı 🔄");
  }
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm animate-slide-up flex items-center gap-2 border border-emerald-400/30";
  toast.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3505);
}

// =========================================================================
// LAYER 2: SAF ÜRETİM MALİYETİ & FABRİKA GİDER MİMARİSİ
// =========================================================================

function switchLayerMode(mode) {
  currentLayerMode = mode;

  const btn1 = document.getElementById("layer-btn-1");
  const btn2 = document.getElementById("layer-btn-2");
  const view1 = document.getElementById("layer1-main-view");
  const view2 = document.getElementById("layer2-main-view");
  const btnOverhead = document.getElementById("btn-factory-overhead");

  if (mode === 1) {
    if (btn1) btn1.className = "layer-tab-btn active px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/25";
    if (btn2) btn2.className = "layer-tab-btn inactive px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all text-slate-400 hover:text-white";
    
    if (view1) view1.classList.remove("hidden");
    if (view2) view2.classList.add("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    renderProductGrid();
  } else {
    if (btn1) btn1.className = "layer-tab-btn inactive px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all text-slate-400 hover:text-white";
    if (btn2) btn2.className = "layer-tab-btn active px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all bg-emerald-600 text-white shadow-lg shadow-emerald-500/25";

    if (view1) view1.classList.add("hidden");
    if (view2) view2.classList.remove("hidden");
    if (btnOverhead) {
      btnOverhead.classList.remove("hidden");
      btnOverhead.classList.add("flex");
    }

    updateLayer2BannerStats();
    renderLayer2Cards();
  }
}

function updateLayer2BannerStats() {
  const overhead = StorageManager.getFactoryOverhead();
  const res = PriceCalculator.calculateFactoryOverheadPerKg(overhead);
  
  const elTotal = document.getElementById("l2-stat-total-overhead");
  const elKg = document.getElementById("l2-stat-overhead-per-kg");

  if (elTotal) elTotal.innerText = PriceCalculator.formatTL(res.totalMonthlyOverhead);
  if (elKg) elKg.innerText = `${PriceCalculator.formatTL(res.overheadPerKg)}/KG`;
}

function openFactoryOverheadModal() {
  const overhead = StorageManager.getFactoryOverhead();
  
  if (document.getElementById("overhead-salaries")) document.getElementById("overhead-salaries").value = overhead.salaries ?? 200000;
  if (document.getElementById("overhead-sgk")) document.getElementById("overhead-sgk").value = overhead.sgk ?? 50000;
  if (document.getElementById("overhead-electricity")) document.getElementById("overhead-electricity").value = overhead.electricity ?? 25000;
  if (document.getElementById("overhead-catering")) document.getElementById("overhead-catering").value = overhead.catering ?? 30000;
  if (document.getElementById("overhead-rent-sarf")) document.getElementById("overhead-rent-sarf").value = overhead.rentSarf ?? 0;
  if (document.getElementById("overhead-direct-per-kg")) document.getElementById("overhead-direct-per-kg").value = overhead.overheadPerKg ?? 35;

  recalculateFactoryOverheadModal();

  const modal = document.getElementById("factory-overhead-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeFactoryOverheadModal() {
  const modal = document.getElementById("factory-overhead-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function recalculateFactoryOverheadModal() {
  const salaries = document.getElementById("overhead-salaries") ? (parseFloat(document.getElementById("overhead-salaries").value) || 0) : 200000;
  const sgk = document.getElementById("overhead-sgk") ? (parseFloat(document.getElementById("overhead-sgk").value) || 0) : 50000;
  const electricity = document.getElementById("overhead-electricity") ? (parseFloat(document.getElementById("overhead-electricity").value) || 0) : 25000;
  const catering = document.getElementById("overhead-catering") ? (parseFloat(document.getElementById("overhead-catering").value) || 0) : 30000;
  const rentSarf = document.getElementById("overhead-rent-sarf") ? (parseFloat(document.getElementById("overhead-rent-sarf").value) || 0) : 0;
  const inputDirect = document.getElementById("overhead-direct-per-kg");
  const directVal = inputDirect ? (parseFloat(inputDirect.value) || 35) : 35;

  const res = PriceCalculator.calculateFactoryOverheadPerKg({
    salaries, sgk, electricity, catering, rentSarf, overheadPerKg: directVal
  });

  const modalMonthly = document.getElementById("modal-overhead-total-monthly");
  if (modalMonthly) modalMonthly.innerText = PriceCalculator.formatTL(res.totalMonthlyOverhead);

  const modalTotal = document.getElementById("modal-overhead-total");
  if (modalTotal) modalTotal.innerText = `${PriceCalculator.formatTL(res.overheadPerKg)} / KG`;
}

function saveFactoryOverheadModal() {
  const salaries = document.getElementById("overhead-salaries") ? (parseFloat(document.getElementById("overhead-salaries").value) || 0) : 200000;
  const sgk = document.getElementById("overhead-sgk") ? (parseFloat(document.getElementById("overhead-sgk").value) || 0) : 50000;
  const electricity = document.getElementById("overhead-electricity") ? (parseFloat(document.getElementById("overhead-electricity").value) || 0) : 25000;
  const catering = document.getElementById("overhead-catering") ? (parseFloat(document.getElementById("overhead-catering").value) || 0) : 30000;
  const rentSarf = document.getElementById("overhead-rent-sarf") ? (parseFloat(document.getElementById("overhead-rent-sarf").value) || 0) : 0;
  const inputDirect = document.getElementById("overhead-direct-per-kg");
  const directVal = inputDirect ? (parseFloat(inputDirect.value) || 35) : 35;

  const overheadConfig = {
    salaries,
    sgk,
    electricity,
    catering,
    rentSarf,
    overheadPerKg: directVal
  };

  StorageManager.saveFactoryOverhead(overheadConfig);
  closeFactoryOverheadModal();

  updateLayer2BannerStats();
  renderLayer2Cards();

  showToast("Doğrudan 1KG Sabit Tesis Payı Kaydedildi! 🏭✅");
}

let openLayer2Breakdowns = {};

function toggleLayer2Breakdown(productId) {
  openLayer2Breakdowns[productId] = !openLayer2Breakdowns[productId];
  renderLayer2Cards();
}

function renderLayer2Cards() {
  const containerGrid = document.getElementById("layer2-product-grid");
  const containerRows = document.getElementById("layer2-product-rows");
  if (!containerGrid || !containerRows) return;

  containerGrid.innerHTML = "";
  containerRows.innerHTML = "";

  if (viewMode === "rows") {
    containerRows.classList.remove("hidden");
    containerGrid.classList.add("hidden");
  } else {
    containerGrid.classList.remove("hidden");
    containerRows.classList.add("hidden");
  }

  const productsList = Object.values(currentProducts).filter(p => {
    if (!p || typeof p.name !== "string" || typeof p.sku !== "string") return false;
    const matchesCat = (activeCategory === "all") || (p.category === activeCategory);
    const pName = (p.name || "").toLowerCase();
    const pSku = (p.sku || "").toLowerCase();
    const matchesSearch = pName.includes(searchQuery) || pSku.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const overhead = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overhead);

  productsList.forEach(product => {
    const seedCost = product.seedCostPerKg || (product.costPerKg ? (product.costPerKg * 0.25) : 50);
    const yieldPercent = product.yieldPercent || 25;
    const vol = product.layer2Volume || "1000ml";
    const isBreakdownOpen = !!openLayer2Breakdowns[product.id];

    const trueCostRes = PriceCalculator.calculateTrueProductionCost({
      seedCostPerKg: seedCost,
      yieldPercent: yieldPercent,
      volumeStr: vol,
      packagingCost: DEFAULT_PACKAGING_COSTS[vol] || 14.50,
      overheadPerKg: overheadRes.overheadPerKg
    });

    const badgeClass = product.category === "Uçucu Yağlar"
      ? "bg-purple-950/80 text-purple-300 border-purple-800/60"
      : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";

    if (viewMode === "rows") {
      const rowHtml = `
        <div class="glass-card rounded-xl p-3 border border-slate-800/80 hover:border-emerald-500/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-950">
          <div class="flex items-center gap-2.5 min-w-[240px]">
            <span class="font-mono text-[11px] font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              ${product.sku}
            </span>
            <div>
              <h3 class="text-xs font-bold text-white">
                ${product.name}
              </h3>
              <span class="text-[9px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}">
                ${product.category}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-slate-400 font-semibold">Tohum:</span>
              <input type="number" value="${seedCost}" min="0" step="any" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-20 bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs px-2 py-1 rounded-lg focus:outline-none">
              <span class="text-[10px] text-slate-400">₺/KG</span>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-slate-400 font-semibold">Verim:</span>
              <input type="number" value="${yieldPercent}" min="1" max="100" step="any" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-16 bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg focus:outline-none">
              <span class="text-[10px] text-slate-400">%</span>
            </div>

            <div class="flex items-center gap-1.5">
              <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-emerald-500/50 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg focus:outline-none">
                <option value="1000ml" ${vol === "1000ml" ? "selected" : ""}>1000ml (1KG)</option>
                <option value="500ml" ${vol === "500ml" ? "selected" : ""}>500ml</option>
                <option value="250ml" ${vol === "250ml" ? "selected" : ""}>250ml</option>
                <option value="100ml" ${vol === "100ml" ? "selected" : ""}>100ml</option>
                <option value="50ml" ${vol === "50ml" ? "selected" : ""}>50ml</option>
                <option value="30ml" ${vol === "30ml" ? "selected" : ""}>30ml</option>
                <option value="20ml" ${vol === "20ml" ? "selected" : ""}>20ml</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-4 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <div>
              <span class="text-[9px] uppercase font-bold text-emerald-400 block">SAF NET MALİYET:</span>
              <span class="text-sm font-black text-emerald-300">${PriceCalculator.formatTL(trueCostRes.trueProductionCost)}</span>
            </div>
            <button onclick="toggleLayer2Breakdown('${product.id}')" class="text-[10px] text-emerald-400 hover:text-white font-bold bg-slate-900 border border-emerald-500/40 px-2 py-1 rounded-lg transition-all">
              ${isBreakdownOpen ? "▲ Dökümü Kapat" : "▼ Maliyet Dökümü"}
            </button>
          </div>
        </div>

        ${isBreakdownOpen ? `
          <div class="bg-slate-950/90 p-3 rounded-xl border border-emerald-500/40 space-y-1 text-xs my-1 animate-slide-up">
            <div class="flex justify-between items-center text-slate-300">
              <span>1. 🌾 Saf Yağ Hammaddesi (1KG):</span>
              <span class="font-bold text-amber-300">${PriceCalculator.formatTL(trueCostRes.rawOilCostPerKg)}/KG</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span>2. 🏭 Sabit Tesis & İşçilik/SGK Payı:</span>
              <span class="font-bold text-emerald-400">+${PriceCalculator.formatTL(trueCostRes.totalOilCostPerKg - trueCostRes.rawOilCostPerKg)}/KG</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span>3. 🧴 Şişe & Ambalaj Maliyeti:</span>
              <span class="font-bold text-blue-400">${PriceCalculator.formatTL(trueCostRes.packagingCost)}</span>
            </div>
          </div>
        ` : ""}
      `;

      containerRows.insertAdjacentHTML("beforeend", rowHtml);

    } else {
      const cardHtml = `
        <div class="glass-card rounded-2xl p-4 border border-slate-800/80 hover:border-emerald-500/50 flex flex-col justify-between relative overflow-hidden transition-all bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">
                ${product.category}
              </span>
              <span class="font-mono text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                ${product.sku}
              </span>
            </div>

            <h3 class="text-sm font-extrabold text-white tracking-tight mb-3">
              ${product.name}
            </h3>

            <div class="grid grid-cols-2 gap-2 my-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              <div>
                <label class="text-slate-400 block text-[9.5px] font-semibold mb-1">🌾 Tohum Alış (₺/KG)</label>
                <input type="number" value="${seedCost}" min="0" step="any" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-full bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs px-2 py-1 rounded-lg focus:outline-none focus:border-amber-400">
              </div>

              <div>
                <label class="text-slate-400 block text-[9.5px] font-semibold mb-1">⚙️ Yağ Verimi (%)</label>
                <input type="number" value="${yieldPercent}" min="1" max="100" step="any" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg focus:outline-none focus:border-emerald-400">
              </div>
            </div>

            <div class="my-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
              <label class="text-slate-300 text-[10.5px] font-bold">🧴 Maliyet Ambalajı:</label>
              <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-emerald-500/50 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-lg focus:outline-none">
                <option value="1000ml" ${vol === "1000ml" ? "selected" : ""}>1000 ml (1 KG) ★ Ana</option>
                <option value="500ml" ${vol === "500ml" ? "selected" : ""}>500 ml</option>
                <option value="250ml" ${vol === "250ml" ? "selected" : ""}>250 ml</option>
                <option value="100ml" ${vol === "100ml" ? "selected" : ""}>100 ml</option>
                <option value="50ml" ${vol === "50ml" ? "selected" : ""}>50 ml</option>
                <option value="30ml" ${vol === "30ml" ? "selected" : ""}>30 ml</option>
                <option value="20ml" ${vol === "20ml" ? "selected" : ""}>20 ml</option>
              </select>
            </div>

            <button onclick="toggleLayer2Breakdown('${product.id}')" class="w-full text-center py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[11px] font-bold text-emerald-400 transition-all flex items-center justify-center gap-1.5 my-2">
              <span>${isBreakdownOpen ? "▲ Maliyet Dökümünü Gizle" : "▼ 🔍 Maliyet Dökümünü Göster"}</span>
            </button>

            ${isBreakdownOpen ? `
              <div class="space-y-1.5 text-xs my-2 bg-slate-950/90 p-3 rounded-xl border border-emerald-500/30 animate-slide-up">
                <div class="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>1. 🌾 Saf Yağ Hammaddesi:</span>
                  <span class="font-bold text-amber-300">${PriceCalculator.formatTL(trueCostRes.rawOilCostPerKg)}/KG</span>
                </div>
                <div class="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>2. 🏭 Sabit Tesis Payı:</span>
                  <span class="font-bold text-emerald-400">+${PriceCalculator.formatTL(trueCostRes.totalOilCostPerKg - trueCostRes.rawOilCostPerKg)}/KG</span>
                </div>
                <div class="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>3. 🧴 Şişe & Ambalaj Maliyeti:</span>
                  <span class="font-bold text-blue-400">${PriceCalculator.formatTL(trueCostRes.packagingCost)}</span>
                </div>
              </div>
            ` : ""}
          </div>

          <div class="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
            <div>
              <span class="text-[9px] uppercase font-bold text-emerald-400 block">SAF NET ÜRETİM MALİYETİ:</span>
              <span class="text-lg font-black text-emerald-300">${PriceCalculator.formatTL(trueCostRes.trueProductionCost)}</span>
            </div>
            <div class="text-right">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Arifoğlu Rekabet Tabanı</span>
              <span class="text-xs font-bold text-white">${PriceCalculator.formatTL(trueCostRes.trueProductionCost * 2.2)}</span>
            </div>
          </div>
        </div>
      `;

      containerGrid.insertAdjacentHTML("beforeend", cardHtml);
    }
  });
}

async function updateLayer2ProductField(productId, field, value) {
  const product = currentProducts[productId];
  if (!product) return;

  if (field === "seedCostPerKg") product.seedCostPerKg = parseFloat(value) || 0;
  if (field === "yieldPercent") product.yieldPercent = parseFloat(value) || 25;
  if (field === "layer2Volume") product.layer2Volume = value;

  await StorageManager.saveProduct(product);
  renderLayer2Cards();
}

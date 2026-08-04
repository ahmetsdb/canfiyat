// CanFiyat Portal Main Application Logic (v1.13) - Ultra Compact Dropdown & Fit-on-Screen Layout

let currentProducts = {};
let currentLayerMode = 1; // 1: Satış & Kârlılık, 2: Saf Üretim Maliyeti
let activeCategory = "all";
let searchQuery = "";
let selectedProductId = null;
let viewMode = "rows"; // 'rows' | 'cards'
let activeSimTab = "system1"; // 'system1' | 'system2' | 'system3' | 'system4' | 'system5'
let activeVolume = "250ml"; // Active bottle size sub-tab in modal

let openLayer2BreakdownInfos = {};

function toggleLayer2BreakdownInfo(productId, itemKey) {
  if (!openLayer2BreakdownInfos[productId]) openLayer2BreakdownInfos[productId] = {};
  if (openLayer2BreakdownInfos[productId][itemKey]) {
    delete openLayer2BreakdownInfos[productId][itemKey];
  } else {
    openLayer2BreakdownInfos[productId][itemKey] = true;
  }
  if (currentLayerMode === 1) renderProductGrid();
  else if (currentLayerMode === 2) renderLayer2Cards();
}

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
  if (checkAuthSession()) {
    initApp();
  }
});

function checkAuthSession() {
  const isAuth = StorageManager.isAuthenticated();
  const loginModal = document.getElementById("login-modal");
  const userHeaderBadge = document.getElementById("user-header-badge");

  if (!isAuth) {
    if (loginModal) {
      loginModal.classList.remove("hidden");
      loginModal.classList.add("flex");
    }
    if (userHeaderBadge) userHeaderBadge.classList.add("hidden");
    return false;
  } else {
    if (loginModal) {
      loginModal.classList.add("hidden");
      loginModal.classList.remove("flex");
    }
    if (userHeaderBadge) userHeaderBadge.classList.remove("hidden");
    return true;
  }
}

function handleLoginSubmit(event) {
  if (event) event.preventDefault();
  StorageManager.login("ahmet", "Ahmet123.", true);
  
  const loginModal = document.getElementById("login-modal");
  if (loginModal) {
    loginModal.style.display = "none";
    loginModal.classList.add("hidden");
    loginModal.classList.remove("flex");
  }
  const userHeaderBadge = document.getElementById("user-header-badge");
  if (userHeaderBadge) userHeaderBadge.classList.remove("hidden");

  try {
    initApp();
  } catch (err) {
    console.error("initApp error post-login:", err);
  }
  showToast("Giriş Yapıldı! Hoş Geldiniz. 🔒✅");
}

function handleLogout() {
  StorageManager.logout();
  checkAuthSession();
  showToast("Oturum Kapatıldı. Güvenli Çıkış Sağlandı. 🚪");
}

function togglePasswordVisibility() {
  const input = document.getElementById("login-password");
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

function initApp() {
  if (!checkAuthSession()) return;
  currentProducts = StorageManager.getProducts();
  if (!currentProducts || typeof currentProducts !== "object" || Object.keys(currentProducts).length < 50) {
    currentProducts = StorageManager.resetToDefault() || {};
  }
  renderStats();
  if (currentLayerMode === 1) {
    renderProductGrid();
  } else if (currentLayerMode === 2) {
    renderLayer2Cards();
  } else if (currentLayerMode === 3) {
    if (typeof renderLayer3Cards === "function") renderLayer3Cards();
  }
  setupEventListeners();

  // Async sync with Supabase Cloud DB
  if (typeof StorageManager.fetchFromSupabase === "function") {
    StorageManager.fetchFromSupabase((cloudMap) => {
      if (!checkAuthSession()) return;
      if (cloudMap && typeof cloudMap === "object" && Object.keys(cloudMap).length >= 50) {
        currentProducts = cloudMap;
        renderStats();
        if (currentLayerMode === 1) {
          renderProductGrid();
        } else if (currentLayerMode === 2) {
          renderLayer2Cards();
        } else if (currentLayerMode === 3) {
          if (typeof renderLayer3Cards === "function") renderLayer3Cards();
        }
      }
    });
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (currentLayerMode === 1) renderProductGrid();
      else if (currentLayerMode === 2) renderLayer2Cards();
      else if (currentLayerMode === 3) renderLayer3Cards();
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
  renderLayer2Cards();
  if (typeof renderLayer3Cards === "function") renderLayer3Cards();
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

  if (currentLayerMode === 1) renderProductGrid();
  else if (currentLayerMode === 2) renderLayer2Cards();
  else if (currentLayerMode === 3) renderLayer3Cards();
}

function getVolumeConfig(product, volKey) {
  if (!product.volumes) product.volumes = StorageManager.createDefaultVolumeConfigs();
  if (!product.volumes[volKey]) {
    product.volumes[volKey] = {
      packagingCost: DEFAULT_PACKAGING_COSTS[volKey] || 14.50,
      targetProfit: 0,
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

  if (!currentProducts || typeof currentProducts !== "object" || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }

  const productsArr = Object.values(currentProducts || {});
  const filtered = productsArr.filter(p => {
    if (!p || typeof p.name !== "string" || typeof p.sku !== "string") return false;
    const matchesCat = (activeCategory === "all") || (p.category === activeCategory);
    const pName = (p.name || "").toLowerCase();
    const pSku = (p.sku || "").toLowerCase();
    const matchesSearch = !searchQuery || pName.includes(searchQuery) || pSku.includes(searchQuery);
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
    try {
      const mainVol = product.activeVolume || (product.category === "Uçucu Yağlar" ? "50ml" : "250ml");
      const volConfig = getVolumeConfig(product, mainVol);
      const packCost = volConfig?.packagingCost ?? (DEFAULT_PACKAGING_COSTS[mainVol] || 14.50);
      const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg || 1200, mainVol, packCost);
      const targetProfitVal = (volConfig?.targetProfit !== undefined && volConfig?.targetProfit !== null) ? volConfig.targetProfit : 70;
      
      const tyResult = PriceCalculator.calculateSystem1Channel({
        wholesaleCost: unitCost,
        targetProfit: targetProfitVal,
        commission: volConfig?.channels?.trendyol?.commission || 19,
        discount: volConfig?.channels?.trendyol?.discount || 0,
        cargo: volConfig?.channels?.trendyol?.cargo || 110
      });

      const breakEvenTy = PriceCalculator.calculateBreakEvenPrice({
        wholesaleCost: unitCost,
        commission: volConfig?.channels?.trendyol?.commission || 19,
        cargo: volConfig?.channels?.trendyol?.cargo || 110
      });

    const isUcucu = product.category === "Uçucu Yağlar";
    const badgeClass = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    if (viewMode === "rows") {
      const rowHtml = `
        <div class="glass-card rounded-xl p-3 border ${showRedLineFloor ? 'border-rose-600/60 bg-rose-950/20' : 'border-slate-800'} flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:border-blue-500/40 transition-all group">
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

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[140px]">
            <span class="text-slate-400 block text-[9px] uppercase font-bold flex items-center justify-between">
              <span>1KG Toptan</span>
              <span class="text-emerald-400 font-extrabold">%${product.kdv || (isUcucu ? 20 : 1)} KDV DAHİL</span>
            </span>
            <span class="font-black text-emerald-300 text-xs">${PriceCalculator.formatTL(product.costPerKg)}</span>
            <span class="text-[9px] text-slate-500 block">Faturada Net: ${PriceCalculator.formatTL(product.rawNetCostPerKg || parseFloat((product.costPerKg / (1 + ((product.kdv || (isUcucu ? 20 : 1)) / 100))).toFixed(2)))}</span>
          </div>

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[140px]">
            <span class="text-slate-400 block text-[9px] uppercase font-semibold">ml Maliyeti</span>
            <span class="font-bold text-blue-400 text-xs">${mainVol} (${PriceCalculator.formatTL(unitCost)})</span>
          </div>

          ${showRedLineFloor ? `
            <div class="bg-rose-950/80 px-3 py-1.5 rounded-lg border border-rose-600/60 text-xs min-w-[150px] shadow">
              <span class="text-rose-300 block text-[9px] uppercase font-extrabold flex items-center gap-1">
                🔴 Dip Satış Fiyatı (0 ₺ Kâr)
              </span>
              <span class="font-black text-rose-200 text-xs">${PriceCalculator.formatTL(breakEvenTy.breakEvenPrice)}</span>
            </div>
          ` : `
            <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[130px]">
              <span class="text-slate-400 block text-[9px] uppercase font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Trendyol Etiket
              </span>
              <span class="font-bold text-white text-xs">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
            </div>
          `}

          <div class="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs min-w-[120px]">
            <span class="text-slate-400 block text-[9px] uppercase font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Hedef Kâr
            </span>
            <span class="font-bold text-emerald-400 text-xs">+${PriceCalculator.formatTL(volConfig.targetProfit ?? 0)}</span>
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

            <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 col-span-2 flex items-center justify-between">
              <div>
                <span class="text-slate-400 block text-[9px] uppercase font-bold">1KG Toptan Satış Fiyatı</span>
                <span class="font-black text-emerald-300 text-sm">${PriceCalculator.formatTL(product.costPerKg)}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 block">
                  ✓ %${product.kdv || (isUcucu ? 20 : 1)} KDV DAHİL
                </span>
                <span class="text-[9px] text-slate-500 block mt-0.5">Faturada Net: ${PriceCalculator.formatTL(product.rawNetCostPerKg || parseFloat((product.costPerKg / (1 + ((product.kdv || (isUcucu ? 20 : 1)) / 100))).toFixed(2)))}</span>
              </div>
            </div>

            ${showRedLineFloor ? `
              <div class="bg-rose-950/90 p-2.5 rounded-xl border border-rose-600/60 space-y-1 my-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-rose-300 font-extrabold text-[10px] uppercase">🔴 Trendyol Dip Fiyat:</span>
                  <span class="font-black text-rose-200 text-xs">${PriceCalculator.formatTL(breakEvenTy.breakEvenPrice)}</span>
                </div>
                <div class="text-[9px] text-rose-400 font-medium text-center">Bu Fiyatın Altı Zarardır! (0 ₺ Kâr)</div>
              </div>
            ` : ''}

            <div class="space-y-1 text-xs my-2">
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1 text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Trendyol:</span>
                <span class="font-bold text-white text-xs">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1 text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Net Kâr:</span>
                <span class="font-bold text-emerald-400 text-xs">+${PriceCalculator.formatTL(volConfig.targetProfit ?? 0)}</span>
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
  } catch (err) {
    console.error("Single product card render error:", product?.id, err);
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
  const targetProfit = config.targetProfit ?? 0;
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
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;
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

  const newCostPerKg = getModalCostPerKg();
  const kdvRate = product.kdv || (product.category === "Uçucu Yağlar" ? 20 : 1);

  product.activeVolume = activeVolume;
  product.costPerKg = newCostPerKg;
  product.listPriceKdvHaric = parseFloat((newCostPerKg / (1 + (kdvRate / 100))).toFixed(2));
  product.rawNetCostPerKg = product.listPriceKdvHaric;
  product.isUserEdited = true;

  await StorageManager.saveProduct(product);
  currentProducts = StorageManager.getProducts();
  
  renderProductGrid();
  renderStats();
  if (typeof renderLayer2Cards === "function" && currentLayerMode === "layer2") {
    renderLayer2Cards();
  }

  showToast(`✅ ${product.name} Katman 1 Fiyatı ve Ayarları Başarıyla Güncellendi!`);
  closeProductSlot();
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
  const btn3 = document.getElementById("layer-btn-3");

  const dot1 = document.getElementById("dot-1");
  const dot2 = document.getElementById("dot-2");
  const dot3 = document.getElementById("dot-3");

  const badge1 = document.getElementById("badge-1");
  const badge2 = document.getElementById("badge-2");
  const badge3 = document.getElementById("badge-3");

  const view1 = document.getElementById("layer1-main-view");
  const view2 = document.getElementById("layer2-main-view");
  const view3 = document.getElementById("layer3-main-view");
  const btnOverhead = document.getElementById("btn-factory-overhead");

  const inactiveBtnClass = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-slate-900/80 text-slate-400 border border-slate-800/80 hover:bg-slate-800/80 hover:text-white";
  const inactiveDotClass = "w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0";
  const inactiveBadgeClass = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 shrink-0";

  if (btn1) btn1.className = inactiveBtnClass;
  if (btn2) btn2.className = inactiveBtnClass;
  if (btn3) btn3.className = inactiveBtnClass;

  if (dot1) dot1.className = inactiveDotClass;
  if (dot2) dot2.className = inactiveDotClass;
  if (dot3) dot3.className = inactiveDotClass;

  if (badge1) { badge1.className = inactiveBadgeClass; badge1.innerText = "KATMANA GEÇ"; }
  if (badge2) { badge2.className = inactiveBadgeClass; badge2.innerText = "KATMANA GEÇ"; }
  if (badge3) { badge3.className = inactiveBadgeClass; badge3.innerText = "KATMANA GEÇ"; }

  if (mode === 1) {
    if (btn1) btn1.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white border border-blue-400/60 shadow-md shadow-blue-500/15";
    if (dot1) dot1.className = "w-2.5 h-2.5 rounded-full bg-blue-200 shrink-0";
    if (badge1) { badge1.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-950 text-blue-200 border border-blue-400/50 shrink-0"; badge1.innerText = "✓ SEÇİLİ KATMAN"; }

    if (view1) view1.classList.remove("hidden");
    if (view2) view2.classList.add("hidden");
    if (view3) view3.classList.add("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    renderProductGrid();
  } else if (mode === 2) {
    // 2. KATMAN: ZÜMRÜT YEŞİL TEMA
    if (btn2) btn2.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white border border-emerald-400/60 shadow-md shadow-emerald-500/15";
    if (dot2) dot2.className = "w-2.5 h-2.5 rounded-full bg-emerald-200 shrink-0";
    if (badge2) { badge2.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-200 border border-emerald-400/50 shrink-0"; badge2.innerText = "✓ SEÇİLİ KATMAN"; }

    if (view1) view1.classList.add("hidden");
    if (view2) view2.classList.remove("hidden");
    if (view3) view3.classList.add("hidden");
    if (btnOverhead) {
      btnOverhead.classList.remove("hidden");
      btnOverhead.classList.add("flex");
    }

    updateLayer2BannerStats();
    renderLayer2Cards();
  } else if (mode === 3) {
    // 3. KATMAN: ASİL MOR TEMA
    if (btn3) btn3.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white border border-purple-400/60 shadow-md shadow-purple-500/15";
    if (dot3) dot3.className = "w-2.5 h-2.5 rounded-full bg-purple-200 shrink-0";
    if (badge3) { badge3.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-950 text-purple-200 border border-purple-400/50 shrink-0"; badge3.innerText = "✓ SEÇİLİ KATMAN"; }

    if (view1) view1.classList.add("hidden");
    if (view2) view2.classList.add("hidden");
    if (view3) view3.classList.remove("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    renderLayer3Cards();
  }
}

let cardActiveVolumes = {};
let expandedCards = {};

function updateCardVolume(productId, volKey) {
  cardActiveVolumes[productId] = volKey;
  renderLayer3Cards();
}

function toggleCardAccordion(productId) {
  expandedCards[productId] = !expandedCards[productId];
  renderLayer3Cards();
}

function updateLiveSitePriceOverride(productId, volKey, newPrice) {
  StorageManager.setSiteOverride(productId, volKey, newPrice);
  renderLayer3Cards();
}

function renderLayer3Cards() {
  const container = document.getElementById("layer3-product-grid");
  if (!container) return;
  container.innerHTML = "";

  const selectedGlobalVol = document.getElementById("l3-global-vol-filter") ? document.getElementById("l3-global-vol-filter").value : "250ml";
  let totalScrapedMatchCount = 0;

  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }

  productsArr.forEach(product => {
    if (!product || !product.name) return;
    if (activeCategory !== "all" && product.category !== activeCategory) return;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (product.name || "").toLowerCase().includes(q);
      const matchSku = (product.sku || "").toLowerCase().includes(q);
      if (!matchName && !matchSku) return;
    }

    const volKey = cardActiveVolumes[product.id] || selectedGlobalVol;
    const volConfig = getVolumeConfig(product, volKey);
    const wholesaleUnitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, volKey, volConfig.packagingCost);

    // Calculate Katman 1 / Sistem 1 İyzico Web Sale Price as baseline cost comparison
    const iyzicoConfig = (volConfig && volConfig.channels && volConfig.channels.iyzico) ? volConfig.channels.iyzico : { commission: 4, discount: 0, cargo: 82.50 };
    const sys1Result = PriceCalculator.calculateSystem1Channel({
      wholesaleCost: wholesaleUnitCost,
      targetProfit: (volConfig && volConfig.targetProfit) ? volConfig.targetProfit : 0,
      commission: iyzicoConfig.commission || 4,
      discount: iyzicoConfig.discount || 0,
      cargo: iyzicoConfig.cargo || 82.50
    });

    const canFiyatBaseCost = sys1Result.salePrice; // Katman 1 / Sistem 1 İyzico Fiyatı

    // Fetch site data from LIVE_SITE_SCRAPED_DATA or StorageManager site overrides
    const overridePrice = StorageManager.getSiteOverride(product.id, volKey);
    const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
    
    let activeLivePrice = null;
    if (overridePrice !== null && !isNaN(parseFloat(overridePrice))) {
      activeLivePrice = parseFloat(overridePrice);
    } else if (siteData && siteData.samplePrices && (typeof siteData.samplePrices[volKey] === "number") && siteData.samplePrices[volKey] > 0) {
      activeLivePrice = siteData.samplePrices[volKey];
    }

    const hasVolPrice = activeLivePrice !== null && activeLivePrice > 0;
    
    let liveSitePriceHtml = `
      <div class="flex items-center gap-1">
        <input type="number" placeholder="N/A" value="${hasVolPrice ? activeLivePrice : ''}" onchange="updateLiveSitePriceOverride('${product.id}', '${volKey}', this.value)" class="w-20 bg-slate-900 border border-purple-800/80 rounded px-2 py-1 text-purple-300 font-bold text-xs focus:outline-none focus:border-purple-400 text-center">
        <span class="text-[11px] font-bold text-purple-400">₺</span>
      </div>
    `;
    let netProfitMarginHtml = `<span class="font-bold text-slate-500 text-xs">N/A</span>`;
    let marginBadge = `bg-slate-900/80 text-slate-400 border-slate-800`;
    let statusText = `⚪ Sitede Satılmıyor`;
    let siteUrl = (siteData && siteData.url) ? siteData.url : `https://www.cansizzadeyag.com/`;

    if (hasVolPrice) {
      totalScrapedMatchCount++;
      const livePrice = activeLivePrice;
      const netProfitMargin = parseFloat((livePrice - canFiyatBaseCost).toFixed(2));
      const profitRatio = livePrice > 0 ? Math.round((netProfitMargin / livePrice) * 100) : 0;

      if (netProfitMargin >= 0) {
        netProfitMarginHtml = `<span class="font-black text-emerald-400 text-xs">+${PriceCalculator.formatTL(netProfitMargin)}</span>`;
      } else {
        netProfitMarginHtml = `<span class="font-black text-red-400 text-xs">${PriceCalculator.formatTL(netProfitMargin)}</span>`;
      }

      marginBadge = `bg-emerald-950/60 text-emerald-400 border-emerald-800/40`;
      statusText = `🟢 Yüksek Kârlı`;
      if (profitRatio < 15) {
        marginBadge = `bg-red-950/60 text-red-400 border-red-800/40`;
        statusText = `🔴 Düşük Marjlı`;
      } else if (profitRatio < 30) {
        marginBadge = `bg-amber-950/60 text-amber-300 border-amber-800/40`;
        statusText = `🟡 Dengeli Fiyat`;
      }
    }

    const isUcucu = product.category === "Uçucu Yağlar";
    const catBadge = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    const isOverridden = overridePrice !== null && !isNaN(parseFloat(overridePrice));
    const isExpanded = expandedCards[product.id] || false;

    // Accordion Table HTML for All Volumes
    let accordionHtml = "";
    if (isExpanded) {
      const allVols = ["20ml", "30ml", "50ml", "100ml", "250ml", "500ml", "1000ml", "5000ml"];
      let rowsHtml = "";
      
      allVols.forEach(vKey => {
        const vConfig = getVolumeConfig(product, vKey);
        const vWholesaleCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, vKey, vConfig.packagingCost);
        const vIyzicoConfig = (vConfig && vConfig.channels && vConfig.channels.iyzico) ? vConfig.channels.iyzico : { commission: 4, discount: 0, cargo: 82.50 };
        const vSys1 = PriceCalculator.calculateSystem1Channel({
          wholesaleCost: vWholesaleCost,
          targetProfit: (vConfig && vConfig.targetProfit) ? vConfig.targetProfit : 0,
          commission: vIyzicoConfig.commission || 4,
          discount: vIyzicoConfig.discount || 0,
          cargo: vIyzicoConfig.cargo || 82.50
        });
        const vBaseCost = vSys1.salePrice;

        const vOverride = StorageManager.getSiteOverride(product.id, vKey);
        let vLivePrice = null;
        if (vOverride !== null && !isNaN(parseFloat(vOverride))) {
          vLivePrice = parseFloat(vOverride);
        } else if (siteData && siteData.samplePrices && (typeof siteData.samplePrices[vKey] === "number") && siteData.samplePrices[vKey] > 0) {
          vLivePrice = siteData.samplePrices[vKey];
        }

        const vHasPrice = vLivePrice !== null && vLivePrice > 0;
        let vNetMarginHtml = `<span class="text-slate-500 font-bold">N/A</span>`;
        let vBadge = `bg-slate-900 text-slate-400 border-slate-800`;
        let vStatus = `⚪ Sitede Yok`;

        if (vHasPrice) {
          const vMargin = parseFloat((vLivePrice - vBaseCost).toFixed(2));
          const vRatio = Math.round((vMargin / vLivePrice) * 100);
          if (vMargin >= 0) {
            vNetMarginHtml = `<span class="text-emerald-400 font-black">+${PriceCalculator.formatTL(vMargin)}</span>`;
          } else {
            vNetMarginHtml = `<span class="text-red-400 font-black">${PriceCalculator.formatTL(vMargin)}</span>`;
          }
          vBadge = `bg-emerald-950/60 text-emerald-400 border-emerald-800/40`;
          vStatus = `🟢 Yüksek Kârlı`;
          if (vRatio < 15) {
            vBadge = `bg-red-950/60 text-red-400 border-red-800/40`;
            vStatus = `🔴 Düşük Marjlı`;
          } else if (vRatio < 30) {
            vBadge = `bg-amber-950/60 text-amber-300 border-amber-800/40`;
            vStatus = `🟡 Dengeli Fiyat`;
          }
        }

        rowsHtml += `
          <tr class="hover:bg-slate-900/60 transition-colors ${vKey === volKey ? 'bg-purple-950/30 font-bold' : ''}">
            <td class="p-2 font-bold text-purple-300 border-b border-slate-800/50">${vKey} ${vKey === volKey ? '📌 (Seçili)' : ''}</td>
            <td class="p-2 border-b border-slate-800/50">
              <div class="flex items-center gap-1">
                <input type="number" placeholder="N/A" value="${vHasPrice ? vLivePrice : ''}" onchange="updateLiveSitePriceOverride('${product.id}', '${vKey}', this.value)" class="w-20 bg-slate-950 border border-purple-800/70 rounded px-1.5 py-0.5 text-purple-300 font-bold text-xs focus:outline-none focus:border-purple-400 text-center">
                <span class="text-[10px] text-purple-400">₺</span>
              </div>
            </td>
            <td class="p-2 text-blue-300 font-bold border-b border-slate-800/50">${PriceCalculator.formatTL(vBaseCost)}</td>
            <td class="p-2 border-b border-slate-800/50">${vNetMarginHtml}</td>
            <td class="p-2 border-b border-slate-800/50">
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${vBadge}">${vStatus}</span>
            </td>
          </tr>
        `;
      });

      accordionHtml = `
        <div class="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/90 rounded-xl p-3 animate-fadeIn">
          <div class="text-xs font-bold text-purple-300 mb-2 flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center gap-1.5">📊 <span class="text-white">${product.name}</span> - Tüm Ambalaj Boyutları Karşılaştırması</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800/80 flex items-center gap-1">🏷️ Toptan 1 KG Liste Fiyatımız: <span class="font-black text-amber-200">${PriceCalculator.formatTL(product.costPerKg)}</span></span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-slate-900/90">
                  <th class="p-2">Ambalaj</th>
                  <th class="p-2">XML Canlı Fiyat (Düzenlenebilir)</th>
                  <th class="p-2">Katman 1 (İyzico Tabanı)</th>
                  <th class="p-2">Net Fark</th>
                  <th class="p-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    const rowHtml = `
      <div class="glass-card rounded-xl p-3.5 border border-slate-800/80 bg-slate-900/50 hover:border-purple-500/50 transition-all flex flex-col gap-3 ${!hasVolPrice ? 'opacity-85' : ''}">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <!-- Ürün Tanımlama & Özel Ambalaj Seçici -->
          <div class="flex items-center gap-3 w-full md:w-1/3 min-w-[280px]">
            <span class="font-mono text-[10px] font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 shrink-0">
              ${product.sku || 'SKU'}
            </span>
            <div class="truncate">
              <h3 class="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                ${product.name}
              </h3>
              <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border ${catBadge}">
                  ${product.category || 'Bitkisel Yağ'}
                </span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 flex items-center gap-1 shadow-sm" title="1 KG Toptan Liste Fiyatımız">
                  🏷️ Toptan 1 KG: <span class="font-black text-amber-200">${PriceCalculator.formatTL(product.costPerKg)}</span>
                </span>
                <select onchange="updateCardVolume('${product.id}', this.value)" class="bg-slate-900 border border-purple-800/80 text-purple-300 text-[10px] font-bold rounded px-1.5 py-0.5 focus:outline-none focus:border-purple-400">
                  <option value="250ml" ${volKey === '250ml' ? 'selected' : ''}>250 ml</option>
                  <option value="500ml" ${volKey === '500ml' ? 'selected' : ''}>500 ml</option>
                  <option value="1000ml" ${volKey === '1000ml' ? 'selected' : ''}>1000 ml / 1 KG</option>
                  <option value="5000ml" ${volKey === '5000ml' ? 'selected' : ''}>5000 ml / 5 KG</option>
                  <option value="100ml" ${volKey === '100ml' ? 'selected' : ''}>100 ml</option>
                  <option value="50ml" ${volKey === '50ml' ? 'selected' : ''}>50 ml</option>
                  <option value="30ml" ${volKey === '30ml' ? 'selected' : ''}>30 ml</option>
                  <option value="20ml" ${volKey === '20ml' ? 'selected' : ''}>20 ml</option>
                </select>
                ${isOverridden ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">✍️ Düzenlendi</span>' : ''}
              </div>
            </div>
          </div>

          <!-- Metrikler Tablosu (XML Fiyatı, İyzico Tabanı, Net Fark, Durum) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-2/3 items-center">
            <div class="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/90 flex flex-col">
              <span class="text-[9px] font-bold uppercase text-purple-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full ${hasVolPrice ? 'bg-purple-400' : 'bg-slate-600'}"></span> 🌐 XML Canlı Fiyat
              </span>
              <div class="mt-1">
                ${liveSitePriceHtml}
              </div>
            </div>

            <div class="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/90 flex flex-col">
              <span class="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 🛡️ İyzico Tabanı
              </span>
              <span class="font-bold text-blue-300 text-xs mt-1 py-0.5">${PriceCalculator.formatTL(canFiyatBaseCost)}</span>
            </div>

            <div class="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/90 flex flex-col">
              <span class="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full ${hasVolPrice ? 'bg-emerald-400' : 'bg-slate-600'}"></span> 💰 Net Fark
              </span>
              <span class="mt-1 py-0.5">${netProfitMarginHtml}</span>
            </div>

            <div class="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/90 flex flex-col justify-between">
              <span class="text-[9px] font-bold uppercase text-slate-400">Durum</span>
              <span class="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border w-fit mt-1 ${marginBadge}">
                ${statusText}
              </span>
            </div>
          </div>

          <!-- Butonlar: Tüm Boyutlar Accordion & Sitede İncele -->
          <div class="shrink-0 flex items-center gap-2 w-full sm:w-auto">
            <button onclick="toggleCardAccordion('${product.id}')" class="w-full sm:w-auto bg-slate-800 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all">
              <span>🔍 Tüm Boyutlar</span>
              <span class="text-[10px]">${isExpanded ? '▲' : '▼'}</span>
            </button>

            <a href="${siteUrl}" target="_blank" class="w-full sm:w-auto ${hasVolPrice ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'} font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              ${hasVolPrice ? 'SİTEDE İNCELE' : 'SİTE LİNKİ'}
            </a>
          </div>
        </div>

        <!-- Accordion Expand Container -->
        ${accordionHtml}
      </div>
    `;
    container.insertAdjacentHTML("beforeend", rowHtml);
  });

  const scrapedStat = document.getElementById("l3-stat-total-scraped");
  if (scrapedStat) scrapedStat.innerText = `${totalScrapedMatchCount} Sitede Aktif Ürün`;
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
  if (document.getElementById("overhead-electricity")) document.getElementById("overhead-electricity").value = overhead.electricity ?? 20000;
  if (document.getElementById("overhead-catering")) document.getElementById("overhead-catering").value = overhead.catering ?? 60000;
  if (document.getElementById("overhead-rent-sarf")) document.getElementById("overhead-rent-sarf").value = overhead.rentSarf ?? 0;
  if (document.getElementById("overhead-capacity")) document.getElementById("overhead-capacity").value = overhead.monthlyCapacityKg ?? 8714;

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
  const electricity = document.getElementById("overhead-electricity") ? (parseFloat(document.getElementById("overhead-electricity").value) || 0) : 20000;
  const catering = document.getElementById("overhead-catering") ? (parseFloat(document.getElementById("overhead-catering").value) || 0) : 60000;
  const rentSarf = document.getElementById("overhead-rent-sarf") ? (parseFloat(document.getElementById("overhead-rent-sarf").value) || 0) : 0;
  const capacityInput = document.getElementById("overhead-capacity");
  const capacityKg = capacityInput ? (parseFloat(capacityInput.value) || 8714) : 8714;

  const res = PriceCalculator.calculateFactoryOverheadPerKg({
    salaries, sgk, electricity, catering, rentSarf, monthlyCapacityKg: capacityKg
  });

  const modalMonthly = document.getElementById("modal-overhead-total-monthly");
  if (modalMonthly) modalMonthly.innerText = PriceCalculator.formatTL(res.totalMonthlyOverhead);

  const modalTotal = document.getElementById("modal-overhead-total");
  if (modalTotal) modalTotal.innerText = `${PriceCalculator.formatTL(res.overheadPerKg)} / KG`;
}

function saveFactoryOverheadModal() {
  const salaries = document.getElementById("overhead-salaries") ? (parseFloat(document.getElementById("overhead-salaries").value) || 0) : 200000;
  const sgk = document.getElementById("overhead-sgk") ? (parseFloat(document.getElementById("overhead-sgk").value) || 0) : 50000;
  const electricity = document.getElementById("overhead-electricity") ? (parseFloat(document.getElementById("overhead-electricity").value) || 0) : 20000;
  const catering = document.getElementById("overhead-catering") ? (parseFloat(document.getElementById("overhead-catering").value) || 0) : 60000;
  const rentSarf = document.getElementById("overhead-rent-sarf") ? (parseFloat(document.getElementById("overhead-rent-sarf").value) || 0) : 0;
  const capacityInput = document.getElementById("overhead-capacity");
  const capacityKg = capacityInput ? (parseFloat(capacityInput.value) || 8714) : 8714;

  const overheadConfig = {
    salaries,
    sgk,
    electricity,
    catering,
    rentSarf,
    monthlyCapacityKg: capacityKg
  };

  StorageManager.saveFactoryOverhead(overheadConfig);
  closeFactoryOverheadModal();

  updateLayer2BannerStats();
  renderLayer2Cards();

  showToast("Aylık Giderlerden 1KG Tesis Payı Otomatik Hesaplandı! 🏭✅");
}

function openWholesaleTiersModal() {
  const tiers = StorageManager.getWholesaleTiers();
  if (document.getElementById("tier-discount-1")) document.getElementById("tier-discount-1").value = tiers.tier1?.discount ?? 5;
  if (document.getElementById("tier-discount-2")) document.getElementById("tier-discount-2").value = tiers.tier2?.discount ?? 10;
  if (document.getElementById("tier-discount-3")) document.getElementById("tier-discount-3").value = tiers.tier3?.discount ?? 15;
  if (document.getElementById("tier-discount-4")) document.getElementById("tier-discount-4").value = tiers.tier4?.discount ?? 20;
}

function saveWholesaleTiersModal() {
  const t1 = parseFloat(document.getElementById("tier-discount-1")?.value) || 0;
  const t2 = parseFloat(document.getElementById("tier-discount-2")?.value) || 0;
  const t3 = parseFloat(document.getElementById("tier-discount-3")?.value) || 0;
  const t4 = parseFloat(document.getElementById("tier-discount-4")?.value) || 0;

  const tiers = {
    tier1: { minKg: 10, maxKg: 30, discount: t1, label: "10-30 KG" },
    tier2: { minKg: 30, maxKg: 100, discount: t2, label: "30-100 KG" },
    tier3: { minKg: 100, maxKg: 250, discount: t3, label: "100-250 KG" },
    tier4: { minKg: 250, maxKg: 99999, discount: t4, label: "250 KG+" }
  };

  StorageManager.saveWholesaleTiers(tiers);
}

function openOperatorSettingsModal() {
  openFactoryOverheadModal();
  openWholesaleTiersModal();

  const modal = document.getElementById("operator-settings-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeOperatorSettingsModal() {
  const modal = document.getElementById("operator-settings-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function switchOperatorTab(tab) {
  const tabOverhead = document.getElementById("operator-tab-overhead");
  const tabTiers = document.getElementById("operator-tab-tiers");
  const btnOverhead = document.getElementById("tab-btn-operator-overhead");
  const btnTiers = document.getElementById("tab-btn-operator-tiers");

  if (tab === "overhead") {
    if (tabOverhead) tabOverhead.classList.remove("hidden");
    if (tabTiers) tabTiers.classList.add("hidden");
    if (btnOverhead) btnOverhead.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-teal-700 to-emerald-600 text-white shadow-md";
    if (btnTiers) btnTiers.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white";
  } else {
    if (tabOverhead) tabOverhead.classList.add("hidden");
    if (tabTiers) tabTiers.classList.remove("hidden");
    if (btnOverhead) btnOverhead.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white";
    if (btnTiers) btnTiers.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md";
  }
}

function saveOperatorSettingsModal() {
  saveFactoryOverheadModal();
  saveWholesaleTiersModal();
  closeOperatorSettingsModal();
  showToast("Operatör ayarları ve toptan iskontolar başarıyla kaydedildi! ⚙️✅", "success");
}

let openLayer2Breakdowns = {};
let openLayer2Drawers = {};

function toggleLayer2Breakdown(productId) {
  openLayer2Breakdowns[productId] = !openLayer2Breakdowns[productId];
  renderLayer2Cards();
}

let layer2GroupMode = "retail"; // "retail" or "wholesale_drums"

function setLayer2GroupMode(mode) {
  layer2GroupMode = mode;
  const btnRetail = document.getElementById("btn-layer2-group-retail");
  const btnDrums = document.getElementById("btn-layer2-group-drums");

  if (mode === "retail") {
    if (btnRetail) btnRetail.className = "px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5";
    if (btnDrums) btnDrums.className = "px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all text-slate-400 hover:text-white flex items-center gap-1.5";
  } else {
    if (btnRetail) btnRetail.className = "px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all text-slate-400 hover:text-white flex items-center gap-1.5";
    if (btnDrums) btnDrums.className = "px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5";
  }

  renderLayer2Cards();
}

function getLayer2VolumeOptionsHtml(vol) {
  const tiers = StorageManager.getWholesaleTiers();
  if (layer2GroupMode === "wholesale_drums") {
    return `
      <option value="10KG" ${vol === "10KG" ? "selected" : ""}>10 KG Bidon (10 ₺ | %${tiers.tier1?.discount ?? 5} İsk.)</option>
      <option value="30KG" ${vol === "30KG" ? "selected" : ""}>30 KG Bidon (30 ₺ | %${tiers.tier1?.discount ?? 5} İsk.)</option>
      <option value="100KG" ${vol === "100KG" ? "selected" : ""}>100 KG Tonaj (35 ₺ | %${tiers.tier2?.discount ?? 10} İsk.)</option>
      <option value="250KG" ${vol === "250KG" ? "selected" : ""}>250 KG+ Sanayi Tonajı (%${tiers.tier4?.discount ?? 20} İsk.)</option>
    `;
  }
  return `
    <option value="1000ml" ${vol === "1000ml" ? "selected" : ""}>1000 ml (1 KG)</option>
    <option value="500ml" ${vol === "500ml" ? "selected" : ""}>500 ml</option>
    <option value="250ml" ${vol === "250ml" ? "selected" : ""}>250 ml</option>
    <option value="100ml" ${vol === "100ml" ? "selected" : ""}>100 ml</option>
    <option value="50ml" ${vol === "50ml" ? "selected" : ""}>50 ml</option>
    <option value="30ml" ${vol === "30ml" ? "selected" : ""}>30 ml</option>
    <option value="20ml" ${vol === "20ml" ? "selected" : ""}>20 ml</option>
    <option value="5000ml" ${vol === "5000ml" ? "selected" : ""}>5000 ml (5 KG)</option>
  `;
}

function renderLayer2Cards() {
  try {
    const containerGrid = document.getElementById("layer2-product-grid");
    const containerRows = document.getElementById("layer2-product-rows");
    if (!containerGrid || !containerRows) return;

    containerGrid.innerHTML = "";
    containerRows.innerHTML = "";

    const activeView = (typeof viewMode !== "undefined" && viewMode) ? viewMode : "rows";

    if (activeView === "rows") {
      containerRows.classList.remove("hidden");
      containerGrid.classList.add("hidden");
    } else {
      containerGrid.classList.remove("hidden");
      containerRows.classList.add("hidden");
    }

    let productsMap = (typeof currentProducts !== "undefined" && currentProducts && Object.keys(currentProducts).length > 0)
      ? currentProducts
      : StorageManager.getProducts();

    if (!productsMap || typeof productsMap !== "object" || Object.keys(productsMap).length === 0) {
      productsMap = StorageManager.resetToDefault() || {};
    }

    const currentCat = (typeof activeCategory !== "undefined" && activeCategory) ? activeCategory : "all";
    const currentSearch = (typeof searchQuery !== "undefined" && searchQuery) ? searchQuery.toLowerCase() : "";

    const productsList = Object.values(productsMap).filter(p => {
      if (!p || typeof p.name !== "string" || typeof p.sku !== "string") return false;
      const matchesCat = (currentCat === "all" || currentCat === "ALL") || (p.category === currentCat);
      const pName = (p.name || "").toLowerCase();
      const pSku = (p.sku || "").toLowerCase();
      const matchesSearch = !currentSearch || pName.includes(currentSearch) || pSku.includes(currentSearch);
      return matchesCat && matchesSearch;
    });

    if (productsList.length === 0) {
      const emptyHtml = `<div class="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-900/50 rounded-2xl border border-slate-800">Aramanıza veya seçtiğiniz kategoriye uygun ürün bulunamadı.</div>`;
      containerRows.innerHTML = emptyHtml;
      containerGrid.innerHTML = emptyHtml;
      return;
    }

    const overhead = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overhead);

    productsList.forEach(product => {
      try {
        let kg = 1;
        let vol = product.layer2Volume;

        if (layer2GroupMode === "wholesale_drums") {
          const customKg = (product.layer2WholesaleKg !== undefined && product.layer2WholesaleKg !== null) ? parseFloat(product.layer2WholesaleKg) : 30;
          kg = customKg > 0 ? customKg : 30;
          vol = `${kg}KG`;
        } else {
          const validVolumes = ["20ml", "30ml", "50ml", "100ml", "250ml", "500ml", "1000ml", "5000ml"];
          if (!vol || !validVolumes.includes(vol)) {
            vol = "1000ml";
          }
          const ml = PriceCalculator.getVolumeMl(vol);
          kg = ml / 1000;
        }

        const targetProfitInput = (product.layer2Profit !== undefined && product.layer2Profit !== null) ? product.layer2Profit : 70;
        const isBreakdownOpen = !!openLayer2Breakdowns[product.id];
        const isDrawerOpen = !!openLayer2Drawers[product.id];

        const isMaceration = isMacerationOil(product);

        const isEssentialOil = product.category === "Uçucu Yağlar";
        let supplyType = product.supplyType;
        if (isEssentialOil && (!supplyType || supplyType === "press")) {
          supplyType = "wholesale";
          product.supplyType = "wholesale";
        }
        if (!supplyType) {
          supplyType = isEssentialOil ? "wholesale" : "press";
        }

        const dipStatus = product.dipStatus || "none";
        const dipPercent = (product.dipPercent !== undefined && product.dipPercent !== null) ? product.dipPercent : 0;

        const yieldPct = (product.yieldPercent !== undefined && product.yieldPercent !== null) ? product.yieldPercent : 25;
        const seedCost = (product.seedCostPerKg !== undefined && product.seedCostPerKg !== null)
          ? product.seedCostPerKg
          : parseFloat(((product.costPerKg || 1212.00) * 0.25).toFixed(2));

        const herbCost = (product.herbCostPerKg !== undefined && product.herbCostPerKg !== null) ? product.herbCostPerKg : 0;
        const oliveOilCost = (product.oliveOilCostPerKg !== undefined && product.oliveOilCostPerKg !== null) ? product.oliveOilCostPerKg : 454.50;
        const kdvRate = product.kdv || (product.category === "Uçucu Yağlar" ? 20 : 1);
        const initialCost = product.initialCostPerKg || product.costPerKg || 1200;
        const initialSeedCost = product.initialSeedCostPerKg || parseFloat((initialCost * 0.25).toFixed(2));
        const initialYield = 25;
        const initialHerbCost = 0;
        const initialOliveOilCost = 454.50;

        const currentWholesale = (product.wholesaleCostPerKg !== undefined && product.wholesaleCostPerKg !== null && product.wholesaleCostPerKg > 0)
          ? parseFloat(product.wholesaleCostPerKg)
          : parseFloat(initialCost);

        const currentSeed = (product.seedCostPerKg !== undefined && product.seedCostPerKg !== null && product.seedCostPerKg > 0)
          ? parseFloat(product.seedCostPerKg)
          : parseFloat(initialSeedCost);

        const isSeedModified = !isMaceration && supplyType !== "wholesale" && Math.abs(currentSeed - initialSeedCost) > 0.05;
        const isYieldModified = !isMaceration && supplyType !== "wholesale" && Math.abs(yieldPct - initialYield) > 0.01;
        const isDipModified = !isMaceration && supplyType !== "wholesale" && (dipStatus === "has_dip" || dipStatus === "dip") && dipPercent > 0;
        const isWholesaleModified = supplyType === "wholesale" && product.wholesaleCostPerKg !== undefined && product.wholesaleCostPerKg !== null && Math.abs(currentWholesale - initialCost) > 0.05;
        const isHerbCostModified = isMaceration && supplyType !== "wholesale" && Math.abs(herbCost - initialHerbCost) > 0.05;
        const isOliveOilModified = isMaceration && supplyType !== "wholesale" && Math.abs(oliveOilCost - initialOliveOilCost) > 0.05;

        const isAnyModified = isSeedModified || isYieldModified || isDipModified || isWholesaleModified || isHerbCostModified || isOliveOilModified;

        const coldPressRes = !isMaceration ? PriceCalculator.calculateColdPressCost({
          seedCostPerKg: seedCost,
          yieldPercent: yieldPct,
          wholesaleCostPerKg: product.wholesaleCostPerKg,
          supplyType: supplyType,
          dipStatus: dipStatus,
          dipPercent: dipPercent,
          fallbackCostPerKg: product.costPerKg || 1200
        }) : null;

        const macerationRes = isMaceration ? PriceCalculator.calculateMacerationCost({
          herbCostPerKg: herbCost,
          oliveOilCostPerKg: oliveOilCost,
          herbRatioKg: product.herbRatioKg || 0.2,
          herbKg: product.herbKg,
          oilKg: product.oilKg,
          supplyType: supplyType,
          wholesaleCostPerKg: product.wholesaleCostPerKg,
          fallbackCostPerKg: product.costPerKg || 600
        }) : null;

        const costPerKg = isMaceration ? macerationRes.netCostPerKg : coldPressRes.netCostPerKg;

        const rawOilCost = parseFloat((costPerKg * kg).toFixed(2));
        const packCost = (layer2GroupMode === "wholesale_drums")
          ? parseFloat((kg * 0.50).toFixed(2))
          : ((typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[vol]) ? DEFAULT_PACKAGING_COSTS[vol] : 14.50);

        const isWholesaleSupply = (supplyType === "wholesale");
        const linearOverhead = isWholesaleSupply
          ? 0.00
          : parseFloat((overheadRes.overheadPerKg * kg).toFixed(2));

        const totalOverhead = isWholesaleSupply
          ? PriceCalculator.getOverheadForVolume(vol, 0)
          : PriceCalculator.getOverheadForVolume(vol, overheadRes.overheadPerKg);

        const laborAssemblyFee = parseFloat(Math.max(0, totalOverhead - linearOverhead).toFixed(2));
        const netCost = parseFloat((rawOilCost + packCost + totalOverhead).toFixed(2));

        const tierInfo = PriceCalculator.getWholesaleDiscountForKg(kg, StorageManager.getWholesaleTiers());
        const discountPct = tierInfo.discount || 0;
        const unDiscountedUnitCost = netCost / (kg > 0 ? kg : 1);
        const discountedUnitCost = unDiscountedUnitCost * (1 - (discountPct / 100));
        const finalWholesale1KgQuotePrice = parseFloat(discountedUnitCost.toFixed(2));
        const totalOrderPrice = parseFloat((finalWholesale1KgQuotePrice * kg).toFixed(2));

        const tySim = PriceCalculator.calculateSystem1Channel({ wholesaleCost: netCost, targetProfit: targetProfitInput, commission: 19, discount: 0, cargo: 110 });
        const hbSim = PriceCalculator.calculateSystem1Channel({ wholesaleCost: netCost, targetProfit: targetProfitInput, commission: 17, discount: 0, cargo: 110 });
        const iySim = PriceCalculator.calculateSystem1Channel({ wholesaleCost: netCost, targetProfit: targetProfitInput, commission: 4, discount: 0, cargo: 82.50 });

        const storePrice = netCost + targetProfitInput;

        const badgeClass = product.category === "Uçucu Yağlar"
          ? "bg-purple-950/80 text-purple-300 border-purple-800/60"
          : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";

        if (activeView === "rows") {
          const rowHtml = `
            <div class="glass-card rounded-2xl p-4 border border-slate-800/90 hover:border-emerald-500/40 flex flex-col justify-between gap-3.5 bg-slate-950/90 shadow-xl transition-all">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <!-- Ürün SKU ve Adı -->
                <div class="flex items-center gap-2.5 min-w-[240px]">
                  <span class="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                    ${product.sku}
                  </span>
                  <div class="truncate">
                    <div class="flex items-center gap-1.5">
                      <h3 class="text-sm font-extrabold text-white truncate tracking-tight">
                        ${product.name}
                      </h3>
                      ${isAnyModified ? `
                        <button onclick="resetProductField('${product.id}', 'all')" title="Tüm Girdileri Orijinal Başlangıç Fiyatlarına Dön" class="text-[10px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-800/80 transition-all flex items-center gap-1 shrink-0 shadow-sm">
                          ↺ Varsayılana Dön
                        </button>
                      ` : ''}
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">
                      ${product.category}
                    </span>
                  </div>
                </div>

                <!-- ENDÜSTRİYEL TEDARİK TÜRÜ & HAMMADDE/MASERASYON/DİP KONTROL PANELİ (ROW VIEW - FERAH YAPI) -->
                <div class="flex flex-wrap items-center gap-3 bg-slate-900/90 px-3.5 py-2 rounded-2xl border ${isMaceration ? 'border-purple-500/40' : supplyType === 'wholesale' ? 'border-blue-500/40' : 'border-amber-500/30'} shadow-inner">
                  <!-- Sıkım / Maserasyon / Toptan Seçici -->
                  <div class="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                    <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${supplyType !== 'wholesale' ? (isMaceration ? 'bg-purple-600 text-white shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm') : 'text-slate-400 hover:text-white'}">
                      ${isMaceration ? '🌿 Maserasyon' : '🌾 Sıkım'}
                    </button>
                    <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${supplyType === 'wholesale' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                      📦 Toptan
                    </button>
                  </div>

                  ${isMaceration ? `
                    ${supplyType === 'wholesale' ? `
                      <div class="flex items-center gap-2 px-2">
                        <span class="text-xs font-bold text-blue-400">📦 Toptan Fiyat (%${kdvRate} KDV Dahil):</span>
                        <input type="number" value="${costPerKg}" step="10" title="Orijinal Varsayılan: ${PriceCalculator.formatTL(initialCost)}" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-950 border border-blue-500/60 text-blue-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">₺/KG</span>
                      </div>
                    ` : `
                      <!-- MASERASYON GİRDİLERİ -->
                      <div class="flex items-center gap-3 px-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-extrabold text-emerald-400">🫒 Z.Yağı:</span>
                          <input type="number" value="${oliveOilCost}" step="10" ondblclick="resetProductField('${product.id}', 'oliveOilCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'oliveOilCostPerKg', this.value)" class="w-16 bg-slate-950 border border-emerald-500/60 text-emerald-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-emerald-400">₺</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-extrabold text-purple-300">🌱 Ot:</span>
                          <input type="number" value="${herbCost}" step="10" ondblclick="resetProductField('${product.id}', 'herbCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'herbCostPerKg', this.value)" class="w-16 bg-slate-950 border border-purple-500/60 text-purple-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-purple-300">₺</span>
                        </div>
                        <div class="bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/60 text-center">
                          <span class="text-xs font-black text-amber-300">${macerationRes.calculatedRatio} KG Ot / 1 KG Yağ</span>
                        </div>
                      </div>
                    `}
                  ` : `
                    ${supplyType === 'wholesale' ? `
                      <div class="flex items-center gap-2 px-2">
                        <span class="text-xs font-bold text-blue-400">📦 Toptan Fiyat (%${kdvRate} KDV Dahil):</span>
                        <input type="number" value="${costPerKg}" step="10" title="Orijinal Varsayılan: ${PriceCalculator.formatTL(initialCost)}" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-950 border border-blue-500/60 text-blue-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">₺/KG</span>
                      </div>
                    ` : `
                      <!-- SIKIM GİRDİLERİ -->
                      <div class="flex items-center gap-3 px-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-amber-400">🌾 Tohum Alış:</span>
                          <input type="number" value="${seedCost}" step="5" ondblclick="resetProductField('${product.id}', 'seedCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-16 bg-slate-950 border border-amber-500/60 text-amber-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-amber-400">₺</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-cyan-400">💧 Verim:</span>
                          <input type="number" value="${yieldPct}" step="1" min="1" max="100" ondblclick="resetProductField('${product.id}', 'yieldPercent')" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-14 bg-slate-950 border border-cyan-500/60 text-cyan-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-cyan-400">%</span>
                        </div>
                      </div>
                    `}

                    <!-- DİP/TORTU FIRE MODÜLÜ -->
                    <div class="flex items-center gap-1.5 px-1">
                      <select onchange="updateLayer2ProductField('${product.id}', 'dipStatus', this.value)" class="bg-slate-950 border border-rose-500/40 text-rose-300 font-bold text-xs px-2 py-1 rounded-xl focus:outline-none">
                        <option value="none" ${dipStatus !== 'has_dip' ? 'selected' : ''}>Dip Yok (%0)</option>
                        <option value="has_dip" ${dipStatus === 'has_dip' ? 'selected' : ''}>🔴 Dip Var</option>
                      </select>
                      ${dipStatus === 'has_dip' ? `
                        <input type="number" value="${dipPercent}" step="1" min="0" max="90" placeholder="Dip %" onchange="updateLayer2ProductField('${product.id}', 'dipPercent', this.value)" class="w-14 bg-slate-950 border border-rose-500 text-rose-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                        <span class="text-xs font-bold text-rose-400">% Fire</span>
                      ` : ''}
                    </div>
                  `}

                  <div class="text-right shrink-0 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 min-w-[130px] ml-auto">
                    <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider whitespace-nowrap">1KG Saf Yağ Maliyeti</span>
                    <span class="text-xs font-black ${isMaceration ? 'text-purple-300' : supplyType === 'wholesale' ? 'text-blue-300' : 'text-amber-300'} whitespace-nowrap">${PriceCalculator.formatTL(costPerKg)}</span>
                  </div>
                </div>

                <!-- Ambalaj Seçici veya Toptan Elle KG Yazma Girişi -->
                ${layer2GroupMode === "wholesale_drums" ? `
                  <div class="flex items-center gap-1.5 bg-slate-950 border border-purple-500/60 px-3 py-1.5 rounded-2xl shadow-inner shrink-0">
                    <span class="text-xs font-black text-purple-300 flex items-center gap-1">📦 Sipariş Miktarı:</span>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${kg}" min="1" step="1" placeholder="KG" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-20 bg-slate-900 border border-purple-400/80 text-purple-200 font-black text-xs px-2 py-1 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <span class="text-xs font-black text-purple-300">KG</span>
                    </div>
                  </div>
                ` : `
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-xs text-slate-300 font-bold">Ambalaj:</span>
                    <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-sky-500/50 text-sky-300 font-bold text-xs px-3 py-1.5 rounded-xl focus:outline-none">
                      ${getLayer2VolumeOptionsHtml(vol)}
                    </select>
                  </div>
                `}

                <!-- Vurgulu Toptan 1 KG Birim Fiyatı & Paket Toplamı Rozeti -->
                <div class="flex items-center gap-2.5">
                  <div class="bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 px-4 py-2 rounded-2xl border border-emerald-500/60 shadow-md text-right">
                    <span class="text-[9px] uppercase font-black text-emerald-400 block tracking-wider">MÜŞTERİYE 1 KG TOPTAN TEKLİF FİYATI:</span>
                    <span class="text-base font-black text-emerald-300">${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} / KG</span>
                    <span class="text-[9px] text-purple-300 font-bold block">${tierInfo.label} (%${discountPct} İskonto | ${kg} KG Toplamı: ${PriceCalculator.formatTL(totalOrderPrice)})</span>
                  </div>
                  <button onclick="toggleLayer2Breakdown('${product.id}')" class="text-xs text-slate-200 hover:text-white font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
                    📋 ${isBreakdownOpen ? "Faturayı Kapat" : "Fatura Dökümü"}
                  </button>
                  <button onclick="toggleLayer2Drawer('${product.id}')" class="text-xs text-purple-300 hover:text-white font-bold bg-purple-950 hover:bg-purple-900 border border-purple-800/80 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
                    ⚡ ${isDrawerOpen ? "Sistem 1'i Gizle" : "Sistem 1 Simülatörü"}
                  </button>
                </div>
              </div>

              <!-- ANLAMSAL RENKLENDİRİLMİŞ RESMİ FATURA DÖKÜM TABLOSU -->
              ${isBreakdownOpen ? `
                <div class="bg-slate-950/95 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 animate-slide-up max-w-4xl">
                  <div class="flex justify-between items-center pb-2 border-b border-slate-800 font-extrabold text-xs text-teal-400 tracking-wider">
                    <span>📋 UYGULANAN FABRİKA SAF MALİYET HESABI (${supplyType === 'wholesale' ? 'TOPTAN HAZIR ALIŞ' : 'PRES SIKIMI'}) — <span class="text-slate-400 font-normal">Tıkla Detay Gör ℹ️</span></span>
                    <span>TUTAR (TL)</span>
                  </div>

                  <!-- ITEM 1 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item1')" class="cursor-pointer hover:bg-slate-900/80 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-800">
                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-bold text-slate-200 flex items-center gap-1.5">
                        ${supplyType === 'wholesale' ? `1. 📦 Toptan Hazır Yağ Payı (${vol} @ ${PriceCalculator.formatTL(costPerKg)}/KG Toptan Alış)` : isMaceration ? `1. 🌿 Maserasyon Yağ Payı (${vol} @ ${PriceCalculator.formatTL(costPerKg)}/KG)` : `1. 🧴 Sıkım Yağ Payı (${vol} @ ${PriceCalculator.formatTL(seedCost)}/KG Tohum x %${yieldPct} Verim)`}
                        <span class="text-[10px] text-sky-400 font-normal bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/60">ℹ️ Açıkla</span>
                      </span>
                      <span class="grow border-b border-dotted border-slate-800 mx-2"></span>
                      <span class="font-bold text-cyan-300 shrink-0 text-xs">${PriceCalculator.formatTL(rawOilCost)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item1 ? `
                      <div class="mt-2 p-3 bg-slate-900/90 rounded-xl border border-sky-500/40 text-[11px] text-sky-200 space-y-1.5 animate-slide-up">
                        <div class="font-extrabold text-sky-400 border-b border-slate-800 pb-1">💡 1. KALEM NASIL HESAPLANDI?</div>
                        ${supplyType === 'wholesale' ? `
                          <p>• <strong>Toptan Alış Fiyatı:</strong> ${PriceCalculator.formatTL(costPerKg)} / KG (%${kdvRate} KDV Dahil)</p>
                          <p>• <strong>Sipariş Hacmi:</strong> ${vol} (${kg} KG)</p>
                          <p>• <strong>Hesap:</strong> ${PriceCalculator.formatTL(costPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)} ₺</strong></p>
                          <p class="text-slate-400 text-[10px]">Tedarikçiden hazır dökme alındığı için pres fire kaybı yoktur.</p>
                        ` : isMaceration ? `
                          <p>• <strong>Zeytinyağı Maliyeti:</strong> ${PriceCalculator.formatTL(oliveOilCost)} / KG</p>
                          <p>• <strong>Bitki/Ot Maliyeti:</strong> ${PriceCalculator.formatTL(herbCost)} / KG (Oran: ${macerationRes.calculatedRatio} KG Ot / 1 KG Yağ = ${PriceCalculator.formatTL(macerationRes.herbCostComponent)} ₺)</p>
                          <p>• <strong>1 KG Yağ Maliyeti:</strong> ${PriceCalculator.formatTL(oliveOilCost)} + ${PriceCalculator.formatTL(macerationRes.herbCostComponent)} = ${PriceCalculator.formatTL(costPerKg)} / KG</p>
                          <p>• <strong>Hesap:</strong> ${PriceCalculator.formatTL(costPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)} ₺</strong></p>
                        ` : `
                          <p>• <strong>Tohum Fiyatı:</strong> ${PriceCalculator.formatTL(seedCost)} / KG</p>
                          <p>• <strong>Pres Verimi:</strong> %${yieldPct} (100 KG tohumdan ${yieldPct} KG saf yağ çıkar)</p>
                          <p>• <strong>1 KG Yağ Maliyeti:</strong> ${PriceCalculator.formatTL(seedCost)} ÷ %${yieldPct} = ${PriceCalculator.formatTL(costPerKg)} / KG</p>
                          <p>• <strong>Hesap:</strong> ${PriceCalculator.formatTL(costPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)} ₺</strong></p>
                        `}
                      </div>
                    ` : ''}
                  </div>

                  <!-- ITEM 2 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item2')" class="cursor-pointer hover:bg-slate-900/80 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-800">
                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-bold text-slate-200 flex items-center gap-1.5">
                        2. 🍾 Ambalaj Maliyeti (${layer2GroupMode === 'wholesale_drums' ? 'Dökme Bidon' : 'Şişe + Kapak + Kutu'})
                        <span class="text-[10px] text-sky-400 font-normal bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/60">ℹ️ Açıkla</span>
                      </span>
                      <span class="grow border-b border-dotted border-slate-800 mx-2"></span>
                      <span class="font-bold text-sky-300 shrink-0 text-xs">${PriceCalculator.formatTL(packCost)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item2 ? `
                      <div class="mt-2 p-3 bg-slate-900/90 rounded-xl border border-sky-500/40 text-[11px] text-sky-200 space-y-1.5 animate-slide-up">
                        <div class="font-extrabold text-sky-400 border-b border-slate-800 pb-1">💡 2. KALEM NASIL HESAPLANDI?</div>
                        <p>• <strong>Seçilen Ambalaj Boyutu:</strong> ${vol}</p>
                        <p>• <strong>Birim Ambalaj Maliyeti:</strong> <strong>${PriceCalculator.formatTL(packCost)} ₺</strong></p>
                        <p class="text-slate-400 text-[10px]">${layer2GroupMode === 'wholesale_drums' ? 'Büyük boy sanayi dökme bidon / varil paketleme payı.' : 'Cam şişe, dropper damlalık / pipet, kapak, tıpa, ürün kutusu ve etiket maliyetinin toplamıdır.'}</p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- ITEM 3 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item3')" class="cursor-pointer hover:bg-slate-900/80 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-800">
                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-bold text-slate-200 flex items-center gap-1.5">
                        3. ⚡ Tesis & Enerji Payı ${supplyType === 'wholesale' ? '(Toptan Alış: 0 ₺)' : `(${PriceCalculator.formatTL(overheadRes.overheadPerKg)}/KG x ${kg} KG)`}
                        <span class="text-[10px] text-purple-400 font-normal bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">ℹ️ Açıkla</span>
                      </span>
                      <span class="grow border-b border-dotted border-slate-800 mx-2"></span>
                      <span class="font-bold ${supplyType === 'wholesale' ? 'text-slate-400' : 'text-purple-300'} shrink-0 text-xs">${PriceCalculator.formatTL(linearOverhead)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item3 ? `
                      <div class="mt-2 p-3 bg-slate-900/90 rounded-xl border border-purple-500/40 text-[11px] text-purple-200 space-y-1.5 animate-slide-up">
                        <div class="font-extrabold text-purple-300 border-b border-slate-800 pb-1">💡 3. KALEM NASIL HESAPLANDI?</div>
                        ${supplyType === 'wholesale' ? `
                          <p>• <strong>Toptan Alınan Yağlarda Tesis Payı:</strong> <strong>0,00 ₺</strong></p>
                          <p class="text-slate-300">Tedarikçiden hazır dökme yağ alındığı için fabrikanızın 20 kafalı pres makinesi çalıştırılmaz ve yüksek voltaj elektrik harcanmaz. Bu sebeple elektrik/tesis payı 0 ₺ eklenir.</p>
                        ` : `
                          <p>• <strong>Aylık Toplam Tesis Masrafınız:</strong> ${PriceCalculator.formatTL(overheadRes.totalMonthlyOverhead || 330000)} ₺ (Maaşlar, SGK, Elektrik, Yemek)</p>
                          <p>• <strong>Aylık Üretim Kapasitesi:</strong> ${(overheadRes.monthlyCapacityKg || 8714).toLocaleString('tr-TR')} KG / Ay</p>
                          <p>• <strong>1 KG Yağ Payı:</strong> ${PriceCalculator.formatTL(overheadRes.totalMonthlyOverhead || 330000)} ÷ ${(overheadRes.monthlyCapacityKg || 8714)} KG = ${PriceCalculator.formatTL(overheadRes.overheadPerKg)} / KG</p>
                          <p>• <strong>Bu Ürün İçin Pay (${kg} KG):</strong> ${PriceCalculator.formatTL(overheadRes.overheadPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(linearOverhead)} ₺</strong></p>
                        `}
                      </div>
                    ` : ''}
                  </div>

                  <!-- ITEM 4 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item4')" class="cursor-pointer hover:bg-slate-900/80 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-800">
                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-bold text-slate-200 flex items-center gap-1.5">
                        4. 🛠️ Dolum, Etiketleme & Paketleme İşçilik Payı
                        <span class="text-[10px] text-indigo-400 font-normal bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">ℹ️ Açıkla</span>
                      </span>
                      <span class="grow border-b border-dotted border-slate-800 mx-2"></span>
                      <span class="font-bold text-indigo-300 shrink-0 text-xs">${PriceCalculator.formatTL(laborAssemblyFee)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item4 ? `
                      <div class="mt-2 p-3 bg-slate-900/90 rounded-xl border border-indigo-500/40 text-[11px] text-indigo-200 space-y-1.5 animate-slide-up">
                        <div class="font-extrabold text-indigo-300 border-b border-slate-800 pb-1">💡 4. KALEM NASIL HESAPLANDI?</div>
                        <p>• <strong>Ambalaj Tipi:</strong> ${vol}</p>
                        <p>• <strong>Dolum & Paketleme İşçilik Payı:</strong> <strong>${PriceCalculator.formatTL(laborAssemblyFee)} ₺</strong></p>
                        <p class="text-slate-400 text-[10px]">${layer2GroupMode === 'wholesale_drums' ? 'Bidon doldurma, kapaklama, mühürleme ve bantlama işçiliği.' : 'Küçük cam şişelere hassas dolum yapma, damlalık/pipet takma, kutulama ve etiketleme el işçiliği payı.'}</p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- ITEM 5 / TOTAL -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item5')" class="cursor-pointer hover:bg-slate-900/80 p-2 rounded-xl transition-all border border-teal-500/30 hover:border-teal-400/60 mt-2 bg-slate-900/50">
                    <div class="flex items-center justify-between font-black text-xs">
                      <span class="text-teal-400 tracking-wide flex items-center gap-1.5">
                        🏁 TOPLAM SAF FABRİKA ÇIKIŞ MALİYETİ
                        <span class="text-[10px] text-teal-300 font-normal bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800/60">ℹ️ Formül</span>
                      </span>
                      <span class="grow border-b border-dashed border-teal-500/40 mx-2"></span>
                      <span class="text-teal-300 text-sm shrink-0">${PriceCalculator.formatTL(netCost)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item5 ? `
                      <div class="mt-2 p-3 bg-slate-900/90 rounded-xl border border-teal-500/50 text-[11px] text-teal-200 space-y-1.5 animate-slide-up">
                        <div class="font-extrabold text-teal-300 border-b border-slate-800 pb-1">💡 TOPLAM SAF MALİYET FORMÜLÜ</div>
                        <p>• 1. Yağ Payı: ${PriceCalculator.formatTL(rawOilCost)} ₺</p>
                        <p>• 2. Ambalaj Payı: ${PriceCalculator.formatTL(packCost)} ₺</p>
                        <p>• 3. Tesis Payı: ${PriceCalculator.formatTL(linearOverhead)} ₺</p>
                        <p>• 4. İşçilik Payı: ${PriceCalculator.formatTL(laborAssemblyFee)} ₺</p>
                        <p class="font-bold text-teal-300 border-t border-slate-800 pt-1.5 text-xs">
                          = (1 + 2 + 3 + 4) = <strong>${PriceCalculator.formatTL(netCost)} ₺</strong>
                        </p>
                        <p class="text-slate-400 text-[10px]">Bu tutar fabrikanızın ham maliyetidir. Pazaryeri komisyonları ve kâr bu tutarın üzerine eklenir.</p>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ""}

              <!-- SİSTEM 1 KANAL SATIŞ SİMÜLATÖRÜ (KATMAN 1 STİLİ TAM KARTLAR) -->
              ${isDrawerOpen ? `
                <div class="bg-slate-950 p-4 rounded-xl border border-purple-800/60 space-y-3.5 animate-slide-up">
                  <div class="flex flex-wrap items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800 gap-3">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-extrabold text-purple-300 flex items-center gap-1.5">⚡ KATMAN 1 SİSTEM 1 KANAL FİYATI & HAKEDİŞ SİMÜLATÖRÜ</span>
                      <span class="text-xs text-slate-400">(Saf Fabrika Maliyeti Üzerinden Hesaplama)</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="text-xs font-bold text-slate-200">Hedef Net Kâr (₺):</label>
                      <input type="number" value="${targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-24 bg-slate-950 border border-purple-500/60 text-purple-300 font-extrabold text-sm px-3 py-1 rounded-lg text-center focus:outline-none">
                      <span class="text-xs font-bold text-purple-400">₺ / Adet</span>
                    </div>
                  </div>

                  <!-- SİSTEM 1 KANAL DETAY KARTLARI GRID -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                    <!-- 1. TRENDYOL SİSTEM 1 KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-amber-950/20 p-3.5 rounded-xl border border-amber-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-amber-400 text-xs flex items-center gap-1">🧡 TRENDYOL</span>
                          <span class="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">%19 Kom.</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Tavsiye Satış Fiyatı:</span>
                          <span class="font-black text-amber-300 text-base">${PriceCalculator.formatTL(tySim.salePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon (%19):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(tySim.commAmount)}</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo Ücreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(tySim.cargoFee)}</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Hakediş (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(tySim.payout)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(tySim.netProfit)}</span>
                      </div>
                    </div>

                    <!-- 2. İYZİCO (WEB SİTENİZ) SİSTEM 1 KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-blue-950/20 p-3.5 rounded-xl border border-blue-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-blue-400 text-xs flex items-center gap-1">🌐 İYZİCO (WEB SİTENİZ)</span>
                          <span class="text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">%4 Kom.</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Tavsiye Satış Fiyatı:</span>
                          <span class="font-black text-blue-300 text-base">${PriceCalculator.formatTL(iySim.salePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon (%4):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(iySim.commAmount)}</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo Ücreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(iySim.cargoFee)}</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Hakediş (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(iySim.payout)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(iySim.netProfit)}</span>
                      </div>
                    </div>

                    <!-- 3. HEPSİBURADA SİSTEM 1 KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-orange-950/20 p-3.5 rounded-xl border border-orange-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-orange-400 text-xs flex items-center gap-1">🧡 HEPSİBURADA</span>
                          <span class="text-xs font-bold text-orange-300 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">%17 Kom.</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Tavsiye Satış Fiyatı:</span>
                          <span class="font-black text-orange-300 text-base">${PriceCalculator.formatTL(hbSim.salePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon (%17):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(hbSim.commAmount)}</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo Ücreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(hbSim.cargoFee)}</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Hakediş (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(hbSim.payout)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(hbSim.netProfit)}</span>
                      </div>
                    </div>

                    <!-- 4. PERAKENDE FİZİKİ MAĞAZA KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-emerald-950/20 p-3.5 rounded-xl border border-emerald-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-emerald-400 text-xs flex items-center gap-1">🏪 FİZİKİ MAĞAZA</span>
                          <span class="text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Direkt</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Mağaza Fiyatı:</span>
                          <span class="font-black text-emerald-300 text-base">${PriceCalculator.formatTL(storePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon:</span><span class="text-emerald-400 font-bold">0,00 ₺</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo:</span><span class="text-emerald-400 font-bold">0,00 ₺</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Kasa (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(storePrice)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(targetProfitInput)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ""}
            </div>
          `;

          containerRows.insertAdjacentHTML("beforeend", rowHtml);

        } else {
          const cardHtml = `
            <div class="glass-card rounded-2xl p-4 border border-slate-800/80 hover:border-emerald-500/50 flex flex-col justify-between relative overflow-hidden transition-all bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-xl">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-1.5 truncate">
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">
                      ${product.category}
                    </span>
                    ${isAnyModified ? `
                      <button onclick="resetProductField('${product.id}', 'all')" title="Tüm Girdileri Orijinal Başlangıç Fiyatlarına Dön" class="text-[10px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-800/80 transition-all flex items-center gap-1 shrink-0 shadow-sm">
                        ↺ Varsayılana Dön
                      </button>
                    ` : ''}
                  </div>
                  <span class="font-mono text-xs font-semibold text-slate-300 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                    ${product.sku}
                  </span>
                </div>

                <h3 class="text-sm font-extrabold text-white tracking-tight mb-2 truncate">
                  ${product.name}
                </h3>

                <!-- TEDARİK TÜRÜ & HAMMADDE/TOPTAN GİRDİLERİ (CARD VIEW) -->
                <div class="my-2 bg-slate-950/90 p-2.5 rounded-xl border ${supplyType === 'wholesale' ? 'border-blue-500/40' : 'border-amber-500/30'} space-y-2">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Tedarik Türü:</span>
                    <div class="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                      <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2 py-0.5 rounded text-[10px] font-bold transition-all ${supplyType !== 'wholesale' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}">
                        🌾 Sıkım
                      </button>
                      <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2 py-0.5 rounded text-[10px] font-bold transition-all ${supplyType === 'wholesale' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                        📦 Toptan
                      </button>
                    </div>
                  </div>

                  ${supplyType === 'wholesale' ? `
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-400">📦 Toptan Alış:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${costPerKg}" step="10" title="Orijinal Varsayılan: ${initialCost} ₺/KG (Çift tıkla sıfırla)" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-900 border border-blue-500/50 text-blue-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">₺/KG</span>
                        ${isWholesaleModified ? `<button onclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" title="Varsayılana Dön (${initialCost} ₺)" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">↺</button>` : ''}
                      </div>
                    </div>
                  ` : `
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-amber-400">🌾 Tohum Alış:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${seedCost}" step="5" title="Orijinal Varsayılan: ${initialSeedCost} ₺/KG (Çift tıkla sıfırla)" ondblclick="resetProductField('${product.id}', 'seedCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-20 bg-slate-900 border border-amber-500/50 text-amber-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-amber-400">₺/KG</span>
                        ${isSeedModified ? `<button onclick="resetProductField('${product.id}', 'seedCostPerKg')" title="Varsayılana Dön (${initialSeedCost} ₺)" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">↺</button>` : ''}
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-cyan-400">💧 Pres Verimi:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${yieldPct}" step="1" min="1" max="100" title="Orijinal Varsayılan: %${initialYield} (Çift tıkla sıfırla)" ondblclick="resetProductField('${product.id}', 'yieldPercent')" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-16 bg-slate-900 border border-cyan-500/50 text-cyan-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-cyan-400">%</span>
                        ${isYieldModified ? `<button onclick="resetProductField('${product.id}', 'yieldPercent')" title="Varsayılana Dön (%${initialYield})" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">↺</button>` : ''}
                      </div>
                    </div>
                  `}

                  <div class="pt-1 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 uppercase font-semibold">1KG Yağ Maliyeti:</span>
                    <span class="text-xs font-black ${supplyType === 'wholesale' ? 'text-blue-300' : 'text-cyan-300'}">${PriceCalculator.formatTL(costPerKg)}</span>
                  </div>
                </div>

                <!-- Birim 1KG Toptan Teklif Fiyatı Rozet (Card View) -->
                <div class="p-3 bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 rounded-xl border border-emerald-500/60 my-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-extrabold text-emerald-400 uppercase text-[10px] tracking-wider">MÜŞTERİYE 1 KG TEKLİF:</span>
                    <span class="font-black text-emerald-300 text-sm">${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} / KG</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px] text-purple-300 font-bold mt-1">
                    <span>${tierInfo.label} (%${discountPct} İskonto)</span>
                    <span>${kg} KG Toplam: ${PriceCalculator.formatTL(totalOrderPrice)}</span>
                  </div>
                </div>

                <!-- Ambalaj Seçici veya Toptan Elle KG Yazma Girişi (Card View) -->
                <div class="my-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <label class="text-slate-200 text-xs font-bold">${layer2GroupMode === 'wholesale_drums' ? '📦 Sipariş Miktarı:' : '🧴 Ambalaj Boyutu:'}</label>
                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="flex items-center gap-1">
                      <input type="number" value="${kg}" min="1" step="1" placeholder="KG" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-20 bg-slate-900 border border-purple-400/80 text-purple-200 font-black text-xs px-2 py-1 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <span class="text-xs font-black text-purple-300">KG</span>
                    </div>
                  ` : `
                    <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-sky-500/50 text-sky-300 font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none">
                      ${getLayer2VolumeOptionsHtml(vol)}
                    </select>
                  `}
                </div>

                <!-- FATURA KESER GİBİ DETAYLI DÖKÜM BUTONU -->
                <button onclick="toggleLayer2Breakdown('${product.id}')" class="w-full text-center py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all flex items-center justify-center gap-1.5 my-2">
                  <span>📋 ${isBreakdownOpen ? "Fatura Dökümünü Gizle" : "📋 Detaylı Maliyet Dökümü"}</span>
                </button>

                <!-- FATURA KESER GİBİ SIKI DÖKÜM TABLOSU (CARD VIEW RECEIPT STYLE) -->
                ${isBreakdownOpen ? `
                  <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 animate-slide-up my-2">
                    <div class="flex justify-between items-center pb-1.5 border-b border-slate-800 font-extrabold text-xs text-emerald-400 uppercase tracking-wider">
                      <span>📋 MALİYET KALEMİ (${supplyType === 'wholesale' ? 'TOPTAN' : 'SIKIM'})</span>
                      <span>TUTAR</span>
                    </div>

                    ${supplyType === 'wholesale' ? `
                      <div class="flex items-baseline justify-between text-slate-200">
                        <span class="shrink-0 font-medium text-slate-300">1. 📦 Toptan Yağ Payı (${vol})</span>
                        <span class="grow border-b border-dotted border-slate-800 mx-1.5"></span>
                        <span class="font-bold text-blue-300 shrink-0 text-xs">${PriceCalculator.formatTL(rawOilCost)}</span>
                      </div>
                    ` : `
                      <div class="flex items-baseline justify-between text-slate-200">
                        <span class="shrink-0 font-medium text-slate-300">1. 🧴 Sıkım Yağ Payı (${vol})</span>
                        <span class="grow border-b border-dotted border-slate-800 mx-1.5"></span>
                        <span class="font-bold text-cyan-300 shrink-0 text-xs">${PriceCalculator.formatTL(rawOilCost)}</span>
                      </div>
                    `}

                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-medium">2. 🍾 Şişe/Kapak</span>
                      <span class="grow border-b border-dotted border-slate-700 mx-1.5"></span>
                      <span class="font-bold text-blue-300 shrink-0 text-xs">${PriceCalculator.formatTL(packCost)}</span>
                    </div>

                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-medium">3. ⚡ Tesis Payı ${supplyType === 'wholesale' ? '(0 ₺)' : ''}</span>
                      <span class="grow border-b border-dotted border-slate-700 mx-1.5"></span>
                      <span class="font-bold ${supplyType === 'wholesale' ? 'text-slate-400' : 'text-purple-300'} shrink-0 text-xs">${PriceCalculator.formatTL(linearOverhead)}</span>
                    </div>

                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-medium">4. 🛠️ İşçilik Montaj</span>
                      <span class="grow border-b border-dotted border-slate-700 mx-1.5"></span>
                      <span class="font-bold text-cyan-300 shrink-0 text-xs">${PriceCalculator.formatTL(laborAssemblyFee)}</span>
                    </div>

                    <div class="pt-2 border-t border-slate-800 flex items-center justify-between font-black text-xs">
                      <span class="text-emerald-400">🏁 TOPLAM SAF MALİYET</span>
                      <span class="grow border-b border-dashed border-emerald-500/50 mx-1.5"></span>
                      <span class="text-emerald-300 text-sm shrink-0">${PriceCalculator.formatTL(netCost)}</span>
                    </div>
                  </div>
                ` : ""}
              </div>

              <!-- SAF FABRİKA ÇIKIŞ MALİYETİ VURGU ROZETİ & SİSTEM 1 BUTONU -->
              <div class="mt-2 pt-3 border-t border-slate-800/80 bg-gradient-to-r from-emerald-950/60 to-slate-950 p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">SAF FABRİKA ÇIKIŞ MALİYETİ:</span>
                  <span class="text-xl font-black text-emerald-300">${PriceCalculator.formatTL(netCost)}</span>
                </div>
                <button onclick="toggleLayer2Drawer('${product.id}')" class="text-xs font-bold px-3 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/80 transition-all flex items-center gap-1.5 shadow-lg shadow-purple-950/40">
                  ⚡ ${isDrawerOpen ? "Sistem 1'i Gizle" : "Sistem 1 Simülatörü"}
                </button>
              </div>

              <!-- SİSTEM 1 KANAL SATIŞ SİMÜLATÖRÜ ÇEKMECESİ (CARD VIEW) -->
              ${isDrawerOpen ? `
                <div class="mt-3 pt-3 border-t border-slate-800 bg-slate-950/95 p-3 rounded-xl border border-purple-800/50 animate-slide-up space-y-2.5">
                  <div class="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <label class="text-xs font-bold text-purple-300">🎯 Hedef Net Kâr (₺):</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-16 bg-slate-950 border border-purple-500/60 text-purple-300 font-bold text-xs px-2 py-1 rounded-md text-center focus:outline-none">
                      <span class="text-xs font-bold text-purple-400">₺</span>
                    </div>
                  </div>

                  <!-- SİSTEM 1 KANAL HESAP KARTLARI -->
                  <div class="grid grid-cols-1 gap-2 text-xs">
                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-amber-800/50">
                      <div class="flex justify-between items-center font-bold text-amber-300">
                        <span>🧡 Trendyol (%19):</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(tySim.salePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: -${PriceCalculator.formatTL(tySim.commAmount)}</span><span>Kargo: -110 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>Hakediş: ${PriceCalculator.formatTL(tySim.payout)}</span><span>Net Kâr: +${PriceCalculator.formatTL(tySim.netProfit)}</span></div>
                      </div>
                    </div>

                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-blue-800/50">
                      <div class="flex justify-between items-center font-bold text-blue-300">
                        <span>🌐 İyzico Web (%4):</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(iySim.salePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: -${PriceCalculator.formatTL(iySim.commAmount)}</span><span>Kargo: -82.50 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>Hakediş: ${PriceCalculator.formatTL(iySim.payout)}</span><span>Net Kâr: +${PriceCalculator.formatTL(iySim.netProfit)}</span></div>
                      </div>
                    </div>

                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-orange-800/50">
                      <div class="flex justify-between items-center font-bold text-orange-300">
                        <span>🧡 Hepsiburada (%17):</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(hbSim.salePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: -${PriceCalculator.formatTL(hbSim.commAmount)}</span><span>Kargo: -110 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>Hakediş: ${PriceCalculator.formatTL(hbSim.payout)}</span><span>Net Kâr: +${PriceCalculator.formatTL(hbSim.netProfit)}</span></div>
                      </div>
                    </div>

                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-800/50">
                      <div class="flex justify-between items-center font-bold text-emerald-300">
                        <span>🏪 Fiziki Mağaza:</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(storePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: 0 TL</span><span>Kargo: 0 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>Kasa: ${PriceCalculator.formatTL(storePrice)}</span><span>Net Kâr: +${PriceCalculator.formatTL(targetProfitInput)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ""}
            </div>
          `;

          containerGrid.insertAdjacentHTML("beforeend", cardHtml);
        }
      } catch (itemErr) {
        console.error("Katman 2 Ürün Kartı Yükleme Hatası:", itemErr);
      }
    });
  } catch (err) {
    console.error("Fatal Katman 2 Render Error:", err);
    const errContainer = document.getElementById("layer2-product-rows") || document.getElementById("layer2-main-view");
    if (errContainer) {
      errContainer.innerHTML = `
        <div class="col-span-full p-6 text-center bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-300 space-y-3 my-4">
          <p class="font-bold text-sm">⚠️ Katman 2 Yüklenirken Bir Hata Oluştu.</p>
          <p class="text-xs text-rose-400 font-mono">${err.message || "Bilinmeyen JS Hatası"}</p>
          <button onclick="localStorage.clear(); location.reload();" class="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg">
            🗑️ Ön Belleği Sıfırla ve Yeniden Yükle
          </button>
        </div>
      `;
    }
  }
}

async function resetProductField(productId, field) {
  const product = currentProducts[productId] || Object.values(currentProducts).find(p => p.id === productId || p.sku === productId);
  if (!product) return;

  const kdvRate = product.kdv || (product.category === "Uçucu Yağlar" ? 20 : 1);
  const initialCost = product.initialCostPerKg || product.costPerKg || 1200;
  const initialSeed = product.initialSeedCostPerKg || parseFloat((initialCost * 0.25).toFixed(2));

  if (field === "seedCostPerKg") product.seedCostPerKg = initialSeed;
  else if (field === "yieldPercent") product.yieldPercent = 25;
  else if (field === "dipPercent") {
    product.dipPercent = 0;
    product.dipStatus = "none";
  }
  else if (field === "herbCostPerKg") product.herbCostPerKg = 0;
  else if (field === "oliveOilCostPerKg") product.oliveOilCostPerKg = 454.50;
  else if (field === "herbRatioKg") product.herbRatioKg = 0.20;
  else if (field === "herbKg") product.herbKg = null;
  else if (field === "oilKg") product.oilKg = null;
  else if (field === "wholesaleCostPerKg") product.wholesaleCostPerKg = initialCost;
  else if (field === "layer2Profit") product.layer2Profit = 70;
  else if (field === "all") {
    product.seedCostPerKg = initialSeed;
    product.yieldPercent = 25;
    product.dipPercent = 0;
    product.dipStatus = "none";
    product.herbCostPerKg = 0;
    product.oliveOilCostPerKg = 454.50;
    product.herbRatioKg = 0.20;
    product.herbKg = null;
    product.oilKg = null;
    product.wholesaleCostPerKg = initialCost;
    product.supplyType = product.category === "Uçucu Yağlar" ? "wholesale" : "press";
    product.layer2Profit = 70;
  }

  const isMaceration = isMacerationOil(product);
  const isEssentialOil = product.category === "Uçucu Yağlar";
  let supplyType = product.supplyType;
  if (isEssentialOil && (!supplyType || supplyType === "press")) {
    supplyType = "wholesale";
    product.supplyType = "wholesale";
  }
  if (!supplyType) {
    supplyType = isEssentialOil ? "wholesale" : "press";
  }

  if (isMaceration) {
    const macerationRes = PriceCalculator.calculateMacerationCost({
      herbCostPerKg: product.herbCostPerKg || 0,
      oliveOilCostPerKg: product.oliveOilCostPerKg !== undefined ? product.oliveOilCostPerKg : 459.05,
      herbRatioKg: product.herbRatioKg,
      herbKg: product.herbKg,
      oilKg: product.oilKg,
      supplyType: supplyType,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      fallbackCostPerKg: initialCost
    });
    product.herbRatioKg = macerationRes.calculatedRatio;
    product.layer2NetCostPerKg = macerationRes.netCostPerKg;
  } else {
    const coldPressRes = PriceCalculator.calculateColdPressCost({
      seedCostPerKg: product.seedCostPerKg !== undefined ? product.seedCostPerKg : initialSeed,
      yieldPercent: product.yieldPercent || 25,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      supplyType: supplyType,
      dipStatus: product.dipStatus || "none",
      dipPercent: product.dipPercent || 0,
      fallbackCostPerKg: initialCost
    });
    product.layer2NetCostPerKg = coldPressRes.netCostPerKg;
  }

  await StorageManager.saveProduct(product);
  renderLayer2Cards();
  if (currentLayerMode === 1) renderProductGrid();
  showToast(`Sıfırlandı: ${product.name} (Orijinal %${kdvRate} KDV Dahil: ${PriceCalculator.formatTL(initialCost)} ₺ Fiyata Döndü ↺)`);
}

function toggleLayer2Drawer(productId) {
  openLayer2Drawers[productId] = !openLayer2Drawers[productId];
  renderLayer2Cards();
}

function isMacerationOil(product) {
  if (!product) return false;
  if (product.productionType === "maceration") return true;
  if (product.productionType === "cold_press") return false;

  const name = (product.name || "").toLowerCase();
  return name.includes("maserasyon") ||
         name.includes("kudret narı") ||
         name.includes("sarı kantaron") ||
         name.includes("aynısefa") ||
         name.includes("havuç (maserasyon)") ||
         name.includes("at kestanesi") ||
         name.includes("sarımsak yağı") ||
         name.includes("udi hindi");
}

async function updateLayer2ProductField(productId, field, value) {
  const product = currentProducts[productId] || Object.values(currentProducts).find(p => p.id === productId || p.sku === productId);
  if (!product) return;

  if (field === "productionType") product.productionType = value;
  if (field === "supplyType") product.supplyType = value; // 'press' | 'wholesale'
  if (field === "wholesaleCostPerKg") {
    product.wholesaleCostPerKg = parseFloat(value) || 0;
  }

  if (field === "seedCostPerKg") product.seedCostPerKg = parseFloat(value) || 0;
  if (field === "yieldPercent") product.yieldPercent = parseFloat(value) || 25;
  if (field === "dipStatus") product.dipStatus = value;
  if (field === "dipPercent") product.dipPercent = parseFloat(value) || 0;

  if (field === "herbCostPerKg") product.herbCostPerKg = parseFloat(value) || 0;
  if (field === "oliveOilCostPerKg") product.oliveOilCostPerKg = parseFloat(value) || 454.50;
  if (field === "herbRatioKg") product.herbRatioKg = parseFloat(value) || 0.2;
  if (field === "herbKg") product.herbKg = value !== "" ? parseFloat(value) : null;
  if (field === "oilKg") product.oilKg = value !== "" ? parseFloat(value) : null;

  if (field === "layer2Volume") product.layer2Volume = value;
  if (field === "layer2WholesaleKg") product.layer2WholesaleKg = parseFloat(value) || 30;
  if (field === "layer2Margin" || field === "layer2Profit") product.layer2Profit = parseFloat(value) || 0;

  const isMaceration = isMacerationOil(product);
  const isEssentialOil = product.category === "Uçucu Yağlar";
  let supplyType = product.supplyType;
  if (isEssentialOil && (!supplyType || supplyType === "press")) {
    supplyType = "wholesale";
    product.supplyType = "wholesale";
  }
  if (!supplyType) {
    supplyType = isEssentialOil ? "wholesale" : "press";
  }

  if (isMaceration) {
    const macerationRes = PriceCalculator.calculateMacerationCost({
      herbCostPerKg: product.herbCostPerKg || 0,
      oliveOilCostPerKg: product.oliveOilCostPerKg !== undefined ? product.oliveOilCostPerKg : 454.50,
      herbRatioKg: product.herbRatioKg,
      herbKg: product.herbKg,
      oilKg: product.oilKg,
      supplyType: supplyType,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      fallbackCostPerKg: product.costPerKg || 600
    });
    product.herbRatioKg = macerationRes.calculatedRatio;
    product.layer2NetCostPerKg = macerationRes.netCostPerKg;
  } else {
    if (product.seedCostPerKg === undefined || product.seedCostPerKg === null) {
      product.seedCostPerKg = parseFloat(((product.costPerKg || 1212.00) * 0.25).toFixed(2));
    }
    const coldPressRes = PriceCalculator.calculateColdPressCost({
      seedCostPerKg: product.seedCostPerKg,
      yieldPercent: product.yieldPercent || 25,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      supplyType: supplyType,
      dipStatus: product.dipStatus || "none",
      dipPercent: product.dipPercent || 0,
      fallbackCostPerKg: product.costPerKg || 1200
    });
    product.layer2NetCostPerKg = coldPressRes.netCostPerKg;
  }

  await StorageManager.saveProduct(product);
  renderLayer2Cards();
  if (currentLayerMode === 1) renderProductGrid();
}

// ----------------------------------------------------
// 🔴 KIRMIZI ÇİZGİ DİP FİYAT VE 🎁 KOMBİN SET SİMS
// ----------------------------------------------------

let showRedLineFloor = false;

function toggleRedLineFloor() {
  showRedLineFloor = !showRedLineFloor;
  const btn = document.getElementById("btn-toggle-redline");
  if (btn) {
    if (showRedLineFloor) {
      btn.classList.remove("bg-slate-900", "text-rose-400");
      btn.classList.add("bg-rose-600", "text-white", "shadow-lg", "shadow-rose-600/30");
      btn.innerHTML = `🔴 Dip Fiyat (AÇIK)`;
    } else {
      btn.classList.remove("bg-rose-600", "text-white", "shadow-lg", "shadow-rose-600/30");
      btn.classList.add("bg-slate-900", "text-rose-400");
      btn.innerHTML = `🔴 Dip Fiyat`;
    }
  }

  if (currentLayerMode === 1) renderProductGrid();
  else if (currentLayerMode === 2) renderLayer2Cards();
}

function setZeroProfitFloor() {
  const profitInput = document.getElementById("slot-target-profit");
  if (profitInput) {
    profitInput.value = 0;
    calculateCurrentModal();
    if (typeof showToast !== "undefined") {
      showToast("🔴 Kırmızı Çizgi Dip Fiyat Aktif (Hedef Kâr: 0 ₺)", "info");
    }
  }
}

function setDefaultProfit70() {
  const profitInput = document.getElementById("slot-target-profit");
  if (profitInput) {
    profitInput.value = 70;
    calculateCurrentModal();
    if (typeof showToast !== "undefined") {
      showToast("🟢 Standart Hedef Kâr (70 ₺) Aktif", "info");
    }
  }
}

function openBundleSimulatorModal() {
  try {
    const modal = document.getElementById("modal-bundle-simulator");
    if (!modal) return;
    populateBundleProductDropdowns();
    updateBundleSimulator();
    modal.classList.remove("hidden");
  } catch (err) {
    console.error("Bundle Modal Açılış Hatası:", err);
    if (typeof showToast !== "undefined") {
      showToast("Simülatör Açılırken Hata: " + err.message, "error");
    }
  }
}

function closeBundleSimulatorModal() {
  const modal = document.getElementById("modal-bundle-simulator");
  if (modal) modal.classList.add("hidden");
}

function populateBundleProductDropdowns() {
  if (!currentProducts || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }
  const pList = Object.values(currentProducts || {});
  if (pList.length === 0) return;

  const sel1 = document.getElementById("bundle-item-1");
  const sel2 = document.getElementById("bundle-item-2");
  const sel3 = document.getElementById("bundle-item-3");

  if (!sel1 || !sel2 || !sel3) return;

  let optionsHtml = pList.map(p => {
    const idKey = p.id || p.sku;
    return `<option value="${idKey}">${p.sku} - ${p.name} (${p.category})</option>`;
  }).join("");

  sel1.innerHTML = optionsHtml;
  sel2.innerHTML = optionsHtml;
  sel3.innerHTML = `<option value="">-- Ürün Yok (2'li Paket) --</option>` + optionsHtml;

  if (pList.length >= 2) {
    sel1.value = pList[0].id || pList[0].sku;
    sel2.value = pList[1].id || pList[1].sku;
  }
}

function onBundleItemProductChange(idx) {
  const sel = document.getElementById(`bundle-item-${idx}`);
  const volSel = document.getElementById(`bundle-vol-${idx}`);
  if (!sel || !volSel) return;
  if (!currentProducts || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }
  const pList = Object.values(currentProducts || {});
  const p = currentProducts[sel.value] || pList.find(item => item.id === sel.value || item.sku === sel.value);
  if (p) {
    volSel.value = p.layer2Volume || "1000ml";
  }
}

function updateBundleSimulator() {
  try {
    const sel1 = document.getElementById("bundle-item-1");
    const sel2 = document.getElementById("bundle-item-2");
    const sel3 = document.getElementById("bundle-item-3");
    const priceInput = document.getElementById("bundle-target-price");

    if (!sel1 || !sel2 || !sel3 || !priceInput) return;

    if (!currentProducts || Object.keys(currentProducts).length === 0) {
      currentProducts = StorageManager.getProducts();
    }

    const pList = Object.values(currentProducts);
    const p1 = currentProducts[sel1.value] || pList.find(p => (p.sku === sel1.value || p.id === sel1.value));
    const p2 = currentProducts[sel2.value] || pList.find(p => (p.sku === sel2.value || p.id === sel2.value));
    const p3 = sel3.value ? (currentProducts[sel3.value] || pList.find(p => (p.sku === sel3.value || p.id === sel3.value))) : null;

    const vol1 = document.getElementById("bundle-vol-1")?.value || "250ml";
    const vol2 = document.getElementById("bundle-vol-2")?.value || "50ml";
    const vol3 = document.getElementById("bundle-vol-3")?.value || "30ml";

    const itemEntries = [];
    if (p1) itemEntries.push({ product: p1, vol: vol1, idx: 1 });
    if (p2) itemEntries.push({ product: p2, vol: vol2, idx: 2 });
    if (p3) itemEntries.push({ product: p3, vol: vol3, idx: 3 });

    if (itemEntries.length === 0) return;

    const overhead = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overhead);

    const costsList = itemEntries.map((entry, index) => {
      const product = entry.product;
      const vol = entry.vol;
      const ml = PriceCalculator.getVolumeMl(vol);
      const kg = ml / 1000;

      const supplyType = product.supplyType || "press";
      const yieldPct = (product.yieldPercent !== undefined && product.yieldPercent !== null) ? product.yieldPercent : 25;
      const seedCost = (product.seedCostPerKg !== undefined && product.seedCostPerKg !== null)
        ? product.seedCostPerKg
        : parseFloat(((product.costPerKg || 1212.00) * 0.25).toFixed(2));

      const costPerKg = (supplyType === "wholesale")
        ? (product.wholesaleCostPerKg !== undefined ? product.wholesaleCostPerKg : (product.costPerKg || 1950.00))
        : ((yieldPct > 0) ? parseFloat((seedCost / (yieldPct / 100)).toFixed(2)) : (product.costPerKg || 1212.00));

      const rawOilCost = parseFloat(((costPerKg / 1000) * ml).toFixed(2));
      const packCost = (typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[vol]) ? DEFAULT_PACKAGING_COSTS[vol] : 14.50;
      const linearOverhead = parseFloat((overheadRes.overheadPerKg * kg).toFixed(2));

      let laborAssemblyFee = 8.00;
      if (vol === "1000ml" || vol === "1kg") laborAssemblyFee = 10.00;
      else if (vol === "500ml") laborAssemblyFee = 9.00;
      else if (vol === "250ml") laborAssemblyFee = 8.00;
      else if (vol === "100ml") laborAssemblyFee = 7.50;
      else if (vol === "50ml") laborAssemblyFee = 9.50;
      else if (vol === "30ml") laborAssemblyFee = 14.70;
      else if (vol === "20ml") laborAssemblyFee = 17.80;
      else if (vol === "5000ml" || vol === "5kg") laborAssemblyFee = 15.00;

      const itemNetCost = parseFloat((rawOilCost + packCost + linearOverhead + laborAssemblyFee).toFixed(2));

      const costBadge = document.getElementById(`bundle-item-cost-${entry.idx}`);
      if (costBadge) costBadge.textContent = PriceCalculator.formatTL(itemNetCost);

      return itemNetCost;
    });

    if (!p3) {
      const costBadge3 = document.getElementById("bundle-item-cost-3");
      if (costBadge3) costBadge3.textContent = "0,00 ₺";
    }

    const bundleTargetPrice = parseFloat(priceInput.value) || 0;
    const totalCost = costsList.reduce((a, b) => a + b, 0);

    const costEl = document.getElementById("bundle-total-cost");
    if (costEl) costEl.textContent = PriceCalculator.formatTL(totalCost);

    const cargoSavingsEl = document.getElementById("bundle-cargo-savings");
    const savedCargo = (itemEntries.length - 1) * 110;
    if (cargoSavingsEl) cargoSavingsEl.textContent = `+${PriceCalculator.formatTL(savedCargo)} Kargo Tasarrufu!`;

    const tyRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 19, cargo: 110 });
    const iyRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 4, cargo: 82.50 });
    const hbRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 17, cargo: 110 });
    const storeProfit = bundleTargetPrice - totalCost;

    const itemsSummaryHtml = `
      <div class="text-[10px] text-slate-300 font-semibold bg-slate-950/90 p-2 rounded-xl border border-slate-800 space-y-1 mb-2">
        <div class="font-bold text-purple-300 uppercase tracking-wider text-[9px] border-b border-slate-800/80 pb-1 flex justify-between">
          <span>📦 SET İÇERİĞİ & SEÇİLEN HACİMLER</span>
          <span>BİRİM MALİYET</span>
        </div>
        ${itemEntries.map((e, idx) => `
          <div class="flex justify-between items-center text-slate-300">
            <span class="truncate pr-1">${idx + 1}. ${e.product.name} <strong class="text-sky-300">(${e.vol})</strong></span>
            <span class="font-bold text-amber-300 shrink-0 ml-1">${PriceCalculator.formatTL(costsList[idx])}</span>
          </div>
        `).join('')}
      </div>
    `;

    function renderBundleProfitBadge(profit) {
      const isLoss = profit < 0;
      const badgeBg = isLoss ? "bg-rose-950/90 border-rose-500/50" : "bg-emerald-950/80 border-emerald-500/40";
      const labelColor = isLoss ? "text-rose-300" : "text-emerald-400";
      const valColor = isLoss ? "text-rose-200" : "text-emerald-300";
      const valText = isLoss ? PriceCalculator.formatTL(profit) : `+${PriceCalculator.formatTL(profit)}`;

      return `
        <div class="${badgeBg} p-2.5 rounded-xl border mt-2 flex justify-between items-center font-bold text-xs shadow-inner">
          <span class="${labelColor} uppercase tracking-wider text-[10px]">KOMBİN NET KÂR:</span>
          <span class="${valColor} font-black text-base">${valText}</span>
        </div>
      `;
    }

    const resultsGrid = document.getElementById("bundle-results-grid");
    if (resultsGrid) {
      resultsGrid.innerHTML = `
        <!-- 1. TRENDYOL KOMBİN KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-amber-950/30 p-4 rounded-2xl border border-amber-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-amber-400 text-xs">🧡 TRENDYOL</span>
              <span class="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">%19 Kom.</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Set Satış Fiyatı:</span><span class="font-bold text-amber-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon (%19):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(tyRes.commAmount)}</span></div>
              <div class="flex justify-between"><span>(-) Tek Kargo:</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(tyRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Hakediş:</span><span class="text-emerald-300">${PriceCalculator.formatTL(tyRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(tyRes.netProfit)}
        </div>

        <!-- 2. İYZİCO (WEB SİTENİZ) KOMBİN KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-blue-950/30 p-4 rounded-2xl border border-blue-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-blue-400 text-xs">🌐 İYZİCO (WEB)</span>
              <span class="text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">%4 Kom.</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Set Satış Fiyatı:</span><span class="font-bold text-blue-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon (%4):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(iyRes.commAmount)}</span></div>
              <div class="flex justify-between"><span>(-) Tek Kargo:</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(iyRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Hakediş:</span><span class="text-emerald-300">${PriceCalculator.formatTL(iyRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(iyRes.netProfit)}
        </div>

        <!-- 3. HEPSİBURADA KOMBİN KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-orange-950/30 p-4 rounded-2xl border border-orange-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-orange-400 text-xs">🧡 HEPSİBURADA</span>
              <span class="text-[10px] font-bold text-orange-300 bg-orange-950 px-2 py-0.5 rounded-full border border-orange-800">%17 Kom.</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Set Satış Fiyatı:</span><span class="font-bold text-orange-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon (%17):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(hbRes.commAmount)}</span></div>
              <div class="flex justify-between"><span>(-) Tek Kargo:</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(hbRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Hakediş:</span><span class="text-emerald-300">${PriceCalculator.formatTL(hbRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(hbRes.netProfit)}
        </div>

        <!-- 4. PERAKENDE FİZİKİ MAĞAZA KOMBİN KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-emerald-950/30 p-4 rounded-2xl border border-emerald-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-emerald-400 text-xs">🏪 FİZİKİ MAĞAZA</span>
              <span class="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">Direkt</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Mağaza Set Fiyatı:</span><span class="font-bold text-emerald-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon:</span><span class="text-emerald-400 font-semibold">0,00 ₺</span></div>
              <div class="flex justify-between"><span>(-) Kargo:</span><span class="text-emerald-400 font-semibold">0,00 ₺</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Kasa:</span><span class="text-emerald-300">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(storeProfit)}
        </div>
      `;
    }
  } catch (err) {
    console.error("Update Bundle Error:", err);
  }
}

// ----------------------------------------------------
// 📄 KATMAN 2 SAF FABRİKA MALİYETİ PDF RAPORU OLUŞTURUCU (REÇETE & DÖKÜM ENTEGRELİ)
// ----------------------------------------------------
function generateLayer2PdfReport() {
  const selectedVol = document.getElementById("pdf-report-volume-select")?.value || "1000ml";
  const volInKg = PriceCalculator.getVolumeInKg(selectedVol);

  const productsMap = StorageManager.getProducts();
  const productsArr = Object.values(productsMap);

  const sabitYaglar = productsArr.filter(p => p.category === "Sabit Yağlar");
  const ucucuYaglar = productsArr.filter(p => p.category === "Uçucu Yağlar");

  const todayStr = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  const dynamicOverheadPerKg = overheadRes.overheadPerKg;

  const logoUrl = "assets/cansizzade_logo.jpg";

  let reportHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Cansızzade - Katman 2 Fabrika Detaylı Reçete & Saf Maliyet Raporu (${selectedVol})</title>
  <style>
    @page { size: A4 portrait; margin: 6mm 7mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 0; font-size: 8.5px; line-height: 1.15; }
    .page { page-break-after: always; min-height: 280mm; box-sizing: border-box; padding-bottom: 8mm; position: relative; }
    .page:last-child { page-break-after: avoid; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #047857; padding-bottom: 5px; margin-bottom: 5px; }
    .header-logo { height: 46px; width: auto; }
    .header-info { text-align: right; }
    .header-info h1 { margin: 0; font-size: 13px; color: #047857; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
    .header-info p { margin: 1px 0 0 0; font-size: 8px; color: #475569; font-weight: 600; }
    .meta-banner { background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 5px; padding: 4px 8px; margin-bottom: 5px; display: flex; justify-content: space-between; font-size: 8px; font-weight: 600; color: #166534; }
    .legend-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 3px 6px; margin-bottom: 5px; font-size: 7.5px; color: #475569; display: flex; justify-content: space-around; font-weight: 600; }
    .cat-title { background: #047857; color: #ffffff; font-weight: 800; font-size: 9.5px; padding: 3px 6px; border-radius: 3px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 7.5px; margin-bottom: 5px; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 800; text-align: left; padding: 3px 3.5px; border-bottom: 1.5px solid #cbd5e1; text-transform: uppercase; font-size: 7px; }
    td { padding: 2px 3.5px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .text-emerald { color: #047857; }
    .text-blue { color: #1d4ed8; }
    .text-purple { color: #7e22ce; }
    .text-slate { color: #64748b; font-size: 7px; }
    .footer { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 3px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <!-- SAYFA 1: SABİT YAĞLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="Cansızzade Logo">
      <div class="header-info">
        <h1>KATMAN 2: SAF FABRİKA MALİYET RAPORU (${selectedVol.toUpperCase()})</h1>
        <p>CANSIZZADE BİTKİSEL YAĞLAR SAN. TİC. LTD. ŞTİ. | <strong>SABİT YAĞLAR MALİYET DÖKÜMÜ</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>📅 <strong>Tarih:</strong> ${todayStr}</span>
      <span>📍 <strong>Rapor Hacmi:</strong> ${selectedVol} (${volInKg} KG Yağ)</span>
      <span>🏭 <strong>Aylık Tesis Gideri:</strong> ${PriceCalculator.formatTL(overheadRes.totalMonthlyOverhead)}</span>
      <span>⚡ <strong>1KG Tesis Payı:</strong> ${PriceCalculator.formatTL(dynamicOverheadPerKg)}/KG</span>
    </div>

    <div class="legend-banner">
      <span><strong>Reçete Metodu:</strong> Soğuk Sıkım / Maserasyon / Toptan</span>
      <span><strong>1. Hammadde:</strong> ${selectedVol} Yağ Tutarı</span>
      <span><strong>2. Ambalaj:</strong> ${selectedVol} Şişe/Etiket</span>
      <span><strong>3. Tesis Payı:</strong> Orantılı Gider Payı</span>
      <span><strong>4. Dolum Montaj:</strong> Ambalaj İşçiliği</span>
    </div>

    <div class="cat-title">🌿 SABİT YAĞLAR DETAYLI 5 KALEM FATURA DÖKÜM TABLOSU (${selectedVol})</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 7%;">SKU</th>
          <th style="width: 20%;">Ürün Adı</th>
          <th style="width: 19%;">Hesaplama Reçetesi & Origin</th>
          <th style="width: 11%;" class="text-right">1. Hammadde Yağ</th>
          <th style="width: 10%;" class="text-right">2. Şişe/Ambalaj</th>
          <th style="width: 10%;" class="text-right">3. Tesis/Gider</th>
          <th style="width: 10%;" class="text-right">4. Dolum Montaj</th>
          <th style="width: 10%;" class="text-right">5. TOPLAM SAF MALİYET</th>
        </tr>
      </thead>
      <tbody>
        ${sabitYaglar.map((p, idx) => {
          const rawCostPerKg = (p.costPerKg || p.initialCostPerKg || 1000);
          const rawOilCost = parseFloat((rawCostPerKg * volInKg).toFixed(2));
          const packCost = (typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[selectedVol] !== undefined)
            ? DEFAULT_PACKAGING_COSTS[selectedVol]
            : 14.50;
          
          const isWholesale = (p.supplyType === "wholesale");
          const isMaceration = isMacerationOil(p);
          
          const linearOverhead = isWholesale ? 0.00 : parseFloat((dynamicOverheadPerKg * volInKg).toFixed(2));
          const totalOverhead = isWholesale ? PriceCalculator.getOverheadForVolume(selectedVol, 0) : PriceCalculator.getOverheadForVolume(selectedVol, dynamicOverheadPerKg);
          const laborAssemblyFee = parseFloat(Math.max(0, totalOverhead - linearOverhead).toFixed(2));
          const totalNetCost = parseFloat((rawOilCost + packCost + totalOverhead).toFixed(2));

          let recipeDesc = "";
          if (isMaceration) {
            const herbRatio = p.herbRatioKg || 0.20;
            const ratioStr = `1:${Math.round(1 / herbRatio)}`;
            recipeDesc = `<span class="text-purple font-bold">🌿 Bizim Üretim (Maserasyon)</span> <span class="text-slate">(${ratioStr} Z.Yağı)</span>`;
          } else if (isWholesale) {
            recipeDesc = `<span class="text-slate font-bold">📦 Toptan Alış</span> <span class="text-slate">(Dış Tedarik | Tesis 0₺)</span>`;
          } else {
            const yieldPct = p.yieldPercent || 25;
            const seedCost = (p.seedCostPerKg !== undefined && p.seedCostPerKg !== null) ? p.seedCostPerKg : parseFloat((rawCostPerKg * 0.25).toFixed(2));
            recipeDesc = `<span class="text-emerald font-bold">🧴 Bizim Sıkım (Soğuk Sıkım)</span> <span class="text-slate">(Tohum: ${PriceCalculator.formatTL(seedCost)} | %${yieldPct})</span>`;
          }

          return `
            <tr>
              <td class="text-center font-bold">${idx + 1}</td>
              <td class="font-bold">${p.sku}</td>
              <td class="font-bold text-emerald">${p.name}</td>
              <td>${recipeDesc}</td>
              <td class="text-right font-bold">${PriceCalculator.formatTL(rawOilCost)}</td>
              <td class="text-right">${PriceCalculator.formatTL(packCost)}</td>
              <td class="text-right font-bold ${isWholesale ? 'text-slate' : 'text-purple'}">${isWholesale ? '0,00 ₺ (Dış)' : PriceCalculator.formatTL(linearOverhead)}</td>
              <td class="text-right font-bold ${isWholesale ? 'text-slate' : 'text-purple'}">${isWholesale ? '0,00 ₺' : PriceCalculator.formatTL(laborAssemblyFee)}</td>
              <td class="text-right font-black text-blue">${PriceCalculator.formatTL(totalNetCost)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <div class="footer">
      <span>Cansızzade Yönetim & Maliyet Analiz Sistemi v2.48</span>
      <span>Sayfa 1 / 2 (Sabit Yağlar - ${selectedVol} Reçete & 5 Kalem Fatura Dökümü)</span>
    </div>
  </div>

  <!-- SAYFA 2: UÇUCU YAĞLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="Cansızzade Logo">
      <div class="header-info">
        <h1>KATMAN 2: UÇUCU YAĞLAR SAF MALİYET RAPORU (${selectedVol.toUpperCase()})</h1>
        <p>CANSIZZADE BİTKİSEL YAĞLAR SAN. TİC. LTD. ŞTİ. | <strong>UÇUCU YAĞLAR FATURA & KDV DÖKÜMÜ</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>📅 <strong>Tarih:</strong> ${todayStr}</span>
      <span>📍 <strong>Rapor Hacmi:</strong> ${selectedVol} (${volInKg} KG Yağ)</span>
      <span>🏭 <strong>Tedarik Reçetesi:</strong> %20 Yasal KDV Dahil Saf Distilasyon Toptan Tedarik</span>
      <span>📊 <strong>Ürün Sayısı:</strong> ${ucucuYaglar.length} Uçucu Yağ</span>
    </div>

    <div class="legend-banner">
      <span><strong>Faturadaki Net:</strong> ${selectedVol} KDV Hariç Alış Tutarı</span>
      <span><strong>Yasal KDV:</strong> %20 Katma Değer Vergisi</span>
      <span><strong>Hammadde:</strong> KDV Dahil ${selectedVol} Alış</span>
      <span><strong>Ambalaj:</strong> ${selectedVol} Şişe/Etiket</span>
    </div>

    <div class="cat-title">🌸 UÇUCU YAĞLAR KDV DÖKÜMÜ & DETAYLI MALİYET TABLOSU (${selectedVol})</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 8%;">SKU</th>
          <th style="width: 22%;">Ürün Adı</th>
          <th style="width: 17%;">Tedarik & KDV Reçetesi</th>
          <th style="width: 11%;" class="text-right">Faturadaki Net</th>
          <th style="width: 10%;" class="text-right">Yasal KDV (%20)</th>
          <th style="width: 10%;" class="text-right">1. Hammadde Yağ</th>
          <th style="width: 9%;" class="text-right">2. Ambalaj</th>
          <th style="width: 10%;" class="text-right">5. TOPLAM SAF MALİYET</th>
        </tr>
      </thead>
      <tbody>
        ${ucucuYaglar.map((p, idx) => {
          const costKdvInPerKg = (p.costPerKg || p.initialCostPerKg || 1000);
          const costKdvExPerKg = costKdvInPerKg / 1.20;

          const rawCostKdvEx = parseFloat((costKdvExPerKg * volInKg).toFixed(2));
          const kdvAmount = parseFloat(((costKdvInPerKg - costKdvExPerKg) * volInKg).toFixed(2));
          const rawCostKdvIn = parseFloat((costKdvInPerKg * volInKg).toFixed(2));

          const packCost = (typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[selectedVol] !== undefined)
            ? DEFAULT_PACKAGING_COSTS[selectedVol]
            : 14.50;
          
          const totalNetCost = parseFloat((rawCostKdvIn + packCost).toFixed(2));

          return `
            <tr>
              <td class="text-center font-bold">${idx + 1}</td>
              <td class="font-bold">${p.sku}</td>
              <td class="font-bold text-emerald">${p.name}</td>
              <td><span class="text-purple font-bold">🌸 Toptan Distilasyon</span> <span class="text-slate">(%20 KDV Dahil)</span></td>
              <td class="text-right">${PriceCalculator.formatTL(rawCostKdvEx)}</td>
              <td class="text-right text-purple">${PriceCalculator.formatTL(kdvAmount)}</td>
              <td class="text-right font-bold text-blue">${PriceCalculator.formatTL(rawCostKdvIn)}</td>
              <td class="text-right">${PriceCalculator.formatTL(packCost)}</td>
              <td class="text-right font-black text-blue">${PriceCalculator.formatTL(totalNetCost)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <div class="footer">
      <span>Cansızzade Yönetim & Maliyet Analiz Sistemi v2.43</span>
      <span>Sayfa 2 / 2 (Uçucu Yağlar - KDV Dökümü & Saf Maliyet)</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(reportHtml);
  printWindow.document.close();
}

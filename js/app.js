// CanFiyat Portal Main Application Logic (v1.13) - Ultra Compact Dropdown & Fit-on-Screen Layout

let currentProducts = {};
let currentLayerMode = 1; // 1: Saf Maliyet Simülatörü, 2: Hızlı Sipariş / Teklif, 3: Satış Kataloğu & Kasa
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
  if (currentLayerMode === 1) renderLayer2Cards();
  else if (currentLayerMode === 2) renderLayer3Cards();
  else if (currentLayerMode === 3) renderProductGrid();
}

let openOfferBreakdownInfos = {};

function toggleOfferBreakdownInfo(itemKey) {
  openOfferBreakdownInfos[itemKey] = !openOfferBreakdownInfos[itemKey];
  calculateOfferSim();
}
window.toggleOfferBreakdownInfo = toggleOfferBreakdownInfo;

let isOfferInvoiceOpen = false;
function toggleOfferInvoice() {
  isOfferInvoiceOpen = !isOfferInvoiceOpen;
  calculateOfferSim();
}
window.toggleOfferInvoice = toggleOfferInvoice;

const ALL_VOLUMES = [
  { key: "10ml", label: "10 ml (Uçucu)", price: "5.50 ₺" },
  { key: "20ml", label: "20 ml", price: "6.00 ₺" },
  { key: "30ml", label: "30 ml", price: "6.75 ₺" },
  { key: "50ml", label: "50 ml", price: "7.25 ₺" },
  { key: "100ml", label: "100 ml", price: "8.35 ₺" },
  { key: "150ml", label: "150 ml", price: "10.00 ₺" },
  { key: "250ml", label: "250 ml", price: "14.50 ₺" },
  { key: "300ml", label: "300 ml", price: "18.00 ₺" },
  { key: "500ml", label: "500 ml", price: "25.00 ₺" },
  { key: "1000ml", label: "1000 ml (1kg)", price: "35.00 ₺" },
  { key: "5000ml", label: "5000 ml (5kg)", price: "120.00 ₺" }
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
    updateLayer2BannerStats();
    renderLayer2Cards();
  } else if (currentLayerMode === 2) {
    if (typeof renderLayer3Cards === "function") renderLayer3Cards();
  } else if (currentLayerMode === 3) {
    initLayer3Hub();
  }
  const globalProfitInput = document.getElementById("global-bulk-profit-input");
  if (globalProfitInput && typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) {
    globalProfitInput.value = StorageManager.getGlobalTargetProfit();
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
          updateLayer2BannerStats();
          renderLayer2Cards();
        } else if (currentLayerMode === 2) {
          if (typeof renderLayer3Cards === "function") renderLayer3Cards();
        } else if (currentLayerMode === 3) {
          initLayer3Hub();
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
      if (currentLayerMode === 1) renderLayer2Cards();
      else if (currentLayerMode === 2) renderLayer3Cards();
      else if (currentLayerMode === 3) {
        if (currentLayer3SubTab === "catalog") renderProductGrid();
        else if (currentLayer3SubTab === "multipack") calculateMultipackSim();
        else if (currentLayer3SubTab === "offers") calculateOfferSim();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedProductId) {
      calculateCurrentModal();
    }
  });

  // Close bulk profit dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("bulk-profit-dropdown");
    const container = document.getElementById("bulk-profit-widget-container");
    if (dropdown && !dropdown.classList.contains("hidden")) {
      if (container && !container.contains(e.target)) {
        closeBulkProfitMenu();
      }
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
  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }
  const totalCount = productsArr.length;
  const ucucuCount = productsArr.filter(p => p && p.category === "Uçucu Yağlar").length;
  const sabitCount = productsArr.filter(p => p && p.category === "Sabit Yağlar").length;

  if (document.getElementById("stat-total-count")) document.getElementById("stat-total-count").innerText = totalCount;
  if (document.getElementById("stat-ucucu-count")) document.getElementById("stat-ucucu-count").innerText = ucucuCount;
  if (document.getElementById("stat-sabit-count")) document.getElementById("stat-sabit-count").innerText = sabitCount;

  // Dynamically update category filter tab buttons
  const btnAll = document.getElementById("cat-tab-all");
  if (btnAll) btnAll.innerHTML = `Tüm Ürünler (${totalCount})`;

  const btnUcucu = document.getElementById("cat-tab-Uçucu Yağlar");
  if (btnUcucu) btnUcucu.innerHTML = `🌿 Uçucu Yağlar (${ucucuCount})`;

  const btnSabit = document.getElementById("cat-tab-Sabit Yağlar");
  if (btnSabit) btnSabit.innerHTML = `🌻 Sabit Yağlar (${sabitCount})`;
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

  if (currentLayerMode === 1) renderLayer2Cards();
  else if (currentLayerMode === 2) renderLayer3Cards();
  else if (currentLayerMode === 3) renderProductGrid();
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


function sortProductsByCategoryAndName(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice().sort((a, b) => {
    const catOrder = { "Uçucu Yağlar": 1, "Sabit Yağlar": 2 };
    const orderA = catOrder[a.category] || 3;
    const orderB = catOrder[b.category] || 3;

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.name || "").localeCompare(b.name || "", "tr");
  });
}

// -------------------------------------------------------------------------
// 📋 3. KATMAN 4. SEKME: ÖZEL KATALOG FİLTRE VE ARAMA YÖNETİMİ
// -------------------------------------------------------------------------
let catalogActiveCategory = "all";
let catalogSearchQuery = "";

function filterCatalogCategory(cat) {
  catalogActiveCategory = cat;

  const btnAll = document.getElementById("catalog-cat-all");
  const btnUcucu = document.getElementById("catalog-cat-ucucu");
  const btnSabit = document.getElementById("catalog-cat-sabit");

  const activeClass = "catalog-cat-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-white text-zinc-950 shadow-sm cursor-pointer";
  const inactiveClass = "catalog-cat-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer";

  if (btnAll) btnAll.className = cat === "all" ? activeClass : inactiveClass;
  if (btnUcucu) btnUcucu.className = cat === "Uçucu Yağlar" ? activeClass : inactiveClass;
  if (btnSabit) btnSabit.className = cat === "Sabit Yağlar" ? activeClass : inactiveClass;

  renderProductGrid();
}

function onCatalogSearchInput(val) {
  catalogSearchQuery = (val || "").trim();
  renderProductGrid();
}

function clearCatalogSearch() {
  const input = document.getElementById("catalog-search-input");
  if (input) input.value = "";
  catalogSearchQuery = "";
  renderProductGrid();
}

function renderProductGrid() {
  const container = document.getElementById("product-grid");
  if (!container) return;

  container.innerHTML = "";

  if (!currentProducts || typeof currentProducts !== "object" || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }

  const productsArr = Object.values(currentProducts || {});
  const filteredRaw = productsArr.filter(p => {
    if (!p || typeof p.name !== "string" || typeof p.sku !== "string") return false;
    
    const effectiveCat = (currentLayerMode === 3 && typeof catalogActiveCategory !== "undefined")
      ? catalogActiveCategory
      : activeCategory;
    const matchesCat = (effectiveCat === "all") || (p.category === effectiveCat);

    const pName = (p.name || "").toLocaleLowerCase("tr");
    const pSku = (p.sku || "").toLocaleLowerCase("tr");

    const effectiveSearch = (currentLayerMode === 3 && typeof catalogSearchQuery !== "undefined" && catalogSearchQuery)
      ? catalogSearchQuery.toLocaleLowerCase("tr")
      : (searchQuery ? searchQuery.toLocaleLowerCase("tr") : "");

    const matchesSearch = !effectiveSearch || pName.includes(effectiveSearch) || pSku.includes(effectiveSearch);
    return matchesCat && matchesSearch;
  });

  const filtered = sortProductsByCategoryAndName(filteredRaw);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-10 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 w-full">
        <svg class="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="text-xs font-medium">Aramanıza uygun Cansızzade ürünü bulunamadı.</p>
        <button onclick="${currentLayerMode === 3 ? 'clearCatalogSearch()' : 'clearSearch()'}" class="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg cursor-pointer">Aramayı Temizle</button>
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
        salesVatRate: parseFloat(product.kdv) || 20,
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
        <div class="glass-card rounded-xl p-3 border ${showRedLineFloor ? 'border-rose-600/60 bg-rose-950/20' : 'border-white/5 hover:border-white/15 bg-[#12151b]'} transition-all shadow-sm hover:shadow-md group flex flex-col gap-2">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <!-- 1. Left: Product Title, SKU, Category Badge -->
            <div class="flex items-center gap-3 w-full md:w-4/12 min-w-[240px]">
              <span class="font-mono text-xs font-bold text-zinc-300 bg-[#0a0c10] px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0 shadow-sm">
                ${product.sku}
              </span>
              <div class="truncate">
                <h3 class="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors truncate" title="${product.name}">
                  ${product.name}
                </h3>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}">
                    ${product.category}
                  </span>
                  <span class="text-[11px] font-medium text-zinc-400 bg-[#0a0c10] px-2 py-0.5 rounded-md border border-zinc-800">
                    📌 Ambalaj: <span class="text-zinc-200 font-bold text-xs">${mainVol}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 2. Center: 4-Column Balanced Tabular Metrics (Katman 2 Birebir Standardı) -->
            <div class="grid grid-cols-4 gap-2 w-full md:w-5/12 items-center bg-[#090b10] px-3 py-2 rounded-xl border border-zinc-800/80 text-xs shadow-inner">
              <div class="text-center border-r border-zinc-800/80 pr-1">
                <span class="text-[11px] font-medium text-zinc-400 block leading-tight">1KG Toptan</span>
                <span class="font-bold text-zinc-100 text-xs block mt-0.5 tabular-nums">${PriceCalculator.formatTL(product.costPerKg)}</span>
              </div>

              <div class="text-center border-r border-zinc-800/80 pr-1">
                <span class="text-[11px] font-medium text-zinc-400 block leading-tight">${mainVol} Maliyet</span>
                <span class="font-bold text-zinc-300 text-xs block mt-0.5 tabular-nums">${PriceCalculator.formatTL(unitCost)}</span>
              </div>

              <div class="text-center border-r border-zinc-800/80 pr-1">
                <span class="text-[11px] font-medium ${showRedLineFloor ? 'text-rose-400 font-bold' : 'text-zinc-400'} block leading-tight">
                  ${showRedLineFloor ? '🔴 Dip Satış' : 'Trendyol Etiket'}
                </span>
                <span class="font-bold ${showRedLineFloor ? 'text-rose-300' : 'text-zinc-100'} text-xs block mt-0.5 tabular-nums">
                  ${PriceCalculator.formatTL(showRedLineFloor ? breakEvenTy.breakEvenPrice : tyResult.listPrice)}
                </span>
              </div>

              <div class="text-center">
                <span class="text-[11px] font-medium text-zinc-400 block leading-tight">Hedef Kâr</span>
                <span class="font-bold text-emerald-400 text-xs block mt-0.5 tabular-nums">+${PriceCalculator.formatTL(volConfig?.targetProfit ?? 70)}</span>
              </div>
            </div>

            <!-- 3. Far Right Action Button: Kasa & Detay Modal Açıcı -->
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="openProductSlot('${product.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#181c24] text-zinc-300 hover:text-white border border-zinc-700/80 hover:bg-zinc-800 transition-all cursor-pointer shadow-sm flex items-center gap-1">
                <span>🧮 5'li Sistem Kasa ▼</span>
              </button>
            </div>

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
  document.getElementById("slot-kdv-rate").value = product.kdv || 20;

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
    salesVatRate: parseFloat(product.kdv) || 20,
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: tyChannel.commission || 19,
    discount: tyChannel.discount || 0,
    cargo: tyChannel.cargo || 110
  });

  const baseTyPrice = s1TyRes.listPrice;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal("slot-packaging-cost", packCost);
  setVal("slot-target-profit", targetProfit);

  setVal("s2_web_price", config.webSalePrice ?? parseFloat((baseTyPrice * 0.85).toFixed(2)));
  setVal("s4_retail_price", config.retailPrice ?? baseTyPrice);

  const s5 = config.s5 || {};
  const defaultAvPrice = parseFloat((baseTyPrice * 0.90).toFixed(2));  // 🟢 1. Avantajlı %10 indirimli teklif
  const defaultCakPrice = parseFloat((baseTyPrice * 0.82).toFixed(2)); // 🟡 2. Çok Avantajlı %18 indirimli teklif
  const defaultSupPrice = parseFloat((baseTyPrice * 0.70).toFixed(2)); // 🔴 3. Süper Avantajlı %30 indirimli teklif

  setVal("s5_price_av", s5.priceAv ?? defaultAvPrice);
  setVal("s5_comm_av", s5.commAv ?? 19.0);
  setVal("s5_price_cak", s5.priceCak ?? defaultCakPrice);
  setVal("s5_comm_cak", s5.commCak ?? 19.0);
  setVal("s5_price_sup", s5.priceSup ?? defaultSupPrice);
  setVal("s5_comm_sup", s5.commSup ?? 19.0);
  setVal("s5_cargo", s5.cargo ?? (tyChannel.cargo || 110));

  const ty = config.channels?.trendyol || { commission: 19, discount: 0, cargo: 110 };
  const hb = config.channels?.hepsiburada || { commission: 17, discount: 0, cargo: 110 };
  const iy = config.channels?.iyzico || { commission: 4, discount: 0, cargo: 82.50 };

  setVal("s1_comm_ty", ty.commission);
  setVal("s1_disc_ty", ty.discount);
  setVal("s1_kargo_ty", ty.cargo);

  setVal("s1_comm_hb", hb.commission);
  setVal("s1_disc_hb", hb.discount);
  setVal("s1_kargo_hb", hb.cargo);

  setVal("s1_comm_iy", iy.commission);
  setVal("s1_disc_iy", iy.discount);
  setVal("s1_kargo_iy", iy.cargo);

  calculateCurrentModal();
}

function saveInputsToCurrentVolumeConfig() {
  if (!selectedProductId) return;
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const getVal = (id, defaultVal = 0) => {
    const el = document.getElementById(id);
    if (!el) return defaultVal;
    const parsed = parseFloat(el.value);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  product.kdv = getVal("slot-kdv-rate", 20);

  const config = getVolumeConfig(product, activeVolume);
  config.packagingCost = getVal("slot-packaging-cost", 14.50);
  config.targetProfit = getVal("slot-target-profit", 70);

  config.webSalePrice = getVal("s2_web_price", 500);
  config.retailPrice = getVal("s4_retail_price", 650);

  config.s5 = {
    priceAv: getVal("s5_price_av", 0),
    commAv: getVal("s5_comm_av", 15),
    priceCak: getVal("s5_price_cak", 0),
    commCak: getVal("s5_comm_cak", 14.6),
    priceSup: getVal("s5_price_sup", 0),
    commSup: getVal("s5_comm_sup", 12.5),
    cargo: getVal("s5_cargo", 110)
  };

  config.channels = {
    trendyol: {
      commission: getVal("s1_comm_ty", 19),
      discount: getVal("s1_disc_ty", 0),
      cargo: getVal("s1_kargo_ty", 110)
    },
    hepsiburada: {
      commission: getVal("s1_comm_hb", 17),
      discount: getVal("s1_disc_hb", 0),
      cargo: getVal("s1_kargo_hb", 110)
    },
    iyzico: {
      commission: getVal("s1_comm_iy", 4),
      discount: getVal("s1_disc_iy", 0),
      cargo: getVal("s1_kargo_iy", 82.50)
    }
  };

  StorageManager.saveProduct(product);
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

  ["system1", "system5"].forEach(id => {
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

  calculateSystem1Modal();
  calculateSystem5Modal();
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

  const kdvRate = parseFloat(document.getElementById("slot-kdv-rate").value) || 20;
  const costPerKg = getModalCostPerKg();
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;

  const unitCost = PriceCalculator.calculateUnitWholesaleCost(costPerKg, activeVolume, packagingCost);
  document.getElementById("calculated-unit-cost").innerText = PriceCalculator.formatTL(unitCost);

  const tyInput = {
    salesVatRate: kdvRate,
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_ty").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_ty").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_ty").value) || 110
  };

  const hbInput = {
    salesVatRate: kdvRate,
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_hb").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_hb").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_hb").value) || 110
  };

  const iyInput = {
    salesVatRate: kdvRate,
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
  const kdvRate = parseFloat(document.getElementById("slot-kdv-rate").value) || 20;
  const commAmtAv = priceAv * (commAv / 100);
  const payoutAv = priceAv - commAmtAv - cargo;
  
  const extraVatAv = (priceAv - unitCost) * (kdvRate / (100 + kdvRate));
  const kargoKdv = cargo - (cargo / 1.20);
  const commKdvAv = commAmtAv - (commAmtAv / 1.20);
  const refundAv = kargoKdv + commKdvAv;
  const netVatAv = extraVatAv - refundAv;
  
  const profitAv = payoutAv - unitCost - netVatAv;

  // 2. Çok Avantajlı
  const priceCak = parseFloat(document.getElementById("s5_price_cak").value) || 0;
  const commCak = parseFloat(document.getElementById("s5_comm_cak").value) || 14.6;
  const commAmtCak = priceCak * (commCak / 100);
  const payoutCak = priceCak - commAmtCak - cargo;
  
  const extraVatCak = (priceCak - unitCost) * (kdvRate / (100 + kdvRate));
  const commKdvCak = commAmtCak - (commAmtCak / 1.20);
  const refundCak = kargoKdv + commKdvCak;
  const netVatCak = extraVatCak - refundCak;
  
  const profitCak = payoutCak - unitCost - netVatCak;

  // 3. Süper Avantajlı
  const priceSup = parseFloat(document.getElementById("s5_price_sup").value) || 0;
  const commSup = parseFloat(document.getElementById("s5_comm_sup").value) || 12.5;
  const commAmtSup = priceSup * (commSup / 100);
  const payoutSup = priceSup - commAmtSup - cargo;
  
  const extraVatSup = (priceSup - unitCost) * (kdvRate / (100 + kdvRate));
  const commKdvSup = commAmtSup - (commAmtSup / 1.20);
  const refundSup = kargoKdv + commKdvSup;
  const netVatSup = extraVatSup - refundSup;
  
  const profitSup = payoutSup - unitCost - netVatSup;

  // Render Avantajlı Card
  document.getElementById("s5_res_comm_av").innerText = `-${PriceCalculator.formatTL(commAmtAv)}`;
  document.getElementById("s5_res_cargo_av").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_av").innerText = PriceCalculator.formatTL(payoutAv);
  document.getElementById("s5_res_cost_av").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  if(document.getElementById("s5_kdv_av")) {
    document.getElementById("s5_kdv_av").innerText = (netVatAv > 0 ? "-" : "+") + PriceCalculator.formatTL(Math.abs(netVatAv || 0));
    document.getElementById("s5_kdv_av").className = "val font-semibold text-[10px] " + (netVatAv > 0 ? "text-rose-400" : "text-emerald-400");
    document.getElementById("s5_kdv_detail_av").innerHTML = `
      <span>+ Satış KDV: <strong class="text-rose-400/80">${PriceCalculator.formatTL(extraVatAv)}</strong></span>
      <span>- İade KDV: <strong class="text-emerald-400/80">${PriceCalculator.formatTL(refundAv)}</strong> (Kar:${PriceCalculator.formatTL(kargoKdv)}|Kom:${PriceCalculator.formatTL(commKdvAv)})</span>
    `;
  }
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
  if(document.getElementById("s5_kdv_cak")) {
    document.getElementById("s5_kdv_cak").innerText = (netVatCak > 0 ? "-" : "+") + PriceCalculator.formatTL(Math.abs(netVatCak || 0));
    document.getElementById("s5_kdv_cak").className = "val font-semibold text-[10px] " + (netVatCak > 0 ? "text-rose-400" : "text-emerald-400");
    document.getElementById("s5_kdv_detail_cak").innerHTML = `
      <span>+ Satış KDV: <strong class="text-rose-400/80">${PriceCalculator.formatTL(extraVatCak)}</strong></span>
      <span>- İade KDV: <strong class="text-emerald-400/80">${PriceCalculator.formatTL(refundCak)}</strong> (Kar:${PriceCalculator.formatTL(kargoKdv)}|Kom:${PriceCalculator.formatTL(commKdvCak)})</span>
    `;
  }
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
  if(document.getElementById("s5_kdv_sup")) {
    document.getElementById("s5_kdv_sup").innerText = (netVatSup > 0 ? "-" : "+") + PriceCalculator.formatTL(Math.abs(netVatSup || 0));
    document.getElementById("s5_kdv_sup").className = "val font-semibold text-[10px] " + (netVatSup > 0 ? "text-rose-400" : "text-emerald-400");
    document.getElementById("s5_kdv_detail_sup").innerHTML = `
      <span>+ Satış KDV: <strong class="text-rose-400/80">${PriceCalculator.formatTL(extraVatSup)}</strong></span>
      <span>- İade KDV: <strong class="text-emerald-400/80">${PriceCalculator.formatTL(refundSup)}</strong> (Kar:${PriceCalculator.formatTL(kargoKdv)}|Kom:${PriceCalculator.formatTL(commKdvSup)})</span>
    `;
  }
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

  const inactiveBtnClass = "layer-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-between transition-all duration-200 bg-[#0f1218]/90 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-zinc-200 hover:bg-[#151922]";
  const inactiveDotClass = "w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0";
  const inactiveBadgeClass = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-500 border border-zinc-800 shrink-0";

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
    // 1. KATMAN: SAF MALİYET SİMÜLATÖRÜ (ZÜMRÜT YEŞİL TEMA)
    if (btn1) btn1.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-between transition-all duration-200 bg-[#161a24] text-white border border-white/20 shadow-md";
    if (dot1) dot1.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 shrink-0";
    if (badge1) { badge1.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shrink-0"; badge1.innerText = "✓ SEÇİLİ KATMAN"; }

    if (view1) view1.classList.add("hidden");
    if (view2) view2.classList.remove("hidden");
    if (view3) view3.classList.add("hidden");
    if (btnOverhead) {
      btnOverhead.classList.remove("hidden");
      btnOverhead.classList.add("flex");
    }

    updateLayer2BannerStats();
    renderLayer2Cards();
  } else if (mode === 2) {
    // 2. KATMAN: HIZLI SİPARİŞ / TEKLİF (SKY / AMBER TEMA)
    if (btn2) btn2.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-between transition-all duration-200 bg-[#161a24] text-white border border-white/20 shadow-md";
    if (dot2) dot2.className = "w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50 shrink-0";
    if (badge2) { badge2.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800/80 shrink-0"; badge2.innerText = "✓ SEÇİLİ KATMAN"; }

    if (view1) view1.classList.add("hidden");
    if (view2) view2.classList.add("hidden");
    if (view3) view3.classList.remove("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    renderLayer3Cards();
  } else if (mode === 3) {
    // 3. KATMAN: SATIŞ KATALOĞU & KASA (INDIGO TEMA)
    if (btn3) btn3.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-between transition-all duration-200 bg-[#161a24] text-white border border-white/20 shadow-md";
    if (dot3) dot3.className = "w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50 shrink-0";
    if (badge3) { badge3.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 shrink-0"; badge3.innerText = "✓ SEÇİLİ KATMAN"; }

    if (view1) view1.classList.remove("hidden");
    if (view2) view2.classList.add("hidden");
    if (view3) view3.classList.add("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    initLayer3Hub();
  }
  
  // Katman 3'te işlevsiz olan üst genel filtre çubuğunu gizle, Katman 1 ve 2'de göster
  const globalControls = document.getElementById("global-layer-controls");
  if (globalControls) {
    if (mode === 3) {
      globalControls.classList.add("hidden");
    } else {
      globalControls.classList.remove("hidden");
    }
  }

  updateTopDipFiyatBtnState();
}

let cardActiveVolumes = {};
let expandedCards = {};

function updateCardVolume(productId, volKey) {
  cardActiveVolumes[productId] = volKey;
  StorageManager.saveLayer2SimProduct(productId, { layer2Volume: volKey });
  if (typeof currentProducts !== "undefined" && currentProducts && currentProducts[productId]) {
    currentProducts[productId].layer2Volume = volKey;
  }
  renderLayer3Cards();
  if (currentLayerMode === 1) {
    renderLayer2Cards();
  }
}

function toggleCardAccordion(productId) {
  expandedCards[productId] = !expandedCards[productId];
  renderLayer3Cards();
}

let currentLayer3Channel = "iyzico"; // "iyzico" or "trendyol"
let isLayer3DipFiyatMode = false; // Toggle for 0 TL Break-even Dip Price Mode

function handleDipFiyatToggle() {
  if (currentLayerMode === 2) {
    toggleLayer3DipFiyatMode();
  } else {
    toggleRedLineFloor();
  }
}

function updateTopDipFiyatBtnState() {
  const btnTop = document.getElementById("btn-toggle-redline");
  if (!btnTop) return;

  if (currentLayerMode === 2) {
    if (isLayer3DipFiyatMode) {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 text-white border border-rose-400 shadow-lg shadow-rose-600/40 flex items-center gap-1 cursor-pointer animate-pulse";
      btnTop.innerHTML = "🟢 Dip Fiyat (0 ₺ Kâr)";
    } else {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-slate-900 text-rose-400 border border-rose-900/60 hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer";
      btnTop.innerHTML = "🔴 Dip Fiyat";
    }
  } else {
    if (showRedLineFloor) {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-rose-600 text-white border border-rose-400 shadow-lg shadow-rose-600/30 flex items-center gap-1 cursor-pointer";
      btnTop.innerHTML = "🔴 Dip Fiyat (AÇIK)";
    } else {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-slate-900 text-rose-400 border border-rose-900/60 hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer";
      btnTop.innerHTML = "🔴 Dip Fiyat";
    }
  }
}

// ==========================================
// BULK TARGET NET PROFIT CONTROLLERS
// ==========================================
let currentBulkProfitScope = "all"; // 'all' | 'category'

function toggleBulkProfitMenu(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("bulk-profit-dropdown");
  if (!dropdown) return;
  const isHidden = dropdown.classList.contains("hidden");
  if (isHidden) {
    dropdown.classList.remove("hidden");
    updateBulkProfitScopeUI();
  } else {
    dropdown.classList.add("hidden");
  }
}

function closeBulkProfitMenu() {
  const dropdown = document.getElementById("bulk-profit-dropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function setBulkProfitScope(scope) {
  currentBulkProfitScope = scope;
  updateBulkProfitScopeUI();
}

function updateBulkProfitScopeUI() {
  const btnAll = document.getElementById("scope-btn-all");
  const btnCat = document.getElementById("scope-btn-category");
  if (!btnAll || !btnCat) return;

  const currentCat = (typeof activeCategory !== "undefined" && activeCategory) ? activeCategory : "all";
  btnCat.innerHTML = `🎯 Sadece ${currentCat === "all" ? "Kategori" : currentCat}`;

  if (currentBulkProfitScope === "all") {
    btnAll.className = "bulk-scope-btn px-2 py-1.5 rounded-lg text-[11px] font-bold text-center transition-all bg-emerald-600 text-white shadow-sm cursor-pointer";
    btnCat.className = "bulk-scope-btn px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center transition-all bg-transparent text-zinc-400 hover:text-white cursor-pointer";
  } else {
    btnCat.className = "bulk-scope-btn px-2 py-1.5 rounded-lg text-[11px] font-bold text-center transition-all bg-emerald-600 text-white shadow-sm cursor-pointer";
    btnAll.className = "bulk-scope-btn px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center transition-all bg-transparent text-zinc-400 hover:text-white cursor-pointer";
  }
}

function handleApplyBulkProfit() {
  const inputEl = document.getElementById("global-bulk-profit-input");
  const val = inputEl ? inputEl.value : 70;
  applyBulkTargetProfit(val, currentBulkProfitScope);
}

function quickApplyBulkProfit(val) {
  const inputEl = document.getElementById("global-bulk-profit-input");
  if (inputEl) inputEl.value = val;
  applyBulkTargetProfit(val, currentBulkProfitScope);
}

function applyBulkTargetProfit(customProfit, scope) {
  const inputEl = document.getElementById("global-bulk-profit-input");
  let profitVal = customProfit;
  if (profitVal === undefined || profitVal === null || profitVal === "") {
    profitVal = inputEl ? inputEl.value : 70;
  }
  const profitNum = parseFloat(profitVal);
  if (isNaN(profitNum) || profitNum < 0) {
    if (typeof showToast !== "undefined") {
      showToast("Lütfen geçerli bir kâr tutarı girin (ör: 70 ₺)", "error");
    }
    return;
  }

  const activeScope = scope || currentBulkProfitScope || "all";
  const currentCat = (typeof activeCategory !== "undefined" && activeCategory) ? activeCategory : "all";
  const categoryParam = activeScope === "category" ? (currentCat === "all" ? "all" : currentCat) : "all";

  const result = StorageManager.applyBulkTargetProfit(profitNum, categoryParam);

  // Sync in-memory currentProducts
  if (typeof currentProducts !== "undefined" && currentProducts) {
    Object.values(currentProducts).forEach(p => {
      if (categoryParam === "all" || p.category === categoryParam) {
        p.layer2Profit = profitNum;
      }
    });
  }

  if (inputEl) {
    inputEl.value = profitNum;
  }

  closeBulkProfitMenu();

  // Re-render views
  if (currentLayerMode === 1) {
    renderLayer2Cards();
  } else if (currentLayerMode === 2) {
    if (typeof renderLayer3Cards === "function") renderLayer3Cards();
  } else if (currentLayerMode === 3) {
    if (currentLayer3SubTab === "multipack" && typeof calculateMultipackSim === "function") {
      calculateMultipackSim();
    } else if (currentLayer3SubTab === "offers" && typeof calculateOfferSim === "function") {
      calculateOfferSim();
    } else if (currentLayer3SubTab === "catalog" && typeof renderProductGrid === "function") {
      renderProductGrid();
    }
  }

  const scopeLabel = categoryParam === "all" ? `Tüm Ürünler (${result.affectedCount || 65} Ürün)` : `${categoryParam} (${result.affectedCount} Ürün)`;
  if (typeof showToast !== "undefined") {
    showToast(`🎯 ${scopeLabel} için hedef net kâr ${PriceCalculator.formatTL(profitNum)} ₺ olarak uygulandı!`);
  }
}

function toggleLayer3DipFiyatMode() {
  isLayer3DipFiyatMode = !isLayer3DipFiyatMode;
  updateTopDipFiyatBtnState();
  renderLayer3Cards();
}

function setLayer3Channel(channel) {
  currentLayer3Channel = channel;
  const banner = document.getElementById("l3-summary-banner");
  const badge = document.getElementById("l3-active-channel-badge");
  const btnIyzico = document.getElementById("btn-l3-channel-iyzico");
  const btnTrendyol = document.getElementById("btn-l3-channel-trendyol");
  const btnPdf = document.getElementById("btn-l3-pdf-report");
  const btnExcel = document.getElementById("btn-l3-excel-upload");

  if (channel === "trendyol") {
    if (banner) {
      banner.className = "glass-card rounded-2xl p-4 border border-orange-500/60 bg-gradient-to-r from-orange-950/80 via-slate-900 to-amber-950/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-2xl transition-all";
    }
    if (badge) {
      badge.innerHTML = "🧡 Trendyol Canlı Mağaza Modu";
      badge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800/80 shadow-md";
    }
    if (btnIyzico) btnIyzico.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white cursor-pointer";
    if (btnTrendyol) btnTrendyol.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-lg shadow-orange-600/30 border border-orange-300/40 flex items-center gap-1.5 cursor-pointer";
    if (btnPdf) {
      btnPdf.innerHTML = "📄 TRENDYOL KARŞILAŞTIRMA PDF AL";
      btnPdf.className = "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 text-xs border border-orange-300/50 cursor-pointer";
    }
    if (btnExcel) btnExcel.classList.remove("hidden");
  } else {
    if (banner) {
      banner.className = "glass-card rounded-2xl p-4 border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-blue-950/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl transition-all";
    }
    if (badge) {
      badge.innerHTML = "🌐 iyzico Canlı Sitede";
      badge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/50";
    }
    if (btnIyzico) btnIyzico.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer";
    if (btnTrendyol) btnTrendyol.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white cursor-pointer";
    if (btnPdf) {
      btnPdf.innerHTML = "📄 İYZİCO KARŞILAŞTIRMA PDF AL";
      btnPdf.className = "bg-gradient-to-r from-sky-600 via-blue-600 to-sky-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 text-xs border border-sky-400/40 cursor-pointer";
    }
    if (btnExcel) btnExcel.classList.add("hidden");
  }
  renderLayer3Cards();
}

function openTrendyolExcelModal() {
  const modal = document.getElementById("trendyol-excel-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeTrendyolExcelModal() {
  const modal = document.getElementById("trendyol-excel-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function saveTrendyolPastedData() {
  const area = document.getElementById("trendyol-paste-area");
  const rawText = area ? area.value : "";
  if (!rawText.trim()) {
    alert("Lütfen Excel'den kopyaladığınız tablo verilerini yapıştırın.");
    return;
  }

  const lines = rawText.split("\n");
  const parsedItems = [];
  lines.forEach(line => {
    const parts = line.split("\t");
    if (parts.length >= 3) {
      const barcode = parts[0] ? parts[0].trim() : "";
      const title = parts[1] ? parts[1].trim() : "";
      const priceStr = parts[2] ? parts[2].trim().replace(",", ".") : "0";
      const price = parseFloat(priceStr);
      if (title && !isNaN(price) && price > 0 && !title.toLowerCase().includes("endora")) {
        parsedItems.push({ barcode, title, price, commissionPercent: 19.0 });
      }
    }
  });

  if (parsedItems.length > 0) {
    StorageManager.saveTrendyolCustomProducts(parsedItems);
    alert(`Tebrikler! ${parsedItems.length} adet Trendyol ürün fiyatı sisteme aktarıldı ve güncellendi.`);
    closeTrendyolExcelModal();
    setLayer3Channel("trendyol");
  } else {
    alert("Geçerli ürün verisi tespit edilemedi. Lütfen kopyaladığınız Excel sütunlarını kontrol edin.");
  }
}

function normalizeTr(str) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİI]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[çÇ]/g, "c")
    .replace(/yagyi|yagi|yayi|yağ|yag/g, "yag")
    .trim();
}

function getTrendyolFilteredCatalog() {
  if (typeof TRENDYOL_PRODUCTS_DATA === "undefined" || !Array.isArray(TRENDYOL_PRODUCTS_DATA)) return [];
  const storedCustom = StorageManager.getTrendyolCustomProducts();
  const catalog = (storedCustom && storedCustom.length > 0) ? storedCustom : TRENDYOL_PRODUCTS_DATA;
  
  // User Directive: Purge Endora products completely & keep ONLY Cansızzade products
  return catalog.filter(item => {
    if (!item || !item.title) return false;
    const t = item.title.toLowerCase();
    const u = (item.url || "").toLowerCase();

    // 1. Must NOT contain "endora" in title or URL
    if (t.includes("endora") || u.includes("endora")) return false;

    // 2. Must contain "cansizzade" or "cansızzade" in title or URL (or 100% doğallık kalıbı)
    const isCansizzade = t.includes("cansizzade") || t.includes("cansızzade") || u.includes("cansizzade") || t.includes("%100 dogal") || t.includes("%100 doğal");
    return isCansizzade;
  });
}

function matchVolumeStrict(title, normVol) {
  const t = title.toLowerCase();

  if (normVol === "5000ml" || normVol === "5kg") {
    return /(?:^|[^\d])(5000\s*ml|5\s*kg|5000\s*g|5000\s*gr|5\s*lt|5\s*litre)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "1000ml" || normVol === "1kg") {
    return /(?:^|[^\d])(1000\s*ml|1\s*kg|1000\s*g|1000\s*gr|1\s*lt|1\s*litre)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "500ml") {
    return /(?:^|[^\d])(500\s*ml|500\s*g|500\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "250ml") {
    return /(?:^|[^\d])(250\s*ml|250\s*g|250\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "150ml") {
    return /(?:^|[^\d])(150\s*ml|150\s*g|150\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "100ml") {
    return /(?:^|[^\d])(100\s*ml|100\s*g|100\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "50ml") {
    if (/(5000|500|250|150)\s*(ml|g|gr|kg)/i.test(t)) return false;
    return /(?:^|[^\d])(50\s*ml|50\s*g|50\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "30ml") {
    return /(?:^|[^\d])(30\s*ml|30\s*g|30\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "20ml") {
    return /(?:^|[^\d])(20\s*ml|20\s*g|20\s*gr)(?:[^\d]|$)/i.test(t);
  }
  if (normVol === "10ml") {
    return /(?:^|[^\d])(10\s*ml|10\s*g|10\s*gr)(?:[^\d]|$)/i.test(t);
  }
  return false;
}

function findTrendyolProduct(productName, volKey) {
  const catalog = getTrendyolFilteredCatalog();
  if (catalog.length === 0) return null;

  const normVol = (volKey || "").toLowerCase().trim();
  const normProdName = normalizeTr(productName);

  return catalog.find(item => {
    const itemTitle = normalizeTr(item.title);

    // 1. Core Oil Identity Match
    let nameMatch = false;

    if (normProdName.includes("aci badem") || (normProdName.includes("aci") && normProdName.includes("badem"))) {
      nameMatch = itemTitle.includes("aci") && itemTitle.includes("badem");
    } else if (normProdName.includes("badem")) {
      nameMatch = itemTitle.includes("badem") && !itemTitle.includes("aci");
    } else if (normProdName.includes("findik")) nameMatch = itemTitle.includes("findik");
    else if (normProdName.includes("ceviz")) nameMatch = itemTitle.includes("ceviz");
    else if (normProdName.includes("hint") && !normProdName.includes("hindistan")) nameMatch = itemTitle.includes("hint") && !itemTitle.includes("hindistan") && !itemTitle.includes("udi hindi");
    else if (normProdName.includes("hindistan")) nameMatch = itemTitle.includes("hindistan");
    else if (normProdName.includes("udi hindi")) nameMatch = itemTitle.includes("udi hindi") || itemTitle.includes("udi");
    else if (normProdName.includes("nioli")) nameMatch = itemTitle.includes("nioli");
    else if (normProdName.includes("incir")) nameMatch = itemTitle.includes("incir");
    else if (normProdName.includes("defne")) nameMatch = itemTitle.includes("defne");
    else if (normProdName.includes("kantaron")) nameMatch = itemTitle.includes("kantaron");
    else if (normProdName.includes("biberiye")) nameMatch = itemTitle.includes("biberiye");
    else if (normProdName.includes("lavanta")) nameMatch = itemTitle.includes("lavanta");
    else if (normProdName.includes("nane")) nameMatch = itemTitle.includes("nane");
    else if (normProdName.includes("okaliptus")) nameMatch = itemTitle.includes("okaliptus");
    else if (normProdName.includes("kekik")) nameMatch = itemTitle.includes("kekik");
    else if (normProdName.includes("karanfil")) nameMatch = itemTitle.includes("karanfil");
    else if (normProdName.includes("kayisi")) nameMatch = itemTitle.includes("kayisi");
    else if (normProdName.includes("kusburnu")) nameMatch = itemTitle.includes("kusburnu");
    else if (normProdName.includes("nar") && !normProdName.includes("kudret")) nameMatch = itemTitle.includes("nar") && !itemTitle.includes("kudret");
    else if (normProdName.includes("kudret")) nameMatch = itemTitle.includes("kudret");
    else if (normProdName.includes("kabak")) nameMatch = itemTitle.includes("kabak");
    else if (normProdName.includes("corek")) nameMatch = itemTitle.includes("corek");
    else if (normProdName.includes("susam")) nameMatch = itemTitle.includes("susam");
    else if (normProdName.includes("uzum")) nameMatch = itemTitle.includes("uzum");
    else if (normProdName.includes("at kestanesi")) nameMatch = itemTitle.includes("at kestanesi");
    else if (normProdName.includes("jojoba")) nameMatch = itemTitle.includes("jojoba");
    else if (normProdName.includes("chia")) nameMatch = itemTitle.includes("chia");
    else if (normProdName.includes("aynisefa")) nameMatch = itemTitle.includes("aynisefa") || itemTitle.includes("calendula");
    else if (normProdName.includes("kenevir")) nameMatch = itemTitle.includes("kenevir") || itemTitle.includes("kendir");
    else if (normProdName.includes("menengic")) nameMatch = itemTitle.includes("menengic") || itemTitle.includes("bittim");
    else if (normProdName.includes("hashas")) nameMatch = itemTitle.includes("hashas");
    else if (normProdName.includes("kakao")) nameMatch = itemTitle.includes("kakao");
    else if (normProdName.includes("argan")) nameMatch = itemTitle.includes("argan");
    else if (normProdName.includes("avokado")) nameMatch = itemTitle.includes("avokado");
    else if (normProdName.includes("sarimsak")) nameMatch = itemTitle.includes("sarimsak");
    else if (normProdName.includes("bamya")) nameMatch = itemTitle.includes("bamya");
    else if (normProdName.includes("deve dikeni")) nameMatch = itemTitle.includes("deve dikeni") || itemTitle.includes("de dikeni");
    else if (normProdName.includes("isirgan")) nameMatch = itemTitle.includes("isirgan");
    else if (normProdName.includes("bugday")) nameMatch = itemTitle.includes("bugday");
    else if (normProdName.includes("aspir")) nameMatch = itemTitle.includes("aspir");
    else if (normProdName.includes("uzerlik")) nameMatch = itemTitle.includes("uzerlik") || itemTitle.includes("ozerlik");
    else if (normProdName.includes("aloe")) nameMatch = itemTitle.includes("aloe") || itemTitle.includes("aloevera");
    else if (normProdName.includes("gliserin")) nameMatch = itemTitle.includes("gliserin") || itemTitle.includes("glycerol");
    else if (normProdName.includes("skualen") || normProdName.includes("squalene")) nameMatch = itemTitle.includes("skualen") || itemTitle.includes("squalene");
    else if (normProdName.includes("limon") && !normProdName.includes("limon otu")) nameMatch = itemTitle.includes("limon") && !itemTitle.includes("limon otu");
    else if (normProdName.includes("portakal")) nameMatch = itemTitle.includes("portakal");
    else if (normProdName.includes("bergamot")) nameMatch = itemTitle.includes("bergamot");
    else if (normProdName.includes("greyfurt")) nameMatch = itemTitle.includes("greyfurt");
    else if (normProdName.includes("zencefil")) nameMatch = itemTitle.includes("zencefil");
    else if (normProdName.includes("tarcin")) nameMatch = itemTitle.includes("tarcin");
    else if (normProdName.includes("havuc")) nameMatch = itemTitle.includes("havuc");
    else if (normProdName.includes("paculi")) nameMatch = itemTitle.includes("paculi");
    else if (normProdName.includes("palmarosa")) nameMatch = itemTitle.includes("palmarosa");
    else if (normProdName.includes("vanilya")) nameMatch = itemTitle.includes("vanilya");
    else if (normProdName.includes("citronella")) nameMatch = itemTitle.includes("citronella");
    else if (normProdName.includes("sedir")) nameMatch = itemTitle.includes("sedir");
    else if (normProdName.includes("cay agaci")) nameMatch = itemTitle.includes("cay agaci");
    else if (normProdName.includes("yasemin")) nameMatch = itemTitle.includes("yasemin");
    else if (normProdName.includes("mandalina")) nameMatch = itemTitle.includes("mandalina");
    else if (normProdName.includes("papatya")) nameMatch = itemTitle.includes("papatya");

    if (!nameMatch) return false;

    // 2. Strict Regex Volume Match
    return matchVolumeStrict(itemTitle, normVol);
  }) || null;
}

function updateLiveSitePriceOverride(productId, volKey, newPrice) {
  StorageManager.setSiteOverride(productId, volKey, newPrice);
  renderLayer3Cards();
}

function getLayer2EffectiveCostForVolume(product, volKey, dynamicOverheadPerKg) {
  const layer2SimMap = StorageManager.getLayer2SimData();
  const sim = layer2SimMap[product.id] || {};
  const prodMerged = { ...product, ...sim };

  const isMaceration = isMacerationOil(prodMerged);
  const isEssential = prodMerged.category === "Uçucu Yağlar";
  let supplyType = prodMerged.supplyType;
  if (isEssential && (!supplyType || supplyType === "press")) supplyType = "wholesale";
  if (!supplyType) supplyType = isEssential ? "wholesale" : "press";

  const initialCost = (prodMerged.initialCostPerKg !== undefined && prodMerged.initialCostPerKg !== null)
    ? parseFloat(prodMerged.initialCostPerKg)
    : (parseFloat(prodMerged.costPerKg) || 0);

  const currentWholesale = (prodMerged.wholesaleCostPerKg !== undefined && prodMerged.wholesaleCostPerKg !== null && !isNaN(parseFloat(prodMerged.wholesaleCostPerKg)) && parseFloat(prodMerged.wholesaleCostPerKg) > 0)
    ? parseFloat(prodMerged.wholesaleCostPerKg)
    : initialCost;

  const dipStatus = prodMerged.dipStatus || "none";
  const dipPercent = (prodMerged.dipPercent !== undefined && prodMerged.dipPercent !== null) ? parseFloat(prodMerged.dipPercent) : 0;
  const yieldPct = (prodMerged.yieldPercent !== undefined && prodMerged.yieldPercent !== null) 
    ? parseFloat(prodMerged.yieldPercent) 
    : (parseFloat(product.yieldPercent) || 0);
  const seedCost = (prodMerged.seedCostPerKg !== undefined && prodMerged.seedCostPerKg !== null) 
    ? parseFloat(prodMerged.seedCostPerKg) 
    : (parseFloat(product.seedCostPerKg) || 0);

  const herbCost = (prodMerged.herbCostPerKg !== undefined && prodMerged.herbCostPerKg !== null) 
    ? parseFloat(prodMerged.herbCostPerKg) 
    : (parseFloat(product.herbCostPerKg) || 0);
  const oliveOilCost = (prodMerged.oliveOilCostPerKg !== undefined && prodMerged.oliveOilCostPerKg !== null) 
    ? parseFloat(prodMerged.oliveOilCostPerKg) 
    : (parseFloat(product.oliveOilCostPerKg) || 240.00);

  const coldPressRes = !isMaceration ? PriceCalculator.calculateColdPressCost({
    seedCostPerKg: seedCost,
    yieldPercent: yieldPct,
    wholesaleCostPerKg: currentWholesale,
    supplyType: supplyType,
    dipStatus: dipStatus,
    dipPercent: dipPercent,
    fallbackCostPerKg: initialCost
  }) : null;

  const macerationRes = isMaceration ? PriceCalculator.calculateMacerationCost({
    herbCostPerKg: herbCost,
    oliveOilCostPerKg: oliveOilCost,
    herbRatioKg: prodMerged.herbRatioKg || 0.2,
    herbKg: prodMerged.herbKg,
    oilKg: prodMerged.oilKg,
    supplyType: supplyType,
    wholesaleCostPerKg: currentWholesale,
    fallbackCostPerKg: initialCost
  }) : null;

  const costPerKg = isMaceration ? macerationRes.netCostPerKg : coldPressRes.netCostPerKg;
  const hasOilData = costPerKg > 0;

  const ml = PriceCalculator.getVolumeMl(volKey);
  const volInKg = ml / 1000;
  const rawOilCost = hasOilData ? parseFloat((costPerKg * volInKg).toFixed(2)) : 0;

  const packCost = (typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[volKey] !== undefined)
    ? DEFAULT_PACKAGING_COSTS[volKey]
    : 14.50;

  const isWholesaleSupply = (supplyType === "wholesale");
  
  // Factory overhead calculation:
  // Tesis Payı: Sadece bizim sıktığımız yağlar için (isWholesaleSupply === false),
  // toptan dökme yağlar için 0.00 TL!
  const overheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
  const overheadRate = (dynamicOverheadPerKg !== undefined && dynamicOverheadPerKg !== null) ? dynamicOverheadPerKg : overheadRes.overheadPerKg;

  const overheadData = PriceCalculator.getOverheadForVolume(volKey, overheadRate, isWholesaleSupply);
  const linearOverhead = overheadData.linearVolumeOverhead;
  const laborAssemblyFee = overheadData.laborAssemblyFee;
  const totalOverhead = overheadData.totalOverhead;

  const inputVatRate = (prodMerged.inputVatRate !== undefined && prodMerged.inputVatRate !== null)
    ? parseFloat(prodMerged.inputVatRate)
    : (parseFloat(prodMerged.kdv) || (isEssential ? 20 : 1));
  const salesVatRate = parseFloat(prodMerged.kdv) || (isEssential ? 20 : 1);

  const netCost = hasOilData ? parseFloat((rawOilCost + packCost + totalOverhead).toFixed(2)) : 0;

  const taxProtection = PriceCalculator.calculateTaxNeutralBreakEvenCost({
    netCost: netCost,
    inputVatRate: inputVatRate,
    salesVatRate: salesVatRate,
    rawOilCost: rawOilCost,
    packCost: packCost,
    linearOverhead: linearOverhead,
    laborAssemblyFee: laborAssemblyFee
  });

  const effectiveNetCost = hasOilData ? taxProtection.taxNeutralBreakEvenCost : 0;
  const defaultProfit = (typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) ? StorageManager.getGlobalTargetProfit() : 70;
  const targetProfit = (prodMerged.layer2Profit !== undefined && prodMerged.layer2Profit !== null) ? parseFloat(prodMerged.layer2Profit) : defaultProfit;

  // Channel Calculations (iyzico & Trendyol)
  // iyzico: 4% commission, 82.50 TL cargo
  const iyzicoBreakEven = hasOilData ? PriceCalculator.calculateSystem1Channel({
    salesVatRate: salesVatRate,
    wholesaleCost: effectiveNetCost,
    targetProfit: 0,
    commission: 4,
    discount: 0,
    cargo: 82.50
  }) : { salePrice: 0, payout: 0, netProfit: 0 };

  const iyzicoRecommended = hasOilData ? PriceCalculator.calculateSystem1Channel({
    salesVatRate: salesVatRate,
    wholesaleCost: effectiveNetCost,
    targetProfit: targetProfit,
    commission: 4,
    discount: 0,
    cargo: 82.50
  }) : { salePrice: 0, payout: 0, netProfit: 0 };

  // Trendyol: 19% commission, 110.00 TL cargo
  const trendyolBreakEven = hasOilData ? PriceCalculator.calculateSystem1Channel({
    salesVatRate: salesVatRate,
    wholesaleCost: effectiveNetCost,
    targetProfit: 0,
    commission: 19,
    discount: 0,
    cargo: 110
  }) : { salePrice: 0, payout: 0, netProfit: 0 };

  const trendyolRecommended = hasOilData ? PriceCalculator.calculateSystem1Channel({
    salesVatRate: salesVatRate,
    wholesaleCost: effectiveNetCost,
    targetProfit: targetProfit,
    commission: 19,
    discount: 0,
    cargo: 110
  }) : { salePrice: 0, payout: 0, netProfit: 0 };

  return {
    costPerKg,
    hasOilData,
    volInKg,
    rawOilCost,
    packCost,
    linearOverhead,
    laborAssemblyFee,
    totalOverhead,
    netCost,
    effectiveNetCost,
    targetProfit,
    inputVatRate,
    salesVatRate,
    iyzicoBreakEven,
    iyzicoRecommended,
    trendyolBreakEven,
    trendyolRecommended
  };
}

function getPlatformLivePrice(channel, product, volKey) {
  const ch = channel || "iyzico";
  const override = StorageManager.getChannelSiteOverride(ch, product.id, volKey);
  if (override !== null && !isNaN(parseFloat(override)) && parseFloat(override) > 0) {
    return { price: parseFloat(override), isOverride: true, url: null };
  }
  if (ch === "trendyol") {
    const tyMatch = findTrendyolProduct(product.name, volKey);
    if (tyMatch && tyMatch.price > 0) {
      return { price: tyMatch.price, isOverride: false, url: tyMatch.url || null, barcode: tyMatch.barcode || null, item: tyMatch };
    }
  } else {
    const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
    if (siteData && siteData.samplePrices && typeof siteData.samplePrices[volKey] === "number" && siteData.samplePrices[volKey] > 0) {
      const u = (siteData.urls && siteData.urls[volKey]) ? siteData.urls[volKey] : (siteData.url || null);
      return { price: siteData.samplePrices[volKey], isOverride: false, url: u };
    }
  }
  return { price: null, isOverride: false, url: null };
}

function handleLayer2LivePriceTest(productId, volKey, newPrice) {
  const ch = currentLayer3Channel || "iyzico";
  StorageManager.setChannelSiteOverride(ch, productId, volKey, newPrice);
  renderLayer3Cards();
  if (typeof showToast !== "undefined") {
    if (newPrice && !isNaN(parseFloat(newPrice)) && parseFloat(newPrice) > 0) {
      showToast(`⚡ ${ch.toUpperCase()} (${volKey}) test fiyatı ${PriceCalculator.formatTL(parseFloat(newPrice))} ₺ olarak güncellendi.`);
    } else {
      showToast(`↺ ${volKey} test fiyatı sıfırlandı, orijinal mağaza fiyatına dönüldü.`);
    }
  }
}

function renderLayer3Cards() {
  const container = document.getElementById("layer3-product-grid");
  if (!container) return;
  container.innerHTML = "";

  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  const dynamicOverheadPerKg = overheadRes.overheadPerKg;

  let totalScrapedMatchCount = 0;

  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }

  const allVols = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];

  // Calculate dynamic channel product counts
  let tyMatchCount = 0;
  let iyzicoMatchCount = 0;

  productsArr.forEach(prod => {
    if (!prod || !prod.name) return;
    const hasTy = allVols.some(vk => {
      const lp = getPlatformLivePrice("trendyol", prod, vk);
      return lp.price !== null && lp.price > 0;
    });
    if (hasTy) tyMatchCount++;

    const hasIyzico = allVols.some(vk => {
      const lp = getPlatformLivePrice("iyzico", prod, vk);
      return lp.price !== null && lp.price > 0;
    });
    if (hasIyzico) iyzicoMatchCount++;
  });

  const btnIyzico = document.getElementById("btn-l3-channel-iyzico");
  if (btnIyzico) btnIyzico.innerHTML = `🌐 iyzico (${iyzicoMatchCount} Ürün)`;

  const btnTrendyol = document.getElementById("btn-l3-channel-trendyol");
  if (btnTrendyol) btnTrendyol.innerHTML = `🧡 Trendyol (${tyMatchCount} Ürün)`;

  // Build Unified Products List for Katman 2
  let displayList = [];
  productsArr.forEach(prod => {
    if (!prod || !prod.name) return;
    if (activeCategory !== "all" && prod.category !== activeCategory) return;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(prod.name || "").toLowerCase().includes(q) && !(prod.sku || "").toLowerCase().includes(q)) return;
    }
    displayList.push(prod);
  });

  // Sort display list: products with active live price on this channel first, then alphabetical
  const sortedDisplayList = displayList.sort((a, b) => {
    const aHasLive = allVols.some(vk => {
      const lp = getPlatformLivePrice(currentLayer3Channel, a, vk);
      return lp.price !== null && lp.price > 0;
    });
    const bHasLive = allVols.some(vk => {
      const lp = getPlatformLivePrice(currentLayer3Channel, b, vk);
      return lp.price !== null && lp.price > 0;
    });
    if (aHasLive && !bHasLive) return -1;
    if (!aHasLive && bHasLive) return 1;
    return (a.name || "").localeCompare(b.name || "", "tr");
  });

  sortedDisplayList.forEach(product => {
    // Determine active volume: prioritize user selection from Katman 1 or Katman 2 card
    let prefVolKey = cardActiveVolumes[product.id] || product.layer2Volume || product.defaultVolume || "1000ml";
    if (!allVols.includes(prefVolKey)) prefVolKey = "1000ml";
    let activeVolKey = prefVolKey;
    cardActiveVolumes[product.id] = activeVolKey;

    // --- Dynamic Katman 1 Recommended Price, Break-Even & Effective Net Cost Calculation ---
    const activeCalc = getLayer2EffectiveCostForVolume(product, activeVolKey, dynamicOverheadPerKg);
    const activeEffectiveNetCost = activeCalc.effectiveNetCost;

    const channelRec = currentLayer3Channel === "trendyol" ? activeCalc.trendyolRecommended : activeCalc.iyzicoRecommended;
    const channelBreakEven = currentLayer3Channel === "trendyol" ? activeCalc.trendyolBreakEven : activeCalc.iyzicoBreakEven;

    const systemRecommendedPrice = isLayer3DipFiyatMode ? channelBreakEven.salePrice : channelRec.salePrice;
    const systemBreakEvenPrice = channelBreakEven.salePrice; // Platforma Özel 0 ₺ Kârlı Başa Baş Saf Maliyet

    // Live Price Discovery
    const livePriceInfo = getPlatformLivePrice(currentLayer3Channel, product, activeVolKey);
    const hasLivePrice = livePriceInfo.price !== null && livePriceInfo.price > 0;
    const activeLivePrice = hasLivePrice ? livePriceInfo.price : null;
    const siteUrl = livePriceInfo.url || (currentLayer3Channel === "trendyol" ? "https://www.trendyol.com/magaza/cansizzade-m-108253" : "https://www.cansizzadeyag.com/");

    if (hasLivePrice) totalScrapedMatchCount++;

    const commRate = currentLayer3Channel === "trendyol" ? 0.19 : 0.04;
    const cargoFee = currentLayer3Channel === "trendyol" ? 110.00 : 82.50;

    let netProfit = 0;
    let netProfitMarginHtml = `<span class="font-bold text-slate-500 text-xs">Fiyat Yok</span>`;
    let statusBadgeHtml = `<span class="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">⚪ Canlı Yok</span>`;

    if (!activeCalc.hasOilData) {
      netProfitMarginHtml = `<span class="font-bold text-amber-400 text-xs" title="Hammadde verisi bekleniyor">Veri Bekleniyor</span>`;
      statusBadgeHtml = `<span class="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded font-bold">Veri Yok</span>`;
    } else if (hasLivePrice) {
      const payout = activeLivePrice * (1 - commRate) - cargoFee;
      netProfit = parseFloat((payout - activeEffectiveNetCost).toFixed(2));

      if (activeLivePrice < systemBreakEvenPrice) {
        netProfitMarginHtml = `<span class="font-black text-rose-400 text-xs tabular-nums animate-pulse">${PriceCalculator.formatTL(netProfit)} ₺ 🔴</span>`;
        statusBadgeHtml = `<span class="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-black animate-pulse" title="Platform başa baş saf maliyetinin altında!">🔴 ZARARDA</span>`;
      } else if (Math.abs(activeLivePrice - systemBreakEvenPrice) < 0.5) {
        netProfitMarginHtml = `<span class="font-bold text-slate-300 text-xs tabular-nums">0,00 ₺</span>`;
        statusBadgeHtml = `<span class="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded font-bold">⚪ BAŞA BAŞ</span>`;
      } else if (activeLivePrice >= systemRecommendedPrice) {
        const priceDiff = activeLivePrice - systemRecommendedPrice;
        netProfitMarginHtml = `<span class="font-black text-emerald-400 text-xs tabular-nums">+${PriceCalculator.formatTL(netProfit)} ₺ 🟢</span>`;
        statusBadgeHtml = `<span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-extrabold" title="Katman 1 önerilen hedef kârın üzerinde (+${PriceCalculator.formatTL(priceDiff)} ₺)">🟢 HEDEF ÜSTÜ</span>`;
      } else {
        netProfitMarginHtml = `<span class="font-black text-amber-400 text-xs tabular-nums">+${PriceCalculator.formatTL(netProfit)} ₺</span>`;
        statusBadgeHtml = `<span class="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold" title="Kârlı ancak Katman 1 hedefinin altında">🟡 KÂRLI</span>`;
      }
    }

    const isUcucu = product.category === "Uçucu Yağlar";
    const catBadge = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    const isExpanded = expandedCards[product.id] || false;

    // Accordion Table HTML for ALL 10 Standard Volumes
    let accordionHtml = "";
    if (isExpanded) {
      let rowsHtml = "";
      allVols.forEach(vKey => {
        const vCalc = getLayer2EffectiveCostForVolume(product, vKey, dynamicOverheadPerKg);
        const vEffectiveNetCost = vCalc.effectiveNetCost;

        const vChannelRec = currentLayer3Channel === "trendyol" ? vCalc.trendyolRecommended : vCalc.iyzicoRecommended;
        const vChannelBreakEven = currentLayer3Channel === "trendyol" ? vCalc.trendyolBreakEven : vCalc.iyzicoBreakEven;

        const vRecommendedPrice = isLayer3DipFiyatMode ? vChannelBreakEven.salePrice : vChannelRec.salePrice;
        const vBreakEvenPrice = vChannelBreakEven.salePrice;

        const vLiveInfo = getPlatformLivePrice(currentLayer3Channel, product, vKey);
        const vHasPrice = vLiveInfo.price !== null && vLiveInfo.price > 0;
        const vLivePrice = vHasPrice ? vLiveInfo.price : null;
        const vRowUrl = vLiveInfo.url || siteUrl;

        let vNetMarginHtml = `<span class="text-slate-500 font-bold">Fiyat Yok</span>`;
        let vPriceDiffBadge = `<span class="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">⚪ Canlı Yok</span>`;

        if (!vCalc.hasOilData) {
          vNetMarginHtml = `<span class="text-amber-400 font-bold text-[11px]">Veri Bekleniyor</span>`;
          vPriceDiffBadge = `<span class="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">Veri Yok</span>`;
        } else if (vHasPrice) {
          const vPayout = vLivePrice * (1 - commRate) - cargoFee;
          const vMargin = parseFloat((vPayout - vEffectiveNetCost).toFixed(2));

          if (vMargin >= 0) {
            vNetMarginHtml = `<span class="text-emerald-400 font-black tabular-nums">+${PriceCalculator.formatTL(vMargin)} ₺</span>`;
          } else {
            vNetMarginHtml = `<span class="text-rose-400 font-black tabular-nums">${PriceCalculator.formatTL(vMargin)} ₺ 🔴</span>`;
          }

          if (vLivePrice < vBreakEvenPrice) {
            vPriceDiffBadge = `
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-black animate-pulse" title="Platform başa baş saf maliyetinin altında!">🔴 ZARARDA (${PriceCalculator.formatTL(vMargin)} ₺)</span>
                <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net Kâr Hesap Dökümü Faturası">
                  🧮 Döküm
                </button>
              </div>`;
          } else if (vLivePrice >= vRecommendedPrice) {
            const priceDiff = vLivePrice - vRecommendedPrice;
            vPriceDiffBadge = `
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-extrabold" title="Canlı fiyat Katman 1 Önerilen Fiyatının +${PriceCalculator.formatTL(priceDiff)} ₺ üzerinde">🟢 Hedef Üstü (+${PriceCalculator.formatTL(priceDiff)})</span>
                <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net Kâr Hesap Dökümü Faturası">
                  🧮 Döküm
                </button>
              </div>`;
          } else {
            vPriceDiffBadge = `
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold" title="Kârlı ancak Katman 1 hedefinin altında">🟡 Kârlı</span>
                <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net Kâr Hesap Dökümü Faturası">
                  🧮 Döküm
                </button>
              </div>`;
          }
        }

        rowsHtml += `
          <tr class="hover:bg-slate-900/60 transition-colors ${vKey === activeVolKey ? (currentLayer3Channel === 'trendyol' ? 'bg-orange-950/30 font-bold' : 'bg-sky-950/30 font-bold') : ''}">
            <td class="p-2 font-bold text-slate-200 border-b border-slate-800/50">
              <button onclick="updateCardVolume('${product.id}', '${vKey}')" class="hover:underline text-left cursor-pointer flex items-center gap-1" title="${vKey} ön izlemesine geç">
                <span>${vKey}</span>
                ${vKey === activeVolKey ? '<span class="text-amber-400 font-extrabold">📌</span>' : ''}
              </button>
            </td>
            <td class="p-2 border-b border-slate-800/50 font-black text-rose-400 tabular-nums text-sm" title="Platform başa baş maliyeti (0 ₺ kâr)">
              🏭 ${vCalc.hasOilData ? PriceCalculator.formatTL(vBreakEvenPrice) + ' ₺' : '--'}
            </td>
            <td class="p-2 border-b border-slate-800/50 font-black ${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'} tabular-nums text-sm">
              <div class="flex items-center gap-1.5">
                <span>${vHasPrice ? PriceCalculator.formatTL(vLivePrice) + ' ₺' : '⚪ Yok'}</span>
                ${vHasPrice ? `
                  <a href="${vRowUrl}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/60 transition-all text-xs inline-flex items-center justify-center shadow-sm" title="${vKey} Canlı Mağaza Bağlantısına Git">
                    <svg class="w-3.5 h-3.5 text-amber-400 hover:text-amber-300" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                  </a>
                ` : ''}
              </div>
            </td>
            <td class="p-2 border-b border-slate-800/50 font-black text-amber-400 tabular-nums text-sm">
              🎯 ${vCalc.hasOilData ? PriceCalculator.formatTL(vRecommendedPrice) + ' ₺' : '--'}
            </td>
            <td class="p-2 text-slate-300 font-semibold tabular-nums border-b border-slate-800/50">
              ${vCalc.hasOilData ? PriceCalculator.formatTL(vEffectiveNetCost) + ' ₺' : '--'}
            </td>
            <td class="p-2 border-b border-slate-800/50 tabular-nums">${vNetMarginHtml}</td>
            <td class="p-2 border-b border-slate-800/50">${vPriceDiffBadge}</td>
          </tr>
        `;
      });

      accordionHtml = `
        <div class="mt-3 pt-3 border-t border-slate-800/80 bg-[#0e172a] rounded-xl p-3 animate-fadeIn">
          <div class="text-xs font-bold text-slate-200 mb-2 flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center gap-1.5">📊 <span class="text-white font-extrabold">${product.name}</span> - Tüm Ambalaj Boyutlarında Fiyat & Maliyet Tablosu (${currentLayer3Channel.toUpperCase()})</span>
            <span class="text-[11px] text-slate-400 font-normal">Herhangi bir boyuta tıklayarak ana karta seçebilirsiniz.</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-slate-900/90">
                  <th class="p-2">Satılan Ambalaj</th>
                  <th class="p-2 text-rose-400 font-extrabold">🏭 Platform Saf Maliyeti (0 ₺ Kâr)</th>
                  <th class="p-2 ${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'}">🛒 ${currentLayer3Channel === 'trendyol' ? 'Trendyol Canlı' : 'iyzico Canlı'}</th>
                  <th class="p-2 text-amber-400 font-extrabold">🎯 Katman 1 Önerilen (+${activeCalc.targetProfit} ₺)</th>
                  <th class="p-2 text-slate-300">🏭 Fabrika Saf Maliyet</th>
                  <th class="p-2 text-emerald-400">💰 Canlı Net Kâr</th>
                  <th class="p-2">📊 Karşılaştırma Durumu</th>
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

    const cardTheme = "border-slate-800/80 hover:border-slate-700 bg-[#111a2e]";

    const cardHtml = `
      <div class="glass-card rounded-xl p-3 border ${cardTheme} transition-all shadow-sm hover:shadow-md group flex flex-col gap-2">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <!-- 1. Sol Bölüm: Ürün Başlığı, SKU, Kategori & İnteraktif Ambalaj Dropdown -->
          <div class="flex items-center gap-3 w-full lg:w-3/12 min-w-[200px]">
            <span class="font-mono text-xs font-bold text-slate-300 bg-[#0e172a] px-2.5 py-1 rounded-lg border border-slate-700/80 shrink-0 shadow-sm">
              ${product.sku}
            </span>
            <div class="truncate">
              <h3 class="text-sm font-bold text-white group-hover:text-slate-200 transition-colors truncate" title="${product.name}">
                ${product.name}
              </h3>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catBadge}">
                  ${product.category}
                </span>
                <label class="text-[10px] font-medium text-slate-300 bg-[#0e172a] px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1 shadow-sm cursor-pointer hover:border-slate-700">
                  <span class="text-slate-400">📌 Ambalaj:</span>
                  <select onchange="updateCardVolume('${product.id}', this.value)" class="bg-transparent text-amber-400 font-extrabold text-xs cursor-pointer focus:outline-none">
                    ${allVols.map(vk => {
                      const lp = getPlatformLivePrice(currentLayer3Channel, product, vk);
                      const tag = (lp.price !== null && lp.price > 0) ? ` (🛒 ${PriceCalculator.formatTL(lp.price)} ₺)` : '';
                      return `<option value="${vk}" ${vk === activeVolKey ? 'selected' : ''} class="bg-slate-900 text-white">${vk}${tag}</option>`;
                    }).join("")}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <!-- 2. Orta Bölüm: 5 Sütunlu Canlı Kâr/Zarar ve Platform Başa Baş Hesaplayıcı Çubuğu -->
          <div class="grid grid-cols-5 gap-1.5 w-full lg:w-7/12 items-center bg-[#0b1325] px-2.5 py-2 rounded-xl border border-slate-800 text-xs shadow-inner">
            
            <!-- Sütun 1: Platform Başa Baş Saf Maliyeti (0 ₺ Kâr) -->
            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold text-rose-300 block leading-tight" title="${currentLayer3Channel === 'trendyol' ? 'Trendyol (%19 Komisyon + 110 ₺ Kargo) Dahil 0 ₺ Kâr Başa Baş Fiyatı' : 'iyzico (%4 Komisyon + 82.50 ₺ Kargo) Dahil 0 ₺ Kâr Başa Baş Fiyatı'}">
                🏭 Platform Saf Maliyet
              </span>
              <span class="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">(0 ₺ Kâr Başa Baş)</span>
              <span class="font-extrabold text-rose-400 text-xs block mt-1 tabular-nums">
                ${activeCalc.hasOilData ? PriceCalculator.formatTL(systemBreakEvenPrice) + ' ₺' : 'Veri Yok'}
              </span>
            </div>

            <!-- Sütun 2: Canlı Satış Fiyatı (İnteraktif Test Kutusu) -->
            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold ${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'} block leading-tight">
                🛒 Canlı Satış Fiyatı
              </span>
              <span class="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">${currentLayer3Channel === 'trendyol' ? 'Trendyol' : 'iyzico'}</span>
              <div class="flex items-center justify-center gap-1 mt-1">
                <input type="number" 
                       step="5"
                       min="0"
                       value="${hasLivePrice ? livePriceInfo.price : ''}"
                       placeholder="${hasLivePrice ? PriceCalculator.formatTL(livePriceInfo.price) : 'Fiyat'}"
                       onchange="handleLayer2LivePriceTest('${product.id}', '${activeVolKey}', this.value)"
                       class="w-16 bg-slate-900 border ${livePriceInfo.isOverride ? 'border-amber-500 text-amber-300 font-extrabold' : 'border-slate-700 text-slate-100 font-bold'} rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:border-sky-500 shadow-inner"
                       title="Canlı satış fiyatı (Anlık test için farklı bir fiyat yazıp Enter'a basabilirsiniz)">
                <span class="text-[10px] font-bold text-slate-400">₺</span>
                ${livePriceInfo.isOverride ? `
                  <button onclick="handleLayer2LivePriceTest('${product.id}', '${activeVolKey}', '')" title="Canlı mağaza fiyatına geri dön" class="text-[11px] text-amber-400 hover:text-white px-0.5 cursor-pointer font-bold">↺</button>
                ` : ''}
              </div>
            </div>

            <!-- Sütun 3: Katman 1 Önerilen Fiyatı -->
            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold text-amber-300 block leading-tight" title="Katman 1'de belirlenen ${activeCalc.targetProfit} ₺ hedef net kâr eklenmiş önerilen satış fiyatı">
                🎯 Katman 1 Önerilen
              </span>
              <span class="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">(+${activeCalc.targetProfit} ₺ Hedef)</span>
              <span class="font-black text-amber-400 text-xs block mt-1 tabular-nums">
                ${activeCalc.hasOilData ? PriceCalculator.formatTL(systemRecommendedPrice) + ' ₺' : 'Veri Yok'}
              </span>
            </div>

            <!-- Sütun 4: Canlı Net Kâr / Zarar -->
            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold text-slate-300 block leading-tight" title="Banka Hakedişi - Saf Fabrika Maliyeti">
                💰 Canlı Net Kâr
              </span>
              <span class="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">(Hakediş - Maliyet)</span>
              <span class="text-xs font-black block mt-1 tabular-nums">
                ${netProfitMarginHtml}
              </span>
            </div>

            <!-- Sütun 5: Durum & Karşılaştırma -->
            <div class="text-center">
              <span class="text-[10px] font-bold text-slate-300 block leading-tight">
                📊 Durum
              </span>
              <div class="mt-1 flex items-center justify-center">
                ${statusBadgeHtml}
              </div>
            </div>

          </div>

          <!-- 3. Sağ Bölüm: Aksiyon Butonları -->
          <div class="flex items-center justify-end gap-2 w-full lg:w-auto shrink-0">
            <button onclick="toggleCardAccordion('${product.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1 ${isExpanded ? 'bg-slate-800 text-white border border-slate-600' : 'bg-[#16223b] text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800'}">
              <span>📊 Tüm Boyutlar ${isExpanded ? '▲' : '▼'}</span>
            </button>

            <button onclick="openLayer3CalculationModal('${product.id}', '${activeVolKey}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1" title="${activeVolKey} Net Kâr Hesap Dökümü Faturası">
              🧮 Döküm
            </button>

            <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-[#16223b] text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all text-xs flex items-center justify-center shadow-sm" title="Mağaza Bağlantısı 🔗">
              <svg class="w-4 h-4 text-zinc-300 hover:text-white transition-colors" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
            </a>
          </div>

        </div>

        <!-- Accordion Table for ALL 10 Volumes -->
        ${accordionHtml}
      </div>
    `;

    container.insertAdjacentHTML("beforeend", cardHtml);
  });

  const scrapedBadge = document.getElementById("l3-stat-total-scraped");
  if (scrapedBadge) {
    scrapedBadge.innerText = `${totalScrapedMatchCount} Ürün Eşleşti`;
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

let operatorVatSearchQuery = "";
let operatorVatFilterCategory = "all"; // "all" or "mismatch"

function switchOperatorTab(tab) {
  const tabOverhead = document.getElementById("operator-tab-overhead");
  const tabTiers = document.getElementById("operator-tab-tiers");
  const tabVat = document.getElementById("operator-tab-vat");

  const btnOverhead = document.getElementById("tab-btn-operator-overhead");
  const btnTiers = document.getElementById("tab-btn-operator-tiers");
  const btnVat = document.getElementById("tab-btn-operator-vat");

  const inactiveBtnClass = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white";

  if (tabOverhead) tabOverhead.classList.add("hidden");
  if (tabTiers) tabTiers.classList.add("hidden");
  if (tabVat) tabVat.classList.add("hidden");

  if (btnOverhead) btnOverhead.className = inactiveBtnClass;
  if (btnTiers) btnTiers.className = inactiveBtnClass;
  if (btnVat) btnVat.className = inactiveBtnClass;

  if (tab === "overhead") {
    if (tabOverhead) tabOverhead.classList.remove("hidden");
    if (btnOverhead) btnOverhead.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-teal-700 to-emerald-600 text-white shadow-md";
  } else if (tab === "tiers") {
    if (tabTiers) tabTiers.classList.remove("hidden");
    if (btnTiers) btnTiers.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-sky-700 to-blue-600 text-white shadow-md";
  } else if (tab === "vat") {
    if (tabVat) tabVat.classList.remove("hidden");
    if (btnVat) btnVat.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-md";
    renderOperatorVatList();
  }
}

function filterOperatorVatCategory(cat) {
  operatorVatFilterCategory = cat;
  const btnAll = document.getElementById("btn-vat-filter-all");
  const btnMismatch = document.getElementById("btn-vat-filter-mismatch");
  if (cat === 'all') {
    if (btnAll) btnAll.className = "px-2 py-1 bg-sky-600 text-white rounded font-bold shadow-sm";
    if (btnMismatch) btnMismatch.className = "px-2 py-1 bg-slate-800 text-amber-300 rounded font-bold hover:bg-amber-950 border border-amber-800/80";
  } else {
    if (btnAll) btnAll.className = "px-2 py-1 bg-slate-800 text-slate-200 rounded font-bold hover:bg-slate-700";
    if (btnMismatch) btnMismatch.className = "px-2 py-1 bg-amber-600 text-white rounded font-bold shadow-sm border border-amber-500";
  }
  renderOperatorVatList();
}

function renderOperatorVatList() {
  const container = document.getElementById("operator-vat-list-container");
  if (!container) return;

  const searchInput = document.getElementById("operator-vat-search");
  if (searchInput) operatorVatSearchQuery = searchInput.value.toLowerCase().trim();

  let productsMap = StorageManager.getProducts();
  let productsArr = Object.values(productsMap);

  if (operatorVatSearchQuery) {
    productsArr = productsArr.filter(p => (p.name || "").toLowerCase().includes(operatorVatSearchQuery) || (p.sku || "").toLowerCase().includes(operatorVatSearchQuery));
  }

  if (operatorVatFilterCategory === "mismatch") {
    productsArr = productsArr.filter(p => {
      const inputVat = p.inputVatRate !== undefined ? p.inputVatRate : (p.category === "Sabit Yağlar" ? 1 : 20);
      const salesVat = p.kdv !== undefined ? p.kdv : (p.vatRate !== undefined ? p.vatRate : 20);
      return inputVat === 1 && salesVat === 20;
    });
  }

  if (productsArr.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs font-semibold">Aramanıza uygun ürün bulunamadı.</div>`;
    return;
  }

  let html = productsArr.map(p => {
    const inputVat = p.inputVatRate !== undefined ? p.inputVatRate : (p.category === "Sabit Yağlar" ? 1 : 20);
    const salesVat = p.kdv !== undefined ? p.kdv : (p.vatRate !== undefined ? p.vatRate : 20);
    const hasMismatch = inputVat === 1 && salesVat === 20;

    return `
      <div class="bg-slate-950 p-2.5 rounded-xl border ${hasMismatch ? 'border-amber-500/60 bg-amber-950/10' : 'border-slate-800'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div class="truncate">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10.5px] text-slate-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${p.sku}</span>
            <span class="font-extrabold text-slate-100 truncate">${p.name}</span>
          </div>
          <div class="text-[10.5px] text-slate-400 mt-0.5">${p.category}</div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <div class="flex items-center gap-1">
            <span class="text-[10px] text-amber-400 font-bold">Alış KDV:</span>
            <select onchange="updateProductInputVat('${p.id}', this.value)" class="bg-slate-900 text-amber-300 font-bold border border-amber-800 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer">
              <option value="1" ${inputVat === 1 ? 'selected' : ''}>%1 Alış</option>
              <option value="20" ${inputVat === 20 ? 'selected' : ''}>%20 Alış</option>
            </select>
          </div>

          <span class="text-slate-600 font-bold">➔</span>

          <div class="flex items-center gap-1">
            <span class="text-[10px] text-emerald-400 font-bold">Satış KDV:</span>
            <select onchange="updateProductSalesVat('${p.id}', this.value)" class="bg-slate-900 text-emerald-300 font-bold border border-emerald-800 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer">
              <option value="1" ${salesVat === 1 ? 'selected' : ''}>%1 Satış</option>
              <option value="20" ${salesVat === 20 ? 'selected' : ''}>%20 Satış</option>
            </select>
          </div>

          <div class="hidden md:block pl-2">
            ${hasMismatch ? `
              <span class="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-300 rounded border border-amber-800 font-bold">🛡️ KDV Farkı Var</span>
            ` : `
              <span class="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">⚖️ Dengeli</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

async function updateProductInputVat(productId, newInVatStr) {
  const newInVat = parseInt(newInVatStr, 10);
  let productsMap = StorageManager.getProducts();
  if (productsMap[productId]) {
    productsMap[productId].inputVatRate = newInVat;
    await StorageManager.saveProduct(productsMap[productId]);
    currentProducts = StorageManager.getProducts();
    if (typeof renderLayer2Cards === "function") renderLayer2Cards();
    if (typeof renderProductGrid === "function" && currentLayerMode === 3) renderProductGrid();
    showToast(`✅ ${productsMap[productId].name} Alış KDV'si %${newInVat} Yapıldı!`);
  }
}

async function updateProductSalesVat(productId, newSalesVatStr) {
  const newSalesVat = parseInt(newSalesVatStr, 10);
  let productsMap = StorageManager.getProducts();
  if (productsMap[productId]) {
    productsMap[productId].kdv = newSalesVat;
    productsMap[productId].vatRate = newSalesVat;
    await StorageManager.saveProduct(productsMap[productId]);
    currentProducts = StorageManager.getProducts();
    if (typeof renderLayer2Cards === "function") renderLayer2Cards();
    if (typeof renderProductGrid === "function" && currentLayerMode === 3) renderProductGrid();
    showToast(`✅ ${productsMap[productId].name} Satış Fatura KDV'si %${newSalesVat} Yapıldı!`);
  }
}

function saveOperatorSettingsModal() {
  saveFactoryOverheadModal();
  saveWholesaleTiersModal();
  closeOperatorSettingsModal();
  showToast("Operatör ayarları ve KDV parametreleri başarıyla kaydedildi! ⚙️✅", "success");
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
    if (btnDrums) btnDrums.className = "px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5";
  }

  renderLayer2Cards();
}

function getLayer2VolumeOptionsHtml(vol, product) {
  const tiers = StorageManager.getWholesaleTiers();
  if (layer2GroupMode === "wholesale_drums") {
    return `
      <option value="10KG" ${vol === "10KG" ? "selected" : ""}>10 KG (2 Adet 5 KG Bidon | %${tiers.tier1?.discount ?? 5} İsk.)</option>
      <option value="30KG" ${vol === "30KG" ? "selected" : ""}>30 KG (1 Adet 25 KG + 1 Adet 5 KG Bidon | %${tiers.tier1?.discount ?? 5} İsk.)</option>
      <option value="100KG" ${vol === "100KG" ? "selected" : ""}>100 KG (4 Adet 25 KG Sanayi Bidonu | %${tiers.tier2?.discount ?? 10} İsk.)</option>
      <option value="250KG" ${vol === "250KG" ? "selected" : ""}>250 KG (10 Adet 25 KG Sanayi Bidonu | %${tiers.tier4?.discount ?? 20} İsk.)</option>
    `;
  }

  const allVols = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];

  const volLabels = {
    "10ml": "10 ml",
    "20ml": "20 ml",
    "30ml": "30 ml",
    "50ml": "50 ml",
    "100ml": "100 ml",
    "150ml": "150 ml",
    "250ml": "250 ml",
    "500ml": "500 ml",
    "1000ml": "1000 ml (1 KG)",
    "5000ml": "5000 ml (5 KG)"
  };

  return allVols.map(v => {
    const label = volLabels[v] || v;
    return `<option value="${v}" ${vol === v ? "selected" : ""}>${label}</option>`;
  }).join("");
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

    const layer2SimMap = StorageManager.getLayer2SimData();

    const productsListRaw = Object.values(productsMap).filter(p => {
      if (!p || typeof p.name !== "string" || typeof p.sku !== "string") return false;
      const matchesCat = (currentCat === "all" || currentCat === "ALL") || (p.category === currentCat);
      const pName = (p.name || "").toLowerCase();
      const pSku = (p.sku || "").toLowerCase();
      const matchesSearch = !currentSearch || pName.includes(currentSearch) || pSku.includes(currentSearch);
      return matchesCat && matchesSearch;
    }).map(masterProd => {
      const sim = layer2SimMap[masterProd.id] || {};
      return {
        ...masterProd,
        ...sim
      };
    });

    const productsList = sortProductsByCategoryAndName(productsListRaw);

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
          const validVolumes = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];
          if (!vol || !validVolumes.includes(vol)) {
            vol = "1000ml";
          }
          const ml = PriceCalculator.getVolumeMl(vol);
          kg = ml / 1000;
        }

        const defaultProfit = (typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) ? StorageManager.getGlobalTargetProfit() : 70;
        const targetProfitInput = (product.layer2Profit !== undefined && product.layer2Profit !== null) ? product.layer2Profit : defaultProfit;
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

        const yieldPct = (product.yieldPercent !== undefined && product.yieldPercent !== null) ? product.yieldPercent : 0;
        const seedCost = (product.seedCostPerKg !== undefined && product.seedCostPerKg !== null)
          ? product.seedCostPerKg
          : 0;

        const herbCost = (product.herbCostPerKg !== undefined && product.herbCostPerKg !== null) ? product.herbCostPerKg : 0;
        const oliveOilCost = (product.oliveOilCostPerKg !== undefined && product.oliveOilCostPerKg !== null) ? product.oliveOilCostPerKg : 240.00;
        const kdvRate = product.kdv || (product.category === "Uçucu Yağlar" ? 20 : 1);
        const initialCost = product.initialCostPerKg !== undefined ? product.initialCostPerKg : (product.costPerKg || 0);
        const initialSeedCost = product.initialSeedCostPerKg || 0;
        const initialYield = product.initialYieldPercent !== undefined ? product.initialYieldPercent : 0;
        const initialHerbCost = product.initialHerbCostPerKg || 0;
        const initialOliveOilCost = product.initialOliveOilCostPerKg || 240.00;

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
          wholesaleCostPerKg: currentWholesale,
          supplyType: supplyType,
          dipStatus: dipStatus,
          dipPercent: dipPercent,
          fallbackCostPerKg: initialCost
        }) : null;

        const macerationRes = isMaceration ? PriceCalculator.calculateMacerationCost({
          herbCostPerKg: herbCost,
          oliveOilCostPerKg: oliveOilCost,
          herbRatioKg: product.herbRatioKg || 0.2,
          herbKg: product.herbKg,
          oilKg: product.oilKg,
          supplyType: supplyType,
          wholesaleCostPerKg: currentWholesale,
          fallbackCostPerKg: initialCost
        }) : null;

        const costPerKg = isMaceration ? macerationRes.netCostPerKg : coldPressRes.netCostPerKg;
        const hasOilData = costPerKg > 0;

        const rawOilCost = hasOilData ? parseFloat((costPerKg * kg).toFixed(2)) : 0;
        const wholesalePack = (layer2GroupMode === "wholesale_drums")
          ? PriceCalculator.calculateWholesalePackagingBreakdown(kg)
          : null;

        const packCost = (layer2GroupMode === "wholesale_drums")
          ? wholesalePack.totalPackCost
          : ((typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[vol]) ? DEFAULT_PACKAGING_COSTS[vol] : 14.50);

        const wholesaleMarginMode = product.wholesaleMarginMode || 'percent'; // 'percent' | 'amount'
        const wholesaleMarginValue = (product.wholesaleMarginValue !== undefined && product.wholesaleMarginValue !== null)
          ? parseFloat(product.wholesaleMarginValue)
          : (wholesaleMarginMode === 'percent' ? 20 : 200);

        const isWholesaleSupply = (supplyType === "wholesale");
        
        // Toptan alım (dışarıdan tedarik) ise fabrika presi ve tesis makineleri çalışmaz (Tesis Payı = 0).
        // Sadece bizim sıktığımız yağlar için operatör ayarındaki 1KG gider payı hacme göre uygulanır!
        const overheadData = PriceCalculator.getOverheadForVolume(
            vol,
            overheadRes.overheadPerKg,
            isWholesaleSupply,
            wholesalePack
        );
        
        const linearOverhead = overheadData.linearVolumeOverhead;
        const laborAssemblyFee = overheadData.laborAssemblyFee;
        const totalOverhead = overheadData.totalOverhead;

        const inputVatRate = (product.inputVatRate !== undefined && product.inputVatRate !== null)
          ? parseFloat(product.inputVatRate)
          : (parseFloat(product.kdv) || 1);
        const salesVatRate = parseFloat(product.kdv) || 1;

        const netCost = hasOilData ? parseFloat((rawOilCost + packCost + totalOverhead).toFixed(2)) : 0;

        // 🛡️ İki Yönlü KDV Koruma Motoru (VAT Rate Mismatch Tax Neutralization Engine)
        const taxProtection = PriceCalculator.calculateTaxNeutralBreakEvenCost({
          netCost: netCost,
          inputVatRate: inputVatRate,
          salesVatRate: salesVatRate,
          rawOilCost: rawOilCost,
          packCost: packCost,
          linearOverhead: linearOverhead,
          laborAssemblyFee: laborAssemblyFee
        });

        const effectiveNetCost = hasOilData ? taxProtection.taxNeutralBreakEvenCost : 0;
        const unitNetCost = hasOilData ? (effectiveNetCost / (kg > 0 ? kg : 1)) : 0;
        const tierInfo = PriceCalculator.getWholesaleDiscountForKg(kg, StorageManager.getWholesaleTiers());
        const discountPct = tierInfo.discount || 0;

        // Calculate 1 KG Wholesale Quote Price with Profit Margin (% or ₺/KG) + Discount Tier %
        let marginAmountPerKg = 0;
        if (layer2GroupMode === 'wholesale_drums') {
          if (wholesaleMarginMode === 'amount') {
            marginAmountPerKg = wholesaleMarginValue;
          } else {
            marginAmountPerKg = unitNetCost * (wholesaleMarginValue / 100);
          }
        }

        const baseSellingUnitCost = hasOilData ? (unitNetCost + marginAmountPerKg) : 0;
        const discountedUnitCost = hasOilData ? (baseSellingUnitCost * (1 - (discountPct / 100))) : 0;
        const finalWholesale1KgQuotePrice = parseFloat(discountedUnitCost.toFixed(2));
        const totalOrderPrice = parseFloat((finalWholesale1KgQuotePrice * kg).toFixed(2));

        // Profit or Loss Calculation
        const profitPerKg = hasOilData ? parseFloat((finalWholesale1KgQuotePrice - unitNetCost).toFixed(2)) : 0;
        const totalProfitOrLoss = parseFloat((profitPerKg * kg).toFixed(2));
        const isProfit = profitPerKg >= 0;

        // B2B Wholesale Tier Calculations (based on baseSellingUnitCost and unitNetCost)
        const b2bTier1Price = hasOilData ? parseFloat((baseSellingUnitCost * 0.95).toFixed(2)) : 0;
        const b2bTier1ProfitPerKg = hasOilData ? parseFloat((b2bTier1Price - unitNetCost).toFixed(2)) : 0;
        const b2bTier1IsProfit = b2bTier1ProfitPerKg >= 0;

        const b2bTier2Price = hasOilData ? parseFloat((baseSellingUnitCost * 0.90).toFixed(2)) : 0;
        const b2bTier2ProfitPerKg = hasOilData ? parseFloat((b2bTier2Price - unitNetCost).toFixed(2)) : 0;
        const b2bTier2IsProfit = b2bTier2ProfitPerKg >= 0;

        const b2bTier3Price = hasOilData ? parseFloat((baseSellingUnitCost * 0.85).toFixed(2)) : 0;
        const b2bTier3ProfitPerKg = hasOilData ? parseFloat((b2bTier3Price - unitNetCost).toFixed(2)) : 0;
        const b2bTier3IsProfit = b2bTier3ProfitPerKg >= 0;

        const b2bTier4Price = hasOilData ? parseFloat((baseSellingUnitCost * 0.80).toFixed(2)) : 0;
        const b2bTier4ProfitPerKg = hasOilData ? parseFloat((b2bTier4Price - unitNetCost).toFixed(2)) : 0;
        const b2bTier4IsProfit = b2bTier4ProfitPerKg >= 0;

        // Katman 1 Pazaryeri Simülatörüne KDV Korumalı Dip Maliyeti Aktar
        const tySim = hasOilData ? PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 19, discount: 0, cargo: 110 }) : { salePrice: 0, payout: 0, netProfit: 0 };
        const hbSim = hasOilData ? PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 17, discount: 0, cargo: 110 }) : { salePrice: 0, payout: 0, netProfit: 0 };
        const iySim = hasOilData ? PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 4, discount: 0, cargo: 82.50 }) : { salePrice: 0, payout: 0, netProfit: 0 };
        const storeSim = hasOilData ? PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 0, discount: 0, cargo: 0 }) : { salePrice: 0, payout: 0, netProfit: 0 };

        const storePrice = hasOilData ? (effectiveNetCost + targetProfitInput) : 0;

        const badgeClass = product.category === "Uçucu Yağlar"
          ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
          : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50";

        if (activeView === "rows") {
          const rowHtml = `
            <div class="glass-card rounded-xl p-3 border border-white/5 hover:border-white/15 bg-[#12151b] transition-all shadow-sm hover:shadow-md group flex flex-col gap-2">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                <!-- 1. Left: Product Title, SKU, Category Badge, Ambalaj -->
                <div class="flex items-center gap-3 w-full md:w-4/12 min-w-[240px]">
                  <span class="font-mono text-xs font-bold text-zinc-300 bg-[#0a0c10] px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0 shadow-sm">
                    ${product.sku}
                  </span>
                  <div class="truncate">
                    <div class="flex items-center gap-1.5 truncate">
                      <h3 class="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors truncate" title="${product.name}">
                        ${product.name}
                      </h3>
                      ${product.isHybrid ? `
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 shrink-0" title="Hem Sıkım Hem Toptan Dökme Tedarik Edilebilir">🌾📦 Hibrit</span>
                      ` : ''}
                      ${isAnyModified ? `
                        <button onclick="resetProductField('${product.id}', 'all')" title="Tüm Girdileri Orijinal Başlangıç Fiyatlarına Dön" class="text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-800/80 shrink-0 cursor-pointer">
                          ↺
                        </button>
                      ` : ''}
                    </div>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}">
                        ${product.category}
                      </span>
                      <span class="text-[11px] font-medium text-slate-400 bg-[#0e172a] px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1.5">
                        📌 Ambalaj: 
                        ${layer2GroupMode === 'wholesale_drums' 
                          ? `<input type="number" value="${kg}" min="1" step="1" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-14 bg-[#0b1325] text-slate-200 font-bold px-1.5 py-0.5 rounded border border-slate-700 text-center text-xs"> KG`
                          : `<select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-[#0b1325] text-slate-200 font-bold px-1.5 py-0.5 rounded border border-slate-700 cursor-pointer text-xs">${getLayer2VolumeOptionsHtml(vol, product)}</select>`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 2. Center: 4-Column Balanced Tabular Metrics (Katman 2 Birebir Standardı) -->
                <div class="grid grid-cols-4 gap-2 w-full md:w-5/12 items-center bg-[#0b1325] px-3 py-2 rounded-xl border border-slate-800 text-xs shadow-inner">
                  <div class="text-center border-r border-slate-800 pr-1">
                    <span class="text-[11px] font-medium text-slate-400 block leading-tight">1KG Hammadde</span>
                    <span class="font-bold ${hasOilData ? 'text-slate-100' : 'text-amber-400'} text-xs block mt-0.5 tabular-nums">
                      ${hasOilData ? PriceCalculator.formatTL(costPerKg) : '0,00 ₺ <span class="text-[9px] block font-normal text-amber-400/80">(Veri Yok)</span>'}
                    </span>
                  </div>

                  <div class="text-center border-r border-slate-800 pr-1">
                    <span class="text-[11px] font-medium text-slate-400 block leading-tight">Tesis Gideri</span>
                    <span class="font-bold text-slate-300 text-xs block mt-0.5 tabular-nums">${PriceCalculator.formatTL(linearOverhead)}</span>
                  </div>

                  <div class="text-center border-r border-slate-800 pr-1">
                    <span class="text-[11px] font-medium text-slate-400 block leading-tight">Ambalaj & Sarf</span>
                    <span class="font-bold text-slate-300 text-xs block mt-0.5 tabular-nums">${PriceCalculator.formatTL(packCost)}</span>
                  </div>

                  <div class="text-center">
                    <span class="text-[11px] font-semibold text-slate-300 block leading-tight">
                      ${layer2GroupMode === 'wholesale_drums' ? '1KG Teklif' : 'Net Saf Maliyet'}
                    </span>
                    <span class="text-xs font-extrabold ${hasOilData ? 'text-emerald-400' : 'text-amber-400/90'} block mt-0.5 tabular-nums">
                      ${hasOilData ? PriceCalculator.formatTL(layer2GroupMode === 'wholesale_drums' ? finalWholesale1KgQuotePrice : effectiveNetCost) : '-- (Veri Yok)'}
                    </span>
                  </div>
                </div>

                <!-- 3. Far Right Action Buttons -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button onclick="toggleLayer2Breakdown('${product.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1 ${isBreakdownOpen ? 'bg-slate-800 text-white border border-slate-600' : 'bg-[#16223b] text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800'}">
                    <span>⚙️ Reçete / Ayar ${isBreakdownOpen ? '▲' : '▼'}</span>
                  </button>

                  <button onclick="toggleLayer2Drawer('${product.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1 ${isDrawerOpen ? 'bg-slate-800 text-white border border-slate-600' : 'bg-[#16223b] text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800'}">
                    <span>${layer2GroupMode === 'wholesale_drums' ? '🏢 B2B Cetveli' : '⚡ Pazaryeri Sim'} ${isDrawerOpen ? '▲' : '▼'}</span>
                  </button>

                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <button onclick="copyWholesaleProposal('${product.id}', ${kg}, ${finalWholesale1KgQuotePrice}, ${totalOrderPrice}, ${kdvRate})" title="Müşteri Teklif Metnini Kopyala" class="p-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer">
                      📋
                    </button>
                  ` : ''}
                </div>

              </div>

              <!-- DİKEY, DENGELİ VE RAHAT OKUNUR RESMİ FATURA DÖKÜM ÇEKMECESİ (Reçete Girdileri ile Birlikte) -->
              ${isBreakdownOpen ? `
                <div class="bg-[#0e172a] p-3.5 rounded-xl border border-slate-700/80 text-xs space-y-3 mt-1 shadow-xl animate-slide-up">
                  <!-- Üst Ayar Kontrolleri: Tohum/Maserasyon/Dökme, Dip Fire, KDV Oranları -->
                  <div class="flex flex-wrap items-center gap-2.5 pb-2.5 border-b border-slate-800 bg-[#0b1325] p-2.5 rounded-xl text-xs">
                    <!-- Tedarik / Reçete Türü -->
                    <div class="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span class="text-xs font-bold text-slate-400">Reçete:</span>
                      ${isEssentialOil ? `
                        <span class="text-xs font-extrabold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">📦 Saf Uçucu Yağ</span>
                      ` : `
                        <div class="flex items-center p-0.5 bg-slate-900 rounded border border-slate-800">
                          <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2 py-0.5 rounded text-[11px] font-bold transition-all ${supplyType !== 'wholesale' ? (isMaceration ? 'bg-purple-600 text-white' : 'bg-amber-500 text-slate-950') : 'text-slate-400 hover:text-white'}">
                            ${isMaceration ? '🌿 Maserasyon' : '🌾 Sıkım'}
                          </button>
                          <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2 py-0.5 rounded text-[11px] font-bold transition-all ${supplyType === 'wholesale' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}">
                            📦 Toptan
                          </button>
                        </div>
                      `}
                    </div>

                    <!-- Tohum / Ot / Dökme Girdileri -->
                    ${isMaceration && supplyType !== 'wholesale' ? `
                      <div class="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span class="text-emerald-400 font-bold text-xs">🫒 Z.Yağı:</span>
                        <input type="number" value="${oliveOilCost}" step="10" onchange="updateLayer2ProductField('${product.id}', 'oliveOilCostPerKg', this.value)" class="w-20 bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-xs py-1 px-1.5 rounded text-center"> <span class="text-slate-400 font-bold">₺</span>
                        <span class="text-purple-300 font-bold text-xs ml-1">🌱 Ot:</span>
                        <input type="number" value="${herbCost}" step="10" onchange="updateLayer2ProductField('${product.id}', 'herbCostPerKg', this.value)" class="w-20 bg-slate-900 border border-slate-700 text-purple-300 font-bold text-xs py-1 px-1.5 rounded text-center"> <span class="text-slate-400 font-bold">₺</span>
                        <span class="text-[10px] text-amber-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">${macerationRes.calculatedRatio} KG Ot / 1 KG</span>
                      </div>
                    ` : supplyType === 'press' ? `
                      <div class="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 flex-wrap">
                        <span class="text-amber-400 font-bold text-xs">🌾 Tohum:</span>
                        <input type="number" value="${seedCost}" step="5" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-20 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs py-1 px-1.5 rounded text-center"> <span class="text-slate-400 font-bold">₺/KG</span>
                        ${product.id === "T.0209" ? `
                          <div class="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                            <button onclick="updateLayer2ProductField('T.0209', 'seedCostPerKg', 250)" class="px-2 py-0.5 rounded text-[10px] font-bold ${seedCost === 250 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}">🇹🇷 Yerli (250₺)</button>
                            <button onclick="updateLayer2ProductField('T.0209', 'seedCostPerKg', 154)" class="px-2 py-0.5 rounded text-[10px] font-bold ${seedCost === 154 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}">🌍 İthal (154₺)</button>
                          </div>
                        ` : ''}
                        <span class="text-cyan-400 font-bold text-xs ml-1.5">💧 Verim:</span>
                        <input type="number" value="${yieldPct}" step="1" min="1" max="100" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-xs py-1 px-1 rounded text-center"> <span class="text-slate-400 font-bold">%</span>
                      </div>
                    ` : `
                      <div class="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span class="text-blue-400 font-bold text-xs">📦 Dökme Alış:</span>
                        <input type="number" value="${product.wholesaleCostPerKg !== undefined ? product.wholesaleCostPerKg : costPerKg}" step="10" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-24 bg-slate-900 border border-slate-700 text-blue-300 font-bold text-xs py-1 px-1.5 rounded text-center"> <span class="text-slate-400 font-bold">₺/KG</span>
                      </div>
                    `}

                    <!-- Dip / Tortu Fire -->
                    ${supplyType === 'press' ? `
                      <div class="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span class="text-xs font-bold text-rose-300">Dip Fire:</span>
                        <select onchange="updateLayer2ProductField('${product.id}', 'dipStatus', this.value)" class="bg-slate-900 border border-rose-500/50 text-rose-300 font-bold text-xs py-1 px-1.5 rounded cursor-pointer">
                          <option value="none" ${dipStatus !== 'has_dip' ? 'selected' : ''}>Dip Yok (%0)</option>
                          <option value="has_dip" ${dipStatus === 'has_dip' ? 'selected' : ''}>🔴 Dip Var</option>
                        </select>
                        ${dipStatus === 'has_dip' ? `
                          <input type="number" value="${dipPercent}" step="1" min="0" max="90" onchange="updateLayer2ProductField('${product.id}', 'dipPercent', this.value)" class="w-16 bg-slate-900 border border-rose-500 text-rose-300 font-bold text-xs py-1 px-1 rounded text-center"> <span class="text-rose-300 font-bold">%</span>
                        ` : ''}
                      </div>
                    ` : ''}

                    <!-- KDV Hızlı Seçim -->
                    <div class="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span class="text-[10px] text-slate-400 font-bold">KDV:</span>
                      <select onchange="updateProductInputVat('${product.id}', this.value)" class="bg-slate-900 text-amber-300 font-bold border border-slate-700 rounded px-1.5 py-0.5 text-xs cursor-pointer">
                        <option value="1" ${inputVatRate === 1 ? 'selected' : ''}>Alış %1</option>
                        <option value="20" ${inputVatRate === 20 ? 'selected' : ''}>Alış %20</option>
                      </select>
                      <span class="text-slate-600 font-bold">➔</span>
                      <select onchange="updateProductSalesVat('${product.id}', this.value)" class="bg-slate-900 text-emerald-300 font-bold border border-slate-700 rounded px-1.5 py-0.5 text-xs cursor-pointer">
                        <option value="1" ${salesVatRate === 1 ? 'selected' : ''}>Satış %1</option>
                        <option value="20" ${salesVatRate === 20 ? 'selected' : ''}>Satış %20</option>
                      </select>
                    </div>

                    ${layer2GroupMode === 'wholesale_drums' ? `
                      <div class="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-sky-500/50">
                        <span class="text-xs font-bold text-sky-300">Hedef Kâr:</span>
                        <div class="flex items-center p-0.5 bg-slate-900 rounded border border-slate-800 text-xs">
                          <button onclick="updateLayer2ProductField('${product.id}', 'wholesaleMarginMode', 'percent')" class="px-1.5 py-0.5 rounded font-bold transition-all ${wholesaleMarginMode === 'percent' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">%</button>
                          <button onclick="updateLayer2ProductField('${product.id}', 'wholesaleMarginMode', 'amount')" class="px-1.5 py-0.5 rounded font-bold transition-all ${wholesaleMarginMode === 'amount' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">₺/KG</button>
                        </div>
                        <input type="number" value="${wholesaleMarginValue}" step="${wholesaleMarginMode === 'amount' ? '10' : '5'}" onchange="updateLayer2ProductField('${product.id}', 'wholesaleMarginValue', this.value)" class="w-16 bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-xs py-1 px-1 rounded text-center">
                      </div>
                    ` : ''}
                  </div>
                <div class="bg-[#0e172a] p-4 rounded-xl border border-slate-800 text-xs space-y-2.5 animate-slide-up w-full my-2 shadow-xl">
                  <div class="flex justify-between items-center pb-2 border-b border-slate-800 font-extrabold text-xs text-slate-200">
                    <span class="flex items-center gap-1.5 tracking-wide">📋 RESMİ FABRİKA MALİYET VE SİPARİŞ HESAP FATURASI</span>
                    <span class="text-[11px] text-slate-400 font-medium bg-[#0b1325] px-2.5 py-0.5 rounded-lg border border-slate-800">Tıkla Detay Gör ℹ️</span>
                  </div>

                  <!-- KALEM 1 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item1')" class="cursor-pointer hover:bg-slate-800/60 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
                    <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
                      <span class="flex items-center gap-2">
                        ${supplyType === 'wholesale' ? `1. 📦 Toptan Dökme Yağ Payı (${vol})` : isMaceration ? `1. 🌿 Maserasyon Yağ Payı (${vol})` : `1. 🌾 Sıkım Yağ Payı (${vol})`}
                        <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Formül / Detay</span>
                      </span>
                      <span class="font-bold tabular-nums text-slate-100 text-xs">${PriceCalculator.formatTL(rawOilCost)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item1 ? `
                      <div class="mt-2.5 p-3 bg-[#0b1325] rounded-lg border border-slate-700/80 text-xs text-slate-300 space-y-1.5 animate-slide-up leading-relaxed">
                        <div class="font-bold text-slate-200 border-b border-slate-800 pb-1 text-xs">💡 1. KALEM (HAM YAĞ) NASIL HESAPLANDI?</div>
                        ${supplyType === 'wholesale' ? `
                          <p>• <strong>Toptan Dökme Yağ Alış Fiyatı:</strong> ${PriceCalculator.formatTL(costPerKg)} / KG (%${kdvRate} KDV Dahil)</p>
                          <p>• <strong>Sipariş Hesabı:</strong> ${PriceCalculator.formatTL(costPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)}</strong></p>
                        ` : isMaceration ? `
                          <p>• <strong>Zeytinyağı Alış Fiyatı:</strong> ${PriceCalculator.formatTL(oliveOilCost)} / KG (%${kdvRate} KDV Dahil)</p>
                          <p>• <strong>Ot/Bitki Alış Fiyatı:</strong> ${PriceCalculator.formatTL(herbCost)} / KG (Kullanılan Oran: ${macerationRes.calculatedRatio} KG Ot / 1 KG Yağ)</p>
                          <p>• <strong>1 KG Maserasyon Yağ Maliyeti:</strong> ${PriceCalculator.formatTL(costPerKg)} / KG</p>
                          <p>• <strong>Sipariş Hesabı:</strong> ${PriceCalculator.formatTL(costPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)}</strong></p>
                        ` : `
                          <p>• <strong>Hammadde (Tohum) Alış Fiyatı:</strong> ${PriceCalculator.formatTL(seedCost)} / KG (%${kdvRate} KDV Dahil)</p>
                          <p>• <strong>Pres Verimi:</strong> %${yieldPct} (100 KG tohumdan ${yieldPct} KG saf yağ elde edilir)</p>
                          <p>• <strong>Dip / Tortu Fire Durumu:</strong> ${dipStatus === 'has_dip' && dipPercent > 0 ? `%${dipPercent} Fire Var` : 'Dip Yok (%0 Fire)'}</p>
                          <p>• <strong>1 KG Saf Sıkım Yağ Maliyeti:</strong> ${PriceCalculator.formatTL(costPerKg)} / KG</p>
                          <p>• <strong>Sipariş Hesabı:</strong> ${PriceCalculator.formatTL(costPerKg)} × ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)}</strong></p>
                        `}
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 2 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item2')" class="cursor-pointer hover:bg-slate-800/60 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
                    <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
                      <span class="flex items-center gap-2">
                        2. 🍾 Ambalaj Maliyeti (${layer2GroupMode === 'wholesale_drums' ? 'Sanayi Bidonları' : 'Şişe + Kapak + Kutu'})
                        <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Detay</span>
                      </span>
                      <span class="font-bold tabular-nums text-slate-100 text-xs">${PriceCalculator.formatTL(packCost)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item2 ? `
                      <div class="mt-2.5 p-3 bg-[#0b1325] rounded-lg border border-slate-700/80 text-xs text-slate-300 space-y-1.5 animate-slide-up leading-relaxed">
                        <p>• <strong>Seçilen Ambalaj Dağılımı:</strong> ${layer2GroupMode === 'wholesale_drums' ? (wholesalePack?.breakdownText || `${kg} KG Bidon`) : vol}</p>
                        <p>• <strong>Toplam Ambalaj Gideri:</strong> <strong>${PriceCalculator.formatTL(packCost)}</strong></p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 3 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item3')" class="cursor-pointer hover:bg-slate-800/60 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
                    <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
                      <span class="flex items-center gap-2">
                        3. ⚡ Tesis & Fabrika Masraf Payı ${supplyType === 'wholesale' ? '(0 ₺ Toptan Alış)' : ''}
                        <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Detay</span>
                      </span>
                      <span class="font-bold tabular-nums ${supplyType === 'wholesale' ? 'text-slate-500' : 'text-slate-100'} text-xs">${PriceCalculator.formatTL(linearOverhead)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item3 ? `
                      <div class="mt-2.5 p-3 bg-[#0b1325] rounded-lg border border-slate-700/80 text-xs text-slate-300 space-y-1.5 animate-slide-up leading-relaxed">
                        <div class="font-bold text-slate-200 border-b border-slate-800 pb-1 text-xs">💡 3. KALEM NASIL HESAPLANDI?</div>
                        ${supplyType === 'wholesale' ? `
                          <p>• <strong>Toptan Alınan Yağlarda Tesis Payı:</strong> <strong>0,00 ₺</strong> (Dışarıdan dökme hazır alındığı için fabrika presi ve tesis makineleri çalışmaz).</p>
                        ` : `
                          <p>• <strong>Fabrika Tesis & Genel Gider Payı (Operatör Ayarı):</strong> ${PriceCalculator.formatTL(overheadRes.overheadPerKg)} ₺ / KG</p>
                          <p>• <strong>Bu Ambalajın Tesis Payı (${vol}):</strong> ${PriceCalculator.formatTL(overheadRes.overheadPerKg)} ₺ × ${kg} KG = <strong>${PriceCalculator.formatTL(linearOverhead)}</strong></p>
                        `}
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 4 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item4')" class="cursor-pointer hover:bg-slate-800/60 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
                    <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
                      <span class="flex items-center gap-2">
                        4. 🛠️ Dolum & Paketleme İşçilik Payı
                        <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Formül / Detay</span>
                      </span>
                      <span class="font-bold tabular-nums text-slate-100 text-xs">${PriceCalculator.formatTL(laborAssemblyFee)}</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item4 ? `
                      <div class="mt-2.5 p-3 bg-[#0b1325] rounded-lg border border-slate-700/80 text-xs text-slate-300 space-y-1.5 animate-slide-up leading-relaxed">
                        <div class="font-bold text-slate-200 border-b border-slate-800 pb-1 text-xs">💡 4. KALEM (İŞÇİLİK HİZMETİ) NASIL HESAPLANDI?</div>
                        <p>• <strong>Ambalaj Tipi:</strong> ${layer2GroupMode === 'wholesale_drums' ? (wholesalePack?.breakdownText || `${kg} KG Bidon`) : `1 Adet ${vol} Şişe / Bidon`}</p>
                        <p>• <strong>Dolum & Paketleme İşçilik Payı:</strong> <strong>${PriceCalculator.formatTL(laborAssemblyFee)}</strong></p>
                        <p class="text-[11px] text-slate-400 leading-relaxed">• <strong>Zaman & Hareket Mantığı:</strong> 1000ml (1 KG) şişe dolumu seri ve hızlıdır (${PriceCalculator.formatTL(PriceCalculator.getLaborAssemblyFee('1000ml'))} ₺). 250ml ve altındaki küçük hacimler daha çok el işçiliği, kapaklama ve zaman ister (örneğin 1 KG için 4 adet 250ml = 30,00 ₺ işçilik payıdır).</p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 5: SAF FABRİKA HAM MALİYETİ & KDV KORUMA DENGELİ MALİYET -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item5')" class="cursor-pointer hover:opacity-95 py-2.5 px-3 rounded-lg transition-all border ${taxProtection.hasMismatch ? 'border-emerald-500/80 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 shadow-md' : 'border-amber-500/60 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 shadow-md'} mt-1 space-y-1">
                    <div class="flex items-center justify-between font-bold text-xs">
                      <span class="text-amber-300 flex items-center gap-2">
                        🏁 SAF FABRİKA ÜRETİM MALİYETİ (KÂRSIZ NET GİDER)
                        <span class="text-[10px] font-medium text-amber-200 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60">ℹ️ Formül / Detay</span>
                      </span>
                      <span class="text-amber-300 text-xs font-bold shrink-0">${PriceCalculator.formatTL(netCost)}</span>
                    </div>
                    ${taxProtection.hasMismatch ? `
                      <div class="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800/80">
                        <span class="text-emerald-400 font-medium flex items-center gap-1">
                          🛡️ KDV KORUMALI DİP SATIŞ MALİYETİ (Alış %${inputVatRate} ➔ Satış %${salesVatRate}):
                        </span>
                        <span class="font-bold text-emerald-300 text-xs">${PriceCalculator.formatTL(effectiveNetCost)}</span>
                      </div>
                    ` : ''}
                    ${openLayer2BreakdownInfos[product.id]?.item5 ? `
                      <div class="mt-2.5 p-3 bg-slate-900/95 rounded-xl border border-amber-500/40 text-xs text-slate-200 space-y-2 animate-slide-up shadow-lg">
                        <!-- Toplama Satırı (Yan Yana Temiz Izgara) -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                          <div><span class="text-slate-400 block">1. Yağ:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(rawOilCost)}</span></div>
                          <div><span class="text-slate-400 block">2. Ambalaj:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(packCost)}</span></div>
                          <div><span class="text-slate-400 block">3. Tesis:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(linearOverhead)}</span></div>
                          <div><span class="text-slate-400 block">4. İşçilik:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(laborAssemblyFee)}</span></div>
                        </div>

                        <!-- Dip Toplam ve KDV Analiz Satırı -->
                        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-xs">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-amber-300">= Net Üretim Maliyeti:</span>
                            <span class="font-black text-amber-300 text-sm">${PriceCalculator.formatTL(netCost)}</span>
                          </div>

                          <!-- KDV Rozeti ve Kısa Özellik -->
                          <div class="flex items-center gap-1.5 text-[11px]">
                            ${inputVatRate === 1 && salesVatRate === 20 ? `
                              <span class="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800 font-bold">🛡️ KDV Koruması: +${PriceCalculator.formatTL(taxProtection.taxDiffSurcharge)}</span>
                              <span class="font-black text-emerald-400">Dip Satış: ${PriceCalculator.formatTL(effectiveNetCost)}</span>
                            ` : inputVatRate === 20 && salesVatRate === 1 ? `
                              <span class="px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800 font-bold">🛡️ KDV Devri (%20 Alış ➔ %1 Satış)</span>
                            ` : inputVatRate === 20 && salesVatRate === 20 ? `
                              <span class="px-2 py-0.5 bg-purple-950 text-purple-300 rounded border border-purple-800 font-bold">🛡️ Birebir Dengeli (%20 Alış ➔ %20 Satış)</span>
                            ` : `
                              <span class="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">🛡️ Birebir Dengeli (%1 Alış ➔ %1 Satış)</span>
                            `}
                          </div>
                        </div>

                        <!-- Tek Satır Temiz İzah Metni -->
                        <div class="text-[11px] text-slate-400 italic border-t border-slate-800/80 pt-2 pb-1 space-y-2.5 leading-relaxed">
                          <p>
                          ${inputVatRate === 1 && salesVatRate === 20 ? `
                            💡 Tohum KDV'niz (%1) Satış KDV'nizden (%20) düşük olduğu için devlete cebinizden vergi ödememeniz adına vergi koruma dengesi eklenmiştir.
                          ` : inputVatRate === 20 && salesVatRate === 1 ? `
                            💡 Alış KDV'niz (%20) Satış KDV'nizden (%1) yüksek olduğu için devlete ekstra KDV çıkmaz, Devreden KDV birikir.
                          ` : `
                            💡 Alış ve Satış KDV oranlarınız birebir eşittir (%${salesVatRate}). Cebinizden çıkan KDV dahil harcamanız başa baş satış maliyetinize tam eşittir.
                          `}
                          </p>
                          <div class="text-sky-400 font-semibold bg-sky-950/30 p-2 rounded-lg border border-sky-900/40">
                            ℹ️ Not: Pazaryeri (Trendyol, Hepsiburada, İyzico) komisyon ve kargo kesintileri ile banka hakedişi ve net kârlılık hesapları, hemen aşağıdaki Pazaryeri Sim çekmecesi içerisinde gösterilmektedir.
                          </div>
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- TOPTAN SİPARİŞİ İÇİN MÜŞTERİ TEKLİF KUTUSU (Sadece Toptan Bidon Modunda Açılır) -->
                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="p-3 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-xl border border-emerald-500 shadow-md text-xs space-y-1.5">
                      <div class="flex justify-between items-center border-b border-emerald-800/80 pb-1">
                        <span class="font-black text-emerald-400 text-xs flex items-center gap-1.5">
                          💰 MÜŞTERİYE SATIŞ YAPACAĞINIZ GERÇEK TEKLİF FİYATI
                        </span>
                        <span class="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700">%${kdvRate} KDV Dahil</span>
                      </div>
                      <div class="flex justify-between items-center pt-0.5">
                        <div>
                          <span class="text-[10px] text-slate-300 font-bold block">📢 1 KG BİRİM TEKLİF:</span>
                          <span class="text-base font-black text-emerald-300">${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} ₺ / KG</span>
                        </div>
                        <div class="text-right">
                          <span class="text-[10px] text-slate-300 font-bold block">📦 SİPARİŞ TOPLAMI (${kg} KG):</span>
                          <span class="text-base font-black text-emerald-300">${PriceCalculator.formatTL(totalOrderPrice)} ₺</span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center text-[10px] pt-1 border-t border-emerald-900/60">
                        <span class="text-purple-200 font-semibold tabular-nums">📦 ${wholesalePack?.breakdownText}</span>
                        ${Math.abs(totalProfitOrLoss) < 0.01 ? `
                          <span class="text-amber-300 font-bold bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">🏁 DİP MALİYET (0₺ KÂR)</span>
                        ` : totalProfitOrLoss > 0 ? `
                          <span class="text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">🟢 KÂR: +${PriceCalculator.formatTL(totalProfitOrLoss)} ₺</span>
                        ` : `
                          <span class="text-rose-300 font-bold bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">🔴 ZARAR: ${PriceCalculator.formatTL(totalProfitOrLoss)} ₺</span>
                        `}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ""}

              <!-- SİSTEM 1 KANAL SATIŞ SİMÜLATÖRÜ VEYA B2B TOPTAN BİDON CETVELİ -->
              ${isDrawerOpen ? (layer2GroupMode === "wholesale_drums" ? `
                <div class="bg-[#0e172a] p-4 rounded-2xl border border-slate-800 space-y-3 animate-slide-up shadow-xl">
                  <div class="flex flex-wrap items-center justify-between bg-[#0b1325] p-3 rounded-xl border border-slate-800 gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-extrabold text-sky-300 flex items-center gap-1.5">🏢 B2B TOPTAN SANAYİ İSKONTO & KÂRLILIK CETVELİ</span>
                      <span class="text-xs text-slate-400">(Tüm Kademeler İçin Otomatik Kâr/Zarar Hesabı)</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-300">Saf Net Maliyetiniz:</span>
                      <span class="text-xs font-black text-amber-300 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800">${PriceCalculator.formatTL(unitNetCost)} ₺ / KG</span>
                    </div>
                  </div>

                  <!-- B2B KADEMELİ İSKONTO & TEKLİF MİMARİSİ GRID -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                    <!-- Kademe 1: 5-29 KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-teal-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-teal-400 text-xs">📦 KADEME 1 (5 - 29 KG)</span>
                          <span class="text-xs font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">%5 İskonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                          <span class="font-black text-teal-300 text-base">${PriceCalculator.formatTL(b2bTier1Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>10 KG Sipariş Tutarı:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier1Price * 10)} ₺</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">Kârlılık:</span>
                        ${Math.abs(b2bTier1ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">🏁 DİP MALİYET (0₺ KÂR)</span>
                        ` : b2bTier1ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">🟢 KÂRDA (+${PriceCalculator.formatTL(b2bTier1ProfitPerKg)}₺/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">🔴 ZARARDA (${PriceCalculator.formatTL(b2bTier1ProfitPerKg)}₺/KG)</span>
                        `}
                      </div>
                    </div>

                    <!-- Kademe 2: 30-99 KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-blue-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-blue-400 text-xs">🛢️ KADEME 2 (30 - 99 KG)</span>
                          <span class="text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">%10 İskonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                          <span class="font-black text-blue-300 text-base">${PriceCalculator.formatTL(b2bTier2Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>30 KG Sipariş Tutarı:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier2Price * 30)} ₺</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">Kârlılık:</span>
                        ${Math.abs(b2bTier2ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">🏁 DİP MALİYET (0₺ KÂR)</span>
                        ` : b2bTier2ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">🟢 KÂRDA (+${PriceCalculator.formatTL(b2bTier2ProfitPerKg)}₺/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">🔴 ZARARDA (${PriceCalculator.formatTL(b2bTier2ProfitPerKg)}₺/KG)</span>
                        `}
                      </div>
                    </div>

                    <!-- Kademe 3: 100-249 KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-indigo-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-indigo-400 text-xs">🚚 KADEME 3 (100 - 249 KG)</span>
                          <span class="text-xs font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">%15 İskonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                          <span class="font-black text-indigo-300 text-base">${PriceCalculator.formatTL(b2bTier3Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>100 KG Sipariş Tutarı:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier3Price * 100)} ₺</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">Kârlılık:</span>
                        ${Math.abs(b2bTier3ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">🏁 DİP MALİYET (0₺ KÂR)</span>
                        ` : b2bTier3ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">🟢 KÂRDA (+${PriceCalculator.formatTL(b2bTier3ProfitPerKg)}₺/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">🔴 ZARARDA (${PriceCalculator.formatTL(b2bTier3ProfitPerKg)}₺/KG)</span>
                        `}
                      </div>
                    </div>

                    <!-- Kademe 4: 250+ KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-amber-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-amber-400 text-xs">🏭 KADEME 4 (250+ KG SANAYİ)</span>
                          <span class="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">%20 İskonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                          <span class="font-black text-amber-300 text-base">${PriceCalculator.formatTL(b2bTier4Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>250 KG Sipariş Tutarı:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier4Price * 250)} ₺</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">Kârlılık:</span>
                        ${Math.abs(b2bTier4ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">🏁 DİP MALİYET (0₺ KÂR)</span>
                        ` : b2bTier4ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">🟢 KÂRDA (+${PriceCalculator.formatTL(b2bTier4ProfitPerKg)}₺/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">🔴 ZARARDA (${PriceCalculator.formatTL(b2bTier4ProfitPerKg)}₺/KG)</span>
                        `}
                      </div>
                    </div>
                  </div>

                  <!-- B2B TEKLİF METNİ VE HIZLI KOPYALAMA BUTONU -->
                  <div class="flex items-center justify-between bg-[#0b1325] p-3 rounded-xl border border-slate-800 text-xs flex-wrap gap-2">
                    <div class="flex items-center gap-2 truncate">
                      <span class="text-base">📋</span>
                      <span class="font-bold text-slate-200 shrink-0">B2B Müşteri Fiyat Teklifi:</span>
                      <span class="tabular-nums font-semibold text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 truncate">${product.name} — ${wholesalePack?.breakdownText || (kg + ' KG Bidon')} | Birim: ${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} ₺/KG (%${kdvRate} KDV Dahil) | Toplam: ${PriceCalculator.formatTL(totalOrderPrice)} ₺</span>
                    </div>
                    <button onclick="copyWholesaleProposal('${product.id}', ${kg}, ${finalWholesale1KgQuotePrice}, ${totalOrderPrice}, ${kdvRate})" class="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
                      📋 Teklif Metnini Kopyala
                    </button>
                  </div>
                </div>
              ` : `
                <div class="bg-[#0e172a] p-4 rounded-xl border border-slate-800 space-y-3.5 animate-slide-up">
                  <div class="flex flex-wrap items-center justify-between bg-[#0b1325] p-3 rounded-xl border border-slate-800 gap-3">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-extrabold text-amber-400 flex items-center gap-1.5">⚡ KATMAN 1 SİSTEM 1 KANAL FİYATI & HAKEDİŞ SİMÜLATÖRÜ</span>
                      <span class="text-xs text-slate-400">(Saf Fabrika Maliyeti Üzerinden Hesaplama)</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="text-xs font-bold text-slate-200">Hedef Net Kâr (₺):</label>
                      <input type="number" value="${targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-24 bg-[#0e172a] border border-slate-700 text-emerald-300 font-extrabold text-sm px-3 py-1 rounded-lg text-center focus:outline-none focus:border-emerald-500">
                      <span class="text-xs font-bold text-slate-300">₺ / Adet</span>
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
              `) : ""}
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

                <div class="flex items-center gap-1.5 mb-2 truncate">
                  <h3 class="text-sm font-extrabold text-white tracking-tight truncate">
                    ${product.name}
                  </h3>
                  ${product.isHybrid ? `
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 shrink-0" title="Hem Sıkım Hem Toptan Dökme Tedarik Edilebilir">🌾📦 Hibrit</span>
                  ` : ''}
                </div>

                <!-- TEDARİK TÜRÜ & HAMMADDE/TOPTAN GİRDİLERİ (CARD VIEW) -->
                <div class="my-2 bg-slate-950/90 p-2.5 rounded-xl border ${supplyType === 'wholesale' ? 'border-blue-500/40' : 'border-amber-500/30'} space-y-2">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Tedarik Türü:</span>
                    <div class="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                      ${!isEssentialOil ? `
                        <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2 py-0.5 rounded text-[10px] font-bold transition-all ${supplyType !== 'wholesale' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}">
                          🌾 Sıkım
                        </button>
                      ` : ''}
                      <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2 py-0.5 rounded text-[10px] font-bold transition-all ${supplyType === 'wholesale' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                        📦 Toptan
                      </button>
                    </div>
                  </div>

                  ${supplyType === 'wholesale' ? `
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-400">📦 Toptan Alış:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${product.wholesaleCostPerKg !== undefined ? product.wholesaleCostPerKg : costPerKg}" step="10" title="Orijinal Varsayılan: ${initialCost} ₺/KG (Çift tıkla sıfırla)" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-900 border border-blue-500/50 text-blue-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">₺/KG</span>
                        ${isWholesaleModified ? `<button onclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" title="Varsayılana Dön (${initialCost} ₺)" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">↺</button>` : ''}
                      </div>
                    </div>
                  ` : `
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="text-xs font-bold text-amber-400">🌾 Tohum Alış:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${seedCost}" step="5" title="Orijinal Varsayılan: ${initialSeedCost} ₺/KG (Çift tıkla sıfırla)" ondblclick="resetProductField('${product.id}', 'seedCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-20 bg-slate-900 border border-amber-500/50 text-amber-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-amber-400">₺/KG</span>
                        ${isSeedModified ? `<button onclick="resetProductField('${product.id}', 'seedCostPerKg')" title="Varsayılana Dön (${initialSeedCost} ₺)" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">↺</button>` : ''}
                      </div>
                      ${product.id === "T.0209" ? `
                        <div class="w-full flex items-center justify-end gap-1 mt-1">
                          <button onclick="updateLayer2ProductField('T.0209', 'seedCostPerKg', 250)" class="px-1.5 py-0.5 rounded text-[9px] font-bold ${seedCost === 250 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}">🇹🇷 Yerli (250₺)</button>
                          <button onclick="updateLayer2ProductField('T.0209', 'seedCostPerKg', 154)" class="px-1.5 py-0.5 rounded text-[9px] font-bold ${seedCost === 154 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}">🌍 İthal (154₺)</button>
                        </div>
                      ` : ''}
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
                    <span class="text-xs font-black ${supplyType === 'wholesale' ? 'text-blue-300' : 'text-cyan-300'}">
                      ${hasOilData ? PriceCalculator.formatTL(costPerKg) : '<span class="text-amber-400 font-bold">0,00 ₺ (Veri Yok)</span>'}
                    </span>
                  </div>
                </div>

                <!-- Minimalist & Vurgulu 1 KG Teklif Fiyatı Rozet (Card View) -->
                <div class="p-3 bg-gradient-to-br from-emerald-950/90 to-slate-950 rounded-xl border border-emerald-500/60 my-2 space-y-1">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-extrabold text-emerald-400 uppercase text-[10px] tracking-wider">1 KG TEKLİF FİYATI:</span>
                    <span class="text-[9px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/80">%${kdvRate} KDV</span>
                  </div>
                  <div class="flex justify-between items-baseline">
                    <span class="font-black text-emerald-300 text-lg tracking-tight">
                      ${hasOilData ? `${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} <span class="text-xs text-emerald-400">/ KG</span>` : `<span class="text-amber-400 text-sm font-bold">-- (Veri Yok)</span>`}
                    </span>
                    <span class="text-[10px] font-bold text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/80">%${discountPct} İsk.</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px] text-slate-300 font-bold border-t border-emerald-900/60 pt-1">
                    <span>Sipariş Toplamı: <strong class="text-emerald-300">${hasOilData ? PriceCalculator.formatTL(totalOrderPrice) + ' ₺' : '--'}</strong></span>
                    <span>(${kg} KG)</span>
                  </div>
                </div>

                <!-- Ambalaj Seçici veya Toptan Elle KG Yazma Girişi (Card View) -->
                <div class="my-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <label class="text-slate-200 text-xs font-bold">${layer2GroupMode === 'wholesale_drums' ? '📦 Sipariş Miktarı:' : '🧴 Ambalaj Boyutu:'}</label>
                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="flex items-center gap-1">
                      <input type="number" value="${kg}" min="1" step="1" placeholder="KG" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-20 bg-slate-900 border border-sky-500/60 text-sky-200 font-black text-xs px-2 py-1 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-sky-500">
                      <span class="text-xs font-black text-sky-300">KG</span>
                    </div>
                  ` : `
                    <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-sky-500/50 text-sky-300 font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none">
                      ${getLayer2VolumeOptionsHtml(vol, product)}
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
                <button onclick="toggleLayer2Drawer('${product.id}')" class="text-xs font-bold px-3 py-2 rounded-xl bg-[#16223b] hover:bg-slate-800 text-amber-300 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm">
                  ⚡ ${isDrawerOpen ? "Sistem 1'i Gizle" : "Sistem 1 Simülatörü"}
                </button>
              </div>

              <!-- SİSTEM 1 KANAL SATIŞ SİMÜLATÖRÜ ÇEKMECESİ (CARD VIEW) -->
              ${isDrawerOpen ? `
                <div class="mt-3 pt-3 border-t border-slate-800 bg-[#0e172a] p-3 rounded-xl border border-slate-800 animate-slide-up space-y-2.5">
                  <div class="flex items-center justify-between bg-[#0b1325] p-2 rounded-lg border border-slate-800">
                    <label class="text-xs font-bold text-slate-200">🎯 Hedef Net Kâr (₺):</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-16 bg-[#0e172a] border border-slate-700 text-emerald-300 font-bold text-xs px-2 py-1 rounded-md text-center focus:outline-none">
                      <span class="text-xs font-bold text-slate-300">₺</span>
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
  const initialCost = product.initialCostPerKg !== undefined ? product.initialCostPerKg : (product.costPerKg || 0);
  const initialSeed = product.initialSeedCostPerKg !== undefined ? product.initialSeedCostPerKg : 0;
  const initialYield = product.initialYieldPercent !== undefined ? product.initialYieldPercent : 0;
  const initialHerb = product.initialHerbCostPerKg !== undefined ? product.initialHerbCostPerKg : 0;
  const initialOliveOil = product.initialOliveOilCostPerKg !== undefined ? product.initialOliveOilCostPerKg : 240.00;

  if (field === "seedCostPerKg") product.seedCostPerKg = initialSeed;
  else if (field === "yieldPercent") product.yieldPercent = initialYield;
  else if (field === "dipPercent") {
    product.dipPercent = 0;
    product.dipStatus = "none";
  }
  else if (field === "herbCostPerKg") product.herbCostPerKg = initialHerb;
  else if (field === "oliveOilCostPerKg") product.oliveOilCostPerKg = initialOliveOil;
  else if (field === "herbRatioKg") product.herbRatioKg = 0.20;
  else if (field === "herbKg") product.herbKg = null;
  else if (field === "oilKg") product.oilKg = null;
  else if (field === "wholesaleCostPerKg") product.wholesaleCostPerKg = initialCost;
  else if (field === "layer2Profit") product.layer2Profit = (typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) ? StorageManager.getGlobalTargetProfit() : 70;
  else if (field === "all") {
    product.seedCostPerKg = initialSeed;
    product.yieldPercent = initialYield;
    product.dipPercent = 0;
    product.dipStatus = "none";
    product.herbCostPerKg = initialHerb;
    product.oliveOilCostPerKg = initialOliveOil;
    product.herbRatioKg = 0.20;
    product.herbKg = null;
    product.oilKg = null;
    product.wholesaleCostPerKg = initialCost;
    product.supplyType = product.category === "Uçucu Yağlar" ? "wholesale" : (product.supplyType || "press");
    product.layer2Profit = (typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) ? StorageManager.getGlobalTargetProfit() : 70;
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
      oliveOilCostPerKg: product.oliveOilCostPerKg !== undefined ? product.oliveOilCostPerKg : 240.00,
      herbRatioKg: product.herbRatioKg,
      herbKg: product.herbKg,
      oilKg: product.oilKg,
      supplyType: supplyType,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      fallbackCostPerKg: 0
    });
    product.herbRatioKg = macerationRes.calculatedRatio;
    product.layer2NetCostPerKg = macerationRes.netCostPerKg;
  } else {
    const coldPressRes = PriceCalculator.calculateColdPressCost({
      seedCostPerKg: product.seedCostPerKg !== undefined ? product.seedCostPerKg : initialSeed,
      yieldPercent: product.yieldPercent !== undefined ? product.yieldPercent : initialYield,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      supplyType: supplyType,
      dipStatus: product.dipStatus || "none",
      dipPercent: product.dipPercent || 0,
      fallbackCostPerKg: 0
    });
    product.layer2NetCostPerKg = coldPressRes.netCostPerKg;
  }

  // Isolate Katman 2 reset: Clear Katman 2 Sim override data only!
  StorageManager.resetLayer2SimProduct(product.id);
  if (typeof currentProducts !== "undefined" && currentProducts && currentProducts[product.id]) {
    delete currentProducts[product.id].layer2Volume;
    delete currentProducts[product.id].layer2Profit;
    delete currentProducts[product.id].layer2NetCostPerKg;
    delete currentProducts[product.id].seedCostPerKg;
    delete currentProducts[product.id].yieldPercent;
    delete currentProducts[product.id].herbCostPerKg;
    delete currentProducts[product.id].oliveOilCostPerKg;
    delete currentProducts[product.id].herbRatioKg;
    delete currentProducts[product.id].herbKg;
    delete currentProducts[product.id].oilKg;
    delete currentProducts[product.id].wholesaleCostPerKg;
    delete currentProducts[product.id].dipStatus;
    delete currentProducts[product.id].dipPercent;
  }
  if (typeof cardActiveVolumes !== "undefined") {
    delete cardActiveVolumes[product.id];
  }
  renderLayer2Cards();
  if (typeof renderLayer3Cards === "function") renderLayer3Cards();
  if (typeof updateLayer2BannerStats === "function") updateLayer2BannerStats();
  if (typeof calculateMultipackSim === "function") calculateMultipackSim();
  if (typeof calculateOfferSim === "function") calculateOfferSim();
  showToast(`Sıfırlandı: ${product.name} (Fabrika Değerlerine Döndü ↺)`);
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
  const masterProduct = (currentProducts && currentProducts[productId]) ? currentProducts[productId] : (StorageManager.getProducts()[productId] || {});
  const simData = StorageManager.getLayer2SimProduct(productId);
  const product = { ...masterProduct, ...simData };
  if (!product || !product.name) return;

  if (field === "productionType") product.productionType = value;
  if (field === "supplyType") product.supplyType = value; // 'press' | 'wholesale'
  if (field === "wholesaleCostPerKg") {
    product.wholesaleCostPerKg = parseFloat(value) || 0;
  }

  if (field === "seedCostPerKg") product.seedCostPerKg = parseFloat(value) || 0;
  if (field === "yieldPercent") product.yieldPercent = parseFloat(value) || 0;
  if (field === "dipStatus") product.dipStatus = value;
  if (field === "dipPercent") product.dipPercent = parseFloat(value) || 0;

  if (field === "herbCostPerKg") product.herbCostPerKg = parseFloat(value) || 0;
  if (field === "oliveOilCostPerKg") product.oliveOilCostPerKg = parseFloat(value) || 240.00;
  if (field === "herbRatioKg") product.herbRatioKg = parseFloat(value) || 0.2;
  if (field === "herbKg") product.herbKg = value !== "" ? parseFloat(value) : null;
  if (field === "oilKg") product.oilKg = value !== "" ? parseFloat(value) : null;

  if (field === "layer2Volume") {
    product.layer2Volume = value;
    if (typeof cardActiveVolumes !== "undefined") {
      cardActiveVolumes[productId] = value;
    }
  }
  if (field === "layer2WholesaleKg") product.layer2WholesaleKg = parseFloat(value) || 30;
  if (field === "wholesaleMarginPct") product.wholesaleMarginPct = parseFloat(value) || 20;
  if (field === "wholesaleMarginMode") product.wholesaleMarginMode = value; // 'percent' | 'amount'
  if (field === "wholesaleMarginValue") product.wholesaleMarginValue = parseFloat(value) || 0;
  if (field === "layer2Margin" || field === "layer2Profit") {
    product.layer2Profit = parseFloat(value) || 0;
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

  const initialCost = (product.initialCostPerKg !== undefined && product.initialCostPerKg !== null)
    ? parseFloat(product.initialCostPerKg)
    : (parseFloat(product.costPerKg) || 0);

  const currentWholesale = (product.wholesaleCostPerKg !== undefined && product.wholesaleCostPerKg !== null && !isNaN(parseFloat(product.wholesaleCostPerKg)) && parseFloat(product.wholesaleCostPerKg) > 0)
    ? parseFloat(product.wholesaleCostPerKg)
    : initialCost;

  if (isMaceration) {
    const macerationRes = PriceCalculator.calculateMacerationCost({
      herbCostPerKg: product.herbCostPerKg || 0,
      oliveOilCostPerKg: product.oliveOilCostPerKg !== undefined ? product.oliveOilCostPerKg : 240.00,
      herbRatioKg: product.herbRatioKg,
      herbKg: product.herbKg,
      oilKg: product.oilKg,
      supplyType: supplyType,
      wholesaleCostPerKg: currentWholesale,
      fallbackCostPerKg: initialCost
    });
    product.herbRatioKg = macerationRes.calculatedRatio;
    product.layer2NetCostPerKg = macerationRes.netCostPerKg;
  } else {
    const coldPressRes = PriceCalculator.calculateColdPressCost({
      seedCostPerKg: product.seedCostPerKg !== undefined ? product.seedCostPerKg : 0,
      yieldPercent: product.yieldPercent !== undefined ? product.yieldPercent : 0,
      wholesaleCostPerKg: currentWholesale,
      supplyType: supplyType,
      dipStatus: product.dipStatus || "none",
      dipPercent: product.dipPercent || 0,
      fallbackCostPerKg: initialCost
    });
    product.layer2NetCostPerKg = coldPressRes.netCostPerKg;
  }

  // Update in-memory currentProducts for 100% instant reactivity across all layers
  if (typeof currentProducts !== "undefined" && currentProducts && currentProducts[productId]) {
    Object.assign(currentProducts[productId], {
      productionType: product.productionType,
      supplyType: product.supplyType,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      seedCostPerKg: product.seedCostPerKg,
      yieldPercent: product.yieldPercent,
      dipStatus: product.dipStatus,
      dipPercent: product.dipPercent,
      herbCostPerKg: product.herbCostPerKg,
      oliveOilCostPerKg: product.oliveOilCostPerKg,
      herbRatioKg: product.herbRatioKg,
      herbKg: product.herbKg,
      oilKg: product.oilKg,
      layer2Volume: product.layer2Volume,
      layer2WholesaleKg: product.layer2WholesaleKg,
      layer2Profit: product.layer2Profit,
      layer2NetCostPerKg: product.layer2NetCostPerKg
    });
  }

  // Isolate Katman 2 saving: Save ONLY into Layer2Sim storage namespace!
  StorageManager.saveLayer2SimProduct(productId, {
    productionType: product.productionType,
    supplyType: product.supplyType,
    wholesaleCostPerKg: product.wholesaleCostPerKg,
    seedCostPerKg: product.seedCostPerKg,
    yieldPercent: product.yieldPercent,
    dipStatus: product.dipStatus,
    dipPercent: product.dipPercent,
    herbCostPerKg: product.herbCostPerKg,
    oliveOilCostPerKg: product.oliveOilCostPerKg,
    herbRatioKg: product.herbRatioKg,
    herbKg: product.herbKg,
    oilKg: product.oilKg,
    layer2Volume: product.layer2Volume,
    layer2WholesaleKg: product.layer2WholesaleKg,
    layer2Profit: product.layer2Profit,
    layer2NetCostPerKg: product.layer2NetCostPerKg
  });

  // Re-render Katman 1
  renderLayer2Cards();

  // User Directive: Instantly re-render Katman 2 & Katman 3 so all changes are live!
  if (typeof renderLayer3Cards === "function") {
    renderLayer3Cards();
  }
  if (typeof updateLayer2BannerStats === "function") {
    updateLayer2BannerStats();
  }
  if (typeof calculateMultipackSim === "function") {
    calculateMultipackSim();
  }
  if (typeof calculateOfferSim === "function") {
    calculateOfferSim();
  }

  if (field === "layer2Margin" || field === "layer2Profit") {
    if (typeof showToast !== "undefined") {
      showToast(`🎯 ${product.name} hedef net kârı ${PriceCalculator.formatTL(product.layer2Profit)} ₺ olarak güncellendi!`);
    }
  }
}

function copyWholesaleProposal(productId, kg, unitPrice, totalPrice, kdvRate) {
  let productsMap = (typeof currentProducts !== "undefined" && currentProducts) ? currentProducts : StorageManager.getProducts();
  const product = productsMap[productId] || {};
  const productName = product.name || "Bitkisel Yağ";
  const sku = product.sku || productId;

  const wholesalePack = PriceCalculator.calculateWholesalePackagingBreakdown(kg);
  const containerText = wholesalePack.breakdownText || `${kg} KG Bidon`;

  const text = `Cansızzade Bitkisel Yağlar - B2B Toptan Satış Teklifi\n----------------------------------------------------\nÜrün: ${productName} (SKU: ${sku})\nAmbalaj Dağılımı: ${containerText} (Toplam ${kg} KG)\n1 KG Birim Satış Fiyatı: ${PriceCalculator.formatTL(unitPrice)} ₺ / KG (%${kdvRate} KDV Dahil)\nSipariş Toplam Tutarı: ${PriceCalculator.formatTL(totalPrice)} ₺\nTeslimat: Tesis Çıkışlı / Ambar Kargo\n----------------------------------------------------`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`📋 ${productName} (${containerText}) B2B Teklif Metni Kopyalandı!`);
    }).catch(() => {
      showToast(`📋 ${productName} B2B Teklif Metni Hazırlandı!`);
    });
  } else {
    showToast(`📋 ${productName} B2B Teklif Metni Hazırlandı!`);
  }
}

// ----------------------------------------------------
// 🔴 KIRMIZI ÇİZGİ DİP FİYAT VE 🎁 KOMBİN SET SİMS
// ----------------------------------------------------

let showRedLineFloor = false;

function toggleRedLineFloor() {
  showRedLineFloor = !showRedLineFloor;
  updateTopDipFiyatBtnState();

  if (currentLayerMode === 1) renderLayer2Cards();
  else if (currentLayerMode === 3) renderProductGrid();
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
  const defProfit = (typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) ? StorageManager.getGlobalTargetProfit() : 70;
  if (profitInput) {
    profitInput.value = defProfit;
    calculateCurrentModal();
    if (typeof showToast !== "undefined") {
      showToast(`🟢 Standart Hedef Kâr (${PriceCalculator.formatTL(defProfit)} ₺) Aktif`, "info");
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
      
      // Connect directly to Katman 2 Live Cost Engine for exact production & tax protection cost
      const calc = getLayer2EffectiveCostForVolume(product, vol, overheadRes.overheadPerKg);
      const itemNetCost = calc.effectiveNetCost;

      const costBadge = document.getElementById(`bundle-item-cost-${entry.idx}`);
      if (costBadge) costBadge.textContent = PriceCalculator.formatTL(itemNetCost) + " ₺";

      return itemNetCost;
    });

    if (!p3) {
      const costBadge3 = document.getElementById("bundle-item-cost-3");
      if (costBadge3) costBadge3.textContent = "0,00 ₺";
    }

    const boxCost = parseFloat(document.getElementById("bundle-box-cost")?.value) || 0;
    const desi = parseInt(document.getElementById("bundle-desi-select")?.value, 10) || 3;
    const dhlCargo = PriceCalculator.getDhlRateByDesi(desi);

    const bundleTargetPrice = parseFloat(priceInput.value) || 0;
    const itemsCostSum = costsList.reduce((a, b) => a + b, 0);
    const totalCost = itemsCostSum + boxCost;

    const costEl = document.getElementById("bundle-total-cost");
    if (costEl) costEl.textContent = PriceCalculator.formatTL(totalCost);

    const totalCostBadge = document.getElementById("bundle-total-cost-badge");
    if (totalCostBadge) totalCostBadge.textContent = PriceCalculator.formatTL(totalCost) + " ₺";

    const tyFloorPrice = (totalCost + dhlCargo) / (1 - 0.19);
    const tyFloorBadge = document.getElementById("bundle-ty-floor-badge");
    if (tyFloorBadge) tyFloorBadge.textContent = PriceCalculator.formatTL(tyFloorPrice) + " ₺";

    const cargoSavingsEl = document.getElementById("l3-bundle-cargo-savings") || document.getElementById("bundle-cargo-savings");
    const savedCargo = (itemEntries.length - 1) * dhlCargo;
    if (cargoSavingsEl) cargoSavingsEl.textContent = `🚀 Tek Kargo: +${PriceCalculator.formatTL(savedCargo)} Kargo Tasarrufu!`;

    const tyRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 19, cargo: dhlCargo });
    const iyRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 4, cargo: dhlCargo });
    const hbRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 17, cargo: dhlCargo });
    const storeProfit = bundleTargetPrice - totalCost;

    const itemsSummaryHtml = `
      <div class="text-[10px] text-slate-300 font-semibold bg-slate-950/90 p-2 rounded-xl border border-slate-800 space-y-1 mb-2">
        <div class="font-bold text-sky-400 uppercase tracking-wider text-[9px] border-b border-slate-800/80 pb-1 flex justify-between">
          <span>📦 SET İÇERİĞİ & SEÇİLEN HACİMLER</span>
          <span>BİRİM MALİYET</span>
        </div>
        ${itemEntries.map((e, idx) => `
          <div class="flex justify-between items-center text-slate-300">
            <span class="truncate pr-1">${idx + 1}. ${e.product.name} <strong class="text-sky-300">(${e.vol})</strong></span>
            <span class="font-bold text-amber-300 shrink-0 ml-1">${PriceCalculator.formatTL(costsList[idx])}</span>
          </div>
        `).join('')}
        ${boxCost > 0 ? `
          <div class="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-1">
            <span>Ortak Kutu & Ambalaj:</span>
            <span class="font-bold text-slate-200">${PriceCalculator.formatTL(boxCost)}</span>
          </div>
        ` : ''}
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
              <div class="flex justify-between"><span>(-) DHL Kargo (${desi} Desi):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(tyRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Hakediş:</span><span class="text-emerald-300">${PriceCalculator.formatTL(tyRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(tyRes.netProfit)}
        </div>

        <!-- 2. HEPSİBURADA KOMBİN KARTI -->
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
              <div class="flex justify-between"><span>(-) DHL Kargo (${desi} Desi):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(hbRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Hakediş:</span><span class="text-emerald-300">${PriceCalculator.formatTL(hbRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(hbRes.netProfit)}
        </div>

        <!-- 3. İYZİCO (WEB SİTENİZ) KOMBİN KARTI -->
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
              <div class="flex justify-between"><span>(-) DHL Kargo (${desi} Desi):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(iyRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Hakediş:</span><span class="text-emerald-300">${PriceCalculator.formatTL(iyRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(iyRes.netProfit)}
        </div>
      `;
    }
  } catch (err) {
    console.error("Update Bundle Error:", err);
  }
}

// =========================================================================
// 🚀 3. KATMAN: E-TİCARET KAMPANYA, ÇOKLU SEPET & KOMBİN SET LABORATUVARI
// =========================================================================

let currentLayer3SubTab = "multipack"; // 'multipack' | 'bundle' | 'offers' | 'bulk-offers' | 'catalog'
let currentMultipackQty = 2;

function switchLayer3SubTab(tab) {
  currentLayer3SubTab = tab;

  const vMulti = document.getElementById("l3-view-multipack");
  const vBundle = document.getElementById("l3-view-bundle");
  const vOffers = document.getElementById("l3-view-offers");
  const vBulk = document.getElementById("l3-view-bulk-offers");
  const vCatalog = document.getElementById("l3-view-catalog");

  if (vMulti) vMulti.classList.toggle("hidden", tab !== "multipack");
  if (vBundle) vBundle.classList.toggle("hidden", tab !== "bundle");
  if (vOffers) vOffers.classList.toggle("hidden", tab !== "offers");
  if (vBulk) vBulk.classList.toggle("hidden", tab !== "bulk-offers");
  if (vCatalog) vCatalog.classList.toggle("hidden", tab !== "catalog");

  const btnMulti = document.getElementById("l3-tab-btn-multipack");
  const btnBundle = document.getElementById("l3-tab-btn-bundle");
  const btnOffers = document.getElementById("l3-tab-btn-offers");
  const btnBulk = document.getElementById("l3-tab-btn-bulk-offers");
  const btnCatalog = document.getElementById("l3-tab-btn-catalog");

  const activeClass = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-zinc-950 shadow-sm cursor-pointer flex items-center gap-1.5";
  const inactiveClass = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1.5";

  if (btnMulti) btnMulti.className = tab === "multipack" ? activeClass : inactiveClass;
  if (btnBundle) btnBundle.className = tab === "bundle" ? activeClass : inactiveClass;
  if (btnOffers) btnOffers.className = tab === "offers" ? activeClass : inactiveClass;
  if (btnBulk) btnBulk.className = tab === "bulk-offers" ? activeClass : inactiveClass;
  if (btnCatalog) btnCatalog.className = tab === "catalog" ? activeClass : inactiveClass;

  if (tab === "multipack") {
    initMultipackSimulator();
  } else if (tab === "bundle") {
    populateBundleProductDropdowns();
    updateBundleSimulator();
  } else if (tab === "offers") {
    initOfferSimulator();
  } else if (tab === "bulk-offers") {
    initBulkOffersTable();
  } else if (tab === "catalog") {
    renderProductGrid();
  }
}

function initLayer3Hub() {
  switchLayer3SubTab(currentLayer3SubTab || "multipack");
}

// -------------------------------------------------------------------------
// 🚀 3. KATMAN GENEL: ANLIK CANLI ÜRÜN ARAMA & SEÇİCİ YARDIMCISI
// -------------------------------------------------------------------------
function filterLayer3ProductSelect(inputId, selectId, onChangeCallback, allowEmpty = false) {
  const inputEl = document.getElementById(inputId);
  const selectEl = document.getElementById(selectId);
  if (!selectEl) return;

  if (!currentProducts || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }
  const pList = Object.values(currentProducts || {});
  if (pList.length === 0) return;

  const query = (inputEl ? inputEl.value : "").trim().toLocaleLowerCase("tr");

  const filtered = pList.filter(p => {
    if (!query) return true;
    const nameStr = (p.name || "").toLocaleLowerCase("tr");
    const skuStr = (p.sku || "").toLocaleLowerCase("tr");
    const catStr = (p.category || "").toLocaleLowerCase("tr");
    return nameStr.includes(query) || skuStr.includes(query) || catStr.includes(query);
  });

  const prevValue = selectEl.value;
  let optionsHtml = "";

  const isOfferSelect = (selectId === "offer-product-select");

  if (isOfferSelect) {
    optionsHtml += `<option value="" disabled ${!prevValue && !query ? 'selected' : ''}>🔍 Lütfen Bir Yağ Seçiniz (veya yukarıdan arayınız)...</option>`;
  } else if (allowEmpty) {
    optionsHtml += `<option value="">-- Ürün Yok (2'li Set) --</option>`;
  }

  if (filtered.length === 0) {
    optionsHtml += `<option value="" disabled>Eşleşen ürün bulunamadı</option>`;
    selectEl.innerHTML = optionsHtml;
    selectEl.value = "";
  } else {
    optionsHtml += filtered.map(p => {
      const idKey = p.id || p.sku;
      return `<option value="${idKey}">${p.sku} - ${p.name} (${p.category})</option>`;
    }).join("");
    selectEl.innerHTML = optionsHtml;

    if (isOfferSelect) {
      if (!query && !prevValue) {
        selectEl.value = "";
      } else if (query) {
        const stillExists = filtered.some(p => (p.id === prevValue || p.sku === prevValue));
        if (stillExists) {
          selectEl.value = prevValue;
        } else {
          selectEl.value = filtered[0].id || filtered[0].sku;
        }
      } else {
        const stillExists = filtered.some(p => (p.id === prevValue || p.sku === prevValue));
        selectEl.value = stillExists ? prevValue : "";
      }
    } else {
      // Önceki seçim hala filtrelenen listede varsa koru, yoksa ilk eşleşeni otomatik seç
      const stillExists = filtered.some(p => (p.id === prevValue || p.sku === prevValue));
      if (stillExists) {
        selectEl.value = prevValue;
      } else {
        selectEl.value = filtered[0].id || filtered[0].sku;
      }
    }
  }

  if (typeof onChangeCallback === "function") {
    onChangeCallback();
  }
}

function clearLayer3ProductSearch(inputId, selectId, onChangeCallback, allowEmpty = false) {
  const inputEl = document.getElementById(inputId);
  if (inputEl) inputEl.value = "";
  if (selectId === "offer-product-select") {
    const selectEl = document.getElementById(selectId);
    if (selectEl) selectEl.value = "";
  }
  filterLayer3ProductSelect(inputId, selectId, onChangeCallback, allowEmpty);
}

// -------------------------------------------------------------------------
// 1. SEKME: 📦 2'Lİ & ÇOKLU ADET KAMPANYA SİMÜLATÖRÜ
// -------------------------------------------------------------------------
function initMultipackSimulator() {
  const sel = document.getElementById("mp-product-select");
  if (!sel) return;

  if (!currentProducts || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }
  const pList = Object.values(currentProducts || {});
  if (pList.length === 0) return;

  if (sel.options.length === 0) {
    sel.innerHTML = pList.map(p => {
      const idKey = p.id || p.sku;
      return `<option value="${idKey}">${p.sku} - ${p.name} (${p.category})</option>`;
    }).join("");
  }

  onMultipackProductChange();
}

function onMultipackProductChange() {
  const sel = document.getElementById("mp-product-select");
  const volSel = document.getElementById("mp-volume-select");
  const channelSel = document.getElementById("mp-channel-select");
  const priceInput = document.getElementById("mp-single-price");
  if (!sel) return;

  const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
  if (!p) return;

  const vol = volSel ? volSel.value : "250ml";
  const ch = channelSel ? channelSel.value : "trendyol";
  
  // Prefer live scraped price or recommended price from Katman 1
  let defaultPrice = 0;
  const lp = getPlatformLivePrice(ch, p, vol);
  if (lp.price !== null && lp.price > 0) {
    defaultPrice = lp.price;
  } else {
    const overheadConfig = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
    const costCalc = getLayer2EffectiveCostForVolume(p, vol, overheadRes.overheadPerKg);
    const rec = ch === "trendyol" ? costCalc.trendyolRecommended : costCalc.iyzicoRecommended;
    if (costCalc.hasOilData && rec && rec.salePrice > 0) {
      defaultPrice = rec.salePrice;
    } else if (p.prices && p.prices[vol]) {
      defaultPrice = p.prices[vol];
    } else {
      defaultPrice = 250;
    }
  }

  if (priceInput) priceInput.value = defaultPrice;

  calculateMultipackSim();
}

function setMultipackQty(qty) {
  currentMultipackQty = qty;
  const customInput = document.getElementById("mp-custom-qty");
  if (customInput) customInput.value = qty;

  const btn2 = document.getElementById("mp-qty-btn-2");
  const btn3 = document.getElementById("mp-qty-btn-3");
  const btn4 = document.getElementById("mp-qty-btn-4");

  const activeClass = "flex-1 py-1 px-2 rounded-lg text-xs font-black bg-blue-600 text-white border border-blue-400 cursor-pointer";
  const inactiveClass = "flex-1 py-1 px-2 rounded-lg text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700 hover:text-white cursor-pointer";

  if (btn2) btn2.className = qty === 2 ? activeClass : inactiveClass;
  if (btn3) btn3.className = qty === 3 ? activeClass : inactiveClass;
  if (btn4) btn4.className = qty === 4 ? activeClass : inactiveClass;

  calculateMultipackSim();
}

function setMultipackDiscount(val) {
  const range = document.getElementById("mp-discount-range");
  if (range) range.value = val;
  onMultipackDiscountChange(val);
}

function onMultipackDiscountChange(val) {
  const badge = document.getElementById("mp-discount-val-badge");
  if (badge) badge.textContent = `%${val} İndirim`;
  calculateMultipackSim();
}

function calculateMultipackSim() {
  try {
    const sel = document.getElementById("mp-product-select");
    const volSel = document.getElementById("mp-volume-select");
    const channelSel = document.getElementById("mp-channel-select");
    const desiSel = document.getElementById("mp-desi-select");
    const customQtyInput = document.getElementById("mp-custom-qty");
    const priceInput = document.getElementById("mp-single-price");
    const rangeInput = document.getElementById("mp-discount-range");

    if (!sel || !volSel || !priceInput) return;

    const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
    if (!p) return;

    const vol = volSel.value || "250ml";
    const channel = channelSel ? channelSel.value : "trendyol";
    const comm = channel === "trendyol" ? 19 : (channel === "hepsiburada" ? 17 : 4);
    
    const desi = parseInt(desiSel?.value, 10) || 2;
    const dhlCargo = PriceCalculator.getDhlRateByDesi(desi);

    const qty = parseInt(customQtyInput?.value, 10) || currentMultipackQty || 2;
    const singlePrice = parseFloat(priceInput.value) || 0;
    const discountPercent = parseFloat(rangeInput?.value) || 25;

    // 1. Katman Canlı Saf Fabrika Maliyeti
    const overheadConfig = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
    const costCalc = getLayer2EffectiveCostForVolume(p, vol, overheadRes.overheadPerKg);
    const unitCost = costCalc.effectiveNetCost;

    const sim = PriceCalculator.calculateMultiPackSim({
      singleUnitPrice: singlePrice,
      singleUnitCost: unitCost,
      quantity: qty,
      discountPercent: discountPercent,
      discountScope: "second_item",
      commissionPercent: comm,
      cargoFee: dhlCargo
    });

    const resultsContainer = document.getElementById("mp-results-cards");
    if (!resultsContainer) return;

    const isExtraProfit = sim.extraProfitComparedToSingle >= 0;
    const extraProfitBadgeBg = isExtraProfit ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300" : "bg-rose-950/80 border-rose-500/50 text-rose-300";

    resultsContainer.innerHTML = `
      <!-- KART 1: TEKLİ SATIŞ DURUMU (REFERANS) -->
      <div class="bg-gradient-to-b from-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span class="font-extrabold text-slate-300 text-xs">👤 TEKLİ SATIŞ (1 ADET)</span>
            <span class="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">Referans</span>
          </div>

          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between"><span>1 Adet Satış Fiyatı:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(sim.singleUnitPrice)}</span></div>
            <div class="flex justify-between"><span>(-) Komisyon (%${comm}):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(sim.singleUnitPrice * (comm / 100))}</span></div>
            <div class="flex justify-between"><span>(-) DHL Kargo (${desi} Desi):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(sim.cargoFee)}</span></div>
            <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) 1 Adet Hakediş:</span><span class="text-sky-300">${PriceCalculator.formatTL(sim.singlePayout)}</span></div>
            <div class="flex justify-between text-slate-400"><span>(-) 1. Katman Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(sim.singleUnitCost)}</span></div>
          </div>
        </div>

        <div class="space-y-2 border-t border-slate-800/80 pt-2">
          <div class="${sim.singleNetProfit >= 0 ? 'bg-slate-900 border-slate-800' : 'bg-rose-950/30 border-rose-900/60'} p-2.5 rounded-xl border flex justify-between items-center text-xs">
            <span class="${sim.singleNetProfit >= 0 ? 'text-slate-400' : 'text-rose-300'} font-bold uppercase text-[10px]">1 Adet Net Kâr:</span>
            <span class="font-black ${sim.singleNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-sm tabular-nums">
              ${sim.singleNetProfit > 0 ? '+' : ''}${PriceCalculator.formatTL(sim.singleNetProfit)}
            </span>
          </div>
          <div class="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
            <span>${qty} Adet Ayrı Satılsaydı Toplam:</span>
            <span class="font-bold ${sim.singleNetProfit * qty >= 0 ? 'text-slate-300' : 'text-rose-400'} tabular-nums">
              ${sim.singleNetProfit * qty > 0 ? '+' : ''}${PriceCalculator.formatTL(sim.singleNetProfit * qty)}
            </span>
          </div>
        </div>
      </div>

      <!-- KART 2: 🚀 KAMPANYALI ÇOKLU SEPET (CANLI HESAP) -->
      <div class="bg-gradient-to-b from-[#111a2e] to-[#0e172a] p-4 rounded-2xl border border-slate-700/80 space-y-3 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        <div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">🚀</span>
              <span class="font-extrabold text-sky-400 text-xs">${qty}'Lİ PAKET / SEPET KAMPANYASI</span>
            </div>
            <span class="text-[10px] font-black text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700 animate-pulse">TEK KARGO</span>
          </div>

          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between"><span>Müşteri Sepet Toplamı:</span><span class="font-black text-amber-400 tabular-nums text-sm">${PriceCalculator.formatTL(sim.totalPrice)}</span></div>
            <div class="flex justify-between"><span>(-) Komisyon (%${comm}):</span><span class="text-rose-400 font-semibold tabular-nums">-${PriceCalculator.formatTL(sim.commAmount)}</span></div>
            <div class="flex justify-between">
              <span class="flex items-center gap-1">(-) <strong>Tek Kargo (DHL ${desi} Desi):</strong></span>
              <span class="text-rose-400 font-semibold tabular-nums">-${PriceCalculator.formatTL(sim.cargoFee)}</span>
            </div>
            <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Toplam Hakediş:</span><span class="text-emerald-300 tabular-nums text-sm">${PriceCalculator.formatTL(sim.payout)}</span></div>
            <div class="flex justify-between text-slate-400"><span>(-) ${qty} Adet Saf Maliyet:</span><span class="text-slate-200 font-semibold tabular-nums">-${PriceCalculator.formatTL(sim.totalCost)}</span></div>
          </div>
        </div>

        <div class="space-y-2 border-t border-slate-700/80 pt-2">
          <div class="${sim.netProfit >= 0 ? 'bg-gradient-to-r from-emerald-950 to-teal-950 border-emerald-500/50' : 'bg-rose-950/60 border-rose-500/40'} p-2.5 rounded-xl border flex justify-between items-center shadow-lg">
            <div>
              <span class="${sim.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} uppercase tracking-wider text-[10px] block font-bold">KAMPANYA NET KÂRI:</span>
              <span class="text-[10px] text-slate-300 font-medium">(Birim Başına: ${PriceCalculator.formatTL(sim.profitPerUnit)})</span>
            </div>
            <span class="${sim.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-black text-lg tabular-nums">
              ${sim.netProfit > 0 ? '+' : ''}${PriceCalculator.formatTL(sim.netProfit)}
            </span>
          </div>

          <div class="${extraProfitBadgeBg} p-2 rounded-xl border flex justify-between items-center text-[11px] font-bold">
            <span>📦 Kargo Tasarruf Avantajı:</span>
            <span class="font-black tabular-nums">+${PriceCalculator.formatTL(sim.cargoSaved)}</span>
          </div>

          <div class="bg-[#0b1325] border border-slate-700 p-2 rounded-xl flex justify-between items-center text-[11px] text-slate-200">
            <span>💡 Tekli Satışa Göre Net Kâr Farkı:</span>
            <span class="font-black tabular-nums ${sim.extraProfitComparedToSingle >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
              ${sim.extraProfitComparedToSingle >= 0 ? '+' : ''}${PriceCalculator.formatTL(sim.extraProfitComparedToSingle)}
            </span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Multipack calc error:", err);
  }
}

// -------------------------------------------------------------------------
// 3. SEKME: 🏷️ TRENDYOL & HB KAMPANYA TEKLİF SİMÜLATÖRÜ
// -------------------------------------------------------------------------
function initOfferSimulator() {
  const sel = document.getElementById("offer-product-select");
  const volSel = document.getElementById("offer-volume-select");
  if (!sel) return;

  if (volSel) {
    volSel.value = "1000ml";
  }

  if (!currentProducts || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }
  const pList = Object.values(currentProducts || {});
  if (pList.length === 0) return;

  if (sel.options.length <= 1) {
    let opts = `<option value="" disabled selected>🔍 Lütfen Bir Yağ / Ürün Seçiniz veya Arayınız...</option>`;
    opts += pList.map(p => {
      const idKey = p.id || p.sku;
      return `<option value="${idKey}">${p.sku} - ${p.name} (${p.category})</option>`;
    }).join("");
    sel.innerHTML = opts;
    sel.value = "";
  }

  onOfferProductChange();
}

function onOfferProductChange() {
  const sel = document.getElementById("offer-product-select");
  const volSel = document.getElementById("offer-volume-select");
  const baseInput = document.getElementById("offer-base-price");
  const targetInput = document.getElementById("offer-target-price");
  const channelSel = document.getElementById("offer-channel-select");
  if (!sel) return;

  if (!sel.value) {
    if (baseInput) baseInput.value = "";
    if (targetInput) targetInput.value = "";
    calculateOfferSim();
    return;
  }

  const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
  if (!p) {
    if (baseInput) baseInput.value = "";
    if (targetInput) targetInput.value = "";
    calculateOfferSim();
    return;
  }

  const vol = volSel ? volSel.value : "1000ml";
  const ch = channelSel ? channelSel.value : "trendyol";
  
  let defaultPrice = 0;
  const lp = getPlatformLivePrice(ch, p, vol);
  if (lp.price !== null && lp.price > 0) {
    defaultPrice = lp.price;
  } else {
    const overheadConfig = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
    const costCalc = getLayer2EffectiveCostForVolume(p, vol, overheadRes.overheadPerKg);
    const rec = ch === "trendyol" ? costCalc.trendyolRecommended : costCalc.iyzicoRecommended;
    if (costCalc.hasOilData && rec && rec.salePrice > 0) {
      defaultPrice = rec.salePrice;
    } else if (p.prices && p.prices[vol]) {
      defaultPrice = p.prices[vol];
    } else {
      defaultPrice = 500;
    }
  }

  if (baseInput) baseInput.value = defaultPrice;

  applyOfferPreset("av1");
}
window.onOfferProductChange = onOfferProductChange;
window.onOfferVolumeChange = onOfferProductChange;

function onOfferChannelChange() {
  const channel = document.getElementById("offer-channel-select")?.value || "trendyol";
  const commInput = document.getElementById("offer-commission");
  if (commInput) commInput.value = channel === "trendyol" ? 19 : 17;
  onOfferProductChange();
}

function applyOfferPreset(preset) {
  const baseInput = document.getElementById("offer-base-price");
  const targetInput = document.getElementById("offer-target-price");
  const basePrice = parseFloat(baseInput?.value) || 250;

  if (!targetInput) return;

  if (preset === "av1") {
    targetInput.value = Math.round(basePrice * 0.90); // 1. Avantajlı %10 indirim
  } else if (preset === "av2") {
    targetInput.value = Math.round(basePrice * 0.82); // 2. Çok Avantajlı %18 indirim
  } else if (preset === "av3") {
    targetInput.value = Math.round(basePrice * 0.70); // 3. Süper Avantajlı %30 indirim
  } else if (preset === "redline") {
    const sel = document.getElementById("offer-product-select");
    const volSel = document.getElementById("offer-volume-select");
    const commInput = document.getElementById("offer-commission");
    const desiSel = document.getElementById("offer-desi-select");
    if (sel && volSel) {
      const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
      if (p) {
        const vol = volSel.value || "1000ml";
        const comm = parseFloat(commInput?.value) || 19;
        const desi = parseInt(desiSel?.value, 10) || 2;
        const dhlCargo = PriceCalculator.getDhlRateByDesi(desi);
        const overheadConfig = StorageManager.getFactoryOverhead();
        const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
        const costCalc = getLayer2EffectiveCostForVolume(p, vol, overheadRes.overheadPerKg);
        const unitCost = costCalc.effectiveNetCost;
        const redline = (unitCost + dhlCargo) / (1 - (comm / 100));
        targetInput.value = Math.ceil(redline);
      }
    }
  }

  calculateOfferSim();
}

function calculateOfferSim() {
  try {
    const sel = document.getElementById("offer-product-select");
    const volSel = document.getElementById("offer-volume-select");
    const baseInput = document.getElementById("offer-base-price");
    const targetInput = document.getElementById("offer-target-price");
    const commInput = document.getElementById("offer-commission");
    const desiSel = document.getElementById("offer-desi-select");
    const cardEl = document.getElementById("offer-analysis-card");

    if (!sel || !volSel || !cardEl) return;

    if (!sel.value) {
      cardEl.className = "bg-slate-950/70 border border-dashed border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center min-h-[240px]";
      cardEl.innerHTML = `
        <div class="space-y-3 max-w-md mx-auto py-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🏷️
          </div>
          <div>
            <h5 class="text-sm md:text-base font-bold text-slate-200">Lütfen Bir Yağ / Ürün Seçiniz</h5>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Sol taraftaki arama kutusuna yağ ismini yazarak (örn: <em>Kekik, Biberiye, Çörek Otu</em>) veya açılır listeden ürünü seçiniz. Kârlılık analizi ve fabrika maliyet faturası anında hesaplanacaktır.
            </p>
          </div>
          <div class="pt-1">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-950/70 border border-sky-800/70 rounded-lg text-[11px] text-sky-300 font-bold">
              ⚖️ Standart Hacim: <strong>1000 ml (1 KG)</strong>
            </span>
          </div>
        </div>
      `;
      return;
    }

    const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
    if (!p) {
      cardEl.className = "bg-slate-950/70 border border-dashed border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center min-h-[240px]";
      cardEl.innerHTML = `
        <div class="space-y-2 text-center text-xs text-slate-400 py-6">
          <p>Seçilen ürün bulunamadı. Lütfen listeden başka bir ürün seçiniz.</p>
        </div>
      `;
      return;
    }

    const vol = volSel.value || "1000ml";
    const basePrice = parseFloat(baseInput?.value) || 0;
    const offerPrice = parseFloat(targetInput?.value) || 0;
    const comm = parseFloat(commInput?.value) || 19;
    const desi = parseInt(desiSel?.value, 10) || 2;
    const dhlCargo = PriceCalculator.getDhlRateByDesi(desi);

    // 1. Katman Canlı Saf Fabrika Maliyeti
    const overheadConfig = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
    const costCalc = getLayer2EffectiveCostForVolume(p, vol, overheadRes.overheadPerKg);
    const unitCost = costCalc.effectiveNetCost;

    const isMaceration = isMacerationOil(p);
    const isEssential = p.category === "Uçucu Yağlar";
    let supplyType = p.supplyType;
    if (isEssential && (!supplyType || supplyType === "press")) supplyType = "wholesale";
    if (!supplyType) supplyType = isEssential ? "wholesale" : "press";
    const isWholesale = (supplyType === "wholesale");

    const kg = costCalc.volInKg || (PriceCalculator.getVolumeMl(vol) / 1000);
    const rawOilCost = costCalc.rawOilCost;
    const packCost = costCalc.packCost;
    const linearOverhead = costCalc.linearOverhead;
    const laborAssemblyFee = costCalc.laborAssemblyFee;
    const costPerKg = costCalc.costPerKg;

    const seedCost = (p.seedCostPerKg !== undefined && p.seedCostPerKg !== null) ? parseFloat(p.seedCostPerKg) : 0;
    const yieldPct = (p.yieldPercent !== undefined && p.yieldPercent !== null) ? parseFloat(p.yieldPercent) : 0;
    const dipStatus = p.dipStatus || "none";
    const dipPercent = (p.dipPercent !== undefined && p.dipPercent !== null) ? parseFloat(p.dipPercent) : 0;

    const sim = PriceCalculator.calculateMarketplaceOfferSim({
      basePrice: basePrice,
      offerPrice: offerPrice,
      unitCost: unitCost,
      commissionPercent: comm,
      cargoFee: dhlCargo
    });

    const isZeroOffer = offerPrice <= 0;
    const isProfit = sim.isProfitable;
    const isNegativePayout = sim.payout < 0;

    const cardBg = isProfit 
      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border-emerald-500/50 shadow-emerald-950/30" 
      : isZeroOffer
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/50 border-rose-500/80 shadow-rose-950/40"
        : "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 border-rose-500/60 shadow-rose-950/30";

    const badgeStatus = isProfit
      ? `<span class="px-3 py-1 rounded-xl text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/60 flex items-center gap-1.5 shadow-sm">🟢 KÂRLI TEKLİF (+${PriceCalculator.formatTL(sim.netProfit)})</span>`
      : isZeroOffer
        ? `<span class="px-3 py-1 rounded-xl text-xs font-black bg-rose-950 text-rose-300 border border-rose-500/80 flex items-center gap-1.5 shadow-sm">⚠️ GEÇERSİZ / 0 ₺ TEKLİF (${PriceCalculator.formatTL(sim.netProfit)})</span>`
        : `<span class="px-3 py-1 rounded-xl text-xs font-black bg-rose-950 text-rose-300 border border-rose-500/60 flex items-center gap-1.5 shadow-sm">🔴 ZARARLI TEKLİF (${PriceCalculator.formatTL(sim.netProfit)})</span>`;

    const discountRateFromBase = basePrice > 0
      ? (isZeroOffer ? "100 (Bedava)" : Math.round(((basePrice - offerPrice) / basePrice) * 100))
      : 0;

    cardEl.className = `${cardBg} rounded-2xl p-4 md:p-5 border shadow-2xl space-y-3 transition-all`;
    cardEl.innerHTML = `
      <!-- Üst Başlık: Ürün & İndirim Özeti -->
      <div class="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
        <div>
          <h5 class="text-sm md:text-base font-black text-white flex items-center gap-2">
            ${p.name} <span class="text-sky-300 font-bold text-xs bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-800/60 shadow-sm">${vol}</span>
          </h5>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Normal Fiyat: <strong class="text-slate-200">${PriceCalculator.formatTL(basePrice)}</strong>
            ${discountRateFromBase > 0 ? `• İndirim: <strong class="text-amber-300">-%${discountRateFromBase}</strong>` : ''}
          </p>
        </div>
        ${badgeStatus}
      </div>

      <!-- 1. NAKİT AKIŞI: 4 TEMİZ KUTU -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 text-xs shadow-inner">
        <div class="p-1">
          <span class="text-slate-400 text-[10px] uppercase font-bold block">1. Teklif Satış:</span>
          <span class="font-black ${isZeroOffer ? 'text-rose-400' : 'text-white'} text-sm sm:text-base">${PriceCalculator.formatTL(sim.offerPrice)}</span>
        </div>
        <div class="p-1">
          <span class="text-slate-400 text-[10px] uppercase font-bold block">2. Komisyon (%${comm}):</span>
          <span class="font-bold text-rose-400 text-xs sm:text-sm">-${PriceCalculator.formatTL(sim.commAmount)}</span>
        </div>
        <div class="p-1">
          <span class="text-slate-400 text-[10px] uppercase font-bold block">3. Kargo (${desi} Desi):</span>
          <span class="font-bold text-rose-400 text-xs sm:text-sm">-${PriceCalculator.formatTL(sim.cargoFee)}</span>
        </div>
        <div class="p-1.5 ${isNegativePayout ? 'bg-rose-950/60 border border-rose-600/70' : 'bg-sky-950/50 border border-sky-800/60'} rounded-lg">
          <span class="${isNegativePayout ? 'text-rose-300' : 'text-sky-300'} text-[10px] uppercase font-bold block">${isNegativePayout ? '⚠️ Kargo Borcu:' : '4. Bankaya Yatan:'}</span>
          <span class="font-black ${isNegativePayout ? 'text-rose-200' : 'text-sky-200'} text-sm sm:text-base">${isNegativePayout ? '-' : ''}${PriceCalculator.formatTL(Math.abs(sim.payout))}</span>
        </div>
      </div>

      <!-- 2. HESAPLAMA DETAYI (BANKA HAKEDİŞİ VE NET KÂR FORMÜLÜ) -->
      <div class="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/90 text-[11px] space-y-1.5">
        <div class="flex flex-wrap items-center justify-between text-slate-300 gap-1 pb-1 border-b border-slate-800/70">
          <span class="text-slate-400 font-bold">🏦 Banka Hakedişi Nasıl Bulundu?</span>
          <span class="font-semibold text-slate-200">
            ${PriceCalculator.formatTL(sim.offerPrice)} (Satış)
            <span class="text-rose-400">− ${PriceCalculator.formatTL(sim.commAmount)} (Komisyon)</span>
            <span class="text-rose-400">− ${PriceCalculator.formatTL(sim.cargoFee)} (Kargo)</span>
            = <strong class="${isNegativePayout ? 'text-rose-300' : 'text-sky-300'}">${PriceCalculator.formatTL(sim.payout)}</strong>
          </span>
        </div>
        <div class="flex flex-wrap items-center justify-between text-slate-300 gap-1">
          <span class="text-slate-400 font-bold">💰 Net Cebe Kalan Kâr/Zarar:</span>
          <span class="font-semibold text-slate-200">
            <span class="${isNegativePayout ? 'text-rose-300' : 'text-sky-300'}">${PriceCalculator.formatTL(sim.payout)} (Banka)</span>
            <span class="text-amber-400">− ${PriceCalculator.formatTL(sim.unitCost)} (Fabrika Maliyeti)</span>
            = <strong class="${isProfit ? 'text-emerald-300 font-black' : 'text-rose-300 font-black'}">${isProfit ? '+' : ''}${PriceCalculator.formatTL(sim.netProfit)}</strong>
          </span>
        </div>
      </div>

      <!-- 3. KÂRLILIK DURUMU & TABAN FİYAT ŞERİDİ -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl ${isProfit ? 'bg-emerald-950/60 border border-emerald-500/50' : 'bg-rose-950/60 border border-rose-500/60'} text-xs">
        <div class="flex items-center gap-2">
          <span class="text-lg">${isProfit ? '🟢' : isZeroOffer ? '⚠️' : '🔴'}</span>
          <div>
            <span class="font-black ${isProfit ? 'text-emerald-200' : 'text-rose-200'} block">
              ${isProfit 
                ? `KÂRLI: Net +${PriceCalculator.formatTL(sim.netProfit)} (${sim.profitMargin !== null ? `%${sim.profitMargin} Marj` : ''})` 
                : isZeroOffer
                  ? `0 ₺ SATIŞ: -${PriceCalculator.formatTL(Math.abs(sim.netProfit))} Zarar (Bedava Ürün)`
                  : `ZARARLI: ${PriceCalculator.formatTL(sim.netProfit)} (Maliyeti Kurtarmıyor)`}
            </span>
            <span class="text-[10.5px] ${isProfit ? 'text-emerald-300/80' : 'text-rose-300/80'} block">
              ${isProfit 
                ? `Bankaya yatacak ${PriceCalculator.formatTL(sim.payout)}, fabrikanın ${PriceCalculator.formatTL(sim.unitCost)} imalat masrafını karşılıyor.` 
                : isZeroOffer 
                  ? `Ürün bedava gider; kargo (${PriceCalculator.formatTL(sim.cargoFee)}) + fabrika (${PriceCalculator.formatTL(sim.unitCost)}) cebinizden çıkar.` 
                  : `Bankaya yatan para ürünün ${PriceCalculator.formatTL(sim.unitCost)} fabrika maliyetini karşılamıyor!`}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="text-right">
            <span class="text-[9px] uppercase font-bold text-slate-400 block">Zararsız Taban:</span>
            <span class="text-xs font-black text-amber-300">${PriceCalculator.formatTL(sim.redlineFloorPrice)}</span>
          </div>
          ${!isProfit ? `
            <button type="button" onclick="document.getElementById('offer-target-price').value = Math.ceil(${sim.redlineFloorPrice}); calculateOfferSim();" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg shadow transition-all cursor-pointer">
              Tabanı Uygula
            </button>
          ` : ''}
        </div>
      </div>

      <!-- 4. AÇILIR / KAPANIR FABRİKA MALİYET FATURASI -->
      <div class="pt-0.5">
        <button type="button" onclick="toggleOfferInvoice()" class="w-full py-1.5 px-3 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-between cursor-pointer">
          <span class="flex items-center gap-2">
            📋 Ürünün Fabrika Üretim Faturası (${PriceCalculator.formatTL(sim.unitCost)})
          </span>
          <span class="text-[11px] text-sky-400 font-semibold">
            ${isOfferInvoiceOpen ? 'Faturayı Gizle ▲' : 'Faturayı Göster (Detay Gör) ▼'}
          </span>
        </button>

        ${isOfferInvoiceOpen ? `
          <div class="mt-2 space-y-2 bg-[#0c1324] p-3 rounded-xl border border-slate-800 text-xs animate-slide-up">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
              <div>
                <span class="text-slate-400 block font-bold">1. Ham Yağ Payı:</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(rawOilCost)}</span>
                <span class="text-[9.5px] text-slate-500 block">${isWholesale ? 'Toptan Dökme' : `Sıkım (%${yieldPct} Verim)`}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold">2. Ambalaj Payı:</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(packCost)}</span>
                <span class="text-[9.5px] text-slate-500 block">${vol} Şişe + Kapak + Kutu</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold">3. Tesis Masrafı:</span>
                <span class="font-bold ${isWholesale ? 'text-slate-500' : 'text-slate-200'}">${isWholesale ? '0,00 ₺ (Dış)' : PriceCalculator.formatTL(linearOverhead)}</span>
                <span class="text-[9.5px] text-slate-500 block">${isWholesale ? 'Toptan pres yok' : 'Elektrik/Makine/Kira'}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold">4. Dolum İşçiliği:</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(laborAssemblyFee)}</span>
                <span class="text-[9.5px] text-slate-500 block">Dolum & Paketleme</span>
              </div>
            </div>

            <div class="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-xs">
              <span class="font-bold text-amber-300">Toplam Fabrika Üretim Maliyeti:</span>
              <span class="font-black text-amber-300 text-sm">${PriceCalculator.formatTL(sim.unitCost)}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    console.error("Offer calc error:", err);
  }
}

// -------------------------------------------------------------------------
// 5. SEKME: ⚡ TRENDYOL AVANTAJLI ÜRÜNLER & TOPLU KAMPANYA KARAR MASASI
// -------------------------------------------------------------------------
let currentBulkVolume = "all";
let currentBulkDesi = 2;
let currentBulkTierMode = "all"; // 'all' | 'av1' | 'av2' | 'av3'
let currentBulkProfitFilter = "all"; // 'all' | 'profit' | 'loss'
let currentBulkSearchQuery = "";
let bulkOfferCustomValues = (typeof StorageManager !== "undefined" && StorageManager.getBulkOfferCustoms) ? StorageManager.getBulkOfferCustoms() : {}; // { [idKey]: { av1: { price, comm }, av2: ..., av3: ... } }
let bulkOpenInvoices = {}; // { [idKey]: boolean }
let bulkOpenSims = {}; // { [idKey]: boolean }

// Trendyol Kampanyasında özel komisyon desteği tanımlanmış ürünlerin haritası
// Eğer ürün burada tanımlı değilse Trendyol komisyonu indirmez, ürünün temel komisyonu (%19) sabit kalır!
const TRENDYOL_SPECIAL_PROMO_COMMISSIONS = {
  "8681608251005-2": { av1: 13.9, av2: 11.4, av3: 8.3 } // Zeytinyağlı Kudret Narı 250 gr x 2
};

function extractVolumeAndPackFromTitle(title) {
  const t = (title || "").toLowerCase();
  
  // Pack detection (e.g. 250 gr x 2 Adet, x 3 Adet, 2 Adet)
  let packQty = 1;
  const adetMatch = t.match(/(\d+)\s*(?:adet|ad\b)/i);
  const xMatch = t.match(/(?:x\s*(\d+)|(\d+)\s*x)/i);
  if (xMatch && parseInt(xMatch[1] || xMatch[2], 10) > 1) {
    packQty = parseInt(xMatch[1] || xMatch[2], 10);
  } else if (adetMatch && parseInt(adetMatch[1], 10) > 1) {
    packQty = parseInt(adetMatch[1], 10);
  }

  // Volume detection
  let volKey = "1000ml";
  if (/(?:^|[^\d])(5000\s*ml|5\s*kg|5000\s*g|5000\s*gr|5\s*lt|5\s*litre)(?:[^\d]|$)/i.test(t)) volKey = "5000ml";
  else if (/(?:^|[^\d])(1000\s*ml|1\s*kg|1000\s*g|1000\s*gr|1\s*lt|1\s*litre)(?:[^\d]|$)/i.test(t)) volKey = "1000ml";
  else if (/(?:^|[^\d])(500\s*ml|500\s*g|500\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "500ml";
  else if (/(?:^|[^\d])(300\s*ml|300\s*g|300\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "300ml";
  else if (/(?:^|[^\d])(250\s*ml|250\s*g|250\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "250ml";
  else if (/(?:^|[^\d])(150\s*ml|150\s*g|150\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "150ml";
  else if (/(?:^|[^\d])(100\s*ml|100\s*g|100\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "100ml";
  else if (/(?:^|[^\d])(50\s*ml|50\s*g|50\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "50ml";
  else if (/(?:^|[^\d])(30\s*ml|30\s*g|30\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "30ml";
  else if (/(?:^|[^\d])(20\s*ml|20\s*g|20\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "20ml";
  else if (/(?:^|[^\d])(10\s*ml|10\s*g|10\s*gr)(?:[^\d]|$)/i.test(t)) volKey = "10ml";

  return { volKey, packQty };
}

function findFactoryProductForTrendyolItem(itemTitle) {
  if (!currentProducts || Object.keys(currentProducts).length === 0) {
    currentProducts = StorageManager.getProducts();
  }
  const products = currentProducts || {};
  const t = normalizeTr(itemTitle);
  if (t.includes("endora")) return null;

  const getById = (id) => products[id] || Object.values(products).find(p => p.id === id || p.sku === id);

  // 1. Badem (Tatlı vs Acı)
  if (t.includes("aci badem") || (t.includes("badem") && t.includes("aci"))) return getById("T.0359");
  if (t.includes("tatli badem") || (t.includes("badem") && !t.includes("aci"))) return getById("T.0078");

  // 2. Hindistan Cevizi vs Normal Ceviz
  if (t.includes("hindistan cevizi")) return getById("T.0077");
  if (t.includes("ceviz") && !t.includes("hindistan")) return getById("T.0087");

  // 3. Kudret Narı (Meyveli vs Süzülmüş)
  if (t.includes("kudret nari") || t.includes("kudret")) {
    if (t.includes("suzulmus")) return getById("T.0221");
    return getById("T.0125"); // Meyveli
  }

  // 4. Sarı Kantaron
  if (t.includes("sari kantaron") || t.includes("kantaron")) return getById("T.0081");

  // 5. Nar Çekirdeği (onarıcı veya kudret narı kelimelerine takılmasını engelle)
  if (/\bnar\b/i.test(t) || t.includes("nar cekirdegi") || (t.includes("nar") && !t.includes("onar") && !t.includes("kudret"))) {
    return getById("T.0084");
  }

  // 6. Defne (Tohumu vs Yaprağı)
  if (t.includes("defne tohumu") || (t.includes("defne") && (t.includes("soguk") || t.includes("sabit")))) return getById("T.0353");
  if (t.includes("defne yapragi") || t.includes("defne")) return getById("T.0407");

  // 7. Shea (Ham vs Rafine)
  if (t.includes("shea")) {
    if (t.includes("ham") || t.includes("raw")) return getById("T.0355_ham");
    return getById("T.0355");
  }

  // 8. Skualen (Sıvı vs Wax)
  if (t.includes("skualen") || t.includes("squalene")) {
    if (t.includes("wax")) return getById("A.0301_wax");
    return getById("A.0301"); // Sıvı
  }

  // 9. Gliserin
  if (t.includes("gliserin") || t.includes("glycerol")) return getById("A.0300");

  // 10. Udi Hindi vs Hint
  if (t.includes("udi hindi") || (t.includes("udi") && t.includes("hindi"))) return getById("T.0272");
  if (t.includes("hint")) return getById("T.0155_sabit");

  // 11. Diğer Özel Yağlar (Deterministik Anahtar Kelimeler)
  if (t.includes("findik")) return getById("T.0079");
  if (t.includes("incir")) return getById("T.0362");
  if (t.includes("nioli")) return getById("U.0259");
  if (t.includes("at kestanesi")) return getById("T.0097");
  if (t.includes("papatya")) return getById("T.0367");
  if (t.includes("kakao")) return getById("T.0224");
  if (t.includes("jojoba")) return getById("T.0110");
  if (t.includes("kenevir") || t.includes("kendir")) return getById("T.0209");
  if (t.includes("uzum")) return getById("T.0086");
  if (t.includes("keten") && !t.includes("ketencik")) return getById("T.0083");
  if (t.includes("deve dikeni")) return getById("T.0323");
  if (t.includes("aynisefa") || t.includes("calendula")) return getById("T.0148");
  if (t.includes("kayisi")) return getById("T.0082");
  if (t.includes("susam")) return getById("T.0085");
  if (t.includes("argan")) return getById("T.0243");
  if (t.includes("hashas")) return getById("T.0213");
  if (t.includes("aloe") || t.includes("aloevera")) return getById("T.0361");
  if (t.includes("kabak")) return getById("T.0080");
  if (t.includes("bugday") || t.includes("ruseym")) return getById("T.0013");
  if (t.includes("aspir")) return getById("T.0358");
  if (t.includes("corek")) return getById("T.0074");
  if (t.includes("uzerlik")) return getById("T.0360");
  if (t.includes("menengic") || t.includes("bittim")) return getById("T.0210");
  if (t.includes("kusburnu")) return getById("T.0104");
  if (t.includes("isirgan")) return getById("T.0366");
  if (t.includes("sarimsak")) return getById("T.0246");
  if (t.includes("avokado")) return getById("T.0245");
  if (t.includes("chia")) return getById("T.0232");
  if (t.includes("bamya")) return getById("T.0322");
  if (t.includes("biberiye")) return getById("U.0235");
  if (t.includes("lavanta")) return getById("U.0155");
  if (t.includes("nane")) return getById("U.0199");
  if (t.includes("kekik")) return getById("U.0095");
  if (t.includes("okaliptus")) return getById("U.0248");
  if (t.includes("karanfil")) return getById("U.0105");

  return null;
}

function initBulkOffersTable() {
  const volSel = document.getElementById("bulk-volume-select");
  if (volSel) volSel.value = currentBulkVolume;
  const desiSel = document.getElementById("bulk-desi-select");
  if (desiSel) desiSel.value = String(currentBulkDesi);
  renderBulkOffersTable();
}

function onBulkVolumeChange() {
  const volSel = document.getElementById("bulk-volume-select");
  if (volSel) currentBulkVolume = volSel.value;
  renderBulkOffersTable();
}

function onBulkDesiChange() {
  const desiSel = document.getElementById("bulk-desi-select");
  if (desiSel) currentBulkDesi = parseInt(desiSel.value, 10) || 2;
  renderBulkOffersTable();
}

function setBulkTierMode(mode) {
  currentBulkTierMode = mode;
  ["all", "av1", "av2", "av3"].forEach(m => {
    const btn = document.getElementById(`bulk-tier-btn-${m}`);
    if (btn) {
      if (m === mode) {
        btn.className = "px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 text-slate-950 shadow-sm transition-all cursor-pointer";
      } else {
        btn.className = "px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer";
      }
    }
  });
  renderBulkOffersTable();
}

function setBulkProfitFilter(filter) {
  currentBulkProfitFilter = filter;
  ["all", "profit", "loss", "unknown"].forEach(f => {
    const btn = document.getElementById(`bulk-filter-btn-${f}`);
    if (btn) {
      if (f === filter) {
        btn.className = "px-2.5 py-1 font-bold rounded-lg bg-white text-slate-950 shadow-sm transition-all cursor-pointer";
      } else {
        const colorClass = f === "profit" 
          ? "text-emerald-400 hover:text-emerald-300" 
          : (f === "loss" 
              ? "text-rose-400 hover:text-rose-300" 
              : (f === "unknown" ? "text-amber-400 hover:text-amber-300" : "text-slate-400 hover:text-white"));
        btn.className = `px-2.5 py-1 font-semibold ${colorClass} rounded-lg transition-all cursor-pointer`;
      }
    }
  });
  renderBulkOffersTable();
}

function onBulkSearchInput(val) {
  currentBulkSearchQuery = (val || "").trim().toLocaleLowerCase("tr");
  renderBulkOffersTable();
}

function clearBulkSearch() {
  const inputEl = document.getElementById("bulk-search-input");
  if (inputEl) inputEl.value = "";
  currentBulkSearchQuery = "";
  renderBulkOffersTable();
}

function toggleBulkRowInvoice(prodId) {
  bulkOpenInvoices[prodId] = !bulkOpenInvoices[prodId];
  renderBulkOffersTable();
}

function toggleBulkRowSim(prodId) {
  bulkOpenSims[prodId] = !bulkOpenSims[prodId];
  renderBulkOffersTable();
}

function onBulkCustomInput(prodId, tierKey, field, val) {
  if (!bulkOfferCustomValues[prodId]) bulkOfferCustomValues[prodId] = {};
  if (!bulkOfferCustomValues[prodId][tierKey]) bulkOfferCustomValues[prodId][tierKey] = {};
  const num = parseFloat(val);
  if (!isNaN(num)) {
    bulkOfferCustomValues[prodId][tierKey][field] = num;
  }
  if (typeof StorageManager !== "undefined" && StorageManager.setBulkOfferCustoms) {
    StorageManager.setBulkOfferCustoms(bulkOfferCustomValues);
  }
  renderBulkOffersTable();
}

function applyBulkRedlinePrice(prodId, tierKey, redlinePrice) {
  if (!bulkOfferCustomValues[prodId]) bulkOfferCustomValues[prodId] = {};
  if (!bulkOfferCustomValues[prodId][tierKey]) bulkOfferCustomValues[prodId][tierKey] = {};
  bulkOfferCustomValues[prodId][tierKey].price = Math.ceil(redlinePrice);
  if (typeof StorageManager !== "undefined" && StorageManager.setBulkOfferCustoms) {
    StorageManager.setBulkOfferCustoms(bulkOfferCustomValues);
  }
  renderBulkOffersTable();
}

function resetBulkRowCustoms(prodId) {
  if (bulkOfferCustomValues[prodId]) {
    delete bulkOfferCustomValues[prodId];
  }
  if (typeof StorageManager !== "undefined" && StorageManager.setBulkOfferCustoms) {
    StorageManager.setBulkOfferCustoms(bulkOfferCustomValues);
  }
  renderBulkOffersTable();
}

function renderBulkOffersTable() {
  const container = document.getElementById("bulk-offers-table-container");
  if (!container) return;

  const catalog = getTrendyolFilteredCatalog();
  if (!catalog || catalog.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
        <span class="text-3xl">⚠️</span>
        <h5 class="text-sm font-bold text-slate-300">Trendyol Ürün Kataloğu Bulunamadı</h5>
      </div>
    `;
    return;
  }

  const overheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
  const dhlCargo = PriceCalculator.getDhlRateByDesi(currentBulkDesi);

  const evaluated = [];

  catalog.forEach(tyItem => {
    const t = (tyItem.title || "").toLowerCase();
    const u = (tyItem.url || "").toLowerCase();
    // 1. Endora kesinlikle hariç
    if (t.includes("endora") || u.includes("endora")) return;

    // 2. Hacim ve Paket Tespiti
    const { volKey, packQty } = extractVolumeAndPackFromTitle(tyItem.title);

    // 3. Hacim Filtresi (Seçili hacim varsa ve 'all' değilse)
    if (currentBulkVolume && currentBulkVolume !== "all") {
      if (volKey !== currentBulkVolume) return;
    }

    // 4. Katman 1 Ürün Eşleştirmesi
    const p = findFactoryProductForTrendyolItem(tyItem.title);
    if (!p) return;

    // 5. Arama Filtresi
    if (currentBulkSearchQuery) {
      const q = currentBulkSearchQuery;
      const titleStr = (tyItem.title || "").toLocaleLowerCase("tr");
      const nameStr = (p.name || "").toLocaleLowerCase("tr");
      const skuStr = (p.sku || "").toLocaleLowerCase("tr");
      const bcStr = (tyItem.barcode || "").toLocaleLowerCase("tr");
      const catStr = (p.category || "").toLocaleLowerCase("tr");
      if (!titleStr.includes(q) && !nameStr.includes(q) && !skuStr.includes(q) && !bcStr.includes(q) && !catStr.includes(q)) {
        return;
      }
    }

    const idKey = tyItem.barcode ? `bc_${tyItem.barcode}` : `${p.id}_${volKey}_${packQty}`;
    const custom = bulkOfferCustomValues[idKey] || {};

    const basePrice = parseFloat(tyItem.price) || 0;
    if (basePrice <= 0) return;

    // Katman 1 Üretim Maliyeti
    const costCalc = getLayer2EffectiveCostForVolume(p, volKey, overheadRes.overheadPerKg);
    const unitCost = Math.round((costCalc.effectiveNetCost * packQty) * 100) / 100;

    const barcode = tyItem.barcode || p.barcode || "";
    const promoComm = TRENDYOL_SPECIAL_PROMO_COMMISSIONS[barcode] || null;
    const baseComm = (tyItem.commissionPercent !== undefined && tyItem.commissionPercent !== null) ? tyItem.commissionPercent : (p.commissionPercent || 19);

    // 1. Avantajlı: %5 İndirim (0.95). Komisyon: Varsa özel destek, yoksa %19 sabit
    // Ham maliyet bilinmiyorsa (unitCost <= 0) otomatik yeni fiyat hesaplanmaz/yazılmaz (0 kalır).
    const defAv1Price = (unitCost > 0) ? (Math.round(basePrice * 0.95 * 100) / 100) : 0;
    const defAv1Comm = promoComm ? promoComm.av1 : baseComm;
    const av1Price = (custom.av1?.price !== undefined && custom.av1?.price !== null) ? custom.av1.price : defAv1Price;
    const av1Comm = custom.av1?.comm ?? defAv1Comm;
    const sim1 = PriceCalculator.calculateMarketplaceOfferSim({
      basePrice,
      offerPrice: av1Price,
      unitCost,
      commissionPercent: av1Comm,
      cargoFee: dhlCargo
    });

    // 2. Çok Avantajlı: %14 İndirim (0.86). Komisyon: Varsa özel destek, yoksa %19 sabit
    const defAv2Price = (unitCost > 0) ? (Math.round(basePrice * 0.86 * 100) / 100) : 0;
    const defAv2Comm = promoComm ? promoComm.av2 : baseComm;
    const av2Price = (custom.av2?.price !== undefined && custom.av2?.price !== null) ? custom.av2.price : defAv2Price;
    const av2Comm = custom.av2?.comm ?? defAv2Comm;
    const sim2 = PriceCalculator.calculateMarketplaceOfferSim({
      basePrice,
      offerPrice: av2Price,
      unitCost,
      commissionPercent: av2Comm,
      cargoFee: dhlCargo
    });

    // 3. Süper Avantajlı: %23 İndirim (0.77). Komisyon: Varsa özel destek, yoksa %19 sabit
    const defAv3Price = (unitCost > 0) ? (Math.round(basePrice * 0.77 * 100) / 100) : 0;
    const defAv3Comm = promoComm ? promoComm.av3 : baseComm;
    const av3Price = (custom.av3?.price !== undefined && custom.av3?.price !== null) ? custom.av3.price : defAv3Price;
    const av3Comm = custom.av3?.comm ?? defAv3Comm;
    const sim3 = PriceCalculator.calculateMarketplaceOfferSim({
      basePrice,
      offerPrice: av3Price,
      unitCost,
      commissionPercent: av3Comm,
      cargoFee: dhlCargo
    });

    evaluated.push({
      product: p,
      tyItem,
      idKey,
      volKey,
      packQty,
      barcode,
      url: tyItem.url || "",
      basePrice,
      baseComm,
      hasSpecialPromoComm: !!promoComm,
      unitCost,
      costCalc,
      av1: { price: av1Price, comm: av1Comm, isSpecial: !!(promoComm && promoComm.av1), sim: sim1 },
      av2: { price: av2Price, comm: av2Comm, isSpecial: !!(promoComm && promoComm.av2), sim: sim2 },
      av3: { price: av3Price, comm: av3Comm, isSpecial: !!(promoComm && promoComm.av3), sim: sim3 }
    });
  });

  // İstatistikleri Hesapla (Tüm filtrelenmiş ürünler üzerinden)
  const totalCount = evaluated.length;
  let profitableCount = 0;
  let lossCount = 0;
  let unknownCount = 0;
  let totalNetProfit = 0;
  let knownItemsCount = 0;

  evaluated.forEach(item => {
    const activeSim = currentBulkTierMode === "av2" ? item.av2.sim : (currentBulkTierMode === "av3" ? item.av3.sim : item.av1.sim);
    if (!activeSim.hasKnownCost || item.unitCost <= 0) {
      unknownCount++;
    } else if (activeSim.isProfitable) {
      profitableCount++;
      totalNetProfit += activeSim.netProfit;
      knownItemsCount++;
    } else {
      lossCount++;
      totalNetProfit += activeSim.netProfit;
      knownItemsCount++;
    }
  });

  const avgProfit = knownItemsCount > 0 ? (totalNetProfit / knownItemsCount) : 0;

  const statTotal = document.getElementById("bulk-stat-total");
  const statProfitable = document.getElementById("bulk-stat-profitable");
  const statLoss = document.getElementById("bulk-stat-loss");
  const statUnknown = document.getElementById("bulk-stat-unknown");
  const statAvg = document.getElementById("bulk-stat-avg-profit");

  if (statTotal) statTotal.textContent = totalCount;
  if (statProfitable) statProfitable.textContent = profitableCount;
  if (statLoss) statLoss.textContent = lossCount;
  if (statUnknown) statUnknown.textContent = unknownCount;
  if (statAvg) {
    statAvg.textContent = `${avgProfit >= 0 ? '+' : ''}${PriceCalculator.formatTL(avgProfit)}`;
    statAvg.className = `text-base font-black ${avgProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`;
  }

  // Kârlılık Filtresi Uygula
  let filteredList = evaluated;
  if (currentBulkProfitFilter === "profit") {
    filteredList = evaluated.filter(item => {
      if (item.unitCost <= 0) return false;
      if (currentBulkTierMode === "all") return item.av1.sim.isProfitable || item.av2.sim.isProfitable || item.av3.sim.isProfitable;
      if (currentBulkTierMode === "av1") return item.av1.sim.isProfitable;
      if (currentBulkTierMode === "av2") return item.av2.sim.isProfitable;
      if (currentBulkTierMode === "av3") return item.av3.sim.isProfitable;
      return true;
    });
  } else if (currentBulkProfitFilter === "loss") {
    filteredList = evaluated.filter(item => {
      if (item.unitCost <= 0) return false;
      if (currentBulkTierMode === "all") return item.av1.sim.isLoss || item.av2.sim.isLoss || item.av3.sim.isLoss;
      if (currentBulkTierMode === "av1") return item.av1.sim.isLoss;
      if (currentBulkTierMode === "av2") return item.av2.sim.isLoss;
      if (currentBulkTierMode === "av3") return item.av3.sim.isLoss;
      return true;
    });
  } else if (currentBulkProfitFilter === "unknown") {
    filteredList = evaluated.filter(item => {
      return item.unitCost <= 0;
    });
  }

  if (filteredList.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
        <span class="text-3xl">🔍</span>
        <h5 class="text-sm font-bold text-slate-300">Filtreye Uygun Ürün Bulunamadı</h5>
        <p class="text-xs text-slate-500">Arama teriminizi veya filtrelerinizi değiştirerek tekrar deneyiniz.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredList.map(item => {
    const p = item.product;
    const ty = item.tyItem;
    const idKey = item.idKey;
    const isCustomized = !!bulkOfferCustomValues[idKey];
    const isInvoiceOpen = !!bulkOpenInvoices[idKey];
    const isSimOpen = !!bulkOpenSims[idKey];

    const isMaceration = isMacerationOil(p);
    const isEssential = p.category === "Uçucu Yağlar";
    let supplyType = p.supplyType;
    if (isEssential && (!supplyType || supplyType === "press")) supplyType = "wholesale";
    if (!supplyType) supplyType = isEssential ? "wholesale" : "press";
    const isWholesale = (supplyType === "wholesale");
    const yieldPct = (p.yieldPercent !== undefined && p.yieldPercent !== null) ? parseFloat(p.yieldPercent) : 0;

    const renderSimDetailCol = (colTitle, data, theme, unitCost) => {
      const sim = data.sim;
      const hasKnownCost = unitCost > 0;
      const hasPrice = sim.offerPrice > 0;

      let bgGrad = 'to-amber-950/25';
      let borderCls = 'border-amber-800/50';
      let titleCls = 'text-amber-400';
      let badgeCls = 'text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800';
      let priceCls = 'text-amber-300';

      if (theme === 'sky') {
        bgGrad = 'to-sky-950/25';
        borderCls = 'border-sky-800/50';
        titleCls = 'text-sky-400';
        badgeCls = 'text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800';
        priceCls = 'text-sky-300';
      } else if (theme === 'purple') {
        bgGrad = 'to-purple-950/25';
        borderCls = 'border-purple-800/50';
        titleCls = 'text-purple-400';
        badgeCls = 'text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800';
        priceCls = 'text-purple-300';
      }

      return `
        <div class="bg-gradient-to-b from-slate-900 ${bgGrad} p-3.5 rounded-xl border ${borderCls} space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <!-- Başlık & Komisyon Rozeti -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold ${titleCls} text-xs flex items-center gap-1">
                ${colTitle}
              </span>
              <span class="text-xs font-bold ${badgeCls}">
                ${data.isSpecial ? '🏷️ Destekli ' : ''}%${data.comm} Kom.
              </span>
            </div>

            <!-- Yeni Kampanya Fiyatı (Katman 1 Tavsiye Fiyatı Tasarımında) -->
            <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
              <span class="font-semibold text-slate-400">Yeni Kampanya Fiyatı:</span>
              <span class="font-black ${priceCls} text-base tabular-nums">
                ${hasKnownCost && hasPrice ? PriceCalculator.formatTL(sim.offerPrice) : 'Maliyet Bilinmiyor'}
              </span>
            </div>

            ${(!hasKnownCost || !hasPrice) ? `
              <div class="p-3 bg-amber-950/30 rounded-lg border border-amber-800/50 text-[11px] text-amber-300 space-y-1.5 my-2">
                <div class="font-bold flex items-center gap-1.5">
                  <span>⚠️</span> 1. Katman Fabrika Maliyeti Yok
                </div>
                <p class="text-slate-400 text-[10.5px] leading-relaxed">
                  Bu ürünün hammadde maliyeti tanımlanmadığı için yeni kampanya fiyatı önerilmemiştir ve simülasyon hesaplanamamaktadır.
                </p>
              </div>
            ` : `
              <!-- Katman 1 Kesinti Döküm Listesi -->
              <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                <div class="flex justify-between items-center">
                  <span>(-) Komisyon (%${data.comm}):</span>
                  <span class="text-rose-400 font-bold tabular-nums">-${PriceCalculator.formatTL(sim.commAmount)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>(-) Kargo Ücreti (${currentBulkDesi} Desi):</span>
                  <span class="text-rose-400 font-bold tabular-nums">-${PriceCalculator.formatTL(sim.cargoFee)}</span>
                </div>
                <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5">
                  <span class="flex items-center gap-1">🏦 (=) Hakediş (Payout):</span>
                  <span class="${sim.payout >= 0 ? 'text-sky-300' : 'text-rose-300'} font-extrabold tabular-nums">${PriceCalculator.formatTL(sim.payout)}</span>
                </div>
                <div class="flex justify-between items-center text-slate-400">
                  <span>(-) Saf Fabrika Maliyeti:</span>
                  <span class="text-amber-300 font-bold tabular-nums">-${PriceCalculator.formatTL(unitCost)}</span>
                </div>
              </div>
            `}
          </div>

          <!-- Katman 1 NET KÂRINIZ / ZARARINIZ Alt Bannerı -->
          <div class="mt-2 space-y-2">
            ${(!hasKnownCost || !hasPrice) ? `
              <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center font-bold text-xs">
                <span class="text-slate-400 uppercase tracking-wider text-xs">KÂR HESABI:</span>
                <span class="text-amber-400 font-bold text-xs">Maliyet Bekleniyor</span>
              </div>
            ` : (sim.isProfitable ? `
              <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 flex justify-between items-center font-bold text-xs shadow-sm">
                <span class="text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">💰 NET KÂRINIZ:</span>
                <span class="text-emerald-300 font-black text-base tabular-nums">+${PriceCalculator.formatTL(sim.netProfit)}</span>
              </div>
            ` : `
              <div class="bg-rose-950/80 p-2.5 rounded-lg border border-rose-500/40 flex justify-between items-center font-bold text-xs shadow-sm">
                <span class="text-rose-400 uppercase tracking-wider text-xs flex items-center gap-1">🔴 NET ZARARINIZ:</span>
                <span class="text-rose-300 font-black text-base tabular-nums">${PriceCalculator.formatTL(sim.netProfit)}</span>
              </div>
            `)}

            <!-- Başa Baş Taban Fiyat -->
            <div class="flex justify-between items-center text-[10.5px] px-1 text-slate-400 border-t border-slate-800/80 pt-1.5">
              <span class="font-medium">🛡️ Başa Baş Taban Fiyat:</span>
              <strong class="font-mono ${hasKnownCost && sim.redlineFloorPrice !== null ? 'text-amber-300' : 'text-slate-500'}">
                ${hasKnownCost && sim.redlineFloorPrice !== null ? PriceCalculator.formatTL(sim.redlineFloorPrice) : 'Bilinmiyor'}
              </strong>
            </div>
          </div>
        </div>
      `;
    };

    const renderTierBox = (title, tierKey, data, colorTheme) => {
      const hasKnownCost = item.unitCost > 0;
      const hasPrice = data.price > 0;
      const isProfit = hasKnownCost && hasPrice && data.sim.isProfitable;
      const isLoss = hasKnownCost && hasPrice && data.sim.isLoss;
      const isZero = data.price <= 0;

      let borderClr = 'border-slate-800 bg-slate-950/40';
      let badgeBg = 'bg-amber-950/40 text-amber-300 border-amber-500/40';
      let badgeText = '⚠️ Maliyet Bilinmiyor';

      if (hasKnownCost) {
        if (!hasPrice) {
          borderClr = 'border-amber-900/40 bg-amber-950/10';
          badgeBg = 'bg-slate-900 text-amber-300 border-slate-700';
          badgeText = 'Fiyat Yok';
        } else if (isProfit) {
          borderClr = 'border-emerald-500/40 bg-emerald-950/20';
          badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-500/60';
          badgeText = `+${PriceCalculator.formatTL(data.sim.netProfit)}`;
        } else {
          borderClr = isZero ? 'border-rose-500/70 bg-rose-950/40' : 'border-rose-500/50 bg-rose-950/20';
          badgeBg = 'bg-rose-950 text-rose-300 border-rose-500/60';
          badgeText = `${PriceCalculator.formatTL(data.sim.netProfit)} Zarar`;
        }
      }

      return `
        <div class="p-2.5 rounded-xl border ${borderClr} flex flex-col justify-between space-y-2 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span class="text-[11px] font-black ${colorTheme} flex items-center gap-1">
              ${title}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeBg}">
              ${badgeText}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-xs">
            <div>
              <div class="flex items-center justify-between mb-0.5">
                <label class="text-[9.5px] text-slate-300 font-bold">Yeni Fiyat (₺):</label>
              </div>
              <input type="number" step="0.01" 
                     value="${hasPrice ? data.price : ''}" 
                     placeholder="${hasKnownCost ? '0.00' : 'Maliyet Bilinmiyor'}"
                     onchange="onBulkCustomInput('${idKey}', '${tierKey}', 'price', this.value)"
                     class="w-full bg-slate-950 border ${hasKnownCost ? 'border-slate-700 text-white' : 'border-amber-900/60 text-amber-300'} font-black text-xs p-1 rounded-lg text-center focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-0.5">
                <label class="text-[9.5px] text-slate-300 font-bold">Komisyon (%):</label>
                ${data.isSpecial ? `
                  <span class="text-[8.5px] font-black text-amber-400">🏷️ Destekli</span>
                ` : `
                  <span class="text-[8.5px] font-medium text-slate-500">Sabit %${data.comm}</span>
                `}
              </div>
              <input type="number" step="0.1" value="${data.comm}" 
                     onchange="onBulkCustomInput('${idKey}', '${tierKey}', 'comm', this.value)"
                     class="w-full bg-slate-950 border ${data.isSpecial ? 'border-amber-500/80 text-amber-300 font-black' : 'border-slate-700 text-white font-bold'} text-xs p-1 rounded-lg text-center focus:border-amber-500 focus:outline-none" />
            </div>
          </div>

          <!-- Sade ve Kompakt Özet Kutusu -->
          <div class="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">🏦 Banka Hakedişi:</span>
              <strong class="font-black text-xs ${hasKnownCost && hasPrice ? (data.sim.payout >= 0 ? 'text-sky-300' : 'text-rose-300') : 'text-slate-500'}">
                ${hasKnownCost && hasPrice ? PriceCalculator.formatTL(data.sim.payout) : 'Hesaplanamaz'}
              </strong>
            </div>
            <div class="flex justify-between items-center text-[10.5px]">
              <span class="text-slate-400">🛡️ Kurtaran Taban:</span>
              ${hasKnownCost && data.sim.redlineFloorPrice !== null ? `
                <strong class="text-amber-300 font-bold">${PriceCalculator.formatTL(data.sim.redlineFloorPrice)}</strong>
              ` : `
                <span class="text-slate-500 font-medium">Bilinmiyor</span>
              `}
            </div>
          </div>

          ${!hasKnownCost ? `
            <div class="text-center text-[10px] text-amber-400 font-bold py-1 bg-amber-950/30 rounded-lg border border-amber-800/40">
              ⚠️ Ham Maliyet Bilinmiyor
            </div>
          ` : (!hasPrice ? `
            <div class="text-center text-[10px] text-slate-400 font-bold py-1 bg-slate-900 rounded-lg border border-slate-800">
              Fiyat Girilmedi
            </div>
          ` : (isProfit ? `
            <div class="text-center text-[10px] text-emerald-400 font-bold py-1 bg-emerald-950/30 rounded-lg border border-emerald-800/40">
              ✅ Güvenle Onaylanabilir
            </div>
          ` : `
            <button type="button" onclick="applyBulkRedlinePrice('${idKey}', '${tierKey}', ${data.sim.redlineFloorPrice})" 
                    class="w-full py-1 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10.5px] rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1">
              🛡️ Tabanı Uygula (${PriceCalculator.formatTL(Math.ceil(data.sim.redlineFloorPrice))})
            </button>
          `))}
        </div>
      `;
    };

    const volumeBadge = item.packQty > 1 ? `${item.volKey} x ${item.packQty} Adet` : item.volKey;

    return `
      <div class="glass-card bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3 transition-all hover:border-slate-700">
        <!-- Üst Satır: Ürün Kimliği, Fiyatlar ve Fatura Butonu -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-base shrink-0">
              🌿
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h5 class="text-sm font-black text-white">${ty.title}</h5>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-800/80">
                  ${volumeBadge}
                </span>
                <span class="text-[9.5px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                  ${p.sku}
                </span>
                ${item.barcode ? `
                  <span class="text-[9.5px] font-mono text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/80">
                    Barkod: ${item.barcode}
                  </span>
                ` : ''}
              </div>
              <span class="text-[11px] text-slate-400 block mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>${p.category}</span>
                <span>•</span>
                <span>Trendyol Satış: <strong class="text-orange-400 font-bold">${PriceCalculator.formatTL(item.basePrice)}</strong></span>
                <span>•</span>
                <span>Güncel Komisyon: <strong class="text-slate-300 font-bold">%${item.baseComm}</strong></span>
                ${item.hasSpecialPromoComm ? `
                  <span class="px-1.5 py-0.2 bg-amber-950/80 border border-amber-800 text-amber-300 rounded text-[9.5px] font-bold">
                    🏷️ Ürün Komisyon Desteği
                  </span>
                ` : ''}
                ${item.url ? `
                  <span>•</span>
                  <a href="${item.url}" target="_blank" class="text-orange-400 hover:text-orange-300 underline font-semibold flex items-center gap-0.5">
                    Trendyol'da Gör ↗
                  </a>
                ` : ''}
              </span>
            </div>
          </div>

          <!-- Fabrika Maliyet Hapı ve Aksiyonlar -->
          <div class="flex items-center gap-2">
            <div class="${item.unitCost > 0 ? 'bg-amber-950/40 border-amber-800/60' : 'bg-slate-950 border-slate-800'} border px-2.5 py-1 rounded-xl text-right">
              <span class="text-[9px] ${item.unitCost > 0 ? 'text-amber-300' : 'text-slate-400'} block font-bold uppercase">1. Katman Fabrika Maliyeti</span>
              <span class="text-xs font-black ${item.unitCost > 0 ? 'text-amber-300' : 'text-amber-400'}">${item.unitCost > 0 ? PriceCalculator.formatTL(item.unitCost) : '⚠️ Bilinmiyor'}</span>
            </div>

            <button type="button" onclick="toggleBulkRowInvoice('${idKey}')" 
                    class="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer">
              ${isInvoiceOpen ? 'Faturayı Kapat ▲' : '📋 Fatura Detayı ▼'}
            </button>

            <button type="button" onclick="toggleBulkRowSim('${idKey}')" 
                    class="px-2 py-1 ${isSimOpen ? 'bg-indigo-950 hover:bg-indigo-900 border-indigo-500/80 text-indigo-300' : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-indigo-300 hover:text-white'} border text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1">
              <span>⚡</span> ${isSimOpen ? 'Simülasyonu Kapat ▲' : 'Simülasyon Detayı ▼'}
            </button>

            ${isCustomized ? `
              <button type="button" onclick="resetBulkRowCustoms('${idKey}')" 
                      class="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer" title="Teklifleri Varsayılana Döndür">
                ↺ Sıfırla
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Açılır / Kapanır 1. Katman Fabrika Faturası Detayı -->
        ${isInvoiceOpen ? `
          <div class="bg-[#0c1324] p-2.5 rounded-xl border border-slate-800 text-xs animate-slide-up space-y-2">
            ${item.unitCost <= 0 ? `
              <div class="p-2 bg-amber-950/30 rounded-lg border border-amber-800/50 text-[11px] text-amber-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>Bu ürünün Katman 1'de ham hammadde veya tohum maliyeti tanımlanmadığı için saf fabrika maliyeti hesaplanamamaktadır (0 ₺ görünmektedir). Lütfen Katman 1 veya Katman 2'den hammadde maliyetini giriniz.</span>
              </div>
            ` : ''}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
              <div>
                <span class="text-slate-400 block font-bold">1. Ham Yağ Payı:</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(item.costCalc.rawOilCost * item.packQty)}</span>
                <span class="text-[9.5px] text-slate-500 block">${isWholesale ? 'Toptan Dökme' : `Sıkım (%${yieldPct} Verim)`}${item.packQty > 1 ? ` (${item.packQty} Adet)` : ''}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold">2. Ambalaj Payı:</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(item.costCalc.packCost * item.packQty)}</span>
                <span class="text-[9.5px] text-slate-500 block">${item.volKey} Şişe + Kapak + Kutu${item.packQty > 1 ? ` (x${item.packQty})` : ''}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold">3. Tesis Masrafı:</span>
                <span class="font-bold ${isWholesale ? 'text-slate-500' : 'text-slate-200'}">${isWholesale ? '0,00 ₺ (Dış)' : PriceCalculator.formatTL(item.costCalc.linearOverhead * item.packQty)}</span>
                <span class="text-[9.5px] text-slate-500 block">${isWholesale ? 'Toptan pres yok' : 'Elektrik/Kira/Makine'}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold">4. Dolum İşçiliği:</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(item.costCalc.laborAssemblyFee * item.packQty)}</span>
                <span class="text-[9.5px] text-slate-500 block">Dolum & Paketleme${item.packQty > 1 ? ` (x${item.packQty})` : ''}</span>
              </div>
            </div>
            <div class="flex items-center justify-between border-t border-slate-800/80 pt-1 text-xs">
              <span class="font-bold text-amber-300">Toplam Saf Üretim Maliyeti:</span>
              <span class="font-black text-amber-300">${item.unitCost > 0 ? PriceCalculator.formatTL(item.unitCost) : '0,00 ₺ (Maliyet Bilinmiyor)'}</span>
            </div>
          </div>
        ` : ''}

        <!-- Açılır / Kapanır Katman 1 Tasarımlı Pazaryeri Simülasyon Çekmecesi -->
        ${isSimOpen ? `
          <div class="bg-[#0e172a] p-4 rounded-xl border border-slate-800 space-y-3.5 animate-slide-up shadow-xl">
            <div class="flex flex-wrap items-center justify-between bg-[#0b1325] p-3 rounded-xl border border-slate-800 gap-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-extrabold text-amber-400 flex items-center gap-1.5">⚡ KATMAN 1 ENTEGRE PAZARYERİ KAMPANYA SİMÜLATÖRÜ</span>
                <span class="text-xs text-slate-400">(Saf Fabrika Maliyeti & Kargo/Komisyon Kesintileri)</span>
              </div>
              <div class="flex items-center gap-2.5 text-xs">
                <span class="text-slate-400 font-semibold">1. Katman Fabrika Maliyeti:</span>
                <span class="font-black ${item.unitCost > 0 ? 'text-amber-300 bg-amber-950/80 border-amber-800' : 'text-amber-400 bg-slate-900 border-slate-800'} px-2.5 py-1 rounded-lg border">
                  ${item.unitCost > 0 ? PriceCalculator.formatTL(item.unitCost) : '⚠️ Bilinmiyor'}
                </span>
                <span class="text-slate-600 font-bold">•</span>
                <span class="text-slate-400 font-semibold">Kargo:</span>
                <span class="font-bold text-sky-300 bg-sky-950/80 px-2 py-1 rounded-lg border border-sky-800 font-mono">
                  ${currentBulkDesi} Desi (${PriceCalculator.formatTL(dhlCargo)})
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 ${currentBulkTierMode === 'all' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-3.5 text-xs">
              ${(currentBulkTierMode === 'all' || currentBulkTierMode === 'av1') ? renderSimDetailCol('🏷️ 1. Avantajlı (%5 İndirim)', item.av1, 'amber', item.unitCost) : ''}
              ${(currentBulkTierMode === 'all' || currentBulkTierMode === 'av2') ? renderSimDetailCol('💎 2. Çok Avantajlı (%14 İndirim)', item.av2, 'sky', item.unitCost) : ''}
              ${(currentBulkTierMode === 'all' || currentBulkTierMode === 'av3') ? renderSimDetailCol('🚀 3. Süper Avantajlı (%23 İndirim)', item.av3, 'purple', item.unitCost) : ''}
            </div>
          </div>
        ` : ''}

        <!-- 3 Kampanya Seviyesi Izgarası -->
        <div class="grid ${currentBulkTierMode === 'all' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-2.5">
          ${(currentBulkTierMode === 'all' || currentBulkTierMode === 'av1') ? renderTierBox('🏷️ 1. Avantajlı (%5 İndirim)', 'av1', item.av1, 'text-amber-400') : ''}
          ${(currentBulkTierMode === 'all' || currentBulkTierMode === 'av2') ? renderTierBox('💎 2. Çok Avantajlı (%14 İndirim)', 'av2', item.av2, 'text-sky-400') : ''}
          ${(currentBulkTierMode === 'all' || currentBulkTierMode === 'av3') ? renderTierBox('🚀 3. Süper Avantajlı (%23 İndirim)', 'av3', item.av3, 'text-purple-400') : ''}
        </div>
      </div>
    `;
  }).join("");
}

window.initBulkOffersTable = initBulkOffersTable;
window.renderBulkOffersTable = renderBulkOffersTable;
window.onBulkVolumeChange = onBulkVolumeChange;
window.onBulkDesiChange = onBulkDesiChange;
window.setBulkTierMode = setBulkTierMode;
window.setBulkProfitFilter = setBulkProfitFilter;
window.onBulkSearchInput = onBulkSearchInput;
window.clearBulkSearch = clearBulkSearch;
window.toggleBulkRowInvoice = toggleBulkRowInvoice;
window.toggleBulkRowSim = toggleBulkRowSim;
window.onBulkCustomInput = onBulkCustomInput;
window.applyBulkRedlinePrice = applyBulkRedlinePrice;
window.resetBulkRowCustoms = resetBulkRowCustoms;

// ----------------------------------------------------
// 📄 KATMAN 2 SAF FABRİKA MALİYETİ PDF RAPORU OLUŞTURUCU (REÇETE & DÖKÜM ENTEGRELİ)
// ----------------------------------------------------
function generateLayer2PdfReport() {
  const selectedVol = document.getElementById("pdf-report-volume-select")?.value || "1000ml";
  const volInKg = (typeof PriceCalculator.getVolumeInKg === "function")
    ? PriceCalculator.getVolumeInKg(selectedVol)
    : (PriceCalculator.getVolumeKgRatio ? PriceCalculator.getVolumeKgRatio(selectedVol) : (PriceCalculator.getVolumeMl(selectedVol) / 1000));

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
    @page { size: A4 portrait; margin: 7mm 8mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 0; font-size: 8.5px; line-height: 1.25; }
    .page { page-break-after: always; min-height: 278mm; box-sizing: border-box; padding-bottom: 8mm; position: relative; }
    .page:last-child { page-break-after: avoid; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #047857; padding-bottom: 5px; margin-bottom: 6px; }
    .header-logo { height: 52px; width: auto; max-width: 140px; object-fit: contain; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.08)); }
    .header-info { text-align: right; }
    .header-info h1 { margin: 0; font-size: 13px; color: #047857; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
    .header-info p { margin: 1px 0 0 0; font-size: 8px; color: #475569; font-weight: 600; }
    .meta-banner { background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 5px; padding: 5px 8px; margin-bottom: 6px; display: flex; justify-content: space-between; font-size: 8px; font-weight: 600; color: #166534; }
    .legend-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 8px; margin-bottom: 6px; font-size: 7.5px; color: #475569; display: flex; justify-content: space-around; font-weight: 600; }
    .cat-title { background: #047857; color: #ffffff; font-weight: 800; font-size: 9.5px; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 800; text-align: left; padding: 5px 5.5px; border-bottom: 2px solid #047857; text-transform: uppercase; font-size: 7.5px; }
    td { padding: 4.5px 5.5px; border-bottom: 1px solid #cbd5e1; color: #1e293b; vertical-align: middle; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .text-emerald { color: #047857; }
    .text-blue { color: #1d4ed8; }
    .text-purple { color: #7e22ce; }
    .text-slate { color: #64748b; font-size: 7px; }
    .footer { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; }
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
      <span><strong>Reçete & Tedarik Origin:</strong> Soğuk Sıkım (Tohum % Verim) / Maserasyon / Toptan Alış</span>
      <span><strong>1. Tohum / Toptan Yağ:</strong> Tohum Alış Fiyatı (% Verim Sıkımı) veya KDV Dahil Toptan Geliş</span>
      <span><strong>2. Ambalaj:</strong> ${selectedVol} Şişe/Etiket</span>
      <span><strong>3. Tesis Payı:</strong> Bizim Sıkımlara Tesis Gideri / Toptan Alışa 0₺</span>
      <span><strong>4. Dolum Montaj:</strong> Ambalaj Montaj İşçiliği</span>
    </div>

    <div class="cat-title">🌿 SABİT YAĞLAR DETAYLI REÇETE & 5 KALEM FATURA DÖKÜM TABLOSU (${selectedVol})</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 7%;">SKU</th>
          <th style="width: 18%;">Ürün Adı</th>
          <th style="width: 21%;">Hesaplama Reçetesi & Tedarik Türü</th>
          <th style="width: 13%;" class="text-right">1. Tohum / Toptan Yağ Alış</th>
          <th style="width: 10%;" class="text-right">2. Şişe/Ambalaj</th>
          <th style="width: 9%;" class="text-right">3. Tesis/Gider</th>
          <th style="width: 9%;" class="text-right">4. Dolum Montaj</th>
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
          const laborAssemblyFee = PriceCalculator.getLaborAssemblyFee(selectedVol);
          const totalNetCost = parseFloat((rawOilCost + packCost + linearOverhead + laborAssemblyFee).toFixed(2));

          let recipeDesc = "";
          let column1Detail = "";

          if (isWholesale) {
            recipeDesc = `<span class="text-slate font-bold">📦 Toptan Alış</span> <span class="text-slate">(Dış Tedarik)</span>`;
            column1Detail = `<span class="font-bold">${PriceCalculator.formatTL(rawOilCost)}</span><br><span class="text-slate">(Net Geliş Faturası)</span>`;
          } else if (isMaceration) {
            const herbRatio = p.herbRatioKg || 0.20;
            const ratioStr = `1:${Math.round(1 / herbRatio)}`;
            recipeDesc = `<span class="text-purple font-bold">🌿 Bizim Üretim</span> <span class="text-slate">(Maserasyon)</span>`;
            column1Detail = `<span class="font-bold text-purple">${PriceCalculator.formatTL(rawOilCost)}</span><br><span class="text-slate">(${ratioStr} Z.Yağı Oranı)</span>`;
          } else {
            const yieldPct = p.yieldPercent || 25;
            const seedCostPerKg = (p.seedCostPerKg !== undefined && p.seedCostPerKg !== null) ? p.seedCostPerKg : parseFloat((rawCostPerKg * 0.25).toFixed(2));
            const seedCostForVol = parseFloat((seedCostPerKg * volInKg).toFixed(2));
            recipeDesc = `<span class="text-emerald font-bold">🧴 Bizim Sıkım</span> <span class="text-slate">(Soğuk Sıkım)</span>`;
            column1Detail = `<span class="font-bold text-emerald">${PriceCalculator.formatTL(rawOilCost)}</span><br><span class="text-slate">(Tohum: ${PriceCalculator.formatTL(seedCostForVol)} | %${yieldPct})</span>`;
          }

          return `
            <tr>
              <td class="text-center font-bold">${idx + 1}</td>
              <td class="font-bold">${p.sku}</td>
              <td class="font-bold text-emerald">${p.name}</td>
              <td>${recipeDesc}</td>
              <td class="text-right">${column1Detail}</td>
              <td class="text-right">${PriceCalculator.formatTL(packCost)}</td>
              <td class="text-right font-bold ${isWholesale ? 'text-slate' : 'text-purple'}">${isWholesale ? '0,00 ₺ (Dış)' : PriceCalculator.formatTL(linearOverhead)}</td>
              <td class="text-right font-bold text-purple">${PriceCalculator.formatTL(laborAssemblyFee)}</td>
              <td class="text-right font-black text-blue">${PriceCalculator.formatTL(totalNetCost)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <div class="footer">
      <span>Cansızzade Yönetim & Maliyet Analiz Sistemi v2.53</span>
      <span>Sayfa 1 / 2 (Sabit Yağlar - ${selectedVol} Reçete & 5 Kalem Fatura Dökümü)</span>
    </div>
  </div>

  <!-- SAYFA 2: UÇUCU YAĞLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="Cansızzade Logo">
      <div class="header-info">
        <h1>KATMAN 2: UÇUCU YAĞLAR SAF MALİYET RAPORU (${selectedVol.toUpperCase()})</h1>
        <p>CANSIZZADE BİTKİSEL YAĞLAR SAN. TİC. LTD. ŞTİ. | <strong>UÇUCU YAĞLAR TOPTAN TEDARİK DÖKÜMÜ</strong></p>
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
      <span><strong>1. Toptan Yağ Alış:</strong> KDV Dahil Net Geliş Maliyeti</span>
      <span><strong>2. Ambalaj:</strong> ${selectedVol} Şişe/Etiket</span>
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
          <th style="width: 10%;" class="text-right">1. Toptan Yağ Alış</th>
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
          
          const ucucuLaborFee = PriceCalculator.getLaborAssemblyFee(selectedVol);
          const totalNetCost = parseFloat((rawCostKdvIn + packCost + ucucuLaborFee).toFixed(2));

          return `
            <tr>
              <td class="text-center font-bold">${idx + 1}</td>
              <td class="font-bold">${p.sku}</td>
              <td class="font-bold text-emerald">${p.name}</td>
              <td><span class="text-purple font-bold">🌸 Toptan Distilasyon</span> <span class="text-slate">(Dış Tedarik | %20 KDV Dahil)</span></td>
              <td class="text-right">${PriceCalculator.formatTL(rawCostKdvEx)}</td>
              <td class="text-right text-purple">${PriceCalculator.formatTL(kdvAmount)}</td>
              <td class="text-right font-bold text-blue">${PriceCalculator.formatTL(rawCostKdvIn)}</td>
              <td class="text-right">${PriceCalculator.formatTL(packCost)} + <span class="text-purple">${PriceCalculator.formatTL(ucucuLaborFee)}</span></td>
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

// ----------------------------------------------------
// 📄 KATMAN 3 CANLI MAĞAZA VE KATMAN 1 ÖNERİLEN FİYAT KARŞILAŞTIRMA PDF RAPORU
// ----------------------------------------------------
function generateLayer3PdfReport() {
  const channel = currentLayer3Channel || "trendyol"; // 'trendyol' or 'site'
  const isTrendyol = channel === "trendyol";
  const channelName = isTrendyol ? "🧡 Trendyol Pazaryeri" : "🌐 iyzico (Web Siteleriniz)";
  const commRate = isTrendyol ? 19 : 4;
  const cargoFee = isTrendyol ? 110 : 82.50;

  const todayStr = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  const dynamicOverheadPerKg = overheadRes.overheadPerKg;

  const logoUrl = "assets/cansizzade_logo.jpg";

  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }

  const sortedList = sortProductsByCategoryAndName(productsArr);
  const allVols = ["20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];

  // Build satır satır comparison records
  let items = [];
  let totalAboveCount = 0;
  let totalBelowCount = 0;

  sortedList.forEach(prod => {
    if (!prod || !prod.name) return;

    allVols.forEach(vk => {
      let livePrice = 0;
      if (isTrendyol) {
        const tyMatch = findTrendyolProduct(prod.name, vk);
        if (tyMatch && tyMatch.price > 0) {
          livePrice = tyMatch.price;
        }
      } else {
        const ov = StorageManager.getSiteOverride(prod.id, vk);
        if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) {
          livePrice = parseFloat(ov);
        } else {
          const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[prod.id] : null;
          if (siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0) {
            livePrice = siteData.samplePrices[vk];
          }
        }
      }

      if (livePrice > 0) {
        // Calculate Katman 2 cost & Katman 1 recommended price
        const calc = getLayer2EffectiveCostForVolume(prod, vk, dynamicOverheadPerKg);
        const netCost = calc.effectiveNetCost;

        // Katman 1 Recommended Sale Price (Target Profit = calc.targetProfit or 0 TL in Dip Fiyat Mode)
        const targetProfitForReport = isLayer3DipFiyatMode ? 0 : (calc.targetProfit !== undefined && calc.targetProfit !== null ? calc.targetProfit : ((typeof StorageManager !== "undefined" && StorageManager.getGlobalTargetProfit) ? StorageManager.getGlobalTargetProfit() : 70));
        const recSim = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: netCost, targetProfit: targetProfitForReport, commission: commRate, cargo: cargoFee });
        const recPrice = recSim.salePrice;

        // Realized Net Profit at Live Listing Price
        const commAmt = parseFloat((livePrice * (commRate / 100)).toFixed(2));
        const livePayout = parseFloat((livePrice - commAmt - cargoFee).toFixed(2));
        const liveNetProfit = parseFloat((livePayout - netCost).toFixed(2));

        const diffPrice = parseFloat((livePrice - recPrice).toFixed(2));
        const isAbove = diffPrice >= 0;

        if (isAbove) totalAboveCount++;
        else totalBelowCount++;

        items.push({
          sku: prod.sku,
          name: prod.name,
          category: prod.category || "Sabit Yağlar",
          volume: vk,
          netCost: netCost,
          recPrice: recPrice,
          livePrice: livePrice,
          liveNetProfit: liveNetProfit,
          diffPrice: diffPrice,
          isAbove: isAbove
        });
      }
    });
  });

  const sabitItems = items.filter(i => i.category === "Sabit Yağlar");
  const ucucuItems = items.filter(i => i.category === "Uçucu Yağlar");

  const themeBorder = isTrendyol ? "#ea580c" : "#7c3aed";
  const themeTitleColor = isTrendyol ? "#c2410c" : "#6d28d9";
  const themeMetaBg = isTrendyol ? "#fff7ed" : "#f5f3ff";
  const themeMetaBorder = isTrendyol ? "#ffedd5" : "#ddd6fe";
  const themeMetaText = isTrendyol ? "#9a3412" : "#5b21b6";

  let reportHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Cansızzade - Katman 3 ${isLayer3DipFiyatMode ? 'Dip Fiyat (0 ₺ Kâr)' : 'Önerilen Fiyat'} Karşılaştırma Raporu (${channelName})</title>
  <style>
    @page { size: A4 portrait; margin: 7mm 8mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 0; font-size: 8.5px; line-height: 1.25; }
    .page { page-break-after: always; min-height: 278mm; box-sizing: border-box; padding-bottom: 8mm; position: relative; }
    .page:last-child { page-break-after: avoid; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid ${themeBorder}; padding-bottom: 5px; margin-bottom: 6px; }
    .header-logo { height: 52px; width: auto; max-width: 140px; object-fit: contain; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.08)); }
    .header-info { text-align: right; }
    .header-info h1 { margin: 0; font-size: 12px; color: ${themeTitleColor}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.3px; }
    .header-info p { margin: 1px 0 0 0; font-size: 8px; color: #475569; font-weight: 600; }
    .meta-banner { background: ${themeMetaBg}; border: 1px solid ${themeMetaBorder}; border-radius: 5px; padding: 5px 8px; margin-bottom: 6px; display: flex; justify-content: space-between; font-size: 8px; font-weight: 600; color: ${themeMetaText}; }
    .legend-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 8px; margin-bottom: 6px; font-size: 7.5px; color: #475569; display: flex; justify-content: space-around; font-weight: 600; }
    .cat-title { background: ${themeTitleColor}; color: #ffffff; font-weight: 800; font-size: 9.5px; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 800; text-align: left; padding: 6px 5px; border-bottom: 2px solid ${themeBorder}; text-transform: uppercase; font-size: 7.5px; white-space: nowrap; }
    td { padding: 5.5px 5px; border-bottom: 1.5px solid #cbd5e1; color: #1e293b; vertical-align: middle; font-size: 8px; }
    td.nowrap { white-space: nowrap; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .text-purple { color: #6d28d9; }
    .text-emerald { color: #047857; }
    .text-rose { color: #be123c; }
    .text-blue { color: #1d4ed8; }
    .badge-above { background: #f8fafc; color: #047857; border: 1.5px solid #047857; font-weight: 900; padding: 2.5px 6px; border-radius: 4px; font-size: 7.5px; white-space: nowrap; display: inline-block; }
    .badge-below { background: #f8fafc; color: #be123c; border: 1.5px solid #be123c; font-weight: 900; padding: 2.5px 6px; border-radius: 4px; font-size: 7.5px; white-space: nowrap; display: inline-block; }
    .footer { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <!-- SAYFA 1: SABİT YAĞLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="Cansızzade Logo">
      <div class="header-info">
        <h1>KATMAN 3: CANLI MAĞAZA VE ${isLayer3DipFiyatMode ? 'DİP FİYAT (0 ₺ KÂR)' : 'ÖNERİLEN FİYAT'} ANALİZİ</h1>
        <p>CANSIZZADE BİTKİSEL YAĞLAR SAN. TİC. LTD. ŞTİ. | <strong>${channelName.toUpperCase()} KARŞILAŞTIRMA RAPORU</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>📅 <strong>Tarih:</strong> ${todayStr}</span>
      <span>📊 <strong>İncelenen Kanal:</strong> ${channelName} (%${commRate} Kom. + ${PriceCalculator.formatTL(cargoFee)} ₺ Kargo)</span>
      <span>▲ <strong>${isLayer3DipFiyatMode ? 'Dip Üstünde' : 'Önerilen Üstünde'}:</strong> ${totalAboveCount} Ambalaj</span>
      <span>▼ <strong>${isLayer3DipFiyatMode ? 'Dip Altında' : 'Önerilenden Düşük'}:</strong> ${totalBelowCount} Ambalaj</span>
    </div>

    <div class="legend-banner">
      <span><strong>1. Katman 2 Saf Maliyet:</strong> KDV Korumalı Dip Üretim Maliyeti</span>
      <span><strong>2. Katman 1 Fiyatı:</strong> ${isLayer3DipFiyatMode ? '0 ₺ Kâr (Başa Baş Dip Fiyatı)' : '+70 ₺ Hedef Kâr Eklenmiş Fiyat'}</span>
      <span><strong>3. Canlı Mağaza Fiyatı:</strong> ${channelName} Canlı İlan Fiyatınız</span>
      <span><strong>4. Net Kâr:</strong> Canlı Satış Hakedişinden Saf Maliyet Çıkarılmış Tutar</span>
    </div>

    <div class="cat-title">🌿 SABİT YAĞLAR — CANLI SATIŞ VE ${isLayer3DipFiyatMode ? 'DİP FİYAT (0 ₺ KÂR)' : 'ÖNERİLEN FİYAT'} KARŞILAŞTIRMA CETVELİ</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 6%;">SKU</th>
          <th style="width: 22%;">Ürün Adı</th>
          <th style="width: 7%;" class="text-center">Ambalaj</th>
          <th style="width: 10%;" class="text-right">Saf Maliyet</th>
          <th style="width: 11%;" class="text-right">${isLayer3DipFiyatMode ? '🏁 Dip Fiyat' : '🎯 Önerilen'}</th>
          <th style="width: 11%;" class="text-right">🛒 Canlı Mağaza</th>
          <th style="width: 11%;" class="text-right">💰 Net Kâr</th>
          <th style="width: 19%;" class="text-center">🏁 Karşılaştırma Durumu</th>
        </tr>
      </thead>
      <tbody>
        ${sabitItems.length > 0 ? sabitItems.map((item, idx) => `
          <tr>
            <td class="text-center font-bold nowrap">${idx + 1}</td>
            <td class="font-bold nowrap">${item.sku}</td>
            <td class="font-bold text-emerald">${item.name}</td>
            <td class="text-center font-bold text-blue nowrap">${item.volume}</td>
            <td class="text-right font-bold text-purple nowrap">${PriceCalculator.formatTL(item.netCost)} ₺</td>
            <td class="text-right font-extrabold text-purple nowrap">${PriceCalculator.formatTL(item.recPrice)} ₺</td>
            <td class="text-right font-black text-blue nowrap">${PriceCalculator.formatTL(item.livePrice)} ₺</td>
            <td class="text-right font-bold ${item.liveNetProfit >= 0 ? 'text-emerald' : 'text-rose'} nowrap">${item.liveNetProfit >= 0 ? '▲ ' : '▼ '}${PriceCalculator.formatTL(item.liveNetProfit)} ₺</td>
            <td class="text-center nowrap">
              ${item.isAbove
                ? `<span class="badge-above">▲ ÜSTÜNDE (+${PriceCalculator.formatTL(item.diffPrice)} ₺)</span>`
                : `<span class="badge-below">▼ DÜŞÜK (${PriceCalculator.formatTL(item.diffPrice)} ₺)</span>`}
            </td>
          </tr>
        `).join('') : `<tr><td colspan="9" class="text-center text-slate">Bu kategoride gösterilecek canlı ilan bulunamadı.</td></tr>`}
      </tbody>
    </table>

    <div class="footer">
      <span>Cansızzade Karşılaştırma & Fiyat Analiz Portalı v3.04</span>
      <span>Sayfa 1 / 2 (Sabit Yağlar - ${channelName} Fiyat Karşılaştırması)</span>
    </div>
  </div>

  <!-- SAYFA 2: UÇUCU YAĞLAR (EĞER VARSA) -->
  ${ucucuItems.length > 0 ? `
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="Cansızzade Logo">
      <div class="header-info">
        <h1>KATMAN 3: UÇUCU YAĞLAR CANLI VE ÖNERİLEN FİYAT ANALİZİ</h1>
        <p>CANSIZZADE BİTKİSEL YAĞLAR SAN. TİC. LTD. ŞTİ. | <strong>${channelName.toUpperCase()} UÇUCU YAĞ CETVELİ</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>📅 <strong>Tarih:</strong> ${todayStr}</span>
      <span>📊 <strong>İncelenen Kanal:</strong> ${channelName}</span>
      <span>🌸 <strong>Uçucu Yağ Sayısı:</strong> ${ucucuItems.length} Ambalaj</span>
    </div>

    <div class="cat-title">🌸 UÇUCU YAĞLAR — CANLI SATIŞ VE ÖNERİLEN FİYAT KARŞILAŞTIRMA CETVELİ</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 6%;">SKU</th>
          <th style="width: 22%;">Ürün Adı</th>
          <th style="width: 7%;" class="text-center">Ambalaj</th>
          <th style="width: 10%;" class="text-right">Saf Maliyet</th>
          <th style="width: 11%;" class="text-right">🎯 Önerilen</th>
          <th style="width: 11%;" class="text-right">🛒 Canlı Mağaza</th>
          <th style="width: 11%;" class="text-right">💰 Net Kâr</th>
          <th style="width: 19%;" class="text-center">🏁 Karşılaştırma Durumu</th>
        </tr>
      </thead>
      <tbody>
        ${ucucuItems.map((item, idx) => `
          <tr>
            <td class="text-center font-bold nowrap">${idx + 1}</td>
            <td class="font-bold nowrap">${item.sku}</td>
            <td class="font-bold text-emerald">${item.name}</td>
            <td class="text-center font-bold text-blue nowrap">${item.volume}</td>
            <td class="text-right font-bold text-purple nowrap">${PriceCalculator.formatTL(item.netCost)} ₺</td>
            <td class="text-right font-extrabold text-purple nowrap">${PriceCalculator.formatTL(item.recPrice)} ₺</td>
            <td class="text-right font-black text-blue nowrap">${PriceCalculator.formatTL(item.livePrice)} ₺</td>
            <td class="text-right font-bold ${item.liveNetProfit >= 0 ? 'text-emerald' : 'text-rose'} nowrap">${item.liveNetProfit >= 0 ? '▲ ' : '▼ '}${PriceCalculator.formatTL(item.liveNetProfit)} ₺</td>
            <td class="text-center nowrap">
              ${item.isAbove
                ? `<span class="badge-above">▲ ÜSTÜNDE (+${PriceCalculator.formatTL(item.diffPrice)} ₺)</span>`
                : `<span class="badge-below">▼ DÜŞÜK (${PriceCalculator.formatTL(item.diffPrice)} ₺)</span>`}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <span>Cansızzade Karşılaştırma & Fiyat Analiz Portalı v3.04</span>
      <span>Sayfa 2 / 2 (Uçucu Yağlar - ${channelName} Fiyat Karşılaştırması)</span>
    </div>
  </div>
  ` : ''}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  } else {
    alert("Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.");
  }
}

function openLayer3CalculationModal(productId, volKey) {
  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }
  let product = productsArr.find(p => p.id === productId);
  if (!product) return;

  const channel = currentLayer3Channel || "iyzico";
  const channelName = channel === "trendyol" ? "Trendyol" : "iyzico";
  const commRate = channel === "trendyol" ? 19 : 4;
  const cargoFee = channel === "trendyol" ? 110 : 82.50;

  const overheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
  const calc = getLayer2EffectiveCostForVolume(product, volKey, overheadRes.overheadPerKg);

  const livePriceInfo = getPlatformLivePrice(channel, product, volKey);
  const hasLivePrice = livePriceInfo.price !== null && livePriceInfo.price > 0;
  const livePrice = hasLivePrice ? livePriceInfo.price : null;
  const siteUrl = livePriceInfo.url || (channel === "trendyol" ? "https://www.trendyol.com/magaza/cansizzade-m-108253" : "https://www.cansizzadeyag.com/");

  const commAmt = hasLivePrice ? parseFloat((livePrice * (commRate / 100)).toFixed(2)) : 0;
  const payout = hasLivePrice ? parseFloat((livePrice - commAmt - cargoFee).toFixed(2)) : 0;
  const netProfit = hasLivePrice ? parseFloat((payout - calc.effectiveNetCost).toFixed(2)) : 0;

  const channelRec = channel === "trendyol" ? calc.trendyolRecommended : calc.iyzicoRecommended;
  const channelBreakEven = channel === "trendyol" ? calc.trendyolBreakEven : calc.iyzicoBreakEven;
  const recPrice = isLayer3DipFiyatMode ? channelBreakEven.salePrice : channelRec.salePrice;
  const breakEvenPrice = channelBreakEven.salePrice;
  const diffPrice = hasLivePrice ? livePrice - recPrice : 0;

  const isAbove = diffPrice >= 0;

  const titleEl = document.getElementById("l3-calc-modal-title");
  const subTitleEl = document.getElementById("l3-calc-modal-subtitle");
  const contentEl = document.getElementById("l3-calc-modal-content");

  if (titleEl) titleEl.innerText = `🧾 ${product.name} (${volKey}) - Fiyat & Kârlılık Dökümü`;
  if (subTitleEl) subTitleEl.innerText = `${channelName.toUpperCase()} Mağazası | SKU: ${product.sku} | Katman 1 Saf Maliyet, Platform Başa Baş Saf Maliyeti ve Canlı Kâr Kıyaslaması`;

  if (contentEl) {
    contentEl.innerHTML = `
      <!-- Ürün & Ambalaj Başlık Künyesi -->
      <div class="bg-[#0e172a] p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span class="font-bold text-white text-sm">🌿 ${product.name}</span>
          <span class="text-slate-400 font-mono text-[11px] ml-2">SKU: ${product.sku}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold text-xs tabular-nums">
            📌 İncelenen Ambalaj: ${volKey}
          </span>
          <span class="px-2.5 py-1 rounded-lg ${channel === 'trendyol' ? 'bg-orange-950/80 text-orange-300 border border-orange-800' : 'bg-sky-950/80 text-sky-300 border border-sky-800'} font-bold text-xs">
            ${channelName}
          </span>
        </div>
      </div>

      <!-- 📌 4 TEMEL FİYAT VE MALİYET KARŞILAŞTIRMASI KARTLARI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        <!-- 1. SİSTEMİMİZİN ÖNERDİĞİ SATIŞ FİYATI -->
        <div class="bg-[#0b1325] p-3 rounded-xl border border-amber-500/40 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-amber-400">1. Tavsiye Edilen Fiyat</div>
          <div class="text-[11px] font-black text-white">🎯 Katman 1 Önerilen</div>
          <div class="text-base font-black text-amber-400 tabular-nums">${PriceCalculator.formatTL(recPrice)} ₺</div>
          <p class="text-[10px] text-slate-400 leading-tight">+${calc.targetProfit} ₺ hedef kâr eklenmiş önerilen fiyat</p>
        </div>

        <!-- 2. PLATFORMA ÖZEL SAF MALİYET (0 ₺ KÂR BAŞA BAŞ) -->
        <div class="bg-[#0b1325] p-3 rounded-xl border border-rose-500/40 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-rose-400">2. Başa Baş Maliyet</div>
          <div class="text-[11px] font-black text-white">🏭 Platform Saf Maliyet</div>
          <div class="text-base font-black text-rose-400 tabular-nums">${PriceCalculator.formatTL(breakEvenPrice)} ₺</div>
          <p class="text-[10px] text-slate-400 leading-tight">${channelName} kesintileri dahil 0 ₺ kâr başa baş fiyat</p>
        </div>

        <!-- 3. İNTERNETTEKİ CANLI SATIŞ FİYATIMIZ -->
        <div class="bg-[#0b1325] p-3 rounded-xl border ${channel === 'trendyol' ? 'border-orange-500/40' : 'border-sky-500/40'} text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold ${channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'}">3. İnternet Satışımız</div>
          <div class="text-[11px] font-black text-white">🛒 ${channelName} Canlı</div>
          <div class="text-base font-black ${channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'} tabular-nums">${hasLivePrice ? PriceCalculator.formatTL(livePrice) + ' ₺' : '⚪ Canlı Yok'}</div>
          <p class="text-[10px] text-slate-400 leading-tight">Müşterinin internette ödediği anlık canlı fiyat</p>
        </div>

        <!-- 4. SAF MALİYETİMİZ -->
        <div class="bg-[#0b1325] p-3 rounded-xl border border-slate-700 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-slate-300">4. Net Saf Maliyet</div>
          <div class="text-[11px] font-black text-white">🏭 Fabrika Saf Maliyet</div>
          <div class="text-base font-black text-slate-200 tabular-nums">${PriceCalculator.formatTL(calc.effectiveNetCost)} ₺</div>
          <p class="text-[10px] text-slate-400 leading-tight">Tesis + İşçilik + Şişe + Yağ KDV korumalı net maliyeti</p>
        </div>

      </div>

      <!-- 💰 FİNAL: CANLI SATIŞTAN CEBE KALAN NET KÂR / ZARAR HESABI -->
      <div class="bg-[#0e172a] p-4 rounded-xl border ${netProfit >= 0 ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-rose-500/50 bg-rose-950/20'} space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-black text-xs text-white">📊 İNTERNET SATIŞINDAN CEBİNİZE KALAN NET KÂR HESABI:</span>
          <span class="text-xs font-black px-2.5 py-1 rounded ${livePrice < breakEvenPrice ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' : (isAbove ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-amber-950/80 text-amber-300 border border-amber-800')}">
            ${livePrice < breakEvenPrice ? '🔴 ZARARDA (Başa Baş Altında)' : (isAbove ? '🟢 Sistem Önerisi Üstünde' : '🟡 Kârlı (Hedef Kâr Altında)')}
          </span>
        </div>

        <div class="p-3 bg-[#0b1325] rounded-lg text-xs space-y-1.5 border border-slate-800 font-sans">
          <div class="flex justify-between items-center text-slate-300">
            <span>🛒 1. İnternet Canlı Satış Fiyatı (Müşterinin Ödediği):</span>
            <span class="font-bold text-white tabular-nums">${PriceCalculator.formatTL(livePrice)} ₺</span>
          </div>
          <div class="flex justify-between items-center text-rose-400">
            <span>📉 2. Pazaryeri Kesintisi (Komisyon %${commRate} + Kargo):</span>
            <span class="font-bold tabular-nums">-${PriceCalculator.formatTL(commAmt + cargoFee)} ₺</span>
          </div>
          <div class="flex justify-between items-center text-amber-400 font-extrabold border-t border-slate-800 pt-1">
            <span>➡ Banka Hesabınıza Yatan Net Hakediş:</span>
            <span class="tabular-nums">${PriceCalculator.formatTL(payout)} ₺</span>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span>🏭 3. Çıkarılan 0 ₺ Kâr Saf Fabrika Maliyetimiz (Katman 1):</span>
            <span class="font-bold text-slate-200 tabular-nums">-${PriceCalculator.formatTL(calc.effectiveNetCost)} ₺</span>
          </div>
          <div class="flex justify-between items-center text-slate-400 text-[11px]">
            <span>🏁 4. Platform Saf Maliyeti (0 ₺ Kâr Başa Baş):</span>
            <span class="font-semibold text-rose-300 tabular-nums">${PriceCalculator.formatTL(breakEvenPrice)} ₺</span>
          </div>
          <div class="flex justify-between items-center text-sm font-black pt-2.5 border-t border-slate-800">
            <span class="text-white">💰 NET KÂR / ZARAR SONUCUNUZ:</span>
            <span class="${netProfit >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'} text-base tabular-nums">
              ${netProfit >= 0 ? '▲ +' + PriceCalculator.formatTL(netProfit) + ' ₺ KÂR' : '▼ ' + PriceCalculator.formatTL(netProfit) + ' ₺ ZARAR'}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-800">
        <a href="${siteUrl}" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-[#0b1325] hover:bg-slate-800 text-amber-400 border border-slate-700 transition-all font-bold text-xs inline-flex items-center gap-1.5">
          <span>🔗 Canlı Mağaza Bağlantısını Aç</span>
        </a>
        <button onclick="closeLayer3CalcModal()" class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer">
          Kapat
        </button>
      </div>
    `;
  }

  const modal = document.getElementById("layer3-calc-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeLayer3CalcModal() {
  const modal = document.getElementById("layer3-calc-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// Manual or automatic sync function to push Chrome local storage into Supabase Cloud
async function syncChromeToSupabase() {
  if (typeof StorageManager === "undefined" || !StorageManager.seedSupabaseDatabase) {
    alert("⚠️ Depolama yöneticisi hazır değil.");
    return;
  }

  const products = StorageManager.getProducts();
  const res = await StorageManager.seedSupabaseDatabase(products);

  if (res && res.success) {
    alert(`☁️ Başarılı! Toplam ${res.count} adet ürün ve fiyat ayarı Chrome hafızasından Supabase Bulut Veritabanına aktarıldı ve yedeklendi.`);
  } else {
    alert(`⚠️ Supabase Bulut Aktarım Uyarısı: ${res?.error || 'Veritabanına ulaşılamadı'}`);
  }
}

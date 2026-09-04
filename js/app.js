// CanFiyat Portal Main Application Logic (v1.13) - Ultra Compact Dropdown & Fit-on-Screen Layout

let currentProducts = {};
let currentLayerMode = 1; // 1: Saf Maliyet Simülatörü, 2: Hızlı Sipariş / Teklif, 3: Satış Kataloğu & Kasa
let activeCategory = "all";
let searchQuery = "";
let selectedProductId = null;
let viewMode = "split"; // 'split' | 'rows'
let activeCockpitProductId = null;
let activeCockpitLayer3ProductId = null;
let activeSimTab = "system1"; // 'system1' | 'system2' | 'system3' | 'system4' | 'system5'
let activeVolume = "250ml"; // Active bottle size sub-tab in modal

function selectCockpitProduct(productId) {
  activeCockpitProductId = productId;
  const splitList = document.getElementById("layer2-split-list");
  if (splitList) {
    splitList.querySelectorAll("[data-product-id]").forEach(card => {
      if (card.getAttribute("data-product-id") === productId) {
        card.classList.add("product-card-active");
      } else {
        card.classList.remove("product-card-active");
      }
    });
  }
  const overhead = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overhead);
  let productsMap = (typeof currentProducts !== "undefined" && currentProducts && Object.keys(currentProducts).length > 0)
    ? currentProducts
    : StorageManager.getProducts();
  const layer2SimMap = StorageManager.getLayer2SimData();
  const masterProd = productsMap[productId] || {};
  const sim = layer2SimMap[productId] || {};
  const fullProd = { ...masterProd, ...sim };
  renderLayer2CockpitDesk(fullProd, overheadRes);
}

function selectCockpitLayer3Product(productId) {
  activeCockpitLayer3ProductId = productId;
  const splitList = document.getElementById("layer3-split-list");
  if (splitList) {
    splitList.querySelectorAll("[data-product-id]").forEach(card => {
      if (card.getAttribute("data-product-id") === productId) {
        card.classList.add("product-card-active");
      } else {
        card.classList.remove("product-card-active");
      }
    });
  }
  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }
  const prod = productsArr.find(p => p.id === productId);
  if (prod) {
    renderLayer3CockpitDesk(prod, overheadRes.overheadPerKg);
  }
}

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
}

function setViewMode(mode) {
  viewMode = mode;
  document.querySelectorAll(".view-mode-btn").forEach(btn => {
    btn.classList.remove("bg-white", "text-zinc-950", "shadow-sm", "bg-blue-600", "text-white");
    btn.classList.add("bg-transparent", "text-zinc-400", "hover:text-white");
  });
  
  const activeBtn = document.getElementById(`view-btn-${mode}`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-transparent", "text-zinc-400", "hover:text-white");
    activeBtn.classList.add("bg-white", "text-zinc-950", "shadow-sm");
  }

  if (currentLayerMode === 1) renderLayer2Cards();
  else if (currentLayerMode === 2) renderLayer3Cards();
  else if (currentLayerMode === 3) renderProductGrid();
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
    const matchesCat = (activeCategory === "all") || (p.category === activeCategory);
    const pName = (p.name || "").toLowerCase();
    const pSku = (p.sku || "").toLowerCase();
    const matchesSearch = !searchQuery || pName.includes(searchQuery) || pSku.includes(searchQuery);
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
                <span class="font-bold text-zinc-100 text-xs block mt-0.5 tabular-nums font-mono">${PriceCalculator.formatTL(product.costPerKg)}</span>
              </div>

              <div class="text-center border-r border-zinc-800/80 pr-1">
                <span class="text-[11px] font-medium text-zinc-400 block leading-tight">${mainVol} Maliyet</span>
                <span class="font-bold text-zinc-300 text-xs block mt-0.5 tabular-nums font-mono">${PriceCalculator.formatTL(unitCost)}</span>
              </div>

              <div class="text-center border-r border-zinc-800/80 pr-1">
                <span class="text-[11px] font-medium ${showRedLineFloor ? 'text-rose-400 font-bold' : 'text-zinc-400'} block leading-tight">
                  ${showRedLineFloor ? '🔴 Dip Satış' : 'Trendyol Etiket'}
                </span>
                <span class="font-bold ${showRedLineFloor ? 'text-rose-300' : 'text-zinc-100'} text-xs block mt-0.5 tabular-nums font-mono">
                  ${PriceCalculator.formatTL(showRedLineFloor ? breakEvenTy.breakEvenPrice : tyResult.listPrice)}
                </span>
              </div>

              <div class="text-center">
                <span class="text-[11px] font-medium text-zinc-400 block leading-tight">Hedef Kâr</span>
                <span class="font-bold text-emerald-400 text-xs block mt-0.5 tabular-nums font-mono">+${PriceCalculator.formatTL(volConfig?.targetProfit ?? 70)}</span>
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
  updateTopDipFiyatBtnState();
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
      banner.className = "glass-card rounded-2xl p-4 border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl transition-all";
    }
    if (badge) {
      badge.innerHTML = "🌐 iyzico Canlı Sitede";
      badge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50";
    }
    if (btnIyzico) btnIyzico.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer";
    if (btnTrendyol) btnTrendyol.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white cursor-pointer";
    if (btnPdf) {
      btnPdf.innerHTML = "📄 İYZİCO KARŞILAŞTIRMA PDF AL";
      btnPdf.className = "bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-500 text-white font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 text-xs border border-purple-400/40 cursor-pointer";
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

  const dipStatus = prodMerged.dipStatus || "none";
  const dipPercent = (prodMerged.dipPercent !== undefined && prodMerged.dipPercent !== null) ? prodMerged.dipPercent : 0;
  const yieldPct = (prodMerged.yieldPercent !== undefined && prodMerged.yieldPercent !== null) ? prodMerged.yieldPercent : 25;
  const seedCost = (prodMerged.seedCostPerKg !== undefined && prodMerged.seedCostPerKg !== null)
    ? prodMerged.seedCostPerKg
    : parseFloat(((prodMerged.costPerKg || 1212.00) * 0.25).toFixed(2));

  const herbCost = (prodMerged.herbCostPerKg !== undefined && prodMerged.herbCostPerKg !== null) ? prodMerged.herbCostPerKg : 0;
  const oliveOilCost = (prodMerged.oliveOilCostPerKg !== undefined && prodMerged.oliveOilCostPerKg !== null) ? prodMerged.oliveOilCostPerKg : 454.50;

  const coldPressRes = !isMaceration ? PriceCalculator.calculateColdPressCost({
    seedCostPerKg: seedCost,
    yieldPercent: yieldPct,
    wholesaleCostPerKg: prodMerged.wholesaleCostPerKg,
    supplyType: supplyType,
    dipStatus: dipStatus,
    dipPercent: dipPercent,
    fallbackCostPerKg: prodMerged.costPerKg || 1200
  }) : null;

  const macerationRes = isMaceration ? PriceCalculator.calculateMacerationCost({
    herbCostPerKg: herbCost,
    oliveOilCostPerKg: oliveOilCost,
    herbRatioKg: prodMerged.herbRatioKg || 0.2,
    herbKg: prodMerged.herbKg,
    oilKg: prodMerged.oilKg,
    supplyType: supplyType,
    wholesaleCostPerKg: prodMerged.wholesaleCostPerKg,
    fallbackCostPerKg: prodMerged.costPerKg || 600
  }) : null;

  const costPerKg = isMaceration ? macerationRes.netCostPerKg : coldPressRes.netCostPerKg;

  const ml = PriceCalculator.getVolumeMl(volKey);
  const volInKg = ml / 1000;
  const rawOilCost = parseFloat((costPerKg * volInKg).toFixed(2));

  const packCost = (typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[volKey] !== undefined)
    ? DEFAULT_PACKAGING_COSTS[volKey]
    : 14.50;

  const isWholesaleSupply = (supplyType === "wholesale");
  const linearOverhead = isWholesaleSupply ? 0 : parseFloat((dynamicOverheadPerKg * volInKg).toFixed(2));
  const laborAssemblyFee = PriceCalculator.getLaborAssemblyFee(volKey);

  const inputVatRate = (prodMerged.inputVatRate !== undefined && prodMerged.inputVatRate !== null)
    ? parseFloat(prodMerged.inputVatRate)
    : (parseFloat(prodMerged.kdv) || 1);
  const salesVatRate = parseFloat(prodMerged.kdv) || 1;

  const netCost = parseFloat((rawOilCost + packCost + linearOverhead + laborAssemblyFee).toFixed(2));

  const taxProtection = PriceCalculator.calculateTaxNeutralBreakEvenCost({
    netCost: netCost,
    inputVatRate: inputVatRate,
    salesVatRate: salesVatRate,
    rawOilCost: rawOilCost,
    packCost: packCost,
    linearOverhead: linearOverhead,
    laborAssemblyFee: laborAssemblyFee
  });

  const effectiveNetCost = taxProtection.taxNeutralBreakEvenCost;
  const targetProfit = (prodMerged.layer2Profit !== undefined && prodMerged.layer2Profit !== null) ? prodMerged.layer2Profit : 70;

  return {
    costPerKg,
    volInKg,
    rawOilCost,
    packCost,
    linearOverhead,
    laborAssemblyFee,
    netCost,
    effectiveNetCost,
    targetProfit,
    inputVatRate,
    salesVatRate
  };
}

function renderLayer3AllVolumesTableHtml(product, dynamicOverheadPerKg, availableVols, activeVolKey) {
  if (!availableVols || availableVols.length === 0) {
    return `
      <div class="p-4 rounded-xl bg-[#0b1120] border border-slate-800 text-center text-xs text-slate-400">
        Bu ürün için ${currentLayer3Channel === 'trendyol' ? 'Trendyol' : 'iyzico'} kanalında eşleşen canlı fiyat bulunamadı.
      </div>
    `;
  }

  const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
  let fallbackSiteUrl = "https://www.cansizzadeyag.com/";

  let rowsHtml = "";
  availableVols.forEach(vKey => {
    const vCalc = getLayer2EffectiveCostForVolume(product, vKey, dynamicOverheadPerKg);
    const vEffectiveNetCost = vCalc.effectiveNetCost;
    const vTargetProfit = isLayer3DipFiyatMode ? 0 : vCalc.targetProfit;
    const commRate = currentLayer3Channel === "trendyol" ? 19 : 4;
    const cargoFee = currentLayer3Channel === "trendyol" ? 110 : 82.50;

    const sys1 = PriceCalculator.calculateSystem1Channel({
      salesVatRate: parseFloat(product.kdv) || 20,
      wholesaleCost: vEffectiveNetCost,
      targetProfit: vTargetProfit,
      commission: commRate,
      cargo: cargoFee
    });
    const vRecommendedPrice = sys1.salePrice;

    let vLivePrice = null;
    let vRowUrl = fallbackSiteUrl;

    if (currentLayer3Channel === "trendyol") {
      const tyM = findTrendyolProduct(product.name, vKey);
      if (tyM && tyM.price > 0) {
        vLivePrice = tyM.price;
        if (tyM.url) vRowUrl = tyM.url;
      }
    } else {
      const vOverride = StorageManager.getSiteOverride(product.id, vKey);
      if (vOverride !== null && !isNaN(parseFloat(vOverride))) {
        vLivePrice = parseFloat(vOverride);
      } else if (siteData && siteData.samplePrices && typeof siteData.samplePrices[vKey] === "number" && siteData.samplePrices[vKey] > 0) {
        vLivePrice = siteData.samplePrices[vKey];
      }
      if (siteData && siteData.urls && siteData.urls[vKey]) {
        vRowUrl = siteData.urls[vKey];
      } else if (siteData && siteData.url) {
        vRowUrl = siteData.url;
      }
    }

    const vHasPrice = vLivePrice !== null && vLivePrice > 0;
    let vNetMarginHtml = `<span class="text-slate-500 font-bold text-xs">N/A</span>`;
    let vPriceDiffBadge = `<span class="text-[10px] bg-[#080d1a] text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono">⚪ Canlı Yok</span>`;

    if (vHasPrice) {
      const payout = vLivePrice * (1 - commRate / 100) - cargoFee;
      const vMargin = parseFloat((payout - vEffectiveNetCost).toFixed(2));

      if (vMargin >= 0) {
        vNetMarginHtml = `<span class="text-emerald-400 font-black font-mono text-xs">+${PriceCalculator.formatTL(vMargin)}</span>`;
      } else {
        vNetMarginHtml = `<span class="text-rose-400 font-black font-mono text-xs">${PriceCalculator.formatTL(vMargin)}</span>`;
      }

      const priceDiff = vLivePrice - vRecommendedPrice;
      if (priceDiff >= 0) {
        vPriceDiffBadge = `
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.5 rounded font-extrabold" title="Canlı fiyatınız Katman 1 Önerilen Fiyatının +${PriceCalculator.formatTL(priceDiff)} üzerinde">▲ +${PriceCalculator.formatTL(priceDiff)}</span>
            <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-[#080d1a] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net Kâr Hesap Dökümü Faturası">
              🧮 Döküm
            </button>
          </div>`;
      } else {
        vPriceDiffBadge = `
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] bg-rose-950/70 text-rose-300 border border-rose-800/80 px-1.5 py-0.5 rounded font-extrabold" title="Canlı fiyatınız Katman 1 Önerilen Fiyatının ${PriceCalculator.formatTL(priceDiff)} altında!">▼ ${PriceCalculator.formatTL(priceDiff)}</span>
            <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-[#080d1a] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net Kâr Hesap Dökümü Faturası">
              🧮 Döküm
            </button>
          </div>`;
      }
    }

    const isCurrentActive = vKey === activeVolKey;

    rowsHtml += `
      <tr class="hover:bg-slate-800/40 transition-colors ${isCurrentActive ? 'bg-amber-500/10 font-bold border-l-2 border-amber-400' : ''}">
        <td class="p-2.5 font-bold text-slate-200 border-b border-slate-800/60 flex items-center gap-1.5">
          <span>${vKey}</span>
          ${isCurrentActive ? '<span class="text-[9px] bg-amber-950 text-amber-300 px-1 rounded border border-amber-800">Aktif</span>' : ''}
        </td>
        <td class="p-2.5 border-b border-slate-800/60 font-mono font-bold text-amber-300 text-xs">
          🎯 ${PriceCalculator.formatTL(vRecommendedPrice)}
        </td>
        <td class="p-2.5 border-b border-slate-800/60 font-mono font-bold ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'} text-xs">
          <div class="flex items-center gap-1.5">
            <span>${vHasPrice ? PriceCalculator.formatTL(vLivePrice) : '⚪ Yok'}</span>
            ${vHasPrice ? `
              <a href="${vRowUrl}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-[#080d1a] text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/60 transition-all text-xs inline-flex items-center justify-center shadow-sm" title="${vKey} Canlı Mağaza Bağlantısı">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </a>
            ` : ''}
          </div>
        </td>
        <td class="p-2.5 text-slate-300 font-mono font-semibold border-b border-slate-800/60 text-xs">${PriceCalculator.formatTL(vEffectiveNetCost)}</td>
        <td class="p-2.5 border-b border-slate-800/60">${vNetMarginHtml}</td>
        <td class="p-2.5 border-b border-slate-800/60">${vPriceDiffBadge}</td>
      </tr>
    `;
  });

  return `
    <div class="rounded-xl border border-slate-700/80 bg-[#0b1120] overflow-hidden shadow-xl">
      <div class="px-3.5 py-2.5 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-200">📊 Tüm Ambalaj Boyutları Fiyat ve Kârlılık Matrisi</span>
          <span class="text-[10px] text-slate-400 font-mono">(${availableVols.length} Boyut)</span>
        </div>
        <span class="text-[10px] text-slate-400 font-medium">Kanal: <strong class="${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'}">${currentLayer3Channel === 'trendyol' ? 'Trendyol (%19 + 110₺)' : 'iyzico (%4 + 82,50₺)'}</strong></span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-[#0f172a]">
              <th class="p-2.5">Ambalaj</th>
              <th class="p-2.5 ${isLayer3DipFiyatMode ? 'text-rose-300' : 'text-amber-300'}">${isLayer3DipFiyatMode ? '🏁 Katman 1 Dip (0₺)' : '🎯 Katman 1 Önerilen'}</th>
              <th class="p-2.5 ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'}">🛒 Canlı Fiyat</th>
              <th class="p-2.5 text-slate-300">🏁 Saf Maliyet</th>
              <th class="p-2.5 text-emerald-400">💰 Net Kâr</th>
              <th class="p-2.5">📊 Durum / Döküm</th>
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

function renderLayer3CockpitDesk(product, dynamicOverheadPerKg) {
  const desk = document.getElementById("layer3-split-desk");
  if (!desk || !product) return;

  const allVols = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];
  const availableVols = allVols.filter(vk => {
    if (currentLayer3Channel === "trendyol") {
      const tyMatch = findTrendyolProduct(product.name, vk);
      return tyMatch && tyMatch.price > 0;
    } else {
      const ov = StorageManager.getSiteOverride(product.id, vk);
      if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) return true;
      const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
      if (siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0) return true;
      return false;
    }
  });

  const volsToUse = availableVols.length > 0 ? availableVols : allVols;

  let activeVolKey = cardActiveVolumes[product.id];
  if (!activeVolKey || !volsToUse.includes(activeVolKey)) {
    if (volsToUse.includes("1000ml")) {
      activeVolKey = "1000ml";
    } else {
      const priorityOrder = ["1000ml", "5000ml", "500ml", "250ml", "150ml", "100ml", "50ml", "30ml", "20ml", "10ml"];
      activeVolKey = priorityOrder.find(v => volsToUse.includes(v)) || volsToUse[0];
    }
    cardActiveVolumes[product.id] = activeVolKey;
  }

  const activeCalc = getLayer2EffectiveCostForVolume(product, activeVolKey, dynamicOverheadPerKg);
  const activeEffectiveNetCost = activeCalc.effectiveNetCost;
  const activeTargetProfit = isLayer3DipFiyatMode ? 0 : activeCalc.targetProfit;
  const commRate = currentLayer3Channel === "trendyol" ? 19 : 4;
  const cargoFee = currentLayer3Channel === "trendyol" ? 110 : 82.50;

  const sys1 = PriceCalculator.calculateSystem1Channel({
    salesVatRate: parseFloat(product.kdv) || 20,
    wholesaleCost: activeEffectiveNetCost,
    targetProfit: activeTargetProfit,
    commission: commRate,
    cargo: cargoFee
  });
  const systemRecommendedPrice = sys1.salePrice;

  let activeLivePrice = null;
  let siteUrl = "https://www.cansizzadeyag.com/";

  if (currentLayer3Channel === "trendyol") {
    const tyMatch = findTrendyolProduct(product.name, activeVolKey);
    if (tyMatch && tyMatch.price > 0) {
      activeLivePrice = tyMatch.price;
      if (tyMatch.url) siteUrl = tyMatch.url;
    }
  } else {
    const overridePrice = StorageManager.getSiteOverride(product.id, activeVolKey);
    const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
    if (overridePrice !== null && !isNaN(parseFloat(overridePrice))) {
      activeLivePrice = parseFloat(overridePrice);
    } else if (siteData && siteData.samplePrices && typeof siteData.samplePrices[activeVolKey] === "number" && siteData.samplePrices[activeVolKey] > 0) {
      activeLivePrice = siteData.samplePrices[activeVolKey];
    }
    if (siteData && siteData.urls && siteData.urls[activeVolKey]) {
      siteUrl = siteData.urls[activeVolKey];
    } else if (siteData && siteData.url) {
      siteUrl = siteData.url;
    }
  }

  const hasVolPrice = activeLivePrice !== null && activeLivePrice > 0;
  let netProfitMargin = 0;
  let payout = 0;
  let commAmt = 0;
  if (hasVolPrice) {
    commAmt = parseFloat((activeLivePrice * (commRate / 100)).toFixed(2));
    payout = parseFloat((activeLivePrice - commAmt - cargoFee).toFixed(2));
    netProfitMargin = parseFloat((payout - activeEffectiveNetCost).toFixed(2));
  }

  const isUcucu = product.category === "Uçucu Yağlar";
  const catBadge = isUcucu
    ? "bg-purple-950/50 text-purple-300 border-purple-800/60"
    : "bg-emerald-950/50 text-emerald-300 border-emerald-800/60";

  desk.innerHTML = `
    <div class="glass-card rounded-2xl p-4 md:p-5 border border-slate-700/80 bg-[#0f172a] shadow-2xl space-y-4">
      
      <!-- Ürün Başlık ve Kanal Künyesi -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs font-black text-slate-300 bg-[#080d1a] px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
            ${product.sku}
          </span>
          <div>
            <h2 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
              ${product.name}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${catBadge}">
                ${product.category}
              </span>
              <span class="text-[11px] text-slate-400">KDV: <strong class="text-slate-200">%${product.kdv || 20}</strong></span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <span class="px-3 py-1.5 rounded-xl text-xs font-bold border ${currentLayer3Channel === 'trendyol' ? 'bg-orange-950/70 text-orange-300 border-orange-800' : 'bg-sky-950/70 text-sky-300 border-sky-800'}">
            ${currentLayer3Channel === 'trendyol' ? '🧡 Trendyol Kanalı' : '🌐 iyzico Web Kanalı'}
          </span>
          <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-[#080d1a] hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm" title="Canlı Mağaza Sayfasını Aç">
            <span>Mağaza 🔗</span>
          </a>
        </div>
      </div>

      <!-- Ambalaj Seçim Butonları (Pills) -->
      <div class="flex items-center gap-1.5 flex-wrap bg-[#080d1a] p-2 rounded-xl border border-slate-800">
        <span class="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Hacim Boyutu:</span>
        ${volsToUse.map(vk => {
          const isAct = vk === activeVolKey;
          return `
            <button onclick="updateCardVolume('${product.id}', '${vk}')" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${isAct ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600'}">
              ${vk}
            </button>
          `;
        }).join("")}
      </div>

      <!-- 4 Temel Metrik Spotlight Kartları -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="bg-[#0b1120] p-3 rounded-xl border border-amber-500/40 text-center">
          <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🎯 Önerilen Fiyat</span>
          <span class="text-sm sm:text-base font-black text-amber-300 font-mono block mt-0.5">${PriceCalculator.formatTL(systemRecommendedPrice)}</span>
          <span class="text-[9.5px] text-slate-400 block mt-0.5">${activeVolKey} Hedef Fiyat</span>
        </div>

        <div class="bg-[#0b1120] p-3 rounded-xl border ${currentLayer3Channel === 'trendyol' ? 'border-orange-500/40' : 'border-sky-500/40'} text-center">
          <span class="text-[10px] font-bold ${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'} uppercase tracking-wider block">🛒 Canlı Satış</span>
          <span class="text-sm sm:text-base font-black ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'} font-mono block mt-0.5">${hasVolPrice ? PriceCalculator.formatTL(activeLivePrice) : '⚪ Yok'}</span>
          <span class="text-[9.5px] text-slate-400 block mt-0.5">${currentLayer3Channel === 'trendyol' ? 'Trendyol' : 'Web Sitemiz'}</span>
        </div>

        <div class="bg-[#0b1120] p-3 rounded-xl border border-slate-700/80 text-center">
          <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">🏁 Saf Net Maliyet</span>
          <span class="text-sm sm:text-base font-black text-slate-100 font-mono block mt-0.5">${PriceCalculator.formatTL(activeEffectiveNetCost)}</span>
          <span class="text-[9.5px] text-slate-400 block mt-0.5">0 ₺ Kârsız Dip</span>
        </div>

        <div class="bg-[#0b1120] p-3 rounded-xl border ${hasVolPrice ? (netProfitMargin >= 0 ? 'border-emerald-500/40' : 'border-rose-500/40') : 'border-slate-800'} text-center">
          <span class="text-[10px] font-bold ${hasVolPrice ? (netProfitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'} uppercase tracking-wider block">💰 Cebe Kalan Kâr</span>
          <span class="text-sm sm:text-base font-black ${hasVolPrice ? (netProfitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'} font-mono block mt-0.5">
            ${hasVolPrice ? (netProfitMargin >= 0 ? '+' + PriceCalculator.formatTL(netProfitMargin) : PriceCalculator.formatTL(netProfitMargin)) : 'N/A'}
          </span>
          <span class="text-[9.5px] text-slate-400 block mt-0.5">${hasVolPrice ? (netProfitMargin >= 0 ? 'Net Kâr' : 'Zarar!') : 'Canlı Fiyat Yok'}</span>
        </div>
      </div>

      <!-- Canlı Satış Akışı Hakediş Döküm Çubuğu (Varsa) -->
      ${hasVolPrice ? `
        <div class="p-3 bg-[#080d1a] rounded-xl border border-slate-800 text-xs space-y-2">
          <div class="flex items-center justify-between text-slate-300 text-[11px] pb-1 border-b border-slate-800">
            <span class="font-bold text-slate-200">💳 Canlı Satış Kesinti ve Hakediş Şeması (${activeVolKey}):</span>
            <button onclick="openLayer3CalculationModal('${product.id}', '${activeVolKey}')" class="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer">
              Tam Fatura Dökümünü Aç 🧮
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div><span class="text-slate-400">Canlı Satış:</span> <strong class="text-white font-mono">${PriceCalculator.formatTL(activeLivePrice)}</strong></div>
            <div><span class="text-slate-400">Komisyon (%${commRate}):</span> <strong class="text-rose-400 font-mono">-${PriceCalculator.formatTL(commAmt)}</strong></div>
            <div><span class="text-slate-400">Kargo:</span> <strong class="text-rose-400 font-mono">-${PriceCalculator.formatTL(cargoFee)}</strong></div>
            <div><span class="text-slate-400">Banka Hakediş:</span> <strong class="text-emerald-300 font-mono">${PriceCalculator.formatTL(payout)}</strong></div>
          </div>
        </div>
      ` : ''}

      <!-- Tüm Ambalajlar Karşılaştırma Matrisi Tablosu -->
      ${renderLayer3AllVolumesTableHtml(product, dynamicOverheadPerKg, volsToUse, activeVolKey)}

    </div>
  `;
}

function renderLayer3Cards() {
  const container = document.getElementById("layer3-product-grid");
  const splitContainer = document.getElementById("layer3-split-container");
  const splitList = document.getElementById("layer3-split-list");
  const splitDesk = document.getElementById("layer3-split-desk");
  const listCountEl = document.getElementById("layer3-list-count");

  if (!container) return;

  const activeView = (typeof viewMode !== "undefined" && viewMode) ? viewMode : "split";

  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  const dynamicOverheadPerKg = overheadRes.overheadPerKg;

  let totalScrapedMatchCount = 0;

  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }

  // Calculate dynamic channel product counts
  let tyMatchCount = 0;
  let iyzicoMatchCount = 0;

  productsArr.forEach(prod => {
    if (!prod || !prod.name) return;
    const hasTy = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"].some(vk => {
      const m = findTrendyolProduct(prod.name, vk);
      return m && m.price > 0;
    });
    if (hasTy) tyMatchCount++;

    const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[prod.id] : null;
    const hasIyzico = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"].some(vk => {
      const ov = StorageManager.getSiteOverride(prod.id, vk);
      if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) return true;
      if (siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0) return true;
      return false;
    });
    if (hasIyzico) iyzicoMatchCount++;
  });

  const btnIyzico = document.getElementById("btn-l3-channel-iyzico");
  if (btnIyzico) btnIyzico.innerHTML = `🌐 iyzico (${iyzicoMatchCount} Ürün)`;

  const btnTrendyol = document.getElementById("btn-l3-channel-trendyol");
  if (btnTrendyol) btnTrendyol.innerHTML = `🧡 Trendyol (${tyMatchCount} Ürün)`;

  // Filter display products
  let displayList = [];
  productsArr.forEach(prod => {
    if (!prod || !prod.name) return;
    if (activeCategory !== "all" && prod.category !== activeCategory) return;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(prod.name || "").toLowerCase().includes(q) && !(prod.sku || "").toLowerCase().includes(q)) return;
    }

    if (currentLayer3Channel === "trendyol") {
      const hasAnyTyMatch = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"].some(vk => {
        const m = findTrendyolProduct(prod.name, vk);
        return m && m.price > 0;
      });
      if (hasAnyTyMatch) displayList.push(prod);
    } else {
      const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[prod.id] : null;
      const hasAnyVolPrice = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"].some(vk => {
        const ov = StorageManager.getSiteOverride(prod.id, vk);
        if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) return true;
        if (siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0) return true;
        return false;
      });
      if (hasAnyVolPrice) displayList.push(prod);
    }
  });

  const sortedDisplayList = sortProductsByCategoryAndName(displayList);
  if (listCountEl) listCountEl.innerText = `${sortedDisplayList.length} Ürün`;

  if (sortedDisplayList.length === 0) {
    const emptyHtml = `<div class="col-span-full py-12 text-center text-slate-400 font-medium bg-[#0f172a] rounded-2xl border border-slate-800">Seçilen kanalda veya kriterlere uygun canlı ürün bulunamadı.</div>`;
    if (container) container.innerHTML = emptyHtml;
    if (splitList) splitList.innerHTML = emptyHtml;
    if (splitDesk) splitDesk.innerHTML = emptyHtml;
    return;
  }

  // --- SPLIT VIEW MODE ---
  if (activeView === "split" && splitContainer && splitList && splitDesk) {
    splitContainer.classList.remove("hidden");
    container.classList.add("hidden");

    if (!activeCockpitLayer3ProductId || !sortedDisplayList.some(p => p.id === activeCockpitLayer3ProductId)) {
      activeCockpitLayer3ProductId = sortedDisplayList[0].id;
    }

    const prevScroll = splitList.scrollTop;
    splitList.innerHTML = sortedDisplayList.map(product => {
      const isSelected = product.id === activeCockpitLayer3ProductId;
      const allVols = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];
      const availableVols = allVols.filter(vk => {
        if (currentLayer3Channel === "trendyol") {
          const tyMatch = findTrendyolProduct(product.name, vk);
          return tyMatch && tyMatch.price > 0;
        } else {
          const ov = StorageManager.getSiteOverride(product.id, vk);
          if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) return true;
          const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
          return siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0;
        }
      });

      let defVol = "1000ml";
      if (availableVols.length > 0) {
        if (!availableVols.includes("1000ml")) {
          const priorityOrder = ["1000ml", "5000ml", "500ml", "250ml", "150ml", "100ml", "50ml", "30ml", "20ml", "10ml"];
          defVol = priorityOrder.find(v => availableVols.includes(v)) || availableVols[0];
        }
      }

      let activeVolKey = cardActiveVolumes[product.id] || defVol;
      if (!availableVols.includes(activeVolKey) && availableVols.length > 0) activeVolKey = defVol;

      const activeCalc = getLayer2EffectiveCostForVolume(product, activeVolKey, dynamicOverheadPerKg);
      const activeEffectiveNetCost = activeCalc.effectiveNetCost;
      const activeTargetProfit = isLayer3DipFiyatMode ? 0 : activeCalc.targetProfit;
      const commRate = currentLayer3Channel === "trendyol" ? 19 : 4;
      const cargoFee = currentLayer3Channel === "trendyol" ? 110 : 82.50;

      const sys1 = PriceCalculator.calculateSystem1Channel({
        salesVatRate: parseFloat(product.kdv) || 20,
        wholesaleCost: activeEffectiveNetCost,
        targetProfit: activeTargetProfit,
        commission: commRate,
        cargo: cargoFee
      });
      const recPrice = sys1.salePrice;

      let livePrice = null;
      if (currentLayer3Channel === "trendyol") {
        const tyM = findTrendyolProduct(product.name, activeVolKey);
        if (tyM && tyM.price > 0) livePrice = tyM.price;
      } else {
        const ov = StorageManager.getSiteOverride(product.id, activeVolKey);
        if (ov !== null && !isNaN(parseFloat(ov))) livePrice = parseFloat(ov);
        else {
          const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
          if (siteData?.samplePrices?.[activeVolKey]) livePrice = siteData.samplePrices[activeVolKey];
        }
      }

      let netMarginBadge = '<span class="text-slate-500 font-mono text-[10px]">⚪ Yok</span>';
      if (livePrice !== null && livePrice > 0) {
        totalScrapedMatchCount++;
        const payout = livePrice * (1 - commRate / 100) - cargoFee;
        const netMargin = parseFloat((payout - activeEffectiveNetCost).toFixed(2));
        if (netMargin >= 0) {
          netMarginBadge = `<span class="text-emerald-400 font-black font-mono text-[10.5px]">+${PriceCalculator.formatTL(netMargin)}</span>`;
        } else {
          netMarginBadge = `<span class="text-rose-400 font-black font-mono text-[10.5px]">${PriceCalculator.formatTL(netMargin)}</span>`;
        }
      }

      const bClass = product.category === "Uçucu Yağlar"
        ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
        : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50";

      return `
        <div onclick="selectCockpitLayer3Product('${product.id}')" data-product-id="${product.id}" class="glass-card p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'product-card-active' : 'border-slate-800/80 hover:border-slate-700 bg-[#0f172a]/70 hover:bg-[#131d33]'}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 truncate">
              <span class="font-mono text-[10px] font-bold text-slate-300 bg-[#080d1a] px-2 py-0.5 rounded border border-slate-800 shrink-0">${product.sku}</span>
              <span class="text-xs font-bold text-white truncate" title="${product.name}">${product.name}</span>
            </div>
            <span class="text-[9.5px] px-1.5 py-0.5 rounded border ${bClass} shrink-0">${product.category === 'Uçucu Yağlar' ? 'Uçucu' : 'Sabit'}</span>
          </div>
          <div class="flex items-center justify-between text-xs mt-2 pt-1.5 border-t border-slate-800/60">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[10.5px] font-mono">${activeVolKey}</span>
              <span class="text-amber-400 font-bold font-mono text-xs">🎯 ${PriceCalculator.formatTL(recPrice)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'} font-bold font-mono text-xs">${livePrice ? PriceCalculator.formatTL(livePrice) : '⚪ Yok'}</span>
              ${netMarginBadge}
            </div>
          </div>
        </div>
      `;
    }).join("");
    splitList.scrollTop = prevScroll;

    const activeProd = sortedDisplayList.find(p => p.id === activeCockpitLayer3ProductId) || sortedDisplayList[0];
    renderLayer3CockpitDesk(activeProd, dynamicOverheadPerKg);

    const scrapedBadge = document.getElementById("l3-stat-total-scraped");
    if (scrapedBadge) scrapedBadge.innerText = `${totalScrapedMatchCount} Ürün Bulundu`;
    return;
  }

  // --- ROWS MODE (CLASSIC ACCORDION LIST FALLBACK) ---
  if (splitContainer) splitContainer.classList.add("hidden");
  container.classList.remove("hidden");
  container.innerHTML = "";

  sortedDisplayList.forEach(product => {
    const allVols = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"];
    const availableVols = allVols.filter(vk => {
      if (currentLayer3Channel === "trendyol") {
        const tyMatch = findTrendyolProduct(product.name, vk);
        return tyMatch && tyMatch.price > 0;
      } else {
        const ov = StorageManager.getSiteOverride(product.id, vk);
        if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) return true;
        const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
        return siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0;
      }
    });

    let defaultVolKey = "1000ml";
    if (availableVols.length > 0) {
      if (!availableVols.includes("1000ml")) {
        const priorityOrder = ["1000ml", "5000ml", "500ml", "250ml", "150ml", "100ml", "50ml", "30ml", "20ml", "10ml"];
        defaultVolKey = priorityOrder.find(v => availableVols.includes(v)) || availableVols[0];
      }
    }

    let activeVolKey = cardActiveVolumes[product.id] || defaultVolKey;
    if (!availableVols.includes(activeVolKey) && availableVols.length > 0) activeVolKey = defaultVolKey;

    const activeCalc = getLayer2EffectiveCostForVolume(product, activeVolKey, dynamicOverheadPerKg);
    const activeEffectiveNetCost = activeCalc.effectiveNetCost;
    const activeTargetProfit = isLayer3DipFiyatMode ? 0 : activeCalc.targetProfit;
    const commRate = currentLayer3Channel === "trendyol" ? 19 : 4;
    const cargoFee = currentLayer3Channel === "trendyol" ? 110 : 82.50;

    const sys1 = PriceCalculator.calculateSystem1Channel({
      salesVatRate: parseFloat(product.kdv) || 20,
      wholesaleCost: activeEffectiveNetCost,
      targetProfit: activeTargetProfit,
      commission: commRate,
      cargo: cargoFee
    });
    const systemRecommendedPrice = sys1.salePrice;

    let activeLivePrice = null;
    let siteUrl = "https://www.cansizzadeyag.com/";

    if (currentLayer3Channel === "trendyol") {
      const tyMatch = findTrendyolProduct(product.name, activeVolKey);
      if (tyMatch && tyMatch.price > 0) {
        activeLivePrice = tyMatch.price;
        if (tyMatch.url) siteUrl = tyMatch.url;
      }
    } else {
      const overridePrice = StorageManager.getSiteOverride(product.id, activeVolKey);
      const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
      if (overridePrice !== null && !isNaN(parseFloat(overridePrice))) {
        activeLivePrice = parseFloat(overridePrice);
      } else if (siteData && siteData.samplePrices && typeof siteData.samplePrices[activeVolKey] === "number" && siteData.samplePrices[activeVolKey] > 0) {
        activeLivePrice = siteData.samplePrices[activeVolKey];
      }
      if (siteData && siteData.urls && siteData.urls[activeVolKey]) {
        siteUrl = siteData.urls[activeVolKey];
      } else if (siteData && siteData.url) {
        siteUrl = siteData.url;
      }
    }

    const hasVolPrice = activeLivePrice !== null && activeLivePrice > 0;
    if (hasVolPrice) totalScrapedMatchCount++;

    let netProfitMarginHtml = `<span class="font-bold text-slate-500 text-xs">N/A</span>`;
    if (hasVolPrice) {
      const payout = activeLivePrice * (1 - commRate / 100) - cargoFee;
      const netProfitMargin = parseFloat((payout - activeEffectiveNetCost).toFixed(2));
      if (netProfitMargin >= 0) {
        netProfitMarginHtml = `<span class="font-bold text-emerald-400 font-mono text-xs">+${PriceCalculator.formatTL(netProfitMargin)}</span>`;
      } else {
        netProfitMarginHtml = `<span class="font-bold text-rose-400 font-mono text-xs">${PriceCalculator.formatTL(netProfitMargin)}</span>`;
      }
    }

    const isUcucu = product.category === "Uçucu Yağlar";
    const catBadge = isUcucu 
      ? "bg-purple-950/40 text-purple-300 border-purple-800/50" 
      : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50";

    const isExpanded = expandedCards[product.id] || false;

    const cardHtml = `
      <div class="glass-card rounded-xl p-3.5 border border-slate-800/80 hover:border-slate-700 bg-[#0f172a] transition-all shadow-sm hover:shadow-md flex flex-col gap-3">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <!-- Ürün Başlığı & Ambalaj -->
          <div class="flex items-center gap-3 min-w-[240px]">
            <span class="font-mono text-xs font-bold text-slate-300 bg-[#080d1a] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 shadow-sm">
              ${product.sku}
            </span>
            <div class="truncate">
              <h3 class="text-sm font-bold text-white truncate" title="${product.name}">
                ${product.name}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catBadge}">
                  ${product.category}
                </span>
                <span class="text-[11px] font-medium text-slate-400">
                  📌 Ambalaj: <strong class="text-slate-200">${activeVolKey}</strong>
                </span>
              </div>
            </div>
          </div>

          <!-- 4 Metrik Ön İzleme -->
          <div class="grid grid-cols-4 gap-2 items-center bg-[#080d1a] px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold ${isLayer3DipFiyatMode ? 'text-rose-400' : 'text-amber-400'} block">${isLayer3DipFiyatMode ? '🏁 Dip (0₺)' : '🎯 Önerilen'}</span>
              <span class="font-bold ${isLayer3DipFiyatMode ? 'text-rose-400' : 'text-amber-300'} text-xs block mt-0.5 font-mono">${PriceCalculator.formatTL(systemRecommendedPrice)}</span>
            </div>

            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold ${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'} block">${currentLayer3Channel === 'trendyol' ? 'Trendyol' : 'iyzico'} Canlı</span>
              <span class="font-bold text-xs ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'} block mt-0.5 font-mono">${hasVolPrice ? PriceCalculator.formatTL(activeLivePrice) : '⚪ Yok'}</span>
            </div>

            <div class="text-center border-r border-slate-800 pr-1">
              <span class="text-[10px] font-bold text-slate-400 block">Saf Maliyet</span>
              <span class="font-bold text-slate-200 text-xs block mt-0.5 font-mono">${PriceCalculator.formatTL(activeEffectiveNetCost)}</span>
            </div>

            <div class="text-center">
              <span class="text-[10px] font-bold text-slate-400 block">Net Kâr</span>
              <span class="text-xs font-bold block mt-0.5 font-mono">${netProfitMarginHtml}</span>
            </div>
          </div>

          <!-- Aksiyon Butonları -->
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="toggleCardAccordion('${product.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${isExpanded ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0b1120] text-slate-200 hover:text-white border border-slate-700/80 hover:bg-slate-800'}">
              <span>📊 Tüm Boyutlar ${isExpanded ? '▲' : '▼'}</span>
            </button>

            <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-[#0b1120] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-slate-800 transition-all text-xs flex items-center justify-center shadow-sm" title="Mağaza Bağlantısı 🔗">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
            </a>
          </div>

        </div>

        <!-- Açılır Tablo -->
        ${isExpanded ? renderLayer3AllVolumesTableHtml(product, dynamicOverheadPerKg, availableVols, activeVolKey) : ''}
      </div>
    `;

    container.insertAdjacentHTML("beforeend", cardHtml);
  });

  const scrapedBadge = document.getElementById("l3-stat-total-scraped");
  if (scrapedBadge) {
    scrapedBadge.innerText = `${totalScrapedMatchCount} Ürün Bulundu`;
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
    if (btnTiers) btnTiers.className = "flex-1 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md";
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
    if (btnAll) btnAll.className = "px-2 py-1 bg-purple-600 text-white rounded font-bold shadow-sm";
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
    if (btnDrums) btnDrums.className = "px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5";
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
  return ALL_VOLUMES.map(v => `
    <option value="${v.key}" ${vol === v.key ? "selected" : ""}>${v.label} (${v.price})</option>
  `).join("");
}

function computeLayer2ProductMetrics(product, overheadRes) {
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

  const targetProfitInput = (product.layer2Profit !== undefined && product.layer2Profit !== null) ? parseFloat(product.layer2Profit) : 70;
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
  const wholesalePack = (layer2GroupMode === "wholesale_drums")
    ? PriceCalculator.calculateWholesalePackagingBreakdown(kg)
    : null;

  const packCost = (layer2GroupMode === "wholesale_drums")
    ? wholesalePack.totalPackCost
    : ((typeof DEFAULT_PACKAGING_COSTS !== "undefined" && DEFAULT_PACKAGING_COSTS[vol]) ? DEFAULT_PACKAGING_COSTS[vol] : 14.50);

  const wholesaleMarginMode = product.wholesaleMarginMode || 'percent';
  const wholesaleMarginValue = (product.wholesaleMarginValue !== undefined && product.wholesaleMarginValue !== null)
    ? parseFloat(product.wholesaleMarginValue)
    : (wholesaleMarginMode === 'percent' ? 20 : 200);

  const isWholesaleSupply = (supplyType === "wholesale");
  const energyOverheadToUse = isWholesaleSupply ? 0 : overheadRes.energyOverheadPerKg;
  const laborOverheadToUse = overheadRes.laborOverheadPerKg;

  const overheadData = PriceCalculator.getOverheadForVolume(vol, energyOverheadToUse, laborOverheadToUse);
  const linearOverhead = overheadData.linearVolumeOverhead;
  const laborAssemblyFee = overheadData.laborAssemblyFee;
  const totalOverhead = overheadData.totalOverhead;

  const inputVatRate = (product.inputVatRate !== undefined && product.inputVatRate !== null)
    ? parseFloat(product.inputVatRate)
    : (parseFloat(product.kdv) || 1);
  const salesVatRate = parseFloat(product.kdv) || 1;

  const netCost = parseFloat((rawOilCost + packCost + totalOverhead).toFixed(2));

  const taxProtection = PriceCalculator.calculateTaxNeutralBreakEvenCost({
    netCost: netCost,
    inputVatRate: inputVatRate,
    salesVatRate: salesVatRate,
    rawOilCost: rawOilCost,
    packCost: packCost,
    linearOverhead: linearOverhead,
    laborAssemblyFee: laborAssemblyFee
  });

  const effectiveNetCost = taxProtection.taxNeutralBreakEvenCost;
  const unitNetCost = effectiveNetCost / (kg > 0 ? kg : 1);
  const tierInfo = PriceCalculator.getWholesaleDiscountForKg(kg, StorageManager.getWholesaleTiers());
  const discountPct = tierInfo.discount || 0;

  let marginAmountPerKg = 0;
  if (layer2GroupMode === 'wholesale_drums') {
    if (wholesaleMarginMode === 'amount') {
      marginAmountPerKg = wholesaleMarginValue;
    } else {
      marginAmountPerKg = unitNetCost * (wholesaleMarginValue / 100);
    }
  }

  const baseSellingUnitCost = unitNetCost + marginAmountPerKg;
  const discountedUnitCost = baseSellingUnitCost * (1 - (discountPct / 100));
  const finalWholesale1KgQuotePrice = parseFloat(discountedUnitCost.toFixed(2));
  const totalOrderPrice = parseFloat((finalWholesale1KgQuotePrice * kg).toFixed(2));
  const profitPerKg = parseFloat((finalWholesale1KgQuotePrice - unitNetCost).toFixed(2));
  const totalProfitOrLoss = parseFloat((profitPerKg * kg).toFixed(2));
  const isProfit = profitPerKg >= 0;

  const b2bTier1Price = parseFloat((baseSellingUnitCost * 0.95).toFixed(2));
  const b2bTier2Price = parseFloat((baseSellingUnitCost * 0.90).toFixed(2));
  const b2bTier3Price = parseFloat((baseSellingUnitCost * 0.85).toFixed(2));
  const b2bTier4Price = parseFloat((baseSellingUnitCost * 0.80).toFixed(2));

  const tySim = PriceCalculator.calculateSystem1Channel({ salesVatRate: salesVatRate, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 19, discount: 0, cargo: 110 });
  const hbSim = PriceCalculator.calculateSystem1Channel({ salesVatRate: salesVatRate, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 17, discount: 0, cargo: 110 });
  const iySim = PriceCalculator.calculateSystem1Channel({ salesVatRate: salesVatRate, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 4, discount: 0, cargo: 82.50 });
  const storePrice = effectiveNetCost + targetProfitInput;

  return {
    kg, vol, targetProfitInput, isMaceration, isEssentialOil, supplyType,
    dipStatus, dipPercent, yieldPct, seedCost, herbCost, oliveOilCost,
    kdvRate, initialCost, initialSeedCost, initialYield, initialHerbCost, initialOliveOilCost,
    currentWholesale, currentSeed, isSeedModified, isYieldModified, isDipModified,
    isWholesaleModified, isHerbCostModified, isOliveOilModified, isAnyModified,
    coldPressRes, macerationRes, costPerKg, rawOilCost, wholesalePack, packCost,
    wholesaleMarginMode, wholesaleMarginValue, energyOverheadToUse, laborOverheadToUse,
    overheadData, linearOverhead, laborAssemblyFee, totalOverhead,
    inputVatRate, salesVatRate, netCost, taxProtection, effectiveNetCost, unitNetCost,
    tierInfo, discountPct, baseSellingUnitCost, finalWholesale1KgQuotePrice, totalOrderPrice,
    profitPerKg, totalProfitOrLoss, isProfit,
    b2bTier1Price, b2bTier2Price, b2bTier3Price, b2bTier4Price,
    tySim, hbSim, iySim, storePrice
  };
}

function renderOfficialFactoryInvoiceHtml(product, m) {
  return `
    <div class="bg-[#0b1120] p-4 rounded-xl border border-slate-700/80 text-xs space-y-2.5 animate-slide-up w-full shadow-xl">
      <div class="flex justify-between items-center pb-2 border-b border-slate-800 font-bold text-xs text-amber-400">
        <span class="flex items-center gap-1.5 tracking-wide">📋 RESMİ FABRİKA MALİYET VE SİPARİŞ HESAP FATURASI</span>
        <span class="text-[11px] text-slate-300 font-medium bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">Tıkla Detay Gör ℹ️</span>
      </div>

      <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item1')" class="cursor-pointer hover:bg-slate-900/90 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
        <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
          <span class="flex items-center gap-2">
            ${m.supplyType === 'wholesale' ? `1. 📦 Toptan Dökme Yağ Payı (${m.vol})` : m.isMaceration ? `1. 🌿 Maserasyon Yağ Payı (${m.vol})` : `1. 🌾 Sıkım Yağ Payı (${m.vol})`}
            <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Formül / Detay</span>
          </span>
          <span class="font-bold text-amber-300 text-xs font-mono">${PriceCalculator.formatTL(m.rawOilCost)}</span>
        </div>
        ${openLayer2BreakdownInfos[product.id]?.item1 ? `
          <div class="mt-2.5 p-3 bg-[#080d1a] rounded-lg border border-amber-500/30 text-xs text-slate-200 space-y-1.5 animate-slide-up leading-relaxed">
            <div class="font-bold text-amber-400 border-b border-slate-800 pb-1 text-xs">💡 1. KALEM (HAM YAĞ) NASIL HESAPLANDI?</div>
            ${m.supplyType === 'wholesale' ? `
              <p>• <strong>Toptan Dökme Yağ Alış Fiyatı:</strong> ${PriceCalculator.formatTL(m.costPerKg)} / KG (%${m.kdvRate} KDV Dahil)</p>
              <p>• <strong>Sipariş Hesabı:</strong> ${PriceCalculator.formatTL(m.costPerKg)} × ${m.kg} KG = <strong>${PriceCalculator.formatTL(m.rawOilCost)}</strong></p>
            ` : m.isMaceration ? `
              <p>• <strong>Zeytinyağı Alış Fiyatı:</strong> ${PriceCalculator.formatTL(m.oliveOilCost)} / KG (%${m.kdvRate} KDV Dahil)</p>
              <p>• <strong>Ot/Bitki Alış Fiyatı:</strong> ${PriceCalculator.formatTL(m.herbCost)} / KG (Kullanılan Oran: ${m.macerationRes.calculatedRatio} KG Ot / 1 KG Yağ)</p>
              <p>• <strong>1 KG Maserasyon Yağ Maliyeti:</strong> ${PriceCalculator.formatTL(m.costPerKg)} / KG</p>
              <p>• <strong>Sipariş Hesabı:</strong> ${PriceCalculator.formatTL(m.costPerKg)} × ${m.kg} KG = <strong>${PriceCalculator.formatTL(m.rawOilCost)}</strong></p>
            ` : `
              <p>• <strong>1 KG Tohum Alış Fiyatı:</strong> ${PriceCalculator.formatTL(m.seedCost)} / KG (%${m.kdvRate} KDV Dahil)</p>
              <p>• <strong>Pres Yağ Çıkarma Verimi:</strong> %${m.yieldPct}</p>
              <p>• <strong>1 KG Yağ İçin Gereken Tohum:</strong> 1 / %${m.yieldPct} = <strong>${m.coldPressRes.seedNeededKg} KG Tohum</strong></p>
              <p>• <strong>Ham Yağ Baz Maliyeti:</strong> ${m.coldPressRes.seedNeededKg} KG × ${PriceCalculator.formatTL(m.seedCost)} = ${PriceCalculator.formatTL(m.coldPressRes.baseCost)} / KG</p>
              ${m.coldPressRes.dipFireAmount > 0 ? `
                <p class="text-rose-400 font-bold">• <strong>Dip/Tortu Firesi (%${m.dipPercent}):</strong> +${PriceCalculator.formatTL(m.coldPressRes.dipFireAmount)} / KG</p>
              ` : ''}
              <p>• <strong>1 KG Saf Sıkım Maliyeti:</strong> <strong>${PriceCalculator.formatTL(m.costPerKg)} / KG</strong></p>
              <p>• <strong>Sipariş Hesabı:</strong> ${PriceCalculator.formatTL(m.costPerKg)} × ${m.kg} KG = <strong>${PriceCalculator.formatTL(m.rawOilCost)}</strong></p>
            `}
          </div>
        ` : ''}
      </div>

      <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item2')" class="cursor-pointer hover:bg-slate-900/90 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
        <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
          <span class="flex items-center gap-2">
            ${layer2GroupMode === 'wholesale_drums' ? `2. 📦 Endüstriyel Ambalaj (${m.vol})` : `2. 🍾 Ambalaj Maliyeti (Şişe + Kapak + Kutu)`}
            <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Detay</span>
          </span>
          <span class="font-bold text-amber-300 text-xs font-mono">${PriceCalculator.formatTL(m.packCost)}</span>
        </div>
        ${openLayer2BreakdownInfos[product.id]?.item2 ? `
          <div class="mt-2.5 p-3 bg-[#080d1a] rounded-lg border border-slate-700 text-xs text-slate-200 space-y-1.5 animate-slide-up leading-relaxed">
            <div class="font-bold text-amber-400 border-b border-slate-800 pb-1 text-xs">💡 2. KALEM (AMBALAJ) DETAYI</div>
            ${layer2GroupMode === 'wholesale_drums' ? `
              <p>• <strong>Kullanılan Ambalaj:</strong> ${m.wholesalePack.breakdownText}</p>
              <p>• <strong>Toplam Ambalaj Maliyeti:</strong> <strong>${PriceCalculator.formatTL(m.packCost)}</strong></p>
            ` : `
              <p>• <strong>Şişe / Kutu Hacmi:</strong> ${m.vol}</p>
              <p>• <strong>Toplam Ambalaj & Kutu Seti Maliyeti:</strong> <strong>${PriceCalculator.formatTL(m.packCost)}</strong></p>
            `}
          </div>
        ` : ''}
      </div>

      <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item3')" class="cursor-pointer hover:bg-slate-900/90 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
        <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
          <span class="flex items-center gap-2">
            3. ⚡ Tesis & Enerji Masraf Payı ${m.isWholesaleSupply ? '(0 ₺ Toptan Alış)' : ''}
            <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Detay</span>
          </span>
          <span class="font-bold text-amber-300 text-xs font-mono">${PriceCalculator.formatTL(m.linearOverhead)}</span>
        </div>
        ${openLayer2BreakdownInfos[product.id]?.item3 ? `
          <div class="mt-2.5 p-3 bg-[#080d1a] rounded-lg border border-slate-700 text-xs text-slate-200 space-y-1.5 animate-slide-up leading-relaxed">
            <div class="font-bold text-amber-400 border-b border-slate-800 pb-1 text-xs">💡 3. KALEM (TESİS & ENERJİ) NASIL HESAPLANDI?</div>
            ${m.isWholesaleSupply ? `
              <p>• <strong>Dışarıdan Toptan Alım:</strong> Yağ fabrikamızın pres makinelerinde sıkılmadığı için elektrik/enerji payı eklenmemiştir (0,00 ₺).</p>
            ` : `
              <p>• <strong>Aylık 1KG Enerji & Tesis Payı:</strong> ${PriceCalculator.formatTL(m.energyOverheadToUse)} / KG</p>
              <p>• <strong>Sipariş Hacim Payı (${m.vol}):</strong> ${PriceCalculator.formatTL(m.energyOverheadToUse)} × ${m.kg} KG = <strong>${PriceCalculator.formatTL(m.linearOverhead)}</strong></p>
            `}
          </div>
        ` : ''}
      </div>

      <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item4')" class="cursor-pointer hover:bg-slate-900/90 py-2 px-3 rounded-lg transition-all border border-slate-800/80 shadow-sm">
        <div class="flex items-center justify-between text-slate-200 font-medium text-xs">
          <span class="flex items-center gap-2">
            4. ⚒️ Dolum & Paketleme İşçilik Payı
            <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Formül / Detay</span>
          </span>
          <span class="font-bold text-amber-300 text-xs font-mono">${PriceCalculator.formatTL(m.laborAssemblyFee)}</span>
        </div>
        ${openLayer2BreakdownInfos[product.id]?.item4 ? `
          <div class="mt-2.5 p-3 bg-[#080d1a] rounded-lg border border-slate-700 text-xs text-slate-200 space-y-1.5 animate-slide-up leading-relaxed">
            <div class="font-bold text-amber-400 border-b border-slate-800 pb-1 text-xs">💡 4. KALEM (İŞÇİLİK) NASIL HESAPLANDI?</div>
            <p>• <strong>Aylık 1KG Fabrika İşçilik Payı:</strong> ${PriceCalculator.formatTL(m.laborOverheadToUse)} / KG</p>
            <p>• <strong>Dolum & Montaj İşçilik Bedeli:</strong> <strong>${PriceCalculator.formatTL(m.laborAssemblyFee)}</strong></p>
          </div>
        ` : ''}
      </div>

      <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'totalCost')" class="cursor-pointer bg-[#080d1a] p-3 rounded-lg border border-amber-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-inner transition-all hover:border-amber-400">
        <div class="flex items-center gap-2">
          <span class="font-extrabold text-amber-400 text-xs">🏁 SAF FABRİKA ÜRETİM MALİYETİ (KÂRSIZ NET GİDER)</span>
          <span class="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ℹ️ Formül / Detay</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-black text-amber-300 text-sm font-mono">${PriceCalculator.formatTL(m.netCost)}</span>
        </div>
      </div>

      ${openLayer2BreakdownInfos[product.id]?.totalCost ? `
        <div class="p-3 bg-[#080d1a] rounded-lg border border-amber-500/30 text-xs text-slate-200 space-y-2 animate-slide-up leading-relaxed">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-300">Nakit Çıkan Tutar:</span>
              <span class="font-black text-amber-300 text-sm">${PriceCalculator.formatTL(m.netCost)}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[11px]">
              ${m.inputVatRate === 1 && m.salesVatRate === 20 ? `
                <span class="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800 font-bold">🛡️ KDV Koruması: +${PriceCalculator.formatTL(m.taxProtection.taxDiffSurcharge)}</span>
                <span class="font-black text-emerald-400">Dip Satış: ${PriceCalculator.formatTL(m.effectiveNetCost)}</span>
              ` : `
                <span class="px-2 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 font-bold">🛡️ Birebir Dengeli (%${m.salesVatRate} Alış ➔ %${m.salesVatRate} Satış)</span>
              `}
            </div>
          </div>
          <div class="text-[11px] text-slate-400 italic pt-1 space-y-1">
            <p>
            ${m.inputVatRate === 1 && m.salesVatRate === 20 ? `
              💡 Tohum KDV'niz (%1) Satış KDV'nizden (%20) düşük olduğu için devlete cebinizden vergi ödememeniz adına vergi koruma dengesi eklenmiştir.
            ` : `
              💡 Alış ve Satış KDV oranlarınız birebir eşittir (%${m.salesVatRate}). Cebinizden çıkan KDV dahil harcamanız başa baş satış maliyetinize tam eşittir.
            `}
            </p>
          </div>
        </div>
      ` : ''}

      ${layer2GroupMode === 'wholesale_drums' ? `
        <div class="p-3 bg-[#080d1a] rounded-xl border border-emerald-500/60 shadow-md text-xs space-y-1.5 mt-2">
          <div class="flex justify-between items-center border-b border-emerald-900/60 pb-1">
            <span class="font-black text-emerald-400 text-xs flex items-center gap-1.5">
              💰 MÜŞTERİYE SATIŞ YAPACAĞINIZ GERÇEK TEKLİF FİYATI
            </span>
            <span class="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700">%${m.kdvRate} KDV Dahil</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <div>
              <span class="text-[10px] text-slate-400 font-bold block">📢 1 KG BİRİM TEKLİF:</span>
              <span class="text-base font-black text-emerald-300 font-mono">${PriceCalculator.formatTL(m.finalWholesale1KgQuotePrice)} ₺ / KG</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 font-bold block">📦 SİPARİŞ TOPLAMI (${m.kg} KG):</span>
              <span class="text-base font-black text-emerald-300 font-mono">${PriceCalculator.formatTL(m.totalOrderPrice)} ₺</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderChannelSimulatorHtml(product, m) {
  if (layer2GroupMode === "wholesale_drums") {
    return `
      <div class="bg-[#0b1120] p-4 rounded-xl border border-slate-700/80 space-y-3 animate-slide-up shadow-xl">
        <div class="flex flex-wrap items-center justify-between bg-[#0f172a] p-3 rounded-xl border border-slate-800 gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-extrabold text-white flex items-center gap-1.5">🏢 B2B TOPTAN SANAYİ İSKONTO & KÂRLILIK CETVELİ</span>
            <span class="text-xs text-slate-400">(Tüm Kademeler İçin Otomatik Kâr/Zarar Hesabı)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-300">Saf Net Maliyetiniz:</span>
            <span class="text-xs font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800 font-mono">${PriceCalculator.formatTL(m.unitNetCost)} ₺ / KG</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div class="bg-[#0f172a] p-3 rounded-xl border border-slate-700/80 space-y-2 flex flex-col justify-between shadow-md">
            <div>
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span class="font-extrabold text-white text-xs">📦 KADEME 1 (5 - 29 KG)</span>
                <span class="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">%5 İskonto</span>
              </div>
              <div class="flex justify-between items-center text-slate-200 text-xs mb-1">
                <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                <span class="font-black text-amber-300 text-base font-mono">${PriceCalculator.formatTL(m.b2bTier1Price)} / KG</span>
              </div>
            </div>
          </div>

          <div class="bg-[#0f172a] p-3 rounded-xl border border-slate-700/80 space-y-2 flex flex-col justify-between shadow-md">
            <div>
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span class="font-extrabold text-white text-xs">📦 KADEME 2 (30 - 49 KG)</span>
                <span class="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">%10 İskonto</span>
              </div>
              <div class="flex justify-between items-center text-slate-200 text-xs mb-1">
                <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                <span class="font-black text-amber-300 text-base font-mono">${PriceCalculator.formatTL(m.b2bTier2Price)} / KG</span>
              </div>
            </div>
          </div>

          <div class="bg-[#0f172a] p-3 rounded-xl border border-slate-700/80 space-y-2 flex flex-col justify-between shadow-md">
            <div>
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span class="font-extrabold text-white text-xs">📦 KADEME 3 (50 - 99 KG)</span>
                <span class="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">%15 İskonto</span>
              </div>
              <div class="flex justify-between items-center text-slate-200 text-xs mb-1">
                <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                <span class="font-black text-amber-300 text-base font-mono">${PriceCalculator.formatTL(m.b2bTier3Price)} / KG</span>
              </div>
            </div>
          </div>

          <div class="bg-[#0f172a] p-3 rounded-xl border border-slate-700/80 space-y-2 flex flex-col justify-between shadow-md">
            <div>
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span class="font-extrabold text-white text-xs">📦 KADEME 4 (100+ KG)</span>
                <span class="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">%20 İskonto</span>
              </div>
              <div class="flex justify-between items-center text-slate-200 text-xs mb-1">
                <span class="font-semibold text-slate-400">1 KG Teklif Fiyatı:</span>
                <span class="font-black text-amber-300 text-base font-mono">${PriceCalculator.formatTL(m.b2bTier4Price)} / KG</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between bg-[#0f172a] p-2.5 rounded-xl border border-slate-800 gap-2">
          <div class="flex items-center gap-2 truncate text-xs">
            <span class="font-bold text-slate-300 shrink-0">B2B Müşteri Fiyat Teklifi:</span>
            <span class="font-mono text-xs text-slate-300 bg-[#080d1a] px-2.5 py-1 rounded-lg border border-slate-800 truncate">${product.name} — ${m.wholesalePack?.breakdownText || (m.kg + ' KG Bidon')} | Birim: ${PriceCalculator.formatTL(m.finalWholesale1KgQuotePrice)} ₺/KG | Toplam: ${PriceCalculator.formatTL(m.totalOrderPrice)} ₺</span>
          </div>
          <button onclick="copyWholesaleProposal('${product.id}', ${m.kg}, ${m.finalWholesale1KgQuotePrice}, ${m.totalOrderPrice}, ${m.kdvRate})" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer text-xs">
            📋 Teklif Metnini Kopyala
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-[#0b1120] p-4 rounded-xl border border-slate-700/80 space-y-3.5 animate-slide-up shadow-xl">
      <div class="flex flex-wrap items-center justify-between bg-[#0f172a] p-3 rounded-xl border border-slate-800 gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-extrabold text-white flex items-center gap-1.5">⚡ SİSTEM 1 SATIŞ KANALI & HAKEDİŞ SİMÜLATÖRÜ</span>
          <span class="text-xs text-slate-400">(Saf Fabrika Maliyeti Üzerinden Hesaplama)</span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-slate-200">Hedef Net Kâr (₺):</label>
          <input type="number" value="${m.targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-24 bg-[#080d1a] border border-slate-700 text-emerald-400 font-extrabold text-sm px-3 py-1 rounded-lg text-center focus:outline-none focus:border-sky-500 font-mono">
          <span class="text-xs font-bold text-slate-400">₺ / Adet</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
        <div class="bg-[#0f172a] p-3 rounded-xl border border-orange-800/40 space-y-2 flex flex-col justify-between shadow-md">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-orange-400 text-xs flex items-center gap-1">🧡 TRENDYOL</span>
              <span class="header-badge-ty px-2 py-0.5 rounded text-[10.5px] font-bold">%19 Kom.</span>
            </div>
            <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
              <span class="font-semibold text-slate-400">Tavsiye Satış Fiyatı:</span>
              <span class="font-black text-amber-300 text-base font-mono">${PriceCalculator.formatTL(m.tySim.salePrice)}</span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-mono">
              <div class="flex justify-between items-center"><span>(-) Komisyon (%19):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(m.tySim.commAmount)}</span></div>
              <div class="flex justify-between items-center"><span>(-) Kargo Ücreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(m.tySim.cargoFee)}</span></div>
              <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Hakediş (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(m.tySim.payout)}</span></div>
              <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(m.netCost)}</span></div>
            </div>
          </div>
          <div class="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 mt-2 flex justify-between items-center font-bold text-xs">
            <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
            <span class="text-emerald-300 font-black text-base font-mono">+${PriceCalculator.formatTL(m.tySim.netProfit)}</span>
          </div>
        </div>

        <div class="bg-[#0f172a] p-3 rounded-xl border border-sky-800/40 space-y-2 flex flex-col justify-between shadow-md">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-sky-400 text-xs flex items-center gap-1">🌐 İYZİCO (WEB SİTENİZ)</span>
              <span class="header-badge-iy px-2 py-0.5 rounded text-[10.5px] font-bold">%4 Kom.</span>
            </div>
            <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
              <span class="font-semibold text-slate-400">Tavsiye Satış Fiyatı:</span>
              <span class="font-black text-sky-300 text-base font-mono">${PriceCalculator.formatTL(m.iySim.salePrice)}</span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-mono">
              <div class="flex justify-between items-center"><span>(-) Komisyon (%4):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(m.iySim.commAmount)}</span></div>
              <div class="flex justify-between items-center"><span>(-) Kargo Ücreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(m.iySim.cargoFee)}</span></div>
              <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Hakediş (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(m.iySim.payout)}</span></div>
              <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(m.netCost)}</span></div>
            </div>
          </div>
          <div class="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 mt-2 flex justify-between items-center font-bold text-xs">
            <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
            <span class="text-emerald-300 font-black text-base font-mono">+${PriceCalculator.formatTL(m.iySim.netProfit)}</span>
          </div>
        </div>

        <div class="bg-[#0f172a] p-3 rounded-xl border border-amber-800/40 space-y-2 flex flex-col justify-between shadow-md">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-amber-400 text-xs flex items-center gap-1">🧡 HEPSİBURADA</span>
              <span class="header-badge-hb px-2 py-0.5 rounded text-[10.5px] font-bold">%17 Kom.</span>
            </div>
            <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
              <span class="font-semibold text-slate-400">Tavsiye Satış Fiyatı:</span>
              <span class="font-black text-amber-300 text-base font-mono">${PriceCalculator.formatTL(m.hbSim.salePrice)}</span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-mono">
              <div class="flex justify-between items-center"><span>(-) Komisyon (%17):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(m.hbSim.commAmount)}</span></div>
              <div class="flex justify-between items-center"><span>(-) Kargo Ücreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(m.hbSim.cargoFee)}</span></div>
              <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Hakediş (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(m.hbSim.payout)}</span></div>
              <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(m.netCost)}</span></div>
            </div>
          </div>
          <div class="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 mt-2 flex justify-between items-center font-bold text-xs">
            <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
            <span class="text-emerald-300 font-black text-base font-mono">+${PriceCalculator.formatTL(m.hbSim.netProfit)}</span>
          </div>
        </div>

        <div class="bg-[#0f172a] p-3 rounded-xl border border-emerald-800/40 space-y-2 flex flex-col justify-between shadow-md">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-emerald-400 text-xs flex items-center gap-1">🏪 FİZİKİ MAĞAZA</span>
              <span class="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">Direkt</span>
            </div>
            <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
              <span class="font-semibold text-slate-400">Mağaza Fiyatı:</span>
              <span class="font-black text-emerald-300 text-base font-mono">${PriceCalculator.formatTL(m.storePrice)}</span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-mono">
              <div class="flex justify-between items-center"><span>(-) Komisyon:</span><span class="text-emerald-400 font-bold">0,00 ₺</span></div>
              <div class="flex justify-between items-center"><span>(-) Kargo:</span><span class="text-emerald-400 font-bold">0,00 ₺</span></div>
              <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Kasa (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(m.storePrice)}</span></div>
              <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(m.netCost)}</span></div>
            </div>
          </div>
          <div class="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 mt-2 flex justify-between items-center font-bold text-xs">
            <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÂRINIZ:</span>
            <span class="text-emerald-300 font-black text-base font-mono">+${PriceCalculator.formatTL(m.targetProfitInput)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLayer2CockpitDesk(product, overheadRes) {
  const deskContainer = document.getElementById("layer2-split-desk");
  if (!deskContainer) return;

  if (!product) {
    deskContainer.innerHTML = `<div class="p-8 text-center text-slate-400 bg-[#0f172a] rounded-xl border border-slate-800">Lütfen sol listeden incelemek istediğiniz bir ürünü seçin.</div>`;
    return;
  }

  const m = computeLayer2ProductMetrics(product, overheadRes);
  const badgeClass = product.category === "Uçucu Yağlar"
    ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
    : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50";

  deskContainer.innerHTML = `
    <div class="glass-card rounded-2xl p-4 border border-slate-700/80 bg-[#0f172a] shadow-xl space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-300 bg-[#080d1a] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 shadow-sm">${product.sku}</span>
            <h2 class="text-base font-black text-white tracking-tight">${product.name}</h2>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-md border ${badgeClass}">${product.category}</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Saf Üretim Maliyet & Satış Kanalı Yönetim Masası</p>
        </div>
        <div class="flex items-center gap-2">
          ${m.isAnyModified ? `
            <button onclick="resetProductField('${product.id}', 'all')" title="Tüm Girdileri Orijinal Başlangıç Fiyatlarına Dön" class="text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-800/80 transition-all flex items-center gap-1 cursor-pointer">
              ↺ Varsayılana Dön
            </button>
          ` : ''}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span class="text-slate-400 font-bold text-[11px]">Ambalaj:</span>
          ${layer2GroupMode === 'wholesale_drums' 
            ? `<input type="number" value="${m.kg}" min="1" step="1" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-14 bg-[#0f172a] text-slate-100 font-bold px-1.5 py-0.5 rounded border border-slate-700 text-center text-xs font-mono"> <span class="text-slate-400 font-bold">KG</span>`
            : `<select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-[#0f172a] text-slate-100 font-bold px-2 py-1 rounded border border-slate-700 cursor-pointer text-xs font-mono">${getLayer2VolumeOptionsHtml(m.vol, product)}</select>`
          }
        </div>

        <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span class="text-slate-400 font-bold text-[11px]">Reçete:</span>
          ${m.isEssentialOil ? `
            <span class="text-xs font-extrabold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">📦 Saf Uçucu</span>
          ` : `
            <div class="flex items-center p-0.5 bg-[#0f172a] rounded border border-slate-800">
              <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2 py-0.5 rounded text-[10.5px] font-bold transition-all ${m.supplyType !== 'wholesale' ? (m.isMaceration ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-slate-950') : 'text-slate-400 hover:text-white'}">
                ${m.isMaceration ? '🌿 Maserasyon' : '🌾 Sıkım'}
              </button>
              <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2 py-0.5 rounded text-[10.5px] font-bold transition-all ${m.supplyType === 'wholesale' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}">
                📦 Toptan
              </button>
            </div>
          `}
        </div>

        ${m.isMaceration && m.supplyType !== 'wholesale' ? `
          <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span class="text-emerald-400 font-bold text-xs">🫒 Z.Yağı:</span>
            <input type="number" value="${m.oliveOilCost}" step="10" onchange="updateLayer2ProductField('${product.id}', 'oliveOilCostPerKg', this.value)" class="w-16 bg-[#0f172a] border border-slate-700 text-emerald-300 font-bold text-xs py-0.5 px-1 rounded text-center font-mono">
            <span class="text-indigo-300 font-bold text-xs ml-1">🌱 Ot:</span>
            <input type="number" value="${m.herbCost}" step="10" onchange="updateLayer2ProductField('${product.id}', 'herbCostPerKg', this.value)" class="w-16 bg-[#0f172a] border border-slate-700 text-indigo-300 font-bold text-xs py-0.5 px-1 rounded text-center font-mono">
          </div>
        ` : m.supplyType === 'press' ? `
          <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span class="text-amber-400 font-bold text-xs">🌾 Tohum:</span>
            <input type="number" value="${m.seedCost}" step="5" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-16 bg-[#0f172a] border border-slate-700 text-amber-300 font-bold text-xs py-0.5 px-1 rounded text-center font-mono"> <span class="text-slate-400 font-bold">₺</span>
            <span class="text-slate-400 font-bold text-xs ml-1">💧 Verim:</span>
            <input type="number" value="${m.yieldPct}" step="1" min="1" max="100" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-14 bg-[#0f172a] border border-slate-700 text-amber-300 font-bold text-xs py-0.5 px-1 rounded text-center font-mono"> <span class="text-slate-400 font-bold">%</span>
          </div>
        ` : `
          <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span class="text-blue-400 font-bold text-xs">📦 Dökme Alış:</span>
            <input type="number" value="${m.costPerKg}" step="10" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-[#0f172a] border border-slate-700 text-blue-300 font-bold text-xs py-0.5 px-1.5 rounded text-center font-mono"> <span class="text-slate-400 font-bold">₺/KG</span>
          </div>
        `}

        ${m.supplyType === 'press' ? `
          <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span class="text-xs font-bold text-rose-300">Dip Fire:</span>
            <select onchange="updateLayer2ProductField('${product.id}', 'dipStatus', this.value)" class="bg-[#0f172a] border border-rose-900/60 text-rose-300 font-bold text-xs py-0.5 px-1.5 rounded cursor-pointer">
              <option value="none" ${m.dipStatus !== 'has_dip' ? 'selected' : ''}>Dip Yok (%0)</option>
              <option value="has_dip" ${m.dipStatus === 'has_dip' ? 'selected' : ''}>🔴 Dip Var</option>
            </select>
            ${m.dipStatus === 'has_dip' ? `
              <input type="number" value="${m.dipPercent}" step="1" min="0" max="90" onchange="updateLayer2ProductField('${product.id}', 'dipPercent', this.value)" class="w-12 bg-[#0f172a] border border-rose-500 text-rose-300 font-bold text-xs py-0.5 px-1 rounded text-center font-mono"> <span class="text-rose-300 font-bold">%</span>
            ` : ''}
          </div>
        ` : ''}

        <div class="flex items-center gap-1.5 bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span class="text-[10px] text-slate-400 font-bold">KDV:</span>
          <select onchange="updateProductInputVat('${product.id}', this.value)" class="bg-[#0f172a] text-amber-300 font-bold border border-slate-700 rounded px-1.5 py-0.5 text-xs cursor-pointer">
            <option value="1" ${m.inputVatRate === 1 ? 'selected' : ''}>Alış %1</option>
            <option value="20" ${m.inputVatRate === 20 ? 'selected' : ''}>Alış %20</option>
          </select>
          <span class="text-slate-600 font-bold">➔</span>
          <select onchange="updateProductSalesVat('${product.id}', this.value)" class="bg-[#0f172a] text-emerald-300 font-bold border border-slate-700 rounded px-1.5 py-0.5 text-xs cursor-pointer">
            <option value="1" ${m.salesVatRate === 1 ? 'selected' : ''}>Satış %1</option>
            <option value="20" ${m.salesVatRate === 20 ? 'selected' : ''}>Satış %20</option>
          </select>
        </div>
      </div>
    </div>

    ${renderOfficialFactoryInvoiceHtml(product, m)}

    ${renderChannelSimulatorHtml(product, m)}
  `;
}

function renderLayer2Cards() {
  try {
    const containerGrid = document.getElementById("layer2-product-grid");
    const containerRows = document.getElementById("layer2-product-rows");
    const splitContainer = document.getElementById("layer2-split-container");
    const splitList = document.getElementById("layer2-split-list");
    const splitDesk = document.getElementById("layer2-split-desk");
    const listCountEl = document.getElementById("layer2-list-count");

    if (!containerGrid || !containerRows) return;

    const activeView = (typeof viewMode !== "undefined" && viewMode) ? viewMode : "split";

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

    if (listCountEl) {
      listCountEl.innerText = `${productsList.length} Ürün`;
    }

    const overhead = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overhead);

    if (productsList.length === 0) {
      const emptyHtml = `<div class="col-span-full py-12 text-center text-slate-400 font-medium bg-[#0f172a] rounded-2xl border border-slate-800">Aramanıza veya seçtiğiniz kategoriye uygun ürün bulunamadı.</div>`;
      if (containerRows) containerRows.innerHTML = emptyHtml;
      if (splitList) splitList.innerHTML = emptyHtml;
      if (splitDesk) splitDesk.innerHTML = emptyHtml;
      return;
    }

    if (activeView === "split" && splitContainer && splitList && splitDesk) {
      splitContainer.classList.remove("hidden");
      containerRows.classList.add("hidden");
      containerGrid.classList.add("hidden");

      if (!activeCockpitProductId || !productsList.some(p => p.id === activeCockpitProductId)) {
        activeCockpitProductId = productsList[0].id;
      }

      const prevScroll = splitList.scrollTop;
      splitList.innerHTML = productsList.map(product => {
        const isSelected = product.id === activeCockpitProductId;
        const m = computeLayer2ProductMetrics(product, overheadRes);
        const bClass = product.category === "Uçucu Yağlar"
          ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
          : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50";
        return `
          <div onclick="selectCockpitProduct('${product.id}')" data-product-id="${product.id}" class="glass-card p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'product-card-active' : 'border-slate-800/80 hover:border-slate-700 bg-[#0f172a]/70 hover:bg-[#131d33]'}">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 truncate">
                <span class="font-mono text-[10px] font-bold text-slate-300 bg-[#080d1a] px-2 py-0.5 rounded border border-slate-800 shrink-0">${product.sku}</span>
                <span class="text-xs font-bold text-white truncate" title="${product.name}">${product.name}</span>
              </div>
              <span class="text-[9.5px] px-1.5 py-0.5 rounded border ${bClass} shrink-0">${product.category === 'Uçucu Yağlar' ? 'Uçucu' : 'Sabit'}</span>
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-1.5 border-t border-slate-800/60">
              <span class="text-slate-400 text-[11px] font-medium font-mono">${m.vol}</span>
              <div class="flex items-center gap-2.5">
                <span class="text-[11px] text-slate-400">1KG: <strong class="text-slate-200 font-mono font-bold">${PriceCalculator.formatTL(m.costPerKg)}</strong></span>
                <span class="text-amber-400 font-black font-mono text-xs">${PriceCalculator.formatTL(m.effectiveNetCost)}</span>
              </div>
            </div>
          </div>
        `;
      }).join("");
      splitList.scrollTop = prevScroll;

      const activeProd = productsList.find(p => p.id === activeCockpitProductId) || productsList[0];
      renderLayer2CockpitDesk(activeProd, overheadRes);
      return;
    }

    if (splitContainer) splitContainer.classList.add("hidden");
    containerRows.classList.remove("hidden");
    containerGrid.classList.add("hidden");
    containerRows.innerHTML = "";

    productsList.forEach(product => {
      try {
        const m = computeLayer2ProductMetrics(product, overheadRes);
        const isBreakdownOpen = !!openLayer2Breakdowns[product.id];
        const isDrawerOpen = !!openLayer2Drawers[product.id];

        const badgeClass = product.category === "Uçucu Yağlar"
          ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
          : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50";

        const rowHtml = `
          <div class="glass-card rounded-xl p-3.5 border border-slate-800/80 hover:border-slate-700 bg-[#0f172a] transition-all shadow-sm hover:shadow-md flex flex-col gap-3">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <!-- Sol: Ürün Bilgisi -->
              <div class="flex items-center gap-3 min-w-[240px]">
                <span class="font-mono text-xs font-bold text-slate-300 bg-[#080d1a] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 shadow-sm">
                  ${product.sku}
                </span>
                <div class="truncate">
                  <div class="flex items-center gap-1.5 truncate">
                    <h3 class="text-sm font-bold text-white group-hover:text-slate-200 transition-colors truncate" title="${product.name}">
                      ${product.name}
                    </h3>
                    ${m.isAnyModified ? `
                      <button onclick="resetProductField('${product.id}', 'all')" title="Tüm Girdileri Orijinal Başlangıç Fiyatlarına Dön" class="text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-800/80 shrink-0 cursor-pointer">
                        ↺
                      </button>
                    ` : ''}
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}">
                      ${product.category}
                    </span>
                    <span class="text-[11px] text-slate-400">1KG: <strong class="text-slate-200 font-mono font-bold">${PriceCalculator.formatTL(m.costPerKg)}</strong></span>
                  </div>
                </div>
              </div>

              <!-- Orta: Ambalaj & Hızlı Girdiler -->
              <div class="flex items-center gap-3 flex-wrap">
                ${layer2GroupMode === 'wholesale_drums' ? `
                  <div class="flex items-center gap-1.5 bg-[#0b1120] px-3 py-1.5 rounded-xl border border-slate-800">
                    <span class="text-xs text-slate-400 font-medium">📦 Miktar:</span>
                    <input type="number" value="${m.kg}" min="1" step="1" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-16 bg-[#080d1a] border border-slate-700 text-amber-300 font-bold text-xs px-2 py-1 rounded text-center focus:outline-none focus:border-amber-400">
                    <span class="text-xs font-bold text-slate-300">KG</span>
                  </div>
                ` : `
                  <div class="flex items-center gap-1.5 bg-[#0b1120] px-3 py-1.5 rounded-xl border border-slate-800">
                    <span class="text-xs text-slate-400 font-medium">🧴 Ambalaj:</span>
                    <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-[#080d1a] border border-slate-700 text-slate-200 font-bold text-xs px-2.5 py-1 rounded focus:outline-none focus:border-amber-400">
                      ${getLayer2VolumeOptionsHtml(m.vol, product)}
                    </select>
                  </div>
                `}

                <div class="flex items-center gap-2 bg-[#080d1a] px-3 py-1.5 rounded-xl border border-amber-500/30">
                  <span class="text-xs text-slate-400 font-medium">Saf Maliyet:</span>
                  <span class="text-sm font-black text-amber-400 font-mono">${PriceCalculator.formatTL(m.effectiveNetCost)}</span>
                </div>
              </div>

              <!-- Sağ: Aksiyon Butonları -->
              <div class="flex items-center gap-2 shrink-0">
                <button onclick="toggleLayer2Breakdown('${product.id}')" class="text-xs font-bold px-3 py-2 rounded-xl transition-all border flex items-center gap-1.5 cursor-pointer ${isBreakdownOpen ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md' : 'bg-[#0b1120] hover:bg-slate-800 text-slate-200 border-slate-700'}">
                  📋 ${isBreakdownOpen ? "Fatura Gizle" : "Fatura Dökümü"}
                </button>
                <button onclick="toggleLayer2Drawer('${product.id}')" class="text-xs font-bold px-3 py-2 rounded-xl transition-all border flex items-center gap-1.5 cursor-pointer ${isDrawerOpen ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md' : 'bg-[#0b1120] hover:bg-slate-800 text-emerald-300 border-emerald-800/60'}">
                  ⚡ ${isDrawerOpen ? "Simülatör Gizle" : "Satış Simülatörü"}
                </button>
              </div>
            </div>

            <!-- Fatura Dökümü Bölümü -->
            ${isBreakdownOpen ? renderOfficialFactoryInvoiceHtml(product, m) : ""}

            <!-- Satış Simülatörü Bölümü -->
            ${isDrawerOpen ? renderChannelSimulatorHtml(product, m) : ""}
          </div>
        `;
        containerRows.insertAdjacentHTML("beforeend", rowHtml);
      } catch (itemErr) {
        console.error("Katman 2 Ürün Satırı Yükleme Hatası:", itemErr);
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

  // Isolate Katman 2 reset: Clear Katman 2 Sim override data only!
  StorageManager.resetLayer2SimProduct(product.id);
  renderLayer2Cards();
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
  if (field === "wholesaleMarginPct") product.wholesaleMarginPct = parseFloat(value) || 20;
  if (field === "wholesaleMarginMode") product.wholesaleMarginMode = value; // 'percent' | 'amount'
  if (field === "wholesaleMarginValue") product.wholesaleMarginValue = parseFloat(value) || 0;
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
      fallbackCostPerKg: masterProduct.costPerKg || 600
    });
    product.herbRatioKg = macerationRes.calculatedRatio;
    product.layer2NetCostPerKg = macerationRes.netCostPerKg;
  } else {
    if (product.seedCostPerKg === undefined || product.seedCostPerKg === null) {
      product.seedCostPerKg = parseFloat(((masterProduct.costPerKg || 1212.00) * 0.25).toFixed(2));
    }
    const coldPressRes = PriceCalculator.calculateColdPressCost({
      seedCostPerKg: product.seedCostPerKg,
      yieldPercent: product.yieldPercent || 25,
      wholesaleCostPerKg: product.wholesaleCostPerKg,
      supplyType: supplyType,
      dipStatus: product.dipStatus || "none",
      dipPercent: product.dipPercent || 0,
      fallbackCostPerKg: masterProduct.costPerKg || 1200
    });
    product.layer2NetCostPerKg = coldPressRes.netCostPerKg;
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

  renderLayer2Cards();
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

    const cargoSavingsEl = document.getElementById("l3-bundle-cargo-savings") || document.getElementById("bundle-cargo-savings");
    const savedCargo = (itemEntries.length - 1) * dhlCargo;
    if (cargoSavingsEl) cargoSavingsEl.textContent = `🚀 Tek Kargo: +${PriceCalculator.formatTL(savedCargo)} Kargo Tasarrufu!`;

    const tyRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 19, cargo: dhlCargo });
    const iyRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 4, cargo: dhlCargo });
    const hbRes = PriceCalculator.calculateBundleSim({ itemsCostList: costsList, bundlePrice: bundleTargetPrice, commission: 17, cargo: dhlCargo });
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

let currentLayer3SubTab = "multipack"; // 'multipack' | 'bundle' | 'offers' | 'catalog'
let currentMultipackQty = 2;

function switchLayer3SubTab(tab) {
  currentLayer3SubTab = tab;

  const vMulti = document.getElementById("l3-view-multipack");
  const vBundle = document.getElementById("l3-view-bundle");
  const vOffers = document.getElementById("l3-view-offers");
  const vCatalog = document.getElementById("l3-view-catalog");

  if (vMulti) vMulti.classList.toggle("hidden", tab !== "multipack");
  if (vBundle) vBundle.classList.toggle("hidden", tab !== "bundle");
  if (vOffers) vOffers.classList.toggle("hidden", tab !== "offers");
  if (vCatalog) vCatalog.classList.toggle("hidden", tab !== "catalog");

  const btnMulti = document.getElementById("l3-tab-btn-multipack");
  const btnBundle = document.getElementById("l3-tab-btn-bundle");
  const btnOffers = document.getElementById("l3-tab-btn-offers");
  const btnCatalog = document.getElementById("l3-tab-btn-catalog");

  const activeClass = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-zinc-950 shadow-sm cursor-pointer flex items-center gap-1.5";
  const inactiveClass = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1.5";

  if (btnMulti) btnMulti.className = tab === "multipack" ? activeClass : inactiveClass;
  if (btnBundle) btnBundle.className = tab === "bundle" ? activeClass : inactiveClass;
  if (btnOffers) btnOffers.className = tab === "offers" ? activeClass : inactiveClass;
  if (btnCatalog) btnCatalog.className = tab === "catalog" ? activeClass : inactiveClass;

  if (tab === "multipack") {
    initMultipackSimulator();
  } else if (tab === "bundle") {
    populateBundleProductDropdowns();
    updateBundleSimulator();
  } else if (tab === "offers") {
    initOfferSimulator();
  } else if (tab === "catalog") {
    renderProductGrid();
  }
}

function initLayer3Hub() {
  switchLayer3SubTab(currentLayer3SubTab || "multipack");
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
  const priceInput = document.getElementById("mp-single-price");
  if (!sel) return;

  const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
  if (!p) return;

  const vol = volSel ? volSel.value : "250ml";
  const defaultPrice = (p.prices && p.prices[vol]) ? p.prices[vol] : (p.prices && p.prices["250ml"] ? p.prices["250ml"] : 250);
  if (priceInput) priceInput.value = defaultPrice;

  calculateMultipackSim();
}

function setMultipackQty(qty) {
  currentMultipackQty = qty;
  const customInput = document.getElementById("mp-custom-qty");
  if (customInput) customInput.value = qty;

  const btn2 = document.getElementById("mp-qty-btn-2");
  const btn3 = document.getElementById("mp-qty-btn-3");

  if (btn2) {
    btn2.className = qty === 2 
      ? "flex-1 py-1.5 px-3 rounded-lg text-xs font-black bg-blue-600 text-white border border-blue-400 cursor-pointer"
      : "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700 hover:text-white cursor-pointer";
  }
  if (btn3) {
    btn3.className = qty === 3
      ? "flex-1 py-1.5 px-3 rounded-lg text-xs font-black bg-blue-600 text-white border border-blue-400 cursor-pointer"
      : "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700 hover:text-white cursor-pointer";
  }

  calculateMultipackSim();
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
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span class="text-slate-400 font-bold uppercase text-[10px]">1 Adet Net Kâr:</span>
            <span class="font-black text-emerald-400 text-sm">${PriceCalculator.formatTL(sim.singleNetProfit)}</span>
          </div>
          <div class="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
            <span>${qty} Adet Ayrı Satılsaydı Toplam:</span>
            <span class="font-bold text-slate-300">${PriceCalculator.formatTL(sim.singleNetProfit * qty)}</span>
          </div>
        </div>
      </div>

      <!-- KART 2: 🚀 KAMPANYALI ÇOKLU SEPET (CANLI HESAP) -->
      <div class="bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/40 p-4 rounded-2xl border border-blue-500/40 space-y-3 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        <div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">🚀</span>
              <span class="font-extrabold text-blue-300 text-xs">${qty}'Lİ PAKET / SEPET KAMPANYASI</span>
            </div>
            <span class="text-[10px] font-black text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700 animate-pulse">TEK KARGO</span>
          </div>

          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between"><span>Müşteri Sepet Toplamı:</span><span class="font-black text-amber-300 text-sm">${PriceCalculator.formatTL(sim.totalPrice)}</span></div>
            <div class="flex justify-between"><span>(-) Komisyon (%${comm}):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(sim.commAmount)}</span></div>
            <div class="flex justify-between">
              <span class="flex items-center gap-1">(-) <strong>Tek Kargo (DHL ${desi} Desi):</strong></span>
              <span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(sim.cargoFee)}</span>
            </div>
            <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) Toplam Hakediş:</span><span class="text-emerald-300 text-sm">${PriceCalculator.formatTL(sim.payout)}</span></div>
            <div class="flex justify-between text-slate-400"><span>(-) ${qty} Adet Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(sim.totalCost)}</span></div>
          </div>
        </div>

        <div class="space-y-2 border-t border-slate-700/80 pt-2">
          <div class="${sim.netProfit >= 0 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'} p-2.5 rounded-xl border flex justify-between items-center shadow-lg">
            <div>
              <span class="${sim.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} uppercase tracking-wider text-[10px] block font-bold">KAMPANYA NET KÂRI:</span>
              <span class="text-[10px] text-slate-300 font-medium">(Birim Başına: ${PriceCalculator.formatTL(sim.profitPerUnit)})</span>
            </div>
            <span class="${sim.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-black text-lg font-mono">
              ${sim.netProfit > 0 ? '+' : ''}${PriceCalculator.formatTL(sim.netProfit)}
            </span>
          </div>

          <div class="${extraProfitBadgeBg} p-2 rounded-xl border flex justify-between items-center text-[11px] font-bold">
            <span>📦 Kargo Tasarruf Avantajı:</span>
            <span class="font-black">+${PriceCalculator.formatTL(sim.cargoSaved)}</span>
          </div>

          <div class="bg-blue-950/60 border border-blue-800/60 p-2 rounded-xl flex justify-between items-center text-[11px] text-blue-200">
            <span>💡 Tekli Satışa Göre Net Kâr Farkı:</span>
            <span class="font-black ${sim.extraProfitComparedToSingle >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
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

  onOfferProductChange();
}

function onOfferProductChange() {
  const sel = document.getElementById("offer-product-select");
  const volSel = document.getElementById("offer-volume-select");
  const baseInput = document.getElementById("offer-base-price");
  if (!sel) return;

  const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
  if (!p) return;

  const vol = volSel ? volSel.value : "250ml";
  const defaultPrice = (p.prices && p.prices[vol]) ? p.prices[vol] : (p.prices && p.prices["250ml"] ? p.prices["250ml"] : 250);
  if (baseInput) baseInput.value = defaultPrice;

  applyOfferPreset("av1");
}

function onOfferChannelChange() {
  const channel = document.getElementById("offer-channel-select")?.value || "trendyol";
  const commInput = document.getElementById("offer-commission");
  if (commInput) commInput.value = channel === "trendyol" ? 19 : 17;
  calculateOfferSim();
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

    if (!sel || !volSel || !targetInput) return;

    const p = currentProducts[sel.value] || Object.values(currentProducts).find(item => item.id === sel.value || item.sku === sel.value);
    if (!p) return;

    const vol = volSel.value || "250ml";
    const basePrice = parseFloat(baseInput?.value) || 0;
    const offerPrice = parseFloat(targetInput.value) || 0;
    const comm = parseFloat(commInput?.value) || 19;
    const desi = parseInt(desiSel?.value, 10) || 2;
    const dhlCargo = PriceCalculator.getDhlRateByDesi(desi);

    // 1. Katman Canlı Saf Fabrika Maliyeti
    const overheadConfig = StorageManager.getFactoryOverhead();
    const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(overheadConfig);
    const costCalc = getLayer2EffectiveCostForVolume(p, vol, overheadRes.overheadPerKg);
    const unitCost = costCalc.effectiveNetCost;

    const sim = PriceCalculator.calculateMarketplaceOfferSim({
      basePrice: basePrice,
      offerPrice: offerPrice,
      unitCost: unitCost,
      commissionPercent: comm,
      cargoFee: dhlCargo
    });

    const cardEl = document.getElementById("offer-analysis-card");
    if (!cardEl) return;

    const isProfit = sim.isProfitable;
    const cardBg = isProfit 
      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-emerald-500/50" 
      : "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 border-rose-500/60 animate-pulse";

    const badgeStatus = isProfit
      ? `<span class="px-3 py-1 rounded-lg text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5">🟢 KÂRLI TEKLİF (+${PriceCalculator.formatTL(sim.netProfit)})</span>`
      : `<span class="px-3 py-1 rounded-lg text-xs font-black bg-rose-950 text-rose-300 border border-rose-500/60 flex items-center gap-1.5">🔴 ZARARLI TEKLİF (${PriceCalculator.formatTL(sim.netProfit)})</span>`;

    const discountRateFromBase = basePrice > 0 ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;

    cardEl.className = `${cardBg} rounded-2xl p-5 border shadow-2xl space-y-4 transition-all`;
    cardEl.innerHTML = `
      <div class="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div>
          <h5 class="text-sm font-black text-white flex items-center gap-2">
            ${p.name} <span class="text-sky-300 font-bold text-xs">(${vol})</span>
          </h5>
          <p class="text-[11px] text-slate-400 mt-0.5">Normal Liste Fiyatı: <strong class="text-slate-200">${PriceCalculator.formatTL(basePrice)}</strong> • Kampanya İndirimi: <strong class="text-purple-300">%${discountRateFromBase}</strong></p>
        </div>
        ${badgeStatus}
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div>
          <span class="text-slate-400 text-[10px] uppercase font-bold block">Teklif Satış Fiyatı:</span>
          <span class="font-black text-white text-base">${PriceCalculator.formatTL(sim.offerPrice)}</span>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] uppercase font-bold block">Komisyon (%${comm}):</span>
          <span class="font-bold text-rose-400 text-sm">-${PriceCalculator.formatTL(sim.commAmount)}</span>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] uppercase font-bold block">DHL Kargo (${desi} Desi):</span>
          <span class="font-bold text-rose-400 text-sm">-${PriceCalculator.formatTL(sim.cargoFee)}</span>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] uppercase font-bold block">Banka Hakedişiniz:</span>
          <span class="font-black text-sky-300 text-base">${PriceCalculator.formatTL(sim.payout)}</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl ${isProfit ? 'bg-emerald-950/60 border border-emerald-600/40' : 'bg-rose-950/60 border border-rose-600/50'}">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${isProfit ? '💰' : '⚠️'}</span>
          <div>
            <span class="text-[10px] uppercase font-bold ${isProfit ? 'text-emerald-300' : 'text-rose-300'} block">
              1. KATMAN SAF MALİYETE GÖRE NET KÂR / ZARAR:
            </span>
            <div class="flex items-center gap-2">
              <span class="text-lg font-black ${isProfit ? 'text-emerald-200' : 'text-rose-200'}">
                ${isProfit ? '+' : ''}${PriceCalculator.formatTL(sim.netProfit)}
              </span>
              <span class="text-xs font-bold text-slate-300">
                (Kâr Marjı: %${sim.profitMargin} | 1. Katman Maliyeti: ${PriceCalculator.formatTL(sim.unitCost)})
              </span>
            </div>
          </div>
        </div>

        <div class="bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 text-right">
          <span class="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">🛡️ KIRMIZI ÇİZGİ ASGARİ TEKLİF:</span>
          <span class="text-sm font-black text-amber-300">${PriceCalculator.formatTL(sim.redlineFloorPrice)}</span>
          <span class="text-[9px] text-slate-500 block">(0 ₺ kârla kurtaran taban)</span>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Offer calc error:", err);
  }
}

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

        // Katman 1 Recommended Sale Price (Target Profit = 70 TL or 0 TL in Dip Fiyat Mode)
        const targetProfitForReport = isLayer3DipFiyatMode ? 0 : 70;
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

  let livePrice = null;
  let siteUrl = "https://www.cansizzadeyag.com/";

  if (channel === "trendyol") {
    const tyM = findTrendyolProduct(product.name, volKey);
    if (tyM && tyM.price > 0) {
      livePrice = tyM.price;
      if (tyM.url) siteUrl = tyM.url;
    }
  } else {
    const vOverride = StorageManager.getSiteOverride(product.id, volKey);
    const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;
    if (vOverride !== null && !isNaN(parseFloat(vOverride))) {
      livePrice = parseFloat(vOverride);
    } else if (siteData && siteData.samplePrices && typeof siteData.samplePrices[volKey] === "number" && siteData.samplePrices[volKey] > 0) {
      livePrice = siteData.samplePrices[volKey];
    }
    if (siteData && siteData.urls && siteData.urls[volKey]) {
      siteUrl = siteData.urls[volKey];
    } else if (siteData && siteData.url) {
      siteUrl = siteData.url;
    }
  }

  const hasLivePrice = livePrice !== null && livePrice > 0;
  const commAmt = hasLivePrice ? parseFloat((livePrice * (commRate / 100)).toFixed(2)) : 0;
  const payout = hasLivePrice ? parseFloat((livePrice - commAmt - cargoFee).toFixed(2)) : 0;
  const netProfit = hasLivePrice ? parseFloat((payout - calc.effectiveNetCost).toFixed(2)) : 0;

  const targetProfit = isLayer3DipFiyatMode ? 0 : calc.targetProfit;
  const sys1 = PriceCalculator.calculateSystem1Channel({
    salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: calc.effectiveNetCost,
    targetProfit: targetProfit,
    commission: commRate,
    cargo: cargoFee
  });
  const recPrice = sys1.salePrice;
  const diffPrice = hasLivePrice ? livePrice - recPrice : 0;

  const isAbove = diffPrice >= 0;

  const titleEl = document.getElementById("l3-calc-modal-title");
  const subTitleEl = document.getElementById("l3-calc-modal-subtitle");
  const contentEl = document.getElementById("l3-calc-modal-content");

  if (titleEl) titleEl.innerText = `🧾 ${product.name} (${volKey}) - Fiyat & Kârlılık Dökümü`;
  if (subTitleEl) subTitleEl.innerText = `${channelName.toUpperCase()} Mağazası | SKU: ${product.sku} | Sistem Tavsiyesi, Canlı Satış ve Başa Baş Dip Maliyet Kıyaslaması`;

  if (contentEl) {
    contentEl.innerHTML = `
      <!-- Ürün & Ambalaj Başlık Künyesi -->
      <div class="bg-[#0b1120] p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span class="font-bold text-white text-sm">🌿 ${product.name}</span>
          <span class="text-slate-400 font-mono text-[11px] ml-2">SKU: ${product.sku}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg bg-[#080d1a] text-amber-300 border border-amber-500/30 font-black text-xs">
            📌 İncelenen Ambalaj: ${volKey}
          </span>
          <span class="px-2.5 py-1 rounded-lg ${channel === 'trendyol' ? 'bg-orange-950/70 text-orange-300 border border-orange-800' : 'bg-sky-950/70 text-sky-300 border border-sky-800'} font-bold text-xs">
            ${channelName}
          </span>
        </div>
      </div>

      <!-- 📌 3 TEMEL FİYAT VE MALİYET KARŞILAŞTIRMASI KARTLARI -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

        <!-- 1. SİSTEMİMİZİN ÖNERDİĞİ SATIŞ FİYATI -->
        <div class="bg-[#0b1120] p-3 rounded-xl border border-amber-500/40 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-amber-400">1. Tavsiye Edilen Fiyat</div>
          <div class="text-[11px] font-black text-white">🎯 Sistem Önerilen Fiyatı</div>
          <div class="text-base font-black text-amber-300 font-mono">${PriceCalculator.formatTL(recPrice)}</div>
          <p class="text-[10px] text-slate-400 leading-tight">Sistemimizin kârlı satış yapmanız için önerdiği tavsiye Katman 1 satış fiyatı</p>
        </div>

        <!-- 2. İNTERNETTEKİ CANLI SATIŞ FİYATIMIZ -->
        <div class="bg-[#0b1120] p-3 rounded-xl border ${channel === 'trendyol' ? 'border-orange-500/40' : 'border-sky-500/40'} text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold ${channel === 'trendyol' ? 'text-orange-400' : 'text-sky-400'}">2. İnternet Satışımız</div>
          <div class="text-[11px] font-black text-white">🛒 ${channelName} Canlı Fiyatı</div>
          <div class="text-base font-black ${channel === 'trendyol' ? 'text-orange-300' : 'text-sky-300'} font-mono">${hasLivePrice ? PriceCalculator.formatTL(livePrice) : '⚪ Canlı Fiyat Yok'}</div>
          <p class="text-[10px] text-slate-400 leading-tight">Şu anda müşterinin internette mağazanızdan satın aldığı canlı fiyat</p>
        </div>

        <!-- 3. BİZİM 0 ₺ KÂR MALİYETİMİZ (BAŞA BAŞ DİP MALİYET) -->
        <div class="bg-[#0b1120] p-3 rounded-xl border border-slate-700 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-slate-300">3. Başa Baş Dip Maliyet</div>
          <div class="text-[11px] font-black text-white">🏁 0 ₺ Kâr Üretim Maliyetimiz</div>
          <div class="text-base font-black text-slate-100 font-mono">${PriceCalculator.formatTL(calc.effectiveNetCost)}</div>
          <p class="text-[10px] text-slate-400 leading-tight">Hiç kâr etmeden fabrikanın başa baş noktası olan KDV korumalı dip maliyeti</p>
        </div>

      </div>

      <!-- 💰 FİNAL: CANLI SATIŞTAN CEBE KALAN NET KÂR / ZARAR HESABI -->
      <div class="bg-[#0b1120] p-4 rounded-xl border ${netProfit >= 0 ? 'border-emerald-500/50' : 'border-rose-500/50'} space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-black text-xs text-white">📊 İNTERNET SATIŞINDAN CEBİNİZE KALAN NET KÂR HESABI:</span>
          <span class="text-xs font-black px-2.5 py-1 rounded ${isAbove ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'}">
            ${isAbove ? '▲ Sistem Önerisi Üstünde' : '▼ Sistem Önerisinden Düşük'}
          </span>
        </div>

        <div class="p-3 bg-[#080d1a] rounded-lg text-xs space-y-1.5 border border-slate-800 font-sans">
          <div class="flex justify-between items-center text-slate-300">
            <span>🛒 1. İnternet Canlı Satış Fiyatı (Müşterinin Ödediği):</span>
            <span class="font-bold text-white font-mono">${PriceCalculator.formatTL(livePrice)}</span>
          </div>
          <div class="flex justify-between items-center text-rose-400">
            <span>📉 2. Pazaryeri Kesintisi (Komisyon %${commRate} + Kargo):</span>
            <span class="font-bold font-mono">-${PriceCalculator.formatTL(commAmt + cargoFee)}</span>
          </div>
          <div class="flex justify-between items-center text-amber-300 font-extrabold border-t border-slate-800 pt-1">
            <span>➡ Banka Hesabınıza Yatan Net Hakediş:</span>
            <span class="font-mono">${PriceCalculator.formatTL(payout)}</span>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span>🏁 3. Çıkarılan 0 ₺ Kâr Üretim Maliyetimiz (Katman 2):</span>
            <span class="font-bold font-mono text-slate-200">-${PriceCalculator.formatTL(calc.effectiveNetCost)}</span>
          </div>
          <div class="flex justify-between items-center text-sm font-black pt-2.5 border-t border-slate-800">
            <span class="text-white">💰 NET KÂR / ZARAR SONUCUNUZ:</span>
            <span class="${netProfit >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'} text-base font-mono">
              ${netProfit >= 0 ? '▲ +' + PriceCalculator.formatTL(netProfit) + ' KÂR' : '▼ ' + PriceCalculator.formatTL(netProfit) + ' ZARAR'}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-800">
        <a href="${siteUrl}" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-amber-400 border border-slate-700 transition-all font-bold text-xs inline-flex items-center gap-1.5">
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

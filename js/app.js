// CanFiyat Portal Main Application Logic (v1.13) - Ultra Compact Dropdown & Fit-on-Screen Layout

let currentProducts = {};
let currentLayerMode = 1; // 1: SatÄ±ÅŸ & KÃ¢rlÄ±lÄ±k, 2: Saf Ãœretim Maliyeti
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
  { key: "10ml", label: "10 ml (UÃ§ucu)", price: "5.50 â‚º" },
  { key: "20ml", label: "20 ml", price: "6.00 â‚º" },
  { key: "30ml", label: "30 ml", price: "6.75 â‚º" },
  { key: "50ml", label: "50 ml", price: "7.25 â‚º" },
  { key: "100ml", label: "100 ml", price: "8.35 â‚º" },
  { key: "150ml", label: "150 ml", price: "10.00 â‚º" },
  { key: "250ml", label: "250 ml", price: "14.50 â‚º" },
  { key: "300ml", label: "300 ml", price: "18.00 â‚º" },
  { key: "500ml", label: "500 ml", price: "25.00 â‚º" },
  { key: "1000ml", label: "1000 ml (1kg)", price: "35.00 â‚º" },
  { key: "5000ml", label: "5000 ml (5kg)", price: "120.00 â‚º" }
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
  showToast("GiriÅŸ YapÄ±ldÄ±! HoÅŸ Geldiniz. ğŸ”’âœ…");
}

function handleLogout() {
  StorageManager.logout();
  checkAuthSession();
  showToast("Oturum KapatÄ±ldÄ±. GÃ¼venli Ã‡Ä±kÄ±ÅŸ SaÄŸlandÄ±. ğŸšª");
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
  let productsArr = Object.values(currentProducts || {});
  if (productsArr.length === 0 && typeof INITIAL_PRODUCTS !== "undefined") {
    productsArr = INITIAL_PRODUCTS;
  }
  const totalCount = productsArr.length;
  const ucucuCount = productsArr.filter(p => p && p.category === "UÃ§ucu YaÄŸlar").length;
  const sabitCount = productsArr.filter(p => p && p.category === "Sabit YaÄŸlar").length;

  if (document.getElementById("stat-total-count")) document.getElementById("stat-total-count").innerText = totalCount;
  if (document.getElementById("stat-ucucu-count")) document.getElementById("stat-ucucu-count").innerText = ucucuCount;
  if (document.getElementById("stat-sabit-count")) document.getElementById("stat-sabit-count").innerText = sabitCount;

  // Dynamically update category filter tab buttons
  const btnAll = document.getElementById("cat-tab-all");
  if (btnAll) btnAll.innerHTML = `TÃ¼m ÃœrÃ¼nler (${totalCount})`;

  const btnUcucu = document.getElementById("cat-tab-UÃ§ucu YaÄŸlar");
  if (btnUcucu) btnUcucu.innerHTML = `ğŸŒ¿ UÃ§ucu YaÄŸlar (${ucucuCount})`;

  const btnSabit = document.getElementById("cat-tab-Sabit YaÄŸlar");
  if (btnSabit) btnSabit.innerHTML = `ğŸŒ» Sabit YaÄŸlar (${sabitCount})`;
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


function sortProductsByCategoryAndName(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice().sort((a, b) => {
    const catOrder = { "UÃ§ucu YaÄŸlar": 1, "Sabit YaÄŸlar": 2 };
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
        <p class="text-xs font-medium">AramanÄ±za uygun CansÄ±zzade Ã¼rÃ¼nÃ¼ bulunamadÄ±.</p>
        <button onclick="clearSearch()" class="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg">AramayÄ± Temizle</button>
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
      const mainVol = product.activeVolume || (product.category === "UÃ§ucu YaÄŸlar" ? "50ml" : "250ml");
      const volConfig = getVolumeConfig(product, mainVol);
      const packCost = volConfig?.packagingCost ?? (DEFAULT_PACKAGING_COSTS[mainVol] || 14.50);
      const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg || 1200, mainVol, packCost);
      const targetProfitVal = (volConfig?.targetProfit !== undefined && volConfig?.targetProfit !== null) ? volConfig.targetProfit : 70;
      
      const tyResult = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: unitCost,
        targetProfit: targetProfitVal,
        commission: volConfig?.channels?.trendyol?.commission || 19,
        discount: volConfig?.channels?.trendyol?.discount || 0,
        cargo: volConfig?.channels?.trendyol?.cargo || 110
      });

      const breakEvenTy = PriceCalculator.calculateBreakEvenPrice({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: unitCost,
        commission: volConfig?.channels?.trendyol?.commission || 19,
        cargo: volConfig?.channels?.trendyol?.cargo || 110
      });

    const isUcucu = product.category === "UÃ§ucu YaÄŸlar";
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
              <span class="text-emerald-400 font-extrabold">%${product.kdv || (isUcucu ? 20 : 1)} KDV DAHÄ°L</span>
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
                ğŸ”´ Dip SatÄ±ÅŸ FiyatÄ± (0 â‚º KÃ¢r)
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
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Hedef KÃ¢r
            </span>
            <span class="font-bold text-emerald-400 text-xs">+${PriceCalculator.formatTL(volConfig.targetProfit ?? 0)}</span>
          </div>

          <div class="min-w-[160px]">
            <button onclick="openProductSlot('${product.id}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-xl shadow text-xs flex items-center justify-center gap-1.5 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              AYARLARI AÃ‡
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
                <span class="text-slate-400 block text-[9px] uppercase font-bold">1KG Toptan SatÄ±ÅŸ FiyatÄ±</span>
                <span class="font-black text-emerald-300 text-sm">${PriceCalculator.formatTL(product.costPerKg)}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 block">
                  âœ“ %${product.kdv || (isUcucu ? 20 : 1)} KDV DAHÄ°L
                </span>
                <span class="text-[9px] text-slate-500 block mt-0.5">Faturada Net: ${PriceCalculator.formatTL(product.rawNetCostPerKg || parseFloat((product.costPerKg / (1 + ((product.kdv || (isUcucu ? 20 : 1)) / 100))).toFixed(2)))}</span>
              </div>
            </div>

            ${showRedLineFloor ? `
              <div class="bg-rose-950/90 p-2.5 rounded-xl border border-rose-600/60 space-y-1 my-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-rose-300 font-extrabold text-[10px] uppercase">ğŸ”´ Trendyol Dip Fiyat:</span>
                  <span class="font-black text-rose-200 text-xs">${PriceCalculator.formatTL(breakEvenTy.breakEvenPrice)}</span>
                </div>
                <div class="text-[9px] text-rose-400 font-medium text-center">Bu FiyatÄ±n AltÄ± ZarardÄ±r! (0 â‚º KÃ¢r)</div>
              </div>
            ` : ''}

            <div class="space-y-1 text-xs my-2">
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1 text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Trendyol:</span>
                <span class="font-bold text-white text-xs">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1 text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Net KÃ¢r:</span>
                <span class="font-bold text-emerald-400 text-xs">+${PriceCalculator.formatTL(volConfig.targetProfit ?? 0)}</span>
              </div>
            </div>
          </div>

          <button onclick="openProductSlot('${product.id}')" class="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg shadow text-xs flex items-center justify-center gap-1.5 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            AYARLARI AÃ‡
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
  const name = document.getElementById("add-custom-name").value.trim() || "Ã–zel ÃœrÃ¼n";
  const category = document.getElementById("add-custom-category").value;
  const costKg = parseFloat(document.getElementById("add-custom-cost-kg").value) || 1000;
  const kdv = parseFloat(document.getElementById("add-custom-kdv").value) || 20;

  const defaultVol = category === "UÃ§ucu YaÄŸlar" ? "50ml" : "250ml";

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

  showToast(`Yeni ÃœrÃ¼n KartÄ± Eklendi: ${name} âœ…`);
  openProductSlot(sku);
}

// ==========================================
// MODAL WORKSPACE & DROPDOWN VOLUME LOGIC
// ==========================================
function openProductSlot(productId) {
  selectedProductId = productId;
  const product = currentProducts[productId];
  if (!product) return;

  activeVolume = product.activeVolume || (product.category === "UÃ§ucu YaÄŸlar" ? "50ml" : "250ml");

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
  const s1TyRes = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: unitCost,
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
  const defaultAvPrice = parseFloat((baseTyPrice * 0.90).toFixed(2));  // ğŸŸ¢ 1. AvantajlÄ± %10 indirimli teklif
  const defaultCakPrice = parseFloat((baseTyPrice * 0.82).toFixed(2)); // ğŸŸ¡ 2. Ã‡ok AvantajlÄ± %18 indirimli teklif
  const defaultSupPrice = parseFloat((baseTyPrice * 0.70).toFixed(2)); // ğŸ”´ 3. SÃ¼per AvantajlÄ± %30 indirimli teklif

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

  const costPerKg = getModalCostPerKg();
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;

  const unitCost = PriceCalculator.calculateUnitWholesaleCost(costPerKg, activeVolume, packagingCost);
  document.getElementById("calculated-unit-cost").innerText = PriceCalculator.formatTL(unitCost);

  const tyInput = { salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_ty").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_ty").value) || 0,
    cargo: parseFloat(document.getElementById('s1_kargo_ty').value) || 110, salesVatRate: 20
  };

  const hbInput = { salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_hb").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_hb").value) || 0,
    cargo: parseFloat(document.getElementById('s1_kargo_hb').value) || 110, salesVatRate: 20
  };

  const iyInput = { salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_iy").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_iy").value) || 0,
    cargo: parseFloat(document.getElementById('s1_kargo_iy').value) || 110, salesVatRate: 20
  };

  const tyRes = PriceCalculator.calculateSystem1Channel(tyInput);
  const hbRes = PriceCalculator.calculateSystem1Channel(hbInput);
  const iyRes = PriceCalculator.calculateSystem1Channel(iyInput);

  document.getElementById("s1_list_ty").innerText = PriceCalculator.formatTL(tyRes.listPrice);
  document.getElementById("s1_sale_ty").innerText = `Ä°ndirimli: ${PriceCalculator.formatTL(tyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_ty").innerText = PriceCalculator.formatTL(tyRes.salePrice);
  document.getElementById("s1_rec_kargo_ty").innerText = `-${PriceCalculator.formatTL(tyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_ty").innerText = `-${PriceCalculator.formatTL(tyRes.commAmount)}`;
  document.getElementById("s1_hakedis_ty").innerText = PriceCalculator.formatTL(tyRes.payout);
  document.getElementById("s1_rec_maliyet_ty").innerText = `-${PriceCalculator.formatTL(tyRes.wholesaleCost)}`;
  if(document.getElementById("s1_kdv_ty")) {
    document.getElementById("s1_kdv_ty").innerText = (tyRes.netVatImpact > 0 ? "-" : "+") + PriceCalculator.formatTL(Math.abs(tyRes.netVatImpact || 0));
    document.getElementById("s1_kdv_ty").className = "val font-semibold text-[10px] " + (tyRes.netVatImpact > 0 ? "text-rose-400" : "text-emerald-400");
  }
  document.getElementById("s1_profit_ty").innerText = PriceCalculator.formatTL(tyRes.netProfit);

  document.getElementById("s1_list_hb").innerText = PriceCalculator.formatTL(hbRes.listPrice);
  document.getElementById("s1_sale_hb").innerText = `Ä°ndirimli: ${PriceCalculator.formatTL(hbRes.salePrice)}`;
  document.getElementById("s1_rec_sale_hb").innerText = PriceCalculator.formatTL(hbRes.salePrice);
  document.getElementById("s1_rec_kargo_hb").innerText = `-${PriceCalculator.formatTL(hbRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_hb").innerText = `-${PriceCalculator.formatTL(hbRes.commAmount)}`;
  document.getElementById("s1_hakedis_hb").innerText = PriceCalculator.formatTL(hbRes.payout);
  document.getElementById("s1_rec_maliyet_hb").innerText = `-${PriceCalculator.formatTL(hbRes.wholesaleCost)}`;
  if(document.getElementById("s1_kdv_hb")) {
    document.getElementById("s1_kdv_hb").innerText = (hbRes.netVatImpact > 0 ? "-" : "+") + PriceCalculator.formatTL(Math.abs(hbRes.netVatImpact || 0));
    document.getElementById("s1_kdv_hb").className = "val font-semibold text-[10px] " + (hbRes.netVatImpact > 0 ? "text-rose-400" : "text-emerald-400");
  }
  document.getElementById("s1_profit_hb").innerText = PriceCalculator.formatTL(hbRes.netProfit);

  document.getElementById("s1_list_iy").innerText = PriceCalculator.formatTL(iyRes.listPrice);
  document.getElementById("s1_sale_iy").innerText = `Ä°ndirimli: ${PriceCalculator.formatTL(iyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_iy").innerText = PriceCalculator.formatTL(iyRes.salePrice);
  document.getElementById("s1_rec_kargo_iy").innerText = `-${PriceCalculator.formatTL(iyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_iy").innerText = `-${PriceCalculator.formatTL(iyRes.commAmount)}`;
  document.getElementById("s1_hakedis_iy").innerText = PriceCalculator.formatTL(iyRes.payout);
  document.getElementById("s1_rec_maliyet_iy").innerText = `-${PriceCalculator.formatTL(iyRes.wholesaleCost)}`;
  if(document.getElementById("s1_kdv_iy")) {
    document.getElementById("s1_kdv_iy").innerText = (iyRes.netVatImpact > 0 ? "-" : "+") + PriceCalculator.formatTL(Math.abs(iyRes.netVatImpact || 0));
    document.getElementById("s1_kdv_iy").className = "val font-semibold text-[10px] " + (iyRes.netVatImpact > 0 ? "text-rose-400" : "text-emerald-400");
  }
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
    tycargo: parseFloat(document.getElementById('s1_kargo_ty').value) || 110, salesVatRate: 20,
    hbComm: parseFloat(document.getElementById("s1_comm_hb").value) || 17,
    hbcargo: parseFloat(document.getElementById('s1_kargo_hb').value) || 110, salesVatRate: 20
  });

  document.getElementById("s2_web_profit_display").innerText = PriceCalculator.formatTL(s2Res.webProfit);
  document.getElementById("s2_ty_eq_price").innerText = PriceCalculator.formatTL(s2Res.tyEquivalentList);
  document.getElementById("s2_ty_payout").innerText = `EÅŸdeÄŸer HakediÅŸ: ${PriceCalculator.formatTL(s2Res.tyPayout)}`;

  document.getElementById("s2_hb_eq_price").innerText = PriceCalculator.formatTL(s2Res.hbEquivalentList);
  document.getElementById("s2_hb_payout").innerText = `EÅŸdeÄŸer HakediÅŸ: ${PriceCalculator.formatTL(s2Res.hbPayout)}`;
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

  // 1. AvantajlÄ±
  const priceAv = parseFloat(document.getElementById("s5_price_av").value) || 0;
  const commAv = parseFloat(document.getElementById("s5_comm_av").value) || 15;
  const commAmtAv = priceAv * (commAv / 100);
  const payoutAv = priceAv - commAmtAv - cargo;
  const profitAv = payoutAv - unitCost;

  // 2. Ã‡ok AvantajlÄ±
  const priceCak = parseFloat(document.getElementById("s5_price_cak").value) || 0;
  const commCak = parseFloat(document.getElementById("s5_comm_cak").value) || 14.6;
  const commAmtCak = priceCak * (commCak / 100);
  const payoutCak = priceCak - commAmtCak - cargo;
  const profitCak = payoutCak - unitCost;

  // 3. SÃ¼per AvantajlÄ±
  const priceSup = parseFloat(document.getElementById("s5_price_sup").value) || 0;
  const commSup = parseFloat(document.getElementById("s5_comm_sup").value) || 12.5;
  const commAmtSup = priceSup * (commSup / 100);
  const payoutSup = priceSup - commAmtSup - cargo;
  const profitSup = payoutSup - unitCost;

  // Render AvantajlÄ± Card
  document.getElementById("s5_res_comm_av").innerText = `-${PriceCalculator.formatTL(commAmtAv)}`;
  document.getElementById("s5_res_cargo_av").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_av").innerText = PriceCalculator.formatTL(payoutAv);
  document.getElementById("s5_res_cost_av").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  const elProfAv = document.getElementById("s5_res_profit_av");
  if (profitAv < 0) {
    elProfAv.className = "val font-black text-rose-400 text-xs";
    elProfAv.innerText = `âš ï¸ ZARAR ${PriceCalculator.formatTL(profitAv)}`;
  } else {
    elProfAv.className = "val font-black text-emerald-400 text-xs";
    elProfAv.innerText = `+${PriceCalculator.formatTL(profitAv)}`;
  }

  // Render Ã‡ok AvantajlÄ± Card
  document.getElementById("s5_res_comm_cak").innerText = `-${PriceCalculator.formatTL(commAmtCak)}`;
  document.getElementById("s5_res_cargo_cak").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_cak").innerText = PriceCalculator.formatTL(payoutCak);
  document.getElementById("s5_res_cost_cak").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  const elProfCak = document.getElementById("s5_res_profit_cak");
  if (profitCak < 0) {
    elProfCak.className = "val font-black text-rose-400 text-xs";
    elProfCak.innerText = `âš ï¸ ZARAR ${PriceCalculator.formatTL(profitCak)}`;
  } else {
    elProfCak.className = "val font-black text-emerald-400 text-xs";
    elProfCak.innerText = `+${PriceCalculator.formatTL(profitCak)}`;
  }

  // Render SÃ¼per AvantajlÄ± Card
  document.getElementById("s5_res_comm_sup").innerText = `-${PriceCalculator.formatTL(commAmtSup)}`;
  document.getElementById("s5_res_cargo_sup").innerText = `-${PriceCalculator.formatTL(cargo)}`;
  document.getElementById("s5_res_payout_sup").innerText = PriceCalculator.formatTL(payoutSup);
  document.getElementById("s5_res_cost_sup").innerText = `-${PriceCalculator.formatTL(unitCost)}`;
  const elProfSup = document.getElementById("s5_res_profit_sup");
  if (profitSup < 0) {
    elProfSup.className = "val font-black text-rose-400 text-xs";
    elProfSup.innerText = `âš ï¸ ZARAR ${PriceCalculator.formatTL(profitSup)}`;
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
  const kdvRate = product.kdv || (product.category === "UÃ§ucu YaÄŸlar" ? 20 : 1);

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

  showToast(`âœ… ${product.name} Katman 1 FiyatÄ± ve AyarlarÄ± BaÅŸarÄ±yla GÃ¼ncellendi!`);
  closeProductSlot();
}

function resetCatalog() {
  if (confirm("TÃ¼m Ã¼rÃ¼n slot ayarlarÄ±nÄ±zÄ± fabrika varsayÄ±lanlarÄ±na sÄ±fÄ±rlamak istediÄŸinize emin misiniz?")) {
    currentProducts = StorageManager.resetToDefault();
    renderProductGrid();
    renderStats();
    showToast("ÃœrÃ¼n KataloÄŸu Fabrika AyarlarÄ±na SÄ±fÄ±rlandÄ± ğŸ”„");
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
// LAYER 2: SAF ÃœRETÄ°M MALÄ°YETÄ° & FABRÄ°KA GÄ°DER MÄ°MARÄ°SÄ°
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

  if (badge1) { badge1.className = inactiveBadgeClass; badge1.innerText = "KATMANA GEÃ‡"; }
  if (badge2) { badge2.className = inactiveBadgeClass; badge2.innerText = "KATMANA GEÃ‡"; }
  if (badge3) { badge3.className = inactiveBadgeClass; badge3.innerText = "KATMANA GEÃ‡"; }

  if (mode === 1) {
    if (btn1) btn1.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white border border-blue-400/60 shadow-md shadow-blue-500/15";
    if (dot1) dot1.className = "w-2.5 h-2.5 rounded-full bg-blue-200 shrink-0";
    if (badge1) { badge1.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-950 text-blue-200 border border-blue-400/50 shrink-0"; badge1.innerText = "âœ“ SEÃ‡Ä°LÄ° KATMAN"; }

    if (view1) view1.classList.remove("hidden");
    if (view2) view2.classList.add("hidden");
    if (view3) view3.classList.add("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    renderProductGrid();
  } else if (mode === 2) {
    // 2. KATMAN: ZÃœMRÃœT YEÅÄ°L TEMA
    if (btn2) btn2.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white border border-emerald-400/60 shadow-md shadow-emerald-500/15";
    if (dot2) dot2.className = "w-2.5 h-2.5 rounded-full bg-emerald-200 shrink-0";
    if (badge2) { badge2.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-200 border border-emerald-400/50 shrink-0"; badge2.innerText = "âœ“ SEÃ‡Ä°LÄ° KATMAN"; }

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
    // 3. KATMAN: ASÄ°L MOR TEMA
    if (btn3) btn3.className = "layer-tab-btn px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-between transition-all duration-300 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white border border-purple-400/60 shadow-md shadow-purple-500/15";
    if (dot3) dot3.className = "w-2.5 h-2.5 rounded-full bg-purple-200 shrink-0";
    if (badge3) { badge3.className = "text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-950 text-purple-200 border border-purple-400/50 shrink-0"; badge3.innerText = "âœ“ SEÃ‡Ä°LÄ° KATMAN"; }

    if (view1) view1.classList.add("hidden");
    if (view2) view2.classList.add("hidden");
    if (view3) view3.classList.remove("hidden");
    if (btnOverhead) btnOverhead.classList.add("hidden");

    renderLayer3Cards();
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
  if (currentLayerMode === 3) {
    toggleLayer3DipFiyatMode();
  } else {
    toggleRedLineFloor();
  }
}

function updateTopDipFiyatBtnState() {
  const btnTop = document.getElementById("btn-toggle-redline");
  if (!btnTop) return;

  if (currentLayerMode === 3) {
    if (isLayer3DipFiyatMode) {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 text-white border border-rose-400 shadow-lg shadow-rose-600/40 flex items-center gap-1 cursor-pointer animate-pulse";
      btnTop.innerHTML = "ğŸŸ¢ Dip Fiyat (0 â‚º KÃ¢r)";
    } else {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-slate-900 text-rose-400 border border-rose-900/60 hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer";
      btnTop.innerHTML = "ğŸ”´ Dip Fiyat";
    }
  } else {
    if (showRedLineFloor) {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-rose-600 text-white border border-rose-400 shadow-lg shadow-rose-600/30 flex items-center gap-1 cursor-pointer";
      btnTop.innerHTML = "ğŸ”´ Dip Fiyat (AÃ‡IK)";
    } else {
      btnTop.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-slate-900 text-rose-400 border border-rose-900/60 hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer";
      btnTop.innerHTML = "ğŸ”´ Dip Fiyat";
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
      badge.innerHTML = "ğŸ§¡ Trendyol CanlÄ± MaÄŸaza Modu";
      badge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800/80 shadow-md";
    }
    if (btnIyzico) btnIyzico.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white cursor-pointer";
    if (btnTrendyol) btnTrendyol.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-lg shadow-orange-600/30 border border-orange-300/40 flex items-center gap-1.5 cursor-pointer";
    if (btnPdf) {
      btnPdf.innerHTML = "ğŸ“„ TRENDYOL KARÅILAÅTIRMA PDF AL";
      btnPdf.className = "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 text-xs border border-orange-300/50 cursor-pointer";
    }
    if (btnExcel) btnExcel.classList.remove("hidden");
  } else {
    if (banner) {
      banner.className = "glass-card rounded-2xl p-4 border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl transition-all";
    }
    if (badge) {
      badge.innerHTML = "ğŸŒ iyzico CanlÄ± Sitede";
      badge.className = "text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50";
    }
    if (btnIyzico) btnIyzico.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer";
    if (btnTrendyol) btnTrendyol.className = "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all text-slate-400 hover:text-white cursor-pointer";
    if (btnPdf) {
      btnPdf.innerHTML = "ğŸ“„ Ä°YZÄ°CO KARÅILAÅTIRMA PDF AL";
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
    alert("LÃ¼tfen Excel'den kopyaladÄ±ÄŸÄ±nÄ±z tablo verilerini yapÄ±ÅŸtÄ±rÄ±n.");
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
    alert(`Tebrikler! ${parsedItems.length} adet Trendyol Ã¼rÃ¼n fiyatÄ± sisteme aktarÄ±ldÄ± ve gÃ¼ncellendi.`);
    closeTrendyolExcelModal();
    setLayer3Channel("trendyol");
  } else {
    alert("GeÃ§erli Ã¼rÃ¼n verisi tespit edilemedi. LÃ¼tfen kopyaladÄ±ÄŸÄ±nÄ±z Excel sÃ¼tunlarÄ±nÄ± kontrol edin.");
  }
}

function normalizeTr(str) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/[ÄŸÄ]/g, "g")
    .replace(/[Ä±Ä°I]/g, "i")
    .replace(/[Ã¶Ã–]/g, "o")
    .replace(/[Ã¼Ãœ]/g, "u")
    .replace(/[ÅŸÅ]/g, "s")
    .replace(/[Ã§Ã‡]/g, "c")
    .replace(/yagyi|yagi|yayi|yaÄŸ|yag/g, "yag")
    .trim();
}

function getTrendyolFilteredCatalog() {
  if (typeof TRENDYOL_PRODUCTS_DATA === "undefined" || !Array.isArray(TRENDYOL_PRODUCTS_DATA)) return [];
  const storedCustom = StorageManager.getTrendyolCustomProducts();
  const catalog = (storedCustom && storedCustom.length > 0) ? storedCustom : TRENDYOL_PRODUCTS_DATA;
  
  // User Directive: Purge Endora products completely & keep ONLY CansÄ±zzade products
  return catalog.filter(item => {
    if (!item || !item.title) return false;
    const t = item.title.toLowerCase();
    const u = (item.url || "").toLowerCase();

    // 1. Must NOT contain "endora" in title or URL
    if (t.includes("endora") || u.includes("endora")) return false;

    // 2. Must contain "cansizzade" or "cansÄ±zzade" in title or URL (or 100% doÄŸallÄ±k kalÄ±bÄ±)
    const isCansizzade = t.includes("cansizzade") || t.includes("cansÄ±zzade") || u.includes("cansizzade") || t.includes("%100 dogal") || t.includes("%100 doÄŸal");
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
  const isEssential = prodMerged.category === "UÃ§ucu YaÄŸlar";
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

function renderLayer3Cards() {
  const container = document.getElementById("layer3-product-grid");
  if (!container) return;
  container.innerHTML = "";

  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  const dynamicOverheadPerKg = overheadRes.overheadPerKg;

  const selectedGlobalVol = document.getElementById("l3-global-vol-filter") ? document.getElementById("l3-global-vol-filter").value : "250ml";
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
  if (btnIyzico) btnIyzico.innerHTML = `ğŸŒ iyzico (${iyzicoMatchCount} ÃœrÃ¼n)`;

  const btnTrendyol = document.getElementById("btn-l3-channel-trendyol");
  if (btnTrendyol) btnTrendyol.innerHTML = `ğŸ§¡ Trendyol (${tyMatchCount} ÃœrÃ¼n)`;

  // Build Unified Products List for Katman 3
  let displayList = [];

  if (currentLayer3Channel === "trendyol") {
    // Process internal products matched to Trendyol
    productsArr.forEach(prod => {
      if (!prod || !prod.name) return;
      if (activeCategory !== "all" && prod.category !== activeCategory) return;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(prod.name || "").toLowerCase().includes(q) && !(prod.sku || "").toLowerCase().includes(q)) return;
      }

      // Check if product has any matching volume in Trendyol
      let hasAnyTyMatch = false;
      ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"].forEach(vk => {
        const m = findTrendyolProduct(prod.name, vk);
        if (m && m.price > 0) {
          hasAnyTyMatch = true;
        }
      });

      if (hasAnyTyMatch) {
        displayList.push(prod);
      }
    });
  } else {
    // iyzico channel: only list internal products that have site prices
    productsArr.forEach(prod => {
      if (!prod || !prod.name) return;
      if (activeCategory !== "all" && prod.category !== activeCategory) return;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(prod.name || "").toLowerCase().includes(q) && !(prod.sku || "").toLowerCase().includes(q)) return;
      }

      const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[prod.id] : null;
      const hasAnyVolPrice = ["10ml", "20ml", "30ml", "50ml", "100ml", "150ml", "250ml", "500ml", "1000ml", "5000ml"].some(vk => {
        const ov = StorageManager.getSiteOverride(prod.id, vk);
        if (ov !== null && !isNaN(parseFloat(ov)) && parseFloat(ov) > 0) return true;
        if (siteData && siteData.samplePrices && typeof siteData.samplePrices[vk] === "number" && siteData.samplePrices[vk] > 0) return true;
        return false;
      });

      if (hasAnyVolPrice) {
        displayList.push(prod);
      }
    });
  }

  const sortedDisplayList = sortProductsByCategoryAndName(displayList);

  sortedDisplayList.forEach(product => {
    // Process regular matched products
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

    // User Directive: Default to 1000ml / 1KG, if not available select the highest volume size!
    let defaultVolKey = "1000ml";
    if (availableVols.length > 0) {
      if (availableVols.includes("1000ml")) {
        defaultVolKey = "1000ml";
      } else {
        const priorityOrder = ["1000ml", "5000ml", "500ml", "250ml", "150ml", "100ml", "50ml", "30ml", "20ml", "10ml"];
        defaultVolKey = priorityOrder.find(v => availableVols.includes(v)) || availableVols[0];
      }
    }

    // Force active volume to be one of the available volumes if currently set volume is not available!
    let activeVolKey = cardActiveVolumes[product.id];
    if (!activeVolKey || !availableVols.includes(activeVolKey)) {
      activeVolKey = defaultVolKey;
    }
    cardActiveVolumes[product.id] = activeVolKey;

    // --- Dynamic Katman 1 Recommended Price & Effective Net Cost Calculation ---
    const activeCalc = getLayer2EffectiveCostForVolume(product, activeVolKey, dynamicOverheadPerKg);
    const activeEffectiveNetCost = activeCalc.effectiveNetCost;
    const activeTargetProfit = isLayer3DipFiyatMode ? 0 : activeCalc.targetProfit;

    let systemRecommendedPrice = 0;
    if (currentLayer3Channel === "trendyol") {
      const sys1Ty = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: activeEffectiveNetCost,
        targetProfit: activeTargetProfit,
        commission: 19,
        cargo: 110
      });
      systemRecommendedPrice = sys1Ty.salePrice;
    } else {
      const sys1Iy = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: activeEffectiveNetCost,
        targetProfit: activeTargetProfit,
        commission: 4,
        cargo: 82.50
      });
      systemRecommendedPrice = sys1Iy.salePrice;
    }

    const overridePrice = StorageManager.getSiteOverride(product.id, activeVolKey);
    const siteData = (typeof LIVE_SITE_SCRAPED_DATA !== "undefined") ? LIVE_SITE_SCRAPED_DATA[product.id] : null;

    let activeLivePrice = null;
    let siteUrl = `https://www.cansizzadeyag.com/`;

    if (currentLayer3Channel === "trendyol") {
      const tyMatch = findTrendyolProduct(product.name, activeVolKey);
      if (tyMatch && tyMatch.price > 0) {
        activeLivePrice = tyMatch.price;
        if (tyMatch.url) siteUrl = tyMatch.url;
      }
    } else {
      if (overridePrice !== null && !isNaN(parseFloat(overridePrice))) {
        activeLivePrice = parseFloat(overridePrice);
      } else if (siteData && siteData.samplePrices && (typeof siteData.samplePrices[activeVolKey] === "number") && siteData.samplePrices[activeVolKey] > 0) {
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
      const livePrice = activeLivePrice;
      let netProfitMargin = 0;

      if (currentLayer3Channel === "trendyol") {
        const payout = livePrice * (1 - 0.19) - 110;
        netProfitMargin = parseFloat((payout - activeEffectiveNetCost).toFixed(2));
      } else {
        const payout = livePrice * (1 - 0.04) - 82.50;
        netProfitMargin = parseFloat((payout - activeEffectiveNetCost).toFixed(2));
      }

      if (netProfitMargin >= 0) {
        netProfitMarginHtml = `<span class="font-black text-emerald-400 text-xs">+${PriceCalculator.formatTL(netProfitMargin)} â‚º</span>`;
      } else {
        netProfitMarginHtml = `<span class="font-black text-red-400 text-xs">${PriceCalculator.formatTL(netProfitMargin)} â‚º</span>`;
      }
    }

    const isUcucu = product.category === "UÃ§ucu YaÄŸlar";
    const catBadge = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    const isExpanded = expandedCards[product.id] || false;

    // Accordion Table HTML for ALL Available Volumes
    let accordionHtml = "";
    if (isExpanded) {
      let rowsHtml = "";
      availableVols.forEach(vKey => {
        const vCalc = getLayer2EffectiveCostForVolume(product, vKey, dynamicOverheadPerKg);
        const vEffectiveNetCost = vCalc.effectiveNetCost;
        const vTargetProfit = isLayer3DipFiyatMode ? 0 : vCalc.targetProfit;

        let vRecommendedPrice = 0;
        if (currentLayer3Channel === "trendyol") {
          const sys1Ty = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: vEffectiveNetCost,
            targetProfit: vTargetProfit,
            commission: 19,
            cargo: 110
          });
          vRecommendedPrice = sys1Ty.salePrice;
        } else {
          const sys1Iy = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: vEffectiveNetCost,
            targetProfit: vTargetProfit,
            commission: 4,
            cargo: 82.50
          });
          vRecommendedPrice = sys1Iy.salePrice;
        }

        let vLivePrice = null;
        let vRowUrl = siteUrl;
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
        let vNetMarginHtml = `<span class="text-slate-500 font-bold">N/A</span>`;
        let vPriceDiffBadge = `<span class="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono">âšª CanlÄ± Yok</span>`;

        if (vHasPrice) {
          let vMargin = 0;
          if (currentLayer3Channel === "trendyol") {
            const payout = vLivePrice * (1 - 0.19) - 110;
            vMargin = parseFloat((payout - vEffectiveNetCost).toFixed(2));
          } else {
            const payout = vLivePrice * (1 - 0.04) - 82.50;
            vMargin = parseFloat((payout - vEffectiveNetCost).toFixed(2));
          }

          if (vMargin >= 0) {
            vNetMarginHtml = `<span class="text-emerald-400 font-black">+${PriceCalculator.formatTL(vMargin)} â‚º</span>`;
          } else {
            vNetMarginHtml = `<span class="text-red-400 font-black">${PriceCalculator.formatTL(vMargin)} â‚º</span>`;
          }

          const priceDiff = vLivePrice - vRecommendedPrice;
          if (priceDiff >= 0) {
            vPriceDiffBadge = `
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-extrabold" title="CanlÄ± fiyatÄ±nÄ±z Katman 1 Ã–nerilen FiyatÄ±nÄ±n +${PriceCalculator.formatTL(priceDiff)} â‚º Ã¼zerinde">â–² Ã–nerilen ÃœstÃ¼nde (+${PriceCalculator.formatTL(priceDiff)} â‚º)</span>
                <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800/80 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net KÃ¢r Hesap DÃ¶kÃ¼mÃ¼ FaturasÄ±">
                  ğŸ§® DÃ¶kÃ¼m
                </button>
              </div>`;
          } else {
            vPriceDiffBadge = `
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded font-extrabold" title="CanlÄ± fiyatÄ±nÄ±z Katman 1 Ã–nerilen FiyatÄ±nÄ±n ${PriceCalculator.formatTL(priceDiff)} â‚º altÄ±nda!">â–¼ Ã–nerilenden DÃ¼ÅŸÃ¼k (${PriceCalculator.formatTL(priceDiff)} â‚º)</span>
                <button onclick="openLayer3CalculationModal('${product.id}', '${vKey}')" class="px-2 py-0.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800/80 text-[10px] font-bold transition-all cursor-pointer shadow-sm" title="${vKey} Net KÃ¢r Hesap DÃ¶kÃ¼mÃ¼ FaturasÄ±">
                  ğŸ§® DÃ¶kÃ¼m
                </button>
              </div>`;
          }
        }

        rowsHtml += `
          <tr class="hover:bg-slate-900/60 transition-colors ${vKey === activeVolKey ? (currentLayer3Channel === 'trendyol' ? 'bg-orange-950/30 font-bold' : 'bg-purple-950/30 font-bold') : ''}">
            <td class="p-2 font-bold text-slate-200 border-b border-slate-800/50">${vKey} ${vKey === activeVolKey ? 'ğŸ“Œ (Ã–n Ä°zlenen)' : ''}</td>
            <td class="p-2 border-b border-slate-800/50 font-black text-amber-300 text-sm">
              ğŸ¯ ${PriceCalculator.formatTL(vRecommendedPrice)} â‚º
            </td>
            <td class="p-2 border-b border-slate-800/50 font-black ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-purple-300'} text-sm">
              <div class="flex items-center gap-1.5">
                <span>${vHasPrice ? PriceCalculator.formatTL(vLivePrice) + ' â‚º' : 'âšª Yok'}</span>
                ${vHasPrice ? `
                  <a href="${vRowUrl}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-amber-600/60 transition-all text-xs inline-flex items-center justify-center shadow-sm" title="${vKey} CanlÄ± MaÄŸaza BaÄŸlantÄ±sÄ±na Git">
                    <svg class="w-3.5 h-3.5 text-amber-400 hover:text-amber-300" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                  </a>
                ` : ''}
              </div>
            </td>
            <td class="p-2 text-slate-300 font-semibold border-b border-slate-800/50">${PriceCalculator.formatTL(vEffectiveNetCost)} â‚º</td>
            <td class="p-2 border-b border-slate-800/50">${vNetMarginHtml}</td>
            <td class="p-2 border-b border-slate-800/50">${vPriceDiffBadge}</td>
          </tr>
        `;
      });

      accordionHtml = `
        <div class="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/90 rounded-xl p-3 animate-fadeIn">
          <div class="text-xs font-bold text-slate-200 mb-2 flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center gap-1.5">ğŸ“Š <span class="text-white font-extrabold">${product.name}</span> - TÃ¼m Ambalaj BoyutlarÄ±nda Katman 1 Ã–nerilen vs CanlÄ± Fiyat KarÅŸÄ±laÅŸtÄ±rmasÄ± (${currentLayer3Channel.toUpperCase()})</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-slate-900/90">
                  <th class="p-2">SatÄ±lan Ambalaj</th>
                  <th class="p-2 ${isLayer3DipFiyatMode ? 'text-rose-300 font-extrabold' : 'text-amber-300'}">${isLayer3DipFiyatMode ? 'ğŸ Katman 1 Dip Fiyat (0 â‚º KÃ¢r)' : 'ğŸ¯ Katman 1 Ã–nerilen Fiyat'}</th>
                  <th class="p-2 ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-purple-300'}">ğŸ›’ ${currentLayer3Channel === 'trendyol' ? 'Trendyol CanlÄ± FiyatÄ±' : 'iyzico CanlÄ± FiyatÄ±'}</th>
                  <th class="p-2 text-slate-300">ğŸ Saf Maliyet</th>
                  <th class="p-2 text-emerald-400">ğŸ’° Net KÃ¢r</th>
                  <th class="p-2">ğŸ“Š KarÅŸÄ±laÅŸtÄ±rma Durumu</th>
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

    const cardTheme = currentLayer3Channel === "trendyol" 
      ? "border-orange-500/30 hover:border-orange-400/80 bg-gradient-to-r from-slate-950 via-slate-900/60 to-slate-950"
      : "border-slate-800/80 hover:border-purple-500/50 bg-gradient-to-r from-slate-950 via-slate-900/60 to-slate-950";

    const cardHtml = `
      <div class="glass-card rounded-xl p-3 border ${cardTheme} transition-all shadow-md group flex flex-col gap-2">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <!-- 1. Left: Product Title, SKU, Category Badge -->
          <div class="flex items-center gap-3 w-full md:w-4/12 min-w-[240px]">
            <span class="font-mono text-[10px] font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0">
              ${product.sku}
            </span>
            <div class="truncate">
              <h3 class="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors truncate">
                ${product.name}
              </h3>
              <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border ${catBadge}">
                  ${product.category}
                </span>
                <span class="text-[9px] font-extrabold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  ğŸ“Œ Ambalaj: <span class="text-amber-300 font-bold">${activeVolKey}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Center: Side-by-Side Metrics Preview (Ã–nerilen Fiyat, CanlÄ± Fiyat, Saf Maliyet, Net KÃ¢r) -->
          <div class="grid grid-cols-4 gap-1.5 w-full md:w-6/12 items-center bg-slate-950/90 p-2 rounded-xl border border-slate-800/80 text-xs shadow-inner">
            <div class="text-center border-r border-slate-800/80 pr-1">
              <span class="text-[9px] uppercase font-bold ${isLayer3DipFiyatMode ? 'text-rose-400 font-black' : 'text-amber-400'} block tracking-tight">${isLayer3DipFiyatMode ? 'ğŸ Dip (0â‚º KÃ¢r)' : 'ğŸ¯ Ã–nerilen'}</span>
              <span class="font-extrabold ${isLayer3DipFiyatMode ? 'text-rose-300' : 'text-amber-300'} text-xs">${PriceCalculator.formatTL(systemRecommendedPrice)} â‚º</span>
            </div>

            <div class="text-center border-r border-slate-800/80 pr-1">
              <span class="text-[9px] uppercase font-bold ${currentLayer3Channel === 'trendyol' ? 'text-orange-400' : 'text-purple-400'} block tracking-tight">${currentLayer3Channel === 'trendyol' ? 'ğŸ§¡ Trendyol' : 'ğŸŒ iyzico'} CanlÄ±</span>
              <span class="font-black text-xs ${currentLayer3Channel === 'trendyol' ? 'text-orange-300' : 'text-purple-300'}">${hasVolPrice ? PriceCalculator.formatTL(activeLivePrice) + ' â‚º' : 'âšª Yok'}</span>
            </div>

            <div class="text-center border-r border-slate-800/80 pr-1">
              <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Saf Maliyet</span>
              <span class="font-bold text-slate-300 text-xs">${PriceCalculator.formatTL(activeEffectiveNetCost)} â‚º</span>
            </div>

            <div class="text-center">
              <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Net KÃ¢r</span>
              <span class="text-xs font-black">${netProfitMarginHtml}</span>
            </div>
          </div>

          <!-- 3. Far Right Action Buttons: Prominent "TÃ¼m Boyutlar" & Vector Chain Link -->
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="toggleCardAccordion('${product.id}')" class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1 ${isExpanded ? (currentLayer3Channel === 'trendyol' ? 'bg-orange-950 text-orange-300 border border-orange-700/80' : 'bg-purple-950 text-purple-300 border border-purple-700/80') : 'bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700'}">
              <span>ğŸ“Š TÃ¼m Boyutlar ${isExpanded ? 'â–²' : 'â–¼'}</span>
            </button>

            <a href="${siteUrl}" target="_blank" class="p-2 rounded-lg bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-amber-700/60 transition-all text-xs flex items-center justify-center shadow-sm" title="MaÄŸaza BaÄŸlantÄ±sÄ± ğŸ”—">
              <svg class="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
            </a>
          </div>

        </div>

        <!-- Accordion Table for ALL Available Volumes -->
        ${accordionHtml}
      </div>
    `;

    container.insertAdjacentHTML("beforeend", cardHtml);
  });

  const scrapedBadge = document.getElementById("l3-stat-total-scraped");
  if (scrapedBadge) {
    scrapedBadge.innerText = `${totalScrapedMatchCount} ÃœrÃ¼n Bulundu`;
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

  showToast("AylÄ±k Giderlerden 1KG Tesis PayÄ± Otomatik HesaplandÄ±! ğŸ­âœ…");
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
      const inputVat = p.inputVatRate !== undefined ? p.inputVatRate : (p.category === "Sabit YaÄŸlar" ? 1 : 20);
      const salesVat = p.kdv !== undefined ? p.kdv : (p.vatRate !== undefined ? p.vatRate : 20);
      return inputVat === 1 && salesVat === 20;
    });
  }

  if (productsArr.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs font-semibold">AramanÄ±za uygun Ã¼rÃ¼n bulunamadÄ±.</div>`;
    return;
  }

  let html = productsArr.map(p => {
    const inputVat = p.inputVatRate !== undefined ? p.inputVatRate : (p.category === "Sabit YaÄŸlar" ? 1 : 20);
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
            <span class="text-[10px] text-amber-400 font-bold">AlÄ±ÅŸ KDV:</span>
            <select onchange="updateProductInputVat('${p.id}', this.value)" class="bg-slate-900 text-amber-300 font-bold border border-amber-800 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer">
              <option value="1" ${inputVat === 1 ? 'selected' : ''}>%1 AlÄ±ÅŸ</option>
              <option value="20" ${inputVat === 20 ? 'selected' : ''}>%20 AlÄ±ÅŸ</option>
            </select>
          </div>

          <span class="text-slate-600 font-bold">â”</span>

          <div class="flex items-center gap-1">
            <span class="text-[10px] text-emerald-400 font-bold">SatÄ±ÅŸ KDV:</span>
            <select onchange="updateProductSalesVat('${p.id}', this.value)" class="bg-slate-900 text-emerald-300 font-bold border border-emerald-800 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer">
              <option value="1" ${salesVat === 1 ? 'selected' : ''}>%1 SatÄ±ÅŸ</option>
              <option value="20" ${salesVat === 20 ? 'selected' : ''}>%20 SatÄ±ÅŸ</option>
            </select>
          </div>

          <div class="hidden md:block pl-2">
            ${hasMismatch ? `
              <span class="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-300 rounded border border-amber-800 font-bold">ğŸ›¡ï¸ KDV FarkÄ± Var</span>
            ` : `
              <span class="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">âš–ï¸ Dengeli</span>
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
    if (typeof renderProductGrid === "function" && currentLayerMode === 1) renderProductGrid();
    showToast(`âœ… ${productsMap[productId].name} AlÄ±ÅŸ KDV'si %${newInVat} YapÄ±ldÄ±!`);
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
    if (typeof renderProductGrid === "function" && currentLayerMode === 1) renderProductGrid();
    showToast(`âœ… ${productsMap[productId].name} SatÄ±ÅŸ Fatura KDV'si %${newSalesVat} YapÄ±ldÄ±!`);
  }
}

function saveOperatorSettingsModal() {
  saveFactoryOverheadModal();
  saveWholesaleTiersModal();
  closeOperatorSettingsModal();
  showToast("OperatÃ¶r ayarlarÄ± ve KDV parametreleri baÅŸarÄ±yla kaydedildi! âš™ï¸âœ…", "success");
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
      <option value="10KG" ${vol === "10KG" ? "selected" : ""}>10 KG (2 Adet 5 KG Bidon | %${tiers.tier1?.discount ?? 5} Ä°sk.)</option>
      <option value="30KG" ${vol === "30KG" ? "selected" : ""}>30 KG (1 Adet 25 KG + 1 Adet 5 KG Bidon | %${tiers.tier1?.discount ?? 5} Ä°sk.)</option>
      <option value="100KG" ${vol === "100KG" ? "selected" : ""}>100 KG (4 Adet 25 KG Sanayi Bidonu | %${tiers.tier2?.discount ?? 10} Ä°sk.)</option>
      <option value="250KG" ${vol === "250KG" ? "selected" : ""}>250 KG (10 Adet 25 KG Sanayi Bidonu | %${tiers.tier4?.discount ?? 20} Ä°sk.)</option>
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
      const emptyHtml = `<div class="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-900/50 rounded-2xl border border-slate-800">AramanÄ±za veya seÃ§tiÄŸiniz kategoriye uygun Ã¼rÃ¼n bulunamadÄ±.</div>`;
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

        const targetProfitInput = (product.layer2Profit !== undefined && product.layer2Profit !== null) ? product.layer2Profit : 70;
        const isBreakdownOpen = !!openLayer2Breakdowns[product.id];
        const isDrawerOpen = !!openLayer2Drawers[product.id];

        const isMaceration = isMacerationOil(product);

        const isEssentialOil = product.category === "UÃ§ucu YaÄŸlar";
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
        const kdvRate = product.kdv || (product.category === "UÃ§ucu YaÄŸlar" ? 20 : 1);
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

        const wholesaleMarginMode = product.wholesaleMarginMode || 'percent'; // 'percent' | 'amount'
        const wholesaleMarginValue = (product.wholesaleMarginValue !== undefined && product.wholesaleMarginValue !== null)
          ? parseFloat(product.wholesaleMarginValue)
          : (wholesaleMarginMode === 'percent' ? 20 : 200);

        const isWholesaleSupply = (supplyType === "wholesale");
        
        // Toptan alÄ±m (dÄ±ÅŸarÄ±dan tedarik) ise fabrika presi Ã§alÄ±ÅŸmaz (Enerji PayÄ± = 0),
        // Ama iÅŸÃ§iler bu yaÄŸÄ± ÅŸiÅŸelemek zorundadÄ±r, bu yÃ¼zden Ä°ÅŸÃ§ilik PayÄ± hesaplanmalÄ±dÄ±r!
        const energyOverheadToUse = isWholesaleSupply ? 0 : overheadRes.energyOverheadPerKg;
        const laborOverheadToUse = overheadRes.laborOverheadPerKg;

        const overheadData = PriceCalculator.getOverheadForVolume(
            vol,
            energyOverheadToUse,
            laborOverheadToUse
        );
        
        const linearOverhead = overheadData.linearVolumeOverhead;
        const laborAssemblyFee = overheadData.laborAssemblyFee;
        const totalOverhead = overheadData.totalOverhead;

        const inputVatRate = (product.inputVatRate !== undefined && product.inputVatRate !== null)
          ? parseFloat(product.inputVatRate)
          : (parseFloat(product.kdv) || 1);
        const salesVatRate = parseFloat(product.kdv) || 1;

        const netCost = parseFloat((rawOilCost + packCost + totalOverhead).toFixed(2));

        // ğŸ›¡ï¸ Ä°ki YÃ¶nlÃ¼ KDV Koruma Motoru (VAT Rate Mismatch Tax Neutralization Engine)
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

        // Calculate 1 KG Wholesale Quote Price with Profit Margin (% or â‚º/KG) + Discount Tier %
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

        // Profit or Loss Calculation
        const profitPerKg = parseFloat((finalWholesale1KgQuotePrice - unitNetCost).toFixed(2));
        const totalProfitOrLoss = parseFloat((profitPerKg * kg).toFixed(2));
        const isProfit = profitPerKg >= 0;

        // B2B Wholesale Tier Calculations (based on baseSellingUnitCost and unitNetCost)
        const b2bTier1Price = parseFloat((baseSellingUnitCost * 0.95).toFixed(2));
        const b2bTier1ProfitPerKg = parseFloat((b2bTier1Price - unitNetCost).toFixed(2));
        const b2bTier1IsProfit = b2bTier1ProfitPerKg >= 0;

        const b2bTier2Price = parseFloat((baseSellingUnitCost * 0.90).toFixed(2));
        const b2bTier2ProfitPerKg = parseFloat((b2bTier2Price - unitNetCost).toFixed(2));
        const b2bTier2IsProfit = b2bTier2ProfitPerKg >= 0;

        const b2bTier3Price = parseFloat((baseSellingUnitCost * 0.85).toFixed(2));
        const b2bTier3ProfitPerKg = parseFloat((b2bTier3Price - unitNetCost).toFixed(2));
        const b2bTier3IsProfit = b2bTier3ProfitPerKg >= 0;

        const b2bTier4Price = parseFloat((baseSellingUnitCost * 0.80).toFixed(2));
        const b2bTier4ProfitPerKg = parseFloat((b2bTier4Price - unitNetCost).toFixed(2));
        const b2bTier4IsProfit = b2bTier4ProfitPerKg >= 0;

        // Katman 1 Pazaryeri SimÃ¼latÃ¶rÃ¼ne KDV KorumalÄ± Dip Maliyeti Aktar
        const tySim = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 19, discount: 0, cargo: 110 });
        const hbSim = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 17, discount: 0, cargo: 110 });
        const iySim = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: effectiveNetCost, targetProfit: targetProfitInput, commission: 4, discount: 0, cargo: 82.50 });

        const storePrice = effectiveNetCost + targetProfitInput;

        const badgeClass = product.category === "UÃ§ucu YaÄŸlar"
          ? "bg-purple-950/80 text-purple-300 border-purple-800/60"
          : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";

        if (activeView === "rows") {
          const rowHtml = `
            <div class="glass-card rounded-2xl p-4 border border-slate-800/90 hover:border-emerald-500/40 flex flex-col justify-between gap-3.5 bg-slate-950/90 shadow-xl transition-all">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <!-- ÃœrÃ¼n SKU ve AdÄ± -->
                <div class="flex items-center gap-2.5 min-w-[220px]">
                  <span class="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                    ${product.sku}
                  </span>
                  <div class="truncate">
                    <div class="flex items-center gap-1.5">
                      <h3 class="text-sm font-extrabold text-white truncate tracking-tight">
                        ${product.name}
                      </h3>
                      ${isAnyModified ? `
                        <button onclick="resetProductField('${product.id}', 'all')" title="TÃ¼m Girdileri Orijinal BaÅŸlangÄ±Ã§ FiyatlarÄ±na DÃ¶n" class="text-[10px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-800/80 transition-all flex items-center gap-1 shrink-0 shadow-sm">
                          â†º VarsayÄ±lana DÃ¶n
                        </button>
                      ` : ''}
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">
                      ${product.category}
                    </span>
                  </div>
                </div>

                <!-- ENDÃœSTRÄ°YEL TEDARÄ°K TÃœRÃœ & HAMMADDE/MASERASYON/DÄ°P KONTROL PANELÄ° (ROW VIEW - FERAH YAPI) -->
                <div class="flex flex-wrap items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-2xl border ${isMaceration ? 'border-purple-500/40' : supplyType === 'wholesale' ? 'border-blue-500/40' : 'border-amber-500/30'} shadow-inner">
                  <!-- SÄ±kÄ±m / Maserasyon / Toptan SeÃ§ici -->
                  <div class="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                    ${!isEssentialOil ? `
                      <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${supplyType !== 'wholesale' ? (isMaceration ? 'bg-purple-600 text-white shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm') : 'text-slate-400 hover:text-white'}">
                        ${isMaceration ? 'ğŸŒ¿ Maserasyon' : 'ğŸŒ¾ SÄ±kÄ±m'}
                      </button>
                    ` : ''}
                    <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${supplyType === 'wholesale' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                      ğŸ“¦ Toptan Tedarik
                    </button>
                  </div>

                  ${isMaceration ? `
                    ${supplyType === 'wholesale' ? `
                      <div class="flex items-center gap-2 px-2">
                        <span class="text-xs font-bold text-blue-400">ğŸ“¦ Toptan Fiyat (%${kdvRate} KDV Dahil):</span>
                        <input type="number" value="${costPerKg}" step="10" title="Orijinal VarsayÄ±lan: ${PriceCalculator.formatTL(initialCost)}" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-950 border border-blue-500/60 text-blue-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">â‚º/KG</span>
                      </div>
                    ` : `
                      <!-- MASERASYON GÄ°RDÄ°LERÄ° -->
                      <div class="flex items-center gap-3 px-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-extrabold text-emerald-400">ğŸ«’ Z.YaÄŸÄ±:</span>
                          <input type="number" value="${oliveOilCost}" step="10" ondblclick="resetProductField('${product.id}', 'oliveOilCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'oliveOilCostPerKg', this.value)" class="w-16 bg-slate-950 border border-emerald-500/60 text-emerald-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-emerald-400">â‚º</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-extrabold text-purple-300">ğŸŒ± Ot:</span>
                          <input type="number" value="${herbCost}" step="10" ondblclick="resetProductField('${product.id}', 'herbCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'herbCostPerKg', this.value)" class="w-16 bg-slate-950 border border-purple-500/60 text-purple-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-purple-300">â‚º</span>
                        </div>
                        <div class="bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/60 text-center">
                          <span class="text-xs font-black text-amber-300">${macerationRes.calculatedRatio} KG Ot / 1 KG YaÄŸ</span>
                        </div>
                      </div>
                    `}
                  ` : `
                    ${supplyType === 'wholesale' ? `
                      <div class="flex items-center gap-2 px-2">
                        <span class="text-xs font-bold text-blue-400">ğŸ“¦ Toptan Fiyat (%${kdvRate} KDV Dahil):</span>
                        <input type="number" value="${costPerKg}" step="10" title="Orijinal VarsayÄ±lan: ${PriceCalculator.formatTL(initialCost)}" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-950 border border-blue-500/60 text-blue-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">â‚º/KG</span>
                      </div>
                    ` : `
                      <!-- SIKIM GÄ°RDÄ°LERÄ° -->
                      <div class="flex items-center gap-3 px-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-amber-400">ğŸŒ¾ Tohum AlÄ±ÅŸ:</span>
                          <input type="number" value="${seedCost}" step="5" ondblclick="resetProductField('${product.id}', 'seedCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-16 bg-slate-950 border border-amber-500/60 text-amber-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-amber-400">â‚º</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-cyan-400">ğŸ’§ Verim:</span>
                          <input type="number" value="${yieldPct}" step="1" min="1" max="100" ondblclick="resetProductField('${product.id}', 'yieldPercent')" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-14 bg-slate-950 border border-cyan-500/60 text-cyan-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                          <span class="text-xs font-bold text-cyan-400">%</span>
                        </div>
                      </div>
                    `}

                    <!-- DÄ°P/TORTU FIRE MODÃœLÃœ -->
                    <div class="flex items-center gap-1.5 px-1">
                      <select onchange="updateLayer2ProductField('${product.id}', 'dipStatus', this.value)" class="bg-slate-950 border border-rose-500/40 text-rose-300 font-bold text-xs px-2 py-1 rounded-xl focus:outline-none">
                        <option value="none" ${dipStatus !== 'has_dip' ? 'selected' : ''}>Dip Yok (%0)</option>
                        <option value="has_dip" ${dipStatus === 'has_dip' ? 'selected' : ''}>ğŸ”´ Dip Var</option>
                      </select>
                      ${dipStatus === 'has_dip' ? `
                        <input type="number" value="${dipPercent}" step="1" min="0" max="90" placeholder="Dip %" onchange="updateLayer2ProductField('${product.id}', 'dipPercent', this.value)" class="w-14 bg-slate-950 border border-rose-500 text-rose-300 font-extrabold text-xs px-2 py-1 rounded-xl text-center focus:outline-none">
                        <span class="text-xs font-bold text-rose-400">% Fire</span>
                      ` : ''}
                    </div>
                  `}

                  <!-- KDV HIZLI AYAR SEÃ‡Ä°CÄ° -->
                  <div class="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0 text-xs">
                    <span class="text-[10px] font-bold text-slate-400 pl-1">KDV:</span>
                    <select onchange="updateProductInputVat('${product.id}', this.value)" class="bg-slate-900 text-amber-300 font-bold border border-amber-800/80 rounded px-1.5 py-0.5 text-xs focus:outline-none cursor-pointer" title="Hammadde / Tohum AlÄ±ÅŸ KDV OranÄ±nÄ±z">
                      <option value="1" ${inputVatRate === 1 ? 'selected' : ''}>AlÄ±ÅŸ %1</option>
                      <option value="20" ${inputVatRate === 20 ? 'selected' : ''}>AlÄ±ÅŸ %20</option>
                    </select>
                    <span class="text-slate-600 font-bold">â”</span>
                    <select onchange="updateProductSalesVat('${product.id}', this.value)" class="bg-slate-900 text-emerald-300 font-bold border border-emerald-800/80 rounded px-1.5 py-0.5 text-xs focus:outline-none cursor-pointer" title="Resmi SatÄ±ÅŸ FaturasÄ± KDV OranÄ±nÄ±z">
                      <option value="1" ${salesVatRate === 1 ? 'selected' : ''}>SatÄ±ÅŸ %1</option>
                      <option value="20" ${salesVatRate === 20 ? 'selected' : ''}>SatÄ±ÅŸ %20</option>
                    </select>
                  </div>

                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-purple-500/50">
                      <span class="text-[10px] font-extrabold text-purple-300">ğŸ¯ KÃ¢r:</span>
                      <div class="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px]">
                        <button onclick="updateLayer2ProductField('${product.id}', 'wholesaleMarginMode', 'percent')" class="px-1.5 py-0.5 rounded font-bold transition-all ${wholesaleMarginMode === 'percent' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">%</button>
                        <button onclick="updateLayer2ProductField('${product.id}', 'wholesaleMarginMode', 'amount')" class="px-1.5 py-0.5 rounded font-bold transition-all ${wholesaleMarginMode === 'amount' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">â‚º/KG</button>
                      </div>
                      ${wholesaleMarginMode === 'amount' ? `
                        <div class="flex items-center gap-1">
                          <input type="number" value="${wholesaleMarginValue}" step="10" min="0" placeholder="â‚º/KG" onchange="updateLayer2ProductField('${product.id}', 'wholesaleMarginValue', this.value)" class="w-16 bg-slate-900 border border-emerald-500/60 text-emerald-300 font-extrabold text-xs px-1.5 py-0.5 rounded text-center focus:outline-none">
                          <span class="text-[10px] font-bold text-emerald-400">â‚º/KG</span>
                        </div>
                      ` : `
                        <div class="flex items-center gap-1">
                          <input type="number" value="${wholesaleMarginValue}" step="5" min="0" max="500" placeholder="%" onchange="updateLayer2ProductField('${product.id}', 'wholesaleMarginValue', this.value)" class="w-14 bg-slate-900 border border-purple-400/80 text-purple-200 font-extrabold text-xs px-1.5 py-0.5 rounded text-center focus:outline-none">
                          <span class="text-[10px] font-bold text-purple-300">%</span>
                        </div>
                      `}
                    </div>
                  ` : ''}

                  <div class="text-right shrink-0 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800/80 min-w-[120px] ml-auto">
                    <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider whitespace-nowrap">1KG Saf YaÄŸ Maliyeti</span>
                    <span class="text-xs font-black ${isMaceration ? 'text-purple-300' : supplyType === 'wholesale' ? 'text-blue-300' : 'text-amber-300'} whitespace-nowrap">${PriceCalculator.formatTL(costPerKg)}</span>
                  </div>
                </div>

                <!-- Ambalaj SeÃ§ici veya Toptan Elle KG Yazma GiriÅŸi -->
                ${layer2GroupMode === "wholesale_drums" ? `
                  <div class="flex items-center gap-1.5 bg-slate-950 border border-purple-500/50 px-2.5 py-1.5 rounded-xl shadow-inner shrink-0">
                    <span class="text-xs font-bold text-slate-300">SipariÅŸ:</span>
                    <input type="number" value="${kg}" min="1" step="1" placeholder="KG" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-16 bg-slate-900 border border-purple-400/80 text-purple-300 font-black text-xs px-2 py-0.5 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-purple-500">
                    <span class="text-xs font-black text-purple-300">KG</span>
                  </div>
                ` : `
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-xs text-slate-300 font-bold">Ambalaj:</span>
                    <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-sky-500/50 text-sky-300 font-bold text-xs px-3 py-1.5 rounded-xl focus:outline-none">
                      ${getLayer2VolumeOptionsHtml(vol, product)}
                    </select>
                  </div>
                `}

                <!-- Sadece Net FiyatlarÄ±n & KÃ¢r/Zarar Durumunun KonuÅŸtuÄŸu Rozet (Row View) -->
                <div class="flex items-center gap-2 shrink-0">
                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="bg-gradient-to-r from-emerald-950/90 to-slate-950 px-3 py-1.5 rounded-xl border ${isProfit ? 'border-emerald-500/60' : 'border-rose-500/80'} shadow-md text-right min-w-[175px]">
                      <div class="flex items-center justify-end gap-1">
                        <span class="text-[9px] font-black uppercase ${isProfit ? 'text-emerald-400' : 'text-rose-400'} tracking-wider">1 KG B2B TEKLÄ°F FÄ°YATI:</span>
                        <span class="text-[9px] font-bold text-emerald-300 bg-emerald-950/90 px-1 py-0.2 rounded border border-emerald-800/80">%${kdvRate} KDV</span>
                      </div>
                      <div class="text-base font-black text-emerald-300 tracking-tight leading-tight my-0.5">
                        ${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} <span class="text-[10px] font-bold text-emerald-400">/ KG</span>
                      </div>
                      <div class="flex items-center justify-end gap-1 text-[9px] font-bold">
                        ${Math.abs(profitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-800/80">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                        ` : profitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-800/80">ğŸŸ¢ KÃ‚RDA (+${PriceCalculator.formatTL(profitPerKg)}â‚º)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">ğŸ”´ ZARARDA (${PriceCalculator.formatTL(profitPerKg)}â‚º)</span>
                        `}
                      </div>
                    </div>
                  ` : `
                    <div class="bg-gradient-to-r from-sky-950/90 to-slate-950 px-3 py-1.5 rounded-xl border border-sky-500/60 shadow-md text-right min-w-[175px]">
                      <div class="flex items-center justify-end gap-1">
                        <span class="text-[9px] font-black uppercase text-sky-400 tracking-wider">NET ÃœRETÄ°M MALÄ°YETÄ°:</span>
                        <span class="text-[9px] font-bold text-sky-300 bg-sky-950/90 px-1 py-0.2 rounded border border-sky-800/80">%${kdvRate} KDV</span>
                      </div>
                      <div class="text-base font-black text-sky-300 tracking-tight leading-tight my-0.5">
                        ${PriceCalculator.formatTL(effectiveNetCost)} <span class="text-[10px] font-bold text-sky-400">/ ${vol}</span>
                      </div>
                      <div class="flex items-center justify-end gap-1 text-[9px] font-bold">
                        <span class="text-amber-300 bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-800/80">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                      </div>
                    </div>
                  `}

                  <!-- DÄ°KEY BUTON GRUBU (3 BUTON ÃœST ÃœSTE DÄ°ZÄ°LÄ° - DAR ENÄ°YLE YER TASARRUFU SAÄLAR) -->
                  <div class="flex flex-col gap-1 shrink-0">
                    ${layer2GroupMode === 'wholesale_drums' ? `
                      <button onclick="copyWholesaleProposal('${product.id}', ${kg}, ${finalWholesale1KgQuotePrice}, ${totalOrderPrice}, ${kdvRate})" title="MÃ¼ÅŸteri Teklif Metnini Kopyala" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 whitespace-nowrap">
                        ğŸ“‹ Teklif Kopyala
                      </button>
                    ` : ''}
                    <button onclick="toggleLayer2Breakdown('${product.id}')" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 whitespace-nowrap">
                      ğŸ“‹ ${isBreakdownOpen ? "FaturayÄ± Gizle" : "Fatura DÃ¶kÃ¼mÃ¼"}
                    </button>
                    <button onclick="toggleLayer2Drawer('${product.id}')" class="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/80 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 whitespace-nowrap">
                      ${layer2GroupMode === 'wholesale_drums' ? (isDrawerOpen ? "ğŸ¢ B2B Cetveli Gizle" : "ğŸ¢ B2B Cetveli") : (isDrawerOpen ? "âš¡ Sistem 1 Gizle" : "âš¡ Pazaryeri Sim")}
                    </button>
                  </div>
                </div>
              </div>

              <!-- DÄ°KEY, RAHAT OKUNUR VE EKRANA TAM SIÄAN KOMPAKT RESMÄ° FATURA DÃ–KÃœM Ã‡EKMECESÄ° -->
              ${isBreakdownOpen ? `
                <div class="bg-slate-950/95 p-4.5 rounded-2xl border border-slate-700 text-xs space-y-2.5 animate-slide-up max-w-3xl my-2 shadow-xl">
                  <div class="flex justify-between items-center pb-1.5 border-b border-slate-800 font-extrabold text-xs text-teal-400 tracking-wider">
                    <span>ğŸ“‹ RESMÄ° FABRÄ°KA MALÄ°YET VE SÄ°PARÄ°Å HESAP FATURASI</span>
                    <span class="text-[10px] text-slate-400 font-normal">TÄ±kla Detay GÃ¶r â„¹ï¸</span>
                  </div>

                  <!-- KALEM 1 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item1')" class="cursor-pointer hover:bg-slate-900/80 p-2 rounded-xl transition-all border border-slate-800/80">
                    <div class="flex items-center justify-between text-slate-100 font-semibold">
                      <span class="flex items-center gap-1.5 text-xs text-slate-200">
                        ${supplyType === 'wholesale' ? `1. ğŸ“¦ Toptan DÃ¶kme YaÄŸ PayÄ± (${vol})` : isMaceration ? `1. ğŸŒ¿ Maserasyon YaÄŸ PayÄ± (${vol})` : `1. ğŸŒ¾ SÄ±kÄ±m YaÄŸ PayÄ± (${vol})`}
                        <span class="text-[10px] text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800/80">â„¹ï¸ FormÃ¼l / Detay</span>
                      </span>
                      <span class="font-extrabold text-cyan-300 text-xs">${PriceCalculator.formatTL(rawOilCost)} â‚º</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item1 ? `
                      <div class="mt-2 p-2.5 bg-slate-900 rounded-xl border border-sky-500/40 text-xs text-sky-200 space-y-1.5 animate-slide-up">
                        <div class="font-bold text-sky-300 border-b border-slate-800 pb-1">ğŸ’¡ 1. KALEM (HAM YAÄ) NASIL HESAPLANDI?</div>
                        ${supplyType === 'wholesale' ? `
                          <p>â€¢ <strong>Toptan DÃ¶kme YaÄŸ AlÄ±ÅŸ FiyatÄ±:</strong> ${PriceCalculator.formatTL(costPerKg)} â‚º / KG (%${kdvRate} KDV Dahil)</p>
                          <p>â€¢ <strong>SipariÅŸ HesabÄ±:</strong> ${PriceCalculator.formatTL(costPerKg)} â‚º Ã— ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)} â‚º</strong></p>
                        ` : isMaceration ? `
                          <p>â€¢ <strong>ZeytinyaÄŸÄ± AlÄ±ÅŸ FiyatÄ±:</strong> ${PriceCalculator.formatTL(oliveOilCost)} â‚º / KG (%${kdvRate} KDV Dahil)</p>
                          <p>â€¢ <strong>Ot/Bitki AlÄ±ÅŸ FiyatÄ±:</strong> ${PriceCalculator.formatTL(herbCost)} â‚º / KG (KullanÄ±lan Oran: ${macerationRes.calculatedRatio} KG Ot / 1 KG YaÄŸ)</p>
                          <p>â€¢ <strong>1 KG Maserasyon YaÄŸ Maliyeti:</strong> ${PriceCalculator.formatTL(costPerKg)} â‚º / KG</p>
                          <p>â€¢ <strong>SipariÅŸ HesabÄ±:</strong> ${PriceCalculator.formatTL(costPerKg)} â‚º Ã— ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)} â‚º</strong></p>
                        ` : `
                          <p>â€¢ <strong>Hammadde (Tohum) AlÄ±ÅŸ FiyatÄ±:</strong> ${PriceCalculator.formatTL(seedCost)} â‚º / KG (%${kdvRate} KDV Dahil)</p>
                          <p>â€¢ <strong>Pres Verimi:</strong> %${yieldPct} (100 KG tohumdan ${yieldPct} KG saf yaÄŸ elde edilir)</p>
                          <p>â€¢ <strong>Dip / Tortu Fire Durumu:</strong> ${dipStatus === 'has_dip' && dipPercent > 0 ? `%${dipPercent} Fire Var` : 'Dip Yok (%0 Fire)'}</p>
                          <p>â€¢ <strong>1 KG Saf SÄ±kÄ±m YaÄŸ Maliyeti:</strong> ${PriceCalculator.formatTL(costPerKg)} â‚º / KG</p>
                          <p>â€¢ <strong>SipariÅŸ HesabÄ±:</strong> ${PriceCalculator.formatTL(costPerKg)} â‚º Ã— ${kg} KG = <strong>${PriceCalculator.formatTL(rawOilCost)} â‚º</strong></p>
                        `}
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 2 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item2')" class="cursor-pointer hover:bg-slate-900/80 p-2 rounded-xl transition-all border border-slate-800/80">
                    <div class="flex items-center justify-between text-slate-100 font-semibold">
                      <span class="flex items-center gap-1.5 text-xs text-slate-200">
                        2. ğŸ¾ Ambalaj Maliyeti (${layer2GroupMode === 'wholesale_drums' ? 'Sanayi BidonlarÄ±' : 'ÅiÅŸe + Kapak + Kutu'})
                        <span class="text-[10px] text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800/80">â„¹ï¸ Detay</span>
                      </span>
                      <span class="font-extrabold text-sky-300 text-xs">${PriceCalculator.formatTL(packCost)} â‚º</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item2 ? `
                      <div class="mt-2 p-2.5 bg-slate-900 rounded-xl border border-sky-500/40 text-xs text-sky-200 space-y-1.5 animate-slide-up">
                        <p>â€¢ <strong>SeÃ§ilen Ambalaj DaÄŸÄ±lÄ±mÄ±:</strong> ${layer2GroupMode === 'wholesale_drums' ? (wholesalePack?.breakdownText || `${kg} KG Bidon`) : vol}</p>
                        <p>â€¢ <strong>Toplam Ambalaj Gideri:</strong> <strong>${PriceCalculator.formatTL(packCost)} â‚º</strong></p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 3 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item3')" class="cursor-pointer hover:bg-slate-900/80 p-2 rounded-xl transition-all border border-slate-800/80">
                    <div class="flex items-center justify-between text-slate-100 font-semibold">
                      <span class="flex items-center gap-1.5 text-xs text-slate-200">
                        3. âš¡ Tesis & Enerji Masraf PayÄ± ${supplyType === 'wholesale' ? '(0 â‚º Toptan AlÄ±ÅŸ)' : ''}
                        <span class="text-[10px] text-purple-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800/80">â„¹ï¸ Detay</span>
                      </span>
                      <span class="font-extrabold ${supplyType === 'wholesale' ? 'text-slate-400' : 'text-purple-300'} text-xs">${PriceCalculator.formatTL(linearOverhead)} â‚º</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item3 ? `
                      <div class="mt-2 p-2.5 bg-slate-900 rounded-xl border border-purple-500/40 text-xs text-purple-200 space-y-1.5 animate-slide-up">
                        <div class="font-bold text-purple-300 border-b border-slate-800 pb-1">ğŸ’¡ 3. KALEM NASIL HESAPLANDI?</div>
                        ${supplyType === 'wholesale' ? `
                          <p>â€¢ <strong>Toptan AlÄ±nan YaÄŸlarda Tesis PayÄ±:</strong> <strong>0,00 â‚º</strong> (DÄ±ÅŸarÄ±dan dÃ¶kme alÄ±ndÄ±ÄŸÄ± iÃ§in fabrika presi Ã§alÄ±ÅŸmaz).</p>
                        ` : `
                          <p>â€¢ <strong>AylÄ±k Tesis & Enerji Masraf PayÄ± (Elektrik+Kira):</strong> ${PriceCalculator.formatTL(overheadRes.energyOverheadPerKg)} â‚º / KG</p>
                          <p>â€¢ <strong>SipariÅŸ Tesis PayÄ± (Lineer Hacim):</strong> ${PriceCalculator.formatTL(overheadRes.energyOverheadPerKg)} â‚º Ã— ${kg} KG = <strong>${PriceCalculator.formatTL(linearOverhead)} â‚º</strong></p>
                        `}
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 4 -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item4')" class="cursor-pointer hover:bg-slate-900/80 p-2 rounded-xl transition-all border border-slate-800/80">
                    <div class="flex items-center justify-between text-slate-100 font-semibold">
                      <span class="flex items-center gap-1.5 text-xs text-slate-200">
                        4. ğŸ› ï¸ Dolum & Paketleme Ä°ÅŸÃ§ilik PayÄ±
                        <span class="text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800/80">â„¹ï¸ FormÃ¼l / Detay</span>
                      </span>
                      <span class="font-extrabold text-indigo-300 text-xs">${PriceCalculator.formatTL(laborAssemblyFee)} â‚º</span>
                    </div>
                    ${openLayer2BreakdownInfos[product.id]?.item4 ? `
                      <div class="mt-2 p-2.5 bg-slate-900 rounded-xl border border-indigo-500/40 text-xs text-indigo-200 space-y-1.5 animate-slide-up">
                        <div class="font-bold text-indigo-300 border-b border-slate-800 pb-1">ğŸ’¡ 4. KALEM (Ä°ÅÃ‡Ä°LÄ°K HÄ°ZMETÄ°) NASIL HESAPLANDI?</div>
                        <p>â€¢ <strong>Taban Ä°ÅŸÃ§ilik PayÄ± (MaaÅŸ+SGK vb.):</strong> ${PriceCalculator.formatTL(overheadRes.laborOverheadPerKg)} â‚º / KG</p>
                        <p>â€¢ <strong>Ambalaj Zorluk KatsayÄ±sÄ± (${vol}):</strong> Ã—${(overheadRes.laborOverheadPerKg > 0 && kg > 0) ? (laborAssemblyFee / (overheadRes.laborOverheadPerKg * kg)).toFixed(1) : "0.0"} Ã‡arpan</p>
                        <p>â€¢ <strong>SipariÅŸ Ä°ÅŸÃ§ilik PayÄ±:</strong> <strong>${PriceCalculator.formatTL(laborAssemblyFee)} â‚º</strong></p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- KALEM 5: SAF FABRÄ°KA HAM MALÄ°YETÄ° & KDV KORUMA DENGELÄ° MALÄ°YET (FERAH & IZGARA DÃœZENÄ°) -->
                  <div onclick="toggleLayer2BreakdownInfo('${product.id}', 'item5')" class="cursor-pointer hover:bg-slate-900/80 p-2.5 rounded-xl transition-all border ${taxProtection.hasMismatch ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-amber-500/40 bg-amber-950/20'} space-y-1">
                    <div class="flex items-center justify-between font-extrabold text-xs">
                      <span class="text-amber-300 flex items-center gap-1.5">
                        ğŸ SAF FABRÄ°KA ÃœRETÄ°M MALÄ°YETÄ° (KÃ‚RSIZ NET GÄ°DER)
                        <span class="text-[10px] text-amber-200 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/80">â„¹ï¸ FormÃ¼l / Detay</span>
                      </span>
                      <span class="text-amber-300 text-sm shrink-0 font-black">${PriceCalculator.formatTL(netCost)} â‚º</span>
                    </div>
                    ${taxProtection.hasMismatch ? `
                      <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                        <span class="text-emerald-400 font-bold flex items-center gap-1">
                          ğŸ›¡ï¸ KDV KORUMALI DÄ°P SATIÅ MALÄ°YETÄ° (AlÄ±ÅŸ %${inputVatRate} â” SatÄ±ÅŸ %${salesVatRate}):
                        </span>
                        <span class="font-extrabold text-emerald-300 text-sm">${PriceCalculator.formatTL(effectiveNetCost)} â‚º</span>
                      </div>
                    ` : ''}
                    ${openLayer2BreakdownInfos[product.id]?.item5 ? `
                      <div class="mt-2.5 p-3 bg-slate-900/95 rounded-xl border border-amber-500/40 text-xs text-slate-200 space-y-2 animate-slide-up shadow-lg">
                        <!-- Toplama SatÄ±rÄ± (Yan Yana Temiz Izgara) -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                          <div><span class="text-slate-400 block">1. YaÄŸ:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(rawOilCost)} â‚º</span></div>
                          <div><span class="text-slate-400 block">2. Ambalaj:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(packCost)} â‚º</span></div>
                          <div><span class="text-slate-400 block">3. Tesis:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(linearOverhead)} â‚º</span></div>
                          <div><span class="text-slate-400 block">4. Ä°ÅŸÃ§ilik:</span><span class="font-bold text-slate-200">${PriceCalculator.formatTL(laborAssemblyFee)} â‚º</span></div>
                        </div>

                        <!-- Dip Toplam ve KDV Analiz SatÄ±rÄ± -->
                        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-xs">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-amber-300">= Net Ãœretim Maliyeti:</span>
                            <span class="font-black text-amber-300 text-sm">${PriceCalculator.formatTL(netCost)} â‚º</span>
                          </div>

                          <!-- KDV Rozeti ve KÄ±sa Ã–zellik -->
                          <div class="flex items-center gap-1.5 text-[11px]">
                            ${inputVatRate === 1 && salesVatRate === 20 ? `
                              <span class="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800 font-bold">ğŸ›¡ï¸ KDV KorumasÄ±: +${PriceCalculator.formatTL(taxProtection.taxDiffSurcharge)} â‚º</span>
                              <span class="font-black text-emerald-400">Dip SatÄ±ÅŸ: ${PriceCalculator.formatTL(effectiveNetCost)} â‚º</span>
                            ` : inputVatRate === 20 && salesVatRate === 1 ? `
                              <span class="px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800 font-bold">ğŸ›¡ï¸ KDV Devri (%20 AlÄ±ÅŸ â” %1 SatÄ±ÅŸ)</span>
                            ` : inputVatRate === 20 && salesVatRate === 20 ? `
                              <span class="px-2 py-0.5 bg-purple-950 text-purple-300 rounded border border-purple-800 font-bold">ğŸ›¡ï¸ Birebir Dengeli (%20 AlÄ±ÅŸ â” %20 SatÄ±ÅŸ)</span>
                            ` : `
                              <span class="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-bold">ğŸ›¡ï¸ Birebir Dengeli (%1 AlÄ±ÅŸ â” %1 SatÄ±ÅŸ)</span>
                            `}
                          </div>
                        </div>

                        <!-- Tek SatÄ±r Temiz Ä°zah Metni -->
                        <p class="text-[11px] text-slate-400 italic border-t border-slate-800/80 pt-1.5 leading-relaxed">
                          ${inputVatRate === 1 && salesVatRate === 20 ? `
                            ğŸ’¡ Tohum KDV'niz (%1) SatÄ±ÅŸ KDV'nizden (%20) dÃ¼ÅŸÃ¼k olduÄŸu iÃ§in devlete cebinizden vergi Ã¶dememeniz adÄ±na vergi koruma dengesi eklenmiÅŸtir.
                          ` : inputVatRate === 20 && salesVatRate === 1 ? `
                            ğŸ’¡ AlÄ±ÅŸ KDV'niz (%20) SatÄ±ÅŸ KDV'nizden (%1) yÃ¼ksek olduÄŸu iÃ§in devlete ekstra KDV Ã§Ä±kmaz, Devreden KDV birikir.
                          ` : `
                            ğŸ’¡ AlÄ±ÅŸ ve SatÄ±ÅŸ KDV oranlarÄ±nÄ±z birebir eÅŸittir (%${salesVatRate}). Cebinizden Ã§Ä±kan KDV dahil harcamanÄ±z baÅŸa baÅŸ satÄ±ÅŸ maliyetinize tam eÅŸittir.
                          `}
                        </p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- TOPTAN SÄ°PARÄ°ÅÄ° Ä°Ã‡Ä°N MÃœÅTERÄ° TEKLÄ°F KUTUSU (Sadece Toptan Bidon Modunda AÃ§Ä±lÄ±r) -->
                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="p-3 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-xl border border-emerald-500 shadow-md text-xs space-y-1.5">
                      <div class="flex justify-between items-center border-b border-emerald-800/80 pb-1">
                        <span class="font-black text-emerald-400 text-xs flex items-center gap-1.5">
                          ğŸ’° MÃœÅTERÄ°YE SATIÅ YAPACAÄINIZ GERÃ‡EK TEKLÄ°F FÄ°YATI
                        </span>
                        <span class="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700">%${kdvRate} KDV Dahil</span>
                      </div>
                      <div class="flex justify-between items-center pt-0.5">
                        <div>
                          <span class="text-[10px] text-slate-300 font-bold block">ğŸ“¢ 1 KG BÄ°RÄ°M TEKLÄ°F:</span>
                          <span class="text-base font-black text-emerald-300">${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} â‚º / KG</span>
                        </div>
                        <div class="text-right">
                          <span class="text-[10px] text-slate-300 font-bold block">ğŸ“¦ SÄ°PARÄ°Å TOPLAMI (${kg} KG):</span>
                          <span class="text-base font-black text-emerald-300">${PriceCalculator.formatTL(totalOrderPrice)} â‚º</span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center text-[10px] pt-1 border-t border-emerald-900/60">
                        <span class="text-purple-200 font-mono">ğŸ“¦ ${wholesalePack?.breakdownText}</span>
                        ${Math.abs(totalProfitOrLoss) < 0.01 ? `
                          <span class="text-amber-300 font-bold bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                        ` : totalProfitOrLoss > 0 ? `
                          <span class="text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">ğŸŸ¢ KÃ‚R: +${PriceCalculator.formatTL(totalProfitOrLoss)} â‚º</span>
                        ` : `
                          <span class="text-rose-300 font-bold bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">ğŸ”´ ZARAR: ${PriceCalculator.formatTL(totalProfitOrLoss)} â‚º</span>
                        `}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ""}

              <!-- SÄ°STEM 1 KANAL SATIÅ SÄ°MÃœLATÃ–RÃœ VEYA B2B TOPTAN BÄ°DON CETVELÄ° -->
              ${isDrawerOpen ? (layer2GroupMode === "wholesale_drums" ? `
                <div class="bg-slate-950/95 p-4 rounded-2xl border border-purple-800/80 space-y-3 animate-slide-up shadow-xl">
                  <div class="flex flex-wrap items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800 gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-extrabold text-purple-300 flex items-center gap-1.5">ğŸ¢ B2B TOPTAN SANAYÄ° Ä°SKONTO & KÃ‚RLILIK CETVELÄ°</span>
                      <span class="text-xs text-slate-400">(TÃ¼m Kademeler Ä°Ã§in Otomatik KÃ¢r/Zarar HesabÄ±)</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-300">Saf Net Maliyetiniz:</span>
                      <span class="text-xs font-black text-amber-300 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800">${PriceCalculator.formatTL(unitNetCost)} â‚º / KG</span>
                    </div>
                  </div>

                  <!-- B2B KADEMELÄ° Ä°SKONTO & TEKLÄ°F MÄ°MARÄ°SÄ° GRID -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                    <!-- Kademe 1: 5-29 KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-teal-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-teal-400 text-xs">ğŸ“¦ KADEME 1 (5 - 29 KG)</span>
                          <span class="text-xs font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">%5 Ä°skonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif FiyatÄ±:</span>
                          <span class="font-black text-teal-300 text-base">${PriceCalculator.formatTL(b2bTier1Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>10 KG SipariÅŸ TutarÄ±:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier1Price * 10)} â‚º</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">KÃ¢rlÄ±lÄ±k:</span>
                        ${Math.abs(b2bTier1ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                        ` : b2bTier1ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">ğŸŸ¢ KÃ‚RDA (+${PriceCalculator.formatTL(b2bTier1ProfitPerKg)}â‚º/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">ğŸ”´ ZARARDA (${PriceCalculator.formatTL(b2bTier1ProfitPerKg)}â‚º/KG)</span>
                        `}
                      </div>
                    </div>

                    <!-- Kademe 2: 30-99 KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-blue-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-blue-400 text-xs">ğŸ›¢ï¸ KADEME 2 (30 - 99 KG)</span>
                          <span class="text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">%10 Ä°skonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif FiyatÄ±:</span>
                          <span class="font-black text-blue-300 text-base">${PriceCalculator.formatTL(b2bTier2Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>30 KG SipariÅŸ TutarÄ±:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier2Price * 30)} â‚º</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">KÃ¢rlÄ±lÄ±k:</span>
                        ${Math.abs(b2bTier2ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                        ` : b2bTier2ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">ğŸŸ¢ KÃ‚RDA (+${PriceCalculator.formatTL(b2bTier2ProfitPerKg)}â‚º/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">ğŸ”´ ZARARDA (${PriceCalculator.formatTL(b2bTier2ProfitPerKg)}â‚º/KG)</span>
                        `}
                      </div>
                    </div>

                    <!-- Kademe 3: 100-249 KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-indigo-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-indigo-400 text-xs">ğŸšš KADEME 3 (100 - 249 KG)</span>
                          <span class="text-xs font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">%15 Ä°skonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif FiyatÄ±:</span>
                          <span class="font-black text-indigo-300 text-base">${PriceCalculator.formatTL(b2bTier3Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>100 KG SipariÅŸ TutarÄ±:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier3Price * 100)} â‚º</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">KÃ¢rlÄ±lÄ±k:</span>
                        ${Math.abs(b2bTier3ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                        ` : b2bTier3ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">ğŸŸ¢ KÃ‚RDA (+${PriceCalculator.formatTL(b2bTier3ProfitPerKg)}â‚º/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">ğŸ”´ ZARARDA (${PriceCalculator.formatTL(b2bTier3ProfitPerKg)}â‚º/KG)</span>
                        `}
                      </div>
                    </div>

                    <!-- Kademe 4: 250+ KG -->
                    <div class="bg-slate-900/90 p-3.5 rounded-xl border border-amber-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-amber-400 text-xs">ğŸ­ KADEME 4 (250+ KG SANAYÄ°)</span>
                          <span class="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">%20 Ä°skonto</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-1.5">
                          <span class="font-semibold text-slate-400">1 KG Teklif FiyatÄ±:</span>
                          <span class="font-black text-amber-300 text-base">${PriceCalculator.formatTL(b2bTier4Price)} / KG</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>250 KG SipariÅŸ TutarÄ±:</span><span class="text-slate-100 font-bold">${PriceCalculator.formatTL(b2bTier4Price * 250)} â‚º</span></div>
                        </div>
                      </div>
                      <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-400">KÃ¢rlÄ±lÄ±k:</span>
                        ${Math.abs(b2bTier4ProfitPerKg) < 0.01 ? `
                          <span class="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">ğŸ DÄ°P MALÄ°YET (0â‚º KÃ‚R)</span>
                        ` : b2bTier4ProfitPerKg > 0 ? `
                          <span class="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">ğŸŸ¢ KÃ‚RDA (+${PriceCalculator.formatTL(b2bTier4ProfitPerKg)}â‚º/KG)</span>
                        ` : `
                          <span class="text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">ğŸ”´ ZARARDA (${PriceCalculator.formatTL(b2bTier4ProfitPerKg)}â‚º/KG)</span>
                        `}
                      </div>
                    </div>
                  </div>

                  <!-- B2B TEKLÄ°F METNÄ° VE HIZLI KOPYALAMA BUTONU -->
                  <div class="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-purple-500/40 text-xs flex-wrap gap-2">
                    <div class="flex items-center gap-2 truncate">
                      <span class="text-base">ğŸ“‹</span>
                      <span class="font-bold text-purple-200 shrink-0">B2B MÃ¼ÅŸteri Fiyat Teklifi:</span>
                      <span class="font-mono text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 truncate">${product.name} â€” ${wholesalePack?.breakdownText || (kg + ' KG Bidon')} | Birim: ${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} â‚º/KG (%${kdvRate} KDV Dahil) | Toplam: ${PriceCalculator.formatTL(totalOrderPrice)} â‚º</span>
                    </div>
                    <button onclick="copyWholesaleProposal('${product.id}', ${kg}, ${finalWholesale1KgQuotePrice}, ${totalOrderPrice}, ${kdvRate})" class="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0">
                      ğŸ“‹ Teklif Metnini Kopyala
                    </button>
                  </div>
                </div>
              ` : `
                <div class="bg-slate-950 p-4 rounded-xl border border-purple-800/60 space-y-3.5 animate-slide-up">
                  <div class="flex flex-wrap items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800 gap-3">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-extrabold text-purple-300 flex items-center gap-1.5">âš¡ KATMAN 1 SÄ°STEM 1 KANAL FÄ°YATI & HAKEDÄ°Å SÄ°MÃœLATÃ–RÃœ</span>
                      <span class="text-xs text-slate-400">(Saf Fabrika Maliyeti Ãœzerinden Hesaplama)</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="text-xs font-bold text-slate-200">Hedef Net KÃ¢r (â‚º):</label>
                      <input type="number" value="${targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-24 bg-slate-950 border border-purple-500/60 text-purple-300 font-extrabold text-sm px-3 py-1 rounded-lg text-center focus:outline-none">
                      <span class="text-xs font-bold text-purple-400">â‚º / Adet</span>
                    </div>
                  </div>

                  <!-- SÄ°STEM 1 KANAL DETAY KARTLARI GRID -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                    <!-- 1. TRENDYOL SÄ°STEM 1 KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-amber-950/20 p-3.5 rounded-xl border border-amber-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-amber-400 text-xs flex items-center gap-1">ğŸ§¡ TRENDYOL</span>
                          <span class="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">%19 Kom.</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Tavsiye SatÄ±ÅŸ FiyatÄ±:</span>
                          <span class="font-black text-amber-300 text-base">${PriceCalculator.formatTL(tySim.salePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon (%19):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(tySim.commAmount)}</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo Ãœcreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(tySim.cargoFee)}</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) HakediÅŸ (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(tySim.payout)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                          <div class="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                            <span title="Net KÃ¢r MarjÄ±ndan doÄŸan Ek SatÄ±ÅŸ KDV'si eksi Kargo/Komisyon faturalarÄ±ndan dÃ¼ÅŸÃ¼len KDV Ä°adesi">(Â±) Vergi & KDV Mahsup Etkisi:</span>
                            <span class="${tySim.netVatImpact > 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold">
                              ${tySim.netVatImpact > 0 ? '-' : '+'}${PriceCalculator.formatTL(Math.abs(tySim.netVatImpact || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÃ‚RINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(tySim.netProfit)}</span>
                      </div>
                    </div>

                    <!-- 2. Ä°YZÄ°CO (WEB SÄ°TENÄ°Z) SÄ°STEM 1 KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-blue-950/20 p-3.5 rounded-xl border border-blue-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-blue-400 text-xs flex items-center gap-1">ğŸŒ Ä°YZÄ°CO (WEB SÄ°TENÄ°Z)</span>
                          <span class="text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">%4 Kom.</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Tavsiye SatÄ±ÅŸ FiyatÄ±:</span>
                          <span class="font-black text-blue-300 text-base">${PriceCalculator.formatTL(iySim.salePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon (%4):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(iySim.commAmount)}</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo Ãœcreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(iySim.cargoFee)}</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) HakediÅŸ (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(iySim.payout)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                          <div class="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                            <span title="Net KÃ¢r MarjÄ±ndan doÄŸan Ek SatÄ±ÅŸ KDV'si eksi Kargo/Komisyon faturalarÄ±ndan dÃ¼ÅŸÃ¼len KDV Ä°adesi">(Â±) Vergi & KDV Mahsup Etkisi:</span>
                            <span class="${tySim.netVatImpact > 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold">
                              ${tySim.netVatImpact > 0 ? '-' : '+'}${PriceCalculator.formatTL(Math.abs(tySim.netVatImpact || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÃ‚RINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(iySim.netProfit)}</span>
                      </div>
                    </div>

                    <!-- 3. HEPSÄ°BURADA SÄ°STEM 1 KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-orange-950/20 p-3.5 rounded-xl border border-orange-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-orange-400 text-xs flex items-center gap-1">ğŸ§¡ HEPSÄ°BURADA</span>
                          <span class="text-xs font-bold text-orange-300 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">%17 Kom.</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">Tavsiye SatÄ±ÅŸ FiyatÄ±:</span>
                          <span class="font-black text-orange-300 text-base">${PriceCalculator.formatTL(hbSim.salePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon (%17):</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(hbSim.commAmount)}</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo Ãœcreti:</span><span class="text-rose-400 font-bold">-${PriceCalculator.formatTL(hbSim.cargoFee)}</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) HakediÅŸ (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(hbSim.payout)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                          <div class="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                            <span title="Net KÃ¢r MarjÄ±ndan doÄŸan Ek SatÄ±ÅŸ KDV'si eksi Kargo/Komisyon faturalarÄ±ndan dÃ¼ÅŸÃ¼len KDV Ä°adesi">(Â±) Vergi & KDV Mahsup Etkisi:</span>
                            <span class="${tySim.netVatImpact > 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold">
                              ${tySim.netVatImpact > 0 ? '-' : '+'}${PriceCalculator.formatTL(Math.abs(tySim.netVatImpact || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÃ‚RINIZ:</span>
                        <span class="text-emerald-300 font-black text-base">+${PriceCalculator.formatTL(hbSim.netProfit)}</span>
                      </div>
                    </div>

                    <!-- 4. PERAKENDE FÄ°ZÄ°KÄ° MAÄAZA KARTI -->
                    <div class="bg-gradient-to-b from-slate-900 to-emerald-950/20 p-3.5 rounded-xl border border-emerald-800/50 space-y-2 flex flex-col justify-between shadow-lg">
                      <div>
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span class="font-extrabold text-emerald-400 text-xs flex items-center gap-1">ğŸª FÄ°ZÄ°KÄ° MAÄAZA</span>
                          <span class="text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Direkt</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-200 text-xs mb-2">
                          <span class="font-semibold text-slate-400">MaÄŸaza FiyatÄ±:</span>
                          <span class="font-black text-emerald-300 text-base">${PriceCalculator.formatTL(storePrice)}</span>
                        </div>
                        <div class="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div class="flex justify-between items-center"><span>(-) Komisyon:</span><span class="text-emerald-400 font-bold">0,00 â‚º</span></div>
                          <div class="flex justify-between items-center"><span>(-) Kargo:</span><span class="text-emerald-400 font-bold">0,00 â‚º</span></div>
                          <div class="flex justify-between items-center font-bold text-slate-100 border-t border-slate-800/60 pt-1.5"><span>(=) Kasa (Payout):</span><span class="text-emerald-300 font-extrabold">${PriceCalculator.formatTL(storePrice)}</span></div>
                          <div class="flex justify-between items-center text-slate-400"><span>(-) Saf Fabrika Maliyeti:</span><span class="text-slate-200 font-bold">-${PriceCalculator.formatTL(netCost)}</span></div>
                          <div class="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                            <span title="Net KÃ¢r MarjÄ±ndan doÄŸan Ek SatÄ±ÅŸ KDV'si eksi Kargo/Komisyon faturalarÄ±ndan dÃ¼ÅŸÃ¼len KDV Ä°adesi">(Â±) Vergi & KDV Mahsup Etkisi:</span>
                            <span class="${tySim.netVatImpact > 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold">
                              ${tySim.netVatImpact > 0 ? '-' : '+'}${PriceCalculator.formatTL(Math.abs(tySim.netVatImpact || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-500/40 mt-2 flex justify-between items-center font-bold text-xs">
                        <span class="text-emerald-400 uppercase tracking-wider text-xs">NET KÃ‚RINIZ:</span>
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
                      <button onclick="resetProductField('${product.id}', 'all')" title="TÃ¼m Girdileri Orijinal BaÅŸlangÄ±Ã§ FiyatlarÄ±na DÃ¶n" class="text-[10px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-800/80 transition-all flex items-center gap-1 shrink-0 shadow-sm">
                        â†º VarsayÄ±lana DÃ¶n
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

                <!-- TEDARÄ°K TÃœRÃœ & HAMMADDE/TOPTAN GÄ°RDÄ°LERÄ° (CARD VIEW) -->
                <div class="my-2 bg-slate-950/90 p-2.5 rounded-xl border ${supplyType === 'wholesale' ? 'border-blue-500/40' : 'border-amber-500/30'} space-y-2">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Tedarik TÃ¼rÃ¼:</span>
                    <div class="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                      ${!isEssentialOil ? `
                        <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'press')" class="px-2 py-0.5 rounded text-[10px] font-bold transition-all ${supplyType !== 'wholesale' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}">
                          ğŸŒ¾ SÄ±kÄ±m
                        </button>
                      ` : ''}
                      <button onclick="updateLayer2ProductField('${product.id}', 'supplyType', 'wholesale')" class="px-2 py-0.5 rounded text-[10px] font-bold transition-all ${supplyType === 'wholesale' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                        ğŸ“¦ Toptan
                      </button>
                    </div>
                  </div>

                  ${supplyType === 'wholesale' ? `
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-400">ğŸ“¦ Toptan AlÄ±ÅŸ:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${costPerKg}" step="10" title="Orijinal VarsayÄ±lan: ${initialCost} â‚º/KG (Ã‡ift tÄ±kla sÄ±fÄ±rla)" ondblclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'wholesaleCostPerKg', this.value)" class="w-20 bg-slate-900 border border-blue-500/50 text-blue-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-blue-400">â‚º/KG</span>
                        ${isWholesaleModified ? `<button onclick="resetProductField('${product.id}', 'wholesaleCostPerKg')" title="VarsayÄ±lana DÃ¶n (${initialCost} â‚º)" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">â†º</button>` : ''}
                      </div>
                    </div>
                  ` : `
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-amber-400">ğŸŒ¾ Tohum AlÄ±ÅŸ:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${seedCost}" step="5" title="Orijinal VarsayÄ±lan: ${initialSeedCost} â‚º/KG (Ã‡ift tÄ±kla sÄ±fÄ±rla)" ondblclick="resetProductField('${product.id}', 'seedCostPerKg')" onchange="updateLayer2ProductField('${product.id}', 'seedCostPerKg', this.value)" class="w-20 bg-slate-900 border border-amber-500/50 text-amber-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-amber-400">â‚º/KG</span>
                        ${isSeedModified ? `<button onclick="resetProductField('${product.id}', 'seedCostPerKg')" title="VarsayÄ±lana DÃ¶n (${initialSeedCost} â‚º)" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">â†º</button>` : ''}
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-cyan-400">ğŸ’§ Pres Verimi:</span>
                      <div class="flex items-center gap-1">
                        <input type="number" value="${yieldPct}" step="1" min="1" max="100" title="Orijinal VarsayÄ±lan: %${initialYield} (Ã‡ift tÄ±kla sÄ±fÄ±rla)" ondblclick="resetProductField('${product.id}', 'yieldPercent')" onchange="updateLayer2ProductField('${product.id}', 'yieldPercent', this.value)" class="w-16 bg-slate-900 border border-cyan-500/50 text-cyan-300 font-extrabold text-xs px-2 py-0.5 rounded text-center focus:outline-none">
                        <span class="text-xs font-bold text-cyan-400">%</span>
                        ${isYieldModified ? `<button onclick="resetProductField('${product.id}', 'yieldPercent')" title="VarsayÄ±lana DÃ¶n (%${initialYield})" class="text-[10px] text-amber-400 hover:text-white bg-amber-950/80 px-1 rounded border border-amber-800/60 font-bold">â†º</button>` : ''}
                      </div>
                    </div>
                  `}

                  <div class="pt-1 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 uppercase font-semibold">1KG YaÄŸ Maliyeti:</span>
                    <span class="text-xs font-black ${supplyType === 'wholesale' ? 'text-blue-300' : 'text-cyan-300'}">${PriceCalculator.formatTL(costPerKg)}</span>
                  </div>
                </div>

                <!-- Minimalist & Vurgulu 1 KG Teklif FiyatÄ± Rozet (Card View) -->
                <div class="p-3 bg-gradient-to-br from-emerald-950/90 to-slate-950 rounded-xl border border-emerald-500/60 my-2 space-y-1">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-extrabold text-emerald-400 uppercase text-[10px] tracking-wider">1 KG TEKLÄ°F FÄ°YATI:</span>
                    <span class="text-[9px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/80">%${kdvRate} KDV</span>
                  </div>
                  <div class="flex justify-between items-baseline">
                    <span class="font-black text-emerald-300 text-lg tracking-tight">${PriceCalculator.formatTL(finalWholesale1KgQuotePrice)} <span class="text-xs text-emerald-400">/ KG</span></span>
                    <span class="text-[10px] font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">%${discountPct} Ä°sk.</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px] text-slate-300 font-bold border-t border-emerald-900/60 pt-1">
                    <span>SipariÅŸ ToplamÄ±: <strong class="text-emerald-300">${PriceCalculator.formatTL(totalOrderPrice)} â‚º</strong></span>
                    <span>(${kg} KG)</span>
                  </div>
                </div>

                <!-- Ambalaj SeÃ§ici veya Toptan Elle KG Yazma GiriÅŸi (Card View) -->
                <div class="my-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <label class="text-slate-200 text-xs font-bold">${layer2GroupMode === 'wholesale_drums' ? 'ğŸ“¦ SipariÅŸ MiktarÄ±:' : 'ğŸ§´ Ambalaj Boyutu:'}</label>
                  ${layer2GroupMode === 'wholesale_drums' ? `
                    <div class="flex items-center gap-1">
                      <input type="number" value="${kg}" min="1" step="1" placeholder="KG" onchange="updateLayer2ProductField('${product.id}', 'layer2WholesaleKg', this.value)" class="w-20 bg-slate-900 border border-purple-400/80 text-purple-200 font-black text-xs px-2 py-1 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <span class="text-xs font-black text-purple-300">KG</span>
                    </div>
                  ` : `
                    <select onchange="updateLayer2ProductField('${product.id}', 'layer2Volume', this.value)" class="bg-slate-900 border border-sky-500/50 text-sky-300 font-bold text-xs px-2.5 py-1.5 rounded-lg focus:outline-none">
                      ${getLayer2VolumeOptionsHtml(vol, product)}
                    </select>
                  `}
                </div>

                <!-- FATURA KESER GÄ°BÄ° DETAYLI DÃ–KÃœM BUTONU -->
                <button onclick="toggleLayer2Breakdown('${product.id}')" class="w-full text-center py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all flex items-center justify-center gap-1.5 my-2">
                  <span>ğŸ“‹ ${isBreakdownOpen ? "Fatura DÃ¶kÃ¼mÃ¼nÃ¼ Gizle" : "ğŸ“‹ DetaylÄ± Maliyet DÃ¶kÃ¼mÃ¼"}</span>
                </button>

                <!-- FATURA KESER GÄ°BÄ° SIKI DÃ–KÃœM TABLOSU (CARD VIEW RECEIPT STYLE) -->
                ${isBreakdownOpen ? `
                  <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 animate-slide-up my-2">
                    <div class="flex justify-between items-center pb-1.5 border-b border-slate-800 font-extrabold text-xs text-emerald-400 uppercase tracking-wider">
                      <span>ğŸ“‹ MALÄ°YET KALEMÄ° (${supplyType === 'wholesale' ? 'TOPTAN' : 'SIKIM'})</span>
                      <span>TUTAR</span>
                    </div>

                    ${supplyType === 'wholesale' ? `
                      <div class="flex items-baseline justify-between text-slate-200">
                        <span class="shrink-0 font-medium text-slate-300">1. ğŸ“¦ Toptan YaÄŸ PayÄ± (${vol})</span>
                        <span class="grow border-b border-dotted border-slate-800 mx-1.5"></span>
                        <span class="font-bold text-blue-300 shrink-0 text-xs">${PriceCalculator.formatTL(rawOilCost)}</span>
                      </div>
                    ` : `
                      <div class="flex items-baseline justify-between text-slate-200">
                        <span class="shrink-0 font-medium text-slate-300">1. ğŸ§´ SÄ±kÄ±m YaÄŸ PayÄ± (${vol})</span>
                        <span class="grow border-b border-dotted border-slate-800 mx-1.5"></span>
                        <span class="font-bold text-cyan-300 shrink-0 text-xs">${PriceCalculator.formatTL(rawOilCost)}</span>
                      </div>
                    `}

                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-medium">2. ğŸ¾ ÅiÅŸe/Kapak</span>
                      <span class="grow border-b border-dotted border-slate-700 mx-1.5"></span>
                      <span class="font-bold text-blue-300 shrink-0 text-xs">${PriceCalculator.formatTL(packCost)}</span>
                    </div>

                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-medium">3. âš¡ Tesis PayÄ± ${supplyType === 'wholesale' ? '(0 â‚º)' : ''}</span>
                      <span class="grow border-b border-dotted border-slate-700 mx-1.5"></span>
                      <span class="font-bold ${supplyType === 'wholesale' ? 'text-slate-400' : 'text-purple-300'} shrink-0 text-xs">${PriceCalculator.formatTL(linearOverhead)}</span>
                    </div>

                    <div class="flex items-baseline justify-between text-slate-200">
                      <span class="shrink-0 font-medium">4. ğŸ› ï¸ Ä°ÅŸÃ§ilik Montaj</span>
                      <span class="grow border-b border-dotted border-slate-700 mx-1.5"></span>
                      <span class="font-bold text-cyan-300 shrink-0 text-xs">${PriceCalculator.formatTL(laborAssemblyFee)}</span>
                    </div>

                    <div class="pt-2 border-t border-slate-800 flex items-center justify-between font-black text-xs">
                      <span class="text-emerald-400">ğŸ TOPLAM SAF MALÄ°YET</span>
                      <span class="grow border-b border-dashed border-emerald-500/50 mx-1.5"></span>
                      <span class="text-emerald-300 text-sm shrink-0">${PriceCalculator.formatTL(netCost)}</span>
                    </div>
                  </div>
                ` : ""}
              </div>

              <!-- SAF FABRÄ°KA Ã‡IKIÅ MALÄ°YETÄ° VURGU ROZETÄ° & SÄ°STEM 1 BUTONU -->
              <div class="mt-2 pt-3 border-t border-slate-800/80 bg-gradient-to-r from-emerald-950/60 to-slate-950 p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">SAF FABRÄ°KA Ã‡IKIÅ MALÄ°YETÄ°:</span>
                  <span class="text-xl font-black text-emerald-300">${PriceCalculator.formatTL(netCost)}</span>
                </div>
                <button onclick="toggleLayer2Drawer('${product.id}')" class="text-xs font-bold px-3 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/80 transition-all flex items-center gap-1.5 shadow-lg shadow-purple-950/40">
                  âš¡ ${isDrawerOpen ? "Sistem 1'i Gizle" : "Sistem 1 SimÃ¼latÃ¶rÃ¼"}
                </button>
              </div>

              <!-- SÄ°STEM 1 KANAL SATIÅ SÄ°MÃœLATÃ–RÃœ Ã‡EKMECESÄ° (CARD VIEW) -->
              ${isDrawerOpen ? `
                <div class="mt-3 pt-3 border-t border-slate-800 bg-slate-950/95 p-3 rounded-xl border border-purple-800/50 animate-slide-up space-y-2.5">
                  <div class="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <label class="text-xs font-bold text-purple-300">ğŸ¯ Hedef Net KÃ¢r (â‚º):</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${targetProfitInput}" min="0" step="5" onchange="updateLayer2ProductField('${product.id}', 'layer2Profit', this.value)" class="w-16 bg-slate-950 border border-purple-500/60 text-purple-300 font-bold text-xs px-2 py-1 rounded-md text-center focus:outline-none">
                      <span class="text-xs font-bold text-purple-400">â‚º</span>
                    </div>
                  </div>

                  <!-- SÄ°STEM 1 KANAL HESAP KARTLARI -->
                  <div class="grid grid-cols-1 gap-2 text-xs">
                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-amber-800/50">
                      <div class="flex justify-between items-center font-bold text-amber-300">
                        <span>ğŸ§¡ Trendyol (%19):</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(tySim.salePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: -${PriceCalculator.formatTL(tySim.commAmount)}</span><span>Kargo: -110 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>HakediÅŸ: ${PriceCalculator.formatTL(tySim.payout)}</span><span>Net KÃ¢r: +${PriceCalculator.formatTL(tySim.netProfit)}</span></div>
                      </div>
                    </div>

                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-blue-800/50">
                      <div class="flex justify-between items-center font-bold text-blue-300">
                        <span>ğŸŒ Ä°yzico Web (%4):</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(iySim.salePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: -${PriceCalculator.formatTL(iySim.commAmount)}</span><span>Kargo: -82.50 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>HakediÅŸ: ${PriceCalculator.formatTL(iySim.payout)}</span><span>Net KÃ¢r: +${PriceCalculator.formatTL(iySim.netProfit)}</span></div>
                      </div>
                    </div>

                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-orange-800/50">
                      <div class="flex justify-between items-center font-bold text-orange-300">
                        <span>ğŸ§¡ Hepsiburada (%17):</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(hbSim.salePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: -${PriceCalculator.formatTL(hbSim.commAmount)}</span><span>Kargo: -110 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>HakediÅŸ: ${PriceCalculator.formatTL(hbSim.payout)}</span><span>Net KÃ¢r: +${PriceCalculator.formatTL(hbSim.netProfit)}</span></div>
                      </div>
                    </div>

                    <div class="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-800/50">
                      <div class="flex justify-between items-center font-bold text-emerald-300">
                        <span>ğŸª Fiziki MaÄŸaza:</span>
                        <span class="text-sm font-black">${PriceCalculator.formatTL(storePrice)}</span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1 space-y-1">
                        <div class="flex justify-between"><span>Komisyon: 0 TL</span><span>Kargo: 0 TL</span></div>
                        <div class="flex justify-between font-semibold text-emerald-300"><span>Kasa: ${PriceCalculator.formatTL(storePrice)}</span><span>Net KÃ¢r: +${PriceCalculator.formatTL(targetProfitInput)}</span></div>
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
        console.error("Katman 2 ÃœrÃ¼n KartÄ± YÃ¼kleme HatasÄ±:", itemErr);
      }
    });
  } catch (err) {
    console.error("Fatal Katman 2 Render Error:", err);
    const errContainer = document.getElementById("layer2-product-rows") || document.getElementById("layer2-main-view");
    if (errContainer) {
      errContainer.innerHTML = `
        <div class="col-span-full p-6 text-center bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-300 space-y-3 my-4">
          <p class="font-bold text-sm">âš ï¸ Katman 2 YÃ¼klenirken Bir Hata OluÅŸtu.</p>
          <p class="text-xs text-rose-400 font-mono">${err.message || "Bilinmeyen JS HatasÄ±"}</p>
          <button onclick="localStorage.clear(); location.reload();" class="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg">
            ğŸ—‘ï¸ Ã–n BelleÄŸi SÄ±fÄ±rla ve Yeniden YÃ¼kle
          </button>
        </div>
      `;
    }
  }
}

async function resetProductField(productId, field) {
  const product = currentProducts[productId] || Object.values(currentProducts).find(p => p.id === productId || p.sku === productId);
  if (!product) return;

  const kdvRate = product.kdv || (product.category === "UÃ§ucu YaÄŸlar" ? 20 : 1);
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
    product.supplyType = product.category === "UÃ§ucu YaÄŸlar" ? "wholesale" : "press";
    product.layer2Profit = 70;
  }

  const isMaceration = isMacerationOil(product);
  const isEssentialOil = product.category === "UÃ§ucu YaÄŸlar";
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
  showToast(`SÄ±fÄ±rlandÄ±: ${product.name} (Orijinal %${kdvRate} KDV Dahil: ${PriceCalculator.formatTL(initialCost)} â‚º Fiyata DÃ¶ndÃ¼ â†º)`);
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
         name.includes("kudret narÄ±") ||
         name.includes("sarÄ± kantaron") ||
         name.includes("aynÄ±sefa") ||
         name.includes("havuÃ§ (maserasyon)") ||
         name.includes("at kestanesi") ||
         name.includes("sarÄ±msak yaÄŸÄ±") ||
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
  const isEssentialOil = product.category === "UÃ§ucu YaÄŸlar";
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
  const productName = product.name || "Bitkisel YaÄŸ";
  const sku = product.sku || productId;

  const wholesalePack = PriceCalculator.calculateWholesalePackagingBreakdown(kg);
  const containerText = wholesalePack.breakdownText || `${kg} KG Bidon`;

  const text = `CansÄ±zzade Bitkisel YaÄŸlar - B2B Toptan SatÄ±ÅŸ Teklifi\n----------------------------------------------------\nÃœrÃ¼n: ${productName} (SKU: ${sku})\nAmbalaj DaÄŸÄ±lÄ±mÄ±: ${containerText} (Toplam ${kg} KG)\n1 KG Birim SatÄ±ÅŸ FiyatÄ±: ${PriceCalculator.formatTL(unitPrice)} â‚º / KG (%${kdvRate} KDV Dahil)\nSipariÅŸ Toplam TutarÄ±: ${PriceCalculator.formatTL(totalPrice)} â‚º\nTeslimat: Tesis Ã‡Ä±kÄ±ÅŸlÄ± / Ambar Kargo\n----------------------------------------------------`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`ğŸ“‹ ${productName} (${containerText}) B2B Teklif Metni KopyalandÄ±!`);
    }).catch(() => {
      showToast(`ğŸ“‹ ${productName} B2B Teklif Metni HazÄ±rlandÄ±!`);
    });
  } else {
    showToast(`ğŸ“‹ ${productName} B2B Teklif Metni HazÄ±rlandÄ±!`);
  }
}

// ----------------------------------------------------
// ğŸ”´ KIRMIZI Ã‡Ä°ZGÄ° DÄ°P FÄ°YAT VE ğŸ KOMBÄ°N SET SÄ°MS
// ----------------------------------------------------

let showRedLineFloor = false;

function toggleRedLineFloor() {
  showRedLineFloor = !showRedLineFloor;
  updateTopDipFiyatBtnState();

  if (currentLayerMode === 1) renderProductGrid();
  else if (currentLayerMode === 2) renderLayer2Cards();
}

function setZeroProfitFloor() {
  const profitInput = document.getElementById("slot-target-profit");
  if (profitInput) {
    profitInput.value = 0;
    calculateCurrentModal();
    if (typeof showToast !== "undefined") {
      showToast("ğŸ”´ KÄ±rmÄ±zÄ± Ã‡izgi Dip Fiyat Aktif (Hedef KÃ¢r: 0 â‚º)", "info");
    }
  }
}

function setDefaultProfit70() {
  const profitInput = document.getElementById("slot-target-profit");
  if (profitInput) {
    profitInput.value = 70;
    calculateCurrentModal();
    if (typeof showToast !== "undefined") {
      showToast("ğŸŸ¢ Standart Hedef KÃ¢r (70 â‚º) Aktif", "info");
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
    console.error("Bundle Modal AÃ§Ä±lÄ±ÅŸ HatasÄ±:", err);
    if (typeof showToast !== "undefined") {
      showToast("SimÃ¼latÃ¶r AÃ§Ä±lÄ±rken Hata: " + err.message, "error");
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
  sel3.innerHTML = `<option value="">-- ÃœrÃ¼n Yok (2'li Paket) --</option>` + optionsHtml;

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
      if (costBadge) costBadge.textContent = PriceCalculator.formatTL(itemNetCost) + " â‚º";

      return itemNetCost;
    });

    if (!p3) {
      const costBadge3 = document.getElementById("bundle-item-cost-3");
      if (costBadge3) costBadge3.textContent = "0,00 â‚º";
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
          <span>ğŸ“¦ SET Ä°Ã‡ERÄ°ÄÄ° & SEÃ‡Ä°LEN HACÄ°MLER</span>
          <span>BÄ°RÄ°M MALÄ°YET</span>
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
          <span class="${labelColor} uppercase tracking-wider text-[10px]">KOMBÄ°N NET KÃ‚R:</span>
          <span class="${valColor} font-black text-base">${valText}</span>
        </div>
      `;
    }

    const resultsGrid = document.getElementById("bundle-results-grid");
    if (resultsGrid) {
      resultsGrid.innerHTML = `
        <!-- 1. TRENDYOL KOMBÄ°N KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-amber-950/30 p-4 rounded-2xl border border-amber-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-amber-400 text-xs">ğŸ§¡ TRENDYOL</span>
              <span class="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">%19 Kom.</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Set SatÄ±ÅŸ FiyatÄ±:</span><span class="font-bold text-amber-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon (%19):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(tyRes.commAmount)}</span></div>
              <div class="flex justify-between"><span>(-) Tek Kargo:</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(tyRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) HakediÅŸ:</span><span class="text-emerald-300">${PriceCalculator.formatTL(tyRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(tyRes.netProfit)}
        </div>

        <!-- 2. Ä°YZÄ°CO (WEB SÄ°TENÄ°Z) KOMBÄ°N KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-blue-950/30 p-4 rounded-2xl border border-blue-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-blue-400 text-xs">ğŸŒ Ä°YZÄ°CO (WEB)</span>
              <span class="text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">%4 Kom.</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Set SatÄ±ÅŸ FiyatÄ±:</span><span class="font-bold text-blue-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon (%4):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(iyRes.commAmount)}</span></div>
              <div class="flex justify-between"><span>(-) Tek Kargo:</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(iyRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) HakediÅŸ:</span><span class="text-emerald-300">${PriceCalculator.formatTL(iyRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(iyRes.netProfit)}
        </div>

        <!-- 3. HEPSÄ°BURADA KOMBÄ°N KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-orange-950/30 p-4 rounded-2xl border border-orange-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-orange-400 text-xs">ğŸ§¡ HEPSÄ°BURADA</span>
              <span class="text-[10px] font-bold text-orange-300 bg-orange-950 px-2 py-0.5 rounded-full border border-orange-800">%17 Kom.</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>Set SatÄ±ÅŸ FiyatÄ±:</span><span class="font-bold text-orange-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon (%17):</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(hbRes.commAmount)}</span></div>
              <div class="flex justify-between"><span>(-) Tek Kargo:</span><span class="text-rose-400 font-semibold">-${PriceCalculator.formatTL(hbRes.cargoFee)}</span></div>
              <div class="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1"><span>(=) HakediÅŸ:</span><span class="text-emerald-300">${PriceCalculator.formatTL(hbRes.payout)}</span></div>
              <div class="flex justify-between text-slate-400"><span>(-) Toplam Saf Maliyet:</span><span class="text-slate-200 font-semibold">-${PriceCalculator.formatTL(totalCost)}</span></div>
            </div>
          </div>
          ${renderBundleProfitBadge(hbRes.netProfit)}
        </div>

        <!-- 4. PERAKENDE FÄ°ZÄ°KÄ° MAÄAZA KOMBÄ°N KARTI -->
        <div class="bg-gradient-to-b from-slate-900 to-emerald-950/30 p-4 rounded-2xl border border-emerald-800/50 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="font-extrabold text-emerald-400 text-xs">ğŸª FÄ°ZÄ°KÄ° MAÄAZA</span>
              <span class="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">Direkt</span>
            </div>

            ${itemsSummaryHtml}

            <div class="space-y-1.5 text-xs text-slate-300">
              <div class="flex justify-between"><span>MaÄŸaza Set FiyatÄ±:</span><span class="font-bold text-emerald-300 text-sm">${PriceCalculator.formatTL(bundleTargetPrice)}</span></div>
              <div class="flex justify-between"><span>(-) Komisyon:</span><span class="text-emerald-400 font-semibold">0,00 â‚º</span></div>
              <div class="flex justify-between"><span>(-) Kargo:</span><span class="text-emerald-400 font-semibold">0,00 â‚º</span></div>
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
// ğŸ“„ KATMAN 2 SAF FABRÄ°KA MALÄ°YETÄ° PDF RAPORU OLUÅTURUCU (REÃ‡ETE & DÃ–KÃœM ENTEGRELÄ°)
// ----------------------------------------------------
function generateLayer2PdfReport() {
  const selectedVol = document.getElementById("pdf-report-volume-select")?.value || "1000ml";
  const volInKg = (typeof PriceCalculator.getVolumeInKg === "function")
    ? PriceCalculator.getVolumeInKg(selectedVol)
    : (PriceCalculator.getVolumeKgRatio ? PriceCalculator.getVolumeKgRatio(selectedVol) : (PriceCalculator.getVolumeMl(selectedVol) / 1000));

  const productsMap = StorageManager.getProducts();
  const productsArr = Object.values(productsMap);

  const sabitYaglar = productsArr.filter(p => p.category === "Sabit YaÄŸlar");
  const ucucuYaglar = productsArr.filter(p => p.category === "UÃ§ucu YaÄŸlar");

  const todayStr = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const factoryOverheadConfig = StorageManager.getFactoryOverhead();
  const overheadRes = PriceCalculator.calculateFactoryOverheadPerKg(factoryOverheadConfig);
  const dynamicOverheadPerKg = overheadRes.overheadPerKg;

  const logoUrl = "assets/cansizzade_logo.jpg";

  let reportHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>CansÄ±zzade - Katman 2 Fabrika DetaylÄ± ReÃ§ete & Saf Maliyet Raporu (${selectedVol})</title>
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
  <!-- SAYFA 1: SABÄ°T YAÄLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="CansÄ±zzade Logo">
      <div class="header-info">
        <h1>KATMAN 2: SAF FABRÄ°KA MALÄ°YET RAPORU (${selectedVol.toUpperCase()})</h1>
        <p>CANSIZZADE BÄ°TKÄ°SEL YAÄLAR SAN. TÄ°C. LTD. ÅTÄ°. | <strong>SABÄ°T YAÄLAR MALÄ°YET DÃ–KÃœMÃœ</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>ğŸ“… <strong>Tarih:</strong> ${todayStr}</span>
      <span>ğŸ“ <strong>Rapor Hacmi:</strong> ${selectedVol} (${volInKg} KG YaÄŸ)</span>
      <span>ğŸ­ <strong>AylÄ±k Tesis Gideri:</strong> ${PriceCalculator.formatTL(overheadRes.totalMonthlyOverhead)}</span>
      <span>âš¡ <strong>1KG Tesis PayÄ±:</strong> ${PriceCalculator.formatTL(dynamicOverheadPerKg)}/KG</span>
    </div>

    <div class="legend-banner">
      <span><strong>ReÃ§ete & Tedarik Origin:</strong> SoÄŸuk SÄ±kÄ±m (Tohum % Verim) / Maserasyon / Toptan AlÄ±ÅŸ</span>
      <span><strong>1. Tohum / Toptan YaÄŸ:</strong> Tohum AlÄ±ÅŸ FiyatÄ± (% Verim SÄ±kÄ±mÄ±) veya KDV Dahil Toptan GeliÅŸ</span>
      <span><strong>2. Ambalaj:</strong> ${selectedVol} ÅiÅŸe/Etiket</span>
      <span><strong>3. Tesis PayÄ±:</strong> Bizim SÄ±kÄ±mlara Tesis Gideri / Toptan AlÄ±ÅŸa 0â‚º</span>
      <span><strong>4. Dolum Montaj:</strong> Ambalaj Montaj Ä°ÅŸÃ§iliÄŸi</span>
    </div>

    <div class="cat-title">ğŸŒ¿ SABÄ°T YAÄLAR DETAYLI REÃ‡ETE & 5 KALEM FATURA DÃ–KÃœM TABLOSU (${selectedVol})</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 7%;">SKU</th>
          <th style="width: 18%;">ÃœrÃ¼n AdÄ±</th>
          <th style="width: 21%;">Hesaplama ReÃ§etesi & Tedarik TÃ¼rÃ¼</th>
          <th style="width: 13%;" class="text-right">1. Tohum / Toptan YaÄŸ AlÄ±ÅŸ</th>
          <th style="width: 10%;" class="text-right">2. ÅiÅŸe/Ambalaj</th>
          <th style="width: 9%;" class="text-right">3. Tesis/Gider</th>
          <th style="width: 9%;" class="text-right">4. Dolum Montaj</th>
          <th style="width: 10%;" class="text-right">5. TOPLAM SAF MALÄ°YET</th>
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
            recipeDesc = `<span class="text-slate font-bold">ğŸ“¦ Toptan AlÄ±ÅŸ</span> <span class="text-slate">(DÄ±ÅŸ Tedarik)</span>`;
            column1Detail = `<span class="font-bold">${PriceCalculator.formatTL(rawOilCost)}</span><br><span class="text-slate">(Net GeliÅŸ FaturasÄ±)</span>`;
          } else if (isMaceration) {
            const herbRatio = p.herbRatioKg || 0.20;
            const ratioStr = `1:${Math.round(1 / herbRatio)}`;
            recipeDesc = `<span class="text-purple font-bold">ğŸŒ¿ Bizim Ãœretim</span> <span class="text-slate">(Maserasyon)</span>`;
            column1Detail = `<span class="font-bold text-purple">${PriceCalculator.formatTL(rawOilCost)}</span><br><span class="text-slate">(${ratioStr} Z.YaÄŸÄ± OranÄ±)</span>`;
          } else {
            const yieldPct = p.yieldPercent || 25;
            const seedCostPerKg = (p.seedCostPerKg !== undefined && p.seedCostPerKg !== null) ? p.seedCostPerKg : parseFloat((rawCostPerKg * 0.25).toFixed(2));
            const seedCostForVol = parseFloat((seedCostPerKg * volInKg).toFixed(2));
            recipeDesc = `<span class="text-emerald font-bold">ğŸ§´ Bizim SÄ±kÄ±m</span> <span class="text-slate">(SoÄŸuk SÄ±kÄ±m)</span>`;
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
              <td class="text-right font-bold ${isWholesale ? 'text-slate' : 'text-purple'}">${isWholesale ? '0,00 â‚º (DÄ±ÅŸ)' : PriceCalculator.formatTL(linearOverhead)}</td>
              <td class="text-right font-bold text-purple">${PriceCalculator.formatTL(laborAssemblyFee)}</td>
              <td class="text-right font-black text-blue">${PriceCalculator.formatTL(totalNetCost)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <div class="footer">
      <span>CansÄ±zzade YÃ¶netim & Maliyet Analiz Sistemi v2.53</span>
      <span>Sayfa 1 / 2 (Sabit YaÄŸlar - ${selectedVol} ReÃ§ete & 5 Kalem Fatura DÃ¶kÃ¼mÃ¼)</span>
    </div>
  </div>

  <!-- SAYFA 2: UÃ‡UCU YAÄLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="CansÄ±zzade Logo">
      <div class="header-info">
        <h1>KATMAN 2: UÃ‡UCU YAÄLAR SAF MALÄ°YET RAPORU (${selectedVol.toUpperCase()})</h1>
        <p>CANSIZZADE BÄ°TKÄ°SEL YAÄLAR SAN. TÄ°C. LTD. ÅTÄ°. | <strong>UÃ‡UCU YAÄLAR TOPTAN TEDARÄ°K DÃ–KÃœMÃœ</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>ğŸ“… <strong>Tarih:</strong> ${todayStr}</span>
      <span>ğŸ“ <strong>Rapor Hacmi:</strong> ${selectedVol} (${volInKg} KG YaÄŸ)</span>
      <span>ğŸ­ <strong>Tedarik ReÃ§etesi:</strong> %20 Yasal KDV Dahil Saf Distilasyon Toptan Tedarik</span>
      <span>ğŸ“Š <strong>ÃœrÃ¼n SayÄ±sÄ±:</strong> ${ucucuYaglar.length} UÃ§ucu YaÄŸ</span>
    </div>

    <div class="legend-banner">
      <span><strong>Faturadaki Net:</strong> ${selectedVol} KDV HariÃ§ AlÄ±ÅŸ TutarÄ±</span>
      <span><strong>Yasal KDV:</strong> %20 Katma DeÄŸer Vergisi</span>
      <span><strong>1. Toptan YaÄŸ AlÄ±ÅŸ:</strong> KDV Dahil Net GeliÅŸ Maliyeti</span>
      <span><strong>2. Ambalaj:</strong> ${selectedVol} ÅiÅŸe/Etiket</span>
    </div>

    <div class="cat-title">ğŸŒ¸ UÃ‡UCU YAÄLAR KDV DÃ–KÃœMÃœ & DETAYLI MALÄ°YET TABLOSU (${selectedVol})</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 8%;">SKU</th>
          <th style="width: 22%;">ÃœrÃ¼n AdÄ±</th>
          <th style="width: 17%;">Tedarik & KDV ReÃ§etesi</th>
          <th style="width: 11%;" class="text-right">Faturadaki Net</th>
          <th style="width: 10%;" class="text-right">Yasal KDV (%20)</th>
          <th style="width: 10%;" class="text-right">1. Toptan YaÄŸ AlÄ±ÅŸ</th>
          <th style="width: 9%;" class="text-right">2. Ambalaj</th>
          <th style="width: 10%;" class="text-right">5. TOPLAM SAF MALÄ°YET</th>
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
              <td><span class="text-purple font-bold">ğŸŒ¸ Toptan Distilasyon</span> <span class="text-slate">(DÄ±ÅŸ Tedarik | %20 KDV Dahil)</span></td>
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
      <span>CansÄ±zzade YÃ¶netim & Maliyet Analiz Sistemi v2.43</span>
      <span>Sayfa 2 / 2 (UÃ§ucu YaÄŸlar - KDV DÃ¶kÃ¼mÃ¼ & Saf Maliyet)</span>
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
// ğŸ“„ KATMAN 3 CANLI MAÄAZA VE KATMAN 1 Ã–NERÄ°LEN FÄ°YAT KARÅILAÅTIRMA PDF RAPORU
// ----------------------------------------------------
function generateLayer3PdfReport() {
  const channel = currentLayer3Channel || "trendyol"; // 'trendyol' or 'site'
  const isTrendyol = channel === "trendyol";
  const channelName = isTrendyol ? "ğŸ§¡ Trendyol Pazaryeri" : "ğŸŒ iyzico (Web Siteleriniz)";
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

  // Build satÄ±r satÄ±r comparison records
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
          category: prod.category || "Sabit YaÄŸlar",
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

  const sabitItems = items.filter(i => i.category === "Sabit YaÄŸlar");
  const ucucuItems = items.filter(i => i.category === "UÃ§ucu YaÄŸlar");

  const themeBorder = isTrendyol ? "#ea580c" : "#7c3aed";
  const themeTitleColor = isTrendyol ? "#c2410c" : "#6d28d9";
  const themeMetaBg = isTrendyol ? "#fff7ed" : "#f5f3ff";
  const themeMetaBorder = isTrendyol ? "#ffedd5" : "#ddd6fe";
  const themeMetaText = isTrendyol ? "#9a3412" : "#5b21b6";

  let reportHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>CansÄ±zzade - Katman 3 ${isLayer3DipFiyatMode ? 'Dip Fiyat (0 â‚º KÃ¢r)' : 'Ã–nerilen Fiyat'} KarÅŸÄ±laÅŸtÄ±rma Raporu (${channelName})</title>
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
  <!-- SAYFA 1: SABÄ°T YAÄLAR -->
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="CansÄ±zzade Logo">
      <div class="header-info">
        <h1>KATMAN 3: CANLI MAÄAZA VE ${isLayer3DipFiyatMode ? 'DÄ°P FÄ°YAT (0 â‚º KÃ‚R)' : 'Ã–NERÄ°LEN FÄ°YAT'} ANALÄ°ZÄ°</h1>
        <p>CANSIZZADE BÄ°TKÄ°SEL YAÄLAR SAN. TÄ°C. LTD. ÅTÄ°. | <strong>${channelName.toUpperCase()} KARÅILAÅTIRMA RAPORU</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>ğŸ“… <strong>Tarih:</strong> ${todayStr}</span>
      <span>ğŸ“Š <strong>Ä°ncelenen Kanal:</strong> ${channelName} (%${commRate} Kom. + ${PriceCalculator.formatTL(cargoFee)} â‚º Kargo)</span>
      <span>â–² <strong>${isLayer3DipFiyatMode ? 'Dip ÃœstÃ¼nde' : 'Ã–nerilen ÃœstÃ¼nde'}:</strong> ${totalAboveCount} Ambalaj</span>
      <span>â–¼ <strong>${isLayer3DipFiyatMode ? 'Dip AltÄ±nda' : 'Ã–nerilenden DÃ¼ÅŸÃ¼k'}:</strong> ${totalBelowCount} Ambalaj</span>
    </div>

    <div class="legend-banner">
      <span><strong>1. Katman 2 Saf Maliyet:</strong> KDV KorumalÄ± Dip Ãœretim Maliyeti</span>
      <span><strong>2. Katman 1 FiyatÄ±:</strong> ${isLayer3DipFiyatMode ? '0 â‚º KÃ¢r (BaÅŸa BaÅŸ Dip FiyatÄ±)' : '+70 â‚º Hedef KÃ¢r EklenmiÅŸ Fiyat'}</span>
      <span><strong>3. CanlÄ± MaÄŸaza FiyatÄ±:</strong> ${channelName} CanlÄ± Ä°lan FiyatÄ±nÄ±z</span>
      <span><strong>4. Net KÃ¢r:</strong> CanlÄ± SatÄ±ÅŸ HakediÅŸinden Saf Maliyet Ã‡Ä±karÄ±lmÄ±ÅŸ Tutar</span>
    </div>

    <div class="cat-title">ğŸŒ¿ SABÄ°T YAÄLAR â€” CANLI SATIÅ VE ${isLayer3DipFiyatMode ? 'DÄ°P FÄ°YAT (0 â‚º KÃ‚R)' : 'Ã–NERÄ°LEN FÄ°YAT'} KARÅILAÅTIRMA CETVELÄ°</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 6%;">SKU</th>
          <th style="width: 22%;">ÃœrÃ¼n AdÄ±</th>
          <th style="width: 7%;" class="text-center">Ambalaj</th>
          <th style="width: 10%;" class="text-right">Saf Maliyet</th>
          <th style="width: 11%;" class="text-right">${isLayer3DipFiyatMode ? 'ğŸ Dip Fiyat' : 'ğŸ¯ Ã–nerilen'}</th>
          <th style="width: 11%;" class="text-right">ğŸ›’ CanlÄ± MaÄŸaza</th>
          <th style="width: 11%;" class="text-right">ğŸ’° Net KÃ¢r</th>
          <th style="width: 19%;" class="text-center">ğŸ KarÅŸÄ±laÅŸtÄ±rma Durumu</th>
        </tr>
      </thead>
      <tbody>
        ${sabitItems.length > 0 ? sabitItems.map((item, idx) => `
          <tr>
            <td class="text-center font-bold nowrap">${idx + 1}</td>
            <td class="font-bold nowrap">${item.sku}</td>
            <td class="font-bold text-emerald">${item.name}</td>
            <td class="text-center font-bold text-blue nowrap">${item.volume}</td>
            <td class="text-right font-bold text-purple nowrap">${PriceCalculator.formatTL(item.netCost)} â‚º</td>
            <td class="text-right font-extrabold text-purple nowrap">${PriceCalculator.formatTL(item.recPrice)} â‚º</td>
            <td class="text-right font-black text-blue nowrap">${PriceCalculator.formatTL(item.livePrice)} â‚º</td>
            <td class="text-right font-bold ${item.liveNetProfit >= 0 ? 'text-emerald' : 'text-rose'} nowrap">${item.liveNetProfit >= 0 ? 'â–² ' : 'â–¼ '}${PriceCalculator.formatTL(item.liveNetProfit)} â‚º</td>
            <td class="text-center nowrap">
              ${item.isAbove
                ? `<span class="badge-above">â–² ÃœSTÃœNDE (+${PriceCalculator.formatTL(item.diffPrice)} â‚º)</span>`
                : `<span class="badge-below">â–¼ DÃœÅÃœK (${PriceCalculator.formatTL(item.diffPrice)} â‚º)</span>`}
            </td>
          </tr>
        `).join('') : `<tr><td colspan="9" class="text-center text-slate">Bu kategoride gÃ¶sterilecek canlÄ± ilan bulunamadÄ±.</td></tr>`}
      </tbody>
    </table>

    <div class="footer">
      <span>CansÄ±zzade KarÅŸÄ±laÅŸtÄ±rma & Fiyat Analiz PortalÄ± v3.04</span>
      <span>Sayfa 1 / 2 (Sabit YaÄŸlar - ${channelName} Fiyat KarÅŸÄ±laÅŸtÄ±rmasÄ±)</span>
    </div>
  </div>

  <!-- SAYFA 2: UÃ‡UCU YAÄLAR (EÄER VARSA) -->
  ${ucucuItems.length > 0 ? `
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" class="header-logo" alt="CansÄ±zzade Logo">
      <div class="header-info">
        <h1>KATMAN 3: UÃ‡UCU YAÄLAR CANLI VE Ã–NERÄ°LEN FÄ°YAT ANALÄ°ZÄ°</h1>
        <p>CANSIZZADE BÄ°TKÄ°SEL YAÄLAR SAN. TÄ°C. LTD. ÅTÄ°. | <strong>${channelName.toUpperCase()} UÃ‡UCU YAÄ CETVELÄ°</strong></p>
      </div>
    </div>

    <div class="meta-banner">
      <span>ğŸ“… <strong>Tarih:</strong> ${todayStr}</span>
      <span>ğŸ“Š <strong>Ä°ncelenen Kanal:</strong> ${channelName}</span>
      <span>ğŸŒ¸ <strong>UÃ§ucu YaÄŸ SayÄ±sÄ±:</strong> ${ucucuItems.length} Ambalaj</span>
    </div>

    <div class="cat-title">ğŸŒ¸ UÃ‡UCU YAÄLAR â€” CANLI SATIÅ VE Ã–NERÄ°LEN FÄ°YAT KARÅILAÅTIRMA CETVELÄ°</div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 6%;">SKU</th>
          <th style="width: 22%;">ÃœrÃ¼n AdÄ±</th>
          <th style="width: 7%;" class="text-center">Ambalaj</th>
          <th style="width: 10%;" class="text-right">Saf Maliyet</th>
          <th style="width: 11%;" class="text-right">ğŸ¯ Ã–nerilen</th>
          <th style="width: 11%;" class="text-right">ğŸ›’ CanlÄ± MaÄŸaza</th>
          <th style="width: 11%;" class="text-right">ğŸ’° Net KÃ¢r</th>
          <th style="width: 19%;" class="text-center">ğŸ KarÅŸÄ±laÅŸtÄ±rma Durumu</th>
        </tr>
      </thead>
      <tbody>
        ${ucucuItems.map((item, idx) => `
          <tr>
            <td class="text-center font-bold nowrap">${idx + 1}</td>
            <td class="font-bold nowrap">${item.sku}</td>
            <td class="font-bold text-emerald">${item.name}</td>
            <td class="text-center font-bold text-blue nowrap">${item.volume}</td>
            <td class="text-right font-bold text-purple nowrap">${PriceCalculator.formatTL(item.netCost)} â‚º</td>
            <td class="text-right font-extrabold text-purple nowrap">${PriceCalculator.formatTL(item.recPrice)} â‚º</td>
            <td class="text-right font-black text-blue nowrap">${PriceCalculator.formatTL(item.livePrice)} â‚º</td>
            <td class="text-right font-bold ${item.liveNetProfit >= 0 ? 'text-emerald' : 'text-rose'} nowrap">${item.liveNetProfit >= 0 ? 'â–² ' : 'â–¼ '}${PriceCalculator.formatTL(item.liveNetProfit)} â‚º</td>
            <td class="text-center nowrap">
              ${item.isAbove
                ? `<span class="badge-above">â–² ÃœSTÃœNDE (+${PriceCalculator.formatTL(item.diffPrice)} â‚º)</span>`
                : `<span class="badge-below">â–¼ DÃœÅÃœK (${PriceCalculator.formatTL(item.diffPrice)} â‚º)</span>`}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <span>CansÄ±zzade KarÅŸÄ±laÅŸtÄ±rma & Fiyat Analiz PortalÄ± v3.04</span>
      <span>Sayfa 2 / 2 (UÃ§ucu YaÄŸlar - ${channelName} Fiyat KarÅŸÄ±laÅŸtÄ±rmasÄ±)</span>
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
    alert("LÃ¼tfen tarayÄ±cÄ±nÄ±zÄ±n aÃ§Ä±lÄ±r pencere (pop-up) engelleyicisini kaldÄ±rÄ±n.");
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
  const sys1 = PriceCalculator.calculateSystem1Channel({ salesVatRate: (typeof product !== 'undefined' && product ? parseFloat(product.kdv) : (typeof item !== 'undefined' && item ? parseFloat(item.kdv) : 20)) || 20, wholesaleCost: calc.effectiveNetCost,
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

  if (titleEl) titleEl.innerText = `ğŸ§¾ ${product.name} (${volKey}) - Fiyat & KÃ¢rlÄ±lÄ±k DÃ¶kÃ¼mÃ¼`;
  if (subTitleEl) subTitleEl.innerText = `${channelName.toUpperCase()} MaÄŸazasÄ± | SKU: ${product.sku} | Sistem Tavsiyesi, CanlÄ± SatÄ±ÅŸ ve BaÅŸa BaÅŸ Dip Maliyet KÄ±yaslamasÄ±`;

  if (contentEl) {
    contentEl.innerHTML = `
      <!-- ÃœrÃ¼n & Ambalaj BaÅŸlÄ±k KÃ¼nyesi -->
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span class="font-bold text-white text-sm">ğŸŒ¿ ${product.name}</span>
          <span class="text-slate-400 font-mono text-[11px] ml-2">SKU: ${product.sku}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60 font-black text-xs">
            ğŸ“Œ Ä°ncelenen Ambalaj: ${volKey}
          </span>
          <span class="px-2.5 py-1 rounded-lg ${channel === 'trendyol' ? 'bg-orange-950 text-orange-300 border-orange-800' : 'bg-purple-950 text-purple-300 border-purple-800'} font-bold text-xs">
            ${channelName}
          </span>
        </div>
      </div>

      <!-- ğŸ“Œ 3 TEMEL FÄ°YAT VE MALÄ°YET KARÅILAÅTIRMASI KARTLARI -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

        <!-- 1. SÄ°STEMÄ°MÄ°ZÄ°N Ã–NERDÄ°ÄÄ° SATIÅ FÄ°YATI -->
        <div class="bg-slate-950 p-3 rounded-xl border border-amber-500/40 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-amber-400">1. Tavsiye Edilen Fiyat</div>
          <div class="text-[11px] font-black text-white">ğŸ¯ Sistem Ã–nerilen FiyatÄ±</div>
          <div class="text-base font-black text-amber-300">${PriceCalculator.formatTL(recPrice)} â‚º</div>
          <p class="text-[10px] text-slate-400 leading-tight">Sistemimizin kÃ¢rlÄ± satÄ±ÅŸ yapmanÄ±z iÃ§in Ã¶nerdiÄŸi tavsiye Katman 1 satÄ±ÅŸ fiyatÄ±</p>
        </div>

        <!-- 2. Ä°NTERNETTEKÄ° CANLI SATIÅ FÄ°YATIMIZ -->
        <div class="bg-slate-950 p-3 rounded-xl border border-purple-500/40 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold ${channel === 'trendyol' ? 'text-orange-400' : 'text-purple-400'}">2. Ä°nternet SatÄ±ÅŸÄ±mÄ±z</div>
          <div class="text-[11px] font-black text-white">ğŸ›’ ${channelName} CanlÄ± FiyatÄ±</div>
          <div class="text-base font-black ${channel === 'trendyol' ? 'text-orange-300' : 'text-purple-300'}">${hasLivePrice ? PriceCalculator.formatTL(livePrice) + ' â‚º' : 'âšª CanlÄ± Fiyat Yok'}</div>
          <p class="text-[10px] text-slate-400 leading-tight">Åu anda mÃ¼ÅŸterinin internette maÄŸazanÄ±zdan satÄ±n aldÄ±ÄŸÄ± canlÄ± fiyat</p>
        </div>

        <!-- 3. BÄ°ZÄ°M 0 â‚º KÃ‚R MALÄ°YETÄ°MÄ°Z (BAÅA BAÅ DÄ°P MALÄ°YET) -->
        <div class="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 text-xs space-y-1 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-cyan-400">3. BaÅŸa BaÅŸ Dip Maliyet</div>
          <div class="text-[11px] font-black text-white">ğŸ 0 â‚º KÃ¢r Ãœretim Maliyetimiz</div>
          <div class="text-base font-black text-cyan-300">${PriceCalculator.formatTL(calc.effectiveNetCost)} â‚º</div>
          <p class="text-[10px] text-slate-400 leading-tight">HiÃ§ kÃ¢r etmeden fabrikanÄ±n baÅŸa baÅŸ noktasÄ± olan KDV korumalÄ± dip maliyeti</p>
        </div>

      </div>

      <!-- ğŸ’° FÄ°NAL: CANLI SATIÅTAN CEBE KALAN NET KÃ‚R / ZARAR HESABI -->
      <div class="bg-slate-950 p-4 rounded-xl border ${netProfit >= 0 ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-rose-500/50 bg-rose-950/30'} space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-black text-xs text-white">ğŸ“Š Ä°NTERNET SATIÅINDAN CEBÄ°NÄ°ZE KALAN NET KÃ‚R HESABI:</span>
          <span class="text-xs font-black px-2.5 py-1 rounded ${isAbove ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}">
            ${isAbove ? 'â–² Sistem Ã–nerisi ÃœstÃ¼nde' : 'â–¼ Sistem Ã–nerisinden DÃ¼ÅŸÃ¼k'}
          </span>
        </div>

        <div class="p-3 bg-slate-900/90 rounded-lg text-xs space-y-1.5 border border-slate-800 font-sans">
          <div class="flex justify-between items-center text-slate-300">
            <span>ğŸ›’ 1. Ä°nternet CanlÄ± SatÄ±ÅŸ FiyatÄ± (MÃ¼ÅŸterinin Ã–dediÄŸi):</span>
            <span class="font-bold text-white">${PriceCalculator.formatTL(livePrice)} â‚º</span>
          </div>
          <div class="flex justify-between items-center text-rose-400">
            <span>ğŸ“‰ 2. Pazaryeri Kesintisi (Komisyon %${commRate} + Kargo):</span>
            <span class="font-bold">-${PriceCalculator.formatTL(commAmt + cargoFee)} â‚º</span>
          </div>
          <div class="flex justify-between items-center text-amber-300 font-extrabold border-t border-slate-800 pt-1">
            <span>â¡ Banka HesabÄ±nÄ±za Yatan Net HakediÅŸ:</span>
            <span>${PriceCalculator.formatTL(payout)} â‚º</span>
          </div>
          <div class="flex justify-between items-center text-cyan-300">
            <span>ğŸ 3. Ã‡Ä±karÄ±lan 0 â‚º KÃ¢r Ãœretim Maliyetimiz (Katman 2):</span>
            <span class="font-bold">-${PriceCalculator.formatTL(calc.effectiveNetCost)} â‚º</span>
          </div>
          <div class="flex justify-between items-center text-sm font-black pt-2.5 border-t border-slate-800">
            <span class="text-white">ğŸ’° NET KÃ‚R / ZARAR SONUCUNUZ:</span>
            <span class="${netProfit >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'} text-base">
              ${netProfit >= 0 ? 'â–² +' + PriceCalculator.formatTL(netProfit) + ' â‚º KÃ‚R' : 'â–¼ ' + PriceCalculator.formatTL(netProfit) + ' â‚º ZARAR'}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-800">
        <a href="${siteUrl}" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-all font-bold text-xs inline-flex items-center gap-1.5">
          <span>ğŸ”— CanlÄ± MaÄŸaza BaÄŸlantÄ±sÄ±nÄ± AÃ§</span>
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


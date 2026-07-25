// CanFiyat Portal Main Application Logic with Product Variant & Custom Product Creation

let currentProducts = {};
let activeCategory = "all";
let searchQuery = "";
let selectedProductId = null;
let viewMode = "rows"; // Default view: 'rows'
let activeSimTab = "system1"; // Default modal sub-tab: 'system1'
let addProductMode = "variant"; // 'variant' | 'custom'

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  currentProducts = StorageManager.getProducts();
  renderStats();
  renderProductGrid();
  setupEventListeners();

  // Async sync with Supabase Cloud DB
  StorageManager.fetchFromSupabase((cloudMap) => {
    currentProducts = cloudMap;
    renderStats();
    renderProductGrid();
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
      <div class="py-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 w-full">
        <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="text-base font-medium">Aramanıza uygun Cansızzade ürünü bulunamadı.</p>
        <button onclick="clearSearch()" class="mt-3 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-4 py-2 rounded-lg">Aramayı Temizle</button>
      </div>
    `;
    return;
  }

  if (viewMode === "rows") {
    container.className = "flex flex-col gap-3 w-full";
  } else {
    container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full";
  }

  filtered.forEach(product => {
    const vol = product.selectedVolume || (product.category === "Uçucu Yağlar" ? "50ml" : "250ml");
    const packCost = product.packagingCost ?? (DEFAULT_PACKAGING_COSTS[vol] || 14.50);
    const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, vol, packCost);
    
    const tyResult = PriceCalculator.calculateSystem1Channel({
      wholesaleCost: unitCost,
      targetProfit: product.targetProfit ?? 70,
      commission: product.channels?.trendyol?.commission || 19,
      discount: product.channels?.trendyol?.discount || 0,
      cargo: product.channels?.trendyol?.cargo || 110
    });

    const isUcucu = product.category === "Uçucu Yağlar";
    const badgeClass = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    if (viewMode === "rows") {
      const rowHtml = `
        <div class="glass-card rounded-xl p-4 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-blue-500/40 transition-all group">
          <div class="flex items-center gap-3 min-w-[280px]">
            <span class="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              ${product.sku}
            </span>
            <div>
              <h3 class="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                ${product.name}
              </h3>
              <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${badgeClass}">
                ${product.category}
              </span>
            </div>
          </div>

          <div class="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800/80 text-xs min-w-[130px]">
            <span class="text-slate-400 block text-[10px] uppercase font-semibold">1KG Toptan</span>
            <span class="font-bold text-slate-200">${PriceCalculator.formatTL(product.costPerKg)}</span>
          </div>

          <div class="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800/80 text-xs min-w-[150px]">
            <span class="text-slate-400 block text-[10px] uppercase font-semibold">Ambalaj & Birim Maliyet</span>
            <span class="font-bold text-blue-400">${vol} (${PriceCalculator.formatTL(unitCost)})</span>
          </div>

          <div class="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800/80 text-xs min-w-[140px]">
            <span class="text-slate-400 block text-[10px] uppercase font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Trendyol Etiket
            </span>
            <span class="font-bold text-white">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
          </div>

          <div class="bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800/80 text-xs min-w-[130px]">
            <span class="text-slate-400 block text-[10px] uppercase font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Hedef Net Kâr
            </span>
            <span class="font-bold text-emerald-400">+${PriceCalculator.formatTL(product.targetProfit ?? 70)}</span>
          </div>

          <div class="min-w-[180px]">
            <button onclick="openProductSlot('${product.id}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg text-xs flex items-center justify-center gap-2 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              SLOT AYARLARI & HESAPLA
            </button>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", rowHtml);
    } else {
      const cardHtml = `
        <div class="glass-card glass-card-hover rounded-xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div class="absolute -right-10 -top-10 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-bold px-2.5 py-1 rounded-md border ${badgeClass}">
                ${product.category}
              </span>
              <span class="font-mono text-xs font-semibold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                ${product.sku}
              </span>
            </div>

            <h3 class="text-base font-bold text-white tracking-tight mb-2 group-hover:text-blue-400 transition-colors">
              ${product.name}
            </h3>

            <div class="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">1KG Toptan Fiyat</span>
                <span class="font-bold text-slate-200">${PriceCalculator.formatTL(product.costPerKg)}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Seçili Ambalaj</span>
                <span class="font-bold text-blue-400">${vol} (${PriceCalculator.formatTL(unitCost)})</span>
              </div>
            </div>

            <div class="space-y-1.5 text-xs my-3">
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-500"></span> Trendyol Etiketi:</span>
                <span class="font-bold text-white">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Hedef Net Kâr:</span>
                <span class="font-bold text-emerald-400">+${PriceCalculator.formatTL(product.targetProfit ?? 70)}</span>
              </div>
            </div>
          </div>

          <button onclick="openProductSlot('${product.id}')" class="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg text-xs flex items-center justify-center gap-2 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            ÜRÜN SLOTUNA GİT & HESAPLA
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
// ADD NEW PRODUCT / VARIANT MODAL LOGIC
// ==========================================
function openAddProductModal() {
  const selectEl = document.getElementById("add-base-product");
  if (selectEl) {
    selectEl.innerHTML = "";
    Object.values(currentProducts).forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.innerText = `${p.name} (${p.sku}) - 1KG: ${PriceCalculator.formatTL(p.costPerKg)}`;
      selectEl.appendChild(option);
    });
  }

  setAddMode("variant");

  const modal = document.getElementById("add-product-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAddProductModal() {
  const modal = document.getElementById("add-product-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function setAddMode(mode) {
  addProductMode = mode;
  const variantBtn = document.getElementById("add-mode-variant-btn");
  const customBtn = document.getElementById("add-mode-custom-btn");
  const variantForm = document.getElementById("add-variant-form");
  const customForm = document.getElementById("add-custom-form");

  if (mode === "variant") {
    variantBtn.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-blue-600 text-white transition-all";
    customBtn.className = "flex-1 py-2 rounded-lg font-bold text-xs text-slate-400 hover:text-white transition-all";
    variantForm.classList.remove("hidden");
    variantForm.classList.add("block");
    customForm.classList.add("hidden");
    customForm.classList.remove("block");
  } else {
    customBtn.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-blue-600 text-white transition-all";
    variantBtn.className = "flex-1 py-2 rounded-lg font-bold text-xs text-slate-400 hover:text-white transition-all";
    customForm.classList.remove("hidden");
    customForm.classList.add("block");
    variantForm.classList.add("hidden");
    variantForm.classList.remove("block");
  }
}

function onVariantVolumeChange() {
  const vol = document.getElementById("add-variant-volume").value;
  const cost = DEFAULT_PACKAGING_COSTS[vol] || 14.50;
  document.getElementById("add-variant-packaging-cost").value = cost;
}

function onBaseProductChange() {
  onVariantVolumeChange();
}

async function submitNewProduct() {
  if (addProductMode === "variant") {
    const baseId = document.getElementById("add-base-product").value;
    const baseProduct = currentProducts[baseId];
    if (!baseProduct) return;

    const volume = document.getElementById("add-variant-volume").value;
    const packagingCost = parseFloat(document.getElementById("add-variant-packaging-cost").value) || 14.50;

    const newId = `${baseProduct.sku}-${volume.toUpperCase()}`;
    const newSku = `${baseProduct.sku}-${volume.toUpperCase()}`;
    const newName = `${baseProduct.name} (${volume})`;

    const newProduct = {
      id: newId,
      sku: newSku,
      name: newName,
      category: baseProduct.category,
      kdv: baseProduct.kdv,
      unit: "1KG",
      costPerKg: baseProduct.costPerKg,
      selectedVolume: volume,
      packagingCost: packagingCost,
      targetProfit: 70,
      channels: {
        trendyol: { commission: 19, discount: 0, cargo: 110 },
        hepsiburada: { commission: 17, discount: 0, cargo: 110 },
        iyzico: { commission: 4, discount: 0, cargo: 110 }
      }
    };

    await StorageManager.saveProduct(newProduct);
    currentProducts = StorageManager.getProducts();

    renderStats();
    renderProductGrid();
    closeAddProductModal();

    showToast(`Yeni Ambalaj Slotu Oluşturuldu: ${newName} ✅`);
    openProductSlot(newId);
  } else {
    // Custom product mode
    const sku = document.getElementById("add-custom-sku").value.trim() || `CUSTOM-${Date.now()}`;
    const name = document.getElementById("add-custom-name").value.trim() || "Özel Ürün";
    const category = document.getElementById("add-custom-category").value;
    const costKg = parseFloat(document.getElementById("add-custom-cost-kg").value) || 1000;
    const kdv = parseFloat(document.getElementById("add-custom-kdv").value) || 20;

    const newProduct = {
      id: sku,
      sku: sku,
      name: name,
      category: category,
      kdv: kdv,
      unit: "1KG",
      costPerKg: costKg,
      selectedVolume: "250ml",
      packagingCost: 14.50,
      targetProfit: 70,
      channels: {
        trendyol: { commission: 19, discount: 0, cargo: 110 },
        hepsiburada: { commission: 17, discount: 0, cargo: 110 },
        iyzico: { commission: 4, discount: 0, cargo: 110 }
      }
    };

    await StorageManager.saveProduct(newProduct);
    currentProducts = StorageManager.getProducts();

    renderStats();
    renderProductGrid();
    closeAddProductModal();

    showToast(`Yeni Özel Ürün Eklendi: ${name} ✅`);
    openProductSlot(sku);
  }
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

  ["system1", "system2", "system3", "system4"].forEach(id => {
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

function openProductSlot(productId) {
  selectedProductId = productId;
  const product = currentProducts[productId];
  if (!product) return;

  const defaultVol = product.selectedVolume || (product.category === "Uçucu Yağlar" ? "50ml" : "250ml");

  document.getElementById("modal-product-title").innerText = `${product.name} (${product.sku})`;
  document.getElementById("modal-product-category").innerText = product.category;
  document.getElementById("modal-cost-kg").innerText = PriceCalculator.formatTL(product.costPerKg);

  document.getElementById("slot-volume").value = defaultVol;
  document.getElementById("slot-packaging-cost").value = product.packagingCost ?? (DEFAULT_PACKAGING_COSTS[defaultVol] || 14.50);
  document.getElementById("slot-target-profit").value = product.targetProfit ?? 70;

  const ty = product.channels?.trendyol || { commission: 19, discount: 0, cargo: 110 };
  const hb = product.channels?.hepsiburada || { commission: 17, discount: 0, cargo: 110 };
  const iy = product.channels?.iyzico || { commission: 4, discount: 0, cargo: 110 };

  document.getElementById("s1_comm_ty").value = ty.commission;
  document.getElementById("s1_disc_ty").value = ty.discount;
  document.getElementById("s1_kargo_ty").value = ty.cargo;

  document.getElementById("s1_comm_hb").value = hb.commission;
  document.getElementById("s1_disc_hb").value = hb.discount;
  document.getElementById("s1_kargo_hb").value = hb.cargo;

  document.getElementById("s1_comm_iy").value = iy.commission;
  document.getElementById("s1_disc_iy").value = iy.discount;
  document.getElementById("s1_kargo_iy").value = iy.cargo;

  const volumeSelect = document.getElementById("slot-volume");
  volumeSelect.onchange = () => {
    const vol = volumeSelect.value;
    document.getElementById("slot-packaging-cost").value = DEFAULT_PACKAGING_COSTS[vol] || 14.50;
    calculateCurrentModal();
  };

  switchSimTab("system1");

  const modal = document.getElementById("product-slot-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeProductSlot() {
  const modal = document.getElementById("product-slot-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  selectedProductId = null;
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
  }
}

function calculateSystem1Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const volume = document.getElementById("slot-volume").value;
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;

  const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, volume, packagingCost);
  document.getElementById("calculated-unit-cost").innerText = PriceCalculator.formatTL(unitCost);

  const tyInput = {
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_ty").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_ty").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_ty").value) || 0
  };

  const hbInput = {
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_hb").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_hb").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_hb").value) || 0
  };

  const iyInput = {
    wholesaleCost: unitCost,
    targetProfit: targetProfit,
    commission: parseFloat(document.getElementById("s1_comm_iy").value) || 0,
    discount: parseFloat(document.getElementById("s1_disc_iy").value) || 0,
    cargo: parseFloat(document.getElementById("s1_kargo_iy").value) || 0
  };

  const tyRes = PriceCalculator.calculateSystem1Channel(tyInput);
  const hbRes = PriceCalculator.calculateSystem1Channel(hbInput);
  const iyRes = PriceCalculator.calculateSystem1Channel(iyInput);

  document.getElementById("s1_list_ty").innerText = PriceCalculator.formatTL(tyRes.listPrice);
  document.getElementById("s1_sale_ty").innerText = `İndirimli Fiyat: ${PriceCalculator.formatTL(tyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_ty").innerText = PriceCalculator.formatTL(tyRes.salePrice);
  document.getElementById("s1_rec_kargo_ty").innerText = `-${PriceCalculator.formatTL(tyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_ty").innerText = `-${PriceCalculator.formatTL(tyRes.commAmount)}`;
  document.getElementById("s1_hakedis_ty").innerText = PriceCalculator.formatTL(tyRes.payout);
  document.getElementById("s1_rec_maliyet_ty").innerText = `-${PriceCalculator.formatTL(tyRes.wholesaleCost)}`;
  document.getElementById("s1_profit_ty").innerText = PriceCalculator.formatTL(tyRes.netProfit);

  document.getElementById("s1_list_hb").innerText = PriceCalculator.formatTL(hbRes.listPrice);
  document.getElementById("s1_sale_hb").innerText = `İndirimli Fiyat: ${PriceCalculator.formatTL(hbRes.salePrice)}`;
  document.getElementById("s1_rec_sale_hb").innerText = PriceCalculator.formatTL(hbRes.salePrice);
  document.getElementById("s1_rec_kargo_hb").innerText = `-${PriceCalculator.formatTL(hbRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_hb").innerText = `-${PriceCalculator.formatTL(hbRes.commAmount)}`;
  document.getElementById("s1_hakedis_hb").innerText = PriceCalculator.formatTL(hbRes.payout);
  document.getElementById("s1_rec_maliyet_hb").innerText = `-${PriceCalculator.formatTL(hbRes.wholesaleCost)}`;
  document.getElementById("s1_profit_hb").innerText = PriceCalculator.formatTL(hbRes.netProfit);

  document.getElementById("s1_list_iy").innerText = PriceCalculator.formatTL(iyRes.listPrice);
  document.getElementById("s1_sale_iy").innerText = `İndirimli Fiyat: ${PriceCalculator.formatTL(iyRes.salePrice)}`;
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

  const volume = document.getElementById("slot-volume").value;
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, volume, packagingCost);

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

  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 70;
  const matrix = PriceCalculator.calculateSystem3VolumeMatrix(product.costPerKg, targetProfit);

  const tbody = document.getElementById("s3-matrix-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  matrix.forEach(row => {
    const tr = `
      <tr class="hover:bg-slate-900/60 transition-colors">
        <td class="p-3 font-bold text-white">${row.volume}</td>
        <td class="p-3 text-slate-300">${PriceCalculator.formatTL(row.packagingCost)}</td>
        <td class="p-3 font-bold text-blue-400">${PriceCalculator.formatTL(row.unitCost)}</td>
        <td class="p-3 font-bold text-white">${PriceCalculator.formatTL(row.tyPrice)}</td>
        <td class="p-3 font-bold text-emerald-400 text-right">+${PriceCalculator.formatTL(row.netProfit)}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });
}

function calculateSystem4Modal() {
  const product = currentProducts[selectedProductId];
  if (!product) return;

  const volume = document.getElementById("slot-volume").value;
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, volume, packagingCost);

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

async function saveCurrentProductSlot() {
  if (!selectedProductId) return;

  const volume = document.getElementById("slot-volume").value;
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;

  const updatedProduct = {
    id: selectedProductId,
    selectedVolume: volume,
    packagingCost: packagingCost,
    targetProfit: targetProfit,
    channels: {
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
    }
  };

  await StorageManager.saveProduct(updatedProduct);
  currentProducts = StorageManager.getProducts();
  
  renderProductGrid();
  renderStats();

  showToast("Ürün Slot Ayarları Bulut Veritabanına (Supabase) Kaydedildi! ☁️✅");
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
  }, 3500);
}

// CanFiyat Portal Main Application Logic with Supabase Cloud Sync

let currentProducts = {};
let activeCategory = "all";
let searchQuery = "";
let selectedProductId = null;
let activeSimTab = "system1";

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
  // Search input listener
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProductGrid();
    });
  }

  // Keyboard Enter key shortcut for calculator modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedProductId) {
      calculateCurrentModal();
    }
  });
}

// Render Summary Stats KPI
function renderStats() {
  const productsArr = Object.values(currentProducts);
  const totalCount = productsArr.length;
  const ucucuCount = productsArr.filter(p => p.category === "Uçucu Yağlar").length;
  const sabitCount = productsArr.filter(p => p.category === "Sabit Yağlar").length;

  document.getElementById("stat-total-count").innerText = totalCount;
  document.getElementById("stat-ucucu-count").innerText = ucucuCount;
  document.getElementById("stat-sabit-count").innerText = sabitCount;
}

// Category Tab Switching
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

// Render Main Product Cards Grid
function renderProductGrid() {
  const gridContainer = document.getElementById("product-grid");
  if (!gridContainer) return;

  gridContainer.innerHTML = "";

  const productsArr = Object.values(currentProducts);
  const filtered = productsArr.filter(p => {
    const matchesCat = (activeCategory === "all") || (p.category === activeCategory);
    const matchesSearch = (p.name.toLowerCase().includes(searchQuery)) || 
                          (p.sku.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="text-base font-medium">Aramanıza uygun Cansızzade ürünü bulunamadı.</p>
        <button onclick="clearSearch()" class="mt-3 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-4 py-2 rounded-lg">Aramayı Temizle</button>
      </div>
    `;
    return;
  }

  filtered.forEach(product => {
    // Calculate live unit wholesale cost & target prices for grid card preview
    const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, product.selectedVolume || "250ml", product.packagingCost || 25);
    const tyResult = PriceCalculator.calculateSystem1Channel({
      wholesaleCost: unitCost,
      targetProfit: product.targetProfit || 300,
      commission: product.channels?.trendyol?.commission || 19,
      discount: product.channels?.trendyol?.discount || 0,
      cargo: product.channels?.trendyol?.cargo || 110
    });

    const isUcucu = product.category === "Uçucu Yağlar";
    const badgeClass = isUcucu 
      ? "bg-purple-950/60 text-purple-300 border-purple-800/40" 
      : "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";

    const cardHtml = `
      <div class="glass-card glass-card-hover rounded-xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
        <!-- Background Glow Accent -->
        <div class="absolute -right-10 -top-10 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
        
        <div>
          <!-- Header Tag -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-md border ${badgeClass}">
              ${product.category}
            </span>
            <span class="font-mono text-xs font-semibold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              ${product.sku}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-base font-bold text-white tracking-tight mb-2 group-hover:text-blue-400 transition-colors">
            ${product.name}
          </h3>

          <!-- Details & Base Prices -->
          <div class="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">1KG Toptan Fiyat</span>
              <span class="font-bold text-slate-200">${PriceCalculator.formatTL(product.costPerKg)}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Seçili Ambalaj</span>
              <span class="font-bold text-blue-400">${product.selectedVolume || "250ml"} (${PriceCalculator.formatTL(unitCost)})</span>
            </div>
          </div>

          <!-- Target Sales Price Previews -->
          <div class="space-y-1.5 text-xs my-3">
            <div class="flex justify-between items-center text-slate-300">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-500"></span> Trendyol Etiketi:</span>
              <span class="font-bold text-white">${PriceCalculator.formatTL(tyResult.listPrice)}</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Hedef Net Kâr:</span>
              <span class="font-bold text-emerald-400">+${PriceCalculator.formatTL(product.targetProfit || 300)}</span>
            </div>
          </div>
        </div>

        <!-- Open Slot Button -->
        <button onclick="openProductSlot('${product.id}')" class="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg text-xs flex items-center justify-center gap-2 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          ÜRÜN SLOTUNA GİT & HESAPLA
        </button>
      </div>
    `;

    gridContainer.insertAdjacentHTML("beforeend", cardHtml);
  });
}

function clearSearch() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  searchQuery = "";
  renderProductGrid();
}

// Open Dedicated Product Slot Modal Workspace
function openProductSlot(productId) {
  selectedProductId = productId;
  const product = currentProducts[productId];
  if (!product) return;

  // Populate modal static info
  document.getElementById("modal-product-title").innerText = `${product.name} (${product.sku})`;
  document.getElementById("modal-product-category").innerText = product.category;
  document.getElementById("modal-cost-kg").innerText = PriceCalculator.formatTL(product.costPerKg);

  // Populate editable form inputs
  document.getElementById("slot-volume").value = product.selectedVolume || "250ml";
  document.getElementById("slot-packaging-cost").value = product.packagingCost ?? DEFAULT_PACKAGING_COSTS[product.selectedVolume || "250ml"];
  document.getElementById("slot-target-profit").value = product.targetProfit ?? 300;

  // Populate channel inputs
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

  // Volume select change listener to auto update packaging cost suggestion
  const volumeSelect = document.getElementById("slot-volume");
  volumeSelect.onchange = () => {
    const vol = volumeSelect.value;
    document.getElementById("slot-packaging-cost").value = DEFAULT_PACKAGING_COSTS[vol] || 25;
    calculateCurrentModal();
  };

  // Run calculation inside modal
  calculateCurrentModal();

  // Show modal
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

// Calculate Modal Values in Real-time
function calculateCurrentModal() {
  if (!selectedProductId) return;

  const product = currentProducts[selectedProductId];
  if (!product) return;

  const volume = document.getElementById("slot-volume").value;
  const packagingCost = parseFloat(document.getElementById("slot-packaging-cost").value) || 0;
  const targetProfit = parseFloat(document.getElementById("slot-target-profit").value) || 0;

  // Calculate Unit Cost
  const unitCost = PriceCalculator.calculateUnitWholesaleCost(product.costPerKg, volume, packagingCost);
  document.getElementById("calculated-unit-cost").innerText = PriceCalculator.formatTL(unitCost);

  // Read Channels
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

  // Run System 1
  const tyRes = PriceCalculator.calculateSystem1Channel(tyInput);
  const hbRes = PriceCalculator.calculateSystem1Channel(hbInput);
  const iyRes = PriceCalculator.calculateSystem1Channel(iyInput);

  // Render Trendyol Breakdown
  document.getElementById("s1_list_ty").innerText = PriceCalculator.formatTL(tyRes.listPrice);
  document.getElementById("s1_sale_ty").innerText = `İndirimli Fiyat: ${PriceCalculator.formatTL(tyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_ty").innerText = PriceCalculator.formatTL(tyRes.salePrice);
  document.getElementById("s1_rec_kargo_ty").innerText = `-${PriceCalculator.formatTL(tyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_ty").innerText = `-${PriceCalculator.formatTL(tyRes.commAmount)}`;
  document.getElementById("s1_hakedis_ty").innerText = PriceCalculator.formatTL(tyRes.payout);
  document.getElementById("s1_rec_maliyet_ty").innerText = `-${PriceCalculator.formatTL(tyRes.wholesaleCost)}`;
  document.getElementById("s1_profit_ty").innerText = PriceCalculator.formatTL(tyRes.netProfit);

  // Render Hepsiburada Breakdown
  document.getElementById("s1_list_hb").innerText = PriceCalculator.formatTL(hbRes.listPrice);
  document.getElementById("s1_sale_hb").innerText = `İndirimli Fiyat: ${PriceCalculator.formatTL(hbRes.salePrice)}`;
  document.getElementById("s1_rec_sale_hb").innerText = PriceCalculator.formatTL(hbRes.salePrice);
  document.getElementById("s1_rec_kargo_hb").innerText = `-${PriceCalculator.formatTL(hbRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_hb").innerText = `-${PriceCalculator.formatTL(hbRes.commAmount)}`;
  document.getElementById("s1_hakedis_hb").innerText = PriceCalculator.formatTL(hbRes.payout);
  document.getElementById("s1_rec_maliyet_hb").innerText = `-${PriceCalculator.formatTL(hbRes.wholesaleCost)}`;
  document.getElementById("s1_profit_hb").innerText = PriceCalculator.formatTL(hbRes.netProfit);

  // Render Iyzico Breakdown
  document.getElementById("s1_list_iy").innerText = PriceCalculator.formatTL(iyRes.listPrice);
  document.getElementById("s1_sale_iy").innerText = `İndirimli Fiyat: ${PriceCalculator.formatTL(iyRes.salePrice)}`;
  document.getElementById("s1_rec_sale_iy").innerText = PriceCalculator.formatTL(iyRes.salePrice);
  document.getElementById("s1_rec_kargo_iy").innerText = `-${PriceCalculator.formatTL(iyRes.cargoFee)}`;
  document.getElementById("s1_rec_comm_iy").innerText = `-${PriceCalculator.formatTL(iyRes.commAmount)}`;
  document.getElementById("s1_hakedis_iy").innerText = PriceCalculator.formatTL(iyRes.payout);
  document.getElementById("s1_rec_maliyet_iy").innerText = `-${PriceCalculator.formatTL(iyRes.wholesaleCost)}`;
  document.getElementById("s1_profit_iy").innerText = PriceCalculator.formatTL(iyRes.netProfit);
}

// Save Current Product Slot Changes to Supabase & LocalStorage
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

// Reset Catalog Data to Factory Default
function resetCatalog() {
  if (confirm("Tüm ürün slot ayarlarınızı fabrika varsayılanlarına sıfırlamak istediğinize emin misiniz?")) {
    currentProducts = StorageManager.resetToDefault();
    renderProductGrid();
    renderStats();
    showToast("Ürün Kataloğu Fabrika Ayarlarına Sıfırlandı 🔄");
  }
}

// Toast Notification Helper
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

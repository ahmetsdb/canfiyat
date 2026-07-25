// CanFiyat Calculation Engines

class PriceCalculator {
  // Volume to ml conversion map
  static getVolumeMl(volumeStr) {
    const map = {
      "20ml": 20,
      "50ml": 50,
      "100ml": 100,
      "250ml": 250,
      "500ml": 500,
      "1000ml": 1000
    };
    return map[volumeStr] || 250;
  }

  // Calculate Unit Wholesale Cost for a specific volume size
  static calculateUnitWholesaleCost(costPerKg, volumeStr, packagingCost = 0) {
    const ml = this.getVolumeMl(volumeStr);
    const rawOilCost = (costPerKg / 1000) * ml;
    return parseFloat((rawOilCost + packagingCost).toFixed(2));
  }

  // SYSTEM 1: Toptan Maliyet + Hedef Kâr -> Kanal Satış Fiyatları & Hakediş
  static calculateSystem1Channel({ wholesaleCost, targetProfit, commission, discount, cargo }) {
    const maliyet = parseFloat(wholesaleCost) || 0;
    const kar = parseFloat(targetProfit) || 0;
    const comm = parseFloat(commission) || 0;
    const disc = parseFloat(discount) || 0;
    const kargo = parseFloat(cargo) || 0;

    const neededPayout = maliyet + kar;
    const commDec = comm / 100;
    const discDec = disc / 100;

    // Avoid division by zero
    const commFactor = commDec >= 1 ? 0.99 : (1 - commDec);
    const discFactor = discDec >= 1 ? 0.99 : (1 - discDec);

    const salePrice = (neededPayout + kargo) / commFactor;
    const listPrice = salePrice / discFactor;
    const commAmount = salePrice * commDec;
    const payout = salePrice - commAmount - kargo;
    const netProfit = payout - maliyet;

    return {
      listPrice: parseFloat(listPrice.toFixed(2)),
      salePrice: parseFloat(salePrice.toFixed(2)),
      commAmount: parseFloat(commAmount.toFixed(2)),
      cargoFee: parseFloat(kargo.toFixed(2)),
      payout: parseFloat(payout.toFixed(2)),
      wholesaleCost: parseFloat(maliyet.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2))
    };
  }

  // SYSTEM 2: İyzico (Web) Fiyatından Diğer Pazaryerlerine Eşitleme
  static calculateSystem2({ iyzicoSalePrice, iyzicoCost, targetProfit, tyComm, tyCargo, hbComm, hbCargo }) {
    const webPrice = parseFloat(iyzicoSalePrice) || 0;
    const cost = parseFloat(iyzicoCost) || 0;
    
    // Web net profit
    const webComm = webPrice * 0.04;
    const webPayout = webPrice - webComm - 110;
    const webProfit = webPayout - cost;

    // Trendyol equivalent
    const ty = this.calculateSystem1Channel({
      wholesaleCost: cost,
      targetProfit: webProfit > 0 ? webProfit : 0,
      commission: tyComm,
      discount: 0,
      cargo: tyCargo
    });

    // Hepsiburada equivalent
    const hb = this.calculateSystem1Channel({
      wholesaleCost: cost,
      targetProfit: webProfit > 0 ? webProfit : 0,
      commission: hbComm,
      discount: 0,
      cargo: hbCargo
    });

    return { webPrice, webProfit, ty, hb };
  }

  // Format currency helper
  static formatTL(val) {
    if (isNaN(val)) return "0.00 ₺";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);
  }
}

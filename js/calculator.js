// CanFiyat Complete Calculation Engine (Systems 1, 2, 3 & 4)

class PriceCalculator {
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
  static calculateSystem2({ webSalePrice, unitCost, tyComm = 19, tyCargo = 110, hbComm = 17, hbCargo = 110, iyComm = 4, iyCargo = 110 }) {
    const price = parseFloat(webSalePrice) || 0;
    const cost = parseFloat(unitCost) || 0;
    
    // Web net profit from Web sale price
    const webCommFee = price * (iyComm / 100);
    const webPayout = price - webCommFee - iyCargo;
    const webProfit = webPayout - cost;

    // Equivalent Trendyol price to get SAME net profit as Web
    const ty = this.calculateSystem1Channel({
      wholesaleCost: cost,
      targetProfit: Math.max(0, webProfit),
      commission: tyComm,
      discount: 0,
      cargo: tyCargo
    });

    // Equivalent Hepsiburada price to get SAME net profit as Web
    const hb = this.calculateSystem1Channel({
      wholesaleCost: cost,
      targetProfit: Math.max(0, webProfit),
      commission: hbComm,
      discount: 0,
      cargo: hbCargo
    });

    return {
      webSalePrice: price,
      webPayout: parseFloat(webPayout.toFixed(2)),
      webProfit: parseFloat(webProfit.toFixed(2)),
      tyEquivalentList: ty.listPrice,
      tyPayout: ty.payout,
      hbEquivalentList: hb.listPrice,
      hbPayout: hb.payout
    };
  }

  // SYSTEM 3: Hacim & Gramaj Ölçeklendirme Matrisi (20ml, 50ml, 100ml, 250ml, 500ml, 1000ml)
  static calculateSystem3VolumeMatrix(costPerKg, targetProfitPerUnit = 300) {
    const volumes = ["20ml", "50ml", "100ml", "250ml", "500ml", "1000ml"];
    return volumes.map(vol => {
      const packagingCost = DEFAULT_PACKAGING_COSTS[vol] || 25;
      const unitCost = this.calculateUnitWholesaleCost(costPerKg, vol, packagingCost);
      const ty = this.calculateSystem1Channel({
        wholesaleCost: unitCost,
        targetProfit: targetProfitPerUnit,
        commission: 19,
        discount: 0,
        cargo: 110
      });
      return {
        volume: vol,
        unitCost: unitCost,
        packagingCost: packagingCost,
        tyPrice: ty.listPrice,
        netProfit: targetProfitPerUnit
      };
    });
  }

  // SYSTEM 4: Toptandan Perakendeye (Verilen Satış Fiyatından Kârlılık Hesabı)
  static calculateSystem4({ retailPrice, unitCost, commission = 19, cargo = 110 }) {
    const price = parseFloat(retailPrice) || 0;
    const cost = parseFloat(unitCost) || 0;
    const commDec = (parseFloat(commission) || 0) / 100;
    const kargo = parseFloat(cargo) || 0;

    const commFee = price * commDec;
    const payout = price - commFee - kargo;
    const netProfit = payout - cost;
    const marginPercent = price > 0 ? (netProfit / price) * 100 : 0;

    return {
      retailPrice: price,
      unitCost: cost,
      commFee: parseFloat(commFee.toFixed(2)),
      cargoFee: kargo,
      payout: parseFloat(payout.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      marginPercent: parseFloat(marginPercent.toFixed(1))
    };
  }

  static formatTL(val) {
    if (isNaN(val)) return "0.00 ₺";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);
  }
}

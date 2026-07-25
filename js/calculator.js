// CanFiyat Complete Calculation Engine (Systems 1, 2, 3 & 4 with ml, gr, kg support)

class PriceCalculator {
  // Convert any volume/weight string (e.g. 20ml, 50gr, 0.5kg, 1kg) into ml/gr numeric value
  static getVolumeMl(volumeStr) {
    if (!volumeStr) return 250;
    const str = String(volumeStr).toLowerCase().trim();

    if (str.includes("kg")) {
      const num = parseFloat(str.replace("kg", "").trim());
      return isNaN(num) ? 1000 : num * 1000;
    }
    if (str.includes("gr") || str.includes("g")) {
      const num = parseFloat(str.replace("gr", "").replace("g", "").trim());
      return isNaN(num) ? 250 : num;
    }
    if (str.includes("ml")) {
      const num = parseFloat(str.replace("ml", "").trim());
      return isNaN(num) ? 250 : num;
    }

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 250 : parsed;
  }

  // Calculate Unit Wholesale Cost for a specific volume size
  static calculateUnitWholesaleCost(costPerKg, volumeStr, packagingCost = null) {
    const ml = this.getVolumeMl(volumeStr);
    const rawOilCost = (costPerKg / 1000) * ml;
    const packCost = (packagingCost !== null && packagingCost !== undefined && !isNaN(packagingCost)) 
      ? parseFloat(packagingCost) 
      : (DEFAULT_PACKAGING_COSTS[volumeStr] || 14.50);
      
    return parseFloat((rawOilCost + packCost).toFixed(2));
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
    
    const webCommFee = price * (iyComm / 100);
    const webPayout = price - webCommFee - iyCargo;
    const webProfit = webPayout - cost;

    const ty = this.calculateSystem1Channel({
      wholesaleCost: cost,
      targetProfit: Math.max(0, webProfit),
      commission: tyComm,
      discount: 0,
      cargo: tyCargo
    });

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

  // SYSTEM 3: Hacim & Gramaj Ölçeklendirme Matrisi
  static calculateSystem3VolumeMatrix(costPerKg, targetProfitPerUnit = 70) {
    const volumes = ["20ml", "30ml", "50ml", "100ml", "250ml", "500ml", "1000ml"];
    return volumes.map(vol => {
      const packagingCost = DEFAULT_PACKAGING_COSTS[vol] || 14.50;
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

  // SYSTEM 4: Toptandan Perakendeye
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

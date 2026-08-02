// CanFiyat Complete Calculation Engine (Systems 1, 2, 3, 4 & 5 - Trendyol Campaign Simulator)

class PriceCalculator {
  // Convert any volume/weight string into numeric ml/gr value
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

  static getVolumeKgRatio(volumeStr) {
    const ml = this.getVolumeMl(volumeStr);
    return ml / 1000;
  }

  // Time & Labor Handling Overhead Matrix per Bottle Volume Size
  static getOverheadForVolume(volKey, overheadPerKg = 110.00) {
    const ml = this.getVolumeMl(volKey);
    const kg = ml / 1000;
    
    // Base linear volume overhead (Elektrik / Enerji Payı)
    const linearVolumeOverhead = overheadPerKg * kg;
    
    // Packaging Handling & Pipette/Labor Assembly Surcharge per Bottle
    let laborAssemblyFee = 8.00;
    if (volKey === "1000ml" || volKey === "1kg") laborAssemblyFee = 10.00;
    else if (volKey === "500ml") laborAssemblyFee = 9.00;
    else if (volKey === "250ml") laborAssemblyFee = 8.00;
    else if (volKey === "100ml") laborAssemblyFee = 7.50;
    else if (volKey === "50ml") laborAssemblyFee = 9.50;  // dropper assembly
    else if (volKey === "30ml") laborAssemblyFee = 14.70; // pipette + box assembly
    else if (volKey === "20ml") laborAssemblyFee = 17.80; // roll-on / pipette assembly
    else if (volKey === "5000ml" || volKey === "5kg") laborAssemblyFee = 15.00;

    return parseFloat((linearVolumeOverhead + laborAssemblyFee).toFixed(2));
  }

  // Endüstriyel Soğuk Sıkım Yağ Maliyeti (Tohum, Verim, Toptan ve Dip/Tortu Loss Hesabı)
  static calculateColdPressCost({ seedCostPerKg = 0, yieldPercent = 25, wholesaleCostPerKg = 0, supplyType = "press", dipStatus = "none", dipPercent = 0, fallbackCostPerKg = 1200 }) {
    let rawCostPerKg = 0;

    if (supplyType === "wholesale") {
      rawCostPerKg = parseFloat(wholesaleCostPerKg) || parseFloat(fallbackCostPerKg) || 1200;
    } else {
      const seedCost = parseFloat(seedCostPerKg) || 0;
      const yieldPct = parseFloat(yieldPercent) || 0;
      if (yieldPct > 0 && seedCost > 0) {
        rawCostPerKg = parseFloat((seedCost / (yieldPct / 100)).toFixed(2));
      } else {
        rawCostPerKg = parseFloat(wholesaleCostPerKg) || parseFloat(fallbackCostPerKg) || 1200;
      }
    }

    // Dip / Tortu Fire Loss Adjustment
    let netCostPerKg = rawCostPerKg;
    const dipPct = parseFloat(dipPercent) || 0;
    if ((dipStatus === "has_dip" || dipStatus === "dip" || dipStatus === true) && dipPct > 0 && dipPct < 100) {
      netCostPerKg = parseFloat((rawCostPerKg / (1 - (dipPct / 100))).toFixed(2));
    }

    return {
      rawCostPerKg: rawCostPerKg,
      dipLossPercent: dipPct,
      netCostPerKg: netCostPerKg
    };
  }

  // Endüstriyel Maserasyon Yağ Maliyeti (Hammadde KG & Zeytinyağı KG Oranlı Otomatik Maliyet Motoru)
  static calculateMacerationCost({ herbCostPerKg = 0, oliveOilCostPerKg = 454.50, herbRatioKg = null, herbKg = null, oilKg = null, supplyType = "press", wholesaleCostPerKg = 0, fallbackCostPerKg = 600 }) {
    if (supplyType === "wholesale") {
      const net = parseFloat(wholesaleCostPerKg) || parseFloat(fallbackCostPerKg) || 600;
      return {
        herbCostComponent: 0,
        oliveOilCostComponent: net,
        calculatedRatio: 0,
        netCostPerKg: net
      };
    }

    const hCost = parseFloat(herbCostPerKg) || 0;
    const ooCost = parseFloat(oliveOilCostPerKg) || 454.50;
    
    let ratio = 0.2;
    const hKg = parseFloat(herbKg);
    const oKg = parseFloat(oilKg);

    if (!isNaN(hKg) && !isNaN(oKg) && oKg > 0) {
      ratio = hKg / oKg;
    } else if (herbRatioKg !== null && !isNaN(parseFloat(herbRatioKg))) {
      ratio = parseFloat(herbRatioKg);
    }

    const herbComp = parseFloat((hCost * ratio).toFixed(2));
    const netCostPerKg = parseFloat((herbComp + ooCost).toFixed(2));

    return {
      herbCostComponent: herbComp,
      oliveOilCostComponent: ooCost,
      calculatedRatio: parseFloat(ratio.toFixed(4)),
      netCostPerKg: netCostPerKg
    };
  }

  // LAYER 2: Complete 3-Component Factory Cost Breakdown
  static calculateLayer2FullBreakdown({ costPerKg, volumeStr, packagingCost, overheadPerKg = 110.00 }) {
    const ml = this.getVolumeMl(volumeStr);
    const rawOilCost = parseFloat(((costPerKg / 1000) * ml).toFixed(2));
    
    const packCost = (packagingCost !== null && packagingCost !== undefined && !isNaN(packagingCost)) 
      ? parseFloat(packagingCost) 
      : (DEFAULT_PACKAGING_COSTS[volumeStr] || 14.50);
      
    const overheadCost = this.getOverheadForVolume(volumeStr, overheadPerKg);
    const totalNetFactoryCost = parseFloat((rawOilCost + packCost + overheadCost).toFixed(2));
    
    return {
      rawOilCost,
      packCost,
      overheadCost,
      totalNetFactoryCost
    };
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

  // SYSTEM 1: Toptan Maliyet + Hedef Kâr -> Kanal Satış Fiyatları & Hakediş (100% Banka Hakediş Kuruş Hassasiyeti)
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

    // 1. Pazaryerine Yansıyacak Gerçek Etiket Satış Fiyatı (Kuruş Yuvarlamalı)
    const salePrice = parseFloat(((neededPayout + kargo) / commFactor).toFixed(2));
    const listPrice = parseFloat((salePrice / discFactor).toFixed(2));
    
    // 2. Pazaryerinin Satış Fiyatı Üzerinden Kestiği Gerçek Komisyon Tutar (Kuruş Yuvarlamalı)
    const commAmount = parseFloat((salePrice * commDec).toFixed(2));
    
    // 3. Banka Hesabınıza Yatan Gerçek Hakediş ve Net Kâr
    const payout = parseFloat((salePrice - commAmount - kargo).toFixed(2));
    const netProfit = parseFloat((payout - maliyet).toFixed(2));

    return {
      listPrice: listPrice,
      salePrice: salePrice,
      commAmount: commAmount,
      cargoFee: parseFloat(kargo.toFixed(2)),
      payout: payout,
      wholesaleCost: parseFloat(maliyet.toFixed(2)),
      netProfit: netProfit
    };
  }

  // SYSTEM 2: İyzico (Web) Fiyatından Diğer Pazaryerlerine Eşitleme
  static calculateSystem2({ webSalePrice, unitCost, tyComm = 19, tyCargo = 110, hbComm = 17, hbCargo = 110, iyComm = 4, iyCargo = 82.50 }) {
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

  // SYSTEM 5: Trendyol Avantajlı Ürün Etiketleri Kampanya Simülasyonu
  static calculateSystem5CampaignMatrix(costPerKg, avDisc = 10, cakDisc = 18, supDisc = 30, comm = 19, cargo = 110) {
    const volumes = ["20ml", "30ml", "50ml", "100ml", "250ml", "500ml", "1000ml"];
    return volumes.map(vol => {
      const packagingCost = DEFAULT_PACKAGING_COSTS[vol] || 14.50;
      const unitCost = this.calculateUnitWholesaleCost(costPerKg, vol, packagingCost);
      
      // Base System 1 price for 70 TL profit
      const stdRes = this.calculateSystem1Channel({
        wholesaleCost: unitCost,
        targetProfit: 70,
        commission: comm,
        discount: 0,
        cargo: cargo
      });

      const baseListPrice = stdRes.listPrice;

      // 1. Avantajlı Fiyat (% avDisc discount)
      const avPrice = parseFloat((baseListPrice * (1 - avDisc / 100)).toFixed(2));
      const avComm = parseFloat((avPrice * (comm / 100)).toFixed(2));
      const avPayout = parseFloat((avPrice - avComm - cargo).toFixed(2));
      const avProfit = parseFloat((avPayout - unitCost).toFixed(2));

      // 2. Çok Avantajlı Fiyat (% cakDisc discount)
      const cakPrice = parseFloat((baseListPrice * (1 - cakDisc / 100)).toFixed(2));
      const cakComm = parseFloat((cakPrice * (comm / 100)).toFixed(2));
      const cakPayout = parseFloat((cakPrice - cakComm - cargo).toFixed(2));
      const cakProfit = parseFloat((cakPayout - unitCost).toFixed(2));

      // 3. Süper Avantajlı Fiyat (% supDisc discount)
      const supPrice = parseFloat((baseListPrice * (1 - supDisc / 100)).toFixed(2));
      const supComm = parseFloat((supPrice * (comm / 100)).toFixed(2));
      const supPayout = parseFloat((supPrice - supComm - cargo).toFixed(2));
      const supProfit = parseFloat((supPayout - unitCost).toFixed(2));

      return {
        volume: vol,
        unitCost: unitCost,
        baseListPrice: baseListPrice,
        av: { price: avPrice, payout: avPayout, profit: avProfit },
        cak: { price: cakPrice, payout: cakPayout, profit: cakProfit },
        sup: { price: supPrice, payout: supPayout, profit: supProfit }
      };
    });
  }

  static calculateFactoryOverheadPerKg(config = {}) {
    const salaries = parseFloat(config.salaries) ?? 200000;
    const sgk = parseFloat(config.sgk) ?? 50000;
    const electricity = parseFloat(config.electricity) ?? 20000;
    const catering = parseFloat(config.catering) ?? 60000;
    const rentSarf = parseFloat(config.rentSarf) ?? 0;
    const monthlyCapacityKg = parseFloat(config.monthlyCapacityKg) || 8714;

    const totalMonthlyOverhead = salaries + sgk + electricity + catering + rentSarf;
    const calculatedOverheadPerKg = monthlyCapacityKg > 0 ? parseFloat((totalMonthlyOverhead / monthlyCapacityKg).toFixed(2)) : 0;

    return {
      salaries,
      sgk,
      electricity,
      catering,
      rentSarf,
      monthlyCapacityKg,
      totalMonthlyOverhead,
      overheadPerKg: calculatedOverheadPerKg
    };
  }

  static calculateTrueProductionCost(params = {}) {
    const seedCostPerKg = parseFloat(params.seedCostPerKg) || 0;
    const yieldPercent = parseFloat(params.yieldPercent) || 25;
    const volumeStr = params.volumeStr || "1000ml";
    const packagingCost = parseFloat(params.packagingCost) || 14.50;
    const overheadPerKg = parseFloat(params.overheadPerKg) || 35.00;

    const rawOilCostPerKg = yieldPercent > 0 ? (seedCostPerKg / (yieldPercent / 100)) : 0;
    const totalOilCostPerKg = rawOilCostPerKg + overheadPerKg;

    const volNum = parseFloat(volumeStr.replace("ml", "")) || 1000;
    const oilPortionCost = (totalOilCostPerKg / 1000) * volNum;

    const trueProductionCost = oilPortionCost + packagingCost;

    return {
      rawOilCostPerKg: parseFloat(rawOilCostPerKg.toFixed(2)),
      totalOilCostPerKg: parseFloat(totalOilCostPerKg.toFixed(2)),
      oilPortionCost: parseFloat(oilPortionCost.toFixed(2)),
      packagingCost: packagingCost,
      overheadPerKg: overheadPerKg,
      trueProductionCost: parseFloat(trueProductionCost.toFixed(2))
    };
  }

  // Kırmızı Çizgi / Başabaş Satış Fiyatı (0 TL Net Kâr İçin Dip Satış Fiyatı)
  static calculateBreakEvenPrice({ wholesaleCost, commission = 19, cargo = 110 }) {
    const cost = parseFloat(wholesaleCost) || 0;
    const commDec = (parseFloat(commission) || 0) / 100;
    const cargoFee = parseFloat(cargo) || 0;

    const commFactor = commDec >= 1 ? 0.99 : (1 - commDec);
    const breakEvenPrice = parseFloat(((cost + cargoFee) / commFactor).toFixed(2));
    const commAmount = parseFloat((breakEvenPrice * commDec).toFixed(2));
    const payout = parseFloat((breakEvenPrice - commAmount - cargoFee).toFixed(2));
    const netProfit = parseFloat((payout - cost).toFixed(2));

    return {
      breakEvenPrice: breakEvenPrice,
      commAmount: commAmount,
      cargoFee: cargoFee,
      payout: payout,
      netProfit: netProfit
    };
  }

  // Kombin / Set Paket Kârlılık Simülatörü (100% Banka Kuruş Hassasiyeti)
  static calculateBundleSim({ itemsCostList = [], bundlePrice = 0, commission = 19, cargo = 110 }) {
    const price = parseFloat(bundlePrice) || 0;
    const commDec = (parseFloat(commission) || 0) / 100;
    const singleCargoFee = parseFloat(cargo) || 0;

    const totalItemsWholesaleCost = itemsCostList.reduce((acc, c) => acc + (parseFloat(c) || 0), 0);
    const commAmount = parseFloat((price * commDec).toFixed(2));
    const payout = parseFloat((price - commAmount - singleCargoFee).toFixed(2));
    const netProfit = parseFloat((payout - totalItemsWholesaleCost).toFixed(2));

    const itemCount = itemsCostList.length || 1;
    const savedCargoAmount = Math.max(0, (itemCount - 1) * singleCargoFee);

    return {
      bundlePrice: price,
      totalItemsWholesaleCost: parseFloat(totalItemsWholesaleCost.toFixed(2)),
      commAmount: commAmount,
      cargoFee: singleCargoFee,
      payout: payout,
      netProfit: netProfit,
      savedCargoAmount: parseFloat(savedCargoAmount.toFixed(2))
    };
  }

  static formatTL(val) {
    if (isNaN(val)) return "0.00 ₺";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);
  }
}

/**
 * MediQ Jan Aushadhi (PMBJP) Generic Salt Equivalence & Savings Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Provides automated salt-level bioequivalence lookup between premium branded
 * pharmaceuticals and Government-subsidized Pradhan Mantri Bhartiya Janaushadhi
 * Pariyojana (PMBJP) generic formulations.
 */

export const JAN_AUSHADHI_CATALOG = [
  {
    saltComposition: 'Paracetamol 650mg',
    brandName: 'Dolo 650',
    genericName: 'Paracetamol Tablets IP 650mg',
    pmbjpProductCode: 'PMBJP-TAB-014',
    category: 'Analgesic & Antipyretic',
    brandedMrp: 32.50,
    pmbjpPrice: 5.50,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxycillin and Potassium Clavulanate Tablets IP 625mg',
    pmbjpProductCode: 'PMBJP-TAB-088',
    category: 'Antibiotic',
    brandedMrp: 204.80,
    pmbjpPrice: 52.00,
    unitPack: '10 Tablets',
  },
  {
    saltComposition: 'Pantoprazole Gastro-resistant 40mg',
    brandName: 'Pan 40',
    genericName: 'Pantoprazole Gastro-resistant Tablets IP 40mg',
    pmbjpProductCode: 'PMBJP-TAB-212',
    category: 'Antacid / PPI',
    brandedMrp: 145.00,
    pmbjpPrice: 22.50,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Metformin Hydrochloride Prolonged-Release 500mg',
    brandName: 'Glycomet 500 SR',
    genericName: 'Metformin Hydrochloride Prolonged-Release Tablets IP 500mg',
    pmbjpProductCode: 'PMBJP-TAB-134',
    category: 'Anti-Diabetic',
    brandedMrp: 48.20,
    pmbjpPrice: 9.00,
    unitPack: '20 Tablets',
  },
  {
    saltComposition: 'Telmisartan 40mg',
    brandName: 'Telma 40',
    genericName: 'Telmisartan Tablets IP 40mg',
    pmbjpProductCode: 'PMBJP-TAB-301',
    category: 'Anti-Hypertensive',
    brandedMrp: 128.50,
    pmbjpPrice: 18.00,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Atorvastatin 10mg',
    brandName: 'Atorva 10',
    genericName: 'Atorvastatin Tablets IP 10mg',
    pmbjpProductCode: 'PMBJP-TAB-045',
    category: 'Lipid-Lowering / Statin',
    brandedMrp: 110.00,
    pmbjpPrice: 14.20,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Montelukast 10mg + Levocetirizine 5mg',
    brandName: 'Montair LC',
    genericName: 'Montelukast Sodium and Levocetirizine Dihydrochloride Tablets IP',
    pmbjpProductCode: 'PMBJP-TAB-178',
    category: 'Anti-Allergic / Respiratory',
    brandedMrp: 198.00,
    pmbjpPrice: 32.00,
    unitPack: '10 Tablets',
  },
  {
    saltComposition: 'Azithromycin 500mg',
    brandName: 'Azee 500',
    genericName: 'Azithromycin Tablets IP 500mg',
    pmbjpProductCode: 'PMBJP-TAB-056',
    category: 'Antibiotic (Macrolide)',
    brandedMrp: 125.00,
    pmbjpPrice: 38.00,
    unitPack: '5 Tablets',
  },
  {
    saltComposition: 'Omeprazole 20mg',
    brandName: 'Omez 20',
    genericName: 'Omeprazole Capsules IP 20mg',
    pmbjpProductCode: 'PMBJP-CAP-032',
    category: 'Antacid / PPI',
    brandedMrp: 62.00,
    pmbjpPrice: 11.00,
    unitPack: '15 Capsules',
  },
  {
    saltComposition: 'Cetirizine Hydrochloride 10mg',
    brandName: 'Cetzine',
    genericName: 'Cetirizine Hydrochloride Tablets IP 10mg',
    pmbjpProductCode: 'PMBJP-TAB-072',
    category: 'Anti-Histamine',
    brandedMrp: 40.00,
    pmbjpPrice: 6.20,
    unitPack: '10 Tablets',
  },
  {
    saltComposition: 'Rosuvastatin 10mg',
    brandName: 'Rozavel 10',
    genericName: 'Rosuvastatin Tablets IP 10mg',
    pmbjpProductCode: 'PMBJP-TAB-280',
    category: 'Lipid-Lowering / Statin',
    brandedMrp: 185.00,
    pmbjpPrice: 24.00,
    unitPack: '10 Tablets',
  },
  {
    saltComposition: 'Glimepiride 2mg',
    brandName: 'Amaryl 2',
    genericName: 'Glimepiride Tablets IP 2mg',
    pmbjpProductCode: 'PMBJP-TAB-120',
    category: 'Anti-Diabetic',
    brandedMrp: 98.00,
    pmbjpPrice: 14.00,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Losartan Potassium 50mg',
    brandName: 'Losar 50',
    genericName: 'Losartan Potassium Tablets IP 50mg',
    pmbjpProductCode: 'PMBJP-TAB-152',
    category: 'Anti-Hypertensive',
    brandedMrp: 86.50,
    pmbjpPrice: 12.00,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Ciprofloxacin 500mg',
    brandName: 'Ciplox 500',
    genericName: 'Ciprofloxacin Tablets IP 500mg',
    pmbjpProductCode: 'PMBJP-TAB-094',
    category: 'Antibiotic (Fluoroquinolone)',
    brandedMrp: 45.00,
    pmbjpPrice: 16.00,
    unitPack: '10 Tablets',
  },
  {
    saltComposition: 'Amlodipine Besylate 5mg',
    brandName: 'Amlong 5',
    genericName: 'Amlodipine Besylate Tablets IP 5mg',
    pmbjpProductCode: 'PMBJP-TAB-022',
    category: 'Calcium Channel Blocker',
    brandedMrp: 38.00,
    pmbjpPrice: 6.50,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Pantoprazole 40mg + Domperidone 30mg SR',
    brandName: 'Pan-D',
    genericName: 'Pantoprazole (EC) and Domperidone (SR) Capsules',
    pmbjpProductCode: 'PMBJP-CAP-048',
    category: 'Gastrointestinal',
    brandedMrp: 195.00,
    pmbjpPrice: 35.00,
    unitPack: '15 Capsules',
  },
  {
    saltComposition: 'Ibuprofen 400mg + Paracetamol 325mg',
    brandName: 'Combiflam',
    genericName: 'Ibuprofen and Paracetamol Tablets IP',
    pmbjpProductCode: 'PMBJP-TAB-106',
    category: 'NSAID / Analgesic',
    brandedMrp: 45.50,
    pmbjpPrice: 12.00,
    unitPack: '20 Tablets',
  },
  {
    saltComposition: 'Cefixime 200mg',
    brandName: 'Taxim-O 200',
    genericName: 'Cefixime Dispersible Tablets IP 200mg',
    pmbjpProductCode: 'PMBJP-TAB-082',
    category: 'Antibiotic (Cephalosporin)',
    brandedMrp: 110.00,
    pmbjpPrice: 38.00,
    unitPack: '10 Tablets',
  },
  {
    saltComposition: 'Rabeprazole Sodium 20mg',
    brandName: 'Razo 20',
    genericName: 'Rabeprazole Sodium Tablets IP 20mg',
    pmbjpProductCode: 'PMBJP-TAB-245',
    category: 'Antacid / PPI',
    brandedMrp: 155.00,
    pmbjpPrice: 25.00,
    unitPack: '15 Tablets',
  },
  {
    saltComposition: 'Calcium Carbonate 1250mg (Eq to 500mg Ca) + Vitamin D3 250 IU',
    brandName: 'Shelcal 500',
    genericName: 'Calcium with Vitamin D3 Tablets IP',
    pmbjpProductCode: 'PMBJP-TAB-064',
    category: 'Nutritional Supplement',
    brandedMrp: 132.00,
    pmbjpPrice: 28.00,
    unitPack: '15 Tablets',
  },
];

/**
 * Normalizes an arbitrary query string for case, spacing, and punctuation.
 */
function normalizeQuery(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds generic Jan Aushadhi equivalent for a branded medicine name or active salt.
 * 
 * @param {string} medicineQuery - Branded drug name (e.g. 'Dolo 650', 'Augmentin') or salt.
 * @returns {Object|null} Generic equivalent metadata and computed savings percentage.
 */
export function findGenericAlternative(medicineQuery) {
  if (!medicineQuery || typeof medicineQuery !== 'string') return null;

  const normalized = normalizeQuery(medicineQuery);

  const matched = JAN_AUSHADHI_CATALOG.find((entry) => {
    const normBrand = normalizeQuery(entry.brandName);
    const normSalt = normalizeQuery(entry.saltComposition);
    const normGeneric = normalizeQuery(entry.genericName);

    return (
      normBrand.includes(normalized) ||
      normalized.includes(normBrand) ||
      normSalt.includes(normalized) ||
      normalized.includes(normSalt) ||
      normGeneric.includes(normalized)
    );
  });

  if (!matched) return null;

  const absoluteSavings = Number((matched.brandedMrp - matched.pmbjpPrice).toFixed(2));
  const percentageSavings = Number(((absoluteSavings / matched.brandedMrp) * 100).toFixed(1));

  return {
    ...matched,
    absoluteSavings,
    percentageSavings,
    savingsBadge: `${percentageSavings}% Cheaper`,
  };
}

/**
 * Calculates total financial savings on an entire prescription or cart.
 * 
 * @param {Array<{ brandName: string, quantity: number }>} items - List of prescribed items.
 * @returns {Object} Comprehensive prescription savings breakdown.
 */
export function calculatePrescriptionSavings(items = []) {
  let totalBrandedCost = 0;
  let totalGenericCost = 0;
  const processedItems = [];

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const match = findGenericAlternative(item.brandName);

    if (match) {
      const brandedSubtotal = Number((match.brandedMrp * qty).toFixed(2));
      const genericSubtotal = Number((match.pmbjpPrice * qty).toFixed(2));
      const subtotalSavings = Number((brandedSubtotal - genericSubtotal).toFixed(2));

      totalBrandedCost += brandedSubtotal;
      totalGenericCost += genericSubtotal;

      processedItems.push({
        requested: item.brandName,
        quantity: qty,
        foundEquivalent: true,
        genericName: match.genericName,
        pmbjpProductCode: match.pmbjpProductCode,
        brandedSubtotal,
        genericSubtotal,
        subtotalSavings,
      });
    } else {
      // No Jan Aushadhi equivalent cataloged; assume passthrough branded price
      const fallbackPrice = item.fallbackMrp || 0;
      totalBrandedCost += fallbackPrice * qty;
      totalGenericCost += fallbackPrice * qty;

      processedItems.push({
        requested: item.brandName,
        quantity: qty,
        foundEquivalent: false,
        genericName: null,
        pmbjpProductCode: null,
        brandedSubtotal: fallbackPrice * qty,
        genericSubtotal: fallbackPrice * qty,
        subtotalSavings: 0,
      });
    }
  }

  const totalSaved = Number((totalBrandedCost - totalGenericCost).toFixed(2));
  const overallSavingsPct = totalBrandedCost > 0
    ? Number(((totalSaved / totalBrandedCost) * 100).toFixed(1))
    : 0;

  return {
    totalItems: items.length,
    genericEquivalentsFound: processedItems.filter((i) => i.foundEquivalent).length,
    totalBrandedCost: Number(totalBrandedCost.toFixed(2)),
    totalGenericCost: Number(totalGenericCost.toFixed(2)),
    totalSaved,
    overallSavingsPct,
    items: processedItems,
  };
}

/**
 * Searches the Jan Aushadhi catalog by active chemical salt or therapeutic category.
 * 
 * @param {string} saltOrCategory - E.g. 'Antibiotic', 'Paracetamol', 'PPI'.
 * @returns {Array<Object>} Matching catalog entries.
 */
export function searchBySaltOrCategory(saltOrCategory) {
  if (!saltOrCategory) return [];
  const term = saltOrCategory.toLowerCase();

  return JAN_AUSHADHI_CATALOG.filter((item) => {
    return (
      item.saltComposition.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.genericName.toLowerCase().includes(term)
    );
  });
}

// ── Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Kendra Directory ──

export const PMBJP_KENDRA_DIRECTORY = [
  {
    kendraId: 'PMBJP-GJ-AHM-001',
    name: 'Jan Aushadhi Kendra — Gota Cross Road',
    address: 'Shop 12, Satyam Complex, Near Silver Oak University, Gota, Ahmedabad - 382481',
    latitude: 23.0882,
    longitude: 72.5312,
    phone: '+91 79 2766 1120',
    operatingHours: '08:00 AM - 10:00 PM',
    rating: 4.8,
    isOpen: true,
    hasGenericStock: true,
  },
  {
    kendraId: 'PMBJP-GJ-AHM-002',
    name: 'Jan Aushadhi Kendra — Sola Civil Hospital Gate',
    address: 'Near Trauma Center Gate, Sola Civil Hospital Road, Ahmedabad - 380060',
    latitude: 23.0768,
    longitude: 72.5254,
    phone: '+91 79 2766 4501',
    operatingHours: '24 Hours',
    rating: 4.9,
    isOpen: true,
    hasGenericStock: true,
  },
  {
    kendraId: 'PMBJP-GJ-AHM-003',
    name: 'Jan Aushadhi Kendra — Ghatlodia T-Point',
    address: 'Ground Floor, Shanti Chambers, Ghatlodia, Ahmedabad - 380061',
    latitude: 23.0645,
    longitude: 72.5410,
    phone: '+91 79 2741 8892',
    operatingHours: '09:00 AM - 09:30 PM',
    rating: 4.6,
    isOpen: true,
    hasGenericStock: true,
  },
  {
    kendraId: 'PMBJP-GJ-AHM-004',
    name: 'Jan Aushadhi Kendra — Chandlodiya Station Road',
    address: 'Near Railway Crossing, Chandlodiya, Ahmedabad - 382481',
    latitude: 23.0811,
    longitude: 72.5488,
    phone: '+91 79 2760 3341',
    operatingHours: '08:30 AM - 09:00 PM',
    rating: 4.5,
    isOpen: true,
    hasGenericStock: true,
  },
  {
    kendraId: 'PMBJP-GJ-AHM-005',
    name: 'Jan Aushadhi Kendra — Bopal Ambli Road',
    address: 'Shop 4, Gala Empire, South Bopal, Ahmedabad - 380058',
    latitude: 23.0338,
    longitude: 72.4632,
    phone: '+91 79 2970 5512',
    operatingHours: '09:00 AM - 10:00 PM',
    rating: 4.7,
    isOpen: true,
    hasGenericStock: true,
  },
];

export function calculateGeoDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function findNearestJanAushadhiKendras(userLat, userLng, maxRadiusKm = 15, limit = 3) {
  if (userLat === undefined || userLng === undefined || isNaN(userLat) || isNaN(userLng)) {
    throw new Error('Valid user coordinates (latitude, longitude) are required');
  }

  return PMBJP_KENDRA_DIRECTORY.map((kendra) => {
    const distanceKm = calculateGeoDistanceKm(userLat, userLng, kendra.latitude, kendra.longitude);
    const estimatedMinutes = Math.max(3, Math.round(distanceKm * 3.5 + 2));

    return {
      ...kendra,
      distanceKm,
      estimatedTravelMinutes: estimatedMinutes,
      withinSearchRadius: distanceKm <= maxRadiusKm,
    };
  })
    .filter((k) => k.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function calculatePrescriptionSavingsWithNearestKendra({ items, userLat, userLng, maxRadiusKm = 15 }) {
  const savings = calculatePrescriptionSavings(items);
  const kendras = findNearestJanAushadhiKendras(userLat, userLng, maxRadiusKm);

  return {
    ...savings,
    nearestKendra: kendras.length > 0 ? kendras[0] : null,
    alternativeKendras: kendras.slice(1),
    recommendedSavingsMessage:
      savings.overallSavingsPct >= 70
        ? `Switching to Jan Aushadhi generic equivalents saves ${savings.overallSavingsPct}% (₹${savings.totalSaved}) at your nearest Kendra.`
        : `Jan Aushadhi generic alternatives save ₹${savings.totalSaved}.`,
  };
}


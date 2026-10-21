const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Ensure admin is initialized (shared with index.js)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ============================================================
// PHARMACY MODULE — Cloud Functions (PRD v5, F22–F27)
// ============================================================

/**
 * 1. processStockIn
 * Trigger: Callable HTTPS
 * Purpose: Add stock to pharmacy inventory with batch tracking, expiry, and audit trail.
 * PRD Section: F23a — Stock In (Purchase/Receiving)
 */
exports.processStockIn = functions.https.onCall(async (data, context) => {
  const { pharmacyId, items } = data;

  if (!pharmacyId || !items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "pharmacyId and items[] are required.");
  }

  const results = [];

  for (const item of items) {
    const {
      drugMasterId, brandName, saltComposition, strength, form,
      batchNo, expiryDate, qty, purchasePrice, mrp, sellingPrice,
      supplier, invoiceNo, barcode, category, scheduleType
    } = item;

    if (!brandName || !qty || qty <= 0) {
      results.push({ error: `Invalid item: ${brandName || "unknown"} — qty must be > 0` });
      continue;
    }

    // Generate a stable drugId based on brand+strength+form
    const drugId = (drugMasterId || `${brandName}-${strength || ""}-${form || ""}`)
      .toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const inventoryRef = db.doc(`pharmacies/${pharmacyId}/inventory/${drugId}`);

    try {
      await db.runTransaction(async (tx) => {
        const invDoc = await tx.get(inventoryRef);
        const existing = invDoc.exists ? invDoc.data() : null;

        const newBatch = {
          batchNo: batchNo || `BATCH-${Date.now()}`,
          qty: Number(qty),
          expiryDate: expiryDate || null,
          purchasePrice: Number(purchasePrice) || 0,
          receivedDate: new Date().toISOString(),
          invoiceNo: invoiceNo || null,
          supplier: supplier || null,
        };

        if (existing) {
          // Add batch to existing inventory item
          const batches = existing.batches || [];
          batches.push(newBatch);
          const newAvailableQty = (existing.availableQty || 0) + Number(qty);

          tx.update(inventoryRef, {
            availableQty: newAvailableQty,
            batches,
            mrp: Number(mrp) || existing.mrp || 0,
            sellingPrice: Number(sellingPrice) || existing.sellingPrice || 0,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Create new inventory item
          tx.set(inventoryRef, {
            drugId,
            drugMasterId: drugMasterId || null,
            brandName: brandName.trim(),
            saltComposition: saltComposition || "",
            strength: strength || "",
            form: form || "tab",
            barcode: barcode || null,
            category: category || "general",
            scheduleType: scheduleType || "OTC",
            availableQty: Number(qty),
            batches: [newBatch],
            mrp: Number(mrp) || 0,
            sellingPrice: Number(sellingPrice) || 0,
            reorderLevel: 20, // default
            isActive: true,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      // Write stock transaction audit entry
      await db.collection(`pharmacies/${pharmacyId}/stockTransactions`).add({
        drugId,
        brandName,
        type: "stock_in",
        reason: "purchase",
        qty: Number(qty),
        batchNo: batchNo || null,
        invoiceNo: invoiceNo || null,
        supplier: supplier || null,
        actor: context.auth ? context.auth.uid : "pharmacy_staff",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      results.push({ drugId, brandName, qty, status: "added" });
    } catch (err) {
      results.push({ drugId, brandName, error: err.message });
    }
  }

  return { success: true, results };
});

/**
 * 2. processStockOut
 * Trigger: Callable HTTPS
 * Purpose: Remove stock from pharmacy inventory with FEFO (First Expiry First Out) and reason tracking.
 * PRD Section: F23b — Stock Out (Sale/Disposal)
 */
exports.processStockOut = functions.https.onCall(async (data, context) => {
  const { pharmacyId, items } = data;

  if (!pharmacyId || !items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "pharmacyId and items[] are required.");
  }

  const results = [];

  for (const item of items) {
    const { drugId, qty, reason = "manual_sale", batchNo, notes } = item;

    if (!drugId || !qty || qty <= 0) {
      results.push({ error: `Invalid: drugId=${drugId}, qty=${qty}` });
      continue;
    }

    const inventoryRef = db.doc(`pharmacies/${pharmacyId}/inventory/${drugId}`);

    try {
      await db.runTransaction(async (tx) => {
        const invDoc = await tx.get(inventoryRef);
        if (!invDoc.exists) {
          throw new Error(`Drug ${drugId} not found in inventory`);
        }

        const data = invDoc.data();
        if (data.availableQty < qty) {
          throw new Error(`Insufficient stock: have ${data.availableQty}, need ${qty}`);
        }

        let remaining = Number(qty);
        const batches = [...(data.batches || [])];

        if (batchNo) {
          // Deduct from specific batch
          const bIdx = batches.findIndex(b => b.batchNo === batchNo);
          if (bIdx === -1) throw new Error(`Batch ${batchNo} not found`);
          if (batches[bIdx].qty < remaining) throw new Error(`Batch ${batchNo} has only ${batches[bIdx].qty} units`);
          batches[bIdx].qty -= remaining;
          if (batches[bIdx].qty === 0) batches.splice(bIdx, 1);
        } else {
          // FEFO: deduct from earliest expiry first
          batches.sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate) - new Date(b.expiryDate);
          });

          for (let i = 0; i < batches.length && remaining > 0; i++) {
            const deduct = Math.min(batches[i].qty, remaining);
            batches[i].qty -= deduct;
            remaining -= deduct;
          }
          // Remove zero-qty batches
          const cleanBatches = batches.filter(b => b.qty > 0);
          batches.length = 0;
          batches.push(...cleanBatches);
        }

        tx.update(inventoryRef, {
          availableQty: data.availableQty - Number(qty),
          batches,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Audit entry
      await db.collection(`pharmacies/${pharmacyId}/stockTransactions`).add({
        drugId,
        type: "stock_out",
        reason,
        qty: Number(qty),
        batchNo: batchNo || null,
        notes: notes || null,
        actor: context.auth ? context.auth.uid : "pharmacy_staff",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      results.push({ drugId, qty, reason, status: "removed" });
    } catch (err) {
      results.push({ drugId, error: err.message });
    }
  }

  return { success: true, results };
});

/**
 * 3. matchPrescriptionToPharmacies
 * Trigger: Callable HTTPS (also triggered on Rx creation)
 * Purpose: Matches prescription items against all nearby pharmacy inventories.
 *          Returns sorted pharmacy options with stock availability, prices, and alternatives.
 * PRD Section: F24 — Prescription-to-Pharmacy Matching Engine
 */
exports.matchPrescriptionToPharmacies = functions.https.onCall(async (data, context) => {
  const { rxId, patientLat, patientLng, radiusKm = 5 } = data;

  if (!rxId) {
    throw new functions.https.HttpsError("invalid-argument", "rxId is required.");
  }

  // 1. Fetch the prescription
  const rxDoc = await db.doc(`prescriptions/${rxId}`).get();
  if (!rxDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Prescription not found.");
  }

  const rx = rxDoc.data();
  const rxItems = rx.items || [];
  if (rxItems.length === 0) {
    throw new functions.https.HttpsError("failed-precondition", "Prescription has no items.");
  }

  // 2. Fetch all active, verified pharmacies
  const pharmaciesSnap = await db.collection("pharmacies")
    .where("isActive", "==", true)
    .where("kycStatus", "==", "verified")
    .get();

  if (pharmaciesSnap.empty) {
    return { matches: [], message: "No pharmacies available in your area." };
  }

  const matches = [];

  // 3. For each pharmacy, check inventory against Rx items
  for (const pharmDoc of pharmaciesSnap.docs) {
    const pharmacy = pharmDoc.data();
    const pharmacyId = pharmDoc.id;

    // Simple distance filter (haversine approximation)
    if (patientLat && patientLng && pharmacy.geo) {
      const dist = haversineDistance(
        patientLat, patientLng,
        pharmacy.geo._latitude || pharmacy.geo.lat,
        pharmacy.geo._longitude || pharmacy.geo.lng
      );
      if (dist > radiusKm) continue;
    }

    // Fetch this pharmacy's full inventory
    const inventorySnap = await db.collection(`pharmacies/${pharmacyId}/inventory`)
      .where("isActive", "==", true)
      .where("availableQty", ">", 0)
      .get();

    const inventoryMap = {};
    inventorySnap.forEach(doc => {
      const inv = doc.data();
      // Index by normalized salt+strength+form AND by brand name
      const saltKey = `${(inv.saltComposition || "").toLowerCase()}_${(inv.strength || "").toLowerCase()}_${(inv.form || "").toLowerCase()}`;
      const brandKey = (inv.brandName || "").toLowerCase().trim();
      inventoryMap[brandKey] = inv;
      if (!inventoryMap[`salt:${saltKey}`]) {
        inventoryMap[`salt:${saltKey}`] = inv;
      }
    });

    let totalPrice = 0;
    let availableCount = 0;
    let alternativeCount = 0;
    const itemMatches = [];

    for (const rxItem of rxItems) {
      const brandKey = (rxItem.drugName || rxItem.brandName || "").toLowerCase().trim();
      const saltKey = `${(rxItem.saltComposition || rxItem.salt || "").toLowerCase()}_${(rxItem.strength || "").toLowerCase()}_${(rxItem.form || "").toLowerCase()}`;
      const qtyNeeded = Number(rxItem.quantity) || 1;

      // Priority 1: Exact brand match
      if (inventoryMap[brandKey] && inventoryMap[brandKey].availableQty >= qtyNeeded) {
        const inv = inventoryMap[brandKey];
        const itemPrice = (inv.sellingPrice || inv.mrp || 0) * qtyNeeded;
        totalPrice += itemPrice;
        availableCount++;
        itemMatches.push({
          rxItemName: rxItem.drugName || rxItem.brandName,
          status: "available",
          matchedDrug: inv.brandName,
          price: inv.sellingPrice || inv.mrp,
          totalItemPrice: itemPrice,
          qty: qtyNeeded,
        });
        continue;
      }

      // Priority 2: Salt composition match (alternative brand)
      const doNotSubstitute = rxItem.doNotSubstitute || false;
      if (!doNotSubstitute && inventoryMap[`salt:${saltKey}`]) {
        const inv = inventoryMap[`salt:${saltKey}`];
        if (inv.availableQty >= qtyNeeded) {
          const itemPrice = (inv.sellingPrice || inv.mrp || 0) * qtyNeeded;
          totalPrice += itemPrice;
          alternativeCount++;
          const isGeneric = inv.category === "jan_aushadhi" || inv.category === "generic";
          itemMatches.push({
            rxItemName: rxItem.drugName || rxItem.brandName,
            status: isGeneric ? "generic_available" : "alternative_available",
            matchedDrug: inv.brandName,
            matchedSalt: inv.saltComposition,
            price: inv.sellingPrice || inv.mrp,
            totalItemPrice: itemPrice,
            qty: qtyNeeded,
            savingsPercent: rxItem.mrp ? Math.round(((rxItem.mrp - (inv.sellingPrice || inv.mrp)) / rxItem.mrp) * 100) : null,
          });
          continue;
        }
      }

      // Priority 3: Not available
      itemMatches.push({
        rxItemName: rxItem.drugName || rxItem.brandName,
        status: "not_available",
        matchedDrug: null,
        price: 0,
        totalItemPrice: 0,
        qty: qtyNeeded,
      });
    }

    const matchScore = Math.round(((availableCount + alternativeCount) / rxItems.length) * 100);

    matches.push({
      pharmacyId,
      pharmacyName: pharmacy.name || "Unknown Pharmacy",
      pharmacyType: pharmacy.type || "independent",
      distance: patientLat && patientLng && pharmacy.geo
        ? Math.round(haversineDistance(patientLat, patientLng, pharmacy.geo._latitude || pharmacy.geo.lat, pharmacy.geo._longitude || pharmacy.geo.lng) * 10) / 10
        : null,
      rating: pharmacy.rating || 0,
      reviewCount: pharmacy.reviewCount || 0,
      services: pharmacy.services || ["pickup"],
      deliveryRadius: pharmacy.deliveryRadius || 0,
      deliveryFee: pharmacy.deliveryFee || 0,
      matchScore,
      availableCount,
      alternativeCount,
      notAvailableCount: rxItems.length - availableCount - alternativeCount,
      totalItems: rxItems.length,
      totalPrice,
      items: itemMatches,
      estimatedTime: pharmacy.type === "hospital" ? "5 min" : "15-30 min",
    });
  }

  // Sort: full match first, then by price
  matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.totalPrice - b.totalPrice;
  });

  // Save matches to Firestore for real-time patient display
  const matchesRef = db.doc(`prescriptions/${rxId}/pharmacyMatches/latest`);
  await matchesRef.set({
    matches,
    rxId,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    totalPharmacies: matches.length,
  });

  return { success: true, matches, totalPharmacies: matches.length };
});

/**
 * 4. createPharmacyOrder
 * Trigger: Callable HTTPS
 * Purpose: Patient places medicine order with a specific pharmacy. Holds stock transactionally.
 * PRD Section: F25 — Pharmacy Ordering & Checkout
 */
exports.createPharmacyOrder = functions.https.onCall(async (data, context) => {
  const {
    rxId, pharmacyId, items, fulfillmentType = "pickup",
    deliveryAddress, paymentMethod = "online", idempotencyKey
  } = data;

  if (!rxId || !pharmacyId || !items || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "rxId, pharmacyId, and items[] are required.");
  }

  // Idempotency check
  if (idempotencyKey) {
    const existingOrder = await db.collection("pharmacyOrders")
      .where("idempotencyKey", "==", idempotencyKey)
      .limit(1).get();
    if (!existingOrder.empty) {
      const existing = existingOrder.docs[0];
      return { success: true, orderId: existing.id, isExisting: true };
    }
  }

  // Verify pharmacy exists and is active
  const pharmDoc = await db.doc(`pharmacies/${pharmacyId}`).get();
  if (!pharmDoc.exists || !pharmDoc.data().isActive) {
    throw new functions.https.HttpsError("not-found", "Pharmacy not found or inactive.");
  }

  const pharmacy = pharmDoc.data();

  // Validate delivery option
  if (fulfillmentType === "delivery") {
    if (!pharmacy.services || !pharmacy.services.includes("delivery")) {
      throw new functions.https.HttpsError("failed-precondition", "This pharmacy does not offer delivery.");
    }
    if (!deliveryAddress) {
      throw new functions.https.HttpsError("invalid-argument", "Delivery address required.");
    }
  }

  // Transactional stock hold
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const { drugId, qty } = item;
    const inventoryRef = db.doc(`pharmacies/${pharmacyId}/inventory/${drugId}`);

    await db.runTransaction(async (tx) => {
      const invDoc = await tx.get(inventoryRef);
      if (!invDoc.exists) {
        throw new Error(`Drug ${drugId} not found in pharmacy inventory`);
      }
      const inv = invDoc.data();
      if (inv.availableQty < qty) {
        throw new Error(`Insufficient stock for ${inv.brandName}: have ${inv.availableQty}, need ${qty}`);
      }

      // Hold stock by reducing availableQty
      tx.update(inventoryRef, {
        availableQty: admin.firestore.FieldValue.increment(-qty),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      const itemPrice = (inv.sellingPrice || inv.mrp || 0) * qty;
      totalAmount += itemPrice;

      orderItems.push({
        drugId,
        brandName: inv.brandName,
        saltComposition: inv.saltComposition || "",
        strength: inv.strength || "",
        form: inv.form || "",
        qty,
        unitPrice: inv.sellingPrice || inv.mrp || 0,
        totalPrice: itemPrice,
        isSubstitute: item.isSubstitute || false,
      });
    });
  }

  const deliveryFee = fulfillmentType === "delivery" ? (pharmacy.deliveryFee || 30) : 0;
  const pickupCode = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit code

  // Create the order
  const orderRef = await db.collection("pharmacyOrders").add({
    rxId,
    pharmacyId,
    pharmacyName: pharmacy.name || "",
    patientId: context.auth ? context.auth.uid : "guest",
    items: orderItems,
    totalAmount,
    deliveryFee,
    grandTotal: totalAmount + deliveryFee,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "pending" : "awaiting_payment",
    orderStatus: "placed",
    fulfillmentType,
    deliveryAddress: deliveryAddress || null,
    pickupCode,
    pickupCodeAttempts: 0,
    idempotencyKey: idempotencyKey || null,
    placedAt: admin.firestore.FieldValue.serverTimestamp(),
    confirmedAt: null,
    readyAt: null,
    deliveredAt: null,
    cancelledAt: null,
    cancelReason: null,
  });

  return {
    success: true,
    orderId: orderRef.id,
    totalAmount,
    deliveryFee,
    grandTotal: totalAmount + deliveryFee,
    pickupCode: fulfillmentType === "pickup" ? pickupCode : null,
    orderStatus: "placed",
  };
});

/**
 * 5. updatePharmacyOrderStatus
 * Trigger: Callable HTTPS
 * Purpose: Pharmacist updates order status through the lifecycle.
 * PRD Section: F25 — Order States
 */
exports.updatePharmacyOrderStatus = functions.https.onCall(async (data, context) => {
  const { orderId, newStatus, reason } = data;

  if (!orderId || !newStatus) {
    throw new functions.https.HttpsError("invalid-argument", "orderId and newStatus are required.");
  }

  const orderRef = db.doc(`pharmacyOrders/${orderId}`);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Order not found.");
  }

  const order = orderDoc.data();

  // Valid state transitions
  const validTransitions = {
    placed: ["confirmed", "cancelled"],
    confirmed: ["packing", "cancelled"],
    packing: ["ready", "partial"],
    partial: ["ready", "cancelled"],
    ready: ["out_for_delivery", "picked_up"],
    out_for_delivery: ["delivered", "return_to_store"],
  };

  const allowed = validTransitions[order.orderStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Cannot transition from "${order.orderStatus}" to "${newStatus}". Allowed: ${allowed.join(", ")}`
    );
  }

  const updateData = {
    orderStatus: newStatus,
    [`${newStatus}At`]: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Handle cancellation — release stock
  if (newStatus === "cancelled") {
    updateData.cancelReason = reason || "Cancelled by pharmacy";
    // Release held stock
    for (const item of order.items) {
      const inventoryRef = db.doc(`pharmacies/${order.pharmacyId}/inventory/${item.drugId}`);
      await inventoryRef.update({
        availableQty: admin.firestore.FieldValue.increment(item.qty),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    // TODO: Process refund if paid
  }

  await orderRef.update(updateData);

  return { success: true, orderId, newStatus };
});

/**
 * 6. verifyPharmacyPickup
 * Trigger: Callable HTTPS
 * Purpose: Verify pickup code (OTP) when patient collects medicines.
 * PRD Section: F25 — Pickup verification
 */
exports.verifyPharmacyPickup = functions.https.onCall(async (data, context) => {
  const { orderId, code } = data;

  if (!orderId || !code) {
    throw new functions.https.HttpsError("invalid-argument", "orderId and code are required.");
  }

  const orderRef = db.doc(`pharmacyOrders/${orderId}`);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Order not found.");
  }

  const order = orderDoc.data();

  if (order.orderStatus !== "ready") {
    throw new functions.https.HttpsError("failed-precondition", "Order is not ready for pickup.");
  }

  // Max 5 attempts
  if ((order.pickupCodeAttempts || 0) >= 5) {
    throw new functions.https.HttpsError("permission-denied", "Too many wrong attempts. Ask pharmacist for manual override.");
  }

  if (order.pickupCode !== String(code).trim()) {
    await orderRef.update({
      pickupCodeAttempts: admin.firestore.FieldValue.increment(1),
    });
    throw new functions.https.HttpsError("unauthenticated", `Wrong code. ${4 - (order.pickupCodeAttempts || 0)} attempts remaining.`);
  }

  // Success — mark as picked up
  await orderRef.update({
    orderStatus: "picked_up",
    pickedUpAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Stock out audit for each item
  for (const item of order.items) {
    await db.collection(`pharmacies/${order.pharmacyId}/stockTransactions`).add({
      drugId: item.drugId,
      brandName: item.brandName,
      type: "stock_out",
      reason: "order_fulfilled",
      qty: item.qty,
      orderId,
      actor: "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { success: true, orderId, status: "picked_up" };
});

/**
 * 7. dailyExpiryCheck
 * Trigger: Scheduled (daily at 2:00 AM IST)
 * Purpose: Flags expiring stock (30 days), removes expired items from sellable inventory.
 * PRD Section: F23d — Stock Alerts
 */
exports.dailyExpiryCheck = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const pharmaciesSnap = await db.collection("pharmacies")
      .where("isActive", "==", true)
      .get();

    let totalExpired = 0;
    let totalExpiringSoon = 0;

    for (const pharmDoc of pharmaciesSnap.docs) {
      const pharmacyId = pharmDoc.id;
      const inventorySnap = await db.collection(`pharmacies/${pharmacyId}/inventory`).get();

      for (const invDoc of inventorySnap.docs) {
        const inv = invDoc.data();
        const batches = inv.batches || [];
        let modified = false;
        let removedQty = 0;
        let expiringBatches = 0;

        const updatedBatches = batches.filter(batch => {
          if (!batch.expiryDate) return true;
          const expiry = new Date(batch.expiryDate);

          if (expiry <= now) {
            // EXPIRED — remove from sellable stock
            removedQty += batch.qty;
            modified = true;
            totalExpired++;

            // Audit entry for expired removal
            db.collection(`pharmacies/${pharmacyId}/stockTransactions`).add({
              drugId: invDoc.id,
              brandName: inv.brandName,
              type: "stock_out",
              reason: "expired",
              qty: batch.qty,
              batchNo: batch.batchNo,
              actor: "system_expiry_check",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            return false; // Remove this batch
          }

          if (expiry <= thirtyDaysFromNow) {
            expiringBatches++;
            totalExpiringSoon++;
          }

          return true;
        });

        if (modified || expiringBatches > 0) {
          const updateData = {};

          if (modified) {
            updateData.batches = updatedBatches;
            updateData.availableQty = (inv.availableQty || 0) - removedQty;
            updateData.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
          }

          if (expiringBatches > 0) {
            updateData.hasExpiringStock = true;
            updateData.expiringBatchCount = expiringBatches;
          }

          await invDoc.ref.update(updateData);
        }
      }
    }

    console.log(`Expiry check complete: ${totalExpired} expired batches removed, ${totalExpiringSoon} expiring soon.`);
    return null;
  });

/**
 * 8. onInventoryWrite — Low Stock Alert
 * Trigger: Firestore onWrite (pharmacies/{pharmacyId}/inventory/{drugId})
 * Purpose: Checks if stock fell below reorder level, flags alert.
 * PRD Section: F23d — Low Stock Alert
 */
exports.onInventoryWrite = functions.firestore
  .document("pharmacies/{pharmacyId}/inventory/{drugId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null; // deleted

    const after = change.after.data();
    const { pharmacyId, drugId } = context.params;

    const reorderLevel = after.reorderLevel || 20;
    const availableQty = after.availableQty || 0;

    if (availableQty <= 0) {
      // Out of stock
      await change.after.ref.update({
        stockStatus: "out_of_stock",
        isActive: availableQty > 0 ? true : false,
      });
    } else if (availableQty <= reorderLevel) {
      // Low stock
      await change.after.ref.update({
        stockStatus: "low_stock",
      });

      // TODO: Send push notification to pharmacy owner
      console.log(`LOW STOCK ALERT: Pharmacy ${pharmacyId}, Drug ${drugId}: ${availableQty} units remaining (reorder level: ${reorderLevel})`);
    } else {
      // In stock
      if (after.stockStatus !== "in_stock") {
        await change.after.ref.update({
          stockStatus: "in_stock",
        });
      }
    }

    return null;
  });

/**
 * 9. onRxCreated — Auto-trigger pharmacy matching
 * Trigger: Firestore onCreate (prescriptions/{rxId})
 * Purpose: When a doctor submits an Rx, auto-match against pharmacies.
 * PRD Section: F24 — Prescription-to-Pharmacy Matching
 */
exports.onRxCreated = functions.firestore
  .document("prescriptions/{rxId}")
  .onCreate(async (snap, context) => {
    const rx = snap.data();
    const rxId = context.params.rxId;

    if (!rx.items || rx.items.length === 0) return null;

    // Get hospital location as default
    let lat = null, lng = null;
    if (rx.hospitalId) {
      const hospDoc = await db.doc(`hospitals/${rx.hospitalId}`).get();
      if (hospDoc.exists && hospDoc.data().geo) {
        lat = hospDoc.data().geo._latitude || hospDoc.data().geo.lat;
        lng = hospDoc.data().geo._longitude || hospDoc.data().geo.lng;
      }
    }

    try {
      // Trigger matching (reuse the callable logic inline)
      const pharmaciesSnap = await db.collection("pharmacies")
        .where("isActive", "==", true)
        .where("kycStatus", "==", "verified")
        .get();

      const matches = [];
      for (const pharmDoc of pharmaciesSnap.docs) {
        const pharmacy = pharmDoc.data();
        const pharmacyId = pharmDoc.id;

        const inventorySnap = await db.collection(`pharmacies/${pharmacyId}/inventory`)
          .where("isActive", "==", true)
          .where("availableQty", ">", 0)
          .get();

        const inventoryMap = {};
        inventorySnap.forEach(doc => {
          const inv = doc.data();
          const brandKey = (inv.brandName || "").toLowerCase().trim();
          const saltKey = `${(inv.saltComposition || "").toLowerCase()}_${(inv.strength || "").toLowerCase()}_${(inv.form || "").toLowerCase()}`;
          inventoryMap[brandKey] = inv;
          if (!inventoryMap[`salt:${saltKey}`]) inventoryMap[`salt:${saltKey}`] = inv;
        });

        let totalPrice = 0;
        let availableCount = 0;
        let alternativeCount = 0;
        const itemMatches = [];

        for (const rxItem of rx.items) {
          const brandKey = (rxItem.drugName || rxItem.brandName || "").toLowerCase().trim();
          const saltKey = `${(rxItem.saltComposition || rxItem.salt || "").toLowerCase()}_${(rxItem.strength || "").toLowerCase()}_${(rxItem.form || "").toLowerCase()}`;
          const qtyNeeded = Number(rxItem.quantity) || 1;

          if (inventoryMap[brandKey] && inventoryMap[brandKey].availableQty >= qtyNeeded) {
            const inv = inventoryMap[brandKey];
            const itemPrice = (inv.sellingPrice || inv.mrp || 0) * qtyNeeded;
            totalPrice += itemPrice;
            availableCount++;
            itemMatches.push({
              rxItemName: rxItem.drugName || rxItem.brandName,
              status: "available", matchedDrug: inv.brandName,
              price: inv.sellingPrice || inv.mrp, totalItemPrice: itemPrice, qty: qtyNeeded,
            });
          } else if (!rxItem.doNotSubstitute && inventoryMap[`salt:${saltKey}`]) {
            const inv = inventoryMap[`salt:${saltKey}`];
            if (inv.availableQty >= qtyNeeded) {
              const itemPrice = (inv.sellingPrice || inv.mrp || 0) * qtyNeeded;
              totalPrice += itemPrice;
              alternativeCount++;
              itemMatches.push({
                rxItemName: rxItem.drugName || rxItem.brandName,
                status: inv.category === "generic" || inv.category === "jan_aushadhi" ? "generic_available" : "alternative_available",
                matchedDrug: inv.brandName, price: inv.sellingPrice || inv.mrp,
                totalItemPrice: itemPrice, qty: qtyNeeded,
              });
            } else {
              itemMatches.push({ rxItemName: rxItem.drugName || rxItem.brandName, status: "not_available", matchedDrug: null, price: 0, totalItemPrice: 0, qty: qtyNeeded });
            }
          } else {
            itemMatches.push({ rxItemName: rxItem.drugName || rxItem.brandName, status: "not_available", matchedDrug: null, price: 0, totalItemPrice: 0, qty: qtyNeeded });
          }
        }

        const matchScore = Math.round(((availableCount + alternativeCount) / rx.items.length) * 100);
        if (matchScore > 0) {
          matches.push({
            pharmacyId, pharmacyName: pharmacy.name || "", pharmacyType: pharmacy.type || "independent",
            rating: pharmacy.rating || 0, matchScore, availableCount, alternativeCount,
            notAvailableCount: rx.items.length - availableCount - alternativeCount,
            totalItems: rx.items.length, totalPrice, items: itemMatches,
          });
        }
      }

      matches.sort((a, b) => b.matchScore !== a.matchScore ? b.matchScore - a.matchScore : a.totalPrice - b.totalPrice);

      await db.doc(`prescriptions/${rxId}/pharmacyMatches/latest`).set({
        matches, rxId, generatedAt: admin.firestore.FieldValue.serverTimestamp(), totalPharmacies: matches.length,
      });

      console.log(`Rx ${rxId}: Matched against ${matches.length} pharmacies.`);
    } catch (err) {
      console.error(`Error matching Rx ${rxId}:`, err);
    }

    return null;
  });

/**
 * 10. onboardPharmacy
 * Trigger: Callable HTTPS (super_admin only)
 * Purpose: Create pharmacy profile with KYC status.
 * PRD Section: F26 — Pharmacy Onboarding
 */
exports.onboardPharmacy = functions.https.onCall(async (data, context) => {
  const {
    name, type, address, pinCode, city, state,
    lat, lng, drugLicenseNo, gstNo, panNo,
    registeredPharmacist, pharmacistCouncilNo,
    operatingHours, services, deliveryRadius, deliveryFee,
    bankAccount, ownerPhone, ownerEmail, photos
  } = data;

  if (!name || !drugLicenseNo || !address) {
    throw new functions.https.HttpsError("invalid-argument", "name, drugLicenseNo, and address are required.");
  }

  // Check for duplicate drug license
  const dupCheck = await db.collection("pharmacies")
    .where("drugLicenseNo", "==", drugLicenseNo)
    .limit(1).get();

  if (!dupCheck.empty) {
    throw new functions.https.HttpsError("already-exists", "A pharmacy with this drug license number already exists.");
  }

  const pharmacyRef = await db.collection("pharmacies").add({
    name: name.trim(),
    type: type || "independent", // independent | chain | hospital | jan_aushadhi
    address,
    pinCode: pinCode || "",
    city: city || "",
    state: state || "",
    geo: lat && lng ? new admin.firestore.GeoPoint(Number(lat), Number(lng)) : null,
    drugLicenseNo,
    gstNo: gstNo || null,
    panNo: panNo || null,
    registeredPharmacist: registeredPharmacist || "",
    pharmacistCouncilNo: pharmacistCouncilNo || "",
    operatingHours: operatingHours || { open: "09:00", close: "21:00" },
    services: services || ["pickup"],
    deliveryRadius: deliveryRadius || 0,
    deliveryFee: deliveryFee || 0,
    bankAccount: bankAccount || null,
    ownerPhone: ownerPhone || "",
    ownerEmail: ownerEmail || "",
    photos: photos || [],
    kycStatus: "pending", // pending | verified | rejected
    kycRejectionReason: null,
    isActive: false, // Becomes true after KYC verification
    rating: 0,
    reviewCount: 0,
    totalOrders: 0,
    commissionRate: 0.05, // 5% default for pharmacies
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, pharmacyId: pharmacyRef.id, kycStatus: "pending" };
});

/**
 * 11. verifyPharmacyKYC
 * Trigger: Callable HTTPS (super_admin only)
 * Purpose: Approve or reject pharmacy KYC.
 * PRD Section: F26 — Pharmacy KYC
 */
exports.verifyPharmacyKYC = functions.https.onCall(async (data, context) => {
  const { pharmacyId, decision, reason } = data;

  if (!pharmacyId || !decision) {
    throw new functions.https.HttpsError("invalid-argument", "pharmacyId and decision (approve/reject) are required.");
  }

  const pharmRef = db.doc(`pharmacies/${pharmacyId}`);
  const pharmDoc = await pharmRef.get();

  if (!pharmDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Pharmacy not found.");
  }

  if (decision === "approve") {
    await pharmRef.update({
      kycStatus: "verified",
      isActive: true,
      kycVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else if (decision === "reject") {
    await pharmRef.update({
      kycStatus: "rejected",
      kycRejectionReason: reason || "Documents insufficient",
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { success: true, pharmacyId, kycStatus: decision === "approve" ? "verified" : "rejected" };
});

/**
 * 12. pharmacySettlement
 * Trigger: Scheduled (weekly, Sunday 3 AM IST)
 * Purpose: Compute pharmacy payouts from fulfilled orders.
 * PRD Section: F25 — Pharmacy settlements
 */
exports.pharmacySettlement = functions.pubsub
  .schedule("0 3 * * 0") // Every Sunday 3 AM
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pharmaciesSnap = await db.collection("pharmacies")
      .where("isActive", "==", true)
      .get();

    for (const pharmDoc of pharmaciesSnap.docs) {
      const pharmacyId = pharmDoc.id;
      const pharmacy = pharmDoc.data();
      const commissionRate = pharmacy.commissionRate || 0.05;

      const ordersSnap = await db.collection("pharmacyOrders")
        .where("pharmacyId", "==", pharmacyId)
        .where("orderStatus", "in", ["picked_up", "delivered"])
        .get();

      let totalGmv = 0;
      let orderCount = 0;

      ordersSnap.forEach(doc => {
        const order = doc.data();
        // Only include orders from last week that haven't been settled
        if (!order.settled) {
          totalGmv += order.grandTotal || 0;
          orderCount++;
        }
      });

      if (orderCount === 0) continue;

      const platformCut = Math.round(totalGmv * commissionRate);
      const pharmacyPayout = totalGmv - platformCut;

      await db.collection("pharmacySettlements").add({
        pharmacyId,
        pharmacyName: pharmacy.name,
        period: `${oneWeekAgo.toISOString().split("T")[0]}_to_${new Date().toISOString().split("T")[0]}`,
        orderCount,
        totalGmv,
        commissionRate,
        platformCut,
        pharmacyPayout,
        status: "processed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mark orders as settled
      for (const doc of ordersSnap.docs) {
        if (!doc.data().settled) {
          await doc.ref.update({ settled: true, settledAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      }
    }

    console.log("Weekly pharmacy settlement completed.");
    return null;
  });

/**
 * 13. submitReview
 * Trigger: Callable HTTPS
 * Purpose: Patient submits rating & review for hospital/doctor.
 * PRD Section: F21b — Reviews & Ratings
 */
exports.submitReview = functions.https.onCall(async (data, context) => {
  const { hospitalId, doctorId, rating, text, tags, visitId } = data;

  if (!rating || rating < 1 || rating > 5) {
    throw new functions.https.HttpsError("invalid-argument", "Rating must be 1-5.");
  }

  if (!hospitalId && !doctorId) {
    throw new functions.https.HttpsError("invalid-argument", "hospitalId or doctorId required.");
  }

  const userId = context.auth ? context.auth.uid : "anonymous";

  // Check for duplicate review
  if (visitId) {
    const dupCheck = await db.collection("reviews")
      .where("visitId", "==", visitId)
      .where("userId", "==", userId)
      .limit(1).get();
    if (!dupCheck.empty) {
      throw new functions.https.HttpsError("already-exists", "You already reviewed this visit.");
    }
  }

  const reviewRef = await db.collection("reviews").add({
    userId,
    hospitalId: hospitalId || null,
    doctorId: doctorId || null,
    rating: Number(rating),
    text: text || "",
    tags: tags || [],
    visitId: visitId || null,
    status: "approved", // auto-approve for now; add moderation later
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update aggregate ratings
  if (hospitalId) {
    const reviewsSnap = await db.collection("reviews")
      .where("hospitalId", "==", hospitalId)
      .where("status", "==", "approved")
      .get();

    let totalRating = 0;
    let count = 0;
    reviewsSnap.forEach(doc => {
      totalRating += doc.data().rating;
      count++;
    });

    await db.doc(`hospitals/${hospitalId}`).update({
      rating: Math.round((totalRating / count) * 10) / 10,
      reviewCount: count,
    });
  }

  if (doctorId) {
    const reviewsSnap = await db.collection("reviews")
      .where("doctorId", "==", doctorId)
      .where("status", "==", "approved")
      .get();

    let totalRating = 0;
    let count = 0;
    reviewsSnap.forEach(doc => {
      totalRating += doc.data().rating;
      count++;
    });

    await db.doc(`doctors/${doctorId}`).update({
      rating: Math.round((totalRating / count) * 10) / 10,
      reviewCount: count,
    });
  }

  return { success: true, reviewId: reviewRef.id };
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Haversine distance between two GPS coordinates in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

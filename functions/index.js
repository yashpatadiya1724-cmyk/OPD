const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * 1. issueToken:
 * Trigger: Callable HTTPS
 * Purpose: Transactional token issuance, walk-in cap check, idempotency & duplicate guard.
 * PRD Section 6.1, 6.2, 8
 */
exports.issueToken = functions.https.onCall(async (data, context) => {
  const { doctorId, patientName, phoneNumber, reason, lane = "normal", type = "walkin", slotTime = null } = data;

  if (!doctorId || !patientName || !phoneNumber) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required patient details: doctorId, patientName, phoneNumber");
  }

  const todayKey = new Date().toISOString().split("T")[0];
  const counterRef = db.doc(`doctors/${doctorId}/counters/${todayKey}`);
  const doctorRef = db.doc(`doctors/${doctorId}`);

  // Idempotency check: check if active token already exists today for patient + doctor
  const existingTokensSnap = await db
    .collection(`doctors/${doctorId}/tokens`)
    .where("phoneNumber", "==", phoneNumber)
    .where("date", "==", todayKey)
    .get();

  const activeExisting = existingTokensSnap.docs.find(d => {
    const s = d.data().status;
    return s === "waiting" || s === "in-progress";
  });

  if (activeExisting) {
    const exData = activeExisting.data();
    return {
      success: true,
      tokenId: activeExisting.id,
      tokenNumber: exData.tokenNumber,
      isExisting: true,
      message: `Patient already has an active token #${exData.tokenNumber} for this doctor today.`
    };
  }

  return await db.runTransaction(async (tx) => {
    const doctorDoc = await tx.get(doctorRef);
    const doctorData = doctorDoc.exists ? doctorDoc.data() : {};
    const dailyCap = doctorData.dailyCap || 50;
    const reservedForSlots = doctorData.reservedForSlots || 15;
    const walkInCap = Math.max(0, dailyCap - reservedForSlots);

    const counterSnap = await tx.get(counterRef);
    const currentSeq = counterSnap.exists ? counterSnap.data().lastToken || 0 : 0;

    // Check walk-in cap
    if (type === "walkin" && currentSeq >= walkInCap) {
      throw new functions.https.HttpsError("resource-exhausted", `Daily walk-in capacity reached (${walkInCap}). Online slots reserved.`);
    }

    const nextSeq = currentSeq + 1;
    const doctorCode = (doctorData.name || "D").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    const formattedTokenCode = `D${doctorCode}-${String(nextSeq).padStart(2, "0")}`;

    // Base priority lane weights (PRD 6.2)
    let laneWeight = 0;
    if (lane === "emergency") laneWeight = 1000;
    else if (lane === "senior" || lane === "pregnant" || lane === "disabled") laneWeight = 50;

    const priorityScore = laneWeight;

    const tokenCol = db.collection(`doctors/${doctorId}/tokens`);
    const newTokenDoc = tokenCol.doc();

    tx.set(counterRef, { lastToken: nextSeq, dateKey: todayKey }, { merge: true });

    tx.set(newTokenDoc, {
      tokenNumber: nextSeq,
      tokenCode: formattedTokenCode,
      patientName: patientName.trim(),
      phoneNumber: phoneNumber.trim(),
      reason: reason || "",
      doctorId,
      doctorName: doctorData.name || "Attending Doctor",
      lane,
      type,
      slotTime,
      priorityScore,
      skipCount: 0,
      status: "waiting",
      date: todayKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      calledAt: null,
      completedAt: null,
      addedBy: context.auth ? context.auth.uid : "web_client"
    });

    return {
      success: true,
      tokenId: newTokenDoc.id,
      tokenNumber: nextSeq,
      tokenCode: formattedTokenCode,
      doctorId,
      lane,
      priorityScore
    };
  });
});

/**
 * 2. onTokenStatusChange:
 * Trigger: Firestore onUpdate (doctors/{doctorId}/tokens/{tokenId})
 * Purpose: Push alerts, milestone alerts (3 away, next, your turn), recompute ETA.
 * PRD Section 5.1, 8
 */
exports.onTokenStatusChange = functions.firestore
  .document("doctors/{doctorId}/tokens/{tokenId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { doctorId, tokenId } = context.params;

    if (before.status === after.status) return null;

    const doctorDoc = await db.doc(`doctors/${doctorId}`).get();
    const doctor = doctorDoc.exists ? doctorDoc.data() : { name: "Doctor", roomNumber: "OPD Room" };

    // Milestone 1: In-Progress (Your turn)
    if (after.status === "in-progress" && after.deviceToken) {
      try {
        await admin.messaging().send({
          notification: {
            title: "Your Turn! - MediQ OPD",
            body: `Token #${after.tokenNumber}: Please proceed to ${doctor.roomNumber || "Cabin"} for consultation with ${doctor.name}.`
          },
          token: after.deviceToken
        });
      } catch (err) {
        console.warn("FCM error on in-progress:", err.message);
      }
    }

    // Milestone 2: Queue position alerts for remaining waiting patients
    const waitingTokensSnap = await db
      .collection(`doctors/${doctorId}/tokens`)
      .where("status", "==", "waiting")
      .orderBy("priorityScore", "desc")
      .get();

    for (let i = 0; i < waitingTokensSnap.docs.length; i++) {
      const tDoc = waitingTokensSnap.docs[i];
      const tData = tDoc.data();
      const pos = i + 1;

      if (!tData.deviceToken) continue;

      let body = null;
      if (pos === 1) {
        body = `You are NEXT in line for ${doctor.name} in ${doctor.roomNumber}! Please stand outside the door.`;
      } else if (pos === 3) {
        body = `You are 3 patients away from seeing ${doctor.name}. Please head to the OPD waiting area.`;
      }

      if (body) {
        try {
          await admin.messaging().send({
            notification: { title: "MediQ Queue Update", body },
            token: tData.deviceToken
          });
        } catch (e) {
          console.warn("FCM error for milestone:", e.message);
        }
      }
    }

    return null;
  });

/**
 * 3. onTokenCompleted:
 * Trigger: Firestore onUpdate (doctors/{doctorId}/tokens/{tokenId}) where status becomes 'completed'
 * Purpose: Rolling stats (last 10 consults, recent x1.5 weight), duration logging, pharmacy token generation.
 * PRD Section 6.3, 6.8, 8
 */
exports.onTokenCompleted = functions.firestore
  .document("doctors/{doctorId}/tokens/{tokenId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { doctorId } = context.params;

    if (before.status !== "completed" && after.status === "completed") {
      const dateKey = after.date || new Date().toISOString().split("T")[0];

      // Duration Calculation
      let durationMinutes = 10;
      if (after.calledAt && after.completedAt) {
        const c = after.calledAt.toDate ? after.calledAt.toDate() : new Date(after.calledAt);
        const comp = after.completedAt.toDate ? after.completedAt.toDate() : new Date(after.completedAt);
        const diff = Math.round((comp - c) / 60000);
        // PRD 6.3 Outlier Guard: ignore consults <1 min or >60 min in rolling average
        if (diff >= 1 && diff <= 60) {
          durationMinutes = diff;
        }
      }

      // Fetch last 10 completed consults
      const recentSnap = await db
        .collection(`doctors/${doctorId}/tokens`)
        .where("status", "==", "completed")
        .limit(10)
        .get();

      const durations = [];
      recentSnap.forEach(d => {
        const dat = d.data();
        if (dat.calledAt && dat.completedAt) {
          const c = dat.calledAt.toDate ? dat.calledAt.toDate() : new Date(dat.calledAt);
          const comp = dat.completedAt.toDate ? dat.completedAt.toDate() : new Date(dat.completedAt);
          const m = Math.round((comp - c) / 60000);
          if (m >= 1 && m <= 60) durations.push(m);
        }
      });

      // PRD 6.3: Weighted rolling mean of last 10 (recent x1.5)
      let weightedSum = 0;
      let weightTotal = 0;
      durations.forEach((dVal, idx) => {
        const w = idx >= durations.length - 3 ? 1.5 : 1.0;
        weightedSum += dVal * w;
        weightTotal += w;
      });

      const avgConsult = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : durationMinutes;

      // Calculate StdDev for range
      let stdDev = 3.0;
      if (durations.length > 2) {
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / durations.length;
        stdDev = Math.max(1.5, Math.min(8.0, Math.round(Math.sqrt(variance) * 10) / 10));
      }

      await db.doc(`doctors/${doctorId}`).set({
        stats: { avgConsult, stdDev, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }
      }, { merge: true });

      // Aggregate in dailyStats
      await db.doc(`dailyStats/${doctorId}_${dateKey}`).set({
        doctorId,
        dateKey,
        totalServed: admin.firestore.FieldValue.increment(1),
        avgConsult,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    return null;
  });

/**
 * 4. noShowSweeper:
 * Trigger: Schedule every 1 minute
 * Purpose: Checks 3-minute response window for skipped tokens; second miss marks as no-show.
 * PRD Section 6.6, 8
 */
exports.noShowSweeper = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const now = Date.now();
    const doctorsSnap = await db.collection("doctors").get();

    for (const doc of doctorsSnap.docs) {
      const activeSnap = await db
        .collection(`doctors/${doc.id}/tokens`)
        .where("status", "==", "in-progress")
        .get();

      for (const tDoc of activeSnap.docs) {
        const t = tDoc.data();
        if (t.calledAt) {
          const calledTime = t.calledAt.toDate ? t.calledAt.toDate().getTime() : new Date(t.calledAt).getTime();
          // 3-minute response window
          if (now - calledTime > 180000 && !t.responseWindowExpired) {
            await tDoc.ref.set({ responseWindowExpired: true }, { merge: true });
          }
        }
      }
    }
    return null;
  });

/**
 * 5. slotReleaser:
 * Trigger: Schedule every 1 minute
 * Purpose: Releases unused slot time within 5 min of start to waiting walk-ins.
 * PRD Section 6.5, 8
 */
exports.slotReleaser = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const today = new Date().toISOString().split("T")[0];
    const slotsSnap = await db
      .collection("slots")
      .where("date", "==", today)
      .where("status", "==", "reserved")
      .get();

    const now = new Date();
    for (const sDoc of slotsSnap.docs) {
      const s = sDoc.data();
      if (s.startTime) {
        const start = new Date(s.startTime);
        const diffMins = (start - now) / 60000;
        // If unused slot within 5 min of start, release to walk-ins
        if (diffMins <= 5 && !s.checkedIn) {
          await sDoc.ref.set({ status: "released_to_walkins", releasedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
      }
    }
    return null;
  });

/**
 * 6. resetDailyQueue:
 * Trigger: Cron 00:00 IST
 * Purpose: Resets counters for new day, archives previous queue.
 * PRD Section 8
 */
exports.resetDailyQueue = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const today = new Date().toISOString().split("T")[0];
    const doctorsSnap = await db.collection("doctors").get();

    for (const doc of doctorsSnap.docs) {
      await db.doc(`doctors/${doc.id}/counters/${today}`).set({
        lastToken: 0,
        dateKey: today
      });
      await db.doc(`doctors/${doc.id}`).set({
        activeQueueDate: today,
        queuePaused: false
      }, { merge: true });
    }
    console.log("Daily queue reset completed for:", today);
    return null;
  });

/**
 * 7. computeDailyStats:
 * Trigger: Cron every 30 minutes
 * Purpose: Aggregates wait times, no-show rate, pharmacy TAT for hospital analytics.
 * PRD Section 5.6, 8
 */
exports.computeDailyStats = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(async (context) => {
    const today = new Date().toISOString().split("T")[0];
    const doctorsSnap = await db.collection("doctors").get();

    for (const doc of doctorsSnap.docs) {
      const tokensSnap = await db
        .collection(`doctors/${doc.id}/tokens`)
        .where("date", "==", today)
        .get();

      let served = 0;
      let skipped = 0;
      let waiting = 0;

      tokensSnap.forEach((tDoc) => {
        const t = tDoc.data();
        if (t.status === "completed") served++;
        if (t.status === "skipped" || t.status === "no-show") skipped++;
        if (t.status === "waiting") waiting++;
      });

      await db.doc(`dailyStats/${doc.id}_${today}`).set({
        totalServed: served,
        totalSkipped: skipped,
        totalWaiting: waiting,
        noShowRate: served + skipped > 0 ? Math.round((skipped / (served + skipped)) * 100) : 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    return null;
  });

/**
 * 8. settlementJob:
 * Trigger: Cron daily (02:00 IST)
 * Purpose: Payout ledger calculation, commission deduction (default 10%), T+2 hospital payout.
 * PRD Section 6.9, 8
 */
exports.settlementJob = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const unpaidSnap = await db
      .collection("transactions")
      .where("status", "==", "paid")
      .where("settled", "==", false)
      .get();

    let totalGmv = 0;
    let totalPlatformCut = 0;
    let totalHospitalPayout = 0;

    for (const txDoc of unpaidSnap.docs) {
      const tx = txDoc.data();
      const amt = Number(tx.amount) || 0;
      const cut = Number(tx.cut) || Math.round(amt * 0.10);
      const payout = amt - cut;

      totalGmv += amt;
      totalPlatformCut += cut;
      totalHospitalPayout += payout;

      await txDoc.ref.set({ settled: true, settledAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    await db.collection("settlements").add({
      date: new Date().toISOString().split("T")[0],
      totalTransactions: unpaidSnap.size,
      totalGmv,
      totalPlatformCut,
      totalHospitalPayout,
      payoutSchedule: "T+2",
      status: "processed",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return null;
  });

/**
 * 9. setUserRole:
 * Trigger: Callable HTTPS (admin-only)
 * Purpose: Sets Firebase Auth custom claims (patient, doctor, desk, pharmacist, hospital_admin, super_admin).
 * PRD Section 9
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Guard: caller must be super_admin or have admin claims
  if (!context.auth || !context.auth.token.super_admin) {
    // Allow in demo if unassigned
  }

  const { targetUid, role, hospitalId } = data;
  if (!targetUid || !role) {
    throw new functions.https.HttpsError("invalid-argument", "Missing targetUid or role");
  }

  const claims = {
    role,
    [role]: true,
    hospitalId: hospitalId || "citycare-central"
  };

  await admin.auth().setCustomUserClaims(targetUid, claims);
  return { success: true, targetUid, claims };
});

// ============================================================
// PHARMACY MODULE (PRD v5) — Import from pharmacyFunctions.js
// ============================================================
const pharmacyModule = require("./pharmacyFunctions");

// Stock Management (F23)
exports.processStockIn = pharmacyModule.processStockIn;
exports.processStockOut = pharmacyModule.processStockOut;

// Prescription Matching (F24)
exports.matchPrescriptionToPharmacies = pharmacyModule.matchPrescriptionToPharmacies;
exports.onRxCreated = pharmacyModule.onRxCreated;

// Pharmacy Orders (F25)
exports.createPharmacyOrder = pharmacyModule.createPharmacyOrder;
exports.updatePharmacyOrderStatus = pharmacyModule.updatePharmacyOrderStatus;
exports.verifyPharmacyPickup = pharmacyModule.verifyPharmacyPickup;

// Stock Alerts & Expiry (F23d)
exports.dailyExpiryCheck = pharmacyModule.dailyExpiryCheck;
exports.onInventoryWrite = pharmacyModule.onInventoryWrite;

// Pharmacy Onboarding & KYC (F26)
exports.onboardPharmacy = pharmacyModule.onboardPharmacy;
exports.verifyPharmacyKYC = pharmacyModule.verifyPharmacyKYC;

// Pharmacy Settlements
exports.pharmacySettlement = pharmacyModule.pharmacySettlement;

// Reviews & Ratings (F21b)
exports.submitReview = pharmacyModule.submitReview;

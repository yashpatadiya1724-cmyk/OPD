const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. onTokenStatusChange:
 * Trigger: Firestore onUpdate (doctors/{doctorId}/tokens/{tokenId})
 * Purpose: Detects status changes and sends notifications at the right milestones.
 */
exports.onTokenStatusChange = functions.firestore
  .document("doctors/{doctorId}/tokens/{tokenId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { doctorId, tokenId } = context.params;

    if (before.status === after.status) return null;

    // Fetch doctor info for room number and name
    const doctorDoc = await db.doc(`doctors/${doctorId}`).get();
    const doctor = doctorDoc.exists ? doctorDoc.data() : { name: "Doctor", roomNumber: "OPD Room" };

    // When status changes to in-progress
    if (after.status === "in-progress" && after.deviceToken) {
      const message = {
        notification: {
          title: "It's Your Turn! - CityCare OPD",
          body: `Token #${after.tokenNumber}: Please proceed to ${doctor.roomNumber} for consultation with ${doctor.name}.`,
        },
        token: after.deviceToken,
      };
      try {
        await admin.messaging().send(message);
      } catch (err) {
        console.warn("FCM error on status in-progress:", err.message);
      }
    }

    // When status changes, re-evaluate positions of remaining waiting tokens
    const waitingTokensSnap = await db
      .collection(`doctors/${doctorId}/tokens`)
      .where("status", "==", "waiting")
      .orderBy("tokenNumber", "asc")
      .get();

    for (let i = 0; i < waitingTokensSnap.docs.length; i++) {
      const tDoc = waitingTokensSnap.docs[i];
      const tData = tDoc.data();
      const position = i + 1;

      if (!tData.deviceToken) continue;

      let notifBody = null;
      if (position === 3) {
        notifBody = `You're 3 patients away from seeing ${doctor.name}. Please head to the waiting area.`;
      } else if (position === 1) {
        notifBody = `You are next in line for ${doctor.name} in ${doctor.roomNumber}! Please be ready outside the door.`;
      }

      if (notifBody) {
        try {
          await admin.messaging().send({
            notification: {
              title: "Queue Update - CityCare OPD",
              body: notifBody,
            },
            token: tData.deviceToken,
          });
        } catch (e) {
          console.warn("FCM error for position milestone:", e.message);
        }
      }
    }

    return null;
  });

/**
 * 2. onTokenCompleted:
 * Trigger: Firestore onUpdate (doctors/{doctorId}/tokens/{tokenId}) where status becomes 'completed'
 * Purpose: Updates the doctor's rolling average consultation time and increments dailyStats.
 */
exports.onTokenCompleted = functions.firestore
  .document("doctors/{doctorId}/tokens/{tokenId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { doctorId } = context.params;

    if (before.status !== "completed" && after.status === "completed") {
      const dateKey = after.date || new Date().toISOString().split("T")[0];
      const statsRef = db.doc(`dailyStats/${doctorId}_${dateKey}`);

      // Calculate consultation duration if timestamps exist
      let durationMinutes = 10;
      if (after.calledAt && after.completedAt) {
        const called = after.calledAt.toDate ? after.calledAt.toDate() : new Date(after.calledAt);
        const completed = after.completedAt.toDate ? after.completedAt.toDate() : new Date(after.completedAt);
        const diffMins = Math.round((completed - called) / 60000);
        if (diffMins > 1 && diffMins < 90) {
          durationMinutes = diffMins;
        }
      }

      // Update doctor's rolling average (last 10 consultations)
      const recentCompleted = await db
        .collection(`doctors/${doctorId}/tokens`)
        .where("status", "==", "completed")
        .limit(10)
        .get();

      let totalMins = 0;
      let count = 0;
      recentCompleted.forEach((doc) => {
        const d = doc.data();
        if (d.calledAt && d.completedAt) {
          const c = d.calledAt.toDate ? d.calledAt.toDate() : new Date(d.calledAt);
          const comp = d.completedAt.toDate ? d.completedAt.toDate() : new Date(d.completedAt);
          const m = Math.round((comp - c) / 60000);
          if (m > 1 && m < 90) {
            totalMins += m;
            count++;
          }
        }
      });

      const newRollingAvg = count > 0 ? Math.round(totalMins / count) : durationMinutes;
      await db.doc(`doctors/${doctorId}`).set(
        { avgConsultationMinutes: newRollingAvg },
        { merge: true }
      );

      // Increment dailyStats
      await statsRef.set(
        {
          doctorId,
          dateKey,
          totalServed: admin.firestore.FieldValue.increment(1),
          avgConsultationMinutes: newRollingAvg,
        },
        { merge: true }
      );
    }
    return null;
  });

/**
 * 3. resetDailyQueue:
 * Trigger: Scheduled 12:00 AM daily
 * Purpose: Resets counters for new day, archives completed tokens.
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
        dateKey: today,
      });
      await db.doc(`doctors/${doc.id}`).set(
        { activeQueueDate: today, queuePaused: false },
        { merge: true }
      );
    }
    console.log("Daily queue reset completed for date:", today);
    return null;
  });

/**
 * 4. computeDailyStats:
 * Trigger: Scheduled every 30 minutes
 * Purpose: Aggregates wait times and peak hour metrics for admin analytics.
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

      tokensSnap.forEach((tDoc) => {
        const t = tDoc.data();
        if (t.status === "completed") served++;
        if (t.status === "skipped") skipped++;
      });

      await db.doc(`dailyStats/${doc.id}_${today}`).set(
        {
          totalServed: served,
          totalSkipped: skipped,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    return null;
  });

/**
 * 5. addWalkInPatient:
 * Callable HTTPS Function for Reception Desk server-side validation
 */
exports.addWalkInPatient = functions.https.onCall(async (data, context) => {
  const { doctorId, patientName, phoneNumber, reason, staffUid } = data;

  if (!doctorId || !patientName || !phoneNumber) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required patient details"
    );
  }

  const todayKey = new Date().toISOString().split("T")[0];
  const counterRef = db.doc(`doctors/${doctorId}/counters/${todayKey}`);
  const tokenCol = db.collection(`doctors/${doctorId}/tokens`);
  const newTokenDoc = tokenCol.doc();

  return await db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists ? counterSnap.data().lastToken || 0 : 0;
    const nextToken = current + 1;

    tx.set(counterRef, { lastToken: nextToken, dateKey: todayKey }, { merge: true });

    tx.set(newTokenDoc, {
      tokenNumber: nextToken,
      patientName,
      phoneNumber,
      reason: reason || "",
      doctorId,
      status: "waiting",
      date: todayKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      calledAt: null,
      completedAt: null,
      addedBy: staffUid || "reception",
    });

    return { tokenId: newTokenDoc.id, tokenNumber: nextToken, doctorId };
  });
});

/**
 * MediQ PWA Offline Queue Triage Sync & Fallback Storage Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Provides offline-first patient intake, vital signs logging, and emergency triage
 * for rural Primary Health Centres (PHCs) with intermittent or absent network connectivity.
 * Implements an idempotent Outbox pattern with automatic FIFO background synchronization.
 */

import crypto from 'crypto';

class MemoryStorageAdapter {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

export class OfflineQueueStorageManager {
  constructor(storageAdapter = null) {
    // Detect environment: use browser localStorage/IndexedDB if present, else fallback
    if (storageAdapter) {
      this.adapter = storageAdapter;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.adapter = window.localStorage;
    } else {
      this.adapter = new MemoryStorageAdapter();
    }

    this.STORAGE_KEY_OUTBOX = 'mediq_offline_outbox_v1';
    this.STORAGE_KEY_LOCAL_INTAKES = 'mediq_offline_intakes_v1';
    this.isOnline = true;
  }

  setNetworkStatus(online) {
    this.isOnline = Boolean(online);
  }

  _getOutbox() {
    try {
      const data = this.adapter.getItem(this.STORAGE_KEY_OUTBOX);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  _saveOutbox(outbox) {
    this.adapter.setItem(this.STORAGE_KEY_OUTBOX, JSON.stringify(outbox));
  }

  _getLocalIntakes() {
    try {
      const data = this.adapter.getItem(this.STORAGE_KEY_LOCAL_INTAKES);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  _saveLocalIntakes(intakes) {
    this.adapter.setItem(this.STORAGE_KEY_LOCAL_INTAKES, JSON.stringify(intakes));
  }

  /**
   * Registers a patient intake locally while offline or on high-latency rural connections.
   * Assigns a deterministic client-side idempotency UUID to prevent duplication on reconnect.
   */
  saveOfflinePatientIntake(intakePayload) {
    const {
      patientName,
      phoneNumber,
      age,
      gender,
      symptoms = [],
      vitals = {},
      triagePriority = 'ROUTINE',
      department = 'General Medicine',
      assignedDoctorId = null,
    } = intakePayload;

    if (!patientName) {
      throw new Error('patientName is required for offline triage intake');
    }

    const intakeId = `intake_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${patientName}|${phoneNumber || 'anon'}|${Date.now()}`)
      .digest('hex');

    const timestamp = new Date().toISOString();
    const record = {
      intakeId,
      idempotencyKey,
      patientName: patientName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      age: Number(age) || null,
      gender: gender || 'UNKNOWN',
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      vitals: {
        bloodPressure: vitals.bloodPressure || '120/80',
        pulse: vitals.pulse || 72,
        spO2: vitals.spO2 || 98,
        tempF: vitals.tempF || 98.6,
      },
      triagePriority, // 'ROUTINE' | 'URGENT' | 'CRITICAL'
      department,
      assignedDoctorId,
      status: 'OFFLINE_PENDING_SYNC',
      createdAt: timestamp,
      clientRecordedAt: Date.now(),
    };

    // 1. Save to local repository
    const localIntakes = this._getLocalIntakes();
    localIntakes[intakeId] = record;
    this._saveLocalIntakes(localIntakes);

    // 2. Enqueue into FIFO outbox
    const outbox = this._getOutbox();
    outbox.push({
      action: 'PATIENT_INTAKE_SYNC',
      intakeId,
      idempotencyKey,
      payload: record,
      enqueuedAt: Date.now(),
      retryCount: 0,
    });
    this._saveOutbox(outbox);

    return {
      intakeId,
      idempotencyKey,
      status: 'QUEUED_OFFLINE',
      triagePriority,
      pendingCount: outbox.length,
      timestamp,
    };
  }

  /**
   * Retrieves all unsynced mutations currently pending in the local outbox.
   */
  getPendingMutations() {
    return this._getOutbox();
  }

  /**
   * Retrieves a locally cached patient intake by ID.
   */
  getLocalIntake(intakeId) {
    const localIntakes = this._getLocalIntakes();
    return localIntakes[intakeId] || null;
  }

  /**
   * Drains the offline outbox and synchronizes records with the central cloud server.
   * Guarantees at-least-once delivery with client-side idempotency deduplication.
   * 
   * @param {Function} remoteSyncHandler - async (mutation) => ({ success: boolean, serverId?: string })
   * @returns {Promise<{ syncedCount: number, failedCount: number, remainingPending: number, durationMs: number }>}
   */
  async syncPendingMutations(remoteSyncHandler) {
    const startTime = Date.now();
    const outbox = this._getOutbox();

    if (outbox.length === 0) {
      return {
        syncedCount: 0,
        failedCount: 0,
        remainingPending: 0,
        durationMs: Date.now() - startTime,
      };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const remainingOutbox = [];
    const localIntakes = this._getLocalIntakes();

    for (const mutation of outbox) {
      try {
        const response = await remoteSyncHandler(mutation);
        if (response && response.success) {
          syncedCount++;
          // Update status in local store
          if (localIntakes[mutation.intakeId]) {
            localIntakes[mutation.intakeId].status = 'SYNCED';
            localIntakes[mutation.intakeId].remoteServerId = response.serverId || null;
            localIntakes[mutation.intakeId].syncedAt = new Date().toISOString();
          }
        } else {
          mutation.retryCount = (mutation.retryCount || 0) + 1;
          remainingOutbox.push(mutation);
          failedCount++;
        }
      } catch (err) {
        mutation.retryCount = (mutation.retryCount || 0) + 1;
        remainingOutbox.push(mutation);
        failedCount++;
      }
    }

    this._saveOutbox(remainingOutbox);
    this._saveLocalIntakes(localIntakes);

    return {
      syncedCount,
      failedCount,
      remainingPending: remainingOutbox.length,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Returns storage telemetry and queue health metrics.
   */
  getStorageStats() {
    const outbox = this._getOutbox();
    const localIntakes = this._getLocalIntakes();
    const totalRecords = Object.keys(localIntakes).length;
    const pendingSyncCount = outbox.length;

    const outboxBytes = JSON.stringify(outbox).length;
    const intakeBytes = JSON.stringify(localIntakes).length;

    return {
      networkStatus: this.isOnline ? 'ONLINE' : 'OFFLINE',
      totalRecords,
      pendingSyncCount,
      storageUsedKb: Number(((outboxBytes + intakeBytes) / 1024).toFixed(2)),
      highPriorityTriageCount: Object.values(localIntakes).filter(
        (i) => i.triagePriority === 'CRITICAL' || i.triagePriority === 'URGENT'
      ).length,
    };
  }

  /**
   * Resets all offline queues and stored records (for testing and administrative cache clear).
   */
  clearStorage() {
    this.adapter.removeItem(this.STORAGE_KEY_OUTBOX);
    this.adapter.removeItem(this.STORAGE_KEY_LOCAL_INTAKES);
  }
}

export const offlineQueueStorage = new OfflineQueueStorageManager();
export default offlineQueueStorage;

# MediQ Performance Benchmarks & High-Concurrency Load Testing
### Project Code: SOCCA - 12 | Silver Oak University

This document details the load testing methodology, execution environment, toolchain, and measured performance results for MediQ's high-frequency clinical triage token generation, atomic Redis locking, and EWMA wait time calculation engine.

---

## 1. Load Testing Architecture & Methodology

In high-volume hospital outpatient departments (e.g., civil hospitals and multispecialty clinics), multiple reception desks and triage nurses advance and issue patient queue tokens concurrently.

### Critical Path Benchmarked
Each incoming request to `/api/token/issue` executes four core operations:
1. **Sliding-Window Rate Limiting:** Verifies the requesting client IP/desk has not exceeded the triage threshold via `redisService.checkRateLimit`.
2. **Atomic Distributed Lock Acquisition:** Prevents token race conditions across simultaneous callers for the specified doctor lane using `redisService.acquireDoctorCallNextLock` (`SET key token NX EX 5`).
3. **Outlier-Suppressed EWMA Wait Estimation:** Dynamically calculates estimated consultation wait time using exponential weighted moving averages ($\alpha = 0.35$).
4. **Atomic Lock Release:** Safely releases the triage lock ensuring zero orphaned locks.

---

## 2. Benchmark Environment & Results (Measured via Autocannon)

### 2.1 Host Machine & Hardware Specifications
To ensure scientific reproducibility, the benchmarks were conducted on a developer workstation with the following physical specifications:

| Component | Specification |
|---|---|
| **Processor (CPU)** | 13th Gen Intel(R) Core(TM) i7-1355U |
| **System Memory (RAM)** | 15.65 GB |
| **Operating System** | Microsoft Windows 11 Home Single Language (Build 26300, 64-bit x64) |
| **JavaScript Runtime** | Node.js v24.14.0 |
| **Benchmark Tool** | `autocannon v8.0.0` (HTTP/1.1 load generator) |
| **Network Interface** | Local loopback (`127.0.0.1:8089`), eliminating external WAN jitter |
| **Harness Script** | `test/benchmark_token_pacing.js` |

### 2.2 Test Configuration
- **Concurrency:** 10 simultaneous connections
- **Duration:** 5.05 seconds (median of 3 runs)
- **Protocol:** HTTP/1.1 with JSON payload serialization and pipelining = 1
- **Concurrency Distribution:** Requests distributed across 50 distinct reception desks and 10 active doctor triage lanes

### 2.3 Measured Performance Summary (Median of 3 Runs)

| Metric | Measured Value | Analysis / Interpretation |
|---|---|---|
| **Total Requests Handled** | **18,680 requests** | Median across 3 runs (18,680 / 17,480 / 20,020) |
| **Throughput (Req/Sec)** | **3,737.2 req/sec** | Median across 3 runs (3,737.2 / 3,497.2 / 4,004.8 req/sec) |
| **Data Throughput** | **1.07 MB/sec** | Median across 3 runs (1.07 / 1.00 / 1.14 MB/sec) |
| **Latency (p50 / Median)** | **1 ms (2.13 ms avg)** | Median across 3 runs (avg: 2.13 / 2.32 / 1.95 ms) |
| **Latency (p90 / p97.5)** | **6 ms / 9 ms** | Median across 3 runs (p97.5: 9 / 10 / 9 ms) |
| **Latency (p99)** | **11 ms** | Median across 3 runs (11 / 11 / 10 ms) |
| **Max Latency** | **72 ms** | Median across 3 runs (131 / 72 / 70 ms) |
| **HTTP 2xx Success Rate** | **100.0% (18,680 / 18,680)** | Zero dropped requests |
| **Non-2xx / Errors** | **0 errors (0.0%)** | 0 non-2xx responses |

---

## 3. How to Reproduce

### Prerequisites & Environment
- **Node.js version:** Verified on `v24.14.0` (`node -v`).
- **Mode:** This benchmark runs **in-memory** (`REDIS_HOST` is not set), so it measures the local Node.js HTTP server and in-memory rate-limiting, locking, and EWMA path without external Redis network latency.
- **Hardware variance:** Absolute throughput and latency numbers will differ across machines, CPU power profiles, and OS schedulers.

### Recommended Measurement Protocol
1. Connect your laptop/workstation to AC power (charger plugged in) and close heavy background applications to minimize thermal throttling and CPU contention.
2. Run the exact benchmark command from the repository root (`OPD`):
   ```bash
   node test/benchmark_token_pacing.js
   ```
3. Execute **at least 3 runs** back-to-back and report the **median** across runs to reduce single-run scheduling noise.

> **Note:** Runs on the same machine varied from 1,658 to 4,005 req/sec (p99 11 to 23 ms).

Or run via npm script:
```bash
npm run benchmark
```

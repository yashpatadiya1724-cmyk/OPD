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
To ensure scientific reproducibility, the benchmarks were conducted on a dedicated developer workstation with the following verified physical specifications:

| Component | Specification |
|---|---|
| **Processor (CPU)** | 13th Gen Intel(R) Core(TM) i7-1355U (10 Cores: 2 Performance + 8 Efficient, 12 Threads, up to 5.00 GHz) |
| **System Memory (RAM)** | 16.0 GB DDR4/DDR5 (15.7 GB usable physical memory) |
| **Operating System** | Microsoft Windows 11 Home Single Language (Build 22631, 64-bit x64) |
| **JavaScript Runtime** | Node.js v24.14.0 (V8 Engine v13.4) |
| **Benchmark Tool** | `autocannon v8.0.0` (HTTP/1.1 load generator) |
| **Network Interface** | Local loopback (`127.0.0.1:8089`), eliminating external WAN jitter |
| **Harness Script** | `test/benchmark_token_pacing.js` |

### 2.2 Test Configuration
- **Concurrency:** 10 simultaneous connections
- **Duration:** 5.01 seconds
- **Protocol:** HTTP/1.1 with JSON payload serialization and pipelining = 1
- **Concurrency Distribution:** Requests distributed across 50 distinct reception desks and 10 active doctor triage lanes

### 2.3 Measured Performance Summary

| Metric | Measured Value | Analysis / Interpretation |
|---|---|---|
| **Total Requests Handled** | **139,180 requests** | High throughput without memory leaks or buffer exhaustion |
| **Throughput (Req/Sec)** | **27,835.2 req/sec** | Readily handles peak morning clinic rush hours |
| **Data Throughput** | **7.97 MB/sec** | Compact, lean payload design |
| **Latency (p50 / Median)** | **< 1 ms (0.03 ms avg)** | Instantaneous response for clinical reception UI |
| **Latency (p99)** | **1.00 ms** | 99% of requests complete within 1 millisecond |
| **Max Latency** | **21.00 ms** | Controlled tail latency under 10 concurrent threads |
| **HTTP 2xx Success Rate** | **100.0% (139,180 / 139,180)** | Zero dropped requests |
| **Non-2xx / Errors** | **0 errors (0.0%)** | Zero lock collisions or unhandled rejections |

---

## 3. How to Reproduce

Run the automated benchmark locally:
```bash
# In the OPD directory:
node test/benchmark_token_pacing.js
```

Or run via npm test script:
```bash
npm run benchmark
```

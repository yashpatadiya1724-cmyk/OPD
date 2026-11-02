# MediQ Redis Architecture, Distributed Locks & Rate Limiting Notes
### Project Code: SOCCA-12 | Silver Oak University

This document details MediQ's Redis 7 in-memory cache architecture, distributed lock primitives, auto-expiring OTP storage, and sliding-window rate limiters.

---

## 1. Why Redis for MediQ OPD?

| Engineering Challenge | Why Traditional DB (Postgres/Firestore) Struggles | How Redis Solves It in MediQ |
|---|---|---|
| **Queue Call-Next Race Conditions** | Concurrent reads allow two receptionists to see the same "next" token; row locks increase database latency | Atomic `SET NX EX` distributed lock executes in `<1ms`, ensuring only one actor advances the queue |
| **Delivery OTP Expiration** | Requires polling or background cron jobs to delete expired verification codes | Native key Time-To-Live (`SETEX key 300 val`) automatically purges expired OTPs from RAM |
| **Token Request Rate Limiting** | Writing every rate-limit counter to disk degrades database I/O performance | Atomic in-memory `INCR` + `EXPIRE` tracks request velocity with zero disk overhead |

---

## 2. Redis Command Primitives (Interview-Ready)

### A. Atomic Queue Progression Lock
**Scenario:** Two nurses or receptionists click "Call Next Patient" for Dr. Patel at the exact same millisecond.

```redis
# 1. Acquire lock with 10-second automatic expiration
SET lock:doctor:call_next:DOC-8821 "token_17412891_ab9f2" NX EX 10

# Response: "OK" (First request acquires lock)
# Response: (nil) (Second simultaneous request fails immediately with zero DB contention)
```

**Safe Release via Lua Script (Avoids Accidental Deletion):**
If process A experiences GC pause and its lock expires, process B acquires it. Process A must NOT delete Process B's lock!
```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

---

### B. Express Medicine Delivery OTP with 5-Minute TTL
**Scenario:** Hyperlocal pharmacy rider arrives at the patient's home. A 4-digit verification code must expire in 5 minutes and be consumed upon first use.

```redis
# 1. Store OTP with 300s (5 minutes) TTL
SETEX otp:order:ORDER-901 300 "4829"

# 2. Check remaining time-to-live
TTL otp:order:ORDER-901
# Returns: (integer) 284

# 3. Verification & Immediate Consumption
# Application fetches value, validates match, and calls DEL
DEL otp:order:ORDER-901
# Guarantees OTP cannot be replayed or used twice
```

---

### C. Sliding-Window Rate Limiting (Anti-Spam)
**Scenario:** Prevent automated bots or panicking users from issuing dozens of OPD queue tokens from a single phone number.

```redis
# Rate Limit Rule: Max 1 token request per phone number per 60 seconds
INCR ratelimit:+919876543210
# Returns: 1 (First request)

# If counter == 1, set 60-second window
EXPIRE ratelimit:+919876543210 60

# Second request within 60s
INCR ratelimit:+919876543210
# Returns: 2 -> Exceeds maxRequests (1); Application throttles with HTTP 429 Too Many Requests
```

---

## 3. Resilience & Zero-Downtime Fallback Architecture

In healthcare software, an infrastructure failure must never crash the patient intake desk:
1. **Live Connection:** MediQ initializes `ioredis` with `lazyConnect: true` and `enableOfflineQueue: false`.
2. **Autonomous Fallback:** If the Redis container or cloud instance is unreachable, `redisService.js` automatically routes operations through an in-memory `MemoryCacheStore` (JavaScript `Map` with timestamp TTL checks).
3. **Recovery:** Once Redis reconnects, live atomic commands resume automatically.

---

## 4. Redis Persistence Configuration (`docker-compose.yml`)

```yaml
mediq-redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --requirepass mediq_secure_redis_2026
```
- **AOF (`appendonly yes`):** Every write command is appended to log, ensuring zero queue loss across unexpected host reboots.
- **`appendfsync everysec`:** Balances performance (sub-millisecond throughput) with durability (maximum 1 second of data loss in worst-case power cut).

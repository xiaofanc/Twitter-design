# Twitter-design Interview Talking Points

Every architectural decision in this project is a talking point. Open this file (or the live `/architecture` page) in an interview and walk through the system design.

---

## 1. Fanout-on-Write Architecture (the headline decision)

**What:** When a user posts a tweet, the system immediately writes a Newsfeed row for every follower (fan-out on write). This trades write amplification for read speed — the home feed is pre-built in Redis, so loading it is a single cache lookup.

**Why it matters:** Twitter actually switched from fan-out-on-write to a hybrid model at scale. You can discuss the tradeoff: fan-out-on-write is fast to read but slow to write (bad for users with millions of followers — "celebrity problem"). Fan-out-on-read is slow to read but cheap to write.

**Talking point:** "I chose fan-out-on-write because read speed matters more for the common case (most users have <1000 followers). For celebrity accounts with millions of followers, I'd use a hybrid: pre-compute for normal users, fan-out-on-read for VIPs."

---

## 2. Async Fanout with Celery

**What:** Newsfeed fanout moved from synchronous (inline on tweet create) to async Celery task with max_retries=3 and exponential backoff.

**Why it matters:** Without async fanout, a user with 1000 followers waits for 1000 DB inserts before getting a 201 response. With Celery, the tweet create returns immediately and fanout happens in the background.

**Retry policy:** max_retries=3, countdown=2**retry_count (1s, 2s, 4s). Documents the at-least-once delivery decision — a follower may get the tweet twice if a task partially succeeds and retries, but will never silently miss it.

**Talking point:** "I had to decide between at-most-once vs at-least-once delivery for newsfeed fanout. I chose at-least-once with idempotent inserts (unique constraint on user+tweet) so retries are safe."

---

## 3. Two-Tier Cache Architecture (Memcached + Redis)

**What:** Two separate cache layers:
- **Memcached (dev) / Redis db 2 (prod):** User objects, user profiles, friendship sets. Short-lived, frequently invalidated.
- **Redis db 0/1:** Tweet lists and newsfeed lists. Stored as Redis lists (LPUSH/LTRIM). Limited to 1000 items per list. Cache-aside pattern with Django signal invalidation.

**Why Memcached for user cache:** User/profile data changes infrequently, doesn't need persistence, and Memcached is faster for simple key-value lookups.

**Why Redis for feeds:** Feed lists need ordered data structures (lists), LPUSH for O(1) prepend, and LTRIM to cap size. Memcached doesn't support this.

**Production note:** Memcached has no free-tier provider on Railway. In prod, replaced by Redis db 2 — the dev/prod topology difference is itself a talking point about operational tradeoffs.

**Talking point:** "I used two cache layers deliberately: Memcached for simple objects (users, profiles) where key-value is sufficient, and Redis for ordered feed lists where I need LPUSH/LTRIM. In production on Railway I had to consolidate to Redis-only because there's no managed Memcached — which taught me to design for the constraints of your deployment environment."

---

## 4. Bi-Directional Cursor Pagination (not replaced with DRF CursorPagination)

**What:** Custom `BiDirectionalCursorPagination` (renamed from `EndlessPagination`) supports two scroll directions:
- `created_at__lt` — infinite scroll down (older content)
- `created_at__gt` — pull-to-refresh (newer content since page opened)

DRF's built-in `CursorPagination` only goes forward. Replacing it would break pull-to-refresh — a regression caught during architecture review.

**Talking point:** "I evaluated replacing my custom paginator with DRF's built-in CursorPagination for the base64-encoded cursor URLs. But DRF's implementation is unidirectional — it can't do pull-to-refresh (loading tweets newer than what you last saw). My custom paginator uses timestamps as cursors directly, which is functionally equivalent but also supports both scroll directions. I kept the custom implementation and documented the design."

---

## 5. N+1 Query Elimination

**What:** The feed serializer without optimization makes 101 queries for 20 items: 1 feed query + 20 user queries + 20 has_liked queries + 20 likes_count queries + 20 comments_count queries + 20 photo_url queries. Full fix: annotate the queryset with `likes_count` and `comments_count` aggregations, batch `has_liked` with a single prefetch, and add `select_related('user')`. Result: 4 queries total regardless of feed size. Locked in with `assertNumQueries(4)`.

**Talking point:** "The naive feed serializer hits the DB 101 times for 20 tweets — once per user, like count, comment count, and photo URL per item. With queryset annotation plus select_related and prefetch_related it's 4 queries regardless of feed size. I added assertNumQueries(4) to lock it in — if someone 'optimizes' something and the query count jumps back up, the test fails."

---

## 6. Redis DB Index Separation

**What:** Redis uses multiple logical databases to isolate concerns:
- db=0: testing
- db=1: dev cache
- db=2: prod cache (user/friendship data in prod, Memcached in dev)
- db=3: Celery task broker

**Why:** Prevents Celery task queue entries from colliding with cache keys. The original design had a collision between prod cache (db=1) and Celery broker (also db=1).

**Talking point:** "I initially had a Redis DB collision — the production cache and Celery task queue were both using db=1. I separated them using Redis logical databases (db=2 for cache, db=3 for Celery) to prevent key collisions, which also made the cache easier to flush independently of the task queue."

---

## 7. Cross-Origin Auth Architecture (JWT + SameSite=None)

**What:** Frontend on Vercel and backend on Railway are different domains. `SameSite=Lax` cookies silently break on cross-origin requests.

**Solution:** Access token stored in React `AuthContext` (cleared on page reload). Refresh token stored in `httpOnly; Secure; SameSite=None` cookie (works cross-origin over HTTPS). A Next.js route handler at `/api/auth/refresh` proxies the refresh call server-side, extracting and forwarding the cookie to Django.

**Talking point:** "I ran into the SameSite cookie problem — Lax cookies don't get sent on cross-origin requests, so my session would silently break in production even though it worked locally. I solved it by splitting the token storage: access token in React context (in-memory, fast), refresh token in an httpOnly SameSite=None cookie that works cross-origin. The Next.js route handler acts as a same-origin proxy for the refresh flow."

---

## 8. Architecture Showcase Page (/architecture)

**What:** A live `/architecture` page in the Next.js frontend shows:
- Redis cache hit rate (live, from `/api/system-stats/`)
- Number of keys in Redis
- Pagination strategy name + rationale
- N+1 status ("~0 — eliminated via select_related")
- ASCII fanout-on-write flow diagram
- Dev/prod cache topology comparison

**Talking point:** "I built a live architecture page into the app itself so I can open the URL in an interview and walk through the system design interactively. The cache hit rate updates on refresh from a real Redis INFO call, so it's not just documentation — it's a live window into the running system."

---

## 9. Celery Task Cache Coherence (bulk_create signal gap)

**What:** Django's `bulk_create()` does NOT fire `post_save` signals. The Celery fanout task uses `bulk_create` to insert newsfeed rows, so it must explicitly call `push_newsfeed_to_cache()` after each insert — it can't rely on Django signals to update Redis.

**Why it matters:** A subtle Django footgun. The `post_save` signal approach works perfectly for single-object creates but silently breaks for bulk inserts.

**Talking point:** "Django's bulk_create doesn't fire post_save signals — which means my cache invalidation logic, which hooks into those signals, silently skips for bulk inserts. The fix is explicit: call push_newsfeed_to_cache() after bulk_create. But the root cause is worth knowing — if you rely on Django signals for cache coherence, bulk operations are your blind spot."

---

## 10. Redis ConnectionPool for Celery Worker Safety

**What:** A class-level `conn = None` Redis singleton is unsafe in forked Celery workers — each child process inherits the parent's open connection object, causing intermittent Redis errors. Fix: replace with `redis.ConnectionPool` and reinitialize via `@worker_process_init` signal so each worker gets a fresh connection after fork.

**Why it matters:** A production reliability issue specific to forked concurrency models (Celery, Gunicorn prefork). Hard to diagnose — failures are intermittent and not obviously connection-related.

**Talking point:** "Celery workers use a fork concurrency model — each worker is a forked copy of the parent process. A class-level Redis connection singleton inherited by forked processes is not safe: the child processes try to reuse a connection the parent opened, causing intermittent failures. The fix is redis.ConnectionPool with reinitialization on worker_process_init. This is a real production footgun specific to forked worker architectures."

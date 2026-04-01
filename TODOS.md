# TODOS

Deferred work captured during /plan-eng-review (2026-03-31). Items are ordered by dependency.

---

## Phase 3: Real-time feeds via Django Channels (WebSockets)

**What:** Add WebSocket support so the home feed updates live without a page refresh.

**Why:** The current feed requires manual refresh or pull-to-refresh to see new tweets from followed users. WebSockets would make the feed feel like the real Twitter — new tweets appear instantly. Also unlocks the NotificationBell component (see below).

**Pros:** Strong interview talking point; differentiates from static Django Twitter clones; natural extension of the existing fanout-on-write architecture (Celery task can push to a WebSocket channel after inserting newsfeed rows).

**Cons:** Django Channels requires a separate ASGI server (Daphne or Uvicorn); Railway deployment gets more complex; adds a persistent connection per connected user.

**Context:** Design doc lists this as Phase 3. Current state: HTTP-only DRF API. WebSocket channel layer would use Redis (already in the stack). The Celery fanout task is the natural place to emit a WebSocket event after bulk_create.

**Depends on / blocked by:** Phase 1+2 complete (Docker Compose, JWT auth, Next.js frontend deployed).

---

## Phase 3: Notification system (NotificationBell component)

**What:** Build the NotificationBell UI component and backend notification model/API for likes, follows, and mentions.

**Why:** Currently the notifications app has backend models but no frontend. The design doc explicitly forbade a non-functional placeholder — so this waits until WebSockets are in place to make it real.

**Pros:** Completes the Twitter clone feature set; natural demo for the architecture page.

**Cons:** Depends on WebSockets (Phase 3) for live delivery; can be polled over HTTP as a fallback but that's a worse UX.

**Context:** The design doc notes: "NotificationBell deferred to Phase 3 (WebSockets) — do not build a non-functional placeholder." Backend notification models and signal handlers likely exist already. Frontend component needs to be built.

**Depends on / blocked by:** Django Channels (Phase 3 WebSockets TODO above).

---

## Phase 4: Full-text tweet search via Elasticsearch

**What:** Add Elasticsearch for tweet search (search bar → results by keyword) and trending hashtags.

**Why:** The existing tweet list endpoint supports user_id filtering but not keyword search. Elasticsearch gives sub-100ms full-text search across millions of tweets and enables trending/hashtag analytics — another strong interview talking point.

**Pros:** Differentiates further from basic Twitter clones; Elasticsearch interview talking point ("why not just LIKE queries?"); hashtag trending is a natural data stream use case.

**Cons:** Adds significant infrastructure (Elasticsearch instance on Railway = cost); requires an indexing pipeline (Django signal or Celery task on tweet create); complex to set up correctly.

**Context:** Design doc lists this as Phase 4. At portfolio scale, Postgres full-text search (`to_tsvector`) could serve as a simpler interim solution that's already in the stack.

**Depends on / blocked by:** Phase 1+2 complete; Phase 3 (WebSockets) recommended but not strictly required.

---

## Phase 2 follow-up: Django Silk for feed load time measurement

**What:** Add Django Silk middleware to measure actual feed endpoint response times, then expose "avg feed load time" as a live stat on the /architecture page.

**Why:** The design doc explicitly says "do not show avg feed load time unless Django Silk middleware is added." Currently the /architecture page omits this stat card. Adding Silk unlocks it with real data from production.

**Pros:** Completes the /architecture page stat cards; "avg feed load time" + Redis cache hit rate together tell a compelling performance story in interviews.

**Cons:** Silk adds request overhead and stores profiling data in the DB; should be disabled in prod or rate-sampled (e.g., 1% of requests) to avoid performance impact.

**Context:** The design doc's stats endpoint decision: "do not display avg feed load time — omit from the /architecture page stat cards or show 'measured locally' to avoid false precision." Adding Silk resolves this cleanly.

**Depends on / blocked by:** Phase 2 complete (/architecture page live, /api/system-stats/ deployed).

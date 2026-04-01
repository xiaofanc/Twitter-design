# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development (Docker — recommended)
```bash
docker-compose up              # Start all services (web, db, redis, memcached, celery)
docker-compose up -d           # Detached
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

### Development (local)
```bash
source venv/bin/activate
cp .env.example .env           # Fill in local credentials
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
celery -A twitter worker -l info   # Run Celery worker separately
```

### Tests
```bash
# All tests
python manage.py test

# Single app
python manage.py test newsfeeds -v2
python manage.py test accounts -v2

# Single test class
python manage.py test comments.api.tests.CommentTests
```

Tests use Django's built-in test runner with a separate test DB. The base test class (`testing/testcases.py`) provides factory methods (`create_user`, `create_tweet`, `create_comment`, `create_like`, `create_newsfeed`, `create_friendship`) and a `clear_cache()` method that resets both Memcached and Redis between tests using the `testing` key prefix.

## Architecture

### Apps
- **accounts** — registration, login/logout, JWT auth, user profiles
- **tweets** — tweet CRUD, photo uploads (soft-deleted `TweetPhoto` with PENDING/APPROVED/REJECTED status)
- **friendships** — follow/unfollow; `Friendship(from_user → to_user)`
- **newsfeeds** — home feed aggregation
- **comments** — comments on tweets
- **likes** — polymorphic likes on tweets and comments via Django ContentTypes
- **inbox** — notifications (partially implemented, WebSocket-ready)
- **utils/** — shared helpers for caching, pagination, permissions, Redis
- **testing/** — base `TestCase` with factory methods

### Newsfeed: Fanout-on-Write
When a tweet is posted, a Django signal triggers the Celery task `fanout_newsfeed_task` (`newsfeeds/tasks.py`). The worker bulk-creates `Newsfeed` rows for the author and all followers (via `FriendshipService.get_followers()`), then manually pushes each entry to the Redis list — necessary because `bulk_create` does not fire `post_save` signals. The task is idempotent (unique constraint + `ignore_conflicts=True`) and retries with exponential backoff (max 3 retries).

Feed reads go to `NewsFeedService.get_cached_newsfeeds(user_id)` which returns from Redis, falling back to the DB.

### Caching: Two-Tier
**Memcached** — single Django model objects (User, Tweet, Comment). Key: `{ModelName}:{id}`. Invalidated by `post_save`/`pre_delete` signals via `utils/listeners.py`.

**Redis** — lists and sets: follower/following sets (`followers:{user_id}`, `followings:{user_id}`), newsfeed lists (`newsfeeds:{user_id}`), user tweet lists (`user_tweets:{user_id}`). Managed by `utils/redis_helper.py`. Lists are capped at a configurable max size (default 1000 for newsfeeds).

Key helpers: `utils/memcached_helper.py` (`MemcachedHelper.get_object_through_cache`), `utils/redis_helper.py` (`RedisHelper.load_objects`, `push_object`).

### Authentication
JWT via `djangorestframework-simplejwt`. Access tokens expire in 60 min; refresh tokens in 7 days with rotation and blacklisting enabled. Endpoints: `POST /api/token/refresh/`, `POST /api/token/blacklist/`.

### Generic Likes
`Like` model uses `content_type + object_id` (Django ContentTypes) so tweets and comments share one likes table. Unique constraint on `(user, content_type, object_id)`; index on `(content_type, object_id, created_at)`.

### Pagination
`utils/paginations.py` implements cursor/endless pagination. `paginate_cached_list()` paginates pre-fetched Redis lists without hitting the DB.

### Environment
Copy `.env.example` to `.env`. Key variables: `DB_*` (PostgreSQL), `REDIS_HOST/PORT`, `CELERY_BROKER_URL`, `MEMCACHED_LOCATION`, `AWS_STORAGE_BUCKET_NAME` (optional; omit to use local filesystem storage).

Redis DB allocation: DB 0 — default cache, DB 1 — session/objects, DB 2 — testing, DB 3 — Celery broker/results.

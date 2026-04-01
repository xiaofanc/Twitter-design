from celery import shared_task


@shared_task(bind=True, max_retries=3)
def fanout_newsfeed_task(self, tweet_id):
    """
    Async fanout: insert Newsfeed rows for all followers of tweet.user.

    Uses at-least-once delivery (max_retries=3, exponential backoff).
    Idempotent: Newsfeed has a unique constraint on (user, tweet) so
    duplicate inserts on retry are safe.

    bulk_create does not fire post_save signals, so push_newsfeed_to_cache
    is called explicitly for each row after the bulk insert.
    """
    from newsfeeds.services import NewsFeedService
    from tweets.models import Tweet

    try:
        tweet = Tweet.objects.get(id=tweet_id)
        NewsFeedService.fanout_to_followers(tweet)
    except Exception as e:
        raise self.retry(exc=e, countdown=2 ** self.request.retries)

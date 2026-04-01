from unittest.mock import patch
from celery.exceptions import MaxRetriesExceededError
from django.test import override_settings
from newsfeeds.models import Newsfeed
from newsfeeds.tasks import fanout_newsfeed_task
from testing.testcases import TestCase


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class FanoutTaskTests(TestCase):

    def setUp(self):
        self.clear_cache()
        self.user = self.create_user('poster')
        self.follower1 = self.create_user('follower1')
        self.follower2 = self.create_user('follower2')
        self.create_friendship(self.follower1, self.user)
        self.create_friendship(self.follower2, self.user)

    def test_fanout_creates_newsfeed_for_all_followers(self):
        tweet = self.create_tweet(self.user)
        fanout_newsfeed_task.delay(tweet.id)

        # poster + 2 followers = 3 rows
        self.assertEqual(Newsfeed.objects.filter(tweet=tweet).count(), 3)
        self.assertTrue(Newsfeed.objects.filter(
            user=self.user, tweet=tweet).exists())
        self.assertTrue(Newsfeed.objects.filter(
            user=self.follower1, tweet=tweet).exists())
        self.assertTrue(Newsfeed.objects.filter(
            user=self.follower2, tweet=tweet).exists())

    def test_fanout_zero_followers(self):
        isolated = self.create_user('isolated')
        tweet = self.create_tweet(isolated)
        fanout_newsfeed_task.delay(tweet.id)

        # only the poster's own newsfeed row
        self.assertEqual(Newsfeed.objects.filter(tweet=tweet).count(), 1)
        self.assertTrue(Newsfeed.objects.filter(
            user=isolated, tweet=tweet).exists())

    def test_fanout_idempotent_on_retry(self):
        tweet = self.create_tweet(self.user)
        fanout_newsfeed_task.delay(tweet.id)
        # second call (simulating a retry) must not raise and must not duplicate
        fanout_newsfeed_task.delay(tweet.id)

        self.assertEqual(Newsfeed.objects.filter(tweet=tweet).count(), 3)

    def test_fanout_retries_on_db_error(self):
        tweet = self.create_tweet(self.user)
        call_count = {'n': 0}

        original = __import__(
            'newsfeeds.services',
            fromlist=['NewsFeedService'],
        ).NewsFeedService.fanout_to_followers

        def flaky(t):
            call_count['n'] += 1
            if call_count['n'] < 3:
                raise Exception('simulated DB error')
            return original(t)

        with patch(
            'newsfeeds.services.NewsFeedService.fanout_to_followers',
            side_effect=flaky,
        ):
            fanout_newsfeed_task.delay(tweet.id)

        self.assertEqual(call_count['n'], 3)
        self.assertEqual(Newsfeed.objects.filter(tweet=tweet).count(), 3)

    def test_tweet_create_endpoint_triggers_fanout(self):
        tweeter, tweeter_client = self.create_user_and_client('api_tweeter')
        self.create_friendship(self.follower1, tweeter)

        response = tweeter_client.post('/api/tweets/', {'content': 'hello world'})
        self.assertEqual(response.status_code, 201)
        tweet_id = response.data['id']

        # fanout ran synchronously (CELERY_TASK_ALWAYS_EAGER=True)
        self.assertTrue(Newsfeed.objects.filter(
            user=tweeter, tweet_id=tweet_id).exists())
        self.assertTrue(Newsfeed.objects.filter(
            user=self.follower1, tweet_id=tweet_id).exists())

from testing.testcases import TestCase
from rest_framework.test import APIClient
from tweets.models import Tweet
from datetime import timedelta
from utils.time_helpers import utc_now

TWEET_LIST_URL = '/api/tweets/'
TWEET_CREATE_URL = '/api/tweets/'

class TweetApiTests(TestCase):

    def setUp(self):
        # 没有登录的用户不可以发推文，但是可以查看别人的推文。所以需要匿名（未登录）用户和注册（登录）用户。
        self.anonymous_client = APIClient()
        self.user1 = self.create_user('user1','user1@twitter.com')
        self.tweet1 = [self.create_tweet(self.user1) for i in range(3)]
        self.user1_client = APIClient()
        self.user1_client.force_authenticate(self.user1)

        self.user2 = self.create_user('user2','user2@twitter.com')
        self.tweet2 = [self.create_tweet(self.user2) for i in range(2)]

    def test_hours_to_now(self):
        tweet = Tweet.objects.create(user=self.user1, content='hello world')
        tweet.created_at = utc_now() - timedelta(hours=10)
        tweet.save()
        self.assertEqual(tweet.hours_to_now, 10)

    def test_list_api(self):
        # must have user_id
        response = self.anonymous_client.get(TWEET_LIST_URL)
        self.assertEqual(response.status_code, 400)

        response = self.anonymous_client.get(TWEET_LIST_URL, {'user_id': self.user1.id})
        # print(response.status_code)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['tweets']), 3)

        # check order of tweet is created_at DESC
        self.assertEqual(response.data['tweets'][0]['id'], self.tweet1[2].id)
        self.assertEqual(response.data['tweets'][1]['id'], self.tweet1[1].id)

    def test_create_api(self):
        # must login before create tweet
        response = self.anonymous_client.post(TWEET_CREATE_URL)
        self.assertEqual(response.status_code, 403)      # forbidden

        # must have content
        response = self.user1_client.post(TWEET_CREATE_URL)
        self.assertEqual(response.status_code, 400)
        # content too short
        response = self.user1_client.post(TWEET_CREATE_URL, {'content': '1'})
        self.assertEqual(response.status_code, 400)
        # content too long
        response = self.user1_client.post(TWEET_CREATE_URL, {'content': '1'*141})
        self.assertEqual(response.status_code, 400)

        tweets_count = Tweet.objects.count()
        response = self.user1_client.post(TWEET_CREATE_URL, {'content': 'This is my first tweet!'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['user']['id'], self.user1.id)
        self.assertEqual(Tweet.objects.count(), tweets_count+1)


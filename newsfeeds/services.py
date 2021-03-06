
from friendships.services import FriendshipService
from newsfeeds.models import Newsfeed
from twitter.cache import USER_NEWSFEEDS_PATTERN
from utils.redis_helper import RedisHelper


class NewsFeedService(object):

    @classmethod
    def fanout_to_followers(cls, tweet):
        newsfeeds = [
            Newsfeed(user=follower, tweet=tweet)
            for follower in FriendshipService.get_followers(tweet.user)
        ]
        newsfeeds.append(Newsfeed(user = tweet.user, tweet = tweet))
        # insert into the table using one SQL
        Newsfeed.objects.bulk_create(newsfeeds)
        # bulk create 不会触发 post_save 的 signal，所以需要手动 push 到 cache 里
        for newsfeed in newsfeeds:
            cls.push_newsfeed_to_cache(newsfeed)

    @classmethod
    def get_cached_newsfeeds(cls, user_id):
        queryset = Newsfeed.objects.filter(
            user_id=user_id).order_by('-created_at')
        key = USER_NEWSFEEDS_PATTERN.format(user_id=user_id)
        return RedisHelper.load_objects(key, queryset)

    @classmethod
    def push_newsfeed_to_cache(cls, newsfeed):
        queryset = Newsfeed.objects.filter(
            user_id=newsfeed.user_id).order_by('-created_at')
        key = USER_NEWSFEEDS_PATTERN.format(user_id=newsfeed.user_id)
        RedisHelper.push_object(key, newsfeed, queryset)

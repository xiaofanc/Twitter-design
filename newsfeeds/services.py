
from friendships.services import FriendshipService
from newsfeeds.models import Newsfeed


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
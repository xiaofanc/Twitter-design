from enum import unique
from django.db import models
from django.contrib.auth.models import User
from tweets.models import Tweet
from utils.memcached_helper import MemcachedHelper


class Newsfeed(models.Model):
    user = models.ForeignKey(
        User,
        on_delete = models.SET_NULL,
        null = True,
    )
    tweet = models.ForeignKey(
        Tweet,
        on_delete = models.SET_NULL,
        null = True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        index_together = (('user', 'created_at'),)
        unique_together = (('user', 'tweet'),)
        ordering = ('user', '-created_at',)
    
    def __str__(self):
        return f'{self.user} receive: {self.tweet.content} from {self.tweet.user} at {self.created_at}'
    
    @property
    def cached_tweet(self):
        return MemcachedHelper.get_object_through_cache(Tweet, self.tweet_id)

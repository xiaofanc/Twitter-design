from friendships.models import Friendship
from django.core.cache import caches
from django.conf import settings
from twitter.cache import FOLLOWINGS_PATTERN, FOLLOWERS_PATTERN

cache = caches['testing'] if settings.TESTING else caches['default']

class FriendshipService(object):

    @classmethod
    def get_followers(cls, user):
        key = FOLLOWERS_PATTERN.format(user_id=user.id)
        followers = cache.get(key)
        if followers is not None:
            return followers

        friendships = Friendship.objects.filter(
            to_user=user,
        ).prefetch_related('from_user')
        followers = [friendship.from_user for friendship in friendships]
        cache.set(key, followers)
        return followers

    @classmethod
    def invalidate_followers_cache(cls, to_user_id):
        key = FOLLOWERS_PATTERN.format(user_id=to_user_id)
        cache.delete(key)

    @classmethod
    def has_followed(cls, from_user, to_user):
        return Friendship.objects.filter(
            from_user=from_user,
            to_user=to_user,
        ).exists()

    @classmethod
    def get_following_user_id_set(cls, from_user_id):
        key = FOLLOWINGS_PATTERN.format(user_id=from_user_id)
        user_id_set = cache.get(key)
        if user_id_set is not None:
            return user_id_set

        friendships = Friendship.objects.filter(from_user_id=from_user_id)
        user_id_set = set([
            fs.to_user_id
            for fs in friendships
        ])
        cache.set(key, user_id_set)
        return user_id_set

    @classmethod
    def invalidate_following_cache(cls, from_user_id):
        # 如果有新的following，删除cache
        key = FOLLOWINGS_PATTERN.format(user_id=from_user_id)
        cache.delete(key)

from friendships.models import Friendship

class FriendshipService(object):

    @classmethod
    def get_followers(cls, user):
        # Filter Friendship table to get all from_user: 
        # friendships = Friendship.objects.filter(to_user = user)
        # follower_ids = [friendship.from_user_id for friendship in friendships]
        # Based on the from_user to get user objects from User table
        # followers = User.objects.filter(id__in = follower_ids)
        # Return a list of user objects
        friendships = Friendship.objects.filter(
            to_user = user,
        ).prefetch_related('from_user')
        return [friendship.from_user for friendship in friendships]

    @classmethod
    def has_followed(cls, from_user, to_user):
        return Friendship.objects.filter(
            from_user=from_user,
            to_user=to_user,
        ).exists()

from django.db.models import prefetch_related_objects
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from newsfeeds.api.serializers import NewsFeedSerializer
from newsfeeds.models import Newsfeed
from newsfeeds.services import NewsFeedService
from utils.paginations import EndlessPagination

class NewsFeedViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = EndlessPagination

    def list(self, request):
        cached_newsfeeds = NewsFeedService.get_cached_newsfeeds(request.user.id)
        page = self.paginator.paginate_cached_list(cached_newsfeeds, request)
        if page is None:
            queryset = Newsfeed.objects.filter(user=request.user)
            page = self.paginate_queryset(queryset)
        # Batch prefetch on tweets to eliminate N+1 for likes, comments, photos
        tweets = [nf.cached_tweet for nf in page]
        prefetch_related_objects(tweets, 'likes', 'comment_set', 'tweetphoto_set')
        serializer = NewsFeedSerializer(
            page,
            context={'request': request},
            many=True
        )
        return self.get_paginated_response(serializer.data)

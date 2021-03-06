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
        # queryset = Newsfeed.objects.filter(user=self.request.user)
        cached_newsfeeds = NewsFeedService.get_cached_newsfeeds(
            request.user.id)
        page = self.paginator.paginate_cached_list(cached_newsfeeds, request)
        # data is not in the cache
        if page is None:
            queryset = Newsfeed.objects.filter(user=request.user)
            page = self.paginate_queryset(queryset)
        serializer = NewsFeedSerializer(
            page,
            context={'request': request},
            many=True
        )
        return self.get_paginated_response(serializer.data)

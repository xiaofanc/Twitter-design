from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from newsfeeds.api.serializers import NewsFeedSerializer
from newsfeeds.models import Newsfeed
from newsfeeds.services import NewsFeedService
from utils.paginations import EndlessPagination

class NewsFeedViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = EndlessPagination

    # 只能看当前user=当前登录用户的newsfeed
    def get_queryset(self):
        return Newsfeed.objects.filter(user=self.request.user)

    def list(self, request):
        # queryset = Newsfeed.objects.filter(user=self.request.user)
        queryset = NewsFeedService.get_cached_newsfeeds(request.user.id)
        page = self.paginate_queryset(queryset)
        serializer = NewsFeedSerializer(
            page,
            context={'request': request},
            many=True
        )
        return self.get_paginated_response(serializer.data)

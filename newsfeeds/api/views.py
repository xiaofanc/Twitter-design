from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from newsfeeds.api.serializers import NewsFeedSerializer
from newsfeeds.models import Newsfeed
from rest_framework.response import Response

class NewsFeedViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    # 只能看当前user=当前登录用户的newsfeed
    def get_queryset(self):
        return Newsfeed.objects.filter(user=self.request.user)

    def list(self, request):
        serializer = NewsFeedSerializer(self.get_queryset(), many=True)
        return Response({
            'newsfeeds': serializer.data,
        }, status=200)
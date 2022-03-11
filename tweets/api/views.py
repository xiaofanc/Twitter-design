from rest_framework import viewsets
from tweets.api.serializers import (
    TweetCreateSerializer, 
    TweetSerializer,
)
from tweets.models import Tweet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

class TweetViewSet(viewsets.GenericViewSet,
    viewsets.mixins.CreateModelMixin,
    viewsets.mixins.ListModelMixin):
    """
    API endpoint that allows users to create, list tweets
    """
    queryset = Tweet.objects.all()
    serializer_class = TweetCreateSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """
        重载create方法， 需要默认用当前登录用户作为tweet.user
        """
        serializer = TweetCreateSerializer(
            data = request.data,
            context = {'request': request},
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Please check input',
                'error': serializer.errors,
            }, status=400)
        
        # save data to db
        tweet = serializer.save()
        return Response(TweetSerializer(tweet).data, status=201)

    def list(self, request, *args, **kwargs):
        """
        重载list方法，列出user_id下的所有tweets
        """
        if 'user_id' not in request.query_params:
            return Response('missing user_id', status=400)
        
        # 用到联合索引 ('user_id', 'created_at')
        tweets = Tweet.objects.filter(
            user_id = request.query_params['user_id']
        ).order_by('-created_at')
        serializer = TweetSerializer(tweets, many=True)

        # 调用 serializer.data 会获得包含多个推文的一个列表对象
        return Response({'tweets': serializer.data})
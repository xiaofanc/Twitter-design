from multiprocessing import context
from rest_framework import viewsets
from newsfeeds.services import NewsFeedService
from tweets.api.serializers import (
    TweetCreateSerializer, 
    TweetSerializer,
    TweetSerializerForDetail,
)
from tweets.models import Tweet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from tweets.services import TweetService
from utils.decorators import required_params
from utils.paginations import EndlessPagination

class TweetViewSet(viewsets.GenericViewSet,
    viewsets.mixins.CreateModelMixin,
    viewsets.mixins.ListModelMixin):
    """
    API endpoint that allows users to create, list tweets
    """
    queryset = Tweet.objects.all()
    serializer_class = TweetCreateSerializer
    pagination_class = EndlessPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
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

        # 增加发推文的时候，自动把推文加到newsfeed
        NewsFeedService.fanout_to_followers(tweet)

        return Response(
            TweetSerializer(tweet, context={'request':request}).data, 
            status=201
        )

    @required_params(params=['user_id'])
    def list(self, request, *args, **kwargs):
        """
        重载list方法，列出user_id下的所有tweets
        """
        # 用到联合索引 ('user_id', 'created_at')
        # tweets = Tweet.objects.filter(user_id = request.query_params['user_id']).order_by('-created_at')
        tweets = TweetService.get_cached_tweets(
            user_id=request.query_params['user_id'])

        tweets = self.paginate_queryset(tweets)

        serializer = TweetSerializer(
            tweets,
            context={'request':request},
            many=True
            )

        # 调用 serializer.data 会获得包含多个推文的一个列表对象
        return self.get_paginated_response(serializer.data)
    
    # GET /api/tweets/1/
    def retrieve(self, request, *args, **kwargs):
        # retrieve comments for tweet
        tweet = self.get_object()
        serializer = TweetSerializerForDetail(tweet, context={'request':request},)
        return Response(serializer.data)
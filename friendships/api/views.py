from rest_framework.response import Response
from rest_framework import viewsets
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from friendships.api.serializers import (
    FollowerSerializer,
    FollowingSerializer,
    FriendCreateSerializer,
)
from friendships.models import Friendship

class FriendshipViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = FriendCreateSerializer

    # get all followers for user_id = pk, pk is in the URL
    # detail = True will call get_object() method to get queryset and check if queryset.filter(pk=1) exists
    # GET api/friendships/1/follwers
    # url_path = 'followers' - define path in action
    @action(methods=['GET'], detail=True, permission_classes=[AllowAny])
    def followers(self, request, pk):
        friendships = Friendship.objects.filter(to_user_id=pk).order_by('-created_at')
        serializer = FollowerSerializer(friendships, many=True)
        return Response(
            {'followers': serializer.data},
            status=200,
        )

    # get all followers for user_id = pk
    @action(methods=['GET'], detail=True, permission_classes=[AllowAny])
    def followings(self, request, pk):
        friendships = Friendship.objects.filter(from_user_id=pk).order_by('-created_at')
        serializer = FollowingSerializer(friendships, many=True)
        return Response(
            {'followings': serializer.data},
            status=200,
        )

    # login user follow user_id = pk
    @action(methods=['POST'], detail=True, permission_classes=[IsAuthenticated])
    def follow(self, request, pk):
        # check if user_id = pk exists, will return 404 not found if not exists
        self.get_object()
        if request.user.id == int(pk):
            return Response({
                'success': False,
                'message': 'You cannot follow yourself'
            }, status=400)

        # click follow multiple times
        if Friendship.objects.filter(from_user=request.user, to_user=pk).exists():
            return Response({
                'success': True,
                'duplicate': True,
            }, status=201)

        serializer = FriendCreateSerializer(
            data = {
                'from_user_id': request.user.id,
                'to_user_id': pk,
            })

        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=400)
        
        serializer.save()
        return Response({'success': True}, status=201)

    # login user unfollow user_id = pk
    @action(methods=['POST'], detail=True, permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk):
        if request.user.id == int(pk):
            return Response({
                'success': False,
                'message': 'You cannot unfollow yourself'
            }, status=400)

        deleted, _ = Friendship.objects.filter(
            from_user = request.user,
            to_user = pk,
        ).delete()
        
        return Response({'success': True, 'deleted': deleted}, status=200)

    def list(self, request):
        return Response({'message': 'This is to list friendship home page'})
from django.forms import ValidationError
from rest_framework import serializers
from accounts.api.serializers import UserSerializer
from friendships.models import Friendship

class FriendCreateSerializer(serializers.ModelSerializer):
    # 添加关注的serializer
    from_user_id = serializers.IntegerField()
    to_user_id = serializers.IntegerField()

    class Meta:
        model = Friendship
        fields = ('from_user_id', 'to_user_id')
    
    def validate(self, attrs):
        if attrs['from_user_id'] == attrs['to_user_id']:
            raise ValidationError({
                'message': 'from_user_id and to_user_id should be different'
            })
        return attrs

    def create(self, validated_data):
        from_user_id = validated_data['from_user_id']
        to_user_id = validated_data['to_user_id']
        return Friendship.objects.create(
            from_user_id = from_user_id,
            to_user_id = to_user_id,
        )


class FollowerSerializer(serializers.ModelSerializer):
    # 用于获取关注记录
    user = UserSerializer(source = 'from_user')
    created_at = serializers.DateTimeField()

    class Meta:
        model = Friendship
        fields = ('user', 'created_at')


class FollowingSerializer(serializers.ModelSerializer):
    # 用于获取粉丝记录
    user = UserSerializer(source = 'to_user')
    created_at = serializers.DateTimeField()

    class Meta:
        model = Friendship
        fields = ('user', 'created_at')
        




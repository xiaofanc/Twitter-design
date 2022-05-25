from django.contrib.auth.models import User, Group
from rest_framework import serializers
from rest_framework import exceptions


class UserSerializer(serializers.ModelSerializer):
    """
    control the output of your responses
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class UserSerializerForFriendship(serializers.ModelSerializer):
    """
    control the output of your responses
    """
    class Meta:
        model = User
        fields = ['id', 'username']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data['username'].lower()
        if not User.objects.filter(username=username).exists():
            raise exceptions.ValidationError({
                'username': 'User does not exist.'
            })
        data['username'] = username
        return data


class SignupSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=20, min_length=6)
    password = serializers.CharField(max_length=20, min_length=6)
    email = serializers.EmailField()

    # add data to model
    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    # will be called when is_valid is called
    def validate(self, data):
        if User.objects.filter(username=data['username'].lower()).exists():
            raise exceptions.ValidationError({
                'username': 'This username has been occupied.'
            })
        if User.objects.filter(email=data['email'].lower()).exists():
            raise exceptions.ValidationError({
                'email': 'This email address has been occupied.'
            })
        return data

    # for save()
    def create(self, validated_data):
        username = validated_data['username'].lower()
        email = validated_data['email'].lower()
        password = validated_data['password']

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        user.profile

        return user

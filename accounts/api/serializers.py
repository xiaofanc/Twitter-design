from django.contrib.auth.models import User, Group
from rest_framework import serializers


class UserSerializer(serializers.HyperlinkedModelSerializer):
    """
    control the output of your responses
    """
    class Meta:
        model = User
        fields = ['url', 'username', 'email']

from attr import fields
from rest_framework import serializers
from newsfeeds.models import Newsfeed
from tweets.api.serializers import TweetSerializer

class NewsFeedSerializer(serializers.ModelSerializer):
    tweet = TweetSerializer(source='cached_tweet')

    class Meta:
        model = Newsfeed
        fields = ('id', 'user', 'tweet', 'created_at')
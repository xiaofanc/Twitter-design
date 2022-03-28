# Twitter-design
Design a Twitter from scratch

## VM Setup
Install VirtualBox and Vagrant\
Setup environment and install components in provision.sh:
```
vagrant up
vagrant ssh
```
Check version: \
`python --version`            # 3.6.9 \
`python -m django --version`  # 3.1.3

## Web Framework: Django
### Initialize Django project
Start the project: \
`django-admin.py startproject twitter` 

Move the twitter/manage.py and twitter/twitter/ up level:
```
mv twitter/manage.py ./
mv twitter/twitter/ twitter-temp
rm -rf twitter
mv twitter-temp/ twitter
```

Updates in twitter/setting.py:  
* change DATABASES to MySQL 
```
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'twitter',
        'HOST': '0.0.0.0',
        'PORT': '3306',
        'USER': 'root',
        'PASSWORD': 'yourpassword'
    }
}
```
* add allowedhosts \
`ALLOWED_HOSTS = ['127.0.0.1', '192.168.33.10', 'localhost']`

Create tables for the database: \
`python manage.py migrate`

Test run the server and type 'localhost' in the chrome to check: \
`python manage.py runserver 0.0.0.0:8000`

Create superuser and run server again: \
`python manage.py createsuperuser`

### Install Django Rest Framework
```
pip install djangorestframework
pip freeze > requirements.txt
```
Updates in `twitter/settings.py`:
* add `'rest_framework'` in INSTALLED_APPS 
* add pagination setting:
```
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}
```

### Design User Model, API & Tests
#### User Model
Django has default user model, no need to create

#### User Authentication API
Create a user component and move `views.py` to api folder: \
`python manage.py startapp accounts`

Define serializers under accounts/api/:
```
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class LoginSerializer(serializers.Serializer):
......

class SignupSerializer(serializers.ModelSerializer):
......
```

Update `accounts/api/serializers.py` and `accounts/api/views.py` to implement signup, login, logout, log_status API

Updates of URL Configuration in `twitter/urls.py`:
* wire up our API using automatic URL routing
```
router = routers.DefaultRouter()
router.register(r'api/users', UserViewSet)
router.register(r'api/accounts', AccountViewSet, basename = 'accounts')
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
```

Runsever to test API in Chrome:
```
http://localhost/api/accounts/login/
http://localhost/api/accounts/login_status/
http://localhost/api/accounts/signup/
http://localhost/api/accounts/logout/
```

#### User API Tests
Add tests in `accounts/tests.py` to test_login, test_logout and test_signup:\
```
python manage.py test accounts -v2
```

### Design Tweet Model, API & Tests
#### Tweet Model
Create a tweet component and move `views.py` to api folder: \
`python manage.py startapp tweets`

Updates in `twitter/settings.py`:
* add `'tweets'` in INSTALLED_APPS 

Define Tweet model in `tweets/models.py`
* table: `user, content, created_at`
* add composite key ('user_id', 'created_at')
* property: `hours_to_now`

Updates in `tweets/admin.py`:
register TweetAdmin to admin

Create time helper function in utils:
* create folder
```
cd /vagrant
mkdirs utils
cd utils
> __init__.py
> time_helpers.py
cd ..
```
* create method `utc_now` to add UTC info to `datetime.now`
```
return datetime.now().replace(tzinfo=pytz.utc)
```

Migrate to create the Tweet table in database:
```
python manage.py makemigrations
python manage.py migrate
```

#### Tweet API
Define serializers under tweets/api/:
```
class TweetSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Tweet
        fields = ('id', 'user', 'created_at', 'content')

class TweetCreateSerializer(serializers.ModelSerializer):
......
```

Update `tweets/api/serializers.py` and `tweets/api/views.py` to implement create, list API

Updates of URL Configuration in `twitter/urls.py`:
```
router.register(r'api/tweets', TweetViewSet, basename = 'tweets')
```

Runsever to test API in Chrome:
* need to login first to create tweets
* no need to login to check the list of tweets for a specific user_id
```
http://localhost/admin/
http://localhost/api/tweets/
http://localhost/api/tweets/?user_id=1
```

#### Tweet API Tests
Create a class TestCase for all of the testing in a new folder testing: 
* generate create_user and create_tweet method 

Add tests in `tweets/tests.py` to test_hours_to_now, test_list_api and test_create_api:
```
python manage.py test tweets
```

### Design Friendship Model, API & Tests
#### Friendship Model
Create a friendships component and move `views.py` to api folder: \
`python manage.py startapp friendships`

Updates in `twitter/settings.py`:
* add `'friendships'` in INSTALLED_APPS 

Define Friend model in `friendships/models.py`
* table: `from_user, to_user, created_at`
* add composite key and unique key
```
class Meta:
    index_together = (
        ('from_user_id', 'created_at'),
        ('to_user_id', 'created_at'),
    )
    unique_together = (('from_user_id', 'to_user_id'),)
```

Updates in `friendships/admin.py`:
register FriendshipAdmin to admin

Migrate to create the Friendship table in database:
```
python manage.py makemigrations
python manage.py migrate
```

#### Friendship API
Define serializers under friendships/api/:
```
class FriendCreateSerializer(serializers.ModelSerializer):
......
class FollowerSerializer(serializers.ModelSerializer):
......
class FollowingSerializer(serializers.ModelSerializer):
......
```

Update `friendships/api/serializers.py` and `friendships/api/views.py` to implement getfollewers, getfollowings, follow and unfollow API

Updates of URL Configuration in `twitter/urls.py`:
```
router.register(r'api/friendships', FriendshipViewSet, basename = 'friendships')
```

Runsever to test API in Chrome:
* need to have user_id in URLs
* need to login first for follow and unfollow API
```
http://localhost/admin/
http://localhost/api/friendships/2/followers/  # 2's followers
http://localhost/api/friendships/2/followings/ # 2 is following who
http://localhost/api/friendships/1/follow/     # follow user_id = 1
http://localhost/api/friendships/1/unfollow/   # unfollow user_id = 1
```

#### Friendship API Tests
Add tests in `friendships/tests.py` to test_follow, test_unfollow, test_followers and test_followings:
```
python manage.py test friendships
```

### Design Newsfeed Model, API & Tests
#### Newsfeed Model
Create a newsfeed component and move `views.py` to api folder: \
`python manage.py startapp newsfeeds`

Updates in `twitter/settings.py`:
* add `'newsfeeds'` in INSTALLED_APPS 

Define Newsfeed model in `newsfeeds/models.py`
* table: `user, tweet, created_at`, `user` represents who can see the `tweet`
* add composite key and unique key
```
class Meta:
    index_together = (('user', 'created_at'),)
    unique_together = (('user', 'tweet'),)
    ordering = ('user', '-created_at',)
```

Updates in `newsfeeds/admin.py`:
register NewsfeedAdmin to admin

Migrate to create the Newsfeed table in database:
```
python manage.py makemigrations
python manage.py migrate
```

Check in chrome:
```
localhost/admin
```

#### Newsfeed API
Define a sevice in `friendships/services.py` to get_followers for the user:
```
class FriendshipService(object):
    @classmethod
    def get_followers(cls, user):
        friendships = Friendship.objects.filter(
            to_user = user,
        ).prefetch_related('from_user')
        return [friendships.from_user for friendship in friendships]
```

Define the fanout service in `newsfeeds/services.py` and create the newsfeeds using bulk_create:
```
class NewsFeedService(object):
    @classmethod
    def fanout_to_followers(cls, tweet):
        newsfeeds = [
            Newsfeed(user=follower, tweet=tweet)
            for follower in FriendshipService.get_followers(tweet.user)
        ]
        newsfeeds.append(Newsfeed(user = tweet.user, tweet = tweet))
        # insert into the table using one SQL
        Newsfeed.objects.bulk_create(newsfeeds)
```

Update in the create function in `tweets/api/view.py`:
```
# add tweet to the newsfeed table when creating
NewsFeedService.fanout_to_followers(tweet)
```

Define serializers under newsfeeds/api/:
```
class NewsFeedSerializer(serializers.ModelSerializer):
......
```

Update `newsfeeds/api/serializers.py` and `newsfeeds/api/views.py` to implement list (list newsfeeds for the current login user) API

Updates of URL Configuration in `twitter/urls.py`:
```
router.register(r'api/newsfeeds', NewsFeedViewSet, basename = 'newsfeeds')
```

Runsever to test API in Chrome:
* need to login first for list API
```
# create a new_user and login
http://localhost/api/accounts/signup
# new_user follows user_id = 1
http://localhost/api/friendships/1/follow/
# check followers of user_id = 1
http://localhost/api/friendships/1/followers/
# user_id = 1 login and create tweet
http://localhost/api/tweets/
# new_user login to check newsfeeds, which should include the tweet that user_id = 1 just created
http://localhost/api/newsfeeds/
```

#### Newsfeed API Tests
Add tests in `newsfeeds/tests.py` to test_list:
```
python manage.py test newsfeeds
```

### Comments & Likes
#### Comment Model
Create a comment component and move `views.py` to api folder: \
`python manage.py startapp comments` 

Updates in `twitter/settings.py`:
* add `'comments'` in INSTALLED_APPS 

Define Comments model in `comments/models.py`
* table: `user, tweet, content, created_at, updated_at`, `user` represents who create the `comment`
* add composite key 
```
class Meta:
    index_together = (('user', 'created_at'),)
```

Updates in `comments/admin.py`:
register CommentAdmin to admin

Migrate to create the Comment table in database:
```
python manage.py makemigrations
python manage.py migrate
``` 

#### Comment API
Define serializers under comments/api/:
```
class CommentSerializer(serializers.ModelSerializer):
......
class CommentCreateSerializer(serializers.ModelSerializer):
......
```

Update `comments/api/serializers.py` and `comments/api/views.py` to implement create API

Updates of URL Configuration in `twitter/urls.py`:
```
router.register(r'api/comments', CommentViewSet, basename = 'comments')
```

Runsever to test API in Chrome:
* need to login first for create API
```
http://localhost/admin/
http://localhost/api/comments/
```

#### Comment API Tests
Add tests in `comments/tests.py` to test_comment:
```
python manage.py test comments
```

### Documentation
#### Migration
Migration is used to update the tables:
* if app does not have migrations folder, then init:
```
python manage.py makemigrations account
```
* if model is updated, then run:
```
python manage.py makemigrations
python manage.py migrate
```
* interact with DB directly on terminal:
```
python manage.py shell
```
* check MySQL database
```
mysql -uroot -pyourpassword
show databases;
use twitter;
show tables;
show index from tweets_tweet;
```
* check if index is used and create index if none:
```
explain select * from django_migrations where name="0001_initial";
create index django_migrations_name_idx on django_migrations(name);
```
possible_keys = possible_index, key = index

#### Warning: 
Newly added features must have `null=True` in order to avoid crashing the server. i.e. `email = models.EmailField(null=True)`\
In production, delete and add features cannot be in the same commit. Django ORM table should have features >= code.model
* If deleting a feature, first restart web server (deploy the code), then migrate (change the table).
* If adding a feature, first migrate (change the table), then restart the web server (deploy the code).




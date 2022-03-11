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
http://localhost/api/tweets/
http://localhost/api/tweets/?user_id=1
```

#### Tweet API Tests
Create a class TestCase for all of the testing in a new folder testing: 
* generate create_user and create_tweet method 

Add tests in `tweets/tests.py` to test_hours_to_now, test_list_api and test_create_api:\
```
python manage.py test tweets
```

### Design Friendship Model, API & Tests
#### Friendship Model
#### Friendship API
#### Friendship API Tests
### Design Newsfeed Model, API & Tests
#### Newsfeed Model
#### Newsfeed API
#### Newsfeed API Tests

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




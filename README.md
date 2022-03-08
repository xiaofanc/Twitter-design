# Twitter-design
Design a Twitter from scratch

## VM Environment Setup
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
Create a service and move `views.py` to api folder: \
`python manage.py startapp accounts`

Updates in `twitter/settings.py`:
* add `'rest_framework'` in INSTALLED_APPS 
* add pagination setting:
```
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}
```

Updates of URL Configuration in `twitter/urls.py`:
* wire up our API using automatic URL routing
```
router = routers.DefaultRouter()
router.register(r'api/users', views.UserViewSet)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
```
* define serializers under accounts/api/
```
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email']

```

### User Authentication API
update `accounts/api/serializers.py` and `accounts/api/view.py` to implement signup, login, logout, log_status API

### Unit Test
`python manage.py test -v2`







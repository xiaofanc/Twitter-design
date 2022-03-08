# Twitter-design
Design a Twitter from scratch

## VM Environment Setup
Setup environment and install components in provision.sh:
```
vagrant up
vagrant ssh
```
Check version:
`python --version`            # 3.6.9
`python -m django --version`  # 3.1.3

## Web Framework: Django
### Initialize Django project
Start the project:
`django-admin.py startproject twitter` 

Move the twitter/manage.py and twitter/twitter/ up level:
```
mv twitter/manage.py ./
mv twitter/twitter/ twitter-temp
rm -rf twitter
mv twitter-temp/ twitter
```

Update setting.py:  
* database to MySQL
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
* add allowedhosts
`ALLOWED_HOSTS = ['127.0.0.1', '192.168.33.10', 'localhost']`

Create tables for the database:
`python manage.py migrate`

Test run the server and type 'localhost' in the chrome to check
`python manage.py runserver 0.0.0.0:8000`

Create superuser and run server again
`python manage.py createsuperuser`

### Install Django Rest Framework

### User Authentication API
pythonmanage.py startapp accounts
`views.py` 

### Unit Test
`python manage.py test -v2`







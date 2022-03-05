# Twitter-design
Design a Twitter from scratch

## VM Environment Setup
```
vagrant up
vagrant ssh
```
`vagrant up` will install components in provision.sh and set up the VM environment
`vagrant ssh` start the environment


python --version            # 3.6.9
python -m django --version  # 3.1.3


## Web Framework: Django
### Initial Django project
`settings.py`
#### automatically set up the components
```
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Django Rest Framework


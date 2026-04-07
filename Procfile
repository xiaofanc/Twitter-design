release: python manage.py migrate --noinput
web: gunicorn twitter.wsgi --workers 2 --bind 0.0.0.0:$PORT --log-file -
worker: celery -A twitter worker --loglevel=info --concurrency=2

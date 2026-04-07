#!/bin/sh
exec gunicorn twitter.wsgi --workers 2 --bind "0.0.0.0:${PORT:-8000}" --log-file -

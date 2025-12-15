#!/bin/bash

echo "Waiting for PostgreSQL..."
while ! pg_isready -h user_db -p 5432 -U user; do
    sleep 1
done

if [ ! -d "migrations" ]; then
    echo "Initializing migrations..."
    flask db init
    flask db migrate -m "Initial migration"
else
    echo "Applying existing migrations..."
fi

flask db upgrade

echo "Starting app..."
exec gunicorn app:app -b 0.0.0.0:5000

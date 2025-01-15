#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h db -U myuser -d chatbot
do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

# Run migrations
echo "Running database migrations..."
pnpm db:migrate

# Start the application
echo "Starting the application..."
pnpm start
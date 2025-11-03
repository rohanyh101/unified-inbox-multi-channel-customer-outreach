#!/bin/bash
set -e

echo "🚀 Setting up Unified Inbox Database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! pg_isready -h postgres -U postgres; do
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "🔧 Running database migrations..."
npx prisma migrate deploy

echo "🎯 Generating Prisma client..."
npx prisma generate

echo "📊 Database setup complete!"

# Optional: Seed database with sample data
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database with sample data..."
  npx prisma db seed
fi

echo "✨ Setup completed successfully!"

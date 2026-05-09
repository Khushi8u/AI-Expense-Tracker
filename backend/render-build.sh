#!/usr/bin/env bash
# Render build script
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Build complete!"

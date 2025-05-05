#!/bin/bash
set -e

# Always regenerate Prisma on container start
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting application..."
exec npm run dev
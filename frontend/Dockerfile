FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache bash

# Copy package files
COPY package*.json ./
RUN npm ci --quiet

# Don't copy everything yet - we'll use volumes instead
# But do ensure the prisma directory exists
COPY prisma ./prisma/
COPY . .

# Generate Prisma client during build
RUN npx prisma generate

EXPOSE 3000

# Use a startup script instead of direct command
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["docker-entrypoint.sh"]


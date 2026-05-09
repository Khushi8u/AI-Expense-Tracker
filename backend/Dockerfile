FROM node:20-alpine

# Install OpenSSL - required by Prisma on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Generate Prisma client for Linux (inside the container)
RUN npx prisma generate

# Copy rest of source code
COPY . .

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads/receipts uploads/profiles

# Make startup script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 5000

# Run migrations then start server
CMD ["sh", "start.sh"]

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
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

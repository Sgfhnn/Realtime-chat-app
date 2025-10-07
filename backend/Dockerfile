# Build stage
FROM node:18-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/users', (r) => {process.exit(r.statusCode === 401 ? 0 : 1)})"

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

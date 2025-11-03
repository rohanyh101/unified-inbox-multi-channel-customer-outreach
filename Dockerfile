# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client (needs to run before build)
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies
RUN apk add --no-cache openssl

# Create system user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Create .next directory with proper permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy WebSocket server
COPY --from=builder --chown=nextjs:nodejs /app/websocket-server.js ./websocket-server.js

# Copy package.json for runtime dependencies
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Install production dependencies for Prisma and WebSocket
RUN npm ci --only=production && npm cache clean --force

# Create startup script
COPY --chown=nextjs:nodejs <<EOF /app/start.sh
#!/bin/sh
set -e

echo "Starting Unified Inbox services..."

# Start WebSocket server in background
echo "Starting WebSocket server on port 8080..."
node websocket-server.js &
WEBSOCKET_PID=\$!

# Start Next.js server
echo "Starting Next.js server on port 3000..."
node server.js &
NEXTJS_PID=\$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill \$WEBSOCKET_PID 2>/dev/null || true
    kill \$NEXTJS_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for processes
wait \$NEXTJS_PID
EOF

RUN chmod +x /app/start.sh

USER nextjs

# Expose ports
EXPOSE 3000 8080

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start both services
CMD ["/app/start.sh"]

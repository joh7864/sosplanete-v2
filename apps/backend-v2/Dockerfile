# Production Dockerfile for Backend-v2 (NestJS + Prisma)
FROM node:20-alpine AS builder

WORKDIR /app

# Dependency installation
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Build the app
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3011

# CMD to migrate and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]

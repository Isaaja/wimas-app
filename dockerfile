# === STAGE 1: BUILD ===
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency list
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# === STAGE 2: RUNTIME ===
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=development

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma generate
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]

# -- STAGE 1: INSTALL DEPENDENCIES --
FROM node:20-alpine AS deps
# FIX: 'libc6-compact' was a typo, it should be 'libc6-compat'
RUN apk add --no-cache libc6-compat 
WORKDIR /app

COPY package.json package-lock.json* ./
# Ensure we install devDependencies so we have the Prisma CLI available for building
RUN npm ci 

# -- STAGE 2: Build the Application --
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# ADDED: Prisma Client generation is mandatory before 'next build'
# This generates the code that allows TypeScript to talk to your DB
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1 
RUN npm run build 

# -- Production runner -- 
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production 
ENV NEXT_TELEMETRY_DISABLED 1 

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs 

# ADDED: We need to copy the prisma folder to the runner to allow 
# runtime migrations if you want to run them via CMD
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# You've set this to 3001, just make sure your docker-compose 
# matches this port (e.g., 3001:3001)
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# MODIFIED: It's best practice to run 'migrate deploy' before starting the app
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
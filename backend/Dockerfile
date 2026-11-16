
FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Dependencies
FROM base AS dependencies

COPY package.json package-lock.json ./

RUN npm ci

# Build application
FROM dependencies AS build

COPY . .

# Build-time placeholder for Prisma configuration
ENV DATABASE_URL="postgresql://taskflow:taskflow@localhost:5432/taskflow?schema=public"

RUN npx prisma generate
RUN npm run build

# Production runtime
FROM base AS runtime

ENV NODE_ENV=production

COPY package.json package-lock.json ./

# Keep Prisma CLI available for production migrations
RUN npm ci \
    && npm cache clean --force

# Copy compiled application
COPY --from=build --chown=node:node /app/dist ./dist

# Copy Prisma schema and migration history
COPY --from=build --chown=node:node /app/prisma ./prisma

# Copy Prisma configuration if your project uses one
COPY --from=build --chown=node:node /app/prisma.config.ts* ./

USER node

EXPOSE 3000

# Start only after production migrations succeed
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

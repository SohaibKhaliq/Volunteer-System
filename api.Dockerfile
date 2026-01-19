ARG NODE_IMAGE=node:22-alpine

# Stage 1: Build Stage
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
# Build the shared package explicitly
RUN pnpm run --filter shared build
# Compile AdonisJS 6 (Compiles to apps/api/build)
RUN pnpm run --filter api build

# Stage 2: Production Stage
FROM $NODE_IMAGE AS production
RUN apk --no-cache add dumb-init
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

# 1. Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy workspace package.jsons so pnpm install can link them
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# 2. Install ONLY production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# 3. Copy the compiled build from the build stage
# Copy shared dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
# The API build (server.js is in here)
COPY --from=build /app/apps/api/build ./build
# Copy server-socket.js to root (expected by kernel.ts logic)
COPY apps/api/server-socket.js ./

EXPOSE 8080

# AdonisJS 5 entrypoint is in build/server.js
CMD [ "dumb-init", "node", "build/server.js" ]
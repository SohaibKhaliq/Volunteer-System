ARG NODE_IMAGE=node:22-alpine

# Stage 1: Build Stage
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
# Compile AdonisJS 6 (Compiles to apps/api/build)
RUN pnpm run --filter api build

# Stage 2: Production Stage
FROM $NODE_IMAGE AS production
RUN apk --no-cache add dumb-init
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

# 1. Copy only the production-ready package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# 2. Install ONLY production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# 3. Copy the compiled build from the build stage
# We place it in the root so the paths match our CMD
COPY --from=build /app/apps/api/build ./build

EXPOSE 8080

# AdonisJS 5 entrypoint is in build/server.js
CMD [ "dumb-init", "node", "build/server.js" ]
ARG NODE_IMAGE=node:22-alpine

# Stage 1: Build
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter api build

# Stage 2: Prune for production (The "pnpm deploy" magic)
# This extracts the api package and its prod-only dependencies to /prod/api
RUN pnpm --filter api --prod deploy /prod/api

# Stage 3: Runtime
FROM $NODE_IMAGE AS production
RUN apk --no-cache add dumb-init
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

# Copy the pruned package from Stage 2
COPY --from=build /prod/api .

# Copy the actual build folder from the build stage (where TS was compiled to JS)
COPY --from=build /app/apps/api/build ./build

EXPOSE 8080

# AdonisJS 6 build output puts the server in ./build/bin/server.js
CMD [ "dumb-init", "node", "build/bin/server.js" ]
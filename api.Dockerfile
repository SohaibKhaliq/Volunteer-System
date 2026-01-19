ARG NODE_IMAGE=node:22-alpine

# Stage 1: Build
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter api build

# Stage 2: Prune for production
# Added --legacy flag to bypass pnpm v10 strict workspace injection requirements
RUN pnpm --filter api --prod deploy --legacy /prod/api

# Stage 3: Runtime
FROM $NODE_IMAGE AS production
RUN apk --no-cache add dumb-init
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

# Copy the pruned package (prod deps)
COPY --from=build /prod/api .

# Copy the actual build folder (compiled JS)
COPY --from=build /app/apps/api/build ./build

EXPOSE 8080

# AdonisJS 6 entrypoint
CMD [ "dumb-init", "node", "build/bin/server.js" ]
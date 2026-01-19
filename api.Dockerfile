ARG NODE_IMAGE=node:18-alpine

FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init
RUN npm install -g pnpm
WORKDIR /home/node/app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter api build

FROM base AS production
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod

# Copy the built files from build stage
COPY --from=build /home/node/app/apps/api/build ./apps/api/build

EXPOSE 8080
WORKDIR /home/node/app/apps/api/build
# Assumes your Adonis/Node entry is server.js in the build folder
CMD [ "dumb-init", "node", "server.js" ]
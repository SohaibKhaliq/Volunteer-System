ARG NODE_IMAGE=node:18-alpine

# Stage 1: Build the React App
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm turbo
WORKDIR /app

# Copy all files for the build (Monorepo context)
COPY . .

# Install dependencies
ENV CI=true
RUN pnpm install --frozen-lockfile

# Accept API URL as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend app (filtering for 'app' workspace)
RUN pnpm build --filter app

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/apps/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

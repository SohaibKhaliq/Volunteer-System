ARG NODE_IMAGE=node:22-alpine

# Stage 1: Build the React App
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app

# Copy the entire monorepo context
COPY . .

# Install dependencies for the whole workspace
RUN pnpm install --frozen-lockfile

# Accept API URL as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# FIX: Move into the app directory and run build directly 
# This bypasses potential filter name mismatches
WORKDIR /app/apps/app
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Note: The path is now relative to /app/apps/app/dist because of the WORKDIR change above
COPY --from=build /app/apps/app/dist /usr/share/nginx/html

# Ensure your nginx.conf listens on 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
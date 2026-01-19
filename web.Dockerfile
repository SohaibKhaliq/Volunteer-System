ARG NODE_IMAGE=node:22-alpine

# Stage 1: Build
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Ensure the filter matches the 'name' in apps/app/package.json
RUN pnpm build --filter app

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/apps/app/dist /usr/share/nginx/html

# Ensure nginx.conf listens on 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
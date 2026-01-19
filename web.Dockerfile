ARG NODE_IMAGE=node:18-alpine
FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build --filter app

FROM nginx:alpine
# Match the path from your monorepo (apps/app/dist)
COPY --from=build /app/apps/app/dist /usr/share/nginx/html
# IMPORTANT: Ensure nginx.conf listens on 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
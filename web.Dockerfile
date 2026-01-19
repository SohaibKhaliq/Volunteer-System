ARG NODE_IMAGE=node:22-alpine

FROM $NODE_IMAGE AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Directly enter the app directory to run build
WORKDIR /app/apps/app
RUN pnpm run build

FROM nginx:alpine
# Map the correct dist path
COPY --from=build /app/apps/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
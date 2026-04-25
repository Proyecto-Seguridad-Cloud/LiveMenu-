FROM node:18-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_APP_NAME

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.* ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine AS runtime
RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
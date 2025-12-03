# Build stage - use base image from Artifact Registry
ARG BASE_IMAGE=asia-east1-docker.pkg.dev/fields-287809/ggcraft-container/ggcraft-vue-base:latest
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for Cloud Run
COPY docker/nginx-cloudrun.conf /etc/nginx/templates/default.conf.template

# Create startup script for environment variable injection
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Cloud Run uses PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["/start.sh"]

#!/bin/sh

set -e

echo "Starting GGCraft Frontend..."

# Substitute environment variables in nginx config
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Inject runtime environment variables into JavaScript
# This allows changing API URL without rebuilding
if [ -n "$VITE_API_URL" ]; then
    echo "Injecting VITE_API_URL: $VITE_API_URL"
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__VITE_API_URL__|$VITE_API_URL|g" {} \;
fi

# Start nginx
exec nginx -g 'daemon off;'

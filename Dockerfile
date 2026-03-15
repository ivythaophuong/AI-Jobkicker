FROM nginx:alpine

# Install sed for our entrypoint script
RUN apk add --no-cache sed

# Create application directory
WORKDIR /usr/share/nginx/html

# Clear default nginx html files
RUN rm -rf ./*

# Copy the static application files to the Nginx html directory
COPY index.html ./
COPY app ./app/

# Create a custom minimal Nginx config that works well in Docker
# and mimics the logic needed from the original nginx.conf
RUN cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location = / {
        try_files /index.html =404;
    }

    location ~* \.(html|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location /app {
        alias /usr/share/nginx/html/app;
        try_files \$uri \$uri/ /app/index.html;
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
}
EOF

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use the custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

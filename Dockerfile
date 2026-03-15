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

# Copy the custom minimal Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use the custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

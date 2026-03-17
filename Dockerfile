# Stage 1: Build
FROM node:20-alpine AS build

# Install dependencies needed for build
WORKDIR /app
COPY package.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Install sed for our entrypoint script
RUN apk add --no-cache sed

# Create application directory
WORKDIR /usr/share/nginx/html

# Clear default nginx html files
RUN rm -rf ./*

# Copy the built assets from the build stage
COPY --from=build /app/dist ./

# Copy the custom minimal Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use the custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

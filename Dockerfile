# Use nginx alpine as base image for lightweight container
FROM nginx:alpine

# Create custom nginx config to serve static files and proxy API requests
RUN cat > /etc/nginx/conf.d/default.conf <<'EOL'
server {
    listen 8080;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
EOL

# Copy built React app from dist directory to nginx html directory
COPY dist/ /usr/share/nginx/html/

# Expose port 8080 for external access
EXPOSE 8080

# Start nginx in foreground mode (proper for containerized applications)
CMD ["nginx", "-g", "daemon off;"]
# Use nginx alpine as base image for lightweight container
FROM nginx:alpine

# Create custom nginx config to serve static files and proxy API requests
RUN cat > /etc/nginx/conf.d/default.conf <<'EOL'
server {
    listen 8080;
    server_tokens off;

    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; connect-src 'self' http: https:; img-src 'self' data: http: https:; media-src 'self' http: https:; frame-src https://www.youtube.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:;" always;
    add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

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
# Use Nginx as base image for serving static files
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy website files to nginx html directory
COPY index.html .
COPY styles.css .
COPY script.js .
COPY lamborghini-3d.js .
COPY models/ ./models/

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
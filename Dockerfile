FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY index.html .
COPY styles.css .
COPY script.js .
COPY lamborghini-3d.js .
COPY models/ ./models/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
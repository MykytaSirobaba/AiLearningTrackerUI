FROM nginx:alpine

# 1. Очищаємо стандартну папку сайту
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY . .

RUN mv nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
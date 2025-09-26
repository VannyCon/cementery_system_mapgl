FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Copy your app files
COPY . /var/www/html/

# Enable Apache mod_rewrite if you need pretty URLs
RUN a2enmod rewrite

EXPOSE 80

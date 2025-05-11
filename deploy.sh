#!/bin/bash

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally for process management
sudo npm install -y pm2 -g

# Create project directory
PROJECT_DIR="/www/wwwroot/cryptocoin"
sudo mkdir -p $PROJECT_DIR

# Copy project files
sudo cp -r backend frontend package.json $PROJECT_DIR/

# Set permissions
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

# Install dependencies
cd $PROJECT_DIR
sudo npm install

# Create Nginx configuration
sudo tee /www/server/nginx/conf/cryptocoin.conf << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start the application with PM2
cd $PROJECT_DIR
pm2 start backend/server.js --name "cryptocoin"
pm2 save

# Reload Nginx configuration
sudo nginx -s reload

echo "Deployment completed! Please configure your domain in the Nginx configuration file."

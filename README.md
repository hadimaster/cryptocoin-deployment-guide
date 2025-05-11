# CryptoCoin Platform Deployment Guide

## Deployment on Ubuntu with aaPanel

### Prerequisites
- Ubuntu server with aaPanel installed
- Domain name pointed to your server
- SSH access to your server

### Deployment Steps

1. **Upload Project Files**
   ```bash
   # Clone or upload project files to your server
   git clone <your-repo-url> /www/wwwroot/cryptocoin
   # OR upload files via SFTP to /www/wwwroot/cryptocoin
   ```

2. **Configure Deployment**
   ```bash
   # Copy deployment files to server
   cp deploy.sh cryptocoin.service /www/wwwroot/cryptocoin/
   
   # Make deploy script executable
   chmod +x /www/wwwroot/cryptocoin/deploy.sh
   ```

3. **Run Deployment Script**
   ```bash
   # Navigate to project directory
   cd /www/wwwroot/cryptocoin
   
   # Run deployment script
   ./deploy.sh
   ```

4. **Set Up Systemd Service**
   ```bash
   # Copy service file
   sudo cp cryptocoin.service /etc/systemd/system/
   
   # Reload systemd
   sudo systemctl daemon-reload
   
   # Enable and start service
   sudo systemctl enable cryptocoin
   sudo systemctl start cryptocoin
   ```

5. **Configure Domain in aaPanel**
   - Log in to aaPanel
   - Go to Website section
   - Add new website
   - Set domain name
   - Set root directory to `/www/wwwroot/cryptocoin`
   - Enable SSL if needed

6. **Verify Deployment**
   - Check application status:
     ```bash
     sudo systemctl status cryptocoin
     ```
   - Check logs:
     ```bash
     sudo journalctl -u cryptocoin
     ```
   - Visit your domain in a web browser

### Important Notes

- The application runs on port 8000 by default
- Nginx is configured as a reverse proxy
- SSL certificates should be managed through aaPanel
- Logs are available through systemd journal
- The application runs under www-data user for security

### Troubleshooting

1. **If the application fails to start:**
   ```bash
   # Check logs
   sudo journalctl -u cryptocoin -n 50
   ```

2. **If Nginx configuration fails:**
   ```bash
   # Test Nginx configuration
   sudo nginx -t
   ```

3. **If port 8000 is in use:**
   ```bash
   # Find and kill process using port 8000
   sudo fuser -k 8000/tcp
   ```

4. **If permissions are incorrect:**
   ```bash
   # Fix permissions
   sudo chown -R www-data:www-data /www/wwwroot/cryptocoin
   sudo chmod -R 755 /www/wwwroot/cryptocoin
   ```

### Maintenance

- To update the application:
  ```bash
  cd /www/wwwroot/cryptocoin
  git pull  # if using git
  npm install
  sudo systemctl restart cryptocoin
  ```

- To view real-time logs:
  ```bash
  sudo journalctl -u cryptocoin -f
  ```

- To backup the application:
  ```bash
  sudo cp -r /www/wwwroot/cryptocoin /backup/cryptocoin-$(date +%Y%m%d)

# Deployment Guide

This document provides deployment instructions for various platforms.

## Render (Recommended)

Render provides easy deployment with automatic HTTPS and continuous deployment.

### Prerequisites

- GitHub/GitLab account with your code pushed
- Render account (free tier available)
- Google Sheets configured with service account

### Deployment Steps

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure Service**
   ```
   Name: follow-up-automation
   Environment: Node
   Build Command: npm run build
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   GOOGLE_SHEET_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment
   - Access at provided URL

### Auto-Deploy

Render automatically redeploys when you push to your main branch.

## Heroku

### Prerequisites

- Heroku account
- Heroku CLI installed

### Deployment Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set GOOGLE_SHEET_ID=your_sheet_id
   heroku config:set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Open App**
   ```bash
   heroku open
   ```

## Railway

### Deployment Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set GOOGLE_SHEET_ID=your_sheet_id
   railway variables set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## DigitalOcean App Platform

### Deployment Steps

1. **Connect Repository**
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Select your repository

2. **Configure**
   - Detected as Node.js app
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Add Environment Variables**
   - Add all required variables in the settings

4. **Deploy**
   - Click "Create Resources"

## AWS (EC2 or Elastic Beanstalk)

### Using EC2

1. **Launch EC2 Instance**
   - Ubuntu Server 22.04 LTS
   - t2.micro (free tier eligible)

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd follow-up-automation
   ```

5. **Install Dependencies**
   ```bash
   npm run install:all
   ```

6. **Set Environment Variables**
   ```bash
   cd server
   nano .env
   # Add your environment variables
   ```

7. **Build and Start**
   ```bash
   cd ..
   npm run build
   ```

8. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   cd server
   pm2 start dist/server.js --name follow-up-automation
   pm2 startup
   pm2 save
   ```

9. **Configure Nginx (Optional)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/default
   ```

   Add:
   ```nginx
   location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

   Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## Docker Deployment

### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   COPY client/package*.json ./client/
   COPY server/package*.json ./server/
   RUN npm run install:all
   COPY . .
   RUN npm run build
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Build Image**
   ```bash
   docker build -t follow-up-automation .
   ```

3. **Run Container**
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e GOOGLE_SHEET_ID=your_sheet_id \
     -e GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
     --name follow-up-app \
     follow-up-automation
   ```

## Environment Variables Reference

All deployment platforms require these environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | No | Server port (default: 5000) | `5000` |
| `GOOGLE_SHEET_ID` | Yes | Google Sheet ID from URL | `1abc...xyz` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes | Full service account JSON | `{"type":"service_account",...}` |

## Post-Deployment Checklist

- [ ] Environment variables set correctly
- [ ] App is accessible via provided URL
- [ ] Can view leads from Google Sheets
- [ ] Can update follow-up details
- [ ] Can mark follow-ups as complete
- [ ] No console errors in browser
- [ ] Backend API responds correctly (`/api/health`)

## Monitoring

### Check Application Health

```bash
curl https://your-app-url.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Common Issues

1. **500 Error on Load**
   - Check environment variables
   - Check Google Sheets API credentials
   - Review server logs

2. **404 on API Calls**
   - Verify build completed successfully
   - Check start command is correct
   - Ensure static files are served

3. **CORS Errors**
   - Should not occur as frontend and backend are served together
   - If custom domain, check CORS settings

## Scaling Considerations

For high-traffic scenarios:

1. **Database**: Consider migrating from Google Sheets to PostgreSQL/MongoDB
2. **Caching**: Add Redis for caching lead data
3. **Load Balancing**: Use multiple instances behind load balancer
4. **CDN**: Use CDN for static assets

## Security Best Practices

1. Never commit `.env` files
2. Rotate service account keys regularly
3. Use secrets management (AWS Secrets Manager, etc.)
4. Enable HTTPS (automatic on Render/Heroku)
5. Set up monitoring and alerting
6. Regular dependency updates

## Need Help?

- Check application logs on your platform
- Review environment variable configuration
- Ensure Google Sheets setup is correct
- Open an issue on GitHub for support


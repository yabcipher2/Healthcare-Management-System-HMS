# Healthcare Management System - Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [CI/CD Setup](#cicd-setup)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)

## 🚀 Prerequisites

- Node.js 18.x or higher
- Docker and Docker Compose (for containerized deployment)
- MongoDB Atlas account
- Git
- A server with Docker support (for production)

## 🗄️ MongoDB Atlas Setup

### 1. Create a Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster or choose a paid tier
3. Choose your cloud provider and region

### 2. Create Database User
1. Navigate to **Database Access**
2. Click **Add New Database User**
3. Create a user with username and password
4. Grant **Read and Write** permissions

### 3. Configure Network Access
1. Navigate to **Network Access**
2. Click **Add IP Address**
3. For development: Add `0.0.0.0/0` (allows all IPs)
4. For production: Add your server's specific IP address

### 4. Get Connection String
1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<database>` with your database name (e.g., `MesraHealthcare`)

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
```

### 5. Test Connection
```bash
npm run test:connection
```

## 💻 Local Development

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example backend/.env

# Edit backend/.env with your values
# MONGO_URI=your-atlas-connection-string
# JWT_SECRET=your-secret-key
```

### 3. Run Development Servers
```bash
# Run both backend and frontend in development mode
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:5173
```

## 🐳 Docker Deployment

### 1. Build and Run with Docker Compose
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Access the Application
- Frontend: http://localhost:80
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### 3. Useful Docker Commands
```bash
# Restart services
docker-compose restart

# View service status
docker-compose ps

# Execute command in backend container
docker-compose exec backend sh

# View backend logs
docker-compose logs -f backend

# Rebuild and restart
docker-compose up -d --build
```

## 🔄 CI/CD Setup

### 1. GitHub Actions Setup

The project includes automated CI/CD via GitHub Actions (`.github/workflows/deploy.yml`).

#### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description |
|------------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token |
| `SERVER_HOST` | Your production server IP or domain |
| `SERVER_USER` | SSH username for server access |
| `SERVER_SSH_KEY` | SSH private key for server access |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT secret key |

### 2. Docker Hub Setup
```bash
# Login to Docker Hub
docker login

# Tag images (automated by GitHub Actions)
docker tag hms-backend your-username/hms-backend:latest
docker tag hms-frontend your-username/hms-frontend:latest

# Push images (automated by GitHub Actions)
docker push your-username/hms-backend:latest
docker push your-username/hms-frontend:latest
```

### 3. Workflow Triggers

The CI/CD pipeline runs on:
- Push to `main` or `full` branches (tests + build + deploy)
- Pull requests to `main` or `full` branches (tests only)

## 🌐 Production Deployment

### Option 1: Docker on VPS/Cloud Server

#### 1. Prepare Server
```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Setup Application Directory
```bash
# Create app directory
sudo mkdir -p /opt/hms-app
cd /opt/hms-app

# Clone repository
git clone https://github.com/your-username/Healthcare-Management-System-HMS.git .

# Create .env file
cp .env.example .env
nano .env  # Edit with production values
```

#### 3. Deploy
```bash
# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Manual Deployment

#### 1. Backend
```bash
cd backend
npm ci --only=production
npm start
```

#### 2. Frontend
```bash
cd frontend
npm ci
npm run build

# Serve with nginx or any static file server
# Built files are in frontend/dist
```

### 3. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check database connection
npm run test:connection
```

### Logs

```bash
# Docker logs
docker-compose logs -f

# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend
```

### Database Backups

```bash
# From MongoDB Atlas dashboard
# Navigate to your cluster → ... → Backup
# Or use mongodump command-line tool
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose up -d --build

# Or use the deploy script
npm run deploy
```

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets (32+ characters)
   - Rotate secrets regularly

2. **MongoDB Atlas**
   - Use IP whitelisting in production
   - Enable encryption at rest
   - Regular backups

3. **Docker**
   - Run containers as non-root user
   - Keep images updated
   - Use Docker secrets for sensitive data

4. **Network**
   - Use HTTPS in production (setup SSL certificates)
   - Configure firewall rules
   - Use VPN or private network when possible

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
npm run test:connection

# Common issues:
# 1. Wrong credentials → Check MONGO_URI
# 2. IP not whitelisted → Add IP in Atlas Network Access
# 3. Network timeout → Check firewall/network settings
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Check container logs
docker-compose logs backend
```

### Port Conflicts

```bash
# Check if ports are in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# Change ports in docker-compose.yml or .env
```

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Test database: `npm run test:connection`
- Check health: `curl http://localhost:5000/api/health`

## 📝 Notes

- Default backend port: 5000
- Default frontend port: 80 (Docker) / 5173 (Dev)
- Database: MongoDB Atlas
- Node version: 18.x
- Docker Compose version: 3.8

---

**Last Updated:** $(date)
**Version:** 1.0.0

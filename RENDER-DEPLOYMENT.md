# Render Deployment Guide for Healthcare Management System (HMS)

## 🚀 Quick Deployment Steps

### Step 1: Fix MongoDB Atlas IP Whitelist

**This is the most important step!** Without this, your deployment will fail.

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com
2. **Go to Network Access**: Security → Network Access
3. **Add IP Address**:
   - Click "Add IP Address"
   - Enter `0.0.0.0/0` (Allow all IPs - for testing)
   - Click "Confirm"
   - **IMPORTANT**: This is for testing only. For production, whitelist Render's IP ranges.

4. **Alternative (More Secure)**:
   - Go to your Render dashboard
   - Find your deployed service
   - Copy the IP address
   - Add that specific IP to MongoDB Atlas Network Access

### Step 2: Deploy to Render

**Option A: Deploy from GitHub (Recommended)**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   ```
   Name: hms-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Add Environment Variables**:
   ```
   PORT=10000
   NODE_ENV=production
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-32-characters-long
   ```

6. **Click "Create Web Service"**

**Option B: Use render.yaml (Already Created)**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprints"**
3. **Connect your GitHub repository**
4. **Render will automatically detect `render.yaml`**
5. **Configure environment variables as above**
6. **Click "Apply"**

### Step 3: Verify Deployment

**After deployment completes:**

1. **Check Build Logs** for any errors
2. **Verify Health Endpoint**:
   ```
   https://your-service.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "uptime": 123.45,
     "database": "connected",
     "service": "HMS Backend",
     "environment": "production",
     "port": 10000
   }
   ```

3. **Test API Endpoints**:
   ```
   GET https://your-service.onrender.com/api
   GET https://your-service.onrender.com/api/auth
   ```

## 🔧 Environment Variables Configuration

### Required Variables for Render:

| Variable | Value | How to Get |
|----------|-------|------------|
| `PORT` | `10000` | Render's default port for Node.js apps |
| `NODE_ENV` | `production` | Set to production |
| `MONGO_URI` | MongoDB connection string | From Atlas dashboard |
| `JWT_SECRET` | Random 32+ character string | Generate with: `openssl rand -base64 32` |

### Example .env for Render:

```env
PORT=10000
NODE_ENV=production
MONGO_URI=mongodb+srv://yabmelaku3_db_user:jYGoN2qxGwfpwzlA@cluster0.f2ttn11.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🗄️ MongoDB Atlas Configuration

### Fix Your Current Issue:

**Error**: `Database Connection Refused... IP that isn't whitelisted`

**Solution**:
1. Login to MongoDB Atlas: https://cloud.mongodb.com
2. Go to: **Security → Network Access**
3. **Add IP Address**: 
   - Enter `0.0.0.0/0` (temporary for testing)
   - Click "Confirm"
4. **Wait 1-2 minutes** for changes to propagate
5. **Redeploy** on Render

### Create New Cluster (If Current One Doesn't Exist):

1. **Create New Cluster**:
   - Click "Create"
   - Choose "M0 FREE" tier
   - Select region (closest to your users)
   - Name: `hms-cluster`

2. **Create Database User**:
   - Security → Database Access
   - Add New Database User
   - Authentication: Password
   - Password: create strong password
   - Built-in Role: Read and Write to any database

3. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

## 🐛 Troubleshooting

### Common Errors and Solutions:

#### 1. "Database Connection Refused - IP not whitelisted"
```bash
# Solution: Add Render IPs to MongoDB Atlas
# Network Access → Add IP Address → 0.0.0.0/0
# OR get specific Render IP from your service dashboard
```

#### 2. "Port scan timeout reached"
```bash
# Solution: Ensure server binds to 0.0.0.0
# Our server.js now binds to: app.listen(PORT, '0.0.0.0', ...)
```

#### 3. "Mongoose timeout"
```bash
# Solution: Increase timeout in db.js
# Already configured: serverSelectionTimeoutMS: 30000
```

#### 4. "Invalid credentials"
```bash
# Solution: Verify MONGO_URI
# Format: mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE
# URL-encode special characters in password
```

#### 5. "Connection refused after successful build"
```bash
# Solution: Check Render logs
# The server now continues running even if DB connection fails
# Health endpoint shows DB status
```

### Check Render Logs:

1. **Go to Render Dashboard**
2. **Select your service**
3. **Click "Logs" tab**
4. **Look for**:
   - "MongoDB Connected Successfully"
   - "HMS Infrastructure layer streaming live on port"
   - Health check requests

### Manual Testing Commands:

```bash
# Test health endpoint
curl https://your-service.onrender.com/api/health

# Test main endpoint
curl https://your-service.onrender.com/

# Check server is running
curl -I https://your-service.onrender.com/api/health
```

## 🔄 Redeployment

### Update and Redeploy:

1. **Make changes to your code**
2. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Fix Render deployment"
   git push origin full
   ```
3. **Render automatically redeploys** when you push to connected branch

### Manual Redeploy:

1. **Go to Render Dashboard**
2. **Select your service**
3. **Click "Manual Deploy"**
4. **Choose "Deploy latest commit"**

## 📊 Monitoring

### Health Checks:
- Render automatically monitors `/api/health`
- Service restarts if health checks fail
- Check status in Render dashboard

### Logs:
- Access logs in Render dashboard
- Real-time log streaming
- Historical logs available

### Metrics:
- CPU usage
- Memory usage
- Response times
- Request counts

## 🔐 Security Best Practices

### For Production:

1. **Use Specific IP Whitelisting**:
   - Get Render IP from service dashboard
   - Add only that IP to MongoDB Atlas

2. **Strong JWT Secret**:
   ```bash
   # Generate strong secret
   openssl rand -base64 32
   ```

3. **Environment Variables**:
   - Never commit .env files
   - Use Render's environment variable management

4. **Regular Updates**:
   - Keep dependencies updated
   - Monitor for security vulnerabilities

### Render Security Features:

1. **Automatic HTTPS** (SSL/TLS)
2. **DDoS protection**
3. **Web Application Firewall**
4. **Automatic backups** (for paid plans)

## 🚀 Next Steps After Successful Deployment

1. **Test API Endpoints**:
   ```bash
   # Test authentication
   curl -X POST https://your-service.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   
   # Test patient endpoints
   curl https://your-service.onrender.com/api/patients
   ```

2. **Deploy Frontend** (Optional):
   - Create separate web service for frontend
   - Or use React/Vite build in same service
   - Configure CORS to allow frontend domain

3. **Set Up Custom Domain**:
   - Go to Render service settings
   - Add custom domain
   - Configure DNS records

4. **Enable Auto-Deploy**:
   - Connect GitHub repository
   - Auto-deploy on push to main branch
   - Preview deployments for pull requests

## 📞 Support Resources

### Render Documentation:
- [Getting Started with Render](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)

### MongoDB Atlas Documentation:
- [Atlas Network Access](https://www.mongodb.com/docs/atlas/security-whitelist/)
- [Connection Strings](https://www.mongodb.com/docs/guides/atlas/connection-string/)

### HMS System Documentation:
- See `DEPLOYMENT.md` for detailed setup
- See `CI-CD-SETUP.md` for CI/CD pipeline

## ✅ Deployment Checklist

- [ ] MongoDB Atlas Network Access configured
- [ ] Connection string verified and working
- [ ] Render service created
- [ ] Environment variables set
- [ ] Build successful
- [ ] Health endpoint responding
- [ ] Database connection established
- [ ] API endpoints testable
- [ ] Logs showing no errors

---

**Ready to Deploy?** 

1. Fix MongoDB Atlas Network Access first
2. Deploy to Render using the steps above
3. Test health endpoint
4. Share your deployment URL

**Deployment URL**: `https://hms-backend.onrender.com`

**Health Check**: `https://hms-backend.onrender.com/api/health`

**Status**: ✅ Code is ready for deployment
**Last Updated**: $(date)

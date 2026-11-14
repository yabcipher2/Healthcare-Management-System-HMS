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

## 🖥️ Deploy the Frontend (Static Site) and join it to the API

The React app is a static bundle: it is hosted separately and talks to the backend over HTTP. The two are joined by one value, `VITE_API_URL`, which the build bakes into the bundle.

### A. Create the Static Site
1. Render Dashboard → **New +** → **Static Site**.
2. Connect the same repository and branch (`full`).
3. Build settings:
   ```
   Root Directory: (repo root)
   Build Command:  cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```
4. **Environment Variables** → add:
   ```
   VITE_API_URL = https://hms-backend.onrender.com
   ```
   Use your backend's real URL from its Render page — no trailing slash, no `/api`.
5. **Redirects/Rewrites** → add:
   ```
   Source: /*      Destination: /index.html      Action: Rewrite
   ```
   This keeps client-side paths working on refresh or a direct link.
6. **Create Static Site**.

> `VITE_API_URL` is read at **build time**. If you add or change it after a build, use **Manual Deploy → Clear build cache & deploy**, otherwise the old bundle keeps calling the old URL.

### B. Or deploy both from `render.yaml`
`render.yaml` now declares both services (`hms-backend` web service and `hms-frontend` static site). Dashboard → **New +** → **Blueprint** → pick the repo → Render reads the file and asks for the `sync: false` values (`MONGO_URI`, `JWT_SECRET`, `VITE_API_URL`, optionally `CLIENT_ORIGIN`).

### C. Allow the frontend origin on the backend (optional but recommended)
Backend service → **Environment** → add:
```
CLIENT_ORIGIN = https://hms-frontend.onrender.com
```
Comma-separate several origins if you also test from somewhere else. Leave it unset and the API keeps accepting any origin (the previous behaviour).

### D. Verify the join
1. Open `https://hms-frontend.onrender.com` — the landing page and login form appear.
2. DevTools → **Network**: `POST …/api/auth/login` answers `200` and the URL is your backend host.
3. Sign in as a staff account (e.g. a doctor) and load the consult queue — the list arrives from Atlas through the backend.
4. Reload a deep path (e.g. `/login`) — it still renders instead of returning `404`.

### Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Page loads but every request fails with `ERR_CONNECTION_REFUSED … localhost:5000` | `VITE_API_URL` was empty at build time | Set it on the static site, then redeploy with a cleared cache |
| `Failed to fetch` / CORS error in console | `CLIENT_ORIGIN` set to a different origin than the site actually uses | Match it exactly (scheme + host, no trailing slash) or clear the variable |
| `404` after a refresh or on a direct link | Missing SPA rewrite | Add `/* → /index.html` as a **Rewrite** |
| Login works but images are missing | Scan images live on the backend's disk, which is ephemeral on Render's free plan | Expect them to disappear after a redeploy; use object storage for permanence |
| First request after idle takes ~30 s | Free instances sleep | Upgrade the instance type or keep it warm |

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
MONGO_URI=mongodb+srv://<db-user>:<db-password>@cluster0.xxxxx.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
# Origin allowed to call this API (the frontend URL). Leave empty to allow any.
CLIENT_ORIGIN=https://hms-frontend.onrender.com
```

> The real Atlas password belongs in the Render dashboard and `backend/.env` only — never in this file or in git.

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

2. **Deploy Frontend**: see “Deploy the Frontend” below — it is a separate static site joined to this API through `VITE_API_URL`.

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

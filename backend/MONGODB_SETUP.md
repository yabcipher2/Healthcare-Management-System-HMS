# MongoDB Setup Guide

Your HMS Backend requires MongoDB to run. Choose one of the options below:

## Option 1: MongoDB Atlas (Cloud) - RECOMMENDED ⭐
Easiest setup, no installation required.

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project and cluster (free tier)
4. In the cluster dashboard, click "Connect"
5. Choose "Drivers" and copy your connection string (should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/hms_digital
   ```
6. Update your `.env` file:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hms_digital
   ```
7. Run `npm run dev`

**Note:** Make sure your MongoDB Atlas IP whitelist includes your computer's IP or use `0.0.0.0/0` for development.

---

## Option 2: Local MongoDB Installation
Runs MongoDB on your Windows machine.

### Step 1: Download and Install
1. Go to [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Download **MongoDB Community Server** for Windows
3. Run the installer and follow the setup wizard
4. During installation, MongoDB will be set as a Windows Service (starts automatically)

### Step 2: Verify Installation
Open PowerShell and run:
```powershell
mongosh
```

If you see a MongoDB prompt, MongoDB is running correctly.

### Step 3: Configure .env
Your `.env` file should already have:
```env
MONGO_URI=mongodb://127.0.0.1:27017/hms_digital
```

### Step 4: Run Backend
```powershell
npm run dev
```

---

## Option 3: MongoDB with Docker
If you have Docker installed:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Your `.env` remains:
```env
MONGO_URI=mongodb://127.0.0.1:27017/hms_digital
```

---

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:27017"
- Local MongoDB is not running
- **Solution:** Start MongoDB (it should auto-start on Windows after installation)
- Check Services: `services.msc` → find "MongoDB" and ensure it's running

### Error: "authentication failed"
- MongoDB Atlas credentials are wrong
- **Solution:** Double-check username and password in connection string

### Error: "getaddrinfo ENOTFOUND"
- Invalid MongoDB URI format
- **Solution:** Copy the connection string directly from MongoDB Atlas dashboard

---

## Quick Start

After MongoDB is running, start your backend:

```bash
cd backend
npm install  # If you haven't already
npm run dev
```

You should see:
```
✅ MongoDB Database Engine Connected Successfully: localhost
HMS Backend Infrastructure Operational Mode: development Mode on Port Server Node: 5000
```

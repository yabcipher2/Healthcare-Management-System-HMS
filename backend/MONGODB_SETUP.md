# MongoDB Setup Guide

Your HMS Backend requires MongoDB to run. Choose one of the options below:

## Option 1: MongoDB Atlas (Cloud) - RECOMMENDED ⭐
The backend already supports Atlas; only `backend/.env` changes.

### 1. Create the cluster
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up / log in.
2. **Build a Database** → choose **Free** (M0; one free cluster per project).
3. Pick a provider (AWS/GCP/Azure) and the region closest to you (e.g. `eu-central-1` or `me-south-1`).
4. Click **Create Deployment**. Provisioning takes ~1–3 minutes.

### 2. Create the database user
Atlas opens the security prompt after the cluster is created (otherwise **Database Access → Add New Database User**):
- Authentication: **Password**
- Username: e.g. `mesra_app`
- Password: **Autogenerate** and copy it somewhere safe
- Role: **Read and write to any database**

This database user is separate from your Atlas login.

### 3. Allow your machine (Network Access)
**Network Access → Add IP Address → Add Current IP Address → Confirm.**
For development only you may use `0.0.0.0/0` (any IP); never for production.

### 4. Copy the connection string
**Clusters → Connect → Drivers → Node.js.** You get something like:
```
mongodb+srv://mesra_app:<db_password>@cluster0.abcd1.mongodb.net/?retryWrites=true&w=majority
```
Add the database name before the `?`, so the app uses the same DB name as now:
```
mongodb+srv://mesra_app:<db_password>@cluster0.abcd1.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
```
**URL-encode the password** — `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `?` → `%3F`, `#` → `%23`, `%` → `%25`.

### 5. Point the backend at Atlas
In `backend/.env` replace the local line:
```env
MONGO_URI=mongodb+srv://mesra_app:<db_password>@cluster0.abcd1.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
```
`MONGODB_URI` (the name Atlas uses) is also read if `MONGO_URI` is empty. Keep `.env` out of git.

### 6. Copy your existing data (optional but you probably want it)
From `backend/`:
```bash
# See what would be copied (no credentials, no writes)
npm run migrate:atlas -- --dry-run

# Copy local → Atlas
npm run migrate:atlas -- --target "mongodb+srv://mesra_app:<db_password>@cluster0.abcd1.mongodb.net/MesraHealthcare?retryWrites=true&w=majority" --yes
```
`--drop` empties the target collections first (replace rather than merge). The script copies documents in batches and recreates the model indexes (`cardId`, unique medicine `code`, `patientMrn`, …).

If you prefer Atlas to hold the secret, put the string in `.env` as `ATLAS_URI` and leave it out of the command:
```bash
npm run migrate:atlas -- --yes
```

### 7. Verify
```bash
npm run dev
```
Expected line:
```
MongoDB Connected Successfully (MongoDB Atlas): cluster0-shard-00-00.abcd1.mongodb.net/MesraHealthcare
```
Then open the app and sign in — the same 31 staff accounts and patient records are there once the migration ran.

The connection is logged without credentials; a wrong connection prints a hint (bad auth, IP not allowed, DNS, TLS, ECONNREFUSED).

### Atlas notes
- Uploaded ultrasound images stay in `backend/uploads/` on this machine — Atlas stores database records only. A backend on another host needs that folder copied too.
- Free clusters sleep/pause after long inactivity; the first request of the day can take a few seconds.
- Keep the local MongoDB running for a while after migrating: it is your rollback if anything looks wrong.

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

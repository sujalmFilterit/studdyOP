# Deploy Backend to Railway - Step by Step Guide

This guide will help you deploy your StudyBuddy backend to Railway.

## Prerequisites

1. **MongoDB Atlas Account** (Free tier)
   - Sign up: https://www.mongodb.com/cloud/atlas/register
   - Create a free M0 cluster
   - Get your connection string

2. **GitHub Account** (to connect repository)

3. **Railway Account**
   - Sign up: https://railway.app (use GitHub login)

---

## Step 1: Set Up MongoDB Atlas (5 minutes)

### 1.1 Create Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Build a Database"**
3. Choose **M0 FREE** tier
4. Select a region (closest to you)
5. Click **"Create"** (wait 3-5 minutes)

### 1.2 Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `studybuddy-admin` (or any name)
5. Password: Create a strong password (**SAVE THIS!**)
6. Set privileges to **"Atlas Admin"**
7. Click **"Add User"**

### 1.3 Configure Network Access
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### 1.4 Get Connection String
1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials
6. Add database name: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/studybuddy?retryWrites=true&w=majority`

**📝 Save this connection string!**

---

## Step 2: Deploy Backend to Railway (10 minutes)

### 2.1 Sign Up / Login to Railway
1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with **GitHub** (recommended)

### 2.2 Create New Project
1. Click **"New Project"** (top right)
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub if prompted
4. Find and select your **studybuddy** repository
5. Click **"Deploy Now"**

### 2.3 Configure Root Directory
1. After Railway detects your project, click on the service
2. Go to **"Settings"** tab
3. Scroll to **"Source"** section
4. Set **"Root Directory"** to: `backend`
5. Click **"Save"**

### 2.4 Add Environment Variables
1. In your Railway project, go to **"Variables"** tab
2. Click **"New Variable"** for each:

   **Variable 1: MONGO_URI**
   - Key: `MONGO_URI`
   - Value: Your MongoDB connection string from Step 1.4
   - Click **"Add"**

   **Variable 2: JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: Generate a random secret (use https://randomkeygen.com/)
   - Click **"Add"**

   **Variable 3: HF_TOKEN**
   - Key: `HF_TOKEN`
   - Value: `your-huggingface-token-here`
   - Click **"Add"**

   **Variable 4: NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click **"Add"**

### 2.5 Deploy
1. Railway will automatically detect it's a Node.js project
2. It will run `npm install` and `npm start`
3. Watch the deployment logs
4. Wait for **"Deploy successful"** message

### 2.6 Get Your Backend URL
1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Your backend URL will be shown (e.g., `https://studybuddy-backend-production.up.railway.app`)
4. **Copy this URL!**

---

## Step 3: Update Frontend to Use Backend (2 minutes)

### 3.1 Add Environment Variable in Vercel
1. Go to https://vercel.com/sujalvermans-projects/studybuddy/settings/environment-variables
2. Click **"Add New"**
3. Key: `VITE_API_BASE`
4. Value: `https://your-backend-url.railway.app/api` (replace with your Railway URL)
5. Environments: Select **Production**, **Preview**, and **Development**
6. Click **"Save"**

### 3.2 Redeploy Frontend
1. Go to **"Deployments"** tab in Vercel
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## Step 4: Test Your Deployment

### 4.1 Test Backend
1. Visit your Railway backend URL: `https://your-backend.railway.app`
2. You should see: `{"status":"ok","service":"studybuddy-backend"}`

### 4.2 Test Frontend
1. Visit your Vercel frontend: https://studybuddy-ckkuaqkte-sujalvermans-projects.vercel.app
2. Try to sign up or log in
3. Check browser console (F12) for any errors

---

## Troubleshooting

### Backend Not Starting?
- Check Railway logs: Go to your service → **"Deployments"** → Click on deployment → **"View Logs"**
- Verify all environment variables are set correctly
- Check that `MONGO_URI` is correct (no extra spaces)

### MongoDB Connection Failed?
- Verify MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- Check connection string has correct username/password
- Make sure database name is included in connection string

### Frontend Can't Reach Backend?
- Verify `VITE_API_BASE` is set correctly in Vercel
- Check backend URL is accessible (visit it directly)
- Check browser console for CORS errors
- Verify backend CORS allows your Vercel URL

### CORS Errors?
- Backend CORS is configured to allow your Vercel frontend
- If issues persist, check Railway logs for CORS errors

---

## Environment Variables Summary

### Backend (Railway)
```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/studybuddy?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here
HF_TOKEN=your-huggingface-token-here
NODE_ENV=production
```

### Frontend (Vercel)
```
VITE_API_BASE=https://your-backend.railway.app/api
```

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured (allow all IPs)
- [ ] MongoDB connection string obtained
- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] Root directory set to `backend`
- [ ] Environment variables added in Railway
- [ ] Backend deployed successfully
- [ ] Backend URL obtained
- [ ] `VITE_API_BASE` added in Vercel
- [ ] Frontend redeployed
- [ ] Tested backend endpoint
- [ ] Tested frontend connection

---

## Support

- Railway Docs: https://docs.railway.app/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Railway Discord: https://discord.gg/railway

---

## Next Steps

After successful deployment:
1. Test all features (signup, login, create study plans)
2. Monitor Railway logs for any errors
3. Set up custom domain (optional)
4. Configure monitoring and alerts (optional)


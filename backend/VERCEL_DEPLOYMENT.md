# Vercel Deployment Guide for StudyBuddy Backend

This guide will help you deploy your Node.js + Express backend to Vercel as a serverless function.

## 📋 Prerequisites

1. **GitHub Account** - For hosting your code
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas Account** - For cloud database (free tier available)
4. **HuggingFace Token** - Your API token for AI features

## 🗂️ Project Structure

```
backend/
├── api/
│   └── index.js          # Vercel serverless function wrapper
├── src/
│   ├── index.js          # Main Express app
│   ├── routes/           # API routes
│   ├── models/           # MongoDB models
│   └── middleware/       # Auth middleware
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── .vercelignore         # Files to ignore in deployment
```

## 🚀 Step-by-Step Deployment

### Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (choose free tier M0)
4. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Save the username and password
5. Whitelist IP addresses:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Vercel
6. Get your connection string:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/studybuddy?retryWrites=true&w=majority`

### Step 2: Prepare Your Code

1. **Ensure all files are ready:**
   - ✅ `api/index.js` - Serverless wrapper
   - ✅ `vercel.json` - Vercel configuration
   - ✅ `package.json` - Dependencies
   - ✅ `src/index.js` - Express app

2. **Update MongoDB URI:**
   - Your code already uses `process.env.MONGO_URI`
   - Make sure it's not hardcoded

### Step 3: Push to GitHub

1. **Initialize Git (if not already done):**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. **Create a new GitHub repository:**
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name it (e.g., `studybuddy-backend`)
   - Don't initialize with README
   - Click "Create repository"

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/studybuddy-backend.git
   git branch -M main
   git push -u origin main
   ```

### Step 4: Deploy to Vercel

1. **Sign in to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend` (if your repo has frontend too) or leave blank if backend is root
   - **Build Command:** Leave blank (Vercel will auto-detect)
   - **Output Directory:** Leave blank
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `MONGO_URI` | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/studybuddy?retryWrites=true&w=majority` | Production, Preview, Development |
   | `HF_TOKEN` | `hf_your_token_here` | Production, Preview, Development |
   | `JWT_SECRET` | `your-super-secret-jwt-key-here` | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Production, Preview |

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)

### Step 5: Verify Deployment

1. **Check Deployment URL:**
   - Vercel will provide a URL like: `https://your-project.vercel.app`
   - Test the root endpoint: `https://your-project.vercel.app/`
   - Should return: `{"status":"ok","service":"studybuddy-backend"}`

2. **Test API Endpoints:**
   ```bash
   # Test root endpoint
   curl https://your-project.vercel.app/
   
   # Test health check
   curl https://your-project.vercel.app/api/chat/health
   ```

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### api/index.js
```javascript
import app from '../src/index.js';
export default (req, res) => {
  return app(req, res);
};
```

## 🌍 Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

- **MONGO_URI**: MongoDB Atlas connection string
- **HF_TOKEN**: Your HuggingFace API token
- **JWT_SECRET**: Secret key for JWT tokens
- **NODE_ENV**: `production`
- **FRONTEND_URL**: Your frontend URL (for CORS)

## 📝 Important Notes

1. **Serverless Functions:**
   - No `app.listen()` - Vercel handles this
   - Functions have a 10-second timeout (Hobby plan)
   - Cold starts may occur (first request slower)

2. **MongoDB Connection:**
   - Connection is cached to reuse across invocations
   - Connection pool is optimized for serverless

3. **CORS:**
   - Update `FRONTEND_URL` in environment variables
   - Add your frontend domain to allowed origins

4. **API Routes:**
   - All routes are accessible at: `https://your-project.vercel.app/api/...`
   - Example: `https://your-project.vercel.app/api/chat/chat`

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `api/index.js` exists
- Check Vercel build logs for errors

### MongoDB Connection Issues
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
- Verify database user credentials

### API Returns 404
- Check `vercel.json` routes configuration
- Ensure `api/index.js` exports correctly
- Verify routes are prefixed with `/api/`

### CORS Errors
- Update `FRONTEND_URL` environment variable
- Check CORS configuration in `src/index.js`
- Add your frontend domain to allowed origins

## 🔄 Updating Deployment

1. **Make changes to your code**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update code"
   git push
   ```
3. **Vercel automatically redeploys** (if connected to GitHub)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Express on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Root endpoint tested
- [ ] API endpoints tested
- [ ] Frontend CORS configured

---

**Need Help?** Check Vercel logs in the dashboard or MongoDB Atlas connection logs.


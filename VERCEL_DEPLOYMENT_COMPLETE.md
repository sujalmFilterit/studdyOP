# Complete Vercel Deployment Guide

## 📁 Final Folder Structure

```
studybuddy/
├── api/
│   └── index.js                    # ✅ Vercel serverless function wrapper
├── backend/
│   ├── src/
│   │   ├── index.js                # ✅ Express app (serverless-ready)
│   │   ├── routes/                 # ✅ All API routes
│   │   ├── models/                 # ✅ MongoDB models
│   │   └── middleware/            # ✅ Auth middleware
│   └── package.json                # ✅ Backend dependencies
├── frontend/
│   ├── src/                        # ✅ React/TypeScript source
│   ├── dist/                       # ✅ Build output (generated)
│   └── package.json                # ✅ Frontend dependencies
├── vercel.json                     # ✅ Vercel configuration
└── README.md
```

---

## 🔧 Key Files Explained

### 1. `/api/index.js` (Root Level)
**Purpose:** Vercel serverless function wrapper

```javascript
import app from '../backend/src/index.js';
export default (req, res) => {
  return app(req, res);
};
```

**Why:** Vercel looks for `/api` folder at root for serverless functions.

---

### 2. `/backend/src/index.js`
**Key Changes:**
- ✅ Exports Express app (no `app.listen()` in Vercel)
- ✅ Health endpoint at `/api/health`
- ✅ CORS configured for Vercel URLs
- ✅ MongoDB connection optimized for serverless

**Serverless Detection:**
```javascript
// Only start server if NOT on Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
```

---

### 3. `/vercel.json` (Root Level)
**Configuration:**
- Builds backend as serverless function
- Builds frontend as static site
- Routes `/api/*` to backend
- Routes everything else to frontend

---

### 4. `/frontend/package.json`
**Build Script:**
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "npm run build"
  }
}
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Code

1. **Ensure all files are in place:**
   - ✅ `/api/index.js` exists at root
   - ✅ `/vercel.json` exists at root
   - ✅ `/backend/src/index.js` exports app
   - ✅ `/frontend/package.json` has build script

2. **Verify no hardcoded secrets:**
   ```bash
   # Check for hardcoded tokens
   grep -r "hf_" backend/src/
   grep -r "mongodb://" backend/src/
   # Should return nothing or only in comments
   ```

### Step 2: Push to GitHub

```bash
# Navigate to project root
cd /path/to/studybuddy

# Add all files
git add .

# Commit
git commit -m "Configure for Vercel deployment"

# Push
git push origin main
```

### Step 3: Deploy to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** Leave blank (or set to `.` if needed)
   - **Build Command:** Leave blank (Vercel auto-detects)
   - **Output Directory:** Leave blank (handled by vercel.json)
   - **Install Command:** Leave blank (Vercel auto-detects)

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/studybuddy?retryWrites=true&w=majority` | Production, Preview, Development |
   | `HF_TOKEN` | `hf_your_token_here` | Production, Preview, Development |
   | `JWT_SECRET` | `your-secret-key-here` | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |
   | `FRONTEND_URL` | `https://your-project.vercel.app` | Production |

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)

### Step 4: Verify Deployment

1. **Test Backend:**
   ```bash
   # Health check
   curl https://your-project.vercel.app/api/health
   
   # Expected response:
   # {
   #   "status": "ok",
   #   "service": "studybuddy-backend",
   #   "timestamp": "2025-01-XX...",
   #   "environment": "production",
   #   "mongodb": "connected"
   # }
   ```

2. **Test Frontend:**
   - Visit: `https://your-project.vercel.app`
   - Should load your React app

3. **Test API Endpoints:**
   ```bash
   # Test an API route
   curl https://your-project.vercel.app/api/auth/test
   ```

---

## 🔐 Environment Variables Setup

### Where to Add in Vercel:

1. **Go to Project Settings:**
   - Vercel Dashboard → Your Project → Settings

2. **Click "Environment Variables"**

3. **Add Each Variable:**
   - Click "Add New"
   - Enter variable name
   - Enter variable value
   - Select environments (Production, Preview, Development)
   - Click "Save"

### Required Variables:

#### `MONGO_URI`
**How to get:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster (free tier M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Get connection string:
   - Database → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/studybuddy?retryWrites=true&w=majority`

#### `HF_TOKEN`
**How to get:**
1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Create new token
3. Copy token (starts with `hf_`)
4. Paste into Vercel environment variable

#### `JWT_SECRET`
**How to generate:**
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Or use any long random string.

#### `NODE_ENV`
- Set to: `production`
- Only needed for Production environment

#### `FRONTEND_URL`
- Set to: `https://your-project.vercel.app`
- Used for CORS configuration

---

## 🌐 CORS Configuration

The backend is configured to handle CORS properly:

```javascript
// In backend/src/index.js
app.use(cors({
  origin: function (origin, callback) {
    // Development: allow all
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Production: check allowed origins
    // Includes Vercel URLs automatically
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**What it does:**
- Allows requests from your Vercel frontend
- Allows requests from localhost (development)
- Supports credentials (cookies, auth headers)
- Handles preflight OPTIONS requests

---

## 📝 How Serverless Works in Vercel

### Traditional Server:
```
Request → Server (always running) → Response
```

### Vercel Serverless:
```
Request → Function (invoked on-demand) → Response → Function may sleep
```

### Key Differences:

1. **No Persistent Server:**
   - Functions are invoked per request
   - No `app.listen()` needed
   - Vercel manages the server lifecycle

2. **Cold Starts:**
   - First request may be slower (function initialization)
   - Subsequent requests are faster (warm function)
   - Vercel keeps functions warm for active deployments

3. **Connection Reuse:**
   - MongoDB connections are cached
   - Mongoose handles connection pooling
   - Connections persist across invocations (when warm)

4. **Stateless:**
   - Each function invocation is independent
   - Don't rely on in-memory state
   - Use database for persistent data

5. **Scaling:**
   - Auto-scales based on traffic
   - Each request may use a different function instance
   - No manual scaling needed

### Request Flow:

```
1. User visits: https://your-app.vercel.app/api/health
2. Vercel routes to: /api/index.js (serverless function)
3. api/index.js imports: backend/src/index.js
4. Express app handles request
5. Response sent back
6. Function may be kept warm for next request
```

---

## 🧪 Testing Locally

### Test as Serverless (Vercel CLI):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run locally (simulates serverless)
vercel dev
```

### Test as Traditional Server:

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run (will start server on port 4000)
npm start
```

---

## 🐛 Troubleshooting

### Build Fails

**Issue:** Build command fails
**Solution:**
- Check `vercel.json` configuration
- Verify `api/index.js` exists
- Check build logs in Vercel dashboard

### MongoDB Connection Fails

**Issue:** `mongodb: "disconnected"` in health check
**Solution:**
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0`)
- Verify database user credentials
- Check connection string format

### CORS Errors

**Issue:** Frontend can't call backend API
**Solution:**
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in `backend/src/index.js`
- Ensure frontend URL matches Vercel deployment URL

### 404 on API Routes

**Issue:** `/api/*` routes return 404
**Solution:**
- Verify `api/index.js` exists at root
- Check `vercel.json` routes configuration
- Ensure routes are prefixed with `/api/` in Express

### Function Timeout

**Issue:** Requests timeout after 10 seconds
**Solution:**
- Vercel Hobby plan: 10-second limit
- Optimize long-running operations
- Consider upgrading to Pro plan (60-second limit)

---

## ✅ Deployment Checklist

- [ ] `/api/index.js` exists at root
- [ ] `/vercel.json` configured correctly
- [ ] `/backend/src/index.js` exports app (no app.listen in Vercel)
- [ ] `/frontend/package.json` has `"build": "vite build"`
- [ ] All environment variables set in Vercel
- [ ] MongoDB Atlas configured and accessible
- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked
- [ ] Deployment successful
- [ ] Health check endpoint works: `/api/health`
- [ ] Frontend loads correctly
- [ ] API endpoints accessible

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Express on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

---

## 🎯 Summary

Your project is now configured for Vercel:

✅ **Backend:** Serverless function (no port, no app.listen)  
✅ **Frontend:** Static build (Vite)  
✅ **Routing:** `/api/*` → Backend, `/*` → Frontend  
✅ **Environment Variables:** Set in Vercel dashboard  
✅ **CORS:** Configured for Vercel URLs  
✅ **MongoDB:** Serverless-friendly connection pooling  

**Your app is ready to deploy!** 🚀


# Vercel Deployment - Complete File Structure

## 📁 Complete File Structure

```
backend/
├── api/
│   └── index.js                    # ✅ Vercel serverless function wrapper
├── src/
│   ├── index.js                    # ✅ Main Express app (updated for serverless)
│   ├── routes/                     # ✅ All API routes
│   │   ├── chat.routes.js          # ✅ Uses HF_TOKEN from env
│   │   ├── auth.routes.js
│   │   └── ... (other routes)
│   ├── models/                     # ✅ MongoDB models
│   └── middleware/                 # ✅ Auth middleware
├── vercel.json                     # ✅ Vercel configuration
├── package.json                    # ✅ Dependencies (already correct)
├── .vercelignore                   # ✅ Files to ignore
├── VERCEL_DEPLOYMENT.md            # ✅ Detailed deployment guide
├── QUICK_START.md                  # ✅ Quick reference
└── DEPLOYMENT_SUMMARY.md           # ✅ This file
```

## 🔑 Key Files Explained

### 1. `api/index.js` (Serverless Wrapper)
```javascript
import app from '../src/index.js';
export default (req, res) => {
  return app(req, res);
};
```
**Purpose:** Wraps Express app for Vercel serverless functions. No `app.listen()` needed.

### 2. `vercel.json` (Vercel Config)
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
**Purpose:** Tells Vercel to use Node.js runtime and route all requests to the serverless function.

### 3. `src/index.js` (Main App)
**Key Changes:**
- ✅ Exports Express app (no `app.listen()` in Vercel)
- ✅ MongoDB connection optimized for serverless
- ✅ Uses `process.env.MONGO_URI` for MongoDB Atlas
- ✅ Uses `process.env.HF_TOKEN` for HuggingFace
- ✅ CORS configured for frontend

### 4. Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/studybuddy?retryWrites=true&w=majority` |
| `HF_TOKEN` | HuggingFace API token | `hf_your_token_here` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key-here` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.vercel.app` |

## ✅ What's Already Done

1. ✅ **Serverless Function Wrapper** - `api/index.js` created
2. ✅ **Vercel Configuration** - `vercel.json` configured
3. ✅ **MongoDB Connection** - Optimized for serverless with connection caching
4. ✅ **Environment Variables** - All routes use `process.env.*`
5. ✅ **No app.listen()** - Server only starts in non-Vercel environments
6. ✅ **CORS Configuration** - Ready for frontend integration
7. ✅ **Error Handling** - Graceful error handling for serverless

## 🚀 Deployment Steps

### Step 1: MongoDB Atlas Setup
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Get connection string

### Step 2: Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/studybuddy-backend.git
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Add environment variables (see above)
4. Deploy

### Step 4: Test
```bash
# Test root endpoint
curl https://your-project.vercel.app/

# Expected response:
# {"status":"ok","service":"studybuddy-backend"}
```

## 📝 Sample Protected Route

Your `chat.routes.js` already includes a protected route using `HF_TOKEN`:

```javascript
// Uses requireAuth middleware
router.post('/chat', requireAuth, async (req, res) => {
  // Uses process.env.HF_TOKEN
  const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN || "fallback-token"
  });
  // ... rest of the route
});
```

## 🔍 Verification Checklist

Before deploying, verify:

- [ ] `api/index.js` exists and exports correctly
- [ ] `vercel.json` points to `api/index.js`
- [ ] `src/index.js` exports Express app (no `app.listen()` in Vercel)
- [ ] MongoDB connection uses `process.env.MONGO_URI`
- [ ] All routes use environment variables (no hardcoded secrets)
- [ ] `package.json` has `"type": "module"` for ES modules
- [ ] All dependencies are in `package.json`

## 🐛 Common Issues & Solutions

### Issue: Build fails
**Solution:** Check that `api/index.js` exists and `vercel.json` is correct

### Issue: MongoDB connection fails
**Solution:** 
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0`)
- Verify database user credentials

### Issue: 404 on all routes
**Solution:** Check `vercel.json` routes configuration

### Issue: CORS errors
**Solution:** Update `FRONTEND_URL` environment variable

## 📚 Documentation Files

- **VERCEL_DEPLOYMENT.md** - Complete step-by-step guide
- **QUICK_START.md** - Fast deployment reference
- **DEPLOYMENT_SUMMARY.md** - This file (overview)

## 🎯 Next Steps

1. Set up MongoDB Atlas (if not done)
2. Push code to GitHub
3. Deploy to Vercel
4. Add environment variables
5. Test endpoints
6. Update frontend to use new API URL

---

**Your backend is now ready for Vercel deployment!** 🚀


# Quick Start: Deploy to Vercel

## 🚀 Fast Deployment (5 minutes)

### 1. Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Ready for Vercel"
git remote add origin https://github.com/YOUR_USERNAME/studybuddy-backend.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click "Add New" → "Project"
3. Import your repository
4. **Add Environment Variables:**
   - `MONGO_URI` - Your MongoDB Atlas connection string
   - `HF_TOKEN` - Your HuggingFace token
   - `JWT_SECRET` - A random secret string
   - `NODE_ENV` - `production`
5. Click "Deploy"

### 3. Test Your API
```bash
curl https://your-project.vercel.app/
# Should return: {"status":"ok","service":"studybuddy-backend"}
```

## 📝 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/studybuddy?retryWrites=true&w=majority
HF_TOKEN=hf_your_token_here
JWT_SECRET=your-secret-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

## ✅ That's it!

Your API is now live at: `https://your-project.vercel.app`

For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)


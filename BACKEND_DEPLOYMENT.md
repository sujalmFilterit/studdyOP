# Backend Deployment Guide

This guide covers deploying the Express + MongoDB backend to Railway (recommended) or any Node-compatible platform. The frontend consumes the API through the `/api` routes, so make sure you expose the server under a public HTTPS URL and update the frontend `VITE_API_BASE` variable accordingly.

---

## 1. Requirements

- Node.js 18+
- MongoDB Atlas cluster (connection string ready)
- Hugging Face API token
- GitHub repository with the latest backend code (`backend/` directory contains `package.json`)

---

## 2. Environment Variables (Railway/Render/Other)

Set these on your hosting provider **before** deploying:

| Name | Value | Notes |
|------|-------|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/studybuddy?retryWrites=true&w=majority` | MongoDB Atlas URI. URL-encode special characters in the password. |
| `HF_TOKEN` | `hf_xxx` | Hugging Face API token used by AI routes. |
| `JWT_SECRET` | random string | Generate via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `NODE_ENV` | `production` | Ensures production logging + CORS rules. |
| `PORT` | `4000` (or leave unset) | Railway/Render inject their own ports—use their env variable if provided. |
| `FRONTEND_URL` | e.g., `https://studybuddy.vercel.app` | Enables strict CORS in production. |

Optional:
- `VERCEL` (Railway leaves unset) – automatically handled; no need to add.
- `MONGO_DEBUG` (set to `true` if you need verbose Mongo logs).

---

## 3. Deploy to Railway (Recommended)

1. **Create a new service**
   - Go to https://railway.app · click **New Project → Deploy from GitHub**
   - Select your repository
   - When prompted for the directory, set **Root Directory** to `backend`

2. **Configure build & start commands**
   - Railway auto-detects Node projects. For clarity set:
     - Build: `npm install`
     - Start: `npm start`

3. **Add environment variables**
   - Project → Variables → Add new variable (table above)
   - For MongoDB, ensure your Atlas cluster allows Railway’s outbound IPs (`0.0.0.0/0` works for testing)

4. **Deploy**
   - Railway will install dependencies, run `npm start`, then expose a public URL like `https://studybuddy-production.up.railway.app`
   - Monitor logs under **Deployments** to confirm `MongoDB connected` appears

5. **Update the frontend**
   - Set Vercel’s `VITE_API_BASE` to the Railway URL + `/api` (example: `https://studybuddy-production.up.railway.app/api`)
   - Redeploy the frontend so requests point to the new backend

---

## 4. Alternative Hosts

### Render
1. Dashboard → **New → Web Service**
2. Connect GitHub repo, set Root Directory to `backend`
3. Build Command: `npm install`  
   Start Command: `npm start`
4. Add the environment variables
5. Render will provide a URL such as `https://studybuddy-backend.onrender.com`

### Self-host / VPS
1. SSH into the server
2. Install Node.js 18+, PM2, and pull the repository
3. Run `cd backend && npm install`
4. Add environment variables to `.env` or process manager
5. Start with `npm start` (or `pm2 start npm --name studybuddy -- start`)
6. Reverse-proxy the port through Nginx/Apache with HTTPS

---

## 5. Post-Deployment Checklist

- `GET /api/health` returns `{ status: "ok", mongodb: "connected" }`
- MongoDB Atlas shows recent connections
- CORS errors are gone when using the production frontend
- Hugging Face routes respond successfully (`/api/ai-schedule`, `/api/chat`)

Troubleshooting tips:
- **MongoDB connection errors** → re-check `MONGO_URI`, whitelist IPs, and ensure the cluster is running.
- **503 service unavailable** → service may be booting; check platform logs.
- **CORS blocked** → verify `FRONTEND_URL` matches the exact domain (including protocol).

Keep this document alongside `VERCEL_DEPLOYMENT.md` so the team has one reference for frontend deployment and one for backend infrastructure.


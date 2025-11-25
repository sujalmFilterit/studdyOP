# Vercel Deployment Guide

Use this guide to deploy the entire StudyBuddy project (React frontend + Express API) to Vercel. The root `vercel.json` routes `/api/*` to the Express serverless function and every other path to the Vite-built frontend.

---

## 1. Prerequisites

- MongoDB Atlas cluster (connection string ready)
- Hugging Face API token with access to the required model
- GitHub repository connected to your Vercel account
- Node.js 18+ locally if you plan to run `vercel dev`

Repository layout:

```
studybuddy/
├── api/index.js        # Vercel serverless entry (imports backend/src/index.js)
├── backend/src         # Express code, models, routes, middleware
├── frontend/           # React + Vite app
└── vercel.json         # Configures frontend + API routing
```

---

## 2. Environment Variables (Vercel)

Add these under **Vercel → Project → Settings → Environment Variables**. Apply to Production, Preview, and Development unless noted.

| Name | Value | Notes |
|------|-------|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/studybuddy?retryWrites=true&w=majority` | MongoDB Atlas URI. URL-encode the password if it has special characters. |
| `HF_TOKEN` | `hf_xxx` | Hugging Face token for the AI schedule + chat routes. |
| `JWT_SECRET` | random string | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `NODE_ENV` | `production` | Ensures production-only code paths run on Vercel. |
| `FRONTEND_URL` | `https://your-project.vercel.app` | Referenced by backend CORS logic. |
| `VITE_API_BASE` | `https://your-project.vercel.app/api` | Frontend uses this base URL for all API calls. |

Tips:
- After editing Atlas network access, wait at least 1–2 minutes before redeploying.
- `MONGO_URI` should end with the database name you want to use (e.g., `studybuddy`).

---

## 3. Deploy Steps

1. **Push latest code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel"
   git push origin main   # or dev
   ```

2. **Import the repo into Vercel (first time only)**
   - Vercel Dashboard → **Add New → Project**
   - Select the GitHub repo
   - Keep root directory as `.` (vercel.json handles the rest)

3. **Set the environment variables** (table above)

4. **Deploy / Redeploy**
   - Click **Deploy**
   - Build typically finishes within 2–4 minutes

5. **Optional: run locally with serverless parity**
   ```bash
   npm i -g vercel
   vercel login
   vercel link        # run once
   vercel dev         # serves frontend + /api locally
   ```

---

## 4. Post-Deployment Checks

- Visit `https://your-project.vercel.app/` → frontend loads
- Call `https://your-project.vercel.app/api/health` → response shows `{ mongodb: "connected" }`
- Confirm `VITE_API_BASE` matches the deployed domain (Settings → Environment Variables)
- In MongoDB Atlas, check Cluster → Metrics → Connections to confirm recent connections

If MongoDB fails to connect:
1. Re-verify `MONGO_URI` and credentials  
2. Ensure your Atlas IP whitelist includes Vercel (use `0.0.0.0/0` temporarily)  
3. Redeploy after making changes  

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails with TypeScript errors | Run `cd frontend && npm run build` locally to see exact errors. |
| API calls blocked by CORS | Ensure `FRONTEND_URL` equals the deployed Vercel domain. |
| Requests time out after 10s | Hobby plan limit—optimize request or upgrade to Pro (60s). |
| MongoDB “IP not whitelisted” even after adding IP | Remove and re-add IP in Atlas or whitelist `0.0.0.0/0` while testing. |

Use `BACKEND_DEPLOYMENT.md` for instructions on hosting the backend on other platforms (Railway, Render, etc.).


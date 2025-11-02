# 🚀 Deployment Guide - EcoTrack AI

Complete guide to deploying EcoTrack AI on Netlify (Frontend) and Render (Backend).

---

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts
- [ ] GitHub account
- [ ] Netlify account
- [ ] Render account
- [ ] MongoDB Atlas account
- [ ] Perplexity AI API key
- [ ] Groq AI API key

### ✅ Repository Preparation
- [ ] Code pushed to GitHub
- [ ] `.gitignore` properly configured
- [ ] `.env` files NOT committed
- [ ] Dependencies up to date
- [ ] Build tested locally

---

## 🔧 Part 1: MongoDB Atlas Setup

### 1. Create Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (Free tier available)
3. Choose region closest to your users
4. Wait for cluster creation (~3-5 minutes)

### 2. Create Database User
1. Database Access → Add New Database User
2. Authentication Method: Password
3. Username: `ecotrack_admin`
4. Password: Generate secure password
5. Database User Privileges: Read and write to any database
6. Add User

### 3. Configure Network Access
1. Network Access → Add IP Address
2. Select: **Allow Access from Anywhere** (0.0.0.0/0)
   - Note: For production, restrict to Render's IP ranges
3. Confirm

### 4. Get Connection String
1. Clusters → Connect → Connect your application
2. Driver: Python, Version: 3.12 or later
3. Copy connection string:
```
mongodb+srv://ecotrack_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
4. Replace `<password>` with actual password
5. Add database name: `ecotrack`
```
mongodb+srv://ecotrack_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ecotrack?retryWrites=true&w=majority
```

### 5. Create Collections (Automatic)
Collections auto-create on first use:
- `users`
- `user_stats`
- `activities`
- `waste_classifications`
- `user_achievements`
- `user_goals`

---

## 🖥️ Part 2: Backend Deployment (Render)

### 1. Prepare Backend

**Update `backend/main.py` for production:**

```python
# Add at top after imports
import os

# Update CORS for production
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-netlify-app.netlify.app",  # Add your Netlify URL
    "https://eco-track-ai.netlify.app",      # Example
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Create `render.yaml` (Optional)

Create in root directory:
```yaml
services:
  - type: web
    name: ecotrack-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.13.0
```

### 3. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. **New+ → Web Service**
3. Connect GitHub repository
4. Configure:
   - **Name:** `ecotrack-backend`
   - **Region:** Choose closest to users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** Free (or Starter $7/month for better performance)

5. **Add Environment Variables:**
   Click "Advanced" → Environment Variables:
   ```
   MONGODB_URL=mongodb+srv://ecotrack_admin:PASSWORD@cluster0...
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=your-app-password
   RECIPIENT_EMAIL=admin@ecotrack.com
   ```

6. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (~5-10 minutes)
   - Check logs for errors
   - Note the URL: `https://ecotrack-backend.onrender.com`

### 4. Test Backend

```bash
curl https://ecotrack-backend.onrender.com/
# Should return: {"message": "Welcome to EcoTrack API!"}

# Test API docs
# Visit: https://ecotrack-backend.onrender.com/docs
```

---

## 🌐 Part 3: Frontend Deployment (Netlify)

### 1. Update Frontend Configuration

**Update `.env.local` → Create `.env.production`:**
```env
NEXT_PUBLIC_BACKEND_URL=https://ecotrack-backend.onrender.com
NEXTAUTH_SECRET=generate-a-new-secret-for-production
NEXTAUTH_URL=https://your-app.netlify.app
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

**Update `next.config.mjs`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimize for serverless
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  images: {
    domains: ['res.cloudinary.com'], // If using Cloudinary
  },
}

export default nextConfig
```

### 2. Create `netlify.toml`

Already exists, but verify:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 3. Deploy on Netlify

#### Option A: Git Integration (Recommended)

1. Go to [Netlify](https://app.netlify.com/)
2. **Add new site → Import an existing project**
3. **Connect to Git provider:** GitHub
4. **Select repository:** `Eco-Track-Ai`
5. **Configure build settings:**
   - **Base directory:** (leave empty)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18

6. **Add Environment Variables:**
   Site settings → Environment variables → Add variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://ecotrack-backend.onrender.com
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=https://your-app.netlify.app
   GROQ_API_KEY=gsk_xxxxxxxxxxxxx
   ```

7. **Deploy:**
   - Click "Deploy site"
   - Wait for build (~2-5 minutes)
   - Auto-deploys on every push to main branch

#### Option B: Manual Deploy

```bash
# Build locally
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### 4. Configure Custom Domain (Optional)

1. Netlify → Domain settings
2. Add custom domain
3. Update DNS records (A or CNAME)
4. Wait for SSL certificate (auto-generated)

### 5. Update Backend CORS

After deployment, update `backend/main.py`:
```python
FRONTEND_ORIGINS = [
    "https://eco-track-ai.netlify.app",  # Your actual Netlify URL
    "http://localhost:3000",  # Keep for local dev
]
```

Redeploy backend on Render.

---

## ✅ Part 4: Post-Deployment Verification

### 1. Test Frontend
- [ ] Visit Netlify URL
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Login/Register functional

### 2. Test Backend Integration
- [ ] Register new account
- [ ] Login successfully
- [ ] Access dashboard
- [ ] Log test activity
- [ ] View tracking page

### 3. Test AI Features
- [ ] Waste classifier (upload image)
- [ ] EcoChat (ask question)
- [ ] Insights generation
- [ ] Carbon calculations

### 4. Test Goals & Achievements
- [ ] Create goal
- [ ] Log activities
- [ ] Check goal progress
- [ ] Unlock achievement

### 5. Performance Check
- [ ] Page load speed < 3 seconds
- [ ] API response time < 500ms
- [ ] No console errors
- [ ] Mobile responsiveness

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch" / CORS Errors

**Solution:**
1. Check backend CORS configuration
2. Ensure frontend URL in `FRONTEND_ORIGINS`
3. Verify `NEXT_PUBLIC_BACKEND_URL` is correct
4. Check browser console for exact error

### Issue: Backend "Application Error"

**Solution:**
1. Check Render logs
2. Verify all environment variables set
3. Check MongoDB connection string
4. Ensure `PORT` variable auto-set by Render

### Issue: "502 Bad Gateway"

**Solution:**
1. Backend still starting (wait 1-2 minutes)
2. Check if instance sleeping (Render free tier)
3. Increase instance resources
4. Check error logs

### Issue: Images Not Loading

**Solution:**
1. Check Cloudinary configuration (if used)
2. Verify image domains in `next.config.mjs`
3. Check network tab for 403/404 errors

### Issue: MongoDB Connection Failed

**Solution:**
1. Verify connection string format
2. Check password has no special chars needing encoding
3. Ensure IP whitelist includes 0.0.0.0/0
4. Test connection string locally first

---

## 📊 Monitoring & Maintenance

### Render Monitoring
- View logs: Render Dashboard → Logs
- Monitor uptime
- Check resource usage
- Set up alerts

### Netlify Monitoring
- Build logs
- Deploy previews for PRs
- Analytics (if enabled)
- Form submissions tracking

### MongoDB Atlas
- Database size
- Connection count
- Query performance
- Backups (auto-enabled)

---

## 💰 Cost Estimate

### Free Tier (Suitable for Testing)
- **Render:** Free (with limitations)
  - Spins down after 15min inactivity
  - 750 hours/month
- **Netlify:** Free
  - 100GB bandwidth/month
  - 300 build minutes/month
- **MongoDB Atlas:** Free
  - 512MB storage
  - Shared cluster
- **Total:** $0/month

### Recommended Production
- **Render Starter:** $7/month
  - Always on
  - 512MB RAM
- **Netlify Pro:** $19/month (optional)
  - 400GB bandwidth
  - Team features
- **MongoDB M10:** $57/month (optional)
  - 10GB storage
  - Dedicated cluster
- **Total:** $7-83/month

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

**Netlify:**
- Automatically deploys on push to `main`
- Deploy previews for PRs

**Render:**
- Auto-deploys on push to `main`
- Can set up manual deploy

### Branch Deployments

**Preview Environments:**
```
# Netlify branch deploys
main → https://eco-track-ai.netlify.app
dev → https://dev--eco-track-ai.netlify.app
feature-x → https://feature-x--eco-track-ai.netlify.app
```

---

## 📝 Environment Variables Reference

### Frontend (.env.production)
```env
NEXT_PUBLIC_BACKEND_URL=https://ecotrack-backend.onrender.com
NEXTAUTH_SECRET=production-secret-min-32-chars
NEXTAUTH_URL=https://eco-track-ai.netlify.app
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### Backend (Render)
```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/ecotrack
JWT_SECRET=production-jwt-secret-min-32-chars
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@ecotrack.com
SENDER_PASSWORD=app-specific-password
RECIPIENT_EMAIL=admin@ecotrack.com
```

---

## 🎉 Deployment Complete!

Your EcoTrack AI app is now live! 🌍

**Next Steps:**
1. Share with users
2. Monitor performance
3. Gather feedback
4. Iterate and improve
5. Add analytics (Google Analytics, Mixpanel)
6. Set up error tracking (Sentry)

---

## 🔗 Useful Links

- [Render Docs](https://render.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Need help? Check the [Troubleshooting](#-troubleshooting) section or open an issue on GitHub!**

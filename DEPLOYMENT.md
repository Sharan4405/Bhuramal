# 🚀 Deployment Guide - CI/CD Setup

## Overview
This project uses automatic deployment with:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (Express + Socket.io)
- **Database**: MongoDB Atlas
- **CI/CD**: GitHub Actions

---

## 📋 Prerequisites

1. **GitHub Account** - Your code repository
2. **Vercel Account** - [vercel.com](https://vercel.com) (free tier)
3. **Railway Account** - [railway.app](https://railway.app) (free tier with $5 credit)
4. **MongoDB Atlas** - [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier)

---

## 🎯 Step-by-Step Setup

### 1. Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier M0)
3. Create a database user
4. Whitelist all IPs: `0.0.0.0/0` (for Railway/Vercel access)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database
   ```

---

### 2. Backend Deployment (Railway)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize GitHub and select your repository

3. **Configure Backend Service**
   - Railway will auto-detect your Node.js app
   - Set Root Directory: `/` (or leave blank)
   - Set Start Command: `npm start`

4. **Add Environment Variables**
   - Go to "Variables" tab
   - Add all variables from `.env.example`:
   ```
   PORT=3000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_VERIFY_TOKEN=...
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. **Generate Domain**
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy URL (e.g., `https://your-app.up.railway.app`)

6. **Enable Auto-Deploy**
   - Settings → "Deploy"
   - Enable "Auto Deploy on Push to main"

---

### 3. Frontend Deployment (Vercel)

1. **Sign up at [Vercel.com](https://vercel.com)**

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select your repo

3. **Configure Build Settings**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Add Environment Variables**
   - Add these variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

6. **Update Backend CORS**
   - Go back to Railway
   - Update `FRONTEND_URL` variable with your Vercel URL
   - Redeploy backend

---

### 4. GitHub Actions Setup (CI)

1. **Add Secrets to GitHub**
   - Go to your GitHub repo
   - Settings → Secrets and variables → Actions
   - Add these secrets:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

2. **CI Pipeline is Already Configured**
   - File: `.github/workflows/ci.yml`
   - Runs on every push/PR to main branch
   - Tests both frontend and backend

---

## 🔄 Auto-Deployment Workflow

**After setup, deployment is automatic:**

```bash
# 1. Make your changes locally
git add .
git commit -m "Added new feature"
git push origin main

# 2. GitHub Actions runs:
# ✅ Runs tests
# ✅ Builds frontend
# ✅ Checks backend syntax

# 3. If tests pass:
# ✅ Railway auto-deploys backend
# ✅ Vercel auto-deploys frontend

# 4. Your app is live! 🎉
```

---

## 🔍 Monitoring & Logs

### Railway (Backend)
- Dashboard → Your Project
- Click on "Deployments" to see logs
- Click on "Metrics" for performance

### Vercel (Frontend)
- Dashboard → Your Project
- Click on deployment to see build logs
- Runtime logs in "Functions" tab

---

## 🛠️ Useful Commands

### Trigger Manual Deployment
```bash
# Railway
railway up

# Vercel
vercel --prod
```

### View Logs Locally
```bash
# Railway
railway logs

# Vercel
vercel logs
```

### Rollback Deployment
```bash
# Railway: Go to dashboard → Deployments → Redeploy old version
# Vercel: Go to dashboard → Deployments → Promote to Production
```

---

## 🔒 Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] MongoDB IP whitelist configured
- [ ] CORS configured with your frontend URL
- [ ] JWT_SECRET is strong and unique
- [ ] Webhook verify tokens are secure
- [ ] Admin password changed from default

---

## 🐛 Troubleshooting

### Backend not connecting to MongoDB
- Check MongoDB IP whitelist includes `0.0.0.0/0`
- Verify MONGODB_URI is correct in Railway variables

### Frontend can't reach backend
- Check NEXT_PUBLIC_API_URL matches Railway URL
- Verify CORS settings in backend allow your Vercel URL

### Socket.io not connecting
- Ensure NEXT_PUBLIC_SOCKET_URL is set correctly
- Check Railway service is running (not crashed)

### Build failures
- Check GitHub Actions logs for errors
- Verify all dependencies in package.json
- Check Node.js version compatibility

---

## 📊 Cost Breakdown (Monthly)

- **MongoDB Atlas**: $0 (M0 free tier)
- **Railway**: $0 (free tier with $5 credit)
- **Vercel**: $0 (hobby tier)
- **GitHub Actions**: $0 (2000 minutes/month free)

**Total: $0/month** for small projects! 🎉

---

## 🚀 Next Steps

1. Set up custom domain (optional)
2. Configure monitoring/alerts
3. Set up staging environment
4. Add automated tests
5. Configure backup strategies

---

## 📞 Support

- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- MongoDB: [docs.mongodb.com](https://docs.mongodb.com)

Happy Deploying! 🚀

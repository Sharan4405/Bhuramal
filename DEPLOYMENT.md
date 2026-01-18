# Bhuramal Deployment Guide

## 🚀 Deployment Setup: Vercel (Frontend) + Render (Backend)

### Prerequisites
- GitHub repository with your code
- Vercel account (free)
- Render account (free)
- All environment variables from `.env`

---

## 📦 Step 1: Deploy Backend to Render

### A. Create Render Web Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `bhuramal-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (project root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### B. Add Environment Variables

In Render dashboard → Environment → Add these variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_minimum_32_characters
WHATSAPP_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_API_VERSION=v22.0
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
PORT=4000
NODE_ENV=production
STORE_ADDRESS=your_store_address
STORE_LATITUDE=your_latitude
STORE_LONGITUDE=your_longitude
```

### C. Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Copy your backend URL (e.g., `https://bhuramal-backend.onrender.com`)

### D. Get Deploy Hook for CI/CD

1. In Render dashboard → Settings
2. Scroll to **"Deploy Hook"**
3. Copy the webhook URL
4. Save it as GitHub Secret: `RENDER_DEPLOY_HOOK`

---

## 🌐 Step 2: Deploy Frontend to Vercel

### A. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### B. Add Environment Variable

Add this in Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://bhuramal-backend.onrender.com
```

*Use your actual Render backend URL from Step 1*

### C. Deploy

1. Click **"Deploy"**
2. Wait for deployment (1-2 minutes)
3. Your frontend URL will be like: `https://bhuramal.vercel.app`

### D. Get Vercel Tokens for CI/CD

1. Go to Vercel → Settings → Tokens
2. Create new token, copy it
3. Get your Organization ID and Project ID from project settings
4. Save as GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

---

## 🔐 Step 3: Setup GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Click **"New repository secret"** and add:

### Required Secrets:
```
RENDER_DEPLOY_HOOK = https://api.render.com/deploy/srv-xxxxx
VERCEL_TOKEN = your_vercel_token
VERCEL_ORG_ID = team_xxxxx
VERCEL_PROJECT_ID = prj_xxxxx
NEXT_PUBLIC_API_URL = https://bhuramal-backend.onrender.com
```

---

## 🔄 Step 4: Configure Webhooks

### A. WhatsApp Webhook (Meta Developer Console)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app → WhatsApp → Configuration
3. Update webhook URL:
   ```
   https://bhuramal-backend.onrender.com/api/webhook
   ```
4. Verify token: (use your WHATSAPP_VERIFY_TOKEN)

### B. Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL:
   ```
   https://bhuramal-backend.onrender.com/api/webhooks/razorpay
   ```
3. Select events: `payment.captured`, `payment.failed`

---

## ✅ Step 5: Test Deployment

### Backend Health Check
```bash
curl https://bhuramal-backend.onrender.com/health
```
Should return: `{"status":"ok"}`

### Frontend Check
Visit: `https://bhuramal.vercel.app`

### Test Full Flow
1. Send "hi" to your WhatsApp Business number
2. Bot should respond with menu
3. Try placing an order
4. Check admin dashboard at your Vercel URL
5. Test payment flow

---

## 🚀 CI/CD Workflow (Automatic Deployments)

Once GitHub secrets are configured, every push to `main` branch automatically:

1. **Tests** run (if configured)
2. **Backend** deploys to Render via webhook
3. **Frontend** deploys to Vercel

### Manual Deployment

Go to GitHub → **Actions** → Select workflow → **Run workflow**

---

## 📊 Monitoring & Logs

### Render (Backend)
- Dashboard → Your service → **Logs** tab
- Real-time logs of backend
- Check for errors

### Vercel (Frontend)
- Dashboard → Your project → **Deployments**
- View build logs
- Runtime logs

### MongoDB Atlas
- Check database connections
- Whitelist Render's IP (or use `0.0.0.0/0` for testing)

---

## 🔧 Post-Deployment Checklist

- [ ] Backend health endpoint working
- [ ] Frontend loads correctly
- [ ] WhatsApp webhook verified and working
- [ ] Razorpay webhook configured
- [ ] Database accessible from Render
- [ ] All environment variables set
- [ ] SSL/HTTPS enabled (automatic on Render & Vercel)
- [ ] Test complete order flow
- [ ] Test WhatsApp conversation
- [ ] Test payment with ₹1 order
- [ ] Admin dashboard accessible
- [ ] Check logs for any errors

---

## 🆘 Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify environment variables
- Check MongoDB Atlas network access (whitelist Render IP or allow all)
- Verify PORT is set to 4000

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Must include `https://` and no trailing slash
- Redeploy frontend after changing env vars

### WhatsApp messages not received
- Verify webhook URL in Meta Developer Console
- Check it's HTTPS (Render provides automatic SSL)
- Test webhook manually: `curl -X POST your-backend-url/api/webhook`
- Check Render logs for webhook requests

### Payments not working
- Verify Razorpay webhook URL
- Check using **production** API keys, not test keys
- Verify webhook secret matches
- Check Render logs for payment callbacks

### Render free tier sleeps
- Free tier sleeps after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Upgrade to paid tier ($7/month) for always-on
- Or use a cron job to ping every 10 minutes

---

## 💰 Cost Breakdown

### Current Setup (Free Tier):
- **Render**: Free (with sleep after inactivity)
- **Vercel**: Free (100GB bandwidth, unlimited requests)
- **MongoDB Atlas**: Free (512MB storage)
- **Total**: $0/month

### Recommended Production Setup:
- **Render**: $7/month (always-on, 512MB RAM)
- **Vercel**: Free (sufficient for most use cases)
- **MongoDB Atlas**: $0-$9/month (depends on usage)
- **Total**: ~$7-16/month

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Razorpay**: https://razorpay.com/docs

---

## 🔄 Updating Your App

Just push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

GitHub Actions will automatically deploy to both Render and Vercel!

**Why?** Free tier, automatic SSL, easy setup, perfect for your stack.

#### Frontend (Vercel)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set build settings:
   - Framework: Next.js
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL

#### Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Set root directory to `/` (project root)
4. Add all environment variables from `.env`:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   WHATSAPP_TOKEN=your_token
   WHATSAPP_PHONE_NUMBER_ID=your_id
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   PORT=4000
   ```
5. Deploy!

**GitHub Secrets Needed:**
- `VERCEL_TOKEN`: Get from Vercel settings
- `VERCEL_ORG_ID`: From Vercel project settings
- `VERCEL_PROJECT_ID`: From Vercel project settings  
- `RAILWAY_TOKEN`: Get from Railway settings

---

### Option 2: VPS (DigitalOcean/AWS/Linode)

**Why?** Full control, better for scaling, one-time setup.

#### Initial VPS Setup

```bash
# 1. SSH into your VPS
ssh root@your_server_ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 (Process Manager)
sudo npm install -g pm2

# 4. Install Nginx
sudo apt-get install nginx

# 5. Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# 6. Clone your repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/Bhuramal.git bhuramal
cd bhuramal

# 7. Install dependencies
npm install --production
cd client && npm install --production && npm run build && cd ..

# 8. Create .env file
nano .env
# Paste your environment variables

# 9. Start with PM2
pm2 start src/server.js --name bhuramal-backend
pm2 startup
pm2 save

# 10. Start frontend
cd client
pm2 start npm --name bhuramal-frontend -- start
cd ..
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/bhuramal
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for Socket.io
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/bhuramal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**GitHub Secrets for VPS:**
```
VPS_HOST: your_server_ip
VPS_USERNAME: your_username (usually root or ubuntu)
VPS_SSH_KEY: Your private SSH key
VPS_PORT: 22
```

---

### Option 3: Render

**Why?** Simple, free tier, automatic SSL, good for small projects.

1. Go to [render.com](https://render.com)
2. Create Web Service for backend:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables
3. Create Static Site for frontend:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/.next`

**GitHub Secret:**
- `RENDER_DEPLOY_HOOK`: Get from Render dashboard → Settings → Deploy Hook

---

## 🔐 GitHub Secrets Setup

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these based on your deployment choice:

### For Vercel + Railway:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RAILWAY_TOKEN
NEXT_PUBLIC_API_URL
```

### For VPS:
```
VPS_HOST
VPS_USERNAME
VPS_SSH_KEY
VPS_PORT
```

### For Render:
```
RENDER_DEPLOY_HOOK
```

---

## 🔄 CI/CD Workflow

Once configured, deployments happen automatically:

1. **Push to main branch** → Triggers deployment
2. **GitHub Actions runs**:
   - Installs dependencies
   - Runs tests (if available)
   - Builds application
   - Deploys to your platform
3. **Success notification**

### Manual Deployment

Go to GitHub → Actions → Select workflow → Run workflow

---

## 📊 Monitoring

### PM2 (VPS only)
```bash
pm2 status              # Check status
pm2 logs bhuramal-backend  # View logs
pm2 restart all         # Restart services
pm2 monit              # Real-time monitoring
```

### Railway/Render
Check their dashboard for logs and metrics

---

## 🔧 Environment Variables Checklist

Make sure these are set in your deployment platform:

### Backend
- `MONGODB_URI`
- `JWT_SECRET`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `PORT=4000`
- `NODE_ENV=production`

### Frontend
- `NEXT_PUBLIC_API_URL` (your backend URL)

---

## 🚨 Post-Deployment Checklist

- [ ] WhatsApp webhook configured with your domain
- [ ] Razorpay webhook configured
- [ ] Database accessible from deployment server
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables set correctly
- [ ] Test ordering flow end-to-end
- [ ] Test WhatsApp messages
- [ ] Test payment flow
- [ ] Monitor logs for errors

---

## 🆘 Troubleshooting

### Build fails
- Check Node.js version (should be 20+)
- Verify all dependencies in package.json
- Check for TypeScript errors in frontend

### Cannot connect to database
- Whitelist deployment server IP in MongoDB Atlas
- Check MONGODB_URI format

### WhatsApp not working
- Update webhook URL in Meta Developer Console
- Verify WHATSAPP_TOKEN and PHONE_NUMBER_ID
- Check ngrok is not running (production should use real domain)

### Payment not working
- Update Razorpay webhook URL
- Verify API keys are production keys, not test keys

---

## 📞 Support

For deployment issues, check:
1. GitHub Actions logs
2. Platform-specific logs (Vercel/Railway/VPS)
3. Application logs via PM2 or platform dashboard

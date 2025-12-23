# 🚀 Dashboard Setup - Quick Start

## ✅ What's Done

Frontend created with:
- ✅ Login page with orange/white/green theme
- ✅ Dashboard showing all conversations
- ✅ Chat interface for messaging customers
- ✅ Resolve/Reopen functionality
- ✅ Filter by status (ALL/OPEN/RESOLVED)

## 📦 Setup Steps

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Start Frontend
```bash
npm run dev
```

Frontend will run on: **http://localhost:3001**

### 3. Start Backend (in another terminal)
```bash
# From project root
npm run dev
```

Backend will run on: **http://localhost:3000**

## 🔐 First Time Setup

### Create Admin Account
```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}'
```

## 🎯 Usage

1. **Open Frontend:** http://localhost:3001
2. **Login:** username: `admin`, password: `Admin123`
3. **View Conversations:** Click to see any conversation
4. **Send Replies:** Type message and send
5. **Mark Resolved:** Click "Mark Resolved" button

## 🎨 Theme Colors

- **Primary (Orange):** #ff6b35
- **Success (Green):** #10b981
- **Background:** White/Light Gray
- **Text:** Dark Gray

## 📱 Pages

- `/` - Login
- `/dashboard` - Conversations list
- `/dashboard/chat/[id]` - Chat view

## 🔧 Troubleshooting

**Backend not connecting?**
- Check `.env.local` in client folder
- Make sure `NEXT_PUBLIC_API_URL=http://localhost:3000`

**Can't login?**
- Make sure you created admin account
- Check backend is running on port 3000

**No conversations showing?**
- Send a WhatsApp message to your bot first
- Click "Support & Queries" in WhatsApp

---

**That's it! Your dashboard is ready to use! 🎉**

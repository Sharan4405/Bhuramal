# Dashboard Setup Guide

## 📦 Installation

```bash
npm install
```

## 🔐 Setup Admin Account

**Important:** Create your admin account before using the dashboard.

### Method 1: Using API

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password"}'
```

### Method 2: Using code (run once)

Create a file `scripts/createAdmin.js`:

```javascript
import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';
import { connectDB } from '../src/DB/connection.js';

await connectDB();

const admin = await Admin.create({
  username: 'admin',
  password: 'your-secure-password'
});

console.log('✅ Admin created:', admin.username);
process.exit(0);
```

Run: `node scripts/createAdmin.js`

## 🚀 API Endpoints

### Authentication

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}

Response:
{
  "token": "jwt-token-here",
  "username": "admin"
}
```

### Conversations

**Get All Conversations**
```bash
GET /api/conversations?page=1&limit=20&status=OPEN
Authorization: Bearer <token>

Response:
{
  "conversations": [...],
  "page": 1,
  "limit": 20,
  "total": 50,
  "pages": 3
}
```

**Get Conversation Messages**
```bash
GET /api/conversations/:id/messages?limit=50
Authorization: Bearer <token>

Response:
{
  "messages": [
    {
      "_id": "...",
      "conversationId": "...",
      "user": "919876543210",
      "text": "Hello",
      "direction": "IN",
      "timestamp": "2025-12-23T..."
    }
  ]
}
```

**Resolve Conversation**
```bash
PATCH /api/conversations/:id/resolve
Authorization: Bearer <token>
```

**Reopen Conversation**
```bash
PATCH /api/conversations/:id/reopen
Authorization: Bearer <token>
```

### Messages

**Send Message from Dashboard**
```bash
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "conversation-id-here",
  "text": "Hello from admin"
}
```

## 🔒 Environment Variables

Add to `.env`:

```env
JWT_SECRET=your-very-secret-key-change-this
```

## 🧪 Testing Flow

1. **Create admin account** (one-time)
2. **Login** to get token
3. **Send WhatsApp message** to bot
4. **Check conversations** in dashboard
5. **View messages** for that conversation
6. **Send reply** from dashboard
7. **User receives** WhatsApp message

## 📊 Database Structure

### Conversation
- `user`: Phone number
- `status`: OPEN / RESOLVED
- `lastMessageAt`: Date
- `lastMessage`: Text preview
- `currentFlow`: MENU / ORDER / TRACK / SUPPORT

### Message
- `conversationId`: Reference to Conversation
- `user`: Phone number
- `text`: Message content
- `direction`: IN / OUT
- `timestamp`: Date

## ⚡ Performance

Indexes automatically created:
- Message: `conversationId + createdAt`
- Message: `user + timestamp`
- Conversation: `lastMessageAt`

## 🛡️ Security

- JWT tokens expire in 7 days
- Passwords hashed with bcrypt
- All dashboard routes require authentication
- Rate limiting: 150 requests/minute

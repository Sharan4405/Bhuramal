# Bhuramal WhatsApp E-Commerce Chatbot

A complete e-commerce chatbot system for WhatsApp with real-time admin dashboard and integrated payment processing.

## Overview

This system enables customers to browse products, place orders, and make payments through WhatsApp, while admins manage everything through a web dashboard.

**Key Components:**
- WhatsApp chatbot for customer orders
- Next.js admin dashboard for management
- Razorpay payment integration
- Real-time updates via Socket.io
- MongoDB database

## Features

**Customer Side:**
- Browse products and categories via WhatsApp
- Add items to cart and checkout
- Make payments through Razorpay
- Get order confirmations and updates
- View store location

**Admin Side:**
- Real-time order dashboard
- Product inventory management
- Live customer conversations
- Order status tracking
- Sales analytics

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  WhatsApp   │────────▶│   Express    │────────▶│   MongoDB   │
│   Users     │         │   Backend    │         │   Database  │
└─────────────┘         └──────┬───────┘         └─────────────┘
                               │
                               │ Socket.io
                               │
                        ┌──────▼───────┐
                        │   Next.js    │
                        │   Dashboard  │
                        └──────────────┘
```

**Flow:**
1. Customer sends WhatsApp message → Webhook receives it
2. Backend processes message using conversation state machine
3. Responds with products/cart info/payment links
4. Admin sees real-time updates on dashboard
5. Payment webhook confirms transaction
6. Order created and customer notified

**Tech Stack:**
- **Backend:** Node.js, Express, MongoDB, Socket.io
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Integration:** WhatsApp Business API, Razorpay
- **Auth:** JWT tokens, bcrypt

## Quick Start

### Installation

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start backend (terminal 1)
npm run dev

# Start frontend (terminal 2)
cd client && npm run dev
```

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bhuramal

# WhatsApp (from Meta Developer Console)
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_token

# Razorpay (from Dashboard)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret

# Security
JWT_SECRET=your_long_random_secret_32_chars_min

# Server
PORT=4000
NODE_ENV=development
```

### First Time Setup

1. **Install Node.js v20+** from nodejs.org
2. **Setup MongoDB** (local or Atlas cloud)
3. **Get WhatsApp API access** at developers.facebook.com
4. **Create Razorpay account** at razorpay.com
5. **Create admin account:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"YourPassword123"}'
   ```

## Project Structure

```
├── src/                    # Backend
│   ├── controllers/        # Request handlers
│   ├── models/            # Database schemas
│   ├── routers/           # API routes
│   ├── services/          # Business logic (cart, catalog, payment)
│   ├── utils/             # Helpers (WhatsApp, auth)
│   └── server.js          # Entry point
├── client/                # Frontend
│   ├── app/              # Next.js pages & API routes
│   └── components/       # React components
├── .env.example           # Environment template
├── API.md                # API documentation
├── DOCS.md               # Setup & troubleshooting guide
└── DEPLOYMENT.md         # Production deployment
```

## API Endpoints

See [API.md](./API.md) for complete documentation.

**Main endpoints:**
- `POST /api/auth/login` - Admin login
- `GET /api/products` - List products
- `GET /api/orders` - List orders (auth required)
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/messages/send` - Send WhatsApp message
- `POST /webhook` - WhatsApp webhook
- `POST /payment/webhook` - Razorpay webhook

## Development

**Run locally:**
```bash
npm run dev          # Backend with nodemon
cd client && npm run dev  # Frontend with hot reload
```

**Build for production:**
```bash
npm start            # Backend production mode
cd client && npm run build && npm start  # Frontend production
```

**Access points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/health

## Deployment

Deploy frontend to **Vercel** and backend to **Render** (free tiers available).

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## Documentation

- **[API.md](./API.md)** - Complete API reference with examples
- **[DOCS.md](./DOCS.md)** - Setup guide, troubleshooting, contributing
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide

## Common Issues

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

**MongoDB connection failed:**
- Check MongoDB is running: `mongosh`
- Verify connection string in .env
- For Atlas: whitelist your IP address

**WhatsApp messages not working:**
- Verify webhook URL is HTTPS (use ngrok for local testing)
- Check WHATSAPP_VERIFY_TOKEN matches in Meta console
- Ensure webhook is subscribed to "messages" events

More solutions in [DOCS.md](./DOCS.md)

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

See [DOCS.md](./DOCS.md) for detailed guidelines.

## License

MIT License - see LICENSE file for details.

## Support

- Open an issue on GitHub
- Check [DOCS.md](./DOCS.md) for solutions
- Review [API.md](./API.md) for API help

# Documentation

Complete guide for setup, development, troubleshooting, and contributing.

## Table of Contents

1. [Setup](#setup)
2. [Development](#development)
3. [Troubleshooting](#troubleshooting)
4. [Contributing](#contributing)

---

## Setup

### Prerequisites

**Required Software:**

- Node.js v20+ ([nodejs.org](https://nodejs.org))
- MongoDB ([mongodb.com](https://mongodb.com) or Atlas cloud)
- Git

**Required Accounts:**

- WhatsApp Business API ([developers.facebook.com](https://developers.facebook.com))
- Razorpay ([razorpay.com](https://razorpay.com))

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/yourusername/Bhuramal.git
cd Bhuramal

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start development
npm run dev              # Terminal 1: Backend
cd client && npm run dev # Terminal 2: Frontend
```

### Environment Configuration

Edit `.env` file with your settings:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bhuramal
# Or MongoDB Atlas: mongodb+srv://user:pass@cluster.net/bhuramal

# WhatsApp (from Meta Developer Console)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Razorpay (from Dashboard)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_very_long_random_secret_key_32_chars_minimum

# Store Info
STORE_ADDRESS=Your Store Address
STORE_LATITUDE=28.1234567
STORE_LONGITUDE=77.1234567
```

**Frontend Environment:**
Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Database Setup

**Option 1: Local MongoDB**

```bash
# Install MongoDB Community Edition
# Windows: Download from mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb

# Start MongoDB
# Windows: Services → MongoDB → Start
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Verify
mongosh
```

**Option 2: MongoDB Atlas (Cloud)**

1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string
6. Update `MONGODB_URI` in .env

### WhatsApp Business API Setup

1. **Create Facebook App** at [developers.facebook.com](https://developers.facebook.com)
2. **Add WhatsApp product** to your app
3. **Get credentials:**
   - Phone Number ID
   - Access Token (generate permanent system user token)
   - App Secret
   - Set custom Verify Token
4. **Setup webhook** (for local dev, use ngrok):
   ```bash
   ngrok http 4000
   # Use HTTPS URL: https://xxxx.ngrok.io/webhook
   ```
5. **Configure in Meta Console:**
   - Callback URL: `https://your-url/webhook`
   - Verify Token: Same as in .env
   - Subscribe to: `messages`

### Razorpay Setup

1. **Create account** at [razorpay.com](https://razorpay.com)
2. **Get API Keys:**
   - Dashboard → Settings → API Keys
   - Generate Test Keys for development
3. **Setup Webhook:**
   - Dashboard → Settings → Webhooks
   - URL: `https://your-url/payment/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Get webhook secret

### Create Admin Account

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!",
    "email": "admin@example.com"
  }'
```

---

## Development

### Running Locally

```bash
# Backend (auto-reload with nodemon)
npm run dev

# Frontend (hot-reload)
cd client
npm run dev
```

**Access:**

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/health

### Project Structure

```
src/
├── controllers/     # Request handlers
├── models/         # MongoDB schemas
├── routers/        # Route definitions
├── services/       # Business logic
│   ├── cartService.js
│   ├── catalogService.js
│   ├── paymentService.js
│   └── socketService.js
├── utils/          # Helpers
│   ├── whatsapp.js
│   ├── auth.js
│   └── priceCalculator.js
├── app.js          # Express app
└── server.js       # Entry point

client/
├── app/            # Next.js App Router
│   ├── dashboard/  # Admin pages
│   └── api/        # API routes
└── components/     # React components
```

### Code Style

**JavaScript/TypeScript:**

```javascript
// Use ES6+ syntax
import express from "express";

// Async/await for asynchronous operations
const data = await Model.find();

// Arrow functions
const helper = (param) => {};

// Destructuring
const { name, price } = product;
```

**Naming Conventions:**

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_ITEMS = 100;

// Variables/functions: camelCase
const userName = "John";
function getUser() {}

// Classes/Components: PascalCase
class ProductService {}
function ProductCard() {}
```

### Testing APIs

```bash
# Health check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get orders (with auth token)
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Installation Issues

**npm install fails:**

```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Or use --legacy-peer-deps
npm install --legacy-peer-deps
```

**Node version mismatch:**

```bash
# Check version
node --version  # Should be v20+

# Install correct version with nvm
nvm install 20
nvm use 20
```

### Database Issues

**MongoDB connection failed:**

1. **Check if MongoDB is running:**

   ```bash
   # Windows
   sc query MongoDB

   # Mac
   brew services list | grep mongodb

   # Linux
   sudo systemctl status mongod
   ```

2. **For MongoDB Atlas:**
   - Check Network Access (whitelist your IP)
   - Verify connection string format
   - URL-encode special characters in password

3. **Test connection:**
   ```bash
   mongosh "your_connection_string"
   ```

**Authentication failed:**

- Verify username and password in connection string
- Check database user permissions
- Ensure correct authentication database

### Server Issues

**Port already in use:**

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=4001 npm run dev
```

**Module not found:**

```bash
# Reinstall dependencies
npm install

# For specific module
npm install module-name
```

**Environment variables not loading:**

- Check .env file exists in root
- Verify `import 'dotenv/config'` in server.js
- Restart server after changing .env
- Check for typos in variable names

### WhatsApp Issues

**Webhook verification fails:**

- Ensure WHATSAPP_VERIFY_TOKEN matches in .env and Meta console
- Check server is accessible (use ngrok for local)
- Verify endpoint responds to GET request

**Messages not received:**

- Check webhook subscription in Meta console
- Verify webhook URL is HTTPS
- Check server logs for incoming requests
- Test webhook endpoint manually

**Messages not sent:**

- Verify phone number format: `+[country][number]`
- Check access token validity (regenerate if expired)
- Use system user token for permanent access
- Review Meta Developer Console logs

### Payment Issues

**Razorpay webhook not working:**

- Verify webhook URL is correct and HTTPS
- Check webhook secret matches
- Verify events are selected (payment.captured, payment.failed)
- Test with Razorpay webhook tester

**Payment link creation fails:**

- Check API keys are correct (test vs live)
- Verify amount is in paise (multiply by 100)
- Check Razorpay account is activated
- Review error message for details

### Frontend Issues

**Can't connect to backend:**

- Verify NEXT_PUBLIC_API_URL in client/.env.local
- Check backend is running
- Verify CORS settings in backend
- Check browser console for errors

**Styles not loading:**

- Verify Tailwind is installed
- Check globals.css is imported in layout.tsx
- Clear Next.js cache: `rm -rf .next`
- Restart dev server

**Socket.io not connecting:**

- Check Socket.io server is initialized
- Verify WebSocket support (check firewall/proxy)
- Check CORS configuration for Socket.io
- Enable debugging: `localStorage.debug = 'socket.io-client:socket'`

### Performance Issues

**Slow queries:**

```javascript
// Add database indexes
productSchema.index({ name: "text" });
orderSchema.index({ status: 1, createdAt: -1 });

// Use projection
Model.find().select("field1 field2");

// Implement pagination
Model.find().skip(skip).limit(limit);
```

**High memory usage:**

```bash
# Increase Node.js memory
node --max-old-space-size=4096 src/server.js
```

---

## Contributing

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bhuramal.git
   cd Bhuramal
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/ORIGINAL/Bhuramal.git
   ```
4. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make changes** following code style guidelines
2. **Test thoroughly** - manual and automated
3. **Commit changes** with descriptive message
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create Pull Request** on GitHub

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

**Examples:**

```bash
git commit -m "feat(products): add sorting by price"
git commit -m "fix(orders): resolve status update issue"
git commit -m "docs(api): update authentication endpoints"
```

### Code Guidelines

**Backend:**

```javascript
// Good
export const createProduct = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: "Name and price required",
      });
    }

    const product = await Product.create({ name, price });
    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
```

**Frontend:**

```typescript
// Good - TypeScript component
interface OrderCardProps {
  order: Order;
  onUpdate?: (order: Order) => void;
}

export default function OrderCard({ order, onUpdate }: OrderCardProps) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateOrder(order.id);
      onUpdate?.(order);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      {/* content */}
    </div>
  );
}
```

### Pull Request Guidelines

**Before submitting:**

- Update from upstream: `git fetch upstream && git rebase upstream/main`
- Test all changes
- Update documentation if needed
- Follow commit message format

**PR Title:** Use commit format

```
feat(orders): add Excel export functionality
fix(auth): resolve token expiration issue
```

**PR Description:**

```markdown
## Description

Brief description of changes

## Type

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation

## Related Issue

Closes #123

## Testing

How you tested the changes
```

### Reporting Bugs

**Before reporting:**

- Check existing issues
- Try latest version
- Search documentation

**Bug report should include:**

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)
- Screenshots if applicable

### Suggesting Features

**Feature request should include:**

- Problem description
- Proposed solution
- Use cases and benefits
- Alternative approaches considered

### Documentation

Update documentation when:

- Adding new features
- Changing existing functionality
- Fixing bugs that affect usage
- Adding configuration options

Keep documentation:

- Clear and concise
- With code examples
- Up-to-date with code

---

## Getting Help

**Resources:**

- [README.md](./README.md) - Project overview
- [API.md](./API.md) - API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

**Support:**

- GitHub Issues - Report bugs or request features
- GitHub Discussions - Ask questions
- Check documentation first

**Debug Logging:**

```bash
# Enable verbose logging
DEBUG=* npm run dev
```

---

**Last Updated:** March 10, 2026

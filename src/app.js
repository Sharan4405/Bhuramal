import express from 'express';
import webhookRouter from './routers/webhook.js';
import paymentRouter from './routers/payment.js';
import authRouter from './routers/auth.js';
import conversationRouter from './routers/conversation.js';
import messageRouter from './routers/message.js';
import productRouter from './routers/product.js';
import orderRouter from './routers/order.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimiter from 'express-rate-limit';
import {connectDB} from './DB/connection.js';
import {loadCatalog, refreshCatalog} from './services/catalogService.js';

const app = express();

// Trust proxy (required for ngrok/proxy environments)
app.set('trust proxy', 1);

// Capture raw body for webhook signature verification
app.use('/webhook', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(helmet());
app.use(rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150 // limit each IP to 150 requests per windowMs
}));

// Mount routers
app.use('/webhook', webhookRouter);
app.use('/payment', paymentRouter);
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

await connectDB();

// Load catalog on startup (async now)
await loadCatalog()

// Home route
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Bhuramal – WhatsApp-based Payments</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 font-sans p-6 md:p-10">
        <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-lg">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-800 border-b-4 border-blue-500 pb-4 mb-8">
            Bhuramal
          </h1>
          
          <p class="text-gray-600 leading-relaxed mb-4">
            We operate a WhatsApp-based business where customers place orders
            and make payments using secure payment gateways.
          </p>

          <p class="text-gray-600 leading-relaxed mb-6">
            Payments are collected via Razorpay using hosted payment links.
            Customers interact with us through WhatsApp Business.
          </p>

          <div class="bg-gray-100 p-6 rounded-lg my-6 border-l-4 border-blue-500">
            <h2 class="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              📞 Contact Information
            </h2>
            <div class="space-y-3">
              <div class="text-base md:text-lg">
                <span class="font-semibold text-gray-800 inline-block w-28">WhatsApp:</span>
                <a href="https://wa.me/919982180444" target="_blank" 
                   class="text-blue-500 hover:text-blue-700 hover:underline break-all">
                  https://wa.me/919982180444
                </a>
              </div>
              <div class="text-base md:text-lg">
                <span class="font-semibold text-gray-800 inline-block w-28">Email:</span>
                <a href="mailto:Bhuramalbhagirath@gmail.com" 
                   class="text-blue-500 hover:text-blue-700 hover:underline break-all">
                  Bhuramalbhagirath@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div class="bg-gray-100 p-6 rounded-lg my-6 border-l-4 border-blue-500">
            <h2 class="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              🔄 Refund & Cancellation Policy
            </h2>
            <p class="text-gray-600 leading-relaxed">
              Refunds are reviewed on a case-by-case basis. If approved, refunds
              will be processed within <span class="font-bold">5–7 business days</span> to the original payment method.
            </p>
          </div>

          <div class="bg-gray-100 p-6 rounded-lg my-6 border-l-4 border-blue-500">
            <h2 class="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              📍 Business Location
            </h2>
            <p class="text-gray-600 font-bold">India</p>
          </div>

          <div class="bg-yellow-50 p-6 rounded-lg my-6 border-l-4 border-yellow-500">
            <h2 class="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              📋 Terms
            </h2>
            <p class="text-gray-600 leading-relaxed">
              All payments are securely processed via <span class="font-bold">Razorpay</span>.
              By proceeding with a payment, you agree to our service terms.
            </p>
          </div>

          <p class="mt-8 text-gray-500 leading-relaxed">
            For any queries, customers can reach us via WhatsApp after initiating a conversation through our official WhatsApp Business account.
          </p>
        </div>
      </body>
    </html>
  `);
});

//Route for testing server status
app.get('/health', (req, res) => {
  res.send('alive');
});

// Route to manually refresh catalog after MongoDB updates
app.post('/refresh-catalog', async (req, res) => {
  try {
    await refreshCatalog();
    res.json({ success: true, message: 'Catalog refreshed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default app;

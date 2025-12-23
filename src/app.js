import express from 'express';
import webhookRouter from './routers/webhook.js';
import paymentRouter from './routers/payment.js';
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
app.use(cors('*'));
app.use(helmet());
app.use(rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150 // limit each IP to 150 requests per windowMs
}));

// Mount routers
app.use('/webhook', webhookRouter);
app.use('/payment', paymentRouter);

await connectDB();

// Load catalog on startup (async now)
await loadCatalog()
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

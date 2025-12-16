import express from 'express';
import webhookRouter from './routers/webhook.js';
import paymentRouter from './routers/payment.js';
import cors from 'cors';
import helmet from 'helmet';
import {connectDB} from './DB/connection.js';
import {loadCatalog} from './services/catalogService.js';

const app = express();

// built-in JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors('*'));
app.use(helmet());

// Mount routers
app.use('/webhook', webhookRouter);
app.use('/payment', paymentRouter);

await connectDB();

// Load catalog on startup
loadCatalog();

//Route for testing server status
app.get('/health', (req, res) => {
  res.send('alive');
});

export default app;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Chatbot Service is running' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Chatbot Service running on http://localhost:${PORT}`);
  console.log(`📊 Model: ${process.env.MODEL_TYPE || 'default'}`);
});

export default app;

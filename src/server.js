import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { initializeSocket } from './services/socketService.js';
import { cleanupOldStates, CLEANUP_INTERVAL } from './models/conversationStateService.js';

const port = process.env.PORT || 4000;

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);
initializeSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`WebSocket server ready for real-time updates`);
  
  // Schedule cleanup using centralized timeout config
  setInterval(() => {
    cleanupOldStates();
  }, CLEANUP_INTERVAL);
});

export default app;

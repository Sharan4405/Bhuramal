import 'dotenv/config';
import app from './app.js';
import { cleanupOldStates, CLEANUP_INTERVAL } from './models/conversationStateService.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  
  // Schedule cleanup using centralized timeout config
  setInterval(() => {
    cleanupOldStates();
  }, CLEANUP_INTERVAL);
});

export default app;

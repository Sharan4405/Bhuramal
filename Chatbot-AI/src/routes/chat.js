import express from 'express';
import { getAIResponse } from '../services/modelService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, userId, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`💬 Chat request from ${userId}: "${message}"`);

    // Get AI response
    const response = await getAIResponse(message, context);

    res.json({
      success: true,
      response: response.text,
      confidence: response.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/test
 * Test endpoint to verify service is working
 */
router.get('/test', async (req, res) => {
  try {
    const testMessage = "What products do you sell?";
    const response = await getAIResponse(testMessage);
    
    res.json({
      success: true,
      test_query: testMessage,
      response: response.text,
      service_status: 'operational'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      service_status: 'error'
    });
  }
});

export default router;

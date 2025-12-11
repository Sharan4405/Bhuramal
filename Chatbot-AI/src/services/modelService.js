import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get AI response using Python inference script
 * This calls the fine-tuned model via Python subprocess
 */
export async function getAIResponse(message, context = {}) {
  return new Promise((resolve, reject) => {
    // Path to Python inference script
    const scriptPath = path.join(__dirname, '../../training/inference.py');
    
    // Spawn Python process
    const pythonProcess = spawn('python', [scriptPath, message]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python inference error:', stderr);
        
        // Fallback response if model fails
        resolve({
          text: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team directly.",
          confidence: 0.0,
          fallback: true
        });
        return;
      }
      
      try {
        // Parse Python output (JSON format)
        const response = JSON.parse(stdout.trim());
        resolve({
          text: response.response,
          confidence: response.confidence || 0.9,
          fallback: false
        });
      } catch (error) {
        console.error('Error parsing Python output:', error);
        resolve({
          text: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team directly.",
          confidence: 0.0,
          fallback: true
        });
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        text: "I apologize for the delay. Please try again or contact our support team directly.",
        confidence: 0.0,
        fallback: true
      });
    }, 30000);
  });
}

/**
 * Fallback responses for common queries (used when model is not available)
 */
export function getFallbackResponse(message) {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('product') || messageLower.includes('sell')) {
    return {
      text: "We offer premium dry fruits including Almonds, Cashews, Pistachios, Walnuts, Raisins, and Dates. All our products are fresh and of the highest quality!",
      confidence: 0.7,
      fallback: true
    };
  }
  
  if (messageLower.includes('price') || messageLower.includes('cost')) {
    return {
      text: "Our prices range from ₹600-1800 per kg depending on the product. Almonds (₹600-1200), Cashews (₹700-1000), Pistachios (₹1200-1800). Would you like to place an order?",
      confidence: 0.7,
      fallback: true
    };
  }
  
  if (messageLower.includes('deliver')) {
    return {
      text: "Yes, we deliver across all of India! Free delivery on orders above ₹1000. Delivery typically takes 3-5 business days.",
      confidence: 0.7,
      fallback: true
    };
  }
  
  return {
    text: "Thank you for your question! Our team will get back to you shortly. You can also try placing an order by typing 'menu'.",
    confidence: 0.5,
    fallback: true
  };
}

export default {
  getAIResponse,
  getFallbackResponse
};

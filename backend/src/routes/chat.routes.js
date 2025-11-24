import { Router } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Fallback response generator for when AI service is unavailable
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Study-related responses
  if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('help')) {
    return "I'm here to help you with your studies! While our AI service is temporarily unavailable, I can suggest some general study tips: create a study schedule, take regular breaks, and practice active recall. What specific subject would you like help with?";
  }
  
  // Math-related responses
  if (lowerMessage.includes('math') || lowerMessage.includes('calculate') || lowerMessage.includes('solve')) {
    return "I'd love to help you with math! While our AI service is temporarily unavailable, I recommend breaking down complex problems into smaller steps, practicing regularly, and seeking help from teachers or study groups. What math topic are you working on?";
  }
  
  // Programming-related responses
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('javascript') || lowerMessage.includes('python')) {
    return "Programming can be challenging but rewarding! While our AI service is temporarily unavailable, I suggest starting with the basics, practicing regularly, and working on small projects. What programming language or concept are you learning?";
  }
  
  // General greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your study assistant. While our AI service is temporarily unavailable, I'm still here to help guide you with your studies. What would you like to learn about today?";
  }
  
  // Default response
  return "I'm your study assistant! While our AI service is temporarily unavailable, I'm still here to help. Could you tell me more about what you'd like to study or learn? I can provide general guidance and study tips.";
}

// Initialize OpenAI client with HuggingFace (same pattern as sources)
// Create client lazily to check for token
function getClient() {
  if (!process.env.HF_TOKEN) {
    throw new Error('HF_TOKEN environment variable is required');
  }
  return new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN
  });
}

// Chat with DeepSeek AI
router.post('/chat', requireAuth, async (req, res) => {
  console.log('=== Chat Request ===');
  console.log('Body:', req.body);
  
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    console.log('Calling AI model...');
    
    const client = getClient();
    const res_ai = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
      messages: [
        { 
          role: "system", 
          content: "You are an AI study assistant. Help students with their questions by providing helpful, encouraging, and educational responses. Keep responses concise but informative. Focus on learning and understanding." 
        },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('AI model response:', res_ai);
    
    const aiResponse = res_ai.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    console.log('AI Response:', aiResponse);

    res.json({
      success: true,
      message: aiResponse.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        // Provide a fallback response when authentication fails
        console.log('Authentication failed, providing fallback response...');
        const fallbackResponse = generateFallbackResponse(req.body.message || 'Hello');
        return res.json({
          success: true,
          message: fallbackResponse,
          timestamp: new Date().toISOString(),
          fallback: true
        });
      } else if (status === 429) {
        return res.status(429).json({ 
          error: 'AI service is currently busy. Please try again in a moment.' 
        });
      } else if (status === 503) {
        return res.status(503).json({ 
          error: 'AI service is temporarily unavailable. Please try again later.' 
        });
      } else {
        return res.status(500).json({ 
          error: `AI service error: ${data?.error || 'Unknown error'}` 
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'AI service request timed out. Please try again.' 
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service is unavailable. Please try again later.' 
      });
    } else {
      return res.status(500).json({ 
        error: 'An unexpected error occurred. Please try again.' 
      });
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'DeepSeek Chat API'
  });
});

export default router;

// Vercel serverless function wrapper for Express app
import app from '../src/index.js';

// Export as Vercel serverless function handler
export default (req, res) => {
  return app(req, res);
};

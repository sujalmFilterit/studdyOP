// Vercel serverless function wrapper for Express app
// This file is at the root /api/index.js for Vercel serverless functions

import app from '../backend/src/index.js';

// Export as Vercel serverless function handler
export default (req, res) => {
  return app(req, res);
};


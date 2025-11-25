import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import planRoutes from './routes/plan.routes.js';
import taskRoutes from './routes/task.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai-simple.routes.js';
import aiScheduleRoutes from './routes/ai-schedule.routes.js';
import chatRoutes from './routes/chat.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import roomRoutes from './routes/room.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import participantRoutes from './routes/participant.routes.js';
import answerRoutes from './routes/answer.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

dotenv.config();

// Set environment variables directly if not loaded
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';
}
// HF_TOKEN should be set via environment variables
// Do not hardcode tokens in source code
if (!process.env.HF_TOKEN) {
  console.warn('HF_TOKEN not set - AI features may not work');
}
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/studybuddy';
}

console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
console.log('HF_TOKEN:', process.env.HF_TOKEN ? 'set' : 'not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');

const app = express();

// CORS configuration - allow frontend and local development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Allow if origin matches Vercel deployment pattern
      if (origin.includes('.vercel.app') || origin.includes('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow for now - tighten as needed
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan('dev'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studybuddy';
const PORT = process.env.PORT || 4000;

// MongoDB connection with serverless-friendly settings
// Mongoose automatically caches connections, so we can reuse them
if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased from 5000 to 30000 (30 seconds)
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Added explicit connection timeout
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    })
    .then(() => {
      console.log('MongoDB connected successfully');
      console.log('MongoDB State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      console.error('Full error:', err);
      
      // Provide helpful error messages
      if (err.message.includes('IP')) {
        console.error('\n⚠️  IP Whitelist Issue:');
        console.error('1. Go to MongoDB Atlas → Network Access');
        console.error('2. Add your IP address or use 0.0.0.0/0 for testing');
        console.error('3. Wait 1-2 minutes after adding IP');
      }
      
      if (err.message.includes('authentication')) {
        console.error('\n⚠️  Authentication Issue:');
        console.error('1. Check your username and password in MONGO_URI');
        console.error('2. Make sure password is URL-encoded if it has special characters');
      }
      
      // Don't exit in serverless - let it retry on next request
      if (process.env.VERCEL !== '1') {
        console.error('\n⚠️  Server will continue but MongoDB is not connected');
        console.error('Some features may not work until MongoDB is connected\n');
        // Don't exit - let the server run and retry
        // process.exit(1);
      }
    });
} else {
  console.log('MongoDB connection already established');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'studybuddy-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Diagnostic endpoint for troubleshooting
app.get('/api/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      mongodb: states[dbState] || 'unknown',
      readyState: dbState,
      env: {
        MONGO_URI: process.env.MONGO_URI ? 'set' : 'not set',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
        NODE_ENV: process.env.NODE_ENV || 'not set'
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'studybuddy-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', aiScheduleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/feedback', feedbackRoutes);

// Additional endpoints for Tasks page
app.get('/api/plans', (req, res) => {
  // Return empty array for now - this would normally fetch from database
  res.json([]);
});

app.patch('/api/tasks/:planId/:taskId/toggle', (req, res) => {
  const { planId, taskId } = req.params;
  console.log(`Toggling task ${taskId} in plan ${planId}`);
  res.json({ success: true, message: 'Task toggled successfully' });
});

app.post('/api/gamification/complete-task', (req, res) => {
  const { xpGained } = req.body;
  console.log(`Task completed, XP gained: ${xpGained}`);
  res.json({ success: true, message: 'XP updated successfully' });
});

// Reminders endpoint for Dashboard
app.get('/api/reminders', (req, res) => {
  // Return empty array for now - this would normally fetch from database
  res.json([]);
});

// Gamification stats endpoint for Dashboard
app.get('/api/gamification/stats', (req, res) => {
  // Return default stats - this would normally fetch from database
  res.json({
    streak: 0,
    xp: 0,
    level: 1,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0
  });
});

// Leaderboard endpoint for Analytics
app.get('/api/gamification/leaderboard', (req, res) => {
  // Return empty leaderboard for now
  res.json([]);
});

// Resources endpoints
app.get('/api/resources', (req, res) => {
  // Return empty resources array for now
  res.json([]);
});

app.post('/api/resources', (req, res) => {
  // Mock resource creation
  res.json({ success: true, message: 'Resource saved successfully' });
});

app.post('/api/resources/recommend', (req, res) => {
  // Mock AI recommendations
  const { subject } = req.body;
  const mockRecommendations = [
    {
      title: `Best ${subject} Tutorial`,
      type: 'video',
      url: 'https://example.com/tutorial',
      description: `Comprehensive ${subject} tutorial for beginners`
    },
    {
      title: `${subject} Documentation`,
      type: 'article',
      url: 'https://example.com/docs',
      description: `Official ${subject} documentation and guides`
    }
  ];
  res.json({ recommendations: mockRecommendations });
});

app.put('/api/resources/:id', (req, res) => {
  // Mock resource update
  res.json({ success: true, message: 'Resource updated successfully' });
});

// Rooms endpoints
app.get('/api/rooms', (req, res) => {
  // Return empty rooms array for now
  res.json([]);
});

app.post('/api/rooms', (req, res) => {
  // Mock room creation
  const { name, description } = req.body;
  res.json({
    _id: 'mock-room-id',
    name,
    description,
    owner: { _id: 'mock-owner', name: 'Mock Owner', email: 'owner@example.com' },
    members: [],
    inviteCode: 'ABC123',
    isPublic: false
  });
});

app.post('/api/rooms/join', (req, res) => {
  // Mock room joining
  const { inviteCode } = req.body;
  res.json({
    _id: 'mock-joined-room-id',
    name: 'Joined Room',
    description: 'A room you joined',
    owner: { _id: 'mock-owner', name: 'Room Owner', email: 'owner@example.com' },
    members: [],
    inviteCode,
    isPublic: false
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless functions
export default app;



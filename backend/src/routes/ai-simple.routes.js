import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'AI route is working', timestamp: new Date().toISOString() });
});


// Simple schedule generation
router.post('/generate-schedule', requireAuth, (req, res) => {
  console.log('=== Schedule Generation Request ===');
  console.log('Body:', req.body);
  
  try {
    const { goal, subjects, deadline, dailyAvailableMinutes } = req.body;
    
    // Validate required fields
    if (!goal || !subjects || !deadline || !dailyAvailableMinutes) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { goal, subjects, deadline, dailyAvailableMinutes }
      });
    }

    // Create simple fallback schedule
    const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    const tasks = [];
    
    // Create 3 tasks for each subject
    subjectArray.forEach((subject, index) => {
      for (let i = 0; i < 3; i++) {
        const taskDate = new Date();
        taskDate.setDate(taskDate.getDate() + (index * 3 + i));
        
        tasks.push({
          title: `${subject} Study Session ${i + 1}`,
          subject: subject,
          date: taskDate.toISOString().split('T')[0],
          durationMinutes: Math.max(30, Math.floor(dailyAvailableMinutes / 3))
        });
      }
    });
    
    console.log('Generated tasks:', tasks.length);
    
    res.json({ 
      plan: { 
        tasks: tasks.sort((a, b) => new Date(a.date) - new Date(b.date))
      } 
    });
  } catch (error) {
    console.error('Error in schedule generation:', error);
    res.status(500).json({ 
      message: 'Schedule generation failed', 
      error: error.message 
    });
  }
});

export default router;

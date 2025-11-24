import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Quiz from '../models/Quiz.js';
import Room from '../models/Room.js';
import { v4 as uuid } from 'uuid';
import { generateQuizViaHF } from '../lib/hf.js';

const router = Router();

// Generate quiz
router.post('/generate', requireAuth, async (req, res) => {
  try {
    console.log('=== Quiz Generation Request ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const { room_id, topic, difficulty, total_questions } = req.body;

    if (!room_id || !topic || !difficulty || !total_questions) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if room exists
    const room = await Room.findOne({ room_id });
    if (!room) {
      console.log('Room not found:', room_id);
      return res.status(404).json({ error: 'Room not found' });
    }

    console.log('Generating quiz with AI...');
    console.log('Request data:', { room_id, topic, difficulty, total_questions });
    
    const generated = await generateQuizViaHF(topic, difficulty, total_questions);
    console.log('Generated quiz data:', generated);
    
    if (!generated || !Array.isArray(generated) || generated.length === 0) {
      console.error('Invalid quiz data generated:', generated);
      return res.status(500).json({ error: 'Failed to generate valid quiz data' });
    }
    
    const quiz = await Quiz.create({
      quiz_id: uuid(),
      room_id,
      difficulty,
      total_questions,
      quiz_data: generated,
      approved: false,
    });

    console.log('Quiz created successfully:', quiz);
    res.json(quiz);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// Get quiz for a room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('Fetching quiz for room:', roomId);
    
    const quiz = await Quiz.findOne({ room_id: roomId })
      .select('quiz_id room_id difficulty total_questions quiz_data approved created_at');

    if (!quiz) {
      console.log('No quiz found for room:', roomId);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    console.log('Quiz found:', quiz.quiz_id);
    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to get quiz' });
  }
});

// Approve quiz
router.post('/:roomId/approve', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('Approving quiz for room:', roomId);
    
    const quiz = await Quiz.findOne({ room_id: roomId });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    quiz.approved = true;
    await quiz.save();

    console.log('Quiz approved successfully');
    res.json({ success: true, approved: true });
  } catch (error) {
    console.error('Approve quiz error:', error);
    res.status(500).json({ error: 'Failed to approve quiz' });
  }
});

export default router;
import { Router } from 'express';
import Participant from '../models/Participant.js';
import Quiz from '../models/Quiz.js';
import Answer from '../models/Answer.js';

const router = Router();

// Submit answer
router.post('/', async (req, res) => {
  try {
    const { participant_id, quiz_id, question_id, selected_option } = req.body;

    if (!participant_id || !quiz_id || !question_id || selected_option === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get participant
    const participant = await Participant.findById(participant_id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Get quiz
    const quiz = await Quiz.findOne({ quiz_id });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Find the question
    const question = quiz.quiz_data.find(q => q.id === question_id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if answer is correct
    const isCorrect = selected_option === question.correctIndex;

    // Save answer
    const answer = await Answer.create({
      participant_id,
      quiz_id,
      question_id,
      selected_option,
      is_correct: isCorrect
    });

    // Update participant score if correct
    if (isCorrect) {
      participant.score += 1;
      await participant.save();
    }

    res.json({
      success: true,
      is_correct: isCorrect,
      correct_answer: question.correctIndex,
      score: participant.score
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

export default router;

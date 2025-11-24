import { Router } from 'express';
import Participant from '../models/Participant.js';

const router = Router();

// Get leaderboard for a room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const participants = await Participant.find({ room_id: roomId })
      .select('nickname score joined_at')
      .sort({ score: -1, joined_at: 1 });

    const leaderboard = participants.map((participant, index) => ({
      participant_name: participant.nickname,
      score: participant.score,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;

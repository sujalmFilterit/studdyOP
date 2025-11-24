import { Router } from 'express';
import Participant from '../models/Participant.js';
import Room from '../models/Room.js';

const router = Router();

// Join room as participant
router.post('/', async (req, res) => {
  try {
    const { room_id, nickname, email } = req.body;

    if (!room_id || !nickname || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if room exists and is active
    const room = await Room.findOne({ room_id, status: 'active' });
    if (!room) {
      return res.status(404).json({ error: 'Room not found or not active' });
    }

    // Check if participant already exists
    const existingParticipant = await Participant.findOne({ room_id, email });
    if (existingParticipant) {
      return res.status(409).json({ error: 'You have already joined this room' });
    }

    const participant = await Participant.create({
      room_id,
      nickname: nickname.trim(),
      email: email.trim(),
      score: 0
    });

    res.json({
      id: participant._id,
      room_id: participant.room_id,
      nickname: participant.nickname,
      email: participant.email,
      score: participant.score,
      joined_at: participant.joined_at
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get participants for a room
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const participants = await Participant.find({ room_id: roomId })
      .select('nickname email score joined_at')
      .sort({ score: -1, joined_at: 1 });

    res.json(participants);
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

export default router;

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Room from '../models/Room.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// Create room
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('=== Room Creation Request ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const { name } = req.body;

    if (!name || !name.trim()) {
      console.log('Validation failed: Room name is required');
      return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = uuid();
    console.log('Creating room with ID:', roomId);
    
    const room = await Room.create({
      room_id: roomId,
      name: name.trim(),
      created_by: req.user.id,
      status: 'active'
    });

    console.log('Room created successfully:', room);
    
    res.json({
      room_id: room.room_id,
      name: room.name,
      status: room.status,
      created_at: room.created_at
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get all rooms
router.get('/', requireAuth, async (req, res) => {
  try {
    const rooms = await Room.find({ created_by: req.user.id })
      .select('room_id name status created_at')
      .sort({ created_at: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get specific room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ room_id: roomId })
      .select('room_id name status created_at');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Update room (end room)
router.patch('/:roomId', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;

    const room = await Room.findOne({ room_id: roomId, created_by: req.user.id });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (status === 'ended') {
      room.status = 'ended';
      await room.save();
    }

    res.json(room);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:roomId', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findOneAndDelete({ 
      room_id: roomId, 
      created_by: req.user.id 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
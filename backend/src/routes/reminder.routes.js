import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Reminder from '../models/Reminder.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const reminder = await Reminder.create({ ...req.body, user: req.user.id });
  res.json(reminder);
});

router.get('/', requireAuth, async (req, res) => {
  const reminders = await Reminder.find({ user: req.user.id }).sort({ scheduledAt: 1 });
  res.json(reminders);
});

router.put('/:id', requireAuth, async (req, res) => {
  const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
  if (!reminder) return res.status(404).json({ message: 'Not found' });
  res.json(reminder);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!reminder) return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

export default router;



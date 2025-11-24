import { Router } from 'express';
import StudyPlan from '../models/StudyPlan.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const plan = await StudyPlan.create({ ...req.body, user: req.user.id });
    res.json(plan);
  } catch (e) {
    res.status(400).json({ message: 'Create plan failed' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const plans = await StudyPlan.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(plans);
});

router.get('/:id', requireAuth, async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
  if (!plan) return res.status(404).json({ message: 'Not found' });
  res.json(plan);
});

router.put('/:id', requireAuth, async (req, res) => {
  const plan = await StudyPlan.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
  if (!plan) return res.status(404).json({ message: 'Not found' });
  res.json(plan);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!plan) return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

export default router;



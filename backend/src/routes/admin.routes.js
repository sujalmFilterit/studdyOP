import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import StudyPlan from '../models/StudyPlan.js';

const router = Router();

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  res.json(users);
});

router.get('/progress', requireAuth, requireAdmin, async (req, res) => {
  const plans = await StudyPlan.find({}).lean();
  const progress = plans.map((p) => {
    const total = p.tasks.length || 0;
    const done = p.tasks.filter((t) => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { planId: p._id, user: p.user, goal: p.goal, completion: pct };
  });
  res.json(progress);
});

export default router;



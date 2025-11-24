import { Router } from 'express';
import StudyPlan from '../models/StudyPlan.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/:planId', requireAuth, async (req, res) => {
  const { planId } = req.params;
  const plan = await StudyPlan.findOne({ _id: planId, user: req.user.id });
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  plan.tasks.push(req.body);
  await plan.save();
  res.json(plan);
});

router.patch('/:planId/:taskId/toggle', requireAuth, async (req, res) => {
  const { planId, taskId } = req.params;
  const plan = await StudyPlan.findOne({ _id: planId, user: req.user.id });
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  
  // Try schedule first (current model structure)
  let task = plan.schedule?.id(taskId);
  if (!task && plan.tasks) {
    // Fallback to tasks if it exists (for backward compatibility)
    task = plan.tasks.id(taskId);
  }
  
  if (!task) return res.status(404).json({ message: 'Task not found' });
  task.completed = !task.completed;
  await plan.save();
  res.json(plan);
});

router.delete('/:planId/:taskId', requireAuth, async (req, res) => {
  const { planId, taskId } = req.params;
  const plan = await StudyPlan.findOne({ _id: planId, user: req.user.id });
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  
  // Try schedule first (current model structure)
  let task = plan.schedule?.id(taskId);
  if (!task && plan.tasks) {
    // Fallback to tasks if it exists (for backward compatibility)
    task = plan.tasks.id(taskId);
  }
  
  if (!task) return res.status(404).json({ message: 'Task not found' });
  task.deleteOne();
  await plan.save();
  res.json(plan);
});

export default router;



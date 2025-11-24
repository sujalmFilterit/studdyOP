import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import StudyPlan from '../models/StudyPlan.js';

const router = Router();

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calculate additional stats
    const plans = await StudyPlan.find({ user: req.user.id });
    const totalTasks = plans.reduce((sum, plan) => sum + (plan.schedule?.length || 0), 0);
    const completedTasks = plans.reduce((sum, plan) => 
      sum + (plan.schedule?.filter(item => item.completed).length || 0), 0
    );

    res.json({
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      totalTasks,
      completedTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Update streak and XP when task is completed
router.post('/complete-task', requireAuth, async (req, res) => {
  try {
    const { xpGained = 10 } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update XP
    user.xp += xpGained;
    
    // Update level (every 100 XP = 1 level)
    const newLevel = Math.floor(user.xp / 100) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
    }

    // Update streak (simplified - just increment for now)
    const today = new Date().toDateString();
    const lastActive = new Date(user.lastActiveDate).toDateString();
    
    if (lastActive !== today) {
      user.streak += 1;
      user.lastActiveDate = new Date();
    }

    await user.save();
    res.json({ streak: user.streak, xp: user.xp, level: user.level });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update stats' });
  }
});

// Get leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name xp level streak')
      .sort({ xp: -1 })
      .limit(10);
    
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

export default router;

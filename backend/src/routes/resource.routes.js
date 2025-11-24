import { Router } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';
import Resource from '../models/Resource.js';

const router = Router();

// Get user's resources
router.get('/', requireAuth, async (req, res) => {
  try {
    const resources = await Resource.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(resources);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
});

// Get AI-recommended resources for a subject
router.post('/recommend', requireAuth, async (req, res) => {
  try {
    const { subject, goal } = req.body;
    if (!subject) return res.status(400).json({ message: 'Subject required' });

    const prompt = `Recommend 3-5 high-quality learning resources for studying "${subject}". ${goal ? `Goal: ${goal}` : ''} Include YouTube videos, articles, books, or online courses. Return as JSON array with fields: title, type, url, description.`;

    const HF_TOKEN = process.env.HF_TOKEN;
    const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-V3.1-Terminus';
    
    if (!HF_TOKEN) return res.status(500).json({ message: 'AI service not configured' });

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${DEEPSEEK_MODEL}`,
      { inputs: prompt, parameters: { max_new_tokens: 500, temperature: 0.3 } },
      { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
    );

    const aiResponse = Array.isArray(response.data)
      ? (response.data[0]?.generated_text || response.data[0]?.summary_text || '[]')
      : response.data?.generated_text || '[]';

    let recommendations = [];
    try {
      const jsonStr = aiResponse.match(/\[[\s\S]*\]/)?.[0] || aiResponse;
      recommendations = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback recommendations
      recommendations = [
        { title: `${subject} Tutorial`, type: 'video', url: 'https://youtube.com', description: 'Learn the basics' },
        { title: `${subject} Guide`, type: 'article', url: 'https://example.com', description: 'Comprehensive guide' }
      ];
    }

    res.json({ recommendations });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get recommendations', error: e.message });
  }
});

// Save recommended resource
router.post('/', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, user: req.user.id });
    res.json(resource);
  } catch (e) {
    res.status(400).json({ message: 'Failed to save resource' });
  }
});

// Update resource (mark as completed, rate)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (e) {
    res.status(400).json({ message: 'Failed to update resource' });
  }
});

// Delete resource
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: 'Failed to delete resource' });
  }
});

export default router;

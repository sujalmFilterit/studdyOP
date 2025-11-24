import { Router } from 'express';
import { OpenAI } from 'openai';

const router = Router();

// Generate AI feedback
router.post('/', async (req, res) => {
  try {
    const { topic, correct, wrong, strengths, weaknesses, totalQuestions, participantCount, averageScore } = req.body;

    if (!topic || correct === undefined || wrong === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const score = correct;
    const percentage = Math.round((correct / totalQuestions) * 100);
    
    // Use HuggingFace AI for feedback generation
    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ 
        error: 'HF_TOKEN environment variable is required' 
      });
    }
    
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN
    });

    const prompt = `Generate comprehensive study feedback for a quiz on "${topic}". 

PERFORMANCE ANALYSIS:
- Score: ${correct}/${totalQuestions} (${percentage}%)
- Wrong answers: ${wrong}
- Total participants: ${participantCount || 'Unknown'}
- Average score: ${averageScore || 'Not available'}

STRENGTHS: ${strengths?.join(', ') || 'None specified'}
WEAKNESSES: ${weaknesses?.join(', ') || 'None specified'}

Please provide:
1. A brief comparison of this performance against other participants
2. Exactly 5 specific, actionable feedback points

Format the response as:
COMPARISON: [Brief analysis of performance vs other participants]
FEEDBACK:
1. [First specific point]
2. [Second specific point] 
3. [Third specific point]
4. [Fourth specific point]
5. [Fifth specific point]

Be encouraging but constructive, and make each point specific and actionable.`;

    const res_ai = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
      messages: [
        { 
          role: "system", 
          content: "You are StudyBuddy AI, an expert tutor providing personalized feedback to help students improve their learning. Be encouraging, constructive, and specific. Always provide exactly 5 feedback points and a participant comparison." 
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = res_ai.choices[0]?.message?.content || '';
    
    // Parse the structured response
    const comparisonMatch = content.match(/COMPARISON:\s*(.+?)(?=FEEDBACK:|$)/s);
    const feedbackMatch = content.match(/FEEDBACK:\s*([\s\S]+)/);
    
    let comparison = "Your performance shows good understanding of the topic.";
    let feedbackPoints = [];
    
    if (comparisonMatch) {
      comparison = comparisonMatch[1].trim();
    }
    
    if (feedbackMatch) {
      const feedbackText = feedbackMatch[1];
      feedbackPoints = feedbackText
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }
    
    // If parsing failed, extract any numbered points
    if (feedbackPoints.length === 0) {
      feedbackPoints = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }

    res.json({ 
      comparison,
      feedback: feedbackPoints,
      score: { correct, wrong, percentage, total: totalQuestions }
    });
  } catch (error) {
    console.error('Generate feedback error:', error);
    
    // Enhanced fallback feedback with comparison
    const percentage = Math.round((req.body.correct / req.body.totalQuestions) * 100);
    const comparison = percentage >= 80 
      ? "Excellent performance! You scored above average and demonstrated strong understanding of the topic."
      : percentage >= 60 
      ? "Good performance! You have a solid foundation but there's room for improvement in some areas."
      : "Keep working hard! Focus on the fundamentals and practice regularly to improve your understanding.";
    
    const fallbackFeedback = [
      `Great job on getting ${req.body.correct} questions correct!`,
      `Focus on reviewing the topics you missed to improve your understanding.`,
      `Keep practicing regularly to strengthen your knowledge.`,
      `Consider breaking down complex topics into smaller parts.`,
      `Don't hesitate to ask for help when you need it.`
    ];

    res.json({ 
      comparison,
      feedback: fallbackFeedback,
      score: { 
        correct: req.body.correct, 
        wrong: req.body.wrong, 
        percentage, 
        total: req.body.totalQuestions 
      }
    });
  }
});

export default router;

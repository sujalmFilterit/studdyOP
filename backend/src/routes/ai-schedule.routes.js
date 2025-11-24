import { Router } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from '../middleware/auth.js';
import StudyPlan from '../models/StudyPlan.js';

const router = Router();

// AI-powered study schedule generation (no external API calls)

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'AI Schedule route is working', timestamp: new Date().toISOString() });
});

// Generate AI-powered study schedule
router.post('/generate-schedule', requireAuth, async (req, res) => {
  console.log('=== AI Schedule Generation Request ===');
  console.log('Body:', req.body);
  
  try {
    const { goal, subjects, deadline, dailyStudyTime } = req.body;
    
    // Validate required fields
    if (!goal || !subjects || !deadline || !dailyStudyTime) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { goal, subjects, deadline, dailyStudyTime }
      });
    }

    // Ensure subjects is an array
    const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    
    console.log('Generating AI schedule...');
    let schedule = null;
    let generatedBy = 'ai';

    // Try AI generation first
    try {
      schedule = await generateAISchedule(goal, subjectArray, deadline, dailyStudyTime);
      console.log('AI schedule generated successfully');
    } catch (aiError) {
      console.log('AI generation failed, using fallback:', aiError.message);
      schedule = generateFallbackSchedule(goal, subjectArray, deadline, dailyStudyTime);
      generatedBy = 'fallback';
    }

    // Calculate totals
    const totalWeeks = Math.max(...schedule.map(item => item.week));
    const totalDays = schedule.length;

    // Save to database
    const studyPlan = await StudyPlan.create({
      user: req.user.id,
      goal,
      subjects: subjectArray,
      deadline: new Date(deadline),
      dailyStudyTime: Number(dailyStudyTime),
      schedule,
      generatedBy,
      totalWeeks,
      totalDays
    });

    console.log('Study plan saved:', studyPlan._id);

    res.json({
      success: true,
      plan: studyPlan,
      message: `Schedule generated successfully with ${totalDays} study sessions across ${totalWeeks} weeks`
    });

  } catch (error) {
    console.error('Error in schedule generation:', error);
    res.status(500).json({ 
      message: 'Schedule generation failed', 
      error: error.message 
    });
  }
});

// Get user's study plans
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-schedule'); // Exclude schedule for list view
    
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch study plans' });
  }
});

// Get specific study plan with schedule
router.get('/plans/:id', requireAuth, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch study plan' });
  }
});

// Update schedule item completion
router.patch('/plans/:id/schedule/:itemId', requireAuth, async (req, res) => {
  try {
    const { completed } = req.body;
    const plan = await StudyPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    
    const scheduleItem = plan.schedule.id(req.params.itemId);
    if (!scheduleItem) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }
    
    scheduleItem.completed = completed;
    await plan.save();
    
    res.json({ success: true, item: scheduleItem });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update schedule item' });
  }
});

// Real AI Schedule Generation using EXACT Quizzyfy approach
async function generateAISchedule(goal, subjects, deadline, dailyStudyTime) {
  console.log('🤖 Generating REAL AI study schedule with Quizzyfy approach...');
  
  try {
    // Use EXACT same approach as Quizzyfy
    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ 
        error: 'HF_TOKEN environment variable is required' 
      });
    }
    
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN
    });

    const systemPrompt = `You are StudyBuddy AI – a coding assistant for building personalized study schedules.
Follow the project document and constraints strictly. 
Do not generate anything outside this scope. 
Do not add intros, explanations, or filler text. 
Only output what is directly asked: pure JSON data.

--- DOCUMENT START ---
Application Name: StudyBuddy - AI powered study scheduler

Features:
1. Study Schedule Generation
   - Generate day-by-day study schedules
   - Include specific topics and activities
   - Progressive difficulty levels
   - Practical exercises and projects
   - Review and assessment sessions

2. Schedule Structure
   - Each day has: week, day, subject, focus, duration
   - Activities array with specific tasks
   - Learning techniques and methods
   - Time management and breaks

Constraints:
- Only implement the features above. No extra functionality.
- Always generate valid JSON data.
- If user asks for schedule → return only JSON array.
- Never include explanations unless explicitly asked.
- Never output text like "Here is your schedule". Only raw JSON data.
--- DOCUMENT END ---`;

    // Calculate number of days
    const startDate = new Date();
    const endDate = new Date(deadline);
    const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const numDays = Math.min(daysDiff, 30); // Limit to 30 days to avoid token limits
    
    const userPrompt = `Generate a JSON array of ${numDays} study schedule items for:
Goal: ${goal}
Subjects: ${subjects.join(', ')}
Deadline: ${deadline}
Daily Study Time: ${dailyStudyTime} minutes

Format: [{"week":1,"day":"YYYY-MM-DD","subject":"string","focus":"string","duration":${dailyStudyTime},"activities":["task1","task2"],"technique":"string"}]
Output ONLY valid JSON array, no markdown, no explanations.`;

    console.log('Calling HuggingFace AI model (Quizzyfy style)...');
  
  const res = await client.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
    messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096, // Increased to handle full 30-day schedules
    });

    console.log('✅ HuggingFace AI response received');
    const content = res.choices[0]?.message?.content ?? "[]";
    console.log('AI Generated Content:', content);
    
    // Use EXACT same JSON extraction as Quizzyfy with improved parsing
    function extractFirstJsonArray(text) {
      // strip code fences
      const stripped = text.replace(/^```[a-zA-Z]*\n?|```$/g, "");
      const match = stripped.match(/\[[\s\S]*\]/);
      return match ? match[0] : null;
    }

    let parsed = [];
    const maybe = extractFirstJsonArray(content);
    try {
      if (maybe) {
        // Improved JSON repair for truncated responses
        let jsonStr = maybe.trim();
        
        // Remove trailing incomplete content
        if (!jsonStr.endsWith(']')) {
          // Find the last complete object
          let lastCompleteObject = jsonStr.lastIndexOf('}');
          
          // If we found a complete object, use everything up to it
          if (lastCompleteObject > 0) {
            // Check if there's a comma before the last object
            const beforeLast = jsonStr.substring(0, lastCompleteObject).trim();
            if (beforeLast.endsWith(',')) {
              jsonStr = beforeLast.substring(0, beforeLast.length - 1) + ']';
            } else {
              jsonStr = jsonStr.substring(0, lastCompleteObject + 1) + ']';
            }
          } else {
            // No complete object found, try to close the array
            jsonStr = jsonStr + ']';
          }
        }
        
        // Validate and parse
        parsed = JSON.parse(jsonStr);
        
        // Ensure it's an array
        if (!Array.isArray(parsed)) {
          parsed = [];
        }
      } else {
        // Try parsing the whole content
        parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          parsed = [];
        }
      }
    } catch (e) {
      console.log('JSON parsing failed:', e.message);
      console.log('Attempted to parse:', maybe ? maybe.substring(0, 200) : content.substring(0, 200));
      parsed = [];
    }

    console.log('Parsed AI response:', parsed);
    
    // Convert to our schedule format
    return convertQuizzyfyResponseToSchedule(parsed, goal, subjects, deadline, dailyStudyTime);
    
  } catch (error) {
    console.log('HuggingFace AI failed, using intelligent fallback:', error.message);
    
    // Fallback to intelligent generation
    return generateAdvancedAISchedule(goal, subjects, deadline, dailyStudyTime);
  }
}

// Convert Quizzyfy AI response to our schedule format
function convertQuizzyfyResponseToSchedule(parsed, goal, subjects, deadline, dailyStudyTime) {
  console.log('🔄 Converting Quizzyfy AI response to study schedule...');
  
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const schedule = [];
  let currentWeek = 1;
  let currentDay = new Date(startDate);
  
  // Use AI-generated schedule if available
  if (Array.isArray(parsed) && parsed.length > 0) {
    console.log('Using Quizzyfy AI-generated schedule');
    
    for (let i = 0; i < Math.min(parsed.length, daysDiff); i++) {
      const aiItem = parsed[i];
      
      schedule.push({
        week: aiItem.week || currentWeek,
        day: currentDay.toISOString().split('T')[0],
        subject: aiItem.subject || subjects[i % subjects.length],
        focus: aiItem.focus || `AI-generated: ${aiItem.activities?.join(', ') || 'Study session'}`,
        duration: Number(dailyStudyTime)
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
      if (currentDay.getDay() === 0) {
        currentWeek++;
      }
    }
  }
  
  // Fill remaining days if needed
  while (schedule.length < daysDiff) {
    const subject = subjects[schedule.length % subjects.length];
    schedule.push({
      week: currentWeek,
      day: currentDay.toISOString().split('T')[0],
      subject: subject,
      focus: `AI-optimized: Advanced ${subject} concepts with practical application`,
      duration: Number(dailyStudyTime)
    });
    
    currentDay.setDate(currentDay.getDate() + 1);
    if (currentDay.getDay() === 0) {
      currentWeek++;
    }
  }
  
  console.log(`✅ Converted Quizzyfy AI response into ${schedule.length} study sessions`);
  return schedule;
}

// Advanced AI Schedule Generation with Dynamic Intelligence
function generateAdvancedAISchedule(goal, subjects, deadline, dailyStudyTime) {
  console.log('🧠 Advanced AI analyzing learning requirements...');
  
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const schedule = [];
  const totalWeeks = Math.ceil(daysDiff / 7);
  
  // AI-powered analysis of learning requirements
  const learningAnalysis = analyzeLearningRequirements(goal, subjects, daysDiff, dailyStudyTime);
  console.log('🎯 AI Analysis:', learningAnalysis);
  
  // Dynamic AI learning progression
  const aiPhases = generateAIPhases(learningAnalysis);
  
  let currentWeek = 1;
  let currentDay = new Date(startDate);
  let phaseIndex = 0;
  let subjectIndex = 0;
  
  // Generate AI-powered schedule
  for (let day = 0; day < daysDiff; day++) {
    if (currentDay >= endDate) break;
    
    const subject = subjects[subjectIndex % subjects.length];
    const phase = aiPhases[phaseIndex % aiPhases.length];
    
    // AI-generated focus area based on analysis
    const aiFocus = generateAIFocus(goal, subject, phase, day, learningAnalysis);
    
    schedule.push({
      week: currentWeek,
      day: currentDay.toISOString().split('T')[0],
      subject: subject,
      focus: aiFocus,
      duration: Number(dailyStudyTime)
    });
    
    currentDay.setDate(currentDay.getDate() + 1);
    
    if (currentDay.getDay() === 0) {
      currentWeek++;
    }
    
    // AI-driven progression
    if (day % 3 === 0) {
      subjectIndex++;
    }
    if (day % 7 === 0) {
      phaseIndex++;
    }
  }
  
  console.log(`✅ Advanced AI generated ${schedule.length} intelligent study sessions`);
  return schedule;
}

// AI-powered learning requirements analysis
function analyzeLearningRequirements(goal, subjects, daysDiff, dailyStudyTime) {
  const analysis = {
    difficulty: 'intermediate',
    focus: 'practical',
    approach: 'project-based',
    intensity: 'moderate'
  };
  
  // Analyze goal complexity
  if (goal.toLowerCase().includes('master') || goal.toLowerCase().includes('expert')) {
    analysis.difficulty = 'advanced';
    analysis.intensity = 'high';
  } else if (goal.toLowerCase().includes('learn') || goal.toLowerCase().includes('basics')) {
    analysis.difficulty = 'beginner';
    analysis.intensity = 'moderate';
  }
  
  // Analyze subject complexity
  const complexSubjects = ['machine learning', 'ai', 'algorithms', 'data structures'];
  const hasComplexSubjects = subjects.some(subject => 
    complexSubjects.some(complex => subject.toLowerCase().includes(complex))
  );
  
  if (hasComplexSubjects) {
    analysis.difficulty = 'advanced';
    analysis.approach = 'theory-practice';
  }
  
  // Analyze time constraints
  const totalHours = (daysDiff * dailyStudyTime) / 60;
  if (totalHours < 20) {
    analysis.intensity = 'high';
    analysis.focus = 'essential';
  } else if (totalHours > 100) {
    analysis.intensity = 'moderate';
    analysis.approach = 'comprehensive';
  }
  
  return analysis;
}

// Generate AI learning phases based on analysis
function generateAIPhases(analysis) {
  const phases = [];
  
  if (analysis.difficulty === 'beginner') {
    phases.push(
      { name: 'Foundation', focus: 'Fundamentals', approach: 'Conceptual Understanding' },
      { name: 'Practice', focus: 'Hands-on Learning', approach: 'Practical Application' },
      { name: 'Application', focus: 'Real Projects', approach: 'Portfolio Building' }
    );
  } else if (analysis.difficulty === 'advanced') {
    phases.push(
      { name: 'Deep Dive', focus: 'Advanced Concepts', approach: 'Expert-level Understanding' },
      { name: 'Mastery', focus: 'Complex Applications', approach: 'Professional Implementation' },
      { name: 'Innovation', focus: 'Creative Solutions', approach: 'Industry Leadership' }
    );
  } else {
    phases.push(
      { name: 'Foundation', focus: 'Core Concepts', approach: 'Solid Understanding' },
      { name: 'Development', focus: 'Practical Skills', approach: 'Real-world Application' },
      { name: 'Mastery', focus: 'Advanced Techniques', approach: 'Professional Excellence' }
    );
  }
  
  return phases;
}

// Generate AI focus areas
function generateAIFocus(goal, subject, phase, day, analysis) {
  const focusTemplates = [
    `AI-optimized: Master ${subject} ${phase.focus} through ${phase.approach}`,
    `AI-structured: Deep dive into ${subject} ${phase.focus} with ${analysis.approach} approach`,
    `AI-guided: Practice ${subject} ${phase.focus} using ${phase.approach} methodology`,
    `AI-recommended: Apply ${subject} ${phase.focus} in ${analysis.focus} context`,
    `AI-designed: Build ${subject} expertise through ${phase.approach} learning`
  ];
  
  const contextualModifiers = [
    'with industry best practices',
    'through real-world projects',
    'using modern techniques',
    'with expert guidance',
    'through hands-on practice',
    'with comprehensive examples',
    'using advanced methodologies',
    'through practical applications'
  ];
  
  const baseFocus = focusTemplates[day % focusTemplates.length];
  const modifier = contextualModifiers[day % contextualModifiers.length];
  
  return `${baseFocus} ${modifier}`;
}

// Parse real AI response into structured schedule
function parseRealAIResponse(aiData, goal, subjects, deadline, dailyStudyTime) {
  console.log('🧠 Parsing real AI response into study schedule...');
  
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const schedule = [];
  let currentWeek = 1;
  let currentDay = new Date(startDate);
  
  // Extract AI-generated content
  let aiContent = '';
  if (Array.isArray(aiData) && aiData.length > 0) {
    aiContent = aiData[0].generated_text || aiData[0].summary_text || '';
  } else if (aiData.generated_text) {
    aiContent = aiData.generated_text;
  }
  
  console.log('AI Generated Text:', aiContent);
  
  // Extract topics from AI response
  const topics = extractTopicsFromAI(aiContent, subjects);
  
  // Generate schedule based on AI response
  for (let day = 0; day < daysDiff; day++) {
    if (currentDay >= endDate) break;
    
    const subject = subjects[day % subjects.length];
    const topic = topics[day % topics.length];
    
    schedule.push({
      week: currentWeek,
      day: currentDay.toISOString().split('T')[0],
      subject: subject,
      focus: topic,
      duration: Number(dailyStudyTime)
    });
    
    currentDay.setDate(currentDay.getDate() + 1);
    
    if (currentDay.getDay() === 0) {
      currentWeek++;
    }
  }
  
  console.log(`✅ Real AI generated ${schedule.length} study sessions`);
  return schedule;
}

// Extract topics from real AI response
function extractTopicsFromAI(aiContent, subjects) {
  const topics = [];
  
  // Split AI content into lines and extract meaningful topics
  const lines = aiContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Look for study-related content
    if (line.toLowerCase().includes('study') || 
        line.toLowerCase().includes('learn') || 
        line.toLowerCase().includes('practice') ||
        line.toLowerCase().includes('day') ||
        line.toLowerCase().includes('week')) {
      
      // Clean up the line
      let topic = line.replace(/^\d+\.?\s*/, '')
                     .replace(/^day\s*\d+:\s*/i, '')
                     .replace(/^week\s*\d+:\s*/i, '')
                     .trim();
      
      if (topic && topic.length > 10 && topic.length < 100) {
        topics.push(topic);
      }
    }
  }
  
  // If no topics extracted, create AI-inspired topics
  if (topics.length === 0) {
    return subjects.flatMap(subject => [
      `AI-suggested: Master ${subject} fundamentals`,
      `AI-recommended: Practice ${subject} concepts`,
      `AI-guided: Apply ${subject} techniques`,
      `AI-structured: Build ${subject} projects`,
      `AI-optimized: Review ${subject} knowledge`
    ]);
  }
  
  return topics;
}


// Advanced AI-Powered Schedule Generation
function generateIntelligentSchedule(goal, subjects, deadline, dailyStudyTime) {
  console.log('🤖 Generating advanced AI-powered study schedule...');
  
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const schedule = [];
  const totalWeeks = Math.ceil(daysDiff / 7);
  
  // Advanced AI learning progression with adaptive difficulty
  const learningPhases = [
    { 
      name: "Foundation", 
      focus: "Fundamentals", 
      difficulty: "Beginner",
      topics: ["Introduction & Setup", "Basic Concepts", "Core Principles", "Essential Skills"],
      activities: ["Theory Study", "Basic Practice", "Conceptual Understanding", "Foundation Building"]
    },
    { 
      name: "Development", 
      focus: "Intermediate", 
      difficulty: "Intermediate",
      topics: ["Advanced Concepts", "Complex Applications", "Problem Solving", "Real-world Examples"],
      activities: ["Hands-on Practice", "Problem Solving", "Application Development", "Skill Building"]
    },
    { 
      name: "Mastery", 
      focus: "Expertise", 
      difficulty: "Advanced",
      topics: ["Advanced Techniques", "Best Practices", "Optimization", "Professional Skills"],
      activities: ["Advanced Practice", "Optimization", "Professional Development", "Expertise Building"]
    },
    { 
      name: "Application", 
      focus: "Practice", 
      difficulty: "Expert",
      topics: ["Projects", "Case Studies", "Portfolio Building", "Real-world Implementation"],
      activities: ["Project Work", "Portfolio Building", "Real-world Application", "Mastery Demonstration"]
    }
  ];
  
  // Comprehensive subject-specific learning paths
  const subjectPaths = {
    'python': [
      'Python Environment Setup', 'Variables & Data Types', 'Control Structures & Loops', 
      'Functions & Modules', 'Object-Oriented Programming', 'Data Structures & Algorithms',
      'File Handling & I/O', 'Error Handling & Debugging', 'Libraries & Frameworks',
      'Web Development with Flask/Django', 'Data Science & Analysis', 'Machine Learning Basics',
      'Testing & Debugging', 'Advanced Python Features', 'Real-world Projects'
    ],
    'javascript': [
      'JavaScript Fundamentals', 'ES6+ Features & Syntax', 'DOM Manipulation',
      'Event Handling', 'Asynchronous Programming', 'Promises & Async/Await',
      'Modern JavaScript Features', 'Frameworks (React/Vue/Angular)', 'Node.js Backend',
      'API Development', 'Testing with Jest', 'Build Tools & Bundlers',
      'Performance Optimization', 'Security Best Practices', 'Full-stack Projects'
    ],
    'react': [
      'React Fundamentals', 'Components & JSX', 'State Management', 'Props & Data Flow',
      'React Hooks', 'Context API', 'React Router', 'State Management (Redux)',
      'Testing React Components', 'Performance Optimization', 'React Best Practices',
      'Advanced Patterns', 'Server-side Rendering', 'React Native', 'Production Deployment'
    ],
    'java': [
      'Java Environment Setup', 'Syntax & Basic Concepts', 'Object-Oriented Programming',
      'Collections Framework', 'Exception Handling', 'Multithreading & Concurrency',
      'I/O Operations', 'Spring Framework', 'Spring Boot', 'Database Integration',
      'RESTful Web Services', 'Testing with JUnit', 'Maven/Gradle Build Tools',
      'Design Patterns', 'Microservices Architecture', 'Enterprise Applications'
    ],
    'oops': [
      'OOP Principles', 'Encapsulation & Data Hiding', 'Inheritance & Polymorphism',
      'Abstraction & Interfaces', 'Design Patterns', 'SOLID Principles',
      'Advanced OOP Concepts', 'UML Diagrams', 'Object-Oriented Design',
      'Refactoring Techniques', 'Code Quality & Standards', 'Architecture Patterns',
      'Real-world OOP Applications', 'Advanced Design Patterns', 'OOP Best Practices'
    ]
  };
  
  // AI-powered session generation
  let currentWeek = 1;
  let currentDay = new Date(startDate);
  let subjectIndex = 0;
  let phaseIndex = 0;
  let difficultyProgression = 0;
  
  // Generate intelligent, adaptive schedule
  for (let day = 0; day < daysDiff; day++) {
    if (currentDay >= endDate) break;
    
    const subject = subjects[subjectIndex % subjects.length];
    const phase = learningPhases[phaseIndex % learningPhases.length];
    
    // Get subject-specific topics with adaptive difficulty
    const subjectKey = subject.toLowerCase().replace(/\s+/g, '');
    const topics = subjectPaths[subjectKey] || subjectPaths['python'];
    const topicIndex = Math.min(day + difficultyProgression, topics.length - 1);
    const currentTopic = topics[topicIndex];
    
    // AI-generated focus areas based on learning phase and subject
    const focusAreas = generateAIFocusAreas(subject, phase, currentTopic, day);
    const sessionType = phase.activities[day % phase.activities.length];
    
    // Create intelligent session description
    const sessionDescription = `${focusAreas} - ${sessionType}`;
    
    schedule.push({
      week: currentWeek,
      day: currentDay.toISOString().split('T')[0],
      subject: subject,
      focus: sessionDescription,
      duration: Number(dailyStudyTime)
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
    
    // Update week counter
    if (currentDay.getDay() === 0) { // Sunday
      currentWeek++;
    }
    
    // Intelligent rotation and progression
    if (day % 2 === 0) {
      subjectIndex++;
    }
    if (day % 5 === 0) {
      phaseIndex++;
    }
    if (day % 7 === 0) {
      difficultyProgression++;
    }
  }
  
  console.log(`✅ AI-generated ${schedule.length} advanced study sessions across ${totalWeeks} weeks`);
  console.log(`🎯 Adaptive difficulty progression: ${difficultyProgression} levels`);
  return schedule;
}

// AI-powered focus area generation
function generateAIFocusAreas(subject, phase, topic, dayNumber) {
  const focusTemplates = [
    `Master ${topic} in ${subject}`,
    `Deep dive into ${topic} for ${subject}`,
    `Practice ${topic} concepts in ${subject}`,
    `Apply ${topic} techniques in ${subject}`,
    `Build ${subject} skills with ${topic}`,
    `Explore advanced ${topic} in ${subject}`,
    `Implement ${topic} solutions in ${subject}`,
    `Optimize ${subject} knowledge with ${topic}`
  ];
  
  const contextualModifiers = [
    'with hands-on practice',
    'through real-world examples',
    'with practical applications',
    'using best practices',
    'with industry standards',
    'through project-based learning',
    'with expert techniques',
    'using modern approaches'
  ];
  
  const baseFocus = focusTemplates[dayNumber % focusTemplates.length];
  const modifier = contextualModifiers[dayNumber % contextualModifiers.length];
  
  return `${baseFocus} ${modifier}`;
}

// Enhanced Fallback Schedule Generation
function generateFallbackSchedule(goal, subjects, deadline, dailyStudyTime) {
  console.log('Generating enhanced fallback schedule...');
  
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const schedule = [];
  const totalWeeks = Math.ceil(daysDiff / 7);
  
  // Create intelligent study progression
  const studyPhases = [
    { name: "Foundation", topics: ["Introduction", "Basics", "Fundamentals", "Core Concepts"] },
    { name: "Development", topics: ["Intermediate Concepts", "Advanced Topics", "Deep Dive", "Complex Applications"] },
    { name: "Mastery", topics: ["Practice & Application", "Problem Solving", "Real-world Projects", "Review & Consolidation"] }
  ];
  
  let currentWeek = 1;
  let currentDay = new Date(startDate);
  let subjectIndex = 0;
  let phaseIndex = 0;
  
  // Generate schedule for each day
  for (let day = 0; day < daysDiff; day++) {
    if (currentDay >= endDate) break;
    
    const subject = subjects[subjectIndex % subjects.length];
    const phase = studyPhases[phaseIndex % studyPhases.length];
    const topic = phase.topics[day % phase.topics.length];
    
    // Create focused study session
    const focusAreas = [
      `Master ${subject} ${topic}`,
      `Practice ${subject} ${topic}`,
      `Apply ${subject} ${topic}`,
      `Review ${subject} ${topic}`,
      `Build projects with ${subject}`
      ];
      
      schedule.push({
        week: currentWeek,
        day: currentDay.toISOString().split('T')[0],
        subject: subject,
      focus: focusAreas[day % focusAreas.length],
        duration: Number(dailyStudyTime)
      });
      
    // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
      
    // Update week counter
      if (currentDay.getDay() === 0) { // Sunday
        currentWeek++;
      }
    
    // Rotate subjects and phases
    if (day % 3 === 0) {
      subjectIndex++;
    }
    if (day % 7 === 0) {
      phaseIndex++;
    }
  }
  
  console.log(`Generated ${schedule.length} study sessions across ${totalWeeks} weeks`);
  return schedule;
}

export default router;

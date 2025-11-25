import { OpenAI } from 'openai';

// Lazy initialization - only create client when needed
let client = null;

function getClient() {
  if (!process.env.HF_TOKEN) {
    throw new Error('HF_TOKEN environment variable is required. Please set it in your environment variables.');
  }
  
  if (!client) {
    client = new OpenAI({ 
      baseURL: "https://router.huggingface.co/v1", 
      apiKey: process.env.HF_TOKEN
    });
  }
  
  return client;
}

export async function generateQuizViaHF(topic, difficulty, totalQuestions) {
    console.log('🤖 Generating quiz with HuggingFace AI (Quizzyfy approach)...');
    
    const systemPrompt = `You are Quizzify AI – a coding assistant for building the "Quizzify - AI powered quiz application". 
Follow the project document and constraints strictly. 
Do not generate anything outside this scope. 
Do not add intros, explanations, or filler text. 
Only output what is directly asked: pure code, JSON, SQL schema, or structured data.

--- DOCUMENT START ---
Application Name: Quizzify - AI powered quiz application

Features:
1. User Management
   - Users can register and log in.
   - Only registered users can create rooms.
   - Store user details: id, name, email, password (hashed), created_at.

2. Room Management
   - A registered user can create a room.
   - A live room is created with a unique link (UUID-based).
   - Store room details: room_id, created_by (user_id), status (active/ended), created_at.

3. Participant Management
   - Participants can join a room directly via link without registering.
   - Only nickname is required.
   - Store participants: id, room_id, nickname, score, joined_at.

4. AI Quiz Generation
   - Host selects difficulty (Easy | Medium | Hard).
   - Host selects number of questions (5 | 10 | 15 | 20).
   - AI generates quiz with MCQs (question, options, correct answer).
   - Host reviews/approves quiz → quiz is saved in DB.
   - Store quiz details: quiz_id, room_id, difficulty, total_questions, created_at, quiz_data (JSON).

5. Quiz Participation
   - Once approved, quiz appears on participants' screens.
   - Each participant answers within time limit per question.
   - Store answers: answer_id, participant_id, quiz_id, question_id, selected_option, is_correct, answered_at.

6. Scoring & Leaderboard
   - Score = count of correct answers.
   - Generate live leaderboard for each room.
   - Store leaderboard snapshot or calculate dynamically:
     participant_name, score, rank.

Constraints:
- Only implement the features above. No extra functionality.
- Always generate valid, executable code (Node.js, SQL, or React depending on request).
- If user asks for database schema → return pure SQL only.
- If user asks for API → return only API code.
- If user asks for frontend → return only React/Next.js code.
- If user asks for data → return only JSON.
- Never include explanations unless explicitly asked.
- Never output text like "Here is your code". Only raw code/data.
--- DOCUMENT END ---`;

    try {
        // Get client lazily (will throw if HF_TOKEN not set)
        const hfClient = getClient();
        const res = await hfClient.chat.completions.create({
            model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate a JSON array of ${totalQuestions} MCQs on "${topic}" difficulty ${difficulty}. Each item: { id: uuid, question: string, options: string[4], correctIndex: 0..3 }. Output ONLY JSON array.` },
            ],
            temperature: 0.7,
            max_tokens: 2048,
        });
        
        const content = res.choices[0]?.message?.content ?? "[]";
        console.log('Raw AI response:', content.substring(0, 200) + '...');

        function extractFirstJsonArray(text) {
            // strip code fences
            const stripped = text.replace(/^```[a-zA-Z]*\n?|```$/g, "");
            const match = stripped.match(/\[[\s\S]*\]/);
            return match ? match[0] : null;
        }

        let parsed = [];
        const maybe = extractFirstJsonArray(content);
        try {
            parsed = JSON.parse(maybe ?? content);
        } catch (e) {
            console.error('JSON parse error:', e);
            parsed = [];
        }

        // basic validation and normalization
        const normalized = (Array.isArray(parsed) ? parsed : []).map((raw, idx) => {
            const options = Array.isArray(raw.options) ? raw.options.slice(0, 4).map((o) => String(o)) : [];
            const question = String(raw.question ?? "");
            // Map string correct_answer to index if present
            let ci = Number.isInteger(raw.correctIndex) ? Math.max(0, Math.min(3, raw.correctIndex)) : -1;
            if (ci < 0 && typeof raw.correct_answer === "string" && options.length === 4) {
                const idxIn = options.findIndex((o) => o.trim().toLowerCase() === String(raw.correct_answer).trim().toLowerCase());
                ci = idxIn >= 0 ? idxIn : 0;
            }
            if (ci < 0) ci = 0;

            return { id: raw.id ?? `${idx}`, question, options, correctIndex: ci };
        }).filter((q) => q.question && q.options.length === 4);

        // Shuffle options per question to avoid always-correct-at-A
        function shuffleWithIndex(options, correctIndex) {
            const arr = options.slice();
            let mapIdx = correctIndex;
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = arr[i];
                arr[i] = arr[j];
                arr[j] = tmp;
                if (i === mapIdx) mapIdx = j; else if (j === mapIdx) mapIdx = i;
            }
            return { options: arr, correctIndex: mapIdx };
        }

        parsed = normalized.map((q) => {
            const { options, correctIndex } = shuffleWithIndex(q.options, q.correctIndex);
            return { ...q, options, correctIndex };
        });

        console.log(`✅ Generated ${parsed.length} quiz questions`);
        return parsed;
    } catch (error) {
        console.error('HF API Error:', error);
        console.log('🔄 Falling back to local quiz generation...');
        
        // Fallback to local quiz generation
        return generateLocalQuiz(topic, difficulty, totalQuestions);
    }
}

// Fallback local quiz generation
function generateLocalQuiz(topic, difficulty, totalQuestions) {
    console.log('🏠 Generating quiz locally...');
    
    const questions = [];
    const difficultyLevels = {
        'Easy': { complexity: 'basic', timeLimit: 30 },
        'Medium': { complexity: 'intermediate', timeLimit: 45 },
        'Hard': { complexity: 'advanced', timeLimit: 60 }
    };
    
    const level = difficultyLevels[difficulty] || difficultyLevels['Easy'];
    
    // Generate more realistic questions based on topic
    const topicLower = topic.toLowerCase();
    
    const questionTemplates = {
        'javascript': [
            'What is the correct way to declare a variable in JavaScript?',
            'Which method is used to add an element to the end of an array?',
            'What does the "this" keyword refer to in JavaScript?',
            'Which operator is used for strict equality comparison?',
            'What is the purpose of the "use strict" directive?'
        ],
        'python': [
            'What is the correct way to create a list in Python?',
            'Which keyword is used to define a function in Python?',
            'What is the difference between a list and a tuple?',
            'Which method is used to add an item to a list?',
            'What does the "if __name__ == \'__main__\'" statement do?'
        ],
        'react': [
            'What is the correct way to create a functional component in React?',
            'Which hook is used to manage state in functional components?',
            'What is the purpose of the useEffect hook?',
            'Which method is used to update state in React?',
            'What is the difference between props and state?'
        ],
        'drug': [
            'What are the primary health effects of drug addiction?',
            'Which approach is most effective for drug prevention?',
            'What is the first step in drug rehabilitation?',
            'Which factor contributes most to drug addiction?',
            'What is the best method for treating drug dependence?'
        ],
        'alcohol': [
            'What are the main health risks of excessive alcohol consumption?',
            'Which strategy is most effective for alcohol prevention?',
            'What is the primary goal of alcohol rehabilitation?',
            'Which factor influences alcohol addiction most?',
            'What is the recommended approach for alcohol treatment?'
        ],
        'addiction': [
            'What are the key components of addiction treatment?',
            'Which method is most effective for addiction prevention?',
            'What is the primary goal of addiction recovery?',
            'Which factor plays the biggest role in addiction development?',
            'What is the best approach for long-term addiction recovery?'
        ]
    };

    // Find matching templates or generate contextual ones
    let templates = null;
    for (const [key, templateList] of Object.entries(questionTemplates)) {
        if (topicLower.includes(key)) {
            templates = templateList;
            break;
        }
    }

    // If no specific templates found, generate contextual questions
    if (!templates) {
        const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
        const mainTopic = topicWords[0] || 'this topic';
        templates = [
            `What are the key aspects of ${mainTopic}?`,
            `Which approach is most effective for ${mainTopic}?`,
            `What is the primary goal of ${mainTopic}?`,
            `Which factor is most important in ${mainTopic}?`,
            `What is the best method for ${mainTopic}?`
        ];
    }
    
    for (let i = 0; i < totalQuestions; i++) {
        const questionText = templates[i % templates.length];
        // Generate realistic answer options
        const answerOptions = generateAnswerOptions(topic, questionText, i);
        
        const question = {
            id: `q_${i + 1}`,
            question: questionText,
            options: answerOptions,
            correctIndex: Math.floor(Math.random() * 4)
        };
        
        // Shuffle options
        const correctAnswer = question.options[question.correctIndex];
        const shuffledOptions = [...question.options];
        for (let j = shuffledOptions.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [shuffledOptions[j], shuffledOptions[k]] = [shuffledOptions[k], shuffledOptions[j]];
        }
        
        // Update correct index after shuffling
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        question.options = shuffledOptions;
        question.correctIndex = newCorrectIndex;
        
        questions.push(question);
    }
    
    console.log(`✅ Generated ${questions.length} local quiz questions`);
    return questions;
}

// Generate realistic answer options based on topic and question
function generateAnswerOptions(topic, questionText, questionIndex) {
    // Check if topic matches any predefined topics (case insensitive)
    const topicLower = topic.toLowerCase();
    
    const answerSets = {
        'javascript': [
            ['var, let, const', 'var only', 'let only', 'const only'],
            ['push()', 'add()', 'insert()', 'append()'],
            ['Current object', 'Global object', 'Parent object', 'Window object'],
            ['===', '==', '=', '!='],
            ['Enables strict mode', 'Disables strict mode', 'Creates variables', 'Deletes variables']
        ],
        'python': [
            ['[]', '{}', '()', 'set()'],
            ['def', 'function', 'func', 'define'],
            ['Lists are mutable, tuples are immutable', 'No difference', 'Tuples are mutable', 'Lists are immutable'],
            ['append()', 'add()', 'insert()', 'push()'],
            ['Runs code when script is executed directly', 'Imports modules', 'Defines functions', 'Creates classes']
        ],
        'react': [
            ['const Component = () => {}', 'function Component() {}', 'class Component {}', 'Component = () => {}'],
            ['useState', 'useEffect', 'useContext', 'useReducer'],
            ['Performs side effects', 'Manages state', 'Handles events', 'Renders components'],
            ['setState()', 'useState()', 'updateState()', 'changeState()'],
            ['Props are passed down, state is internal', 'No difference', 'State is passed down', 'Props are internal']
        ],
        'drug': [
            ['Prevention and education', 'Treatment and rehabilitation', 'Legal enforcement', 'Medical intervention'],
            ['Individual counseling', 'Group therapy', 'Family support', 'Community programs'],
            ['Physical health effects', 'Mental health impacts', 'Social consequences', 'Economic burden'],
            ['Early intervention', 'Rehabilitation programs', 'Support groups', 'Medical treatment'],
            ['Awareness campaigns', 'School programs', 'Community outreach', 'Media campaigns']
        ],
        'alcohol': [
            ['Liver damage', 'Heart problems', 'Brain effects', 'Digestive issues'],
            ['Moderation', 'Abstinence', 'Controlled drinking', 'Social drinking'],
            ['Family support', 'Professional treatment', 'Self-help groups', 'Medical intervention'],
            ['Prevention programs', 'Education campaigns', 'Policy changes', 'Community support'],
            ['Physical dependence', 'Psychological addiction', 'Social factors', 'Genetic predisposition']
        ],
        'addiction': [
            ['Biological factors', 'Psychological factors', 'Social factors', 'Environmental factors'],
            ['Detoxification', 'Rehabilitation', 'Counseling', 'Support groups'],
            ['Prevention', 'Early intervention', 'Treatment', 'Recovery support'],
            ['Individual therapy', 'Group therapy', 'Family therapy', 'Community programs'],
            ['Medical treatment', 'Behavioral therapy', 'Support groups', 'Lifestyle changes']
        ]
    };

    // Try to find matching topic
    let matchingAnswers = null;
    for (const [key, answers] of Object.entries(answerSets)) {
        if (topicLower.includes(key)) {
            matchingAnswers = answers;
            break;
        }
    }

    // If no specific topic found, generate contextual answers based on the topic
    if (!matchingAnswers) {
        const contextualAnswers = generateContextualAnswers(topic, questionText);
        return contextualAnswers;
    }

    return matchingAnswers[questionIndex % matchingAnswers.length];
}

// Generate contextual answers for any topic
function generateContextualAnswers(topic, questionText) {
    const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
    const baseAnswers = [
        [`Primary approach to ${topicWords[0] || 'this topic'}`, `Alternative method for ${topicWords[0] || 'this topic'}`, `Advanced technique in ${topicWords[0] || 'this topic'}`, `Traditional approach to ${topicWords[0] || 'this topic'}`],
        [`Basic concept of ${topicWords[0] || 'this subject'}`, `Intermediate level ${topicWords[0] || 'knowledge'}`, `Advanced understanding of ${topicWords[0] || 'this field'}`, `Expert level ${topicWords[0] || 'expertise'}`],
        [`First step in ${topicWords[0] || 'this process'}`, `Second phase of ${topicWords[0] || 'this method'}`, `Third stage in ${topicWords[0] || 'this approach'}`, `Final step of ${topicWords[0] || 'this procedure'}`],
        [`Direct approach to ${topicWords[0] || 'this issue'}`, `Indirect method for ${topicWords[0] || 'this problem'}`, `Combined approach to ${topicWords[0] || 'this challenge'}`, `Alternative solution for ${topicWords[0] || 'this situation'}`],
        [`Short-term solution`, `Long-term approach`, `Immediate action`, `Gradual process`]
    ];
    
    return baseAnswers[Math.floor(Math.random() * baseAnswers.length)];
}

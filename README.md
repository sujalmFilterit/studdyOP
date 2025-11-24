# AI-Powered Study Buddy

A complete full-stack web application that uses AI to generate personalized study schedules. Built with React, Node.js, Express.js, MongoDB, and DeepSeek AI via HuggingFace.

## 🚀 Features

### Core Features
- **AI-Powered Schedule Generation**: Uses DeepSeek AI model to create personalized study plans
- **User Authentication**: JWT-based login/signup system
- **Study Plan Management**: Create, view, and track study schedules
- **Progress Tracking**: Visual progress indicators and completion tracking
- **Task Management**: Mark tasks as complete/incomplete with real-time updates

### Advanced Features
- **Smart Fallback System**: If AI fails, generates intelligent fallback schedules
- **Interactive Schedule Display**: Beautiful cards showing daily study sessions
- **Progress Analytics**: Subject-wise and weekly progress tracking
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Shadcn/UI components with smooth animations

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** for components
- **Radix UI** for accessibility
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Axios** for HTTP requests
- **CORS** for cross-origin requests

### AI Integration
- **HuggingFace Inference API** for AI model access
- **DeepSeek-V3.1-Terminus** model for schedule generation
- **Fallback mechanism** for reliability

## 📁 Project Structure

```
studybuddy/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── StudyPlan.js
│   │   │   ├── Reminder.js
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── ai-schedule.routes.js
│   │   │   ├── plan.routes.js
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── ScheduleDisplay.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Scheduler.tsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── utils.ts
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- HuggingFace account with API token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studybuddy
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb://localhost:27017/studybuddy
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # HuggingFace Configuration
   HF_TOKEN=your-huggingface-token-here
   DEEPSEEK_MODEL=deepseek-ai/DeepSeek-V3.1-Terminus
   
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on http://localhost:4000

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `PUT /api/auth/profile` - Update user profile

### AI Schedule Generation
- `POST /api/schedule/generate-schedule` - Generate AI study schedule
- `GET /api/schedule/plans` - Get user's study plans
- `GET /api/schedule/plans/:id` - Get specific study plan
- `PATCH /api/schedule/plans/:id/schedule/:itemId` - Update task completion

### Study Plans
- `GET /api/plans` - Get all study plans
- `POST /api/plans` - Create new study plan
- `PUT /api/plans/:id` - Update study plan
- `DELETE /api/plans/:id` - Delete study plan

## 🤖 AI Integration

### How It Works

1. **User Input**: User provides study goal, subjects, deadline, and daily study time
2. **AI Processing**: Request sent to DeepSeek model via HuggingFace API
3. **Schedule Generation**: AI creates day-wise study schedule with specific topics
4. **Fallback System**: If AI fails, intelligent fallback generates schedule
5. **Database Storage**: Generated schedule saved to MongoDB
6. **Frontend Display**: Beautiful UI shows schedule with progress tracking

### AI Prompt Structure
```
You are an expert study planner. Generate a comprehensive day-wise study schedule.

User Input:
- Learning Goal: {goal}
- Subjects: {subjects}
- Deadline: {deadline}
- Daily Study Time: {dailyStudyTime} minutes

Rules:
- Break subjects into logical sequence from fundamentals to advanced
- Ensure complete coverage of important concepts
- Spread evenly until deadline
- Each day must have specific topics to cover
- Duration should equal daily study time

Output ONLY valid JSON with this exact structure:
{
  "schedule": [
    {
      "week": number,
      "day": "YYYY-MM-DD",
      "subject": "string",
      "focus": "string",
      "duration": number
    }
  ]
}
```

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: String (enum: ['user', 'admin']),
  avatar: String,
  streak: Number,
  xp: Number,
  level: Number,
  lastActiveDate: Date,
  studyRooms: [ObjectId]
}
```

### StudyPlan Model
```javascript
{
  user: ObjectId (ref: 'User'),
  goal: String,
  subjects: [String],
  deadline: Date,
  dailyStudyTime: Number,
  schedule: [{
    week: Number,
    day: String, // YYYY-MM-DD
    subject: String,
    focus: String,
    duration: Number,
    completed: Boolean
  }],
  generatedBy: String (enum: ['ai', 'fallback']),
  totalWeeks: Number,
  totalDays: Number
}
```

## 🎨 UI Components

### ScheduleDisplay Component
- **Overview Tab**: Progress charts and statistics
- **Schedule Tab**: Day-wise study sessions with completion tracking
- **Progress Tab**: Detailed analytics and charts

### Key Features
- Interactive task completion with checkboxes
- Real-time progress updates
- Subject-wise progress tracking
- Weekly progress visualization
- Responsive design for all devices

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Error handling with fallback mechanisms

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or Vercel

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📈 Performance Optimizations

- Lazy loading for components
- Efficient database queries
- Caching for AI responses
- Optimized bundle sizes
- Responsive image loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@studybuddy.com or create an issue in the repository.

---

**Built with ❤️ using React, Node.js, and AI**
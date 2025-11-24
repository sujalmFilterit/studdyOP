import mongoose from 'mongoose';

const scheduleItemSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    day: { type: String, required: true }, // YYYY-MM-DD format
    subject: { type: String, required: true },
    focus: { type: String, required: true },
    duration: { type: Number, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: true }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goal: { type: String, required: true },
    subjects: [{ type: String, required: true }],
    deadline: { type: Date, required: true },
    dailyStudyTime: { type: Number, required: true },
    schedule: [scheduleItemSchema],
    generatedBy: { type: String, enum: ['ai', 'fallback'], default: 'ai' },
    totalWeeks: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('StudyPlan', studyPlanSchema);



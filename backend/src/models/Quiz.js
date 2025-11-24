import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema(
  {
    quiz_id: { type: String, required: true, unique: true, index: true },
    room_id: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    total_questions: { type: Number, enum: [5, 10, 15, 20], required: true },
    quiz_data: { type: Object, required: true }, // array of questions
    approved: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);

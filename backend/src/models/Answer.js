import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema(
  {
    participant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    quiz_id: { type: String, required: true, index: true },
    question_id: { type: String, required: true },
    selected_option: { type: Number, required: true },
    is_correct: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: "answered_at", updatedAt: false } }
);

export default mongoose.models.Answer || mongoose.model("Answer", AnswerSchema);

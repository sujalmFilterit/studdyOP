import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema(
  {
    room_id: { type: String, required: true, index: true },
    nickname: { type: String, required: true },
    email: { type: String, required: true },
    score: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "joined_at", updatedAt: false } }
);

export default mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);

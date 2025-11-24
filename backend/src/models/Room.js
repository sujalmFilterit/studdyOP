import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    room_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    status: { type: String, enum: ["active", "ended"], default: "active" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);

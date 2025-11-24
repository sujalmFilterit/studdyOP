import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    delivered: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Reminder', reminderSchema);



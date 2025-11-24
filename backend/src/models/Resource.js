import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['video', 'article', 'book', 'course'], required: true },
    url: { type: String, required: true },
    description: { type: String, default: '' },
    recommendedByAI: { type: Boolean, default: true },
    rating: { type: Number, min: 1, max: 5, default: 0 },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Resource', resourceSchema);

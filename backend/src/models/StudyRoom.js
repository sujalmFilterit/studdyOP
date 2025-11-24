import mongoose from 'mongoose';

const studyRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
    inviteCode: { type: String, unique: true },
    sharedPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' }]
  },
  { timestamps: true }
);

studyRoomSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

export default mongoose.model('StudyRoom', studyRoomSchema);

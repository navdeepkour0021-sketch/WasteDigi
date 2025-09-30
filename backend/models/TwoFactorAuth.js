import mongoose from 'mongoose';

const twoFactorAuthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['login', 'enable_2fa', 'disable_2fa'],
    required: true
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired codes
twoFactorAuthSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
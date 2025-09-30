import mongoose from 'mongoose';

const wasteSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Please add item name'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Please add unit']
  },
  reason: {
    type: String,
    required: [true, 'Please add waste reason'],
    enum: ['expired', 'spoiled', 'damaged', 'overstock', 'preparation_waste', 'customer_return', 'other']
  },
  photoUrl: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
wasteSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Waste', wasteSchema);
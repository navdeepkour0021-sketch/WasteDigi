import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an item name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Please add unit'],
    enum: ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'pcs', 'boxes']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add expiry date']
  },
  category: {
    type: String,
    required: [true, 'Please add category'],
    enum: ['vegetables', 'fruits', 'meat', 'dairy', 'grains', 'beverages', 'spices', 'other']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'consumed'],
    default: 'active'
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
inventorySchema.index({ user: 1, status: 1 });
inventorySchema.index({ expiryDate: 1 });

export default mongoose.model('Inventory', inventorySchema);
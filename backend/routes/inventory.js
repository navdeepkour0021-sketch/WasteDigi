import express from 'express';
import Inventory from '../models/Inventory.js';
import { protect, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
router.get('/', requirePermission('inventory:read'), async (req, res) => {
  try {
    let query = {};
    
    // If user is admin and requests all data, don't filter by user
    if (req.user.role === 'admin' && req.query.all === 'true') {
      // Admin can see all inventory items
      query = {};
    } else {
      // Regular users and managers see only their own data
      query = { user: req.user._id };
    }
    
    const inventory = await Inventory.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add inventory item
// @route   POST /api/inventory
// @access  Private
router.post('/', requirePermission('inventory:write'), async (req, res) => {
  try {
    const { name, quantity, unit, expiryDate, category } = req.body;

    // Validation
    if (!name || !quantity || !unit || !expiryDate || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const inventoryItem = await Inventory.create({
      name,
      quantity,
      unit,
      expiryDate,
      category,
      user: req.user._id,
    });

    res.status(201).json(inventoryItem);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update inventory item status
// @route   PUT /api/inventory/:id
// @access  Private
router.put('/:id', requirePermission('inventory:write'), async (req, res) => {
  try {
    const { status, quantity } = req.body;

    const inventoryItem = await Inventory.findById(req.params.id);

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Make sure user owns inventory item
    if (inventoryItem.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(quantity !== undefined && { quantity }) },
      { new: true }
    );

    res.json(updatedItem);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
router.delete('/:id', requirePermission('inventory:delete'), async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Make sure user owns inventory item
    if (inventoryItem.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get expiring items (within 3 days)
// @route   GET /api/inventory/alerts
// @access  Private
router.get('/alerts', requirePermission('inventory:read'), async (req, res) => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringItems = await Inventory.find({
      user: req.user._id,
      status: 'active',
      expiryDate: { $lte: threeDaysFromNow }
    }).sort({ expiryDate: 1 });

    res.json(expiringItems);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
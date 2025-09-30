import express from 'express';
import Waste from '../models/Waste.js';
import { protect, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @desc    Get all waste logs
// @route   GET /api/waste
// @access  Private
router.get('/', requirePermission('waste:read'), async (req, res) => {
  try {
    const wasteLogs = await Waste.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(wasteLogs);
  } catch (error) {
    console.error('Get waste logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add waste log entry
// @route   POST /api/waste
// @access  Private
router.post('/', requirePermission('waste:write'), async (req, res) => {
  try {
    const { itemName, quantity, unit, reason, photoUrl, notes } = req.body;

    // Validation
    if (!itemName || !quantity || !unit || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const wasteLog = await Waste.create({
      itemName,
      quantity,
      unit,
      reason,
      photoUrl: photoUrl || '',
      notes: notes || '',
      user: req.user._id,
    });

    res.status(201).json(wasteLog);
  } catch (error) {
    console.error('Add waste log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete waste log entry
// @route   DELETE /api/waste/:id
// @access  Private
router.delete('/:id', requirePermission('waste:delete'), async (req, res) => {
  try {
    const wasteLog = await Waste.findById(req.params.id);

    if (!wasteLog) {
      return res.status(404).json({ message: 'Waste log not found' });
    }

    // Make sure user owns waste log
    if (wasteLog.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Waste.findByIdAndDelete(req.params.id);
    res.json({ message: 'Waste log removed' });
  } catch (error) {
    console.error('Delete waste log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
import express from 'express';
import { protect, requirePermission } from '../middleware/auth.js';
import { getWasteReductionSuggestions, analyzeExpiryPatterns, searchAIKnowledgeBase } from '../services/aiService.js';
import Inventory from '../models/Inventory.js';
import Waste from '../models/Waste.js';

const router = express.Router();

// Apply auth middleware
router.use(protect);

// @desc Search AI knowledge base
router.post('/search', requirePermission('analytics:read'), async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const [inventoryItems, wasteLogs] = await Promise.all([
      Inventory.find({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 }).limit(10),
      Waste.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5)
    ]);

    const results = await searchAIKnowledgeBase(query, inventoryItems, wasteLogs);

    res.json({
      query,
      results,
      hasData: inventoryItems.length > 0 || wasteLogs.length > 0
    });
  } catch (error) {
    console.error('AI search error:', error);
    res.status(error.status || 500).json({ message: error.message });
  }
});

// @desc Get AI waste reduction suggestions
router.get('/suggestions', requirePermission('analytics:read'), async (req, res) => {
  try {
    const [inventoryItems, wasteLogs] = await Promise.all([
      Inventory.find({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 }).limit(20),
      Waste.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    if (inventoryItems.length === 0 && wasteLogs.length === 0) {
      return res.json({
        suggestions: 'Add some inventory items and waste logs to get personalized AI suggestions for reducing food waste.',
        hasData: false
      });
    }

    const suggestions = await getWasteReductionSuggestions(inventoryItems, wasteLogs);

    res.json({
      suggestions,
      hasData: true,
      dataPoints: {
        inventoryItems: inventoryItems.length,
        wasteLogs: wasteLogs.length
      }
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(error.status || 500).json({ message: error.message });
  }
});

// @desc Get AI expiry pattern analysis
router.get('/expiry-analysis', requirePermission('analytics:read'), async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({
      user: req.user._id,
      status: { $in: ['active', 'expired'] }
    }).sort({ expiryDate: 1 });

    if (inventoryItems.length === 0) {
      return res.json({
        analysis: 'Add inventory items with expiry dates to get AI-powered expiry pattern analysis.',
        hasData: false
      });
    }

    const analysis = await analyzeExpiryPatterns(inventoryItems);

    res.json({
      analysis,
      hasData: true,
      itemCount: inventoryItems.length
    });
  } catch (error) {
    console.error('AI expiry analysis error:', error);
    res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;

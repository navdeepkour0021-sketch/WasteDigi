import express from 'express';
import User from '../models/User.js';
import { protect, requirePermission } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Middleware to check role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Insufficient role permissions',
          required: allowedRoles,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Role check failed' });
    }
  };
};

// Apply auth middleware to all routes
router.use(protect);

// @desc    Create new user
// @route   POST /api/users
// @access  Private (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate role
    const validRoles = ['user', 'manager', 'admin'];
    const userRole = role || 'user';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by the pre-save middleware
      role: userRole,
      permissions: permissions || []
    });

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (requires users:read permission)
router.get('/', requirePermission('users:read'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get available permissions
// @route   GET /api/users/permissions
// @access  Private (admin only)
router.get('/permissions', requireRole('admin'), async (req, res) => {
  try {
    const availablePermissions = [
      { value: 'inventory:read', label: 'View Inventory' },
      { value: 'inventory:write', label: 'Add/Edit Inventory' },
      { value: 'inventory:delete', label: 'Delete Inventory' },
      { value: 'waste:read', label: 'View Waste Logs' },
      { value: 'waste:write', label: 'Add/Edit Waste Logs' },
      { value: 'waste:delete', label: 'Delete Waste Logs' },
      { value: 'users:read', label: 'View Users' },
      { value: 'users:write', label: 'Manage Users' },
      { value: 'users:delete', label: 'Delete Users' },
      { value: 'analytics:read', label: 'View Analytics' },
      { value: 'settings:write', label: 'Manage Settings' }
    ];
    
    res.json(availablePermissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user role and permissions
// @route   PUT /api/users/:id/role
// @access  Private (admin only)
router.put('/:id/role', requireRole('admin'), async (req, res) => {
  try {
    const { role, permissions } = req.body;

    const validRoles = ['user', 'manager', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own admin role' });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
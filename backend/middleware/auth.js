import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password').populate('permissions');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to require permission
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check role-based permissions
      const rolePermissions = {
        user: [
          'inventory:read',
          'inventory:write',
          'waste:read',
          'waste:write'
        ],
        manager: [
          'inventory:read',
          'inventory:write',
          'inventory:delete',
          'waste:read',
          'waste:write',
          'waste:delete',
          'analytics:read',
          'users:read'
        ],
        admin: [
          'inventory:read',
          'inventory:write',
          'inventory:delete',
          'waste:read',
          'waste:write',
          'waste:delete',
          'analytics:read',
          'users:read',
          'users:write',
          'users:delete',
          'settings:write'
        ]
      };

      const userRolePermissions = rolePermissions[user.role] || [];
      const hasRolePermission = userRolePermissions.includes(permission);
      const hasCustomPermission = user.permissions && user.permissions.includes(permission);

      if (!hasRolePermission && !hasCustomPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: permission,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
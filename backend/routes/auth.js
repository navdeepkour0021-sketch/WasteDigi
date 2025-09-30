import express from 'express';
import User from '../models/User.js';
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import { generateToken, protect } from '../middleware/auth.js';
import { sendTwoFactorCode } from '../services/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// Generate 6-digit code
const generateTwoFactorCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          // Generate and send 2FA code
          const code = generateTwoFactorCode();
          
          await TwoFactorAuth.create({
            user: user._id,
            code,
            type: 'login'
          });

          await sendTwoFactorCode(user.email, code, 'login');

          return res.json({
            requiresTwoFactor: true,
            message: 'Two-factor authentication code sent to your email'
          });
        } else {
          // Verify 2FA code
          const twoFactorRecord = await TwoFactorAuth.findOne({
            user: user._id,
            code: twoFactorCode,
            type: 'login',
            isUsed: false,
            expiresAt: { $gt: new Date() }
          });

          if (!twoFactorRecord) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
          }

          // Mark code as used
          twoFactorRecord.isUsed = true;
          await twoFactorRecord.save();
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        twoFactorEnabled: user.twoFactorEnabled,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Enable two-factor authentication
// @route   POST /api/auth/enable-2fa
// @access  Private
router.post('/enable-2fa', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      // Generate and send 2FA code
      const twoFactorCode = generateTwoFactorCode();
      
      await TwoFactorAuth.create({
        user: req.user._id,
        code: twoFactorCode,
        type: 'enable_2fa'
      });

      await sendTwoFactorCode(req.user.email, twoFactorCode, 'enable_2fa');

      return res.json({
        message: 'Verification code sent to your email'
      });
    }

    // Verify code and enable 2FA
    const twoFactorRecord = await TwoFactorAuth.findOne({
      user: req.user._id,
      code,
      type: 'enable_2fa',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!twoFactorRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Enable 2FA for user
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });
    
    // Mark code as used
    twoFactorRecord.isUsed = true;
    await twoFactorRecord.save();

    res.json({ message: 'Two-factor authentication enabled successfully' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Disable two-factor authentication
// @route   POST /api/auth/disable-2fa
// @access  Private
router.post('/disable-2fa', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      // Generate and send 2FA code
      const twoFactorCode = generateTwoFactorCode();
      
      await TwoFactorAuth.create({
        user: req.user._id,
        code: twoFactorCode,
        type: 'disable_2fa'
      });

      await sendTwoFactorCode(req.user.email, twoFactorCode, 'disable_2fa');

      return res.json({
        message: 'Verification code sent to your email'
      });
    }

    // Verify code and disable 2FA
    const twoFactorRecord = await TwoFactorAuth.findOne({
      user: req.user._id,
      code,
      type: 'disable_2fa',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!twoFactorRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Disable 2FA for user
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: false });
    
    // Mark code as used
    twoFactorRecord.isUsed = true;
    await twoFactorRecord.save();

    res.json({ message: 'Two-factor authentication disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
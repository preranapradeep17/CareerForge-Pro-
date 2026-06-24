const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── GET /api/protected/me ───────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// ─── PUT /api/protected/update-password ──────────────────────────────────────
router.put('/update-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

// ─── PUT /api/protected/update-profile ───────────────────────────────────────
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, email, profilePhoto } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Email is already taken by another account' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name.trim();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        planStatus: user.planStatus,
        resumeCount: user.resumeCount,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// ─── DELETE /api/protected/delete-account ────────────────────────────────────
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Delete all versions associated with the user's resumes
    const userResumes = await Resume.find({ user: user._id });
    const resumeIds = userResumes.map(r => r._id);
    
    await ResumeVersion.deleteMany({ resume: { $in: resumeIds } });

    // 2. Delete all user's resumes
    await Resume.deleteMany({ user: user._id });

    // 3. Delete user account
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({ message: 'Account and associated data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

module.exports = router;

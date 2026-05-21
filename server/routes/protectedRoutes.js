const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

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

module.exports = router;

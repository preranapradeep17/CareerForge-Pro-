const User = require('../models/User');

/**
 * Middleware to restrict endpoints to Pro plan subscribers.
 */
const requirePro = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: user context missing' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan !== 'pro') {
      return res.status(403).json({
        message: 'This is a premium feature. Please upgrade to CareerForge Pro to unlock access.',
        upgradeRequired: true,
      });
    }

    // Attach full user details to request object to avoid querying again in the route
    req.userFull = user;
    return next();
  } catch (error) {
    console.error('[Gating Middleware] Error occurred:', error.message);
    return res.status(500).json({ message: 'Internal server error checking subscription status' });
  }
};

module.exports = { requirePro };

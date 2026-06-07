const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── POST /api/payments/create-checkout-session ──────────────────────────────
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan === 'pro') {
      return res.status(400).json({ message: 'You are already subscribed to the Pro plan' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Create a Checkout Session with inline subscription pricing details
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CareerForge Pro',
              description: 'Unlimited resumes, A4 PDF exports, cover letters, and full AI optimization features.',
            },
            unit_amount: 1200, // $12.00 USD
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${clientUrl}/dashboard?payment=success`,
      cancel_url: `${clientUrl}/dashboard?payment=cancel`,
      customer_email: user.email,
      client_reference_id: user.id,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Checkout Session creation failed:', error.message);
    return res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.');
    error.statusCode = 500;
    throw error;
  }

  return Stripe(process.env.STRIPE_SECRET_KEY);
};

const normalizeClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const buildProLineItem = () => {
  if (process.env.STRIPE_PRO_PRICE_ID) {
    return {
      price: process.env.STRIPE_PRO_PRICE_ID,
      quantity: 1,
    };
  }

  return {
    price_data: {
      currency: process.env.STRIPE_PRO_CURRENCY || 'usd',
      product_data: {
        name: 'CareerForge Pro',
        description: 'Unlimited resumes, A4 PDF exports, cover letters, and full AI optimization features.',
      },
      unit_amount: Number(process.env.STRIPE_PRO_AMOUNT_CENTS || 1200),
      recurring: {
        interval: process.env.STRIPE_PRO_INTERVAL || 'month',
      },
    },
    quantity: 1,
  };
};

const ensureStripeCustomer = async (stripe, user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
    },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
};

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

    const clientUrl = normalizeClientUrl();

    // Check if Stripe key is placeholder
    const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder');
    if (isMock) {
      console.log('[Stripe Simulation] Mocking checkout session for user:', user.email);
      user.plan = 'pro';
      user.planStatus = 'active';
      user.planCurrentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await user.save();

      return res.status(200).json({
        id: 'mock_session_id',
        url: `${clientUrl}/dashboard?payment=success&session_id=mock_session_id`
      });
    }

    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(stripe, user);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [buildProLineItem()],
      mode: 'subscription',
      success_url: `${clientUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/dashboard?payment=cancel`,
      customer: customerId,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan: 'pro',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: 'pro',
        },
      },
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe] Checkout Session creation failed:', error.message);
    return res.status(error.statusCode || 500).json({ message: 'Failed to create checkout session. Please check your Stripe configurations.', error: error.message });
  }
});

router.post('/billing-portal', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if Stripe key is placeholder
    const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder');
    if (isMock) {
      console.log('[Stripe Simulation] Mocking billing portal session for user:', user.email);
      return res.status(200).json({
        url: `${normalizeClientUrl()}/settings?billing=mock`
      });
    }

    const stripe = getStripe();
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe billing profile found for this account' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${normalizeClientUrl()}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Billing Portal creation failed:', error.message);
    return res.status(error.statusCode || 500).json({ message: 'Failed to open billing portal', error: error.message });
  }
});

module.exports = router;

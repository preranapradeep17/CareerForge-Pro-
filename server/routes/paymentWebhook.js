const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Signature Verification Failed: ${err.message}`);
  }

  // Handle successful checkout session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (userId) {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          { plan: 'pro' },
          { new: true }
        );
        if (user) {
          console.log(`[Stripe Webhook] User ${user.email} (ID: ${userId}) successfully upgraded to Pro.`);
        } else {
          console.error(`[Stripe Webhook] User ID ${userId} not found in database.`);
        }
      } catch (dbErr) {
        console.error('[Stripe Webhook] Database update failed:', dbErr.message);
        return res.status(500).send('Internal Server Error updating database');
      }
    } else {
      console.warn('[Stripe Webhook] No client_reference_id found in session.');
    }
  }

  return res.status(200).json({ received: true });
};

module.exports = handleWebhook;

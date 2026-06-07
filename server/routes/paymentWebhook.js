const User = require('../models/User');
const Stripe = require('stripe');

const PRO_STATUSES = new Set(['active', 'trialing']);

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return Stripe(process.env.STRIPE_SECRET_KEY);
};

const getStripeId = (value) => {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : value.id;
};

const getCurrentPeriodEnd = (subscription) => {
  const currentPeriodEnd = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;

  if (!currentPeriodEnd) {
    return null;
  }

  return new Date(currentPeriodEnd * 1000);
};

const findUserForSubscription = async (subscription, fallbackUserId) => {
  const metadataUserId = subscription.metadata?.userId;
  const customerId = getStripeId(subscription.customer);
  const subscriptionId = subscription.id;

  if (fallbackUserId || metadataUserId) {
    return User.findById(fallbackUserId || metadataUserId);
  }

  return User.findOne({
    $or: [
      { stripeSubscriptionId: subscriptionId },
      { stripeCustomerId: customerId },
    ],
  });
};

const syncUserSubscription = async (subscription, fallbackUserId = '') => {
  const user = await findUserForSubscription(subscription, fallbackUserId);

  if (!user) {
    console.error(`[Stripe Webhook] User not found for subscription ${subscription.id}.`);
    return null;
  }

  const status = subscription.status || 'inactive';
  const customerId = getStripeId(subscription.customer);
  const priceId = subscription.items?.data?.[0]?.price?.id || user.stripePriceId || '';

  user.plan = PRO_STATUSES.has(status) ? 'pro' : 'free';
  user.planStatus = status;
  user.planCurrentPeriodEnd = getCurrentPeriodEnd(subscription);
  user.stripeCustomerId = customerId;
  user.stripeSubscriptionId = subscription.id;
  user.stripePriceId = priceId;

  await user.save();

  console.log(`[Stripe Webhook] Synced ${user.email} to ${user.plan} (${status}).`);
  return user;
};

const handleCheckoutCompleted = async (stripe, session) => {
  const userId = session.client_reference_id || session.metadata?.userId;
  const subscriptionId = getStripeId(session.subscription);

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncUserSubscription(subscription, userId);
    return;
  }

  if (!userId) {
    console.warn('[Stripe Webhook] Checkout completed without a user reference.');
    return;
  }

  await User.findByIdAndUpdate(userId, {
    plan: 'pro',
    planStatus: 'active',
    stripeCustomerId: getStripeId(session.customer),
  });
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured.');
    return res.status(500).send('Stripe webhook secret is not configured');
  }

  let event;
  let stripe;

  try {
    stripe = getStripe();
  } catch (err) {
    console.error('[Stripe Webhook] Configuration failed:', err.message);
    return res.status(500).send('Stripe is not configured');
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Signature Verification Failed: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripe, event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncUserSubscription(event.data.object);
        break;
      case 'invoice.payment_failed':
        console.warn(`[Stripe Webhook] Payment failed for invoice ${event.data.object.id}.`);
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (dbErr) {
    console.error('[Stripe Webhook] Database sync failed:', dbErr.message);
    return res.status(500).send('Internal Server Error syncing subscription');
  }

  return res.status(200).json({ received: true });
};

module.exports = handleWebhook;

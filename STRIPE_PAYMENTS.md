# Stripe Payments — CareerForge Pro

CareerForge Pro uses **Stripe Checkout** for upgrades and **Stripe Webhooks** to keep MongoDB in sync with real-time subscription state.

---

## Payment Pipeline

```
User clicks "Upgrade to Pro"
         ↓
Client calls POST /api/payments/create-checkout-session
         ↓
Backend creates/reuses Stripe Customer → opens Checkout
         ↓
User completes payment (Stripe-hosted page)
         ↓
Stripe redirects to /dashboard?payment=success
         ↓
Client polls /api/protected/me until plan === "pro"
         ↓
Stripe sends webhook to POST /api/payments/webhook
         ↓
MongoDB updates: plan, planStatus, stripeSubscriptionId,
                 stripeCustomerId, stripePriceId, planCurrentPeriodEnd
```

---

## Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Activates Pro after successful Checkout |
| `customer.subscription.created` | Syncs new subscription state |
| `customer.subscription.updated` | Keeps plan status current (e.g. after billing cycle) |
| `customer.subscription.deleted` | Downgrades account to Starter (plan: "free") |
| `invoice.payment_failed` | Logs the failure for follow-up |

---

## Step-by-Step Setup Guide

### 1. Create a Stripe Account

Go to [https://dashboard.stripe.com](https://dashboard.stripe.com) and sign up (free).

### 2. Get Your Secret Key

1. Dashboard → **Developers** → **API Keys**
2. Copy the **Secret key** (starts with `sk_test_...` for test mode)
3. Paste it into `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

### 3. Create a Product & Price

1. Dashboard → **Products** → **Add Product**
2. Set name: `CareerForge Pro`
3. Set pricing: **$12.00 / month** (recurring)
4. Click **Save Product**
5. Copy the **Price ID** (starts with `price_...`)
6. Paste it into `server/.env`:
   ```
   STRIPE_PRO_PRICE_ID=price_your_price_id
   ```

### 4. Install the Stripe CLI (for local webhook testing)

```bash
# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

### 5. Start Local Webhook Forwarding

In a **separate terminal**, run:
```bash
stripe listen --forward-to localhost:5001/api/payments/webhook
```

This outputs a webhook signing secret like:
```
> Ready! Your webhook signing secret is whsec_abc123...
```

Copy it into `server/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

### 6. Start the Server

```bash
cd server
npm run dev
```

### 7. Test a Payment

1. Click **Upgrade to Pro** in the app
2. Stripe Checkout opens
3. Use test card: **4242 4242 4242 4242** (any future expiry, any CVV)
4. Complete payment
5. App redirects to `/dashboard?payment=success`
6. Profile refresh loop activates Pro access within ~3 seconds
7. Webhook confirms via MongoDB update

---

## Test Cards

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | ✅ Payment succeeds |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0025 0000 3155` | 🔐 Requires authentication (3DS) |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

Use any future expiry date (e.g. `12/34`) and any 3-digit CVV.

---

## Required Environment Variables

### `server/.env`

```bash
# Stripe API key (test or live)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Webhook signing secret (from stripe listen or Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Monthly Pro price ID from your Stripe Product
STRIPE_PRO_PRICE_ID=price_your_monthly_pro_price_id

# Fallback if STRIPE_PRO_PRICE_ID is not set (creates inline price_data)
STRIPE_PRO_AMOUNT_CENTS=1200
STRIPE_PRO_CURRENCY=usd
STRIPE_PRO_INTERVAL=month

# Redirects after checkout (must match your running client URL)
CLIENT_URL=http://localhost:5173
```

### `client/.env` (optional)

```bash
VITE_API_BASE_URL=http://localhost:5001/api
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-checkout-session` | JWT | Creates Stripe Checkout session |
| POST | `/api/payments/billing-portal` | JWT | Opens Stripe Customer Portal |
| POST | `/api/payments/webhook` | Stripe Signature | Receives Stripe webhook events |

> ⚠️ The webhook endpoint uses `express.raw()` — it must be mounted **before** `express.json()` in `server/index.js`. This is already correctly configured.

---

## Going to Production

1. Switch to **live mode** in Stripe Dashboard
2. Replace `sk_test_...` with `sk_live_...` in your production env
3. Create a real webhook endpoint in Dashboard → **Webhooks** → **Add Endpoint**
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. Copy the live `whsec_...` signing secret to your production env
5. Enable **Stripe Customer Portal** in Dashboard → Settings → **Billing** → Customer Portal

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Stripe is not configured" | `STRIPE_SECRET_KEY` is missing or still a placeholder in `.env` |
| Webhook signature fails (400) | `STRIPE_WEBHOOK_SECRET` doesn't match — re-copy from `stripe listen` output |
| Plan doesn't update after payment | Webhook isn't reaching the server — check `stripe listen` is running |
| "You are already subscribed" | User already has `plan: "pro"` in MongoDB — check the database |
| Checkout session fails | Make sure `STRIPE_PRO_PRICE_ID` exists in your Stripe dashboard |
| Billing portal fails | User has no Stripe Customer ID — must complete a checkout first |

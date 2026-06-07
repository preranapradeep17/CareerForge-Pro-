const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables before requiring route handlers
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentWebhook = require('./routes/paymentWebhook');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Stripe Webhook requires raw payload. Mount BEFORE express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentWebhook);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'CareerForge Pro API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'CareerForge Pro API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

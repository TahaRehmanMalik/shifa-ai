require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/db');
const { getActiveProviderName } = require('./services/aiService');
const searchRoutes = require('./routes/searchRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const authRoutes = require('./routes/authRoutes');
const triageRoutes = require('./routes/triageRoutes');

const app = express();
const PORT = process.env.PORT || 4000;
const TRIAGE_ENABLED = String(process.env.TRIAGE_ENABLED ?? 'true').trim().toLowerCase() !== 'false';

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    aiProvider: getActiveProviderName(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', conversationRoutes);
if (TRIAGE_ENABLED) {
  app.use('/api', triageRoutes);
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  try {
    await testConnection();
    console.log('MySQL connection established.');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Shifa AI backend running on port ${PORT}`);
    console.log(`Active AI provider: ${getActiveProviderName()}`);
  });
}

start();

module.exports = app;

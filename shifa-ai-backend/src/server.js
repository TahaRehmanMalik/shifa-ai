require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { getActiveProviderName } = require('./services/aiService');
const searchRoutes = require('./routes/searchRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    aiProvider: getActiveProviderName(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', searchRoutes);
app.use('/api', conversationRoutes);

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

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from API!' });
});

app.get('/api/db-health', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT 1 as result');
    res.json({ status: 'ok', message: 'Database connection successful', data: rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});


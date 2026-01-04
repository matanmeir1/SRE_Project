const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const authMiddleware = require('./middleware/auth');
const logger = require('./logger');
const { register, metricsMiddleware } = require('./metrics');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for x-forwarded-for header
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// Metrics middleware (must be before routes)
app.use(metricsMiddleware);

// Helper function to extract IP address
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
};

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

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Invalid email format' });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
    }

    // Find user by email
    const [users] = await db.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user has a password hash
    if (!user.password_hash) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Generate token
    const token = uuidv4();

    // Store token in database
    await db.execute(
      'UPDATE users SET token = ? WHERE id = ?',
      [token, user.id]
    );

    // Log successful login
    logger.info({
      timestamp: new Date().toISOString(),
      userId: user.id,
      action: 'login',
      ip: getClientIp(req)
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Login failed', error: error.message });
  }
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email
  });
});

// Prometheus metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});


const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const ordersRoutes = require('./routes/orders');
const financesRoutes = require('./routes/finances');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'dolphin-secret-key-2024';

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CORS_ORIGIN,
].filter(Boolean);

// In production, allow all origins (Render doesn't have a fixed domain in blueprint)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? true : allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 401, data: null, message: '未登录或token已过期' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, data: null, message: 'token无效或已过期' });
    }
    req.user = user;
    next();
  });
}

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/accounts', authenticateToken, accountsRoutes);
app.use('/api/orders', authenticateToken, ordersRoutes);
app.use('/api/finances', authenticateToken, financesRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ code: 500, data: null, message: err.message || '服务器内部错误' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ code: 404, data: null, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`海豚数字营销平台服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
module.exports.JWT_SECRET = JWT_SECRET;
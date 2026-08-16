const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = 'dolphin-secret-key-2024';

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 400, data: null, message: '邮箱和密码不能为空' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ code: 400, data: null, message: '该邮箱已注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO users (username, email, password, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username || email.split('@')[0], email, hashedPassword, username || email.split('@')[0], now, now);

    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          email,
          username: username || email.split('@')[0],
          display_name: username || email.split('@')[0]
        }
      },
      message: '注册成功'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ code: 500, data: null, message: '注册失败' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 400, data: null, message: '邮箱和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ code: 400, data: null, message: '用户不存在' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ code: 400, data: null, message: '密码错误' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar
        }
      },
      message: '登录成功'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ code: 500, data: null, message: '登录失败' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ code: 401, data: null, message: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, display_name, avatar, created_at FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }

    res.json({ code: 200, data: user, message: 'success' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({ code: 403, data: null, message: 'token无效或已过期' });
    }
    console.error('Get me error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取用户信息失败' });
  }
});

module.exports = router;
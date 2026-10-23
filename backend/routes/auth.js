
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getDbPool } from '../config/db.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };
}

router.post('/register', async (req, res) => {
  try {
    const fullName = typeof req.body.fullName === 'string'
      ? req.body.fullName.trim()
      : '';
    const email = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = req.body.password;

    if (
      fullName.length < 2 ||
      fullName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof password !== 'string' ||
      password.length < 12 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error: 'Provide a valid name, email, and password of 12–72 characters',
      });
    }

    const pool = getDbPool();
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (existing.length) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'student')`,
      [fullName, email, passwordHash],
    );

    return res.status(201).json({
      user: {
        id: result.insertId,
        fullName,
        email,
        role: 'student',
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    console.error('Registration failed:', error.message);
    return res.status(500).json({
      error: 'Unable to register account',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = req.body.password;

    if (!email || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const pool = getDbPool();
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, role
       FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    const user = rows[0];
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Rotate the session ID after authentication.
    req.session.regenerate((error) => {
      if (error) {
        console.error('Session regeneration failed:', error.message);
        return res.status(500).json({ error: 'Unable to log in' });
      }

      req.session.user = publicUser(user);

      req.session.save((saveError) => {
        if (saveError) {
          console.error('Session save failed:', saveError.message);
          return res.status(500).json({ error: 'Unable to log in' });
        }

        return res.json({ user: req.session.user });
      });
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ error: 'Unable to log in' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({
      error: 'Not logged in',
    });
  }

  return res.json({ user: req.session.user });
});

router.post('/logout', (req, res, next) => {
  if (!req.session) {
    return res.sendStatus(204);
  }

  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('campusfix.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return res.sendStatus(204);
  });
});

export default router;

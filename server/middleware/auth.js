import jwt from 'jsonwebtoken';
import { getDb } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'repo2star-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const decoded = verifyToken(header.slice(7));
    const db = getDb();
    const user = db.prepare('SELECT id, github_id, login, name, avatar_url FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(header.slice(7));
      const db = getDb();
      req.user = db.prepare('SELECT id, github_id, login, name, avatar_url FROM users WHERE id = ?').get(decoded.userId);
    } catch {}
  }
  next();
}

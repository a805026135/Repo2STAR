import { Router } from 'express';
import { createToken } from '../middleware/auth.js';
import { getDb } from '../db/schema.js';
import { GitHubService } from '../services/github.js';

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
console.log('[Auth] GITHUB_CLIENT_ID:', GITHUB_CLIENT_ID);
console.log('[Auth] GITHUB_CLIENT_SECRET:', GITHUB_CLIENT_SECRET ? 'loaded' : 'MISSING');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// FR-1.1: GitHub OAuth initiation
router.get('/github', (_req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo read:user',
    redirect_uri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// OAuth callback
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code parameter' });

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    // Get user info
    const github = new GitHubService(tokenData.access_token);
    const ghUser = await github.getUser();

    // Upsert user
    const db = getDb();
    db.prepare(`
      INSERT INTO users (github_id, login, name, avatar_url, access_token)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(github_id) DO UPDATE SET
        login = excluded.login, name = excluded.name,
        avatar_url = excluded.avatar_url, access_token = excluded.access_token,
        updated_at = CURRENT_TIMESTAMP
    `).run(ghUser.id, ghUser.login, ghUser.name, ghUser.avatar_url, tokenData.access_token);

    const user = db.prepare('SELECT id FROM users WHERE github_id = ?').get(ghUser.id);
    const jwt = createToken(user.id);

    res.redirect(`${FRONTEND_URL}?token=${jwt}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { verifyToken } = await import('../middleware/auth.js');
    const decoded = verifyToken(header.slice(7));
    const db = getDb();
    const user = db.prepare('SELECT id, github_id, login, name, avatar_url FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/schema.js';

const router = Router();
router.use(authMiddleware);

const SENSITIVE_KEYS = new Set(['notion_api_key', 'feishu_webhook_url', 'api_key']);

// Get all settings
router.get('/', (req, res) => {
  const db = getDb();
  const settings = db.prepare(
    'SELECT key, value FROM user_settings WHERE user_id = ?'
  ).all(req.user.id);

  const result = {};
  for (const s of settings) {
    result[s.key] = SENSITIVE_KEYS.has(s.key) && s.value
      ? s.value.substring(0, 4) + '****'
      : s.value;
  }
  res.json(result);
});

// Update settings (upsert)
router.put('/', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'Key is required' });

  const db = getDb();
  db.prepare(`
    INSERT INTO user_settings (user_id, key, value)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `).run(req.user.id, key, value, value);

  res.json({ success: true, key });
});

// Delete a setting
router.delete('/:key', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM user_settings WHERE user_id = ? AND key = ?')
    .run(req.user.id, req.params.key);
  res.json({ success: true });
});

// Get raw setting value (for internal use by other routes)
export function getSetting(userId, key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM user_settings WHERE user_id = ? AND key = ?')
    .get(userId, key);
  return row?.value || null;
}

export default router;

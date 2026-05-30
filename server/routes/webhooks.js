import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/schema.js';

const router = Router();
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'repo2star-webhook-secret';

// FR-2.1: GitHub webhook endpoint for push events
router.post('/github', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  // Verify webhook signature
  if (signature) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Only process push events (FR-2.1)
  if (event !== 'push') return res.status(200).json({ ignored: true });

  const payload = req.body;
  const repoFullName = payload.repository?.full_name;

  if (!repoFullName) return res.status(400).json({ error: 'Invalid payload' });

  // Store webhook event
  const db = getDb();
  const repo = db.prepare('SELECT id FROM repos WHERE full_name = ? AND is_watching = 1').get(repoFullName);

  db.prepare('INSERT INTO webhook_events (repo_id, event_type, payload) VALUES (?, ?, ?)')
    .run(repo?.id, event, JSON.stringify(payload));

  // FR-2.2: Debounced processing via orchestrator
  if (repo) {
    import('../agent/orchestrator.js').then(({ AgentOrchestrator }) => {
      const agent = new AgentOrchestrator();
      agent.handleWebhookPush(payload);
    });
  }

  res.status(200).json({ received: true });
});

export default router;
